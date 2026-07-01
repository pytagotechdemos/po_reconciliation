"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { Receipt } from "lucide-react"

export function MarkPaidButton({ poId }: { poId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invoiceNumber.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/po/${poId}/paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceNumber: invoiceNumber.trim() })
      })
      if (res.ok) {
        toast.success("PO berhasil ditandai lunas")
        setOpen(false)
        router.refresh()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Terjadi kesalahan")
      }
    } catch {
      toast.error("Gagal menghubungi server")
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
      <Modal isOpen={open} onClose={() => { setOpen(false); setInvoiceNumber("") }} title="Tandai PO Lunas">
        <form onSubmit={handleSubmit} className="space-y-4">
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
