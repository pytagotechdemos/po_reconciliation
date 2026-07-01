import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import { Suspense } from "react"
import { Button } from "@/components/ui/Button"
import { PageHeader } from "@/components/ui/PageHeader"
import { Pagination } from "@/components/ui/Pagination"
import { ExportButton } from "@/components/ExportButton"
import { POFilters } from "@/components/POFilters"
import { PurchaseOrdersTable } from "@/components/po/PurchaseOrdersTable"
import { EmptyState } from "@/components/ui/EmptyState"
import { format } from "date-fns"
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
  const session = await getServerSession(authOptions)
  const canCreatePO = session?.user?.role === "procurement" || session?.user?.role === "owner"

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
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Daftar Purchase Order"
        description="Kelola dan pantau semua pesanan pembelian ke supplier."
        icon={<ShoppingCart className="w-7 h-7" />}
        color="violet"
        actions={
          canCreatePO ? (
            <Link href="/purchase-orders/new">
              <Button className="shadow-sm font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                Buat PO Baru
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <Suspense fallback={<div className="h-10 rounded-lg bg-slate-100 shimmer" />}><POFilters /></Suspense>
          <ExportButton data={exportData} filename={`purchase_orders_${format(new Date(), 'yyyy-MM-dd')}.csv`} />
        </div>

        {pos.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Tidak ada Purchase Order"
            description={query || statusFilter ? "Coba ubah filter atau kata kunci pencarian." : "Mulai dengan membuat PO pertama ke supplier."}
          />
        ) : (
          <>
            <PurchaseOrdersTable pos={serializedPOs} />
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 px-1 py-3 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                {totalItems} total — halaman {currentPage} dari {totalPages || 1}
              </span>
              <Suspense fallback={<div className="h-10" />}><Pagination totalPages={totalPages} /></Suspense>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
