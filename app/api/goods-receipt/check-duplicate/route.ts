import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session?.user?.role !== "warehouse") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const poId = searchParams.get("poId")
    const deliveryNoteNumber = searchParams.get("sj")

    if (!poId || !deliveryNoteNumber) {
      return NextResponse.json({ error: "Missing poId or sj" }, { status: 400 })
    }

    const existing = await prisma.goodsReceipt.findFirst({
      where: { poId, deliveryNoteNumber }
    })

    return NextResponse.json({ isDuplicate: !!existing })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to check duplicate" }, { status: 500 })
  }
}
