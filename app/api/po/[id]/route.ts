import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { truncateDetails } from "@/lib/utils"

const editLineItemSchema = z.object({
  id: z.string().optional(), // existing line item ID
  itemName: z.string().min(1, "Nama item wajib diisi"),
  sku: z.string().optional(),
  unit: z.string().min(1, "Satuan wajib diisi"),
  qty: z.coerce.number().min(1, "Minimal 1"),
  price: z.coerce.number().min(0, "Harga tidak valid"),
})

const editPoSchema = z.object({
  supplierId: z.string().min(1, "Supplier wajib dipilih"),
  dateOrdered: z.string().min(1, "Tanggal wajib diisi"),
  dateExpected: z.string().optional(),
  notes: z.string().optional(),
  taxRate: z.coerce.number().min(0).optional(),
  taxAmount: z.coerce.number().min(0).optional(),
  lineItems: z.array(editLineItemSchema).min(1, "Minimal 1 item"),
})

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        lineItems: {
          select: {
            id: true,
            itemName: true,
            sku: true,
            unit: true,
            qtyOrdered: true,
            priceOrdered: true,
          }
        }
      }
    })

    if (!po) return NextResponse.json({ error: "PO tidak ditemukan" }, { status: 404 })

    return NextResponse.json({
      id: po.id,
      poNumber: po.poNumber,
      status: po.status,
      supplierId: po.supplierId,
      supplierName: po.supplier.name,
      dateOrdered: po.dateOrdered instanceof Date
        ? po.dateOrdered.toISOString().split("T")[0]
        : po.dateOrdered,
      dateExpected: po.dateExpected instanceof Date
        ? po.dateExpected.toISOString().split("T")[0]
        : po.dateExpected,
      notes: po.notes || "",
      taxRate: po.taxRate ? Number(po.taxRate) : 11,
      taxAmount: po.taxAmount ? Number(po.taxAmount) : 0,
      lineItems: po.lineItems.map(li => ({
        id: li.id,
        itemName: li.itemName,
        sku: li.sku || "",
        unit: li.unit,
        qty: Number(li.qtyOrdered),
        price: Number(li.priceOrdered),
      })),
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Gagal mengambil data PO" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== "procurement") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const data = await req.json()
    const parsed = editPoSchema.safeParse(data)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const userId = (session as { user?: { id?: string } }).user?.id ?? "system"

    const updated = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: params.id },
        include: { lineItems: true }
      })

      if (!po) throw Object.assign(new Error("PO_NOT_FOUND"), { status: 404 })

      const { supplierId, dateOrdered, dateExpected, notes, taxRate, taxAmount, lineItems } = parsed.data

      // Cannot change supplier after PO is sent/approved
      if (po.status === "WAITING_APPROVAL" && supplierId !== po.supplierId) {
        throw Object.assign(
          new Error("PO tidak bisa mengganti supplier setelah diajukan persetujuan. Buat PO baru jika ingin menggunakan supplier berbeda."),
          { status: 400 }
        )
      }

      // Only DRAFT or WAITING_APPROVAL can be edited
      if (po.status !== "DRAFT" && po.status !== "WAITING_APPROVAL") {
        throw Object.assign(
          new Error(`PO tidak bisa diedit. Status saat ini: ${po.status}. Hanya PO berstatus DRAFT atau WAITING_APPROVAL yang bisa diubah.`),
          { status: 400 }
        )
      }

      // Calculate tax amount
      const subtotal = lineItems.reduce((acc, item) => acc + (item.qty * item.price), 0)
      const calculatedTaxAmount = (subtotal * (taxRate || 0)) / 100

      // Delete existing line items and recreate
      await tx.pOLineItem.deleteMany({ where: { poId: params.id } })

      const updatedPO = await tx.purchaseOrder.update({
        where: { id: params.id },
        data: {
          supplierId,
          dateOrdered: new Date(dateOrdered),
          dateExpected: dateExpected ? new Date(dateExpected) : null,
          notes: notes || null,
          taxRate,
          taxAmount: taxAmount ?? calculatedTaxAmount,
          lineItems: {
            create: lineItems.map(item => ({
              itemName: item.itemName,
              sku: item.sku || null,
              unit: item.unit,
              qtyOrdered: item.qty,
              priceOrdered: item.price,
            }))
          }
        }
      })

      await tx.auditLog.create({
        data: {
          userId,
          action: "UPDATE",
          entityType: "PurchaseOrder",
          entityId: params.id,
          details: truncateDetails(`Mengubah PO ${updatedPO.poNumber}`)
        }
      })

      return updatedPO
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
    return NextResponse.json({ error: "Gagal mengubah PO" }, { status: 500 })
  }
}
