import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/Button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { ResolveButton } from "@/components/po/ResolveButton"
import { ApproveButton } from "@/components/po/ApproveButton"
import { ReadyToPayButton } from "@/components/po/ReadyToPayButton"
import { MarkPaidButton } from "@/components/po/MarkPaidButton"
import { PackagePlus, FileText } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrintButton } from "@/components/PrintButton"

export default async function PurchaseOrderDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: params.id },
    include: {
      supplier: true,
      lineItems: true,
      goodsReceipts: {
        include: { po: { include: { lineItems: true } } },
        orderBy: { createdAt: "asc" }
      },
    }
  });

  if (!po) return notFound();

  const isOwner = session?.user?.role === "owner";
  const isWarehouse = session?.user?.role === "warehouse";
  const isFinance = session?.user?.role === "finance";

  const totalOrdered = po.lineItems.reduce((acc, item) => acc + (Number(item.qtyOrdered) * Number(item.priceOrdered)), 0);
  const totalReceived = po.lineItems.reduce((acc, item) => acc + (Number(item.qtyReceived || 0) * Number(item.priceInvoice || item.priceOrdered)), 0);
  const diff = totalReceived - totalOrdered;
  const taxAmount = Number(po.taxAmount || 0);
  const grandTotal = totalReceived + taxAmount;
  const grandTotalOrdered = totalOrdered + taxAmount;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/purchase-orders" className="text-sm font-medium text-blue-600 hover:underline">
          &larr; Kembali ke Daftar
        </Link>
      </div>

      <PageHeader 
        title={po.poNumber} 
        description={`Dipesan dari ${po.supplier.name}`}
        icon={<FileText className="w-8 h-8" />}
        color="indigo"
        actions={
          <>
            <PrintButton />
            
            {po.status === "WAITING_APPROVAL" && isOwner && (
              <ApproveButton poId={po.id} />
            )}
            
            {["SENT", "PARTIAL"].includes(po.status) && isWarehouse && (
              <Link href={`/purchase-orders/${po.id}/receive`}>
                <Button className="bg-white text-indigo-700 hover:bg-indigo-50 shadow-md font-semibold transition-all">
                  <PackagePlus className="w-4 h-4 mr-2" /> Input Penerimaan
                </Button>
              </Link>
            )}

            {po.status === "DISCREPANCY" && isFinance && (
              <ResolveButton poId={po.id} />
            )}

            {(po.status === "RECEIVED" || po.status === "DISCREPANCY") && isFinance && (
              <ReadyToPayButton poId={po.id} />
            )}

            {po.status === "READY_TO_PAY" && isFinance && (
              <MarkPaidButton poId={po.id} />
            )}
          </>
        }
      />

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

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
        <h3 className="text-lg font-semibold text-slate-900 p-2 mb-2">Item Pesanan</h3>
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Qty (PO)</TableHead>
              <TableHead className="text-right">Harga (PO)</TableHead>
              <TableHead className="text-right bg-slate-100">Qty (Diterima)</TableHead>
              <TableHead className="text-right bg-slate-100">Harga Invoice (per unit)</TableHead>
              <TableHead className="text-right">Total Aktual</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {po.lineItems.map(item => {
              const hasQtyDiff = item.qtyReceived !== null && Number(item.qtyReceived) !== Number(item.qtyOrdered);
              const hasPriceDiff = item.priceInvoice !== null && Number(item.priceInvoice) !== Number(item.priceOrdered);
              const rowClass = hasQtyDiff ? "bg-red-50" : hasPriceDiff ? "bg-amber-50" : "";
              return (
                <TableRow key={item.id} className={rowClass}>
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
              )
            })}
          </TableBody>
        </Table>

        <div className="mt-6 flex justify-end">
          <div className="w-80 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal (PO):</span>
              <span className="font-semibold text-slate-900">Rp {totalOrdered.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal (Aktual):</span>
              <span className="font-semibold text-slate-900">Rp {totalReceived.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">PPN ({po.taxRate ? `${po.taxRate}%` : "0%"}):</span>
              <span className="font-semibold text-slate-900">Rp {taxAmount.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
              <span className="font-bold text-slate-900">Grand Total (PO):</span>
              <span className="font-bold text-slate-900">Rp {grandTotalOrdered.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
              <span className="font-bold text-slate-900">Grand Total (Aktual):</span>
              <span className="font-bold text-slate-900">Rp {grandTotal.toLocaleString("id-ID")}</span>
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

      {po.goodsReceipts.length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 p-2 mb-2">Riwayat Penerimaan</h3>
          {po.goodsReceipts.length > 1 && (
            <p className="text-xs text-slate-500 mb-3 px-2">
              Catatan: Jumlah yang ditampilkan adalah kuantitas kumulatif (total yang diterima hingga saat ini).
            </p>
          )}
          <div className="space-y-3">
            {po.goodsReceipts.map((gr, i) => {
              return (
                <div key={gr.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div className="mb-3">
                    <p className="font-semibold text-slate-800">
                      Penerimaan #{i + 1} — {format(new Date(gr.receiptDate), "dd MMM yyyy")}
                    </p>
                    <p className="text-xs text-slate-500">
                      Penerima: {gr.receivedBy}
                      {gr.deliveryNoteNumber && ` · No. SJ: ${gr.deliveryNoteNumber}`}
                      {gr.expiryDate && ` · Kadaluarsa: ${format(new Date(gr.expiryDate), "dd MMM yyyy")}`}
                    </p>
                  </div>
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Qty PO</TableHead>
                        <TableHead className="text-right">Qty Diterima</TableHead>
                        <TableHead className="text-right">Harga Invoice (per unit)</TableHead>
                        <TableHead className="text-center">Kondisi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {po.lineItems.map(item => {
                        const hasDiff = Number(item.qtyReceived || 0) !== Number(item.qtyOrdered);
                        return (
                          <TableRow key={item.id} className={hasDiff ? "bg-amber-50" : ""}>
                            <TableCell className="font-medium">{item.itemName}</TableCell>
                            <TableCell className="text-right">{Number(item.qtyOrdered)}</TableCell>
                            <TableCell className="text-right">{Number(item.qtyReceived || 0)}</TableCell>
                            <TableCell className="text-right">
                              {item.priceInvoice ? `Rp ${Number(item.priceInvoice).toLocaleString("id-ID")}` : "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.condition ? (
                                <span className={cn(
                                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                  item.condition === "OK" ? "bg-green-100 text-green-700" :
                                  item.condition === "DAMAGED" ? "bg-red-100 text-red-700" :
                                  "bg-amber-100 text-amber-700"
                                )}>
                                  {item.condition === "OK" ? "OK" : item.condition === "DAMAGED" ? "Rusak" : "Kurang"}
                                </span>
                              ) : "-"}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
