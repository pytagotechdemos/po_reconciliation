import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { poId } = data

    await prisma.$transaction(async (tx) => {
      // 1. Resolve all alerts for this PO
      await tx.alert.updateMany({
        where: { poId, resolution: null },
        data: { resolution: "ACCEPTED", acknowledgedAt: new Date() }
      })

      // 2. Update PO status to PAID (or resolved)
      await tx.purchaseOrder.update({
        where: { id: poId },
        data: { status: "PAID" }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to resolve discrepancy" }, { status: 500 })
  }
}
