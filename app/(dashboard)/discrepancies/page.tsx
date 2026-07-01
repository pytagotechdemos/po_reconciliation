import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { format } from "date-fns"
import { ExportButton } from "@/components/ExportButton"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DiscrepanciesPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    redirect("/dashboard")
  }
  const alerts = await prisma.alert.findMany({
    where: { resolution: null },
    include: {
      po: {
        include: { supplier: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const exportData = alerts.map(alert => ({
    "Tgl Alert": format(new Date(alert.createdAt), "dd MMM yyyy HH:mm"),
    "No. PO": alert.po.poNumber,
    "Supplier": alert.po.supplier.name,
    "Item": alert.itemName,
    "Jenis Selisih": alert.type === "QTY_DISCREPANCY" ? "Qty Kurang" : alert.type === "PRICE_DISCREPANCY" ? "Harga Beda" : "Kadaluarsa Pendek",
    "Nilai Selisih": Number(alert.valueDiff)
  }));

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Daftar Discrepancy (Selisih)" 
        description="Kelola dan selesaikan masalah penerimaan barang yang tidak sesuai."
        icon={<ShieldAlert className="w-8 h-8" />}
        color="rose"
      />

      <div className="bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-4">
        
        <div className="flex justify-end">
          <ExportButton data={exportData} filename={`discrepancies_${format(new Date(), 'yyyy-MM-dd')}.csv`} />
        </div>

        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-300">
            <span className="text-5xl mb-4 opacity-80">✅</span>
            <h3 className="text-lg font-bold text-emerald-600">Semua Clear!</h3>
            <p className="mt-2 text-sm text-slate-500 font-medium">Tidak ada discrepancy atau selisih yang perlu ditindaklanjuti saat ini.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 overflow-x-auto mt-4">
            <Table className="min-w-[800px]">
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Tgl Alert</TableHead>
                  <TableHead className="font-semibold text-slate-700">PO</TableHead>
                  <TableHead className="font-semibold text-slate-700">Supplier</TableHead>
                  <TableHead className="font-semibold text-slate-700">Item</TableHead>
                  <TableHead className="font-semibold text-slate-700">Jenis Selisih</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Nilai Selisih</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id} className="transition-colors hover:bg-slate-50">
                    <TableCell className="text-slate-600">{format(new Date(alert.createdAt), "dd MMM yyyy HH:mm")}</TableCell>
                    <TableCell className="font-mono text-sm font-medium text-slate-700">{alert.po.poNumber}</TableCell>
                    <TableCell className="font-medium text-slate-800">{alert.po.supplier.name}</TableCell>
                    <TableCell className="text-slate-800">{alert.itemName}</TableCell>
                    <TableCell>
                      <Badge variant={alert.type === "SHORT_EXPIRY" ? "warning" : alert.type === "QTY_DISCREPANCY" ? "warning" : "destructive"} className="shadow-sm">
                        {alert.type === "QTY_DISCREPANCY" ? "Qty Kurang" : alert.type === "PRICE_DISCREPANCY" ? "Harga Beda" : "Kadaluarsa Pendek"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-rose-600">
                      Rp {Number(alert.valueDiff).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/purchase-orders/${alert.po.id}`}>
                        <Button variant="outline" size="sm" className="hover:bg-rose-50 hover:text-rose-600 border-slate-200">Lihat Detail PO</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
