import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { truncateDetails } from "@/lib/utils"

const paidSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number required"),
})

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session?.user?.role !== "finance") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const data = await req.json()
    const parsed = paidSchema.safeParse(data)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const userId = (session as { user?: { id?: string } }).user?.id
      || (session as { user?: { name?: string } }).user?.name
      || "unknown"

    await prisma.$transaction(async (tx) => {
      // Read inside transaction — prevents race condition
      const po = await tx.purchaseOrder.findUnique({
        where: { id: params.id },
        include: { lineItems: true }
      })
      if (!po) throw Object.assign(new Error("PO_NOT_FOUND"), { status: 404 })

      if (po.status !== "READY_TO_PAY") {
        throw Object.assign(new Error("PO_NOT_READY_TO_PAY"), { status: 400 })
      }

      // Calculate actual invoice total inside transaction
      const subtotal = po.lineItems.reduce((acc, li) => {
        const qty = Number(li.qtyReceived || 0)
        const price = Number(li.priceInvoice || li.priceOrdered || 0)
        return acc + qty * price
      }, 0)
      const amount = subtotal + Number(po.taxAmount || 0)

      await tx.purchaseOrder.update({
        where: { id: params.id },
        data: { status: "PAID" }
      })

      await tx.invoice.create({
        data: {
          poId: params.id,
          invoiceNumber: parsed.data.invoiceNumber,
          amount,
        }
      })

      await tx.auditLog.create({
        data: {
          userId,
          action: "UPDATE",
          entityType: "PurchaseOrder",
          entityId: po.id,
          details: truncateDetails(`Membayar PO ${po.poNumber} (Invoice: ${parsed.data.invoiceNumber})`)
        }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "status" in error) {
      const status = (error as { status: number }).status
      if (status === 404) return NextResponse.json({ error: "PO not found" }, { status: 404 })
      if (status === 400) return NextResponse.json({ error: "PO must be READY_TO_PAY to be marked as paid" }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: "Failed to mark PO as paid" }, { status: 500 })
  }
}
