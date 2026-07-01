"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { CheckCircle } from "lucide-react"

export function ApproveButton({ poId }: { poId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleApprove = async () => {
    if (!confirm("Setujui PO ini?")) return
    setLoading(true)
    try {
      const res = await fetch(`/api/po/${poId}/approve`, { method: "POST" })
      if (res.ok) {
        toast.success("PO berhasil disetujui")
        router.refresh()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Gagal menyetujui PO")
      }
    } catch {
      toast.error("Gagal menghubungi server")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleApprove} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
      <CheckCircle className="w-4 h-4 mr-2" />
      {loading ? "Memproses..." : "Setujui PO"}
    </Button>
  )
}
