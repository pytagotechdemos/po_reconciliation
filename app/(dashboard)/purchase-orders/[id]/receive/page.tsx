import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/ui/PageHeader"
import { PackagePlus } from "lucide-react"
import { GoodsReceiptForm } from "@/components/receipt/GoodsReceiptForm"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function GoodsReceiptPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session?.user?.role !== "warehouse") {
    redirect("/dashboard")
  }

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: params.id },
    include: { lineItems: true }
  });

  if (!po || !["SENT", "PARTIAL"].includes(po.status)) return notFound();

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader 
          title="Input Penerimaan Barang" 
          description={`Penerimaan untuk PO: ${po.poNumber}`}
          icon={<PackagePlus className="w-8 h-8" />}
          color="emerald"
        />
      </div>
      
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <GoodsReceiptForm poId={po.id} items={serializedItems} />
      </div>
    </div>
  )
}
