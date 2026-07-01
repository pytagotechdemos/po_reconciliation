import * as z from "zod";

export const poLineItemSchema = z.object({
  itemName: z.string().min(1, "Nama item wajib diisi"),
  sku: z.string().optional(),
  unit: z.string().min(1, "Satuan wajib diisi"),
  qty: z.coerce.number().min(1, "Minimal 1"),
  price: z.coerce.number().min(0, "Harga tidak valid"),
});

export const poSchema = z.object({
  supplierId: z.string().min(1, "Supplier wajib dipilih"),
  dateOrdered: z.string().min(1, "Tanggal wajib diisi"),
  dateExpected: z.string().optional(),
  taxRate: z.coerce.number().min(0, "Pajak tidak boleh negatif").optional().default(11),
  taxAmount: z.coerce.number().min(0, "Pajak tidak boleh negatif").optional().default(0),
  lineItems: z.array(poLineItemSchema).min(1, "Minimal 1 item"),
});

export type POFormValues = z.infer<typeof poSchema>;

export const receiptLineItemSchema = z.object({
  id: z.string(),
  qtyOrdered: z.number(),
  qtyReceived: z.coerce.number().min(0, "Qty tidak valid"),
  priceInvoice: z.coerce.number().min(0, "Harga tidak valid").optional(),
  condition: z.string().optional(),
  notes: z.string().optional(),
});

export const receiptSchema = z.object({
  dateReceived: z.string().min(1, "Tanggal wajib diisi"),
  receiverName: z.string().min(1, "Nama penerima wajib diisi"),
  deliveryNoteNumber: z.string().optional().nullable().default(null),
  notes: z.string().optional(),
  expiryDate: z.string().optional(),
  photoUrl: z.string().optional(),
  items: z.array(receiptLineItemSchema),
});

export type ReceiptFormValues = z.infer<typeof receiptSchema>;
