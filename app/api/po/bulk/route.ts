import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { truncateDetails } from "@/lib/utils"

const bulkSchema = z.object({
  poIds: z.array(z.string()).min(1),
  action: z.enum(["approve", "reject"]),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session?.user?.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const data = await req.json()
    const parsed = bulkSchema.safeParse(data)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    const { poIds, action } = parsed.data

    const userId = (session as { user?: { id?: string } }).user?.id
      || (session as { user?: { name?: string } }).user?.name
      || "unknown"

    const newStatus = action === "approve" ? "SENT" : "REJECTED"

    const result = await prisma.$transaction(async (tx) => {
      const pos = await tx.purchaseOrder.findMany({
        where: { id: { in: poIds }, status: "WAITING_APPROVAL" }
      })

      if (pos.length === 0) {
        throw Object.assign(new Error("NO_VALID_POS"), { status: 400 })
      }

      const updated = await tx.purchaseOrder.updateMany({
        where: { id: { in: pos.map(p => p.id) }, status: "WAITING_APPROVAL" },
        data: { status: newStatus }
      })

      // Audit log per PO
      for (const po of pos) {
        await tx.auditLog.create({
          data: {
            userId,
            action: "UPDATE",
            entityType: "PurchaseOrder",
            entityId: po.id,
            details: truncateDetails(
              action === "approve"
                ? `Menyetujui PO (${po.poNumber}) secara bulk — status diubah ke SENT`
                : `Menolak PO (${po.poNumber}) secara bulk — status diubah ke REJECTED`
            )
          }
        })
      }

      return { updatedCount: updated.count }
    })

    return NextResponse.json({
      success: true,
      updatedCount: result.updatedCount,
      action,
      newStatus,
    })
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "status" in error) {
      const status = (error as { status: number }).status
      if (status === 400) {
        const msg = (error as unknown as { message: string }).message
        if (msg === "NO_VALID_POS") {
          return NextResponse.json({ error: "Tidak ada PO yang bisa diproses" }, { status: 400 })
        }
        return NextResponse.json({ error: msg }, { status })
      }
    }
    console.error(error)
    return NextResponse.json({ error: "Failed to process bulk action" }, { status: 500 })
  }
}
