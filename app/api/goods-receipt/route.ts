import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { reconcileLineItems, hasAnyDiscrepancy } from "@/lib/reconcile"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { Prisma } from "@prisma/client"

const receiptSchema = z.object({
  poId: z.string().min(1),
  receiptDate: z.string(),
  receivedBy: z.string().min(1),
  deliveryNoteNumber: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  items: z.array(z.object({
    poLineItemId: z.string().min(1),
    qtyReceived: z.coerce.number().nonnegative(),
    priceInvoice: z.coerce.number().nonnegative().optional(),
    condition: z.string().optional(),
  })).min(1),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session?.user?.role !== "warehouse") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    const data = await req.json()

    const parsed = receiptSchema.safeParse(data)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.format() }, { status: 400 })
    }
    const { poId, receiptDate, receivedBy, deliveryNoteNumber, expiryDate, photoUrl, items } = parsed.data

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { lineItems: true }
    })

    if (!po) return NextResponse.json({ error: "PO not found" }, { status: 404 })

    // Fetch sellPrices for items with SKU so we can calculate profitLoss
    const skus = po.lineItems.map(li => li.sku).filter(Boolean) as string[]
    const itemsWithSellPrice = skus.length > 0
      ? await prisma.item.findMany({
          where: { sku: { in: skus } },
          select: { sku: true, sellPrice: true }
        })
      : []
    const sellPriceMap = new Map(itemsWithSellPrice.map(i => [i.sku, i.sellPrice ? Number(i.sellPrice) : null]))

    // H-4: Atomic transaction — includes PO lookup, status guard, all writes
    await prisma.$transaction(async (tx) => {
      // Re-read PO inside transaction to prevent race condition
      const poTx = await tx.purchaseOrder.findUnique({
        where: { id: poId },
        include: { lineItems: true }
      })
      if (!poTx || (poTx.status !== "SENT" && poTx.status !== "PARTIAL")) {
        throw Object.assign(new Error("PO_NOT_IN_VALID_STATUS"), { status: 400 })
      }

      // Over-receipt guard inside transaction — uses authoritative in-transaction read
      for (const item of items) {
        const dbItem = poTx.lineItems.find(li => li.id === item.poLineItemId)
        if (!dbItem) continue
        const existing = Number(dbItem.qtyReceived || 0)
        const incoming = item.qtyReceived
        const ordered = Number(dbItem.qtyOrdered)
        if (incoming > ordered - existing) {
          throw Object.assign(
            new Error(`Jumlah terima untuk "${dbItem.itemName}" (${incoming}) melebihi sisa pesanan (${ordered - existing}).`),
            { status: 400 }
          )
        }
      }

      // Duplicate GR guard — prevent double-submit using delivery note number
      if (deliveryNoteNumber) {
        const existingGR = await tx.goodsReceipt.findFirst({
          where: { poId, deliveryNoteNumber }
        })
        if (existingGR) {
          throw Object.assign(new Error("DUPLICATE_GR"), { status: 409 })
        }
      }

      // 1. Create GoodsReceipt record inside transaction
      await tx.goodsReceipt.create({
        data: {
          poId,
          receiptDate: new Date(receiptDate),
          receivedBy,
          deliveryNoteNumber,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          photoUrl
        }
      })

      // 2. Accumulate line item quantities
      for (const item of items) {
        const dbItem = poTx.lineItems.find(li => li.id === item.poLineItemId)
        if (!dbItem) continue
        const existingQty = Number(dbItem.qtyReceived || 0)
        const newQty = item.qtyReceived
        const accumulatedQty = existingQty + newQty

        await tx.pOLineItem.update({
          where: { id: item.poLineItemId },
          data: {
            qtyReceived: accumulatedQty,
            priceInvoice: item.priceInvoice ?? (Number(dbItem.priceInvoice || 0) || undefined),
            condition: item.condition
          }
        })
      }

      // 3. Determine new status
      const updatedLineItems = await tx.pOLineItem.findMany({
        where: { poId }
      })
      const diffs = reconcileLineItems(updatedLineItems, items)
      const discrepancy = hasAnyDiscrepancy(diffs)
      const isFullyReceived = updatedLineItems.every(
        li => Number(li.qtyReceived || 0) >= Number(li.qtyOrdered)
      )
      const finalStatus = discrepancy ? "DISCREPANCY" : isFullyReceived ? "RECEIVED" : "PARTIAL"

      await tx.purchaseOrder.update({
        where: { id: poId },
        data: { status: finalStatus, dateReceived: new Date(receiptDate) }
      })

      // 4. Create SHORT_EXPIRY alert — one alert per GR, covering ALL PO items with short expiry
      if (expiryDate) {
        const expiryThreshold = new Date(receiptDate)
        expiryThreshold.setDate(expiryThreshold.getDate() + 30)
        if (new Date(expiryDate) < expiryThreshold) {
          // Alert itemName lists all items in the PO (not just this GR's items) so user knows full scope
          const allItemNames = poTx.lineItems.map(li => li.itemName).join(", ")
          await tx.alert.create({
            data: {
              poId,
              type: "SHORT_EXPIRY",
              itemName: allItemNames || "Barang",
              valueDiff: new Prisma.Decimal(0),
              profitLoss: new Prisma.Decimal(0),
            }
          })
        }
      }

      // 5. Create QTY/PRICE discrepancy alerts
      if (discrepancy) {
        for (const diff of diffs) {
          const dbItem = poTx.lineItems.find(li => li.id === diff.itemId)
          const sku = dbItem?.sku || ""
          const sellPrice = sellPriceMap.get(sku) ?? null
          const profitLoss = (sellPrice !== null && diff.qtyDiff > 0)
            ? Math.round(diff.qtyDiff * (sellPrice - diff.priceOrdered) * 100) / 100
            : null

          if (Math.abs(diff.qtyDiff) > 0.0001) {
            await tx.alert.create({
              data: {
                poId,
                type: "QTY_DISCREPANCY",
                itemName: diff.itemName,
                valueDiff: Math.round(diff.qtyDiff * diff.priceOrdered * 100) / 100,
                profitLoss: profitLoss !== null ? new Prisma.Decimal(profitLoss) : null,
              }
            })
          }
          if (Math.abs(diff.priceDiff) > 0.0001) {
            await tx.alert.create({
              data: {
                poId,
                type: "PRICE_DISCREPANCY",
                itemName: diff.itemName,
                valueDiff: Math.round(diff.priceDiff * diff.qtyReceived * 100) / 100,
                profitLoss: profitLoss !== null ? new Prisma.Decimal(profitLoss) : null,
              }
            })
          }
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "status" in error) {
      const status = (error as { status: number }).status
      const message = (error as unknown as { message: string }).message
      if (message.includes("PO_NOT_IN_VALID_STATUS")) {
        return NextResponse.json({ error: "PO tidak dalam status SENT atau PARTIAL" }, { status })
      }
      if (message.includes("DUPLICATE_GR")) {
        return NextResponse.json({ error: "Surat jalan ini sudah pernah diinput untuk PO ini" }, { status })
      }
      return NextResponse.json({ error: message }, { status })
    }
    console.error(error)
    return NextResponse.json({ error: "Failed to process goods receipt" }, { status: 500 })
  }
}
