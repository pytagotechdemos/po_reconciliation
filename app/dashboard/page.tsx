import { prisma } from "@/lib/prisma"

export default async function DashboardPage() {
  const [totalPO, totalReceived, totalDiscrepancy, totalPendingPayment] = await Promise.all([
    prisma.purchaseOrder.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // This month
        }
      }
    }),
    prisma.purchaseOrder.count({
      where: { status: "RECEIVED" }
    }),
    prisma.purchaseOrder.count({
      where: { status: "DISCREPANCY" }
    }),
    prisma.purchaseOrder.count({
      where: { status: { in: ["RECEIVED", "DISCREPANCY"] } } // Example definition
    })
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total PO */}
        <div className="flex flex-col rounded-lg border border-blue-200 bg-white p-6 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total PO Bulan Ini</span>
          <span className="mt-2 text-3xl font-bold text-slate-900">{totalPO}</span>
        </div>
        
        {/* Card 2: Sudah Diterima */}
        <div className="flex flex-col rounded-lg border border-green-200 bg-white p-6 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sudah Diterima</span>
          <span className="mt-2 text-3xl font-bold text-slate-900">{totalReceived}</span>
        </div>

        {/* Card 3: Discrepancy */}
        <div className="flex flex-col rounded-lg border border-red-200 bg-white p-6 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Discrepancy</span>
          <span className="mt-2 text-3xl font-bold text-red-600">{totalDiscrepancy}</span>
        </div>

        {/* Card 4: Menunggu Pembayaran */}
        <div className="flex flex-col rounded-lg border border-amber-200 bg-white p-6 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Menunggu Pembayaran</span>
          <span className="mt-2 text-3xl font-bold text-slate-900">{totalPendingPayment}</span>
        </div>
      </div>

      {/* Placeholder for recent activities or recent discrepancy POs */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Aktivitas Terakhir</h3>
        <p className="text-slate-500">Belum ada aktivitas yang dicatat.</p>
      </div>
    </div>
  )
}
