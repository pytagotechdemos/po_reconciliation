"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "@/components/ui/Search"
import { Calendar } from "lucide-react"

export function POFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") || "ALL";
  const dateFrom = searchParams.get("from") || "";
  const dateTo = searchParams.get("to") || "";

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateParam("status", e.target.value === "ALL" ? "" : e.target.value);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center flex-wrap">
      <div className="w-full sm:w-72">
        <Search />
      </div>
      <div className="w-full sm:w-48">
        <select
          value={currentStatus}
          onChange={handleStatusChange}
          className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="ALL">Semua Status</option>
          <option value="WAITING_APPROVAL">Menunggu Approval</option>
          <option value="SENT">Sudah Dikirim</option>
          <option value="PARTIAL">Partial</option>
          <option value="RECEIVED">Sudah Diterima</option>
          <option value="DISCREPANCY">Discrepancy</option>
          <option value="READY_TO_PAY">Siap Bayar</option>
          <option value="PAID">Lunas</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <input
          type="date"
          value={dateFrom}
          onChange={e => updateParam("from", e.target.value)}
          className="h-10 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          title="Dari tanggal"
        />
        <span className="text-slate-400 text-xs">—</span>
        <input
          type="date"
          value={dateTo}
          onChange={e => updateParam("to", e.target.value)}
          className="h-10 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          title="Sampai tanggal"
        />
      </div>
    </div>
  )
}
