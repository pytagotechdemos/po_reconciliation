"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Plus, Building2, Phone, CreditCard, Star, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { SupplierForm } from "@/components/supplier/SupplierForm"

type Supplier = {
  id: string
  name: string
  contact: string | null
  paymentTerms: string | null
  performanceScore: number | null
}

export function SuppliersTable({ suppliers }: { suppliers: Supplier[] }) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editSupplier, setEditSupplier] = useState<{
    id: string; name: string; contact: string | null; paymentTerms: string | null; performanceScore: number | null
  } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contact || "").toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/suppliers/${deleteTarget.id}`, { method: "DELETE" })
      if (res.ok) {
        setDeleteTarget(null)
        router.refresh()
      } else {
        const err = await res.json()
        alert(err.error || "Gagal menghapus supplier")
      }
    } catch {
      alert("Gagal menghubungi server")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama supplier..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Supplier
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4 border-b border-slate-200">Nama Supplier</th>
                <th className="px-6 py-4 border-b border-slate-200">Kontak</th>
                <th className="px-6 py-4 border-b border-slate-200">Termin Pembayaran</th>
                <th className="px-6 py-4 border-b border-slate-200">Performa</th>
                <th className="px-6 py-4 border-b border-slate-200 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p>Tidak ada supplier ditemukan.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(supplier => (
                  <tr key={supplier.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <span>{supplier.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>{supplier.contact || "-"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-slate-400" />
                        <span>{supplier.paymentTerms || "-"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i <= (supplier.performanceScore || 0) ? "text-yellow-400 fill-yellow-400" : "text-slate-300"}`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => setEditSupplier(supplier)}
                          className="text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(supplier)}
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
        <div className="p-4 border-t border-slate-200 text-xs text-slate-500">
          Menampilkan {filtered.length} dari {suppliers.length} supplier
        </div>
      </div>

      {showAddModal && (
        <Modal isOpen onClose={() => setShowAddModal(false)} title="Tambah Supplier Baru">
          <SupplierForm
            onSuccess={() => { setShowAddModal(false); router.refresh() }}
            onCancel={() => setShowAddModal(false)}
          />
        </Modal>
      )}

      {editSupplier && (
        <Modal isOpen onClose={() => setEditSupplier(null)} title={`Edit Supplier: ${editSupplier.name}`}>
          <SupplierForm
            supplier={editSupplier}
            onSuccess={() => { setEditSupplier(null); router.refresh() }}
            onCancel={() => setEditSupplier(null)}
          />
        </Modal>
      )}

      {deleteTarget && (
        <Modal isOpen onClose={() => setDeleteTarget(null)} title="Hapus Supplier" variant="destructive">
          <p className="text-sm text-slate-600 mb-4">
            Apakah Anda yakin ingin menghapus supplier <strong>{deleteTarget.name}</strong>?
          </p>
          <p className="text-xs text-slate-400 mb-6">
            Supplier tidak bisa dihapus jika masih memiliki Purchase Order aktif.
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
