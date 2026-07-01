"use client"

import Link from "next/link"
import { TrendingUp, AlertTriangle, Clock, ArrowRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

type TopItem = {
  itemName: string
  sku: string | null
  discrepancyCount: number
  totalValueDiff: number
  lastDiscrepancy: Date | string
}

type TopSupplier = {
  supplierId: string
  supplierName: string
  discrepancyCount: number
  avgDaysToResolve: number | null
  lastDiscrepancy: Date | string
}

type AgingPO = {
  id: string
  poNumber: string
  status: string
  ageInDays: number
  supplierName: string
  createdAt: Date | string
}

type DashboardAnalyticsProps = {
  topItems: TopItem[]
  topSuppliers: TopSupplier[]
  agingPOs: AgingPO[]
}

export function DashboardAnalytics({ topItems, topSuppliers, agingPOs }: DashboardAnalyticsProps) {
  const hasAnyData = topItems.length > 0 || topSuppliers.length > 0 || agingPOs.length > 0

  return (
    <div className="space-y-6">
      {/* Aging POs Warning — show if any */}
      {agingPOs.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-amber-800">PO yang Memerlukan Tindakan Segera</h3>
            <span className="ml-auto text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">
              {agingPOs.length} PO
            </span>
          </div>
          <div className="space-y-2">
            {agingPOs.slice(0, 5).map(po => (
              <Link
                key={po.id}
                href={`/purchase-orders/${po.id}`}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100 hover:border-amber-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    po.status === "SENT" ? "bg-blue-100 text-blue-700" :
                    po.status === "PARTIAL" ? "bg-yellow-100 text-yellow-700" :
                    "bg-rose-100 text-rose-700"
                  }`}>
                    {po.status}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{po.poNumber}</p>
                    <p className="text-xs text-slate-500">{po.supplierName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-600 font-medium">
                    {po.ageInDays} hari
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Two-column layout for top items and suppliers */}
      {hasAnyData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Items */}
          {topItems.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-slate-800">Barang Paling Sering Selisih</h3>
              </div>
              <div className="space-y-3">
                {topItems.map((item, i) => (
                  <div key={item.itemName} className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-100 text-rose-600 text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{item.itemName}</p>
                        {item.sku && (
                          <p className="text-xs text-slate-400">{item.sku}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-0.5">
                          {item.discrepancyCount}x selisih · {formatDistanceToNow(new Date(item.lastDiscrepancy), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-rose-600">
                        Rp {Math.abs(item.totalValueDiff).toLocaleString("id-ID")}
                      </p>
                      <p className="text-xs text-slate-400">selisih nilai</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Suppliers */}
          {topSuppliers.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-slate-800">Supplier Paling Sering Discrepancy</h3>
              </div>
              <div className="space-y-3">
                {topSuppliers.map((sup, i) => (
                  <div key={sup.supplierId} className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{sup.supplierName}</p>
                        <p className="text-xs text-slate-400">
                          {sup.discrepancyCount}x discrepancy
                          {sup.avgDaysToResolve != null && ` · avg ${Math.round(sup.avgDaysToResolve)} hari resolve`}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatDistanceToNow(new Date(sup.lastDiscrepancy), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/purchase-orders?q=${encodeURIComponent(sup.supplierName)}`}
                      className="flex-shrink-0 text-xs text-violet-500 hover:text-violet-700 font-medium"
                    >
                      Lihat PO
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
