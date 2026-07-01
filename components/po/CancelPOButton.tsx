"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { XCircle } from "lucide-react"

export function CancelPOButton({ poId, poNumber }: { poId: string; poNumber: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCancel = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/po/${poId}/cancel`, { method: "POST" })
      if (res.ok) {
        toast.success(`PO ${poNumber} berhasil dibatalkan`)
        setOpen(false)
        router.push("/purchase-orders")
        router.refresh()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Gagal membatalkan PO")
      }
    } catch {
      toast.error("Gagal menghubungi server")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
      >
        <XCircle className="w-4 h-4 mr-2" />
        Batalkan PO
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Batalkan PO" variant="destructive">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Anda yakin ingin <strong>membatalkan</strong> PO <strong>{poNumber}</strong>?
          </p>
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3">
            PO yang dibatalkan tidak bisa dikembalikan. Stok dan item tidak akan diproses.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={loading}
            >
              {loading ? "Memproses..." : "Ya, Batalkan"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
