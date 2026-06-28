import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { format } from "date-fns"

export default async function DiscrepanciesPage() {
  const alerts = await prisma.alert.findMany({
    where: { resolution: null },
    include: {
      po: {
        include: { supplier: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Daftar Discrepancy (Selisih)</h2>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-4xl">✅</span>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Semua Clear!</h3>
            <p className="mt-1 text-sm text-slate-500">Tidak ada discrepancy atau selisih yang perlu ditindaklanjuti saat ini.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tgl Alert</TableHead>
                <TableHead>PO</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Jenis Selisih</TableHead>
                <TableHead className="text-right">Nilai Selisih</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>{format(new Date(alert.createdAt), "dd MMM yyyy HH:mm")}</TableCell>
                  <TableCell className="font-mono text-sm font-medium">{alert.po.poNumber}</TableCell>
                  <TableCell>{alert.po.supplier.name}</TableCell>
                  <TableCell>{alert.itemName}</TableCell>
                  <TableCell>
                    <Badge variant={alert.type === "QTY_DISCREPANCY" ? "warning" : "destructive"}>
                      {alert.type === "QTY_DISCREPANCY" ? "Qty Kurang" : "Harga Beda"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-red-600">
                    Rp {Number(alert.valueDiff).toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/purchase-orders/${alert.po.id}`}>
                      <Button variant="outline" size="sm">Lihat Detail PO</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
