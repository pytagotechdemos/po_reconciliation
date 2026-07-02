import { reconcileLineItems, hasAnyDiscrepancy } from '@/lib/reconcile';
import { POLineItem } from '@prisma/client';

describe('reconcileLineItems Business Logic', () => {
  it('should return NO discrepancy when quantity received equals ordered and price is same', () => {
    const poItems = [{ id: '1', itemName: 'Item A', qtyOrdered: '10', priceOrdered: '100', qtyReceived: '0', priceInvoice: '0' }] as unknown as POLineItem[];
    const receiptItems = [{ poLineItemId: '1', qtyReceived: 10, priceInvoice: 100 }];
    const result = reconcileLineItems(poItems, receiptItems);
    
    expect(result[0].hasQtyDiscrepancy).toBe(false);
    expect(result[0].hasPriceDiscrepancy).toBe(false);
    expect(result[0].hasDiscrepancy).toBe(false);
    expect(hasAnyDiscrepancy(result)).toBe(false);
  });

  it('should return discrepancy when quantity received is less than ordered', () => {
    const poItems = [{ id: '1', itemName: 'Item A', qtyOrdered: '10', priceOrdered: '100', qtyReceived: '0', priceInvoice: '0' }] as unknown as POLineItem[];
    const receiptItems = [{ poLineItemId: '1', qtyReceived: 8, priceInvoice: 100 }];
    const result = reconcileLineItems(poItems, receiptItems);
    
    expect(result[0].hasQtyDiscrepancy).toBe(true);
    expect(result[0].hasDiscrepancy).toBe(true);
    expect(hasAnyDiscrepancy(result)).toBe(true);
  });

  it('should return discrepancy when quantity received is more than ordered', () => {
    const poItems = [{ id: '1', itemName: 'Item A', qtyOrdered: '10', priceOrdered: '100', qtyReceived: '0', priceInvoice: '0' }] as unknown as POLineItem[];
    const receiptItems = [{ poLineItemId: '1', qtyReceived: 12, priceInvoice: 100 }];
    const result = reconcileLineItems(poItems, receiptItems);
    
    expect(result[0].hasQtyDiscrepancy).toBe(true);
    expect(result[0].hasDiscrepancy).toBe(true);
  });

  it('should return discrepancy when price differs', () => {
    const poItems = [{ id: '1', itemName: 'Item A', qtyOrdered: '10', priceOrdered: '100', qtyReceived: '0', priceInvoice: '0' }] as unknown as POLineItem[];
    const receiptItems = [{ poLineItemId: '1', qtyReceived: 10, priceInvoice: 120 }];
    const result = reconcileLineItems(poItems, receiptItems);
    
    expect(result[0].hasPriceDiscrepancy).toBe(true);
    expect(result[0].hasDiscrepancy).toBe(true);
  });
});
