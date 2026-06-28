import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { GoodsReceiptForm } from "@/components/receipt/GoodsReceiptForm"

export default async function GoodsReceiptPage({ params }: { params: { id: string } }) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: params.id },
    include: { lineItems: true }
  });

  if (!po || po.status !== "SENT") return notFound();

  const serializedItems = po.lineItems.map(item => ({
    id: item.id,
    poId: item.poId,
    itemName: item.itemName,
    unit: item.unit,
    qtyOrdered: Number(item.qtyOrdered),
    qtyReceived: item.qtyReceived ? Number(item.qtyReceived) : null,
    priceOrdered: Number(item.priceOrdered),
    priceInvoice: item.priceInvoice ? Number(item.priceInvoice) : null,
    condition: item.condition,
    createdAt: item.createdAt,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Input Penerimaan Barang</h2>
          <p className="text-slate-500 mt-1">PO: <span className="font-mono font-medium text-slate-700">{po.poNumber}</span></p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <GoodsReceiptForm poId={po.id} items={serializedItems} />
      </div>
    </div>
  )
}
