"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { ItemCombobox } from "@/components/ui/ItemCombobox"
import { Trash2, AlertCircle } from "lucide-react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const editLineItemSchema = z.object({
  id: z.string().optional(),
  itemName: z.string().min(1, "Nama item wajib diisi"),
  sku: z.string().optional(),
  unit: z.string().min(1, "Satuan wajib diisi"),
  qty: z.coerce.number().min(1, "Minimal 1"),
  price: z.coerce.number().min(0),
})

const editPoSchema = z.object({
  supplierId: z.string().min(1),
  dateOrdered: z.string().min(1),
  dateExpected: z.string().optional(),
  notes: z.string().optional(),
  taxRate: z.coerce.number().min(0).optional(),
  taxAmount: z.coerce.number().min(0).optional(),
  lineItems: z.array(editLineItemSchema).min(1),
})

type EditPOValues = z.infer<typeof editPoSchema>

type Supplier = { id: string; name: string }
type Item = { sku: string; name: string; unit: string; buyPrice: number | string | { toNumber: () => number } }
type LineItem = { id: string; itemName: string; sku: string; unit: string; qty: number; price: number }

type EditPOFormProps = {
  poId: string
  poData: {
    supplierId: string
    supplierName: string
    dateOrdered: string
    dateExpected: string | null
    notes: string
    taxRate: number
    taxAmount: number
    lineItems: LineItem[]
  }
  suppliers: Supplier[]
  items: Item[]
  onCancel: () => void
}

export function EditPOForm({ poId, poData, suppliers, items, onCancel }: EditPOFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<EditPOValues>({
    resolver: zodResolver(editPoSchema) as Parameters<typeof zodResolver>[0] extends never ? never : Parameters<typeof zodResolver>[0] extends infer T ? T extends (...args: unknown[]) => unknown ? Parameters<T>[1] : never : never,
    defaultValues: {
      supplierId: poData.supplierId,
      dateOrdered: poData.dateOrdered,
      dateExpected: poData.dateExpected || "",
      notes: poData.notes || "",
      taxRate: poData.taxRate,
      taxAmount: poData.taxAmount,
      lineItems: poData.lineItems.map(li => ({
        id: li.id,
        itemName: li.itemName,
        sku: li.sku,
        unit: li.unit,
        qty: li.qty,
        price: li.price,
      })),
    }
  })

  const { fields, append, remove } = useFieldArray({ control, name: "lineItems" })
  const watchLineItems = watch("lineItems")
  const watchTaxRate = watch("taxRate") || 0

  const subtotal = watchLineItems.reduce((acc, item) => acc + ((Number(item.qty) || 0) * (Number(item.price) || 0)), 0)
  const taxAmount = (subtotal * watchTaxRate) / 100
  const grandTotal = subtotal + taxAmount

  const handleItemSelect = (index: number, sku: string) => {
    const selectedItem = items.find(i => i.sku === sku)
    if (selectedItem) {
      setValue(`lineItems.${index}.itemName`, selectedItem.name)
      setValue(`lineItems.${index}.sku`, selectedItem.sku)
      setValue(`lineItems.${index}.unit`, selectedItem.unit)
      setValue(`lineItems.${index}.price`, Number(selectedItem.buyPrice))
    }
  }

  const onSubmit = async (data: EditPOValues) => {
    setLoading(true)
    try {
      const currentSubtotal = data.lineItems.reduce((acc, item) => acc + ((Number(item.qty) || 0) * (Number(item.price) || 0)), 0)
      data.taxAmount = (currentSubtotal * (data.taxRate || 0)) / 100

      const res = await fetch(`/api/po/${poId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      if (res.ok) {
        toast.success("PO berhasil diperbarui")
        router.push(`/purchase-orders/${poId}`)
        router.refresh()
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <p className="text-sm text-amber-800">
          Anda sedang mengedit PO ini. Perubahan akan langsung tersimpan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Supplier</label>
          <select
            className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.supplierId ? 'border-red-500' : 'border-slate-300'}`}
            {...register("supplierId")}
          >
            <option value="">Pilih Supplier...</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {errors.supplierId && <p className="text-red-500 text-xs">{errors.supplierId.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Tgl Dipesan</label>
            <Input
              type="date"
              {...register("dateOrdered")}
              className={errors.dateOrdered ? 'border-red-500' : ''}
            />
            {errors.dateOrdered && <p className="text-red-500 text-xs">{errors.dateOrdered.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Estimasi Tiba</label>
            <Input
              type="date"
              {...register("dateExpected")}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Catatan</label>
        <textarea
          {...register("notes")}
          placeholder="Catatan opsional..."
          rows={2}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Barang / Item</h3>
        {errors.lineItems?.root && <p className="text-red-500 text-xs">{errors.lineItems.root.message}</p>}
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead>Pilih Barang (Master Data)</TableHead>
              <TableHead className="w-24">Satuan</TableHead>
              <TableHead className="w-24 text-right">Qty</TableHead>
              <TableHead className="w-40 text-right">Harga Satuan</TableHead>
              <TableHead className="w-40 text-right">Total</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell>
                  <ItemCombobox
                    items={items}
                    value={watchLineItems[index]?.sku || ""}
                    onChange={(sku) => handleItemSelect(index, sku)}
                  />
                  {errors.lineItems?.[index]?.itemName && <p className="text-red-500 text-xs mt-1">{errors.lineItems[index]?.itemName?.message}</p>}
                </TableCell>
                <TableCell>
                  <Input
                    readOnly
                    placeholder="Dus/Pack"
                    {...register(`lineItems.${index}.unit` as const)}
                    className="bg-slate-50"
                    aria-label="Satuan"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="1"
                    className={`text-right ${errors.lineItems?.[index]?.qty ? 'border-red-500' : ''}`}
                    {...register(`lineItems.${index}.qty` as const)}
                    aria-label="Quantity"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    className="text-right"
                    {...register(`lineItems.${index}.price` as const)}
                    aria-label="Harga Satuan"
                  />
                </TableCell>
                <TableCell className="text-right font-medium align-middle">
                  Rp {((Number(watchLineItems[index]?.qty) || 0) * (Number(watchLineItems[index]?.price) || 0)).toLocaleString("id-ID")}
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => fields.length > 1 ? remove(index) : null}
                    disabled={fields.length <= 1}
                    aria-label="Hapus Item"
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex justify-between items-start pt-4">
          <Button type="button" variant="outline" onClick={() => append({ itemName: "", sku: "", unit: "-", qty: 1, price: 0 })}>
            + Tambah Item
          </Button>

          <div className="w-72 space-y-3">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-medium">Rp {subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-2">
                PPN (%)
                <Input
                  type="number"
                  className="w-20 h-8 px-2 py-1 text-right text-sm"
                  {...register("taxRate")}
                />
              </span>
              <span className="font-medium">Rp {taxAmount.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-slate-900 border-t pt-3">
              <span>Grand Total:</span>
              <span>Rp {grandTotal.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>
    </form>
  )
}
