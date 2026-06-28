import { prisma } from "@/lib/prisma"
import { POForm } from "@/components/po/POForm"

export default async function NewPurchaseOrderPage() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Buat Purchase Order Baru</h2>
      </div>
      
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <POForm suppliers={suppliers} />
      </div>
    </div>
  )
}
