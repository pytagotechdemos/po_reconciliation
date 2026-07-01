"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

type PO = {
  id: string
  poNumber: string
  status: string
  dateOrdered: Date
  dateReceived: Date | null
  totalPO: number
  supplier: { name: string }
}

export function PurchaseOrdersTable({ pos }: { pos: PO[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null)
  const [errorMsg, setErrorMsg] = useState("")

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    const waitingIds = pos.filter(p => p.status === "WAITING_APPROVAL").map(p => p.id)
    const allSelected = waitingIds.every(id => selected.has(id))
    if (allSelected) {
      setSelected(prev => {
        const next = new Set(prev)
        waitingIds.forEach(id => next.delete(id))
        return next
      })
    } else {
      setSelected(prev => {
        const next = new Set(prev)
        waitingIds.forEach(id => next.add(id))
        return next
      })
    }
  }

  const allWaitingIds = pos.filter(p => p.status === "WAITING_APPROVAL").map(p => p.id)
  const allWaitingSelected = allWaitingIds.length > 0 && allWaitingIds.every(id => selected.has(id))

  const handleBulkAction = async (action: "approve" | "reject") => {
    if (selected.size === 0) return
    setLoading(action)
    setErrorMsg("")
    try {
      const res = await fetch("/api/po/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poIds: Array.from(selected), action })
      })
      if (res.ok) {
        setSelected(new Set())
        router.refresh()
      } else {
        const err = await res.json()
        setErrorMsg(err.error || "Terjadi kesalahan")
      }
    } catch {
      setErrorMsg("Gagal menghubungi server")
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{selected.size} PO dipilih</span>
          </div>
          <div className="flex items-center gap-3">
            {errorMsg && <span className="text-sm text-red-200">{errorMsg}</span>}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelected(new Set())}
              className="border-white/40 text-white hover:bg-white/20 hover:text-white"
            >
              Batal
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction("reject")}
              disabled={loading !== null}
              className="border-white/40 text-white hover:bg-red-500 hover:border-red-500"
            >
              {loading === "reject" ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
              Tolak
            </Button>
            <Button
              size="sm"
              onClick={() => handleBulkAction("approve")}
              disabled={loading !== null}
              className="bg-white text-violet-700 hover:bg-slate-100"
            >
              {loading === "approve" ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
              Setujui
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-slate-200 overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  className="rounded border-slate-300"
                  checked={allWaitingSelected}
                  onChange={toggleAll}
                />
              </TableHead>
              <TableHead className="font-semibold text-slate-700">No. PO</TableHead>
              <TableHead className="font-semibold text-slate-700">Supplier</TableHead>
              <TableHead className="font-semibold text-slate-700">Tgl PO</TableHead>
              <TableHead className="font-semibold text-slate-700">Tgl Terima</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Total PO</TableHead>
              <TableHead className="font-semibold text-slate-700">Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pos.map((po) => {
              const totalPO = po.totalPO
              const isWaiting = po.status === "WAITING_APPROVAL"
              const isChecked = selected.has(po.id)

              let variant: "default" | "success" | "warning" | "destructive" | "secondary" = "default"
              if (po.status === "DRAFT") variant = "secondary"
              if (po.status === "WAITING_APPROVAL") variant = "default"
              if (po.status === "SENT") variant = "default"
              if (po.status === "PARTIAL") variant = "warning"
              if (po.status === "RECEIVED") variant = "success"
              if (po.status === "DISCREPANCY") variant = "destructive"
              if (po.status === "READY_TO_PAY") variant = "warning"
              if (po.status === "PAID") variant = "secondary"
              if (po.status === "REJECTED" || po.status === "CANCELLED") variant = "secondary"

              return (
                <TableRow
                  key={po.id}
                  className={cn(
                    "transition-colors",
                    po.status === "DISCREPANCY" ? "bg-rose-50/30 hover:bg-rose-50/70" : "",
                    isChecked && isWaiting ? "bg-violet-50" : ""
                  )}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      className="rounded border-slate-300"
                      checked={isChecked}
                      onChange={() => isWaiting ? toggleSelect(po.id) : undefined}
                      disabled={!isWaiting}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm font-medium text-slate-700">{po.poNumber}</TableCell>
                  <TableCell className="font-medium text-slate-800">{po.supplier.name}</TableCell>
                  <TableCell className="text-slate-600">{format(new Date(po.dateOrdered), "dd MMM yyyy")}</TableCell>
                  <TableCell className="text-slate-600">{po.dateReceived ? format(new Date(po.dateReceived), "dd MMM yyyy") : "-"}</TableCell>
                  <TableCell className="text-right font-semibold text-slate-800">Rp {totalPO.toLocaleString("id-ID")}</TableCell>
                  <TableCell>
                    <Badge variant={variant} className="shadow-sm">{po.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/purchase-orders/${po.id}`}>
                      <Button variant="outline" size="sm" className="hover:bg-violet-50 hover:text-violet-600 border-slate-200">Detail</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
