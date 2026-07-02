import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import bcrypt from "bcryptjs"

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["owner", "procurement", "finance", "warehouse"]).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, username: true, name: true, role: true, isActive: true, createdAt: true },
    })

    if (!user) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
    return NextResponse.json(user)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const data = await req.json()
    const parsed = updateUserSchema.safeParse(data)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name
    if (parsed.data.role !== undefined) updateData.role = parsed.data.role
    if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive
    if (parsed.data.password !== undefined) updateData.password = await bcrypt.hash(parsed.data.password, 12)

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: { id: true, username: true, name: true, role: true, isActive: true, createdAt: true },
    })

    await prisma.auditLog.create({
      data: {
        userId: (session as { user?: { id?: string } }).user?.id || "unknown",
        action: "UPDATE",
        entityType: "User",
        entityId: user.id,
        details: `Mengubah data user: ${user.name} (@${user.username})`,
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Prevent deleting yourself
    const currentUserId = (session as { user?: { id?: string } }).user?.id
    if (currentUserId === params.id) {
      return NextResponse.json({ error: "Tidak dapat menghapus akun sendiri" }, { status: 400 })
    }

    const user = await prisma.user.delete({ where: { id: params.id } })

    await prisma.auditLog.create({
      data: {
        userId: currentUserId || "unknown",
        action: "DELETE",
        entityType: "User",
        entityId: params.id,
        details: `Menghapus user: ${user.name} (@${user.username})`,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
