import { prisma } from "@/lib/prisma"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { format } from "date-fns"

export default async function ReportsPage() {
  const pos = await prisma.purchaseOrder.findMany({
    include: {
      supplier: true,
      lineItems: true,
    },
    orderBy: { createdAt: "desc" }
  })

  // Summary logic
  const reportData = pos.map((po) => {
    const totalOrdered = po.lineItems.reduce((acc, item) => acc + (Number(item.qtyOrdered) * Number(item.priceOrdered)), 0);
    const totalReceived = po.lineItems.reduce((acc, item) => acc + (Number(item.qtyReceived || 0) * Number(item.priceInvoice || item.priceOrdered)), 0);
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Laporan Rekonsiliasi</h2>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Tgl PO</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total PO</TableHead>
              <TableHead className="text-right">Total Aktual</TableHead>
              <TableHead className="text-right">Selisih</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportData.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-sm font-medium">{row.poNumber}</TableCell>
                <TableCell>{row.supplierName}</TableCell>
                <TableCell>{format(new Date(row.dateOrdered), "dd MMM yyyy")}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell className="text-right">Rp {row.totalOrdered.toLocaleString("id-ID")}</TableCell>
                <TableCell className="text-right">Rp {row.totalReceived.toLocaleString("id-ID")}</TableCell>
                <TableCell className={`text-right font-semibold ${row.diff !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Rp {row.diff.toLocaleString("id-ID")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
