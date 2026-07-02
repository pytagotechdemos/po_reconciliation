"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { CheckCircle, XCircle, Loader2, ArrowUpDown } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"

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
  const [sorting, setSorting] = useState<SortingState>([])

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allWaitingIds = pos.filter(p => p.status === "WAITING_APPROVAL").map(p => p.id)
  const allWaitingSelected = allWaitingIds.length > 0 && allWaitingIds.every(id => selected.has(id))

  const toggleAll = () => {
    if (allWaitingSelected) {
      setSelected(prev => {
        const next = new Set(prev)
        allWaitingIds.forEach(id => next.delete(id))
        return next
      })
    } else {
      setSelected(prev => {
        const next = new Set(prev)
        allWaitingIds.forEach(id => next.add(id))
        return next
      })
    }
  }

  const handleBulkAction = async (action: "approve" | "reject") => {
    if (selected.size === 0) return
    setLoading(action)
    try {
      const res = await fetch("/api/po/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poIds: Array.from(selected), action })
      })
      if (res.ok) {
        setSelected(new Set())
        toast.success(`${selected.size} PO berhasil ${action === "approve" ? "disetujui" : "ditolak"}`)
        router.refresh()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Terjadi kesalahan")
      }
    } catch {
      toast.error("Gagal menghubungi server")
    } finally {
      setLoading(null)
    }
  }

  const columns: ColumnDef<PO>[] = [
    {
      id: "select",
      header: () => (
        <input
          type="checkbox"
          className="rounded border-slate-300 cursor-pointer"
          checked={allWaitingSelected}
          onChange={toggleAll}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => {
        const po = row.original
        const isWaiting = po.status === "WAITING_APPROVAL"
        const isChecked = selected.has(po.id)
        return (
          <input
            type="checkbox"
            className="rounded border-slate-300 cursor-pointer"
            checked={isChecked}
            onChange={() => isWaiting ? toggleSelect(po.id) : undefined}
            disabled={!isWaiting}
            aria-label={`Select PO ${po.poNumber}`}
          />
        )
      },
    },
    {
      accessorKey: "poNumber",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent font-semibold text-slate-700"
          >
            No. PO
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <span className="font-mono text-sm font-medium text-slate-700">{row.getValue("poNumber")}</span>,
    },
    {
      accessorKey: "supplier.name",
      id: "supplier",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent font-semibold text-slate-700"
          >
            Supplier
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <span className="font-medium text-slate-800">{row.getValue("supplier")}</span>,
    },
    {
      accessorKey: "dateOrdered",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent font-semibold text-slate-700"
          >
            Tgl PO
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const val = row.getValue("dateOrdered") as Date
        return <span className="text-slate-600">{val ? format(new Date(val), "dd MMM yyyy") : "-"}</span>
      },
    },
    {
      accessorKey: "dateReceived",
      header: "Tgl Terima",
      cell: ({ row }) => {
        const val = row.getValue("dateReceived") as Date | null
        return <span className="text-slate-600">{val ? format(new Date(val), "dd MMM yyyy") : "-"}</span>
      },
    },
    {
      accessorKey: "totalPO",
      header: ({ column }) => {
        return (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="p-0 hover:bg-transparent font-semibold text-slate-700 justify-end"
            >
              Total PO
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("totalPO"))
        return <div className="text-right font-semibold text-slate-800">Rp {amount.toLocaleString("id-ID")}</div>
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        let variant: "default" | "success" | "warning" | "destructive" | "secondary" = "default"
        if (status === "DRAFT") variant = "secondary"
        if (status === "WAITING_APPROVAL") variant = "default"
        if (status === "SENT") variant = "default"
        if (status === "PARTIAL") variant = "warning"
        if (status === "RECEIVED") variant = "success"
        if (status === "DISCREPANCY") variant = "destructive"
        if (status === "READY_TO_PAY") variant = "warning"
        if (status === "PAID") variant = "secondary"
        if (status === "REJECTED") variant = "destructive"
        if (status === "CANCELLED") variant = "secondary"

        return <Badge variant={variant} className="shadow-sm">{status}</Badge>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="text-right">
          <Link href={`/purchase-orders/${row.original.id}`}>
            <Button variant="outline" size="sm" className="hover:bg-violet-50 hover:text-violet-600 border-slate-200">Detail</Button>
          </Link>
        </div>
      ),
    }
  ]

  const table = useReactTable({
    data: pos,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  })

  return (
    <div className="space-y-4">
      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{selected.size} PO dipilih</span>
          </div>
          <div className="flex items-center gap-3">
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
      <div className="rounded-md border bg-white overflow-hidden shadow-sm">
        <Table className="min-w-[800px]">
          <TableHeader className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    "transition-colors hover:bg-slate-50",
                    row.original.status === "DISCREPANCY" ? "bg-rose-50/30 hover:bg-rose-50/70" : "",
                    selected.has(row.original.id) ? "bg-violet-50 hover:bg-violet-100" : ""
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-slate-500 py-12">
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-lg font-medium text-slate-900 mb-1">Belum ada Purchase Order</p>
                    <p className="text-sm">Buat PO baru untuk mulai melakukan rekonsiliasi.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
