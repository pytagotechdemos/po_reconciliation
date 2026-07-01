"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Modal } from "@/components/ui/Modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { Plus, ReceiptText } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

type Invoice = {
  id: string
  invoiceNumber: string
  amount: number
  dateReceived: Date | string
  createdAt: Date | string
  po: {
    id: string
    poNumber: string
    status: string
    supplier: { name: string }
  }
}

type UnpaidPO = {
  id: string
  poNumber: string
  status: string
  suggestedAmount: number
  supplier: { name: string }
}

type InvoicesTableProps = {
  initialInvoices: Invoice[]
  unpaidPOs: UnpaidPO[]
}

export function InvoicesTable({ initialInvoices, unpaidPOs }: InvoicesTableProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid">("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedPO, setSelectedPO] = useState<UnpaidPO | null>(null)
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [amount, setAmount] = useState("")
  const [dateReceived, setDateReceived] = useState((() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })())
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const filteredInvoices = initialInvoices.filter(inv => {
    if (filter === "paid") return inv.po.status === "PAID"
    if (filter === "unpaid") return inv.po.status !== "PAID" && inv.invoiceNumber !== "BELUM ADA INVOICE"
    return true
  })

  const handleOpenAdd = (po?: UnpaidPO) => {
    if (po) {
      setSelectedPO(po)
      setInvoiceNumber("")
      setAmount(po.suggestedAmount.toString())
    }
    setDateReceived((() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })())
    setErrorMsg("")
    setShowAddModal(true)
  }

  const handleSubmitInvoice = async () => {
    if (!selectedPO || !invoiceNumber.trim() || !amount) return
    setLoading(true)
    setErrorMsg("")
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poId: selectedPO.id,
          invoiceNumber: invoiceNumber.trim(),
          amount: parseFloat(amount),
          dateReceived,
        })
      })
      if (res.ok) {
        setShowAddModal(false)
        router.refresh()
      } else {
        const err = await res.json()
        setErrorMsg(err.error || "Terjadi kesalahan")
      }
    } catch {
      setErrorMsg("Gagal menghubungi server")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Tabs + Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {(["all", "paid", "unpaid"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-all",
                filter === tab
                  ? "bg-white text-violet-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab === "all" ? "Semua" : tab === "paid" ? "Lunas" : "Belum Lunas"}
            </button>
          ))}
        </div>
        <Button onClick={() => handleOpenAdd(unpaidPOs[0] || null)}>
          <Plus className="w-4 h-4 mr-2" />
          Input Invoice
        </Button>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead>No. Invoice</TableHead>
              <TableHead>No. PO</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Tgl Invoice</TableHead>
              <TableHead className="text-right">Jumlah</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                  <ReceiptText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p>Belum ada invoice.</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map(inv => {
                const isOverdue = (inv as { po?: { isOverdue?: boolean } }).po?.isOverdue === true
                return (
                <TableRow key={inv.id} className={cn("hover:bg-slate-50", isOverdue && "bg-amber-50/50 hover:bg-amber-50")}>
                  <TableCell className={cn("font-medium", isOverdue && "text-amber-700 font-semibold")}>
                    {inv.invoiceNumber}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-slate-600">{inv.po.poNumber}</TableCell>
                  <TableCell className="text-slate-600">{inv.po.supplier.name}</TableCell>
                  <TableCell className="text-slate-500">{format(new Date(inv.createdAt), "dd MMM yyyy")}</TableCell>
                  <TableCell className="text-right font-semibold text-slate-800">
                    {isOverdue ? (
                      <span className="text-amber-600">PO Overdue</span>
                    ) : (
                      `Rp ${Number(inv.amount).toLocaleString("id-ID")}`
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      inv.po.status === "PAID"
                        ? "bg-green-100 text-green-700"
                        : isOverdue
                        ? "bg-amber-200 text-amber-800"
                        : "bg-amber-100 text-amber-700"
                    )}>
                      {inv.po.status === "PAID" ? "Lunas" : isOverdue ? "Overdue" : "Belum Lunas"}
                    </span>
                  </TableCell>
                </TableRow>
              )})
            )}
          </TableBody>
        </Table>
      </div>

      {/* PO List for quick invoice creation */}
      {unpaidPOs.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-3">PO Belum Lunas — Quick Input</h3>
          <div className="space-y-2">
            {unpaidPOs.map(po => (
              <div key={po.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <p className="text-sm font-medium text-slate-800">{po.poNumber}</p>
                  <p className="text-xs text-slate-500">{po.supplier.name}</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Estimasi: Rp {po.suggestedAmount.toLocaleString("id-ID")}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenAdd(po)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Invoice
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Invoice Modal */}
      {showAddModal && selectedPO && (
        <Modal isOpen onClose={() => setShowAddModal(false)} title="Input Invoice">
          <div className="space-y-4">
            {errorMsg && (
              <div className="rounded-md bg-red-50 p-3 border border-red-200 text-sm text-red-600">{errorMsg}</div>
            )}
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-sm">
              <p className="font-medium text-slate-700">PO: {selectedPO.poNumber}</p>
              <p className="text-slate-500">Supplier: {selectedPO.supplier.name}</p>
              <p className="text-amber-600 font-medium mt-1">
                Estimasi: Rp {selectedPO.suggestedAmount.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Nomor Invoice *</label>
              <Input
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                placeholder="Contoh: INV-20260701"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Jumlah (Rp) *</label>
              <Input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Tanggal Invoice</label>
              <Input
                type="date"
                value={dateReceived}
                onChange={e => setDateReceived(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Batal</Button>
              <Button onClick={handleSubmitInvoice} disabled={loading || !invoiceNumber.trim() || !amount}>
                {loading ? "Menyimpan..." : "Simpan Invoice"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
