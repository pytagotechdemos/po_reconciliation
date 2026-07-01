import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { truncateDetails } from "@/lib/utils"

const resolveSchema = z.object({
  poId: z.string().min(1),
  resolution: z.enum(["ACCEPTED", "CREDIT_NOTE", "HOLD"]),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session?.user?.role !== "finance") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    const data = await req.json()

    const parsed = resolveSchema.safeParse(data)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    const { poId, resolution } = parsed.data

    const userId = (session as { user?: { id?: string } }).user?.id
      || (session as { user?: { name?: string } }).user?.name
      || "unknown"

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { lineItems: true, alerts: true }
    })

    if (!po) return NextResponse.json({ error: "PO not found" }, { status: 404 })

    if (po.status !== "DISCREPANCY") {
      return NextResponse.json({ error: "PO is not in DISCREPANCY status" }, { status: 400 })
    }

    const result: { status: string } = { status: "" }

    await prisma.$transaction(async (tx) => {
      // Resolve all unresolved alerts for this PO
      await tx.alert.updateMany({
        where: { poId, resolution: null },
        data: { resolution, acknowledgedAt: new Date(), acknowledgedBy: userId }
      })

      // Re-count unresolved alerts after resolution — prevents orphaned alerts for READY_TO_PAY
      const remainingAlerts = await tx.alert.count({
        where: { poId, resolution: null }
      })

      // Re-read lineItems inside transaction to get authoritative qtyReceived
      const lineItems = await tx.pOLineItem.findMany({ where: { poId } })
      const isFullyReceived = lineItems.every(
        li => Number(li.qtyReceived || 0) >= Number(li.qtyOrdered)
      )

      // Only update status from DISCREPANCY — never downgrade READY_TO_PAY/RECEIVED back to PARTIAL
      const currentStatus = po.status
      result.status = currentStatus === "DISCREPANCY"
        ? (remainingAlerts === 0 ? (isFullyReceived ? "READY_TO_PAY" : "PARTIAL") : "DISCREPANCY")
        : currentStatus

      // Update PO status
      await tx.purchaseOrder.update({
        where: { id: poId },
        data: { status: result.status }
      })

      // Auto-update supplier performance score based on discrepancy history
      const totalPOs = await tx.purchaseOrder.count({
        where: { supplierId: po.supplierId }
      })
      const discrepancyPOs = await tx.purchaseOrder.count({
        where: { supplierId: po.supplierId, status: "DISCREPANCY" }
      })
      const discrepancyRate = totalPOs > 0 ? discrepancyPOs / totalPOs : 0
      // Score: 5 = no discrepancies, 1 = all discrepancies; clamp 1-5
      const performanceScore = Math.max(1, Math.min(5, Math.round(5 - discrepancyRate * 4)))
      await tx.supplier.update({
        where: { id: po.supplierId },
        data: { performanceScore }
      })

      // Audit log for discrepancy resolution
      await tx.auditLog.create({
        data: {
          userId,
          action: "RESOLVE",
          entityType: "PurchaseOrder",
          entityId: poId,
          details: truncateDetails(`Menyelesaikan discrepancy PO (${po.poNumber}) dengan tindakan: ${resolution}`)
        }
      })
    })

    return NextResponse.json({ success: true, newStatus: result.status })
  } catch (error: unknown) {
    console.error(error)
    return NextResponse.json({ error: "Failed to resolve discrepancy" }, { status: 500 })
  }
}
