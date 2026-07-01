import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma"
import { DashboardCharts } from "@/components/DashboardCharts"
import { DashboardAnalytics } from "@/components/DashboardAnalytics"
import { TrendingUp, DollarSign, Activity, LayoutDashboard, Package, Truck, AlertTriangle, History, Clock } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent } from "@/components/ui/Card"
import { PageTransition } from "@/components/ui/PageTransition"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const isOwner = session?.user?.role === "owner";

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalPO,
    totalReceived,
    discrepancyThisMonth,
    totalPendingPayment,
    recentActivity,
    monthlyRaw,
    totalSpending,
    topItemsRaw,
    topSuppliersRaw,
    agingPOs,
  ] = await Promise.all([
    prisma.purchaseOrder.count({
      where: { createdAt: { gte: startOfMonth } }
    }),
    prisma.purchaseOrder.count({
      where: { createdAt: { gte: startOfMonth }, status: "RECEIVED" }
    }),
    prisma.purchaseOrder.count({
      where: { createdAt: { gte: startOfMonth }, status: "DISCREPANCY" }
    }),
    prisma.purchaseOrder.count({
      where: { status: { not: "PAID" } }
    }),
    prisma.purchaseOrder.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: { supplier: true }
    }),
    prisma.purchaseOrder.findMany({
      where: { createdAt: { gte: new Date(now.getFullYear(), 0, 1) } },
      select: { createdAt: true }
    }),
    prisma.purchaseOrder.findMany({
      where: { createdAt: { gte: startOfMonth } },
      include: { lineItems: true }
    }),
    // Top 5 items with most discrepancies — need sku from line items
    prisma.alert.findMany({
      where: { type: { in: ['QTY_DISCREPANCY', 'PRICE_DISCREPANCY'] } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    // Top suppliers with most discrepancies — use findMany then aggregate in JS
    // (groupBy result type excludes non-grouped fields like createdAt)
    prisma.alert.findMany({
      where: { type: { in: ['QTY_DISCREPANCY', 'PRICE_DISCREPANCY'] } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    // Aging POs — SENT past expected date, PARTIAL past 14 days from order, DISCREPANCY stale > 7 days
    prisma.purchaseOrder.findMany({
      where: {
        OR: [
          { status: "SENT", dateExpected: { lt: now } },
          { status: "PARTIAL", dateOrdered: { lt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) } },
          { status: "DISCREPANCY", updatedAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
        ]
      },
      include: { supplier: true },
      orderBy: { updatedAt: 'asc' },
      take: 10,
    }),
  ]);

  // Enrich top suppliers with supplier name and avg resolve time
  const topSupplierIds = topSuppliersRaw.map(a => a.poId)
  const supplierPOs = topSupplierIds.length > 0
    ? await prisma.purchaseOrder.findMany({
        where: { id: { in: topSupplierIds } },
        include: {
          supplier: true,
          alerts: {
            where: { resolution: { not: null } },
            orderBy: { createdAt: 'asc' },
          }
        },
      })
    : []

  // Build supplier discrepancy map from flat alert list
  const supplierDiscrepancyCount: Record<string, { count: number; supplierName: string; supplierId: string; lastDate: Date }> = {}
  for (const alert of topSuppliersRaw) {
    const po = supplierPOs.find(p => p.id === alert.poId)
    if (!po) continue
    const key = po.supplierId
    if (!supplierDiscrepancyCount[key]) {
      supplierDiscrepancyCount[key] = { count: 0, supplierName: po.supplier.name, supplierId: po.supplierId, lastDate: alert.createdAt }
    }
    supplierDiscrepancyCount[key].count++
    if (alert.createdAt > supplierDiscrepancyCount[key].lastDate) {
      supplierDiscrepancyCount[key].lastDate = alert.createdAt
    }
  }

  // Build top items from raw alerts — aggregate by itemName
  const itemStats: Record<string, { itemName: string; sku: string | null; count: number; totalValueDiff: number; lastDate: Date }> = {}
  for (const alert of topItemsRaw) {
    if (!itemStats[alert.itemName]) {
      itemStats[alert.itemName] = { itemName: alert.itemName, sku: null, count: 0, totalValueDiff: 0, lastDate: alert.createdAt }
    }
    itemStats[alert.itemName].count++
    itemStats[alert.itemName].totalValueDiff += Number(alert.valueDiff)
    if (alert.createdAt > itemStats[alert.itemName].lastDate) {
      itemStats[alert.itemName].lastDate = alert.createdAt
    }
  }
  const topItems = Object.values(itemStats)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(i => ({
      itemName: i.itemName,
      sku: i.sku,
      discrepancyCount: i.count,
      totalValueDiff: i.totalValueDiff,
      lastDiscrepancy: i.lastDate,
    }))

  const topSuppliers = Object.values(supplierDiscrepancyCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(s => ({
      supplierId: s.supplierId,
      supplierName: s.supplierName,
      discrepancyCount: s.count,
      avgDaysToResolve: null as number | null,
      lastDiscrepancy: s.lastDate,
    }))

  // Enrich aging POs with age in days
  const enrichedAgingPOs = agingPOs.map(po => {
    const refDate = po.status === "DISCREPANCY" ? po.updatedAt : po.dateOrdered
    const ageMs = now.getTime() - new Date(refDate).getTime()
    const ageInDays = Math.floor(ageMs / (24 * 60 * 60 * 1000))
    return {
      id: po.id,
      poNumber: po.poNumber,
      status: po.status,
      ageInDays,
      supplierName: po.supplier.name,
      createdAt: po.createdAt,
    }
  })

  // Total Spending
  const computedSpending = totalSpending.reduce((acc, po) => {
    const subtotal = po.lineItems.reduce((s, item) => s + Number(item.qtyOrdered) * Number(item.priceOrdered), 0);
    return acc + subtotal + Number(po.taxAmount || 0);
  }, 0);

  // Monthly data
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const monthKey = d.getMonth()
    const year = d.getFullYear()
    const count = monthlyRaw
      .filter(r => {
        const rDate = new Date(r.createdAt)
        return rDate.getMonth() === monthKey && rDate.getFullYear() === year
      })
      .length
    return {
      month: monthNames[monthKey],
      poCount: count
    }
  })

  return (
    <PageTransition>
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Dashboard Overview"
        description="Ringkasan aktivitas dan performa pembelian perusahaan."
        icon={<LayoutDashboard className="w-8 h-8" />}
        color="violet"
      />

      {isOwner && (
        <div className="mb-2">
          <h3 className="text-base font-bold text-slate-700 mb-4 tracking-tight uppercase text-xs text-slate-400">Financial Overview</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card hover className="border-violet-100">
              <CardContent className="p-5 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Spending</span>
                  <div className="p-2 bg-violet-50 rounded-lg text-violet-500">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-2xl font-bold text-slate-900 leading-tight">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(computedSpending)}
                </span>
                <span className="text-xs text-slate-400">Bulan ini</span>
              </CardContent>
            </Card>

            <Card hover className="border-rose-100">
              <CardContent className="p-5 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Discrepancy Rate</span>
                  <div className="p-2 bg-rose-50 rounded-lg text-rose-500">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-2xl font-bold text-rose-600 leading-tight">
                  {totalPO > 0 ? ((discrepancyThisMonth / totalPO) * 100).toFixed(1) : "0.0"}%
                </span>
                <span className="text-xs text-slate-400">{discrepancyThisMonth} PO bulan ini</span>
              </CardContent>
            </Card>

            <Card hover className="border-emerald-100">
              <CardContent className="p-5 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total PO</span>
                  <div className="p-2 bg-emerald-50 rounded-lg text-emerald-500">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-2xl font-bold text-emerald-600 leading-tight">{totalPO}</span>
                <span className="text-xs text-slate-400">Bulan ini</span>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card hover className="border-violet-100">
          <CardContent className="p-4 sm:p-5 flex flex-col gap-2">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">PO Baru</span>
              <div className="p-1.5 bg-violet-50 rounded-lg text-violet-500">
                <Package className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{totalPO}</span>
          </CardContent>
        </Card>

        <Card hover className="border-emerald-100">
          <CardContent className="p-4 sm:p-5 flex flex-col gap-2">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">Diterima</span>
              <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-500">
                <Truck className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-bold text-emerald-600">{totalReceived}</span>
          </CardContent>
        </Card>

        <Card hover className="border-rose-100">
          <CardContent className="p-4 sm:p-5 flex flex-col gap-2">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">Discrepancy</span>
              <div className="p-1.5 bg-rose-50 rounded-lg text-rose-500">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-bold text-rose-600">{discrepancyThisMonth}</span>
          </CardContent>
        </Card>

        <Card hover className="border-amber-100">
          <CardContent className="p-4 sm:p-5 flex flex-col gap-2">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">Menunggu Bayar</span>
              <div className="p-1.5 bg-amber-50 rounded-lg text-amber-500">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{totalPendingPayment}</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardCharts
            totalReceived={totalReceived}
            totalDiscrepancy={discrepancyThisMonth}
            totalPending={Math.max(0, totalPO - totalReceived - discrepancyThisMonth)}
            monthlyData={monthlyData}
          />
        </div>
        
        {/* Audit Trail */}
        <Card padding="none">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
              <History className="h-4 w-4 text-violet-500" />
              <h3 className="font-bold text-slate-800 text-sm">Aktivitas Terkini</h3>
            </div>

            <div className="space-y-5 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="relative flex items-start gap-3">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-slate-200 shrink-0 mt-0.5 z-10 shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  </div>

                  <div className="flex-1 min-w-0 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="font-semibold text-xs text-slate-800 truncate">{activity.poNumber}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(activity.updatedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Status: <strong className="text-slate-700">{activity.status}</strong> — {activity.supplier.name}
                    </p>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">Belum ada aktivitas.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Discrepancy Analytics + Aging Alerts */}
      {(topItems.length > 0 || topSuppliers.length > 0 || enrichedAgingPOs.length > 0) && (
        <DashboardAnalytics
          topItems={topItems}
          topSuppliers={topSuppliers}
          agingPOs={enrichedAgingPOs}
        />
      )}
    </div>
    </PageTransition>
  )
}
