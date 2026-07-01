import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { truncateDetails } from "@/lib/utils"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["procurement", "owner"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const userId = (session as { user?: { id?: string } }).user?.id
      || (session as { user?: { name?: string } }).user?.name
      || "unknown"

    const updated = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: params.id },
        include: { goodsReceipts: true }
      })

      if (!po) throw Object.assign(new Error("PO_NOT_FOUND"), { status: 404 })

      // Can cancel only if no goods receipts have been created
      if (po.goodsReceipts.length > 0) {
        throw Object.assign(
          new Error(`PO tidak bisa dibatalkan karena sudah ada ${po.goodsReceipts.length} penerimaan barang.`),
          { status: 400 }
        )
      }

      // Only DRAFT, WAITING_APPROVAL, SENT can be cancelled
      if (!["DRAFT", "WAITING_APPROVAL", "SENT"].includes(po.status)) {
        throw Object.assign(
          new Error(`PO tidak bisa dibatalkan. Status saat ini: ${po.status}.`),
          { status: 400 }
        )
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: "CANCEL",
          entityType: "PurchaseOrder",
          entityId: po.id,
          details: truncateDetails(`Membatalkan PO ${po.poNumber}`)
        }
      })

      return tx.purchaseOrder.update({
        where: { id: params.id },
        data: { status: "CANCELLED" }
      })
    })

    return NextResponse.json(updated)
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "status" in error) {
      const status = (error as { status: number }).status
      const message = (error as unknown as { message: string }).message
      if (status === 404) return NextResponse.json({ error: "PO tidak ditemukan" }, { status: 404 })
      return NextResponse.json({ error: message }, { status })
    }
    console.error(error)
    return NextResponse.json({ error: "Gagal membatalkan PO" }, { status: 500 })
  }
}
