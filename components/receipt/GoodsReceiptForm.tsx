"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { receiptSchema, ReceiptFormValues } from "@/lib/validations"
import { useSession } from "next-auth/react"

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
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [sjDuplicateWarning, setSjDuplicateWarning] = useState<string | null>(null)

  const { register, control, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<ReceiptFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(receiptSchema) as any,
    defaultValues: {
      dateReceived: "",
      receiverName: session?.user?.name || "",
      deliveryNoteNumber: null,
      notes: "",
      expiryDate: "",
      photoUrl: "",
      items: items.map(item => ({
        id: item.id,
        qtyOrdered: Number(item.qtyOrdered),
        qtyReceived: Math.max(0, Number(item.qtyOrdered) - Number(item.qtyReceived || 0)),
        priceInvoice: item.priceInvoice ?? Number(item.priceOrdered),
        condition: item.condition ?? "OK",
        notes: ""
      }))
    }
  })

  useEffect(() => {
    if (!getValues("dateReceived")) {
      const d = new Date()
      setValue("dateReceived", `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)
    }
  }, [getValues, setValue])

  const { fields } = useFieldArray({
    control,
    name: "items"
  })

  const watchItems = watch("items")
  const hasDiscrepancy = watchItems.some(i => Number(i.qtyReceived) !== i.qtyOrdered)
  const hasOverDelivery = watchItems.some((i, idx) => {
    const original = items[idx]
    return Number(i.qtyReceived) > original.qtyOrdered
  })

  // Debounced duplicate delivery note check
  const checkDuplicateSJ = useCallback(async (sj: string) => {
    if (!sj.trim()) { setSjDuplicateWarning(null); return }
    try {
      const res = await fetch(`/api/goods-receipt/check-duplicate?poId=${poId}&sj=${encodeURIComponent(sj)}`)
      if (res.ok) {
        const data = await res.json()
        setSjDuplicateWarning(data.isDuplicate ? "⚠️ Surat jalan ini sudah pernah diinput untuk PO ini!" : null)
      }
    } catch { /* ignore */ }
  }, [poId])

  const sjDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const watchSj = watch("deliveryNoteNumber")
  useEffect(() => {
    if (sjDebounceRef.current) clearTimeout(sjDebounceRef.current)
    sjDebounceRef.current = setTimeout(() => checkDuplicateSJ(watchSj || ""), 500)
    return () => { if (sjDebounceRef.current) clearTimeout(sjDebounceRef.current) }
  }, [watchSj, checkDuplicateSJ])

  const onSubmit = async (data: ReceiptFormValues) => {
    setLoading(true)
    try {
      const payload = {
        poId,
        receiptDate: data.dateReceived,
        receivedBy: data.receiverName,
        deliveryNoteNumber: data.deliveryNoteNumber || null,
        expiryDate: data.expiryDate,
        photoUrl: data.photoUrl,
        items: data.items.map((i, index) => {
          const original = items[index];
          return {
            poLineItemId: i.id,
            qtyReceived: Number(i.qtyReceived),
            priceInvoice: i.priceInvoice ?? original.priceOrdered,
            condition: i.condition || "OK"
          }
        })
      }

      const res = await fetch("/api/goods-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success("Penerimaan barang berhasil disimpan")
        router.push(`/purchase-orders/${poId}`)
        router.refresh()
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || "Terjadi kesalahan saat menyimpan");
      }
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

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
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">No. Surat Jalan (Delivery Note)</label>
          <Input
            type="text"
            placeholder="Contoh: SJ-20260701-001"
            {...register("deliveryNoteNumber")}
          />
          {sjDuplicateWarning && (
            <p className="text-amber-600 text-xs font-medium">{sjDuplicateWarning}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Tanggal Kadaluarsa (Opsional)</label>
          <Input
            type="date"
            {...register("expiryDate")}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Foto Surat Jalan</label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                const reader = new FileReader()
                reader.onloadend = () => {
                  setValue("photoUrl", reader.result as string)
                }
                reader.readAsDataURL(file)
              } else {
                setValue("photoUrl", "")
              }
            }}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Konfirmasi Item</h3>
          <Table className="min-w-[600px]">
            <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Qty (PO)</TableHead>
              <TableHead className="text-right">Harga (PO)</TableHead>
              <TableHead className="text-right">Qty Aktual</TableHead>
              <TableHead className="text-right">Harga Invoice (per unit)</TableHead>
              <TableHead className="text-center">Kondisi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => {
              const original = items[index];
              const currentQty = Number(watchItems[index]?.qtyReceived || 0);
              const isOverDelivery = currentQty > original.qtyOrdered;
              const isUnderDelivery = currentQty < original.qtyOrdered && currentQty > 0;
              const hasDiff = currentQty !== original.qtyOrdered;

              return (
                <TableRow key={field.id} className={isOverDelivery ? "bg-red-50" : hasDiff ? "bg-amber-50" : ""}>
                  <TableCell className="font-medium">{original.itemName}</TableCell>
                  <TableCell className="text-right">{original.qtyOrdered} {original.unit}</TableCell>
                  <TableCell className="text-right text-slate-500 text-sm">
                    Rp {Number(original.priceOrdered).toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      className={`text-right ${isOverDelivery ? 'border-red-400 focus:ring-red-400' : isUnderDelivery ? 'border-amber-400 focus:ring-amber-400' : ''} ${errors.items?.[index]?.qtyReceived ? 'border-red-500' : ''}`}
                      {...register(`items.${index}.qtyReceived` as const)}
                      aria-label="Qty Aktual"
                    />
                    {isOverDelivery && (
                      <p className="text-red-500 text-xs text-right mt-1 font-medium">
                        ⚠️ Melebihi jumlah pesanan (+{currentQty - original.qtyOrdered})
                      </p>
                    )}
                    {errors.items?.[index]?.qtyReceived && <p className="text-red-500 text-xs text-right mt-1">{errors.items[index]?.qtyReceived?.message}</p>}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="text-right"
                      {...register(`items.${index}.priceInvoice` as const)}
                      aria-label="Harga Invoice"
                    />
                  </TableCell>
                  <TableCell>
                    <select
                      className="rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500"
                      {...register(`items.${index}.condition` as const)}
                      aria-label="Kondisi"
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
        {hasOverDelivery && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200 text-sm text-red-800 flex items-start gap-3">
            <span className="text-xl leading-none">🚫</span>
            <p><strong>Perhatian:</strong> Terdapat item yang melebihi jumlah pesanan. PO ini akan ditandai <strong>DISCREPANCY</strong> dan harus ditinjau oleh Keuangan.</p>
          </div>
        )}
        {hasDiscrepancy && !hasOverDelivery && (
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
