"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Search, Plus, Edit, Trash2, Package, Tag, Box } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { ItemsForm } from "@/components/items/ItemsForm"

type Item = {
  id: string
  sku: string
  name: string
  unit: string
  category: string | null
  buyPrice: string
  sellPrice: string | null
}

type ItemsTableProps = {
  items: Item[]
}

const CATEGORIES = ["FMCG", "Material", "Souvenir", "ATK", "Snack", "Minuman", "Lainnya"]

export function ItemsTable({ items }: ItemsTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editItem, setEditItem] = useState<{
    id: string; sku: string; name: string; unit: string; category: string | null; buyPrice: number; sellPrice: number | null
  } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = items.filter(item => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !categoryFilter || item.category === categoryFilter
    return matchSearch && matchCategory
  })

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/items/${deleteTarget.id}`, { method: "DELETE" })
      if (res.ok) {
        setDeleteTarget(null)
        toast.success(`"${deleteTarget.name}" berhasil dihapus`)
        router.refresh()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Gagal menghapus barang")
      }
    } catch {
      toast.error("Gagal menghubungi server")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari SKU atau Nama..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
          >
            <option value="">Semua Kategori</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Barang
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4 border-b border-slate-200">SKU</th>
                <th className="px-6 py-4 border-b border-slate-200">Nama Barang</th>
                <th className="px-6 py-4 border-b border-slate-200">Kategori</th>
                <th className="px-6 py-4 border-b border-slate-200">Satuan</th>
                <th className="px-6 py-4 border-b border-slate-200 text-right">Harga Beli</th>
                <th className="px-6 py-4 border-b border-slate-200 text-right">Harga Jual</th>
                <th className="px-6 py-4 border-b border-slate-200 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p>Tidak ada barang ditemukan.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-slate-400" />
                        <span>{item.sku}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">{item.name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.category || "Lainnya"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Box className="w-4 h-4 text-slate-400" />
                        <span>{item.unit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      Rp {Number(item.buyPrice).toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4 text-right text-green-600 font-medium">
                      {item.sellPrice ? `Rp ${Number(item.sellPrice).toLocaleString("id-ID")}` : "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => setEditItem({ ...item, buyPrice: Number(item.buyPrice), sellPrice: item.sellPrice ? Number(item.sellPrice) : null })}
                          className="text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-200 text-xs text-slate-500 text-right">
          Menampilkan {filtered.length} dari {items.length} barang
        </div>
      </div>

      {showAddModal && (
        <Modal isOpen onClose={() => setShowAddModal(false)} title="Tambah Barang Baru">
          <ItemsForm
            onSuccess={() => { setShowAddModal(false); router.refresh() }}
            onCancel={() => setShowAddModal(false)}
          />
        </Modal>
      )}

      {editItem && (
        <Modal isOpen onClose={() => setEditItem(null)} title={`Edit Barang: ${editItem.name}`}>
          <ItemsForm
            item={editItem}
            onSuccess={() => { setEditItem(null); router.refresh() }}
            onCancel={() => setEditItem(null)}
          />
        </Modal>
      )}

      {deleteTarget && (
        <Modal isOpen onClose={() => setDeleteTarget(null)} title="Hapus Barang" variant="destructive">
          <p className="text-sm text-slate-600 mb-4">
            Apakah Anda yakin ingin menghapus <strong>{deleteTarget.name}</strong> (SKU: {deleteTarget.sku})?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Menghapus..." : "Ya, Hapus"}
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}
