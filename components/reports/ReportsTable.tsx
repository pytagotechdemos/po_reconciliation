"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { Download } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

type ReportRow = {
  id: string
  poNumber: string
  supplierName: string
  dateOrdered: Date
  status: string
  totalOrdered: number
  totalReceived: number
  diff: number
}

export function ReportsTable({ reportData }: { reportData: ReportRow[] }) {
  const [filter, setFilter] = useState("ALL")

  const filtered = filter === "ALL"
    ? reportData
    : reportData.filter(r => r.status === filter)

  const handleExport = () => {
    if (filtered.length === 0) return
    const rows = filtered.map(r => ({
      "No. PO": r.poNumber,
      "Supplier": r.supplierName,
      "Tgl PO": format(new Date(r.dateOrdered), "dd MMM yyyy"),
      "Status": r.status,
      "Total PO": r.totalOrdered,
      "Total Aktual": r.totalReceived,
      "Selisih": r.diff,
    }))
    import("papaparse").then(({ default: Papa }) => {
      const csvData = Papa.unparse(rows)
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `laporan_rekonsiliasi_${format(new Date(), "yyyy-MM-dd")}.csv`
      link.click()
    })
  }

  const statuses = ["ALL", "DRAFT", "WAITING_APPROVAL", "SENT", "PARTIAL", "RECEIVED", "DISCREPANCY", "READY_TO_PAY", "PAID"]

  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
        >
          {statuses.map(s => (
            <option key={s} value={s}>{s === "ALL" ? "Semua Status" : s.replace(/_/g, " ")}</option>
          ))}
        </select>
        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export Laporan
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead>No. PO</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Tgl PO</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total PO</TableHead>
              <TableHead className="text-right">Total Aktual</TableHead>
              <TableHead className="text-right">Selisih</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                  Tidak ada data laporan.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-sm font-medium">{row.poNumber}</TableCell>
                  <TableCell>{row.supplierName}</TableCell>
                  <TableCell suppressHydrationWarning>{format(new Date(row.dateOrdered), "dd MMM yyyy")}</TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell className="text-right">Rp {row.totalOrdered.toLocaleString("id-ID")}</TableCell>
                  <TableCell className="text-right">Rp {row.totalReceived.toLocaleString("id-ID")}</TableCell>
                  <TableCell className={cn("text-right font-semibold", row.diff !== 0 ? "text-red-600" : "text-green-600")}>
                    Rp {row.diff.toLocaleString("id-ID")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
