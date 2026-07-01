"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Star } from "lucide-react"

type SupplierFormData = {
  id?: string
  name?: string
  contact?: string | null
  paymentTerms?: string | null
  performanceScore?: number | null
}

type SupplierFormProps = {
  supplier?: SupplierFormData
  onSuccess: () => void
  onCancel: () => void
}

export function SupplierForm({ supplier, onSuccess, onCancel }: SupplierFormProps) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(supplier?.name || "")
  const [contact, setContact] = useState(supplier?.contact || "")
  const [paymentTerms, setPaymentTerms] = useState(supplier?.paymentTerms || "")
  const [performanceScore, setPerformanceScore] = useState(supplier?.performanceScore ?? 5)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Nama supplier wajib diisi")
      return
    }
    setLoading(true)
    try {
      const payload = { name, contact, paymentTerms, performanceScore }
      const res = await fetch(
        supplier?.id ? `/api/suppliers/${supplier.id}` : "/api/suppliers",
        {
          method: supplier?.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      )
      if (res.ok) {
        toast.success(supplier?.id ? `"${name}" berhasil diperbarui` : `"${name}" berhasil ditambahkan`)
        onSuccess()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Terjadi kesalahan")
      }
    } catch {
      toast.error("Gagal menghubungi server")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Nama Supplier *</label>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Contoh: PT Maju Bersama"
          className={!name.trim() ? "border-red-500" : ""}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Kontak (Telepon/Email)</label>
        <Input
          value={contact}
          onChange={e => setContact(e.target.value)}
          placeholder="Contoh: 021-123456 / info@supplier.com"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Termin Pembayaran</label>
        <select
          value={paymentTerms}
          onChange={e => setPaymentTerms(e.target.value)}
          className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">Pilih Termin...</option>
          <option value="Cash">Cash (Tunai)</option>
          <option value="Net 7">Net 7 Hari</option>
          <option value="Net 14">Net 14 Hari</option>
          <option value="Net 30">Net 30 Hari</option>
          <option value="Net 60">Net 60 Hari</option>
          <option value="EOM">End of Month</option>
          <option value="COD">Cash on Delivery</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Skor Performa</label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map(score => (
            <button
              key={score}
              type="button"
              onClick={() => setPerformanceScore(score)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`w-6 h-6 ${score <= performanceScore ? "text-yellow-400 fill-yellow-400" : "text-slate-300"}`}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-slate-500">{performanceScore}/5</span>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Menyimpan..." : supplier?.id ? "Simpan Perubahan" : "Tambah Supplier"}
        </Button>
      </div>
    </form>
  )
}
