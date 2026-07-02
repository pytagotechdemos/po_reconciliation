import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { FilePlus } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { POForm } from "@/components/po/POForm"

export default async function NewPurchaseOrderPage() {
  const session = await getServerSession(authOptions)

  if (!session || session?.user?.role !== "procurement") {
    redirect("/dashboard")
  }

  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: 'asc' }
  });

  const itemsRaw = await prisma.item.findMany({
    orderBy: { name: 'asc' }
  });

  const items = itemsRaw.map(item => ({
    ...item,
    buyPrice: Number(item.buyPrice),
    sellPrice: Number(item.sellPrice),
  }));

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Buat Purchase Order Baru" 
        description="Isi form di bawah ini untuk membuat pesanan pembelian baru."
        icon={<FilePlus className="w-8 h-8" />}
        color="violet"
      />
      
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <POForm suppliers={suppliers} items={items} />
      </div>
    </div>
  )
}
