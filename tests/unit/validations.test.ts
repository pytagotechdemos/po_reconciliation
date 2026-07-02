import { poSchema, receiptSchema } from '@/lib/validations';

describe('Zod Validations', () => {
  describe('poSchema', () => {
    it('should pass with valid data', () => {
      const data = {
        supplierId: 'uuid',
        dateOrdered: '2023-10-10',
        dateExpected: '2023-10-15',
        taxRate: 11,
        taxAmount: 110,
        lineItems: [
          { sku: 'A', itemName: 'Item A', unit: 'pcs', qty: 10, price: 100 }
        ]
      };
      expect(poSchema.safeParse(data).success).toBe(true);
    });

    it('should fail with empty line items', () => {
      const data = {
        supplierId: 'uuid',
        dateOrdered: '2023-10-10',
        taxRate: 11,
        taxAmount: 110,
        lineItems: []
      };
      const result = poSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Minimal 1 item');
      }
    });

    it('should fail if qty is zero or negative', () => {
      const data = {
        supplierId: 'uuid',
        dateOrdered: '2023-10-10',
        taxRate: 11,
        taxAmount: 0,
        lineItems: [
          { sku: 'A', itemName: 'Item A', unit: 'pcs', qty: 0, price: 100 }
        ]
      };
      const result = poSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('receiptSchema', () => {
    it('should pass with valid receipt data', () => {
      const data = {
        dateReceived: '2023-10-10',
        receiverName: 'Warehouse Guy',
        deliveryNoteNumber: 'SJ-001',
        items: [
          { id: '1', qtyOrdered: 10, qtyReceived: 10, priceInvoice: 100, condition: 'OK' }
        ]
      };
      expect(receiptSchema.safeParse(data).success).toBe(true);
    });

    it('should fail if receiver name is empty', () => {
      const data = {
        dateReceived: '2023-10-10',
        receiverName: '',
        items: [
          { id: '1', qtyOrdered: 10, qtyReceived: 10 }
        ]
      };
      const result = receiptSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should fail if dateReceived is empty', () => {
      const data = {
        dateReceived: '',
        receiverName: 'Warehouse Guy',
        items: [
          { id: '1', qtyOrdered: 10, qtyReceived: 10 }
        ]
      };
      const result = receiptSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
