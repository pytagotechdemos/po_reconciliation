"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { UserForm } from "@/components/users/UserForm"
import { User, Plus, Edit, Trash2, ShieldCheck } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

type UserData = {
  id: string
  username: string
  name: string
  role: string
  createdAt: Date | string
}

type UsersTableProps = {
  initialUsers: UserData[]
}

const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
  owner: { label: "Owner", color: "text-violet-700", bg: "bg-violet-100" },
  procurement: { label: "Procurement", color: "text-amber-700", bg: "bg-amber-100" },
  finance: { label: "Finance", color: "text-blue-700", bg: "bg-blue-100" },
  warehouse: { label: "Warehouse", color: "text-emerald-700", bg: "bg-emerald-100" },
}

export function UsersTable({ initialUsers }: UsersTableProps) {
  const router = useRouter()
  const [users, setUsers] = useState<UserData[]>(initialUsers)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editUser, setEditUser] = useState<UserData | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, { method: "DELETE" })
      if (res.ok) {
        setDeleteTarget(null)
        setUsers(prev => prev.filter(u => u.id !== deleteTarget.id))
        toast.success(`"${deleteTarget.name}" berhasil dihapus`)
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Gagal menghapus user")
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
        <div className="p-4 border-b border-slate-200 flex justify-end">
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah User
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4 border-b border-slate-200">Nama</th>
                <th className="px-6 py-4 border-b border-slate-200">Username</th>
                <th className="px-6 py-4 border-b border-slate-200">Role</th>
                <th className="px-6 py-4 border-b border-slate-200">Dibuat</th>
                <th className="px-6 py-4 border-b border-slate-200 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <User className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p>Belum ada user.</p>
                  </td>
                </tr>
              ) : (
                users.map(u => {
                  const cfg = roleConfig[u.role] || roleConfig.procurement
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white",
                            u.role === "owner" ? "bg-gradient-to-br from-violet-500 to-purple-600"
                            : u.role === "procurement" ? "bg-gradient-to-br from-amber-500 to-orange-500"
                            : u.role === "finance" ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                            : "bg-gradient-to-br from-emerald-500 to-teal-600"
                          )}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-900">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">@{u.username}</code>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold", cfg.bg, cfg.color)}>
                          <ShieldCheck className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {format(new Date(u.createdAt), "dd MMM yyyy")}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => setEditUser(u)}
                            className="text-slate-400 hover:text-blue-600 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(u)}
                            className="text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-200 text-xs text-slate-500">
          {users.length} user(s)
        </div>
      </div>

      {showAddModal && (
        <Modal isOpen onClose={() => setShowAddModal(false)} title="Tambah User Baru">
          <UserForm
            onSuccess={() => { setShowAddModal(false); router.refresh() }}
            onCancel={() => setShowAddModal(false)}
          />
        </Modal>
      )}

      {editUser && (
        <Modal isOpen onClose={() => setEditUser(null)} title={`Edit User: ${editUser.name}`}>
          <UserForm
            user={editUser}
            onSuccess={() => {
              setEditUser(null)
              router.refresh()
            }}
            onCancel={() => setEditUser(null)}
          />
        </Modal>
      )}

      {deleteTarget && (
        <Modal isOpen onClose={() => setDeleteTarget(null)} title="Hapus User" variant="destructive">
          <p className="text-sm text-slate-600 mb-4">
            Hapus user <strong>{deleteTarget.name}</strong> ({deleteTarget.role})? Aksi ini tidak bisa dibatalkan.
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
