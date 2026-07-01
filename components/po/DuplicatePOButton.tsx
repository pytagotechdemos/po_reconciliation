"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { Copy } from "lucide-react"

export function DuplicatePOButton({ poId, poNumber }: { poId: string; poNumber: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDuplicate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/po/${poId}/duplicate`, { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        toast.success(`PO berhasil diduplikat: ${data.poNumber}`)
        setOpen(false)
        router.push("/purchase-orders")
        router.refresh()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Gagal menduplikat PO")
        setOpen(false)
      }
    } catch {
      toast.error("Gagal menghubungi server")
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200"
      >
        <Copy className="w-4 h-4 mr-2" />
        Duplikat PO
      </Button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Duplikat Purchase Order">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Buat duplikat PO <strong>{poNumber}</strong>? PO baru akan dibuat dengan item yang sama, tanggal hari ini, dan status <em>WAITING_APPROVAL</em>.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Batal</Button>
            <Button onClick={handleDuplicate} disabled={loading}>
              {loading ? "Memproses..." : "Ya, Duplikat"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
