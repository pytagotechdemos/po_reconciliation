import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { ResolveButton } from "@/components/po/ResolveButton"

export default async function PurchaseOrderDetailPage({ params }: { params: { id: string } }) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: params.id },
    include: {
      supplier: true,
      lineItems: true,
    }
  });

  if (!po) return notFound();

  let variant: "default" | "success" | "warning" | "destructive" | "secondary" = "default";
  if (po.status === "RECEIVED") variant = "success";
  if (po.status === "DISCREPANCY") variant = "destructive";
  if (po.status === "PARTIAL") variant = "warning";
  if (po.status === "PAID") variant = "secondary";

  const totalOrdered = po.lineItems.reduce((acc, item) => acc + (Number(item.qtyOrdered) * Number(item.priceOrdered)), 0);
  const totalReceived = po.lineItems.reduce((acc, item) => acc + (Number(item.qtyReceived || 0) * Number(item.priceInvoice || item.priceOrdered)), 0);
  const diff = totalReceived - totalOrdered;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/purchase-orders" className="text-sm font-medium text-blue-600 hover:underline">
          &larr; Kembali ke Daftar
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-900 font-mono">{po.poNumber}</h2>
          <Badge variant={variant}>{po.status}</Badge>
        </div>
        <div className="flex gap-2">
          {po.status === "SENT" && (
            <Link href={`/purchase-orders/${po.id}/receive`}>
              <Button>Input Penerimaan</Button>
            </Link>
          )}
          {po.status === "DISCREPANCY" && (
            <ResolveButton poId={po.id} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold uppercase text-slate-500 mb-4">Informasi Supplier</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Nama</dt>
              <dd className="font-medium text-slate-900">{po.supplier.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Termin</dt>
              <dd className="font-medium text-slate-900">{po.supplier.paymentTerms}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold uppercase text-slate-500 mb-4">Detail Waktu</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Tgl Dipesan</dt>
              <dd className="font-medium text-slate-900">{format(new Date(po.dateOrdered), "dd MMM yyyy")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Tgl Diterima</dt>
              <dd className="font-medium text-slate-900">{po.dateReceived ? format(new Date(po.dateReceived), "dd MMM yyyy") : "-"}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 p-2 mb-2">Item Pesanan</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Qty (PO)</TableHead>
              <TableHead className="text-right">Harga (PO)</TableHead>
              <TableHead className="text-right bg-slate-100">Qty (Diterima)</TableHead>
              <TableHead className="text-right bg-slate-100">Harga (Aktual)</TableHead>
              <TableHead className="text-right">Total Aktual</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {po.lineItems.map(item => (
              <TableRow key={item.id} className={(item.qtyReceived !== null && Number(item.qtyReceived) !== Number(item.qtyOrdered)) ? "bg-red-50" : ""}>
                <TableCell className="font-medium">{item.itemName}</TableCell>
                <TableCell className="text-right">{Number(item.qtyOrdered)} {item.unit}</TableCell>
                <TableCell className="text-right">Rp {Number(item.priceOrdered).toLocaleString("id-ID")}</TableCell>
                <TableCell className="text-right font-medium">
                  {item.qtyReceived !== null ? Number(item.qtyReceived) : "-"}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {item.priceInvoice ? `Rp ${Number(item.priceInvoice).toLocaleString("id-ID")}` : "-"}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  Rp {(Number(item.qtyReceived || 0) * Number(item.priceInvoice || item.priceOrdered)).toLocaleString("id-ID")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-6 flex justify-end">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Total PO:</span>
              <span className="font-semibold text-slate-900">Rp {totalOrdered.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Aktual:</span>
              <span className="font-semibold text-slate-900">Rp {totalReceived.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
              <span className="font-bold text-slate-900">Selisih:</span>
              <span className={cn("font-bold", diff !== 0 ? "text-red-600" : "text-green-600")}>
                Rp {diff.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
