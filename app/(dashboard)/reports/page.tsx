import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/ui/PageHeader"
import { FileSpreadsheet } from "lucide-react"
import { ReportsTable } from "@/components/reports/ReportsTable"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function ReportsPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    redirect("/dashboard")
  }
  const pos = await prisma.purchaseOrder.findMany({
    include: {
      supplier: true,
      lineItems: true,
    },
    orderBy: { createdAt: "desc" }
  })

  const reportData = pos.map((po) => {
    const subtotalOrdered = po.lineItems.reduce((acc, item) => acc + (Number(item.qtyOrdered) * Number(item.priceOrdered)), 0);
    const subtotalReceived = po.lineItems.reduce((acc, item) => acc + (Number(item.qtyReceived || 0) * Number(item.priceInvoice || item.priceOrdered)), 0);
    const taxAmount = Number(po.taxAmount || 0);
    const totalOrdered = subtotalOrdered + taxAmount;
    const totalReceived = subtotalReceived + taxAmount;
    const diff = totalReceived - totalOrdered;

    return {
      id: po.id,
      poNumber: po.poNumber,
      supplierName: po.supplier.name,
      dateOrdered: po.dateOrdered,
      status: po.status,
      totalOrdered,
      totalReceived,
      diff
    }
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Rekonsiliasi"
        description="Ringkasan dan analitik dari seluruh aktivitas rekonsiliasi PO."
        icon={<FileSpreadsheet className="w-8 h-8" />}
        color="emerald"
      />

      <ReportsTable reportData={reportData} />
    </div>
  )
}
