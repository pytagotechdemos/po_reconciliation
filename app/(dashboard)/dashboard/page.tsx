import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma"
import { DashboardCharts } from "@/components/DashboardCharts"
import { DashboardAnalytics } from "@/components/DashboardAnalytics"
import { TrendingUp, DollarSign, Activity, LayoutDashboard, Package, Truck, AlertTriangle, History, Clock } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"

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
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard Overview" 
        description="Ringkasan aktivitas dan performa pembelian perusahaan."
        icon={<LayoutDashboard className="w-8 h-8" />}
        color="indigo"
      />

      {isOwner && (
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4 tracking-tight">Financial Overview (Owner)</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Total Spending */}
            <div className="flex flex-col rounded-2xl border border-indigo-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Spending</span>
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-500">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <span className="mt-4 text-3xl font-bold text-slate-900">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(computedSpending)}
              </span>
            </div>

            {/* Discrepancy Rate */}
            <div className="flex flex-col rounded-2xl border border-rose-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Discrepancy Rate</span>
                <div className="p-2 bg-rose-50 rounded-lg text-rose-500">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <span className="mt-4 text-3xl font-bold text-rose-600">
                {totalPO > 0 ? ((discrepancyThisMonth / totalPO) * 100).toFixed(1) : "0.0"}%
              </span>
            </div>

            {/* Total POs */}
            <div className="flex flex-col rounded-2xl border border-emerald-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total POs</span>
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-500">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <span className="mt-4 text-3xl font-bold text-emerald-600">
                {totalPO} Orders
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total PO */}
        <div className="group relative flex flex-col rounded-2xl border border-indigo-100 bg-white/70 backdrop-blur-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total PO Bulan Ini</span>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <span className="mt-4 text-4xl font-bold text-slate-900">{totalPO}</span>
        </div>
        
        {/* Card 2: Sudah Diterima */}
        <div className="group relative flex flex-col rounded-2xl border border-emerald-100 bg-white/70 backdrop-blur-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sudah Diterima</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <span className="mt-4 text-4xl font-bold text-slate-900">{totalReceived}</span>
        </div>

        {/* Card 3: Discrepancy */}
        <div className="group relative flex flex-col rounded-2xl border border-rose-100 bg-white/70 backdrop-blur-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Discrepancy</span>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors duration-300">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <span className="mt-4 text-4xl font-bold text-rose-600">{discrepancyThisMonth}</span>
        </div>

        {/* Card 4: Menunggu Pembayaran */}
        <div className="group relative flex flex-col rounded-2xl border border-amber-100 bg-white/70 backdrop-blur-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1">
           <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Menunggu Pemb.</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <span className="mt-4 text-4xl font-bold text-slate-900">{totalPendingPayment}</span>
        </div>
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
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <History className="h-5 w-5 text-slate-400" />
            <h3 className="font-bold text-slate-900">Aktivitas Terkini</h3>
          </div>
          
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-slate-200 group-hover:bg-indigo-500 text-slate-500 group-hover:text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm transition-colors duration-300 ml-[-9px] md:ml-0 z-10">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-white" />
                </div>
                
                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-xl border border-slate-100 bg-slate-50/50 group-hover:bg-white shadow-sm transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-slate-900">{activity.poNumber}</span>
                    <span className="text-[10px] font-medium text-slate-400">
                      {new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(activity.updatedAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Status diperbarui menjadi <strong className="text-slate-700">{activity.status}</strong> untuk supplier {activity.supplier.name}.
                  </p>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <div className="text-sm text-slate-500 text-center py-4">Belum ada aktivitas.</div>
            )}
          </div>
        </div>
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
  )
}
