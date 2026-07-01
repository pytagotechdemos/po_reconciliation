"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { Receipt } from "lucide-react"

export function MarkPaidButton({ poId }: { poId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invoiceNumber.trim()) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/po/${poId}/paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceNumber: invoiceNumber.trim() })
      })
      if (res.ok) {
        setOpen(false)
        router.refresh()
      } else {
        const err = await res.json()
        setError(err.error || "Terjadi kesalahan")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-green-600 hover:bg-green-700">
        <Receipt className="w-4 h-4 mr-2" />
        Tandai Lunas
      </Button>
      <Modal isOpen={open} onClose={() => { setOpen(false); setInvoiceNumber(""); setError("") }} title="Tandai PO Lunas">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 border border-red-200 text-sm text-red-600">{error}</div>
          )}
          <p className="text-sm text-slate-500">Masukkan nomor invoice untuk pencatatan:</p>
          <input
            type="text"
            value={invoiceNumber}
            onChange={e => setInvoiceNumber(e.target.value)}
            placeholder="Contoh: INV-20260601"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" disabled={loading || !invoiceNumber.trim()}>
              {loading ? "Menyimpan..." : "Konfirmasi Lunas"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
