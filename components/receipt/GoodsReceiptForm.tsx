"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
export type SerializedLineItem = {
  id: string
  poId: string
  itemName: string
  unit: string
  qtyOrdered: number
  qtyReceived: number | null
  priceOrdered: number
  priceInvoice: number | null
  condition: string | null
}

export function GoodsReceiptForm({ poId, items }: { poId: string, items: SerializedLineItem[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    receiptDate: new Date().toISOString().split('T')[0],
    receivedBy: "admin_gudang",
    deliveryNoteNumber: "",
  })

  const [receiptItems, setReceiptItems] = useState(
    items.map(item => ({
      poLineItemId: item.id,
      itemName: item.itemName,
      qtyOrdered: Number(item.qtyOrdered),
      priceOrdered: Number(item.priceOrdered),
      qtyReceived: Number(item.qtyOrdered), // default receive full
      priceInvoice: Number(item.priceOrdered), // default same price
      condition: "OK"
    }))
  )

  const updateItem = (id: string, field: string, value: string | number) => {
    setReceiptItems(receiptItems.map(item => 
      item.poLineItemId === id ? { ...item, [field]: value } : item
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const res = await fetch("/api/goods-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poId,
          ...formData,
          items: receiptItems
        })
      })

      if (res.ok) {
        router.push(`/purchase-orders/${poId}`)
        router.refresh()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Tanggal Terima</label>
          <Input 
            type="date" 
            required
            value={formData.receiptDate}
            onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Nomor Surat Jalan</label>
          <Input 
            required
            placeholder="SJ-XXXXX"
            value={formData.deliveryNoteNumber}
            onChange={(e) => setFormData({ ...formData, deliveryNoteNumber: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Konfirmasi Item</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Qty (PO)</TableHead>
              <TableHead className="text-right">Qty Aktual</TableHead>
              <TableHead className="text-right">Harga Aktual</TableHead>
              <TableHead>Kondisi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receiptItems.map((item) => {
              const hasQtyDiff = item.qtyReceived !== item.qtyOrdered;
              const hasPriceDiff = item.priceInvoice !== item.priceOrdered;

              return (
                <TableRow key={item.poLineItemId} className={(hasQtyDiff || hasPriceDiff) ? "bg-amber-50" : ""}>
                  <TableCell className="font-medium">{item.itemName}</TableCell>
                  <TableCell className="text-right">{item.qtyOrdered}</TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      min="0"
                      required
                      className={`text-right ${hasQtyDiff ? 'border-amber-400 focus:ring-amber-400' : ''}`}
                      value={item.qtyReceived}
                      onChange={(e) => updateItem(item.poLineItemId, "qtyReceived", Number(e.target.value))}
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      min="0"
                      required
                      className={`text-right ${hasPriceDiff ? 'border-amber-400 focus:ring-amber-400' : ''}`}
                      value={item.priceInvoice}
                      onChange={(e) => updateItem(item.poLineItemId, "priceInvoice", Number(e.target.value))}
                    />
                  </TableCell>
                  <TableCell>
                    <select 
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={item.condition}
                      onChange={(e) => updateItem(item.poLineItemId, "condition", e.target.value)}
                    >
                      <option value="OK">OK</option>
                      <option value="DAMAGED">Rusak</option>
                      <option value="SHORT">Kurang</option>
                    </select>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        {(receiptItems.some(i => i.qtyReceived !== i.qtyOrdered || i.priceInvoice !== i.priceOrdered)) && (
          <div className="rounded-md bg-amber-50 p-4 border border-amber-200 text-sm text-amber-800 flex items-start gap-3">
            <span className="text-xl leading-none">⚠️</span>
            <p><strong>Perhatian:</strong> Terdapat selisih antara jumlah pesanan dan aktual, atau harga faktur. PO ini akan ditandai dengan status <strong>DISCREPANCY</strong> dan dilaporkan ke bagian Keuangan jika Anda menyimpannya.</p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan Penerimaan"}
        </Button>
      </div>
    </form>
  )
}
