"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

type ItemFormData = {
  id?: string
  sku?: string
  name?: string
  unit?: string
  category?: string | null | undefined
  buyPrice?: number
  sellPrice?: number | null
}

type ItemsFormProps = {
  item?: ItemFormData
  onSuccess: () => void
  onCancel: () => void
}

const CATEGORIES = ["FMCG", "Material", "Souvenir", "ATK", "Snack", "Minuman", "Lainnya"]

export function ItemsForm({ item, onSuccess, onCancel }: ItemsFormProps) {
  const [loading, setLoading] = useState(false)
  const [sku, setSku] = useState(item?.sku || "")
  const [name, setName] = useState(item?.name || "")
  const [unit, setUnit] = useState(item?.unit || "")
  const [category, setCategory] = useState(item?.category || "")
  const [buyPrice, setBuyPrice] = useState(item?.buyPrice?.toString() || "")
  const [sellPrice, setSellPrice] = useState(item?.sellPrice?.toString() || "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sku.trim() || !name.trim() || !unit.trim()) {
      toast.error("SKU, Nama, dan Satuan wajib diisi")
      return
    }
    setLoading(true)
    try {
      const payload = {
        sku,
        name,
        unit,
        category,
        buyPrice: parseFloat(buyPrice) || 0,
        sellPrice: sellPrice ? parseFloat(sellPrice) : undefined,
      }
      const res = await fetch(
        item?.id ? `/api/items/${item.id}` : "/api/items",
        {
          method: item?.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      )
      if (res.ok) {
        toast.success(item?.id ? `"${name}" berhasil diperbarui` : `"${name}" berhasil ditambahkan`)
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">SKU *</label>
          <Input value={sku} onChange={e => setSku(e.target.value)} placeholder="Contoh: BRG-001" disabled={!!item?.id} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Kategori</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Pilih Kategori...</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Nama Barang *</label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Mie Instan Goreng" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Satuan *</label>
        <Input value={unit} onChange={e => setUnit(e.target.value)} placeholder="Contoh: Dus, Pack, Kg, Pcs" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Harga Beli (Rp)</label>
          <Input type="number" min="0" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} placeholder="0" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Harga Jual (Rp)</label>
          <Input type="number" min="0" value={sellPrice} onChange={e => setSellPrice(e.target.value)} placeholder="0" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Menyimpan..." : item?.id ? "Simpan Perubahan" : "Tambah Barang"}
        </Button>
      </div>
    </form>
  )
}
