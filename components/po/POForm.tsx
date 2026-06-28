"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { Trash2 } from "lucide-react"

type Supplier = {
  id: string
  name: string
}

export function POForm({ suppliers }: { suppliers: Supplier[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    supplierId: "",
    dateOrdered: new Date().toISOString().split('T')[0],
    dateExpected: "",
  })

  const [items, setItems] = useState([
    { id: 1, itemName: "", unit: "", qty: 1, price: 0 }
  ])

  const addItem = () => {
    setItems([...items, { id: Date.now(), itemName: "", unit: "", qty: 1, price: 0 }])
  }

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const updateItem = (id: number, field: string, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const res = await fetch("/api/po", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          lineItems: items
        })
      })

      if (res.ok) {
        router.push("/purchase-orders")
        router.refresh()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const grandTotal = items.reduce((acc, item) => acc + (Number(item.qty) * Number(item.price)), 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Supplier</label>
          <select 
            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            value={formData.supplierId}
            onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
          >
            <option value="">Pilih Supplier...</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Tgl Dipesan</label>
            <Input 
              type="date" 
              required
              value={formData.dateOrdered}
              onChange={(e) => setFormData({ ...formData, dateOrdered: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Estimasi Tiba</label>
            <Input 
              type="date"
              value={formData.dateExpected}
              onChange={(e) => setFormData({ ...formData, dateExpected: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Line Items</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Barang</TableHead>
              <TableHead className="w-24">Satuan</TableHead>
              <TableHead className="w-24 text-right">Qty</TableHead>
              <TableHead className="w-40 text-right">Harga Satuan</TableHead>
              <TableHead className="w-40 text-right">Total</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Input 
                    required 
                    placeholder="Nama item..." 
                    value={item.itemName}
                    onChange={(e) => updateItem(item.id, "itemName", e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    required 
                    placeholder="Dus/Pack" 
                    value={item.unit}
                    onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    type="number" 
                    min="1" 
                    required 
                    className="text-right"
                    value={item.qty}
                    onChange={(e) => updateItem(item.id, "qty", e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    type="number" 
                    min="0" 
                    required 
                    className="text-right"
                    value={item.price}
                    onChange={(e) => updateItem(item.id, "price", e.target.value)}
                  />
                </TableCell>
                <TableCell className="text-right font-medium align-middle">
                  Rp {(Number(item.qty) * Number(item.price)).toLocaleString("id-ID")}
                </TableCell>
                <TableCell>
                  <button 
                    type="button" 
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex justify-between items-center pt-4">
          <Button type="button" variant="outline" onClick={addItem}>
            + Tambah Item
          </Button>
          <div className="text-right">
            <span className="text-slate-500 mr-4">Grand Total:</span>
            <span className="text-xl font-bold text-slate-900">
              Rp {grandTotal.toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan & Kirim PO"}
        </Button>
      </div>
    </form>
  )
}
