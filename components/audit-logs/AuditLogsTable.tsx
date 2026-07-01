"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search as SearchIcon, Clock, User, Activity, Filter, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { ChevronLeft, ChevronRight } from "lucide-react"

type Log = {
  id: string
  userId: string
  action: string
  entityType: string
  entityId: string
  details: string | null
  createdAt: Date | string
  user: { name: string; role: string }
}

const PAGE_SIZE = 20

const ACTION_OPTIONS = ["", "CREATE", "UPDATE", "DELETE", "RESOLVE", "BULK_UPDATE", "APPROVE", "REJECT"]
const ENTITY_OPTIONS = ["", "PurchaseOrder", "POLineItem", "Item", "Supplier", "GoodsReceipt", "Invoice", "Alert", "User"]

export function AuditLogsTable({
  initialLogs,
  totalCount,
  initialSearch,
  initialAction,
  initialEntity,
  initialFrom,
  initialTo,
}: {
  initialLogs: Log[]
  totalCount: number
  initialSearch: string
  initialAction?: string
  initialEntity?: string
  initialFrom?: string
  initialTo?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [term, setTerm] = useState(initialSearch)
  const [action, setAction] = useState(initialAction || "")
  const [entity, setEntity] = useState(initialEntity || "")
  const [from, setFrom] = useState(initialFrom || "")
  const [to, setTo] = useState(initialTo || "")
  const [showFilters, setShowFilters] = useState(Boolean(initialAction || initialEntity || initialFrom || initialTo))
  const currentPage = Number(searchParams.get("page") || "1")

  const applyFilters = (overrides?: {
    q?: string; action?: string; entity?: string; from?: string; to?: string
  }) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams)
      const q = overrides?.q !== undefined ? overrides.q : term
      const a = overrides?.action !== undefined ? overrides.action : action
      const e = overrides?.entity !== undefined ? overrides.entity : entity
      const f = overrides?.from !== undefined ? overrides.from : from
      const t = overrides?.to !== undefined ? overrides.to : to

      if (q) params.set("q", q); else params.delete("q")
      if (a) params.set("action", a); else params.delete("action")
      if (e) params.set("entity", e); else params.delete("entity")
      if (f) params.set("from", f); else params.delete("from")
      if (t) params.set("to", t); else params.delete("to")
      params.set("page", "1")
      router.push(`?${params.toString()}`)
    })
  }

  const clearFilters = () => {
    setAction(""); setEntity(""); setFrom(""); setTo("")
    setTerm("")
    startTransition(() => {
      const params = new URLSearchParams()
      params.set("page", "1")
      router.push(`?${params.toString()}`)
    })
  }

  const hasActiveFilters = action || entity || from || to
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Filter Bar */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Text Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari user, aksi, atau entitas..."
              value={term}
              onChange={e => {
                const val = e.target.value
                setTerm(val)
                const timer = setTimeout(() => applyFilters({ q: val }), 300)
                return () => clearTimeout(timer)
              }}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(v => !v)}
            className={cn("gap-1.5", showFilters && "bg-indigo-50 border-indigo-300 text-indigo-700")}
          >
            <Filter className="w-4 h-4" />
            Filter
            {hasActiveFilters && (
              <span className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {[action, entity, from, to].filter(Boolean).length}
              </span>
            )}
          </Button>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 gap-1.5">
              <X className="w-4 h-4" />
              Reset
            </Button>
          )}

          <div className="text-sm text-slate-500 ml-auto">
            Total: <strong>{totalCount}</strong> aktivitas
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Aksi</label>
              <select
                value={action}
                onChange={e => { setAction(e.target.value); applyFilters({ action: e.target.value }) }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
              >
                {ACTION_OPTIONS.map(o => (
                  <option key={o} value={o}>{o === "" ? "Semua Aksi" : o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Entitas</label>
              <select
                value={entity}
                onChange={e => { setEntity(e.target.value); applyFilters({ entity: e.target.value }) }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
              >
                {ENTITY_OPTIONS.map(o => (
                  <option key={o} value={o}>{o === "" ? "Semua Entitas" : o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Dari Tanggal</label>
              <input
                type="date"
                value={from}
                onChange={e => { setFrom(e.target.value); applyFilters({ from: e.target.value }) }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Sampai Tanggal</label>
              <input
                type="date"
                value={to}
                onChange={e => { setTo(e.target.value); applyFilters({ to: e.target.value }) }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
        )}
      </div>

      <div className={cn("overflow-x-auto transition-opacity", isPending ? "opacity-50 pointer-events-none" : "opacity-100")}>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4 border-b border-slate-200">Waktu</th>
              <th className="px-6 py-4 border-b border-slate-200">User</th>
              <th className="px-6 py-4 border-b border-slate-200">Aksi</th>
              <th className="px-6 py-4 border-b border-slate-200">Entitas</th>
              <th className="px-6 py-4 border-b border-slate-200">ID Entitas</th>
              <th className="px-6 py-4 border-b border-slate-200">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {initialLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  <Activity className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p>Belum ada aktivitas terekam.</p>
                </td>
              </tr>
            ) : (
              initialLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock className="w-4 h-4" />
                      <span>{format(new Date(log.createdAt), "dd MMM yyyy, HH:mm:ss")}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-900">{log.user.name}</span>
                      <span className="text-xs text-slate-400">({log.user.role})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      log.action.includes("CREATE") ? "bg-green-100 text-green-800" :
                      log.action.includes("UPDATE") || log.action.includes("RESOLVE") ? "bg-blue-100 text-blue-800" :
                      log.action.includes("DELETE") ? "bg-red-100 text-red-800" :
                      "bg-slate-100 text-slate-800"
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">{log.entityType}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{log.entityId.slice(0, 8)}...</td>
                  <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate" title={log.details || ""}>
                    {log.details || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-slate-200">
          <div className="text-sm text-slate-500">
            Halaman {currentPage} dari {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => {
                const params = new URLSearchParams(searchParams)
                params.set("page", String(currentPage - 1))
                router.push(`?${params.toString()}`)
              }}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <span className="text-sm text-slate-600 font-medium px-2">{currentPage} / {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => {
                const params = new URLSearchParams(searchParams)
                params.set("page", String(currentPage + 1))
                router.push(`?${params.toString()}`)
              }}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
