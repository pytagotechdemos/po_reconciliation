import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { truncateDetails } from "@/lib/utils"

const itemCreateSchema = z.object({
  sku: z.string().min(1, "SKU wajib diisi"),
  name: z.string().min(1, "Nama barang wajib diisi"),
  unit: z.string().min(1, "Satuan wajib diisi"),
  category: z.string().optional(),
  buyPrice: z.coerce.number().min(0, "Harga beli tidak valid"),
  sellPrice: z.coerce.number().min(0).optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const items = await prisma.item.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" } })
    return NextResponse.json(items)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !["procurement", "owner"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    const data = await req.json()
    const parsed = itemCreateSchema.safeParse(data)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.format() }, { status: 400 })
    }
    const item = await prisma.item.create({
      data: {
        sku: parsed.data.sku,
        name: parsed.data.name,
        unit: parsed.data.unit,
        category: parsed.data.category || null,
        buyPrice: parsed.data.buyPrice,
        sellPrice: parsed.data.sellPrice ?? null,
      }
    })
    await prisma.auditLog.create({
      data: {
        userId: (session as { user?: { id?: string } }).user?.id
          ?? "system",
        action: "CREATE",
        entityType: "Item",
        entityId: item.id,
        details: truncateDetails(`Menambah barang baru: ${item.name} (SKU: ${item.sku})`)
      }
    })
    return NextResponse.json(item)
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && (error as {code:string}).code === "P2002") {
      return NextResponse.json({ error: "SKU sudah digunakan, gunakan SKU lain" }, { status: 409 })
    }
    console.error(error)
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 })
  }
}
