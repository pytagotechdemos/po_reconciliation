import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { truncateDetails } from "@/lib/utils"

const supplierUpdateSchema = z.object({
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
    const supplier = await prisma.supplier.findUnique({ where: { id: params.id } })
    if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    return NextResponse.json(supplier)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch supplier" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!requireRole(session, ["procurement", "owner"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    const data = await req.json()
    const parsed = supplierUpdateSchema.safeParse(data)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    const supplier = await prisma.supplier.update({
      where: { id: params.id },
      data: parsed.data
    })
    await prisma.auditLog.create({
      data: {
        userId: getUserId(session),
        action: "UPDATE",
        entityType: "Supplier",
        entityId: supplier.id,
        details: truncateDetails(`Memperbarui supplier: ${supplier.name}`)
      }
    })
    return NextResponse.json(supplier)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!requireRole(session, ["owner"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    // Transaction prevents race condition between count check and delete
    await prisma.$transaction(async (tx) => {
      const poCount = await tx.purchaseOrder.count({ where: { supplierId: params.id } })
      if (poCount > 0) {
        throw Object.assign(new Error("SUPPLIER_HAS_POS"), { status: 409 })
      }
      const supplier = await tx.supplier.delete({ where: { id: params.id } })
      await tx.auditLog.create({
        data: {
          userId: getUserId(session),
          action: "DELETE",
          entityType: "Supplier",
          entityId: supplier.id,
          details: truncateDetails(`Menghapus supplier: ${supplier.name}`)
        }
      })
    })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "status" in error && (error as { status: number }).status === 409) {
      return NextResponse.json({ error: "Supplier memiliki Purchase Order aktif, tidak bisa dihapus" }, { status: 409 })
    }
    console.error(error)
    return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 })
  }
}
