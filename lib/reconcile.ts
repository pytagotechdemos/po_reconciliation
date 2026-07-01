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
  hasQtyDiscrepancy: boolean;
  hasPriceDiscrepancy: boolean;
  qtyDiscrepancyValue: number;
  priceDiscrepancyValue: number;
}

export function reconcileLineItems(
  lineItems: POLineItem[],
  receivedItems: { poLineItemId: string; qtyReceived: number; priceInvoice?: number; condition?: string }[]
): LineItemDiff[] {
  return lineItems.map((item) => {
    const received = receivedItems.find((r) => r.poLineItemId === item.id);

    const itemCondition = (item as POLineItem & { condition?: string }).condition || received?.condition;
    const qtyReceived = Number(item.qtyReceived || 0);
    const priceInvoice = received?.priceInvoice != null
      ? received.priceInvoice
      : Number(item.priceInvoice || item.priceOrdered);
    
    // Value diff = value of missing units + price difference cost on received units
    const qtyDiff = Math.round(((Number(item.qtyOrdered) - qtyReceived) + Number.EPSILON) * 1000) / 1000;
    const priceDiff = Math.round(((priceInvoice - Number(item.priceOrdered)) + Number.EPSILON) * 100) / 100;
    
    // Qty discrepancy exists if over-delivered (qtyDiff < 0) or explicitly marked as damaged/short
    const hasQtyDiscrepancy = qtyDiff < -0.0001 || ((itemCondition === 'Rusak' || itemCondition === 'Kurang') && Math.abs(qtyDiff) > 0.0001);
    const hasPriceDiscrepancy = Math.abs(priceDiff) > 0.0001;
    
    // Value diff for qty discrepancy
    let qtyDiscrepancyValue = 0;
    if (qtyDiff > 0) {
      qtyDiscrepancyValue = qtyDiff * Number(item.priceOrdered);
    } else if (qtyDiff < 0) {
      qtyDiscrepancyValue = Math.abs(qtyDiff) * priceInvoice;
    }
    qtyDiscrepancyValue = Math.round((qtyDiscrepancyValue + Number.EPSILON) * 100) / 100;

    // Value diff for price discrepancy
    const priceDiscrepancyValue = Math.round((priceDiff * qtyReceived + Number.EPSILON) * 100) / 100;

    // Total value diff
    const valueDiff = Math.round((qtyDiscrepancyValue + priceDiscrepancyValue + Number.EPSILON) * 100) / 100;
    
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
      hasQtyDiscrepancy,
      hasPriceDiscrepancy,
      qtyDiscrepancyValue,
      priceDiscrepancyValue,
      hasDiscrepancy: hasQtyDiscrepancy || hasPriceDiscrepancy,
    };
  });
}

export function hasAnyDiscrepancy(diffs: LineItemDiff[]): boolean {
  return diffs.some((d) => d.hasDiscrepancy);
}
