"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { receiptSchema, ReceiptFormValues } from "@/lib/validations"

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
  const [errorMsg, setErrorMsg] = useState("")
  
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<ReceiptFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(receiptSchema) as any,
    defaultValues: {
      dateReceived: new Date().toISOString().split('T')[0],
      receiverName: "admin_gudang",
      notes: "",
      items: items.map(item => ({
        id: item.id,
        qtyOrdered: Number(item.qtyOrdered),
        qtyReceived: Number(item.qtyOrdered),
        notes: ""
      }))
    }
  })

  const { fields } = useFieldArray({
    control,
    name: "items"
  })

  const watchItems = watch("items")
  const hasDiscrepancy = watchItems.some(i => Number(i.qtyReceived) !== i.qtyOrdered)

  const onSubmit = async (data: ReceiptFormValues) => {
    setLoading(true)
    setErrorMsg("")
    try {
      // Data shape needed by API (which we haven't updated yet, but we will match the old shape for now or update it later)
      // The old API expects: items: { poLineItemId, qtyReceived, priceInvoice, condition }
      // We will map our form data to the expected API shape.
      
      const payload = {
        poId,
        receiptDate: data.dateReceived,
        receivedBy: data.receiverName,
        deliveryNoteNumber: data.notes || "SJ-AUTO",
        items: data.items.map((i, index) => {
          const original = items[index];
          return {
            poLineItemId: i.id,
            itemName: original.itemName,
            qtyOrdered: original.qtyOrdered,
            priceOrdered: original.priceOrdered,
            qtyReceived: Number(i.qtyReceived),
            priceInvoice: original.priceOrdered, // Assuming price doesn't change on receipt for this simplified form
            condition: "OK"
          }
        })
      }

      const res = await fetch("/api/goods-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        router.push(`/purchase-orders/${poId}`)
        router.refresh()
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || "Terjadi kesalahan saat menyimpan");
      }
    } catch (err) {
      console.error(err)
      setErrorMsg("Gagal menghubungi server");
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {errorMsg && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200 text-sm text-red-600 font-medium">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Tanggal Terima</label>
          <Input 
            type="date" 
            {...register("dateReceived")}
            className={errors.dateReceived ? "border-red-500" : ""}
          />
          {errors.dateReceived && <p className="text-red-500 text-xs">{errors.dateReceived.message}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Nama Penerima</label>
          <Input 
            {...register("receiverName")}
            className={errors.receiverName ? "border-red-500" : ""}
          />
          {errors.receiverName && <p className="text-red-500 text-xs">{errors.receiverName.message}</p>}
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => {
              const original = items[index];
              const currentQty = Number(watchItems[index]?.qtyReceived || 0);
              const hasDiff = currentQty !== original.qtyOrdered;

              return (
                <TableRow key={field.id} className={hasDiff ? "bg-amber-50" : ""}>
                  <TableCell className="font-medium">{original.itemName}</TableCell>
                  <TableCell className="text-right">{original.qtyOrdered}</TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      min="0"
                      className={`text-right ${hasDiff ? 'border-amber-400 focus:ring-amber-400' : ''} ${errors.items?.[index]?.qtyReceived ? 'border-red-500' : ''}`}
                      {...register(`items.${index}.qtyReceived` as const)}
                    />
                    {errors.items?.[index]?.qtyReceived && <p className="text-red-500 text-xs text-right mt-1">{errors.items[index]?.qtyReceived?.message}</p>}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        {hasDiscrepancy && (
          <div className="rounded-md bg-amber-50 p-4 border border-amber-200 text-sm text-amber-800 flex items-start gap-3">
            <span className="text-xl leading-none">⚠️</span>
            <p><strong>Perhatian:</strong> Terdapat selisih antara jumlah pesanan dan aktual. PO ini akan ditandai dengan status <strong>DISCREPANCY</strong> dan dilaporkan ke bagian Keuangan.</p>
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
