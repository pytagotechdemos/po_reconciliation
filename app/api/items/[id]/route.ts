import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { truncateDetails } from "@/lib/utils"

const itemUpdateSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  unit: z.string().min(1),
  category: z.string().optional(),
  buyPrice: z.coerce.number().min(0),
  sellPrice: z.coerce.number().min(0).optional(),
})

function guard(session: unknown): session is { user: { id: string; role: string } } {
  return (
    typeof session === "object" &&
    session !== null &&
    "user" in session &&
    typeof (session as { user: unknown }).user === "object" &&
    (session as { user: { id: unknown; role: unknown } }).user !== null &&
    typeof (session as { user: { id: unknown } }).user.id === "string" &&
    typeof (session as { user: { role: unknown } }).user.role === "string"
  )
}

function requireRole(session: unknown, roles: string[]) {
  if (!guard(session)) return false
  return roles.includes(session.user.role)
}

function getUserId(session: unknown): string {
  if (!guard(session)) return "unknown"
  return session.user.id
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const item = await prisma.item.findUnique({ where: { id: params.id } })
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 })
    return NextResponse.json(item)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!requireRole(session, ["procurement", "owner"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    const data = await req.json()
    const parsed = itemUpdateSchema.safeParse(data)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    const item = await prisma.item.update({
      where: { id: params.id },
      data: parsed.data
    })
    await prisma.auditLog.create({
      data: {
        userId: getUserId(session),
        action: "UPDATE",
        entityType: "Item",
        entityId: item.id,
        details: truncateDetails(`Memperbarui barang: ${item.name} (SKU: ${item.sku})`)
      }
    })
    return NextResponse.json(item)
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && (error as {code:string}).code === "P2002") {
      return NextResponse.json({ error: "SKU sudah digunakan, gunakan SKU lain" }, { status: 409 })
    }
    console.error(error)
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!requireRole(session, ["owner"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    const item = await prisma.item.update({ where: { id: params.id }, data: { isActive: false } })
    await prisma.auditLog.create({
      data: {
        userId: getUserId(session),
        action: "DELETE",
        entityType: "Item",
        entityId: item.id,
        details: truncateDetails(`Menghapus (soft delete) barang: ${item.name} (SKU: ${item.sku})`)
      }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 })
  }
}
