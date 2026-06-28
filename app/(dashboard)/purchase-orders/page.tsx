import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { format } from "date-fns"
import { Search } from "@/components/ui/Search"
import { Pagination } from "@/components/ui/Pagination"

const ITEMS_PER_PAGE = 10;

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams?: {
    q?: string;
    page?: string;
  };
}) {
  const query = searchParams?.q || "";
  const currentPage = Number(searchParams?.page) || 1;

  const where = query ? {
    OR: [
      { poNumber: { contains: query, mode: "insensitive" as const } },
      { supplier: { name: { contains: query, mode: "insensitive" as const } } }
    ]
  } : {};

  const totalItems = await prisma.purchaseOrder.count({ where });
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const pos = await prisma.purchaseOrder.findMany({
    where,
    include: {
      supplier: true,
      lineItems: true,
    },
    orderBy: {
      createdAt: "desc"
    },
    skip: (currentPage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Daftar Purchase Order</h2>
        <Link href="/purchase-orders/new">
          <Button>Buat PO Baru</Button>
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <Search />
        </div>
        
        {pos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-4xl">📋</span>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Tidak ada Purchase Order ditemukan</h3>
            {query ? (
              <p className="mt-1 text-sm text-slate-500">Coba ubah kata kunci pencarian Anda.</p>
            ) : (
              <>
                <p className="mt-1 text-sm text-slate-500">Mulai dengan membuat PO pertama ke supplier.</p>
                <Link href="/purchase-orders/new" className="mt-4">
                  <Button>Buat PO Baru</Button>
                </Link>
              </>
            )}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. PO</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Tgl PO</TableHead>
                  <TableHead>Tgl Terima</TableHead>
                  <TableHead className="text-right">Total PO</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pos.map((po) => {
                  const totalPO = po.lineItems.reduce((acc, item) => acc + (Number(item.qtyOrdered) * Number(item.priceOrdered)), 0);

                  let variant: "default" | "success" | "warning" | "destructive" | "secondary" = "default";
                  if (po.status === "RECEIVED") variant = "success";
                  if (po.status === "DISCREPANCY") variant = "destructive";
                  if (po.status === "PARTIAL") variant = "warning";
                  if (po.status === "PAID") variant = "secondary";

                  return (
                    <TableRow key={po.id} className={po.status === "DISCREPANCY" ? "bg-red-50 hover:bg-red-50/80" : ""}>
                      <TableCell className="font-mono text-sm font-medium">{po.poNumber}</TableCell>
                      <TableCell>{po.supplier.name}</TableCell>
                      <TableCell>{format(new Date(po.dateOrdered), "dd MMM yyyy")}</TableCell>
                      <TableCell>{po.dateReceived ? format(new Date(po.dateReceived), "dd MMM yyyy") : "-"}</TableCell>
                      <TableCell className="text-right font-medium">Rp {totalPO.toLocaleString("id-ID")}</TableCell>
                      <TableCell>
                        <Badge variant={variant}>{po.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/purchase-orders/${po.id}`}>
                          <Button variant="outline" size="sm">Detail</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            
            <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
              <Pagination totalPages={totalPages} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
