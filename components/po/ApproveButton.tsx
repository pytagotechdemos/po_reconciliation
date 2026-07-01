"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { CheckCircle } from "lucide-react"

export function ApproveButton({ poId }: { poId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleApprove = async () => {
    if (!confirm("Setujui PO ini?")) return
    setLoading(true)
    try {
      const res = await fetch(`/api/po/${poId}/approve`, {
        method: "POST",
      })
      if (res.ok) {
        router.refresh()
      } else {
        alert("Gagal menyetujui PO")
      }
    } catch (err) {
      console.error(err)
      alert("Gagal menyetujui PO")
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
