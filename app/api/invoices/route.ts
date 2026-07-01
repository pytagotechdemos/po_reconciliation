import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { truncateDetails } from "@/lib/utils"

const invoiceSchema = z.object({
  poId: z.string().min(1),
  invoiceNumber: z.string().min(1, "Invoice number required"),
  amount: z.coerce.number().nonnegative(),
  dateReceived: z.string().optional(),
})

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") // "paid", "unpaid", "overdue"
    const now = new Date()

    let where: Record<string, unknown> = {}

    if (status === "unpaid") {
      // Invoices for POs not yet PAID
      where = {
        po: { status: { not: "PAID" } }
      }
    } else if (status === "paid") {
      where = {
        po: { status: "PAID" }
      }
    } else if (status === "overdue") {
      // POs in READY_TO_PAY/RECEIVED for >14 days with NO existing invoice
      const overduePOs = await prisma.purchaseOrder.findMany({
        where: {
          status: { in: ["READY_TO_PAY", "RECEIVED"] },
          updatedAt: { lt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) },
          invoices: { none: {} }
        },
        include: { supplier: true }
      })
      // Return only POs without any invoice record
      return NextResponse.json(overduePOs.map(po => ({
        id: null,
        invoiceNumber: "BELUM ADA INVOICE",
        amount: null,
        dateReceived: null,
        createdAt: po.updatedAt,
        po: { id: po.id, poNumber: po.poNumber, status: po.status, supplier: { name: po.supplier.name }, isOverdue: true }
      })))
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        po: {
          include: { supplier: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session?.user?.role !== "finance") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const data = await req.json()
    const parsed = invoiceSchema.safeParse(data)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    const { poId, invoiceNumber, amount, dateReceived } = parsed.data

    const userId = (session as { user?: { id?: string } }).user?.id
      || (session as { user?: { name?: string } }).user?.name
      || "unknown"

    // Check if invoice number is already used globally
    const existing = await prisma.invoice.findFirst({
      where: { invoiceNumber }
    })
    if (existing) {
      return NextResponse.json({ error: "Invoice number already used" }, { status: 409 })
    }

    const invoice = await prisma.invoice.create({
      data: {
        poId,
        invoiceNumber,
        amount,
        dateReceived: dateReceived ? new Date(dateReceived) : new Date(),
      }
    })

    await prisma.auditLog.create({
      data: {
        userId,
        action: "CREATE",
        entityType: "Invoice",
        entityId: invoice.id,
        details: truncateDetails(`Membuat invoice ${invoiceNumber} untuk PO (amount: Rp ${amount.toLocaleString("id-ID")})`)
      }
    })

    return NextResponse.json(invoice)
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "Invoice number already used" }, { status: 409 })
    }
    console.error(error)
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 })
  }
}
