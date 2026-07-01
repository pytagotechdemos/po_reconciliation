"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { DollarSign } from "lucide-react"

export function ReadyToPayButton({ poId }: { poId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    if (!confirm("Tandai PO ini siap bayar?")) return
    setLoading(true)
    try {
      const res = await fetch(`/api/po/${poId}/ready-to-pay`, { method: "POST" })
      if (res.ok) {
        toast.success("PO ditandai siap bayar")
        router.refresh()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Gagal menandai PO siap bayar")
      }
    } catch {
      toast.error("Gagal menghubungi server")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handle} disabled={loading} className="bg-amber-600 hover:bg-amber-700">
      <DollarSign className="w-4 h-4 mr-2" />
      {loading ? "Memproses..." : "Tandai Siap Bayar"}
    </Button>
  )
}
