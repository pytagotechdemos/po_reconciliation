import { POLineItem } from "@prisma/client";

export interface LineItemDiff {
  itemId: string;
  itemName: string;
  qtyOrdered: number;
  qtyReceived: number;
  qtyDiff: number;
  priceOrdered: number;
  priceInvoice: number;
  priceDiff: number;
  valueDiff: number;
  hasDiscrepancy: boolean;
}

export function reconcileLineItems(
  lineItems: POLineItem[],
  receivedItems: { poLineItemId: string; qtyReceived: number; priceInvoice?: number; condition?: string }[]
): LineItemDiff[] {
  return lineItems.map((item) => {
    const received = receivedItems.find((r) => r.poLineItemId === item.id);

    // Use accumulated qtyReceived from the DB state, not per-delivery input.
    // received.qtyReceived is the per-delivery amount for this call only;
    // item.qtyReceived (from lineItems) already reflects the new accumulated total
    // after the current goods-receipt write completes.
    const qtyReceived = Number(item.qtyReceived || 0);
    const priceInvoice = received?.priceInvoice != null
      ? received.priceInvoice
      : Number(item.priceInvoice || item.priceOrdered);
    
    // Value diff = value of missing units + price difference cost on received units
    // Only count SHORT-delivery (not over-delivery) for qty loss
    const qtyDiff = Math.round((Number(item.qtyOrdered) - qtyReceived) * 1000) / 1000;
    const priceDiff = Math.round((priceInvoice - Number(item.priceOrdered)) * 100) / 100;
    const valueDiff = Math.round(((Math.max(0, qtyDiff) * Number(item.priceOrdered)) + (priceDiff * qtyReceived)) * 100) / 100;
    
    return {
      itemId: item.id,
      itemName: item.itemName,
      qtyOrdered: Number(item.qtyOrdered),
      qtyReceived,
      qtyDiff,
      priceOrdered: Number(item.priceOrdered),
      priceInvoice,
      priceDiff,
      valueDiff,
      hasDiscrepancy: Math.abs(qtyDiff) > 0.0001 || Math.abs(priceDiff) > 0.0001,
    };
  });
}

export function hasAnyDiscrepancy(diffs: LineItemDiff[]): boolean {
  return diffs.some((d) => d.hasDiscrepancy);
}
