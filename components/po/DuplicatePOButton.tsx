"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Copy } from "lucide-react"

export function DuplicatePOButton({ poId, poNumber }: { poId: string; poNumber: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDuplicate = async () => {
    if (!confirm(`Duplikat PO ${poNumber}?\nPO baru akan dibuat dengan item yang sama.`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/po/${poId}/duplicate`, { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        toast.success(`PO berhasil diduplikat: ${data.poNumber}`)
        router.push("/purchase-orders")
        router.refresh()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Gagal menduplikat PO")
      }
    } catch {
      toast.error("Gagal menghubungi server")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleDuplicate}
      disabled={loading}
      className="hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200"
    >
      <Copy className="w-4 h-4 mr-2" />
      {loading ? "Memproses..." : "Duplikat PO"}
    </Button>
  )
}
