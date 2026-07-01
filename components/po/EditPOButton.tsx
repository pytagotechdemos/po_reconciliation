"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { EditPOForm } from "@/components/po/EditPOForm"
import { Edit } from "lucide-react"

type Supplier = { id: string; name: string }
type Item = { sku: string; name: string; unit: string; buyPrice: number | string | { toNumber: () => number } }

type LineItem = {
  id: string
  itemName: string
  sku: string
  unit: string
  qty: number
  price: number
}

type PODetail = {
  id: string
  supplierId: string
  supplierName: string
  dateOrdered: string
  dateExpected: string | null
  notes: string
  taxRate: number
  taxAmount: number
  lineItems: LineItem[]
}

type EditPOButtonProps = {
  poId: string
  suppliers: Supplier[]
  items: Item[]
}

export function EditPOButton({ poId, suppliers, items }: EditPOButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [poData, setPoData] = useState<PODetail | null>(null)

  const handleOpen = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/po/${poId}`)
      if (res.ok) {
        const data = await res.json()
        setPoData(data)
        setOpen(true)
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Gagal mengambil data PO")
      }
    } catch {
      toast.error("Gagal menghubungi server")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={handleOpen}
        disabled={loading}
        className="hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200"
      >
        <Edit className="w-4 h-4 mr-2" />
        {loading ? "Memuat..." : "Edit PO"}
      </Button>

      {open && poData && (
        <Modal
          isOpen
          onClose={() => { setOpen(false); setPoData(null) }}
          title={`Edit PO: ${poData.id}`}
          size="xl"
        >
          <EditPOForm
            poId={poId}
            poData={poData}
            suppliers={suppliers}
            items={items}
            onCancel={() => { setOpen(false); setPoData(null) }}
          />
        </Modal>
      )}
    </>
  )
}
