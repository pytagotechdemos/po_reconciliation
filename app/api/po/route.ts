import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { poSchema } from "@/lib/validations"
import { randomBytes } from "crypto"

function generatePONumber(): string {
  const y = new Date().getFullYear()
  const m = String(new Date().getMonth() + 1).padStart(2, "0")
  const rand = randomBytes(4).toString("hex").toUpperCase()
  return `PO-${y}${m}-${rand}`
}

function guard(s: unknown): s is { user: { id: string; role: string; name?: string } } {
  return (
    typeof s === "object" &&
    s !== null &&
    "user" in s &&
    typeof (s as { user?: unknown }).user === "object" &&
    (s as { user: { role?: unknown } }).user !== null &&
    typeof (s as { user: { role?: unknown } }).user.role === "string"
  )
}

async function createPOWithRetry(
  supplierId: string,
  dateOrdered: string,
  dateExpected: string | undefined,
  taxRate: number | undefined,
  taxAmount: number | undefined,
  createdBy: string,
  lineItems: { itemName: string; sku?: string; unit: string; qty: number; price: number }[]
) {
  const MAX_RETRIES = 3;
  for (let retries = 0; retries < MAX_RETRIES; retries++) {
    try {
      const poNumber = generatePONumber();
      return await prisma.purchaseOrder.create({
        data: {
          poNumber,
          supplierId,
          dateOrdered: new Date(dateOrdered),
          dateExpected: dateExpected ? new Date(dateExpected) : null,
          status: "WAITING_APPROVAL",
          taxRate,
          taxAmount,
          createdBy,
          lineItems: {
            create: lineItems.map(item => ({
              itemName: item.itemName,
              sku: item.sku,
              unit: item.unit,
              qtyOrdered: Number(item.qty),
              priceOrdered: Number(item.price),
            }))
          }
        }
      });
    } catch (error: unknown) {
      if (
        retries < MAX_RETRIES - 1 &&
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: string }).code === "P2002"
      ) {
        continue;
      }
      throw error;
    }
  }
  throw new Error("Failed to create PO after retries");
}

export async function POST(req: Request) {
  let session: Awaited<ReturnType<typeof getServerSession>>
  try {
    session = await getServerSession(authOptions)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  if (!guard(session) || session.user.role !== "procurement") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const data = await req.json()
  const parsed = poSchema.safeParse(data)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.format() }, { status: 400 })
  }
  const { supplierId, dateOrdered, dateExpected, taxRate, taxAmount, lineItems } = parsed.data

  const po = await createPOWithRetry(
    supplierId,
    dateOrdered,
    dateExpected,
    taxRate,
    taxAmount,
    session.user.name || "System",
    lineItems
  )

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE",
      entityType: "PurchaseOrder",
      entityId: po.id,
      details: `Membuat PO baru (${po.poNumber})`
    }
  })

  return NextResponse.json(po)
}
