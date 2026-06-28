import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { reconcileLineItems, hasAnyDiscrepancy } from "@/lib/reconcile"

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { poId, receiptDate, receivedBy, deliveryNoteNumber, items } = data

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { lineItems: true }
    })

    if (!po) return NextResponse.json({ error: "PO not found" }, { status: 404 })

    // 1. Create GoodsReceipt
    await prisma.goodsReceipt.create({
      data: {
        poId,
        receiptDate: new Date(receiptDate),
        receivedBy,
        deliveryNoteNumber
      }
    })

    // 2. Reconcile
    const diffs = reconcileLineItems(po.lineItems, items)
    const discrepancy = hasAnyDiscrepancy(diffs)

    // 3. Determine new PO status
    let newStatus = discrepancy ? "DISCREPANCY" : "RECEIVED";
    if (!discrepancy && diffs.some(d => d.qtyReceived < d.qtyOrdered)) {
      newStatus = "PARTIAL";
    }

    // 4. Run Transaction to update line items, PO status, and create alerts
    await prisma.$transaction(async (tx) => {
      // Update PO Status
      await tx.purchaseOrder.update({
        where: { id: poId },
        data: { status: newStatus, dateReceived: new Date(receiptDate) }
      })

      // Update Line Items
      for (const item of items) {
        await tx.pOLineItem.update({
          where: { id: item.poLineItemId },
          data: {
            qtyReceived: item.qtyReceived,
            priceInvoice: item.priceInvoice,
            condition: item.condition
          }
        })
      }

      // Create Alerts if Discrepancy
      if (discrepancy) {
        for (const diff of diffs) {
          if (diff.qtyDiff !== 0) {
            await tx.alert.create({
              data: {
                poId,
                type: "QTY_DISCREPANCY",
                itemName: diff.itemName,
                valueDiff: diff.qtyDiff * diff.priceOrdered
              }
            })
          }
          if (diff.priceDiff !== 0) {
            await tx.alert.create({
              data: {
                poId,
                type: "PRICE_DISCREPANCY",
                itemName: diff.itemName,
                valueDiff: diff.priceDiff * diff.qtyReceived
              }
            })
          }
        }
      }
    })

    return NextResponse.json({ success: true, discrepancy, newStatus })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to process goods receipt" }, { status: 500 })
  }
}
