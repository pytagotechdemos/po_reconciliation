"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Trash2, Loader2 } from "lucide-react"

export function VoidReceiptButton({ receiptId, role }: { receiptId: string, role: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Only Warehouse and Owner can void
  if (role !== "warehouse" && role !== "owner") return null

  const handleVoid = async () => {
    if (!confirm("Yakin ingin membatalkan (void) penerimaan ini? Aksi ini akan mengembalikan status PO dan menghapus stok yang diterima.")) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/goods-receipt/${receiptId}`, {
        method: "DELETE",
      })
      
      if (res.ok) {
        toast.success("Penerimaan barang berhasil dibatalkan")
        router.refresh()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Gagal membatalkan penerimaan")
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleVoid} 
      disabled={loading}
      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
    >
      {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
      Batal
    </Button>
  )
}
