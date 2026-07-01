import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { randomBytes } from "crypto"
import { truncateDetails } from "@/lib/utils"

function generatePONumber(): string {
  const y = new Date().getFullYear()
  const m = String(new Date().getMonth() + 1).padStart(2, "0")
  const rand = randomBytes(4).toString("hex").toUpperCase()
  return `PO-${y}${m}-${rand}`
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["procurement", "owner"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const userId = (session as { user?: { id?: string } }).user?.id
      || (session as { user?: { name?: string } }).user?.name
      || "unknown"

    const originalPO = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: { lineItems: true }
    })

    if (!originalPO) {
      return NextResponse.json({ error: "PO tidak ditemukan" }, { status: 404 })
    }

    const newPONumber = generatePONumber()
    const newDateOrdered = new Date()

    const newPO = await prisma.purchaseOrder.create({
      data: {
        poNumber: newPONumber,
        supplierId: originalPO.supplierId,
        dateOrdered: newDateOrdered,
        dateExpected: null,
        dateReceived: null,
        status: "WAITING_APPROVAL",
        notes: originalPO.notes,
        taxRate: originalPO.taxRate,
        taxAmount: originalPO.taxAmount,
        createdBy: session.user?.name || "System",
        lineItems: {
          create: originalPO.lineItems.map(item => ({
            itemName: item.itemName,
            sku: item.sku,
            unit: item.unit,
            qtyOrdered: item.qtyOrdered,
            priceOrdered: item.priceOrdered,
            qtyReceived: null,
            priceInvoice: null,
            condition: null,
          }))
        }
      }
    })

    await prisma.auditLog.create({
      data: {
        userId,
        action: "CREATE",
        entityType: "PurchaseOrder",
        entityId: newPO.id,
        details: truncateDetails(`Menduplikat PO (${originalPO.poNumber}) menjadi PO baru (${newPO.poNumber})`)
      }
    })

    return NextResponse.json({ id: newPO.id, poNumber: newPO.poNumber })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Gagal menduplikat PO" }, { status: 500 })
  }
}
