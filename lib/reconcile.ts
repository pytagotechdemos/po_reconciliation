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
    
    // Calculate accumulated quantities (if partial deliveries existed, we'd add them here. 
    // For MVP, we assume qtyReceived from input is the new total received)
    const qtyReceived = received ? received.qtyReceived : Number(item.qtyReceived || 0);
    const priceInvoice = received?.priceInvoice ?? Number(item.priceInvoice || item.priceOrdered);
    
    const qtyDiff = Number(item.qtyOrdered) - qtyReceived;
    const priceDiff = priceInvoice - Number(item.priceOrdered);
    
    // Value diff = missing qty value + price difference on received items
    const valueDiff = (qtyDiff * Number(item.priceOrdered)) + (priceDiff * qtyReceived);
    
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
      hasDiscrepancy: Math.abs(qtyDiff) > 0 || Math.abs(priceDiff) > 0,
    };
  });
}

export function hasAnyDiscrepancy(diffs: LineItemDiff[]): boolean {
  return diffs.some((d) => d.hasDiscrepancy);
}
