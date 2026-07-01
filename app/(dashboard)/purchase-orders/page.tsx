import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { PageHeader } from "@/components/ui/PageHeader"
import { format } from "date-fns"
import { Pagination } from "@/components/ui/Pagination"
import { ExportButton } from "@/components/ExportButton"
import { POFilters } from "@/components/POFilters"
import { PurchaseOrdersTable } from "@/components/po/PurchaseOrdersTable"
import { ShoppingCart, Plus } from "lucide-react"

const ITEMS_PER_PAGE = 10

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams?: {
    q?: string;
    page?: string;
    status?: string;
    from?: string;
    to?: string;
  };
}) {
  const query = searchParams?.q || ""
  const currentPage = Number(searchParams?.page) || 1
  const statusFilter = searchParams?.status || ""
  const dateFrom = searchParams?.from || ""
  const dateTo = searchParams?.to || ""

  const where: import("@prisma/client").Prisma.PurchaseOrderWhereInput = {}

  if (query) {
    where.OR = [
      { poNumber: { contains: query, mode: "insensitive" } },
      { supplier: { name: { contains: query, mode: "insensitive" } } }
    ]
  }

  if (statusFilter && statusFilter !== "ALL") {
    where.status = statusFilter
  }

  if (dateFrom || dateTo) {
    where.dateOrdered = {}
    if (dateFrom) where.dateOrdered.gte = new Date(dateFrom)
    if (dateTo) where.dateOrdered.lte = new Date(dateTo + "T23:59:59")
  }

  const totalItems = await prisma.purchaseOrder.count({ where })
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

  const pos = await prisma.purchaseOrder.findMany({
    where,
    include: {
      supplier: true,
      lineItems: true,
    },
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
  })

  const serializedPOs = pos.map(po => {
    const subtotal = po.lineItems.reduce((acc, item) => acc + (Number(item.qtyOrdered) * Number(item.priceOrdered)), 0)
    const totalPO = subtotal + Number(po.taxAmount || 0)
    return {
      id: po.id,
      poNumber: po.poNumber,
      status: po.status,
      dateOrdered: po.dateOrdered,
      dateReceived: po.dateReceived,
      totalPO,
      supplier: { name: po.supplier.name },
    }
  })

  // Export data for server-rendered export button
  const exportData = pos.map(po => {
    const subtotal = po.lineItems.reduce((acc, item) => acc + (Number(item.qtyOrdered) * Number(item.priceOrdered)), 0)
    const totalPO = subtotal + Number(po.taxAmount || 0)
    return {
      "No. PO": po.poNumber,
      "Supplier": po.supplier.name,
      "Tgl PO": format(new Date(po.dateOrdered), "dd MMM yyyy"),
      "Tgl Terima": po.dateReceived ? format(new Date(po.dateReceived), "dd MMM yyyy") : "-",
      "Total": totalPO,
      "Status": po.status
    }
  })

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Daftar Purchase Order"
        description="Kelola dan pantau semua pesanan pembelian ke supplier."
        icon={<ShoppingCart className="w-8 h-8" />}
        color="blue"
        actions={
          <Link href="/purchase-orders/new">
            <Button className="bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-800 shadow-md font-semibold transition-all">
              <Plus className="w-4 h-4 mr-2" />
              Buat PO Baru
            </Button>
          </Link>
        }
      />

      <div className="bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <POFilters />
          <ExportButton data={exportData} filename={`purchase_orders_${format(new Date(), 'yyyy-MM-dd')}.csv`} />
        </div>

        {pos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-300">
            <span className="text-5xl mb-4 opacity-80">📋</span>
            <h3 className="text-lg font-bold text-slate-800">Tidak ada Purchase Order ditemukan</h3>
            {query || statusFilter ? (
              <p className="mt-2 text-sm text-slate-500">Coba ubah kata kunci atau filter status Anda.</p>
            ) : (
              <>
                <p className="mt-2 text-sm text-slate-500">Mulai dengan membuat PO pertama ke supplier.</p>
                <Link href="/purchase-orders/new" className="mt-6">
                  <Button className="bg-indigo-600">Buat PO Baru</Button>
                </Link>
              </>
            )}
          </div>
        ) : (
          <>
            <PurchaseOrdersTable
              pos={serializedPOs}
            />
            <div className="flex justify-between items-center p-4 border-t border-slate-200 bg-white">
              <div className="text-sm text-slate-500 font-medium">
                Menampilkan halaman {currentPage} dari {totalPages || 1}
              </div>
              <Pagination totalPages={totalPages} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
