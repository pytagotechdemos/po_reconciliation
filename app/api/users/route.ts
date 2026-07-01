import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import bcrypt from "bcryptjs"

const createUserSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter").max(50),
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["owner", "procurement", "finance", "warehouse"]),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const data = await req.json()
    const parsed = createUserSchema.safeParse(data)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { username, name, password, role } = parsed.data

    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json({ error: "Username sudah digunakan" }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { username, name, password: hashed, role },
      select: { id: true, username: true, name: true, role: true, createdAt: true },
    })

    await prisma.auditLog.create({
      data: {
        userId: (session as { user?: { id?: string } }).user?.id || "unknown",
        action: "CREATE",
        entityType: "User",
        entityId: user.id,
        details: `Membuat user baru: ${name} (@${username}) dengan role ${role}`,
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
