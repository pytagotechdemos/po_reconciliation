import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TrendingUp, TrendingDown, AlertTriangle, BarChart3 } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent } from "@/components/ui/Card"
import { cn } from "@/lib/utils"

export default async function SupplierScorecardPage() {
  const session = await getServerSession(authOptions)
  if (!session || !["owner", "procurement", "finance"].includes(session.user?.role as string)) {
    redirect("/dashboard")
  }

  const suppliers = await prisma.supplier.findMany({
    include: {
      orders: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          alerts: {
            select: {
              type: true,
              resolution: true,
              valueDiff: true,
              createdAt: true,
            }
          }
        }
      }
    },
    orderBy: { performanceScore: "asc" }
  })

  const suppliersWithStats = await Promise.all(
    suppliers.map(async (supplier) => {
      const totalPOs = supplier.orders.length
      const discrepancyPOs = supplier.orders.filter(o => o.status === "DISCREPANCY").length
      const resolvedAlerts = supplier.orders.flatMap(o => o.alerts).filter(a => a.resolution !== null)
      const unresolvedAlerts = supplier.orders.flatMap(o => o.alerts).filter(a => a.resolution === null)
      const totalValueDiff = supplier.orders
        .flatMap(o => o.alerts)
        .reduce((acc, a) => acc + Math.abs(Number(a.valueDiff)), 0)

      // Calculate trend: compare last 3 months vs previous 3 months
      const now = new Date()
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)

      const recentOrders = supplier.orders.filter(o => o.createdAt > threeMonthsAgo)
      const olderOrders = supplier.orders.filter(o => o.createdAt <= threeMonthsAgo && o.createdAt >= sixMonthsAgo)

      const recentDiscrepancyRate = recentOrders.length > 0
        ? recentOrders.filter(o => o.status === "DISCREPANCY").length / recentOrders.length
        : 0
      const olderDiscrepancyRate = olderOrders.length > 0
        ? olderOrders.filter(o => o.status === "DISCREPANCY").length / olderOrders.length
        : 0

      const trend = recentDiscrepancyRate < olderDiscrepancyRate ? "up" :
                    recentDiscrepancyRate > olderDiscrepancyRate ? "down" : "stable"

      return {
        id: supplier.id,
        name: supplier.name,
        contact: supplier.contact,
        paymentTerms: supplier.paymentTerms,
        performanceScore: supplier.performanceScore || 5,
        totalPOs,
        discrepancyRate: totalPOs > 0 ? discrepancyPOs / totalPOs : 0,
        totalValueDiff,
        unresolvedAlerts: unresolvedAlerts.length,
        resolvedAlerts: resolvedAlerts.length,
        trend,
        recentDiscrepancyRate,
      }
    })
  )

  // Top performing and worst
  const best = suppliersWithStats.filter(s => s.performanceScore >= 4).slice(0, 5)
  const worst = suppliersWithStats.filter(s => s.performanceScore <= 3).slice(0, 5)

  const avgScore = suppliersWithStats.length > 0
    ? suppliersWithStats.reduce((acc, s) => acc + s.performanceScore, 0) / suppliersWithStats.length
    : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kartu Performa Supplier"
        description="Analisis dan performa supplier berdasarkan history PO dan discrepancy."
        icon={<BarChart3 className="w-8 h-8" />}
        color="violet"
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Supplier</span>
            <span className="text-3xl font-bold text-slate-900">{suppliersWithStats.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Rata-rata Skor</span>
            <span className="text-3xl font-bold text-slate-900">{avgScore.toFixed(1)}<span className="text-lg text-slate-400">/5</span></span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Discrepancy</span>
            <span className="text-3xl font-bold text-rose-600">
              {suppliersWithStats.reduce((acc, s) => acc + s.unresolvedAlerts, 0)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Nilai Selisih</span>
            <span className="text-2xl font-bold text-red-600">
              Rp {suppliersWithStats.reduce((acc, s) => acc + s.totalValueDiff, 0).toLocaleString("id-ID")}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Best & Worst */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-slate-800">Supplier Terbaik</h3>
            </div>
            {best.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Belum ada data.</p>
            ) : (
              <div className="space-y-3">
                {best.map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono text-slate-400 w-4">{i + 1}.</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{s.name}</p>
                        <p className="text-xs text-slate-400">{s.totalPOs} PO</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {[1,2,3,4,5].map(v => (
                        <div key={v} className={cn("w-2 h-2 rounded-full", v <= s.performanceScore ? "bg-emerald-400" : "bg-slate-200")} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-slate-800">Butuh Perhatian</h3>
            </div>
            {worst.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Semua supplier dalam kondisi baik.</p>
            ) : (
              <div className="space-y-3">
                {worst.map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono text-slate-400 w-4">{i + 1}.</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{s.name}</p>
                        <p className="text-xs text-rose-500">{s.unresolvedAlerts} alert belum resolved</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {[1,2,3,4,5].map(v => (
                        <div key={v} className={cn("w-2 h-2 rounded-full", v <= s.performanceScore ? "bg-rose-400" : "bg-slate-200")} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-800">Semua Supplier</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4 border-b border-slate-200">Supplier</th>
                <th className="px-6 py-4 border-b border-slate-200 text-center">Skor</th>
                <th className="px-6 py-4 border-b border-slate-200 text-center">Total PO</th>
                <th className="px-6 py-4 border-b border-slate-200 text-center">Discrepancy Rate</th>
                <th className="px-6 py-4 border-b border-slate-200 text-right">Nilai Selisih</th>
                <th className="px-6 py-4 border-b border-slate-200 text-center">Alert Open</th>
                <th className="px-6 py-4 border-b border-slate-200 text-center">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliersWithStats.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold flex-shrink-0">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{s.name}</p>
                        <p className="text-xs text-slate-400">{s.paymentTerms || "-"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {[1,2,3,4,5].map(v => (
                        <div key={v} className={cn("w-2.5 h-2.5 rounded-full", v <= s.performanceScore ? (
                          s.performanceScore >= 4 ? "bg-emerald-400" :
                          s.performanceScore >= 3 ? "bg-amber-400" : "bg-rose-400"
                        ) : "bg-slate-200")} />
                      ))}
                      <span className="ml-1 text-xs font-semibold text-slate-600">{s.performanceScore}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-slate-700">{s.totalPOs}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
                      s.discrepancyRate === 0 ? "bg-emerald-100 text-emerald-700" :
                      s.discrepancyRate < 0.2 ? "bg-amber-100 text-amber-700" :
                      "bg-rose-100 text-rose-700"
                    )}>
                      {(s.discrepancyRate * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-700">
                    {s.totalValueDiff > 0 ? (
                      <span className="text-rose-600">Rp {s.totalValueDiff.toLocaleString("id-ID")}</span>
                    ) : (
                      <span className="text-emerald-600">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {s.unresolvedAlerts > 0 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-600 text-xs font-bold">
                        {s.unresolvedAlerts}
                      </span>
                    ) : (
                      <span className="text-slate-300">0</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {s.trend === "up" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                        <TrendingUp className="w-4 h-4" /> Membaik
                      </span>
                    ) : s.trend === "down" ? (
                      <span className="inline-flex items-center gap-1 text-rose-600 text-xs font-semibold">
                        <TrendingDown className="w-4 h-4" /> Memburuk
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">Stabil</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
