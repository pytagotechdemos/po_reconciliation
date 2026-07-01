import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { truncateDetails } from "@/lib/utils"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session?.user?.role !== "finance") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const userId = (session as { user?: { id?: string } }).user?.id
      ?? "system"
      

    const updated = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({ where: { id: params.id } })
      if (!po) throw Object.assign(new Error("PO_NOT_FOUND"), { status: 404 })
      if (po.status !== "RECEIVED" && po.status !== "DISCREPANCY") {
        throw Object.assign(
          new Error("PO must be RECEIVED or DISCREPANCY to be marked ready to pay"),
          { status: 400 }
        )
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: "UPDATE",
          entityType: "PurchaseOrder",
          entityId: po.id,
          details: truncateDetails(`Menandai PO ${po.poNumber} siap bayar (READY_TO_PAY)`)
        }
      })

      return tx.purchaseOrder.update({
        where: { id: params.id },
        data: { status: "READY_TO_PAY" }
      })
    })

    return NextResponse.json(updated)
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "status" in error) {
      const status = (error as { status: number }).status
      const message = (error as unknown as { message: string }).message
      if (status === 404) return NextResponse.json({ error: "PO not found" }, { status: 404 })
      return NextResponse.json({ error: message }, { status })
    }
    console.error(error)
    return NextResponse.json({ error: "Failed to update PO status" }, { status: 500 })
  }
}
