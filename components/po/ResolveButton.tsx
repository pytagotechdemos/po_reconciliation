"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"

export function ResolveButton({ poId }: { poId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleResolve = async () => {
    if (!confirm("Apakah Anda yakin ingin menyelesaikan selisih dan menandai PO ini sebagai dibayar (PAID)?")) return;
    
    setLoading(true)
    try {
      const res = await fetch("/api/resolve-discrepancy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poId })
      })

      if (res.ok) {
        router.refresh()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="destructive" onClick={handleResolve} disabled={loading}>
      {loading ? "Menyelesaikan..." : "Selesaikan Selisih (Keuangan)"}
    </Button>
  )
}
