import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { truncateDetails } from "@/lib/utils"

const supplierCreateSchema = z.object({
  name: z.string().min(1, "Nama supplier wajib diisi"),
  contact: z.string().optional(),
  paymentTerms: z.string().optional(),
  performanceScore: z.number().int().min(0).max(5).optional(),
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

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const suppliers = await prisma.supplier.findMany({ orderBy: { createdAt: "desc" } })
    return NextResponse.json(suppliers)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!requireRole(session, ["procurement", "owner"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    const data = await req.json()
    const parsed = supplierCreateSchema.safeParse(data)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.format() }, { status: 400 })
    }
    const supplier = await prisma.supplier.create({
      data: {
        name: parsed.data.name,
        contact: parsed.data.contact || null,
        paymentTerms: parsed.data.paymentTerms || null,
        performanceScore: parsed.data.performanceScore ?? 5,
      }
    })
    await prisma.auditLog.create({
      data: {
        userId: (session as { user?: { id?: string } }).user?.id
          || (session as { user?: { name?: string } }).user?.name
          || "unknown",
        action: "CREATE",
        entityType: "Supplier",
        entityId: supplier.id,
        details: truncateDetails(`Menambah supplier baru: ${supplier.name}`)
      }
    })
    return NextResponse.json(supplier)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 })
  }
}
