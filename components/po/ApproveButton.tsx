"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { CheckCircle } from "lucide-react"

export function ApproveButton({ poId }: { poId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleApprove = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/po/${poId}/approve`, { method: "POST" })
      if (res.ok) {
        toast.success("PO berhasil disetujui")
        setOpen(false)
        router.refresh()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Gagal menyetujui PO")
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
      <Button onClick={() => setOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
        <CheckCircle className="w-4 h-4 mr-2" />
        Setujui PO
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Setujui Purchase Order">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-800">Konfirmasi Persetujuan</p>
              <p className="text-sm text-emerald-700 mt-1">
                PO akan disetujui dan statusnya diubah menjadi <strong>SENT</strong>.
                Tindakan ini tidak bisa dibatalkan.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Batal
            </Button>
            <Button
              onClick={handleApprove}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? "Memproses..." : "Ya, Setujui"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
