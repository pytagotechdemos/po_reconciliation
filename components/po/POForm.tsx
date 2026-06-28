"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { Trash2 } from "lucide-react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { poSchema, POFormValues } from "@/lib/validations"

type Supplier = {
  id: string
  name: string
}

export function POForm({ suppliers }: { suppliers: Supplier[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<POFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(poSchema) as any,
    defaultValues: {
      supplierId: "",
      dateOrdered: new Date().toISOString().split('T')[0],
      dateExpected: "",
      lineItems: [
        { itemName: "", unit: "", qty: 1, price: 0 }
      ]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems"
  })

  const watchLineItems = watch("lineItems")
  const grandTotal = watchLineItems.reduce((acc, item) => acc + ((Number(item.qty) || 0) * (Number(item.price) || 0)), 0)

  const onSubmit = async (data: POFormValues) => {
    setLoading(true)
    setErrorMsg("")
    try {
      const res = await fetch("/api/po", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      if (res.ok) {
        router.push("/purchase-orders")
        router.refresh()
      } else {
        const errorData = await res.json()
        setErrorMsg(errorData.error || "Terjadi kesalahan")
      }
    } catch (err) {
      console.error(err)
      setErrorMsg("Gagal menghubungi server")
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
          <label className="text-sm font-medium text-slate-700">Supplier</label>
          <select 
            className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.supplierId ? 'border-red-500' : 'border-slate-300'}`}
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

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Line Items</h3>
        {errors.lineItems?.root && <p className="text-red-500 text-xs">{errors.lineItems.root.message}</p>}
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
            {fields.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Input 
                    placeholder="Nama item..." 
                    {...register(`lineItems.${index}.itemName` as const)}
                    className={errors.lineItems?.[index]?.itemName ? 'border-red-500' : ''}
                  />
                  {errors.lineItems?.[index]?.itemName && <span className="text-[10px] text-red-500">{errors.lineItems[index]?.itemName?.message}</span>}
                </TableCell>
                <TableCell>
                  <Input 
                    placeholder="Dus/Pack" 
                    {...register(`lineItems.${index}.unit` as const)}
                    className={errors.lineItems?.[index]?.unit ? 'border-red-500' : ''}
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    type="number" 
                    min="1" 
                    className={`text-right ${errors.lineItems?.[index]?.qty ? 'border-red-500' : ''}`}
                    {...register(`lineItems.${index}.qty` as const)}
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    type="number" 
                    min="0" 
                    className={`text-right ${errors.lineItems?.[index]?.price ? 'border-red-500' : ''}`}
                    {...register(`lineItems.${index}.price` as const)}
                  />
                </TableCell>
                <TableCell className="text-right font-medium align-middle">
                  Rp {((Number(watchLineItems[index]?.qty) || 0) * (Number(watchLineItems[index]?.price) || 0)).toLocaleString("id-ID")}
                </TableCell>
                <TableCell>
                  <button 
                    type="button" 
                    onClick={() => remove(index)}
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
          <Button type="button" variant="outline" onClick={() => append({ itemName: "", unit: "", qty: 1, price: 0 })}>
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
