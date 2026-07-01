"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { DollarSign } from "lucide-react"

export function ReadyToPayButton({ poId }: { poId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/po/${poId}/ready-to-pay`, { method: "POST" })
      if (res.ok) {
        toast.success("PO ditandai siap bayar")
        setOpen(false)
        router.refresh()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Gagal menandai PO siap bayar")
        setOpen(false)
      }
    } catch {
      toast.error("Gagal menghubungi server")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-amber-600 hover:bg-amber-700">
        <DollarSign className="w-4 h-4 mr-2" />
        Tandai Siap Bayar
      </Button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Tandai PO Siap Bayar">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            PO akan ditandai sebagai <strong>READY_TO_PAY</strong>. Pastikan semua item sudah diterima dan discrepancy sudah diselesaikan.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Batal</Button>
            <Button onClick={handle} disabled={loading} className="bg-amber-600 hover:bg-amber-700">
              {loading ? "Memproses..." : "Ya, Tandai Siap Bayar"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
