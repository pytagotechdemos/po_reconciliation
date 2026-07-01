"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

type User = {
  id: string
  username: string
  name: string
  role: string
}

type UserFormProps = {
  user?: User
  onSuccess: () => void
  onCancel: () => void
}

const ROLES = [
  { value: "owner", label: "Owner", description: "Akses penuh ke semua fitur" },
  { value: "procurement", label: "Procurement", description: "Membuat dan mengelola PO" },
  { value: "finance", label: "Finance", description: "Mengelola invoice dan pembayaran" },
  { value: "warehouse", label: "Warehouse", description: "Input penerimaan barang" },
]

export function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState(user?.username || "")
  const [name, setName] = useState(user?.name || "")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState(user?.role || "procurement")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !name.trim()) {
      toast.error("Username dan Nama wajib diisi")
      return
    }
    if (!user && !password.trim()) {
      toast.error("Password wajib diisi untuk user baru")
      return
    }
    if (password && password.length < 6) {
      toast.error("Password minimal 6 karakter")
      return
    }

    setLoading(true)
    try {
      const payload: Record<string, string> = { name: name.trim(), role }
      if (username.trim()) payload.username = username.trim()
      if (password.trim()) payload.password = password.trim()

      const res = await fetch(
        user ? `/api/users/${user.id}` : "/api/users",
        {
          method: user ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      )
      if (res.ok) {
        toast.success(user ? `"${name}" berhasil diperbarui` : `"${name}" berhasil dibuat`)
        onSuccess()
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Username *</label>
        <Input
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Contoh: budi.procurement"
          disabled={!!user?.id}
          className={!!user?.id ? "bg-slate-50 cursor-not-allowed" : ""}
        />
        {user?.id && <p className="text-xs text-slate-400">Username tidak bisa diubah</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Nama Lengkap *</label>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Contoh: Budi Santoso"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          {user ? "Password Baru (opsional)" : "Password *"}
        </label>
        <Input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder={user ? "Kosongkan jika tidak diubah" : "Minimal 6 karakter"}
        />
        {user && <p className="text-xs text-slate-400">Isi hanya jika ingin mengubah password</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Role / Peran</label>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map(r => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                role === r.value
                  ? r.value === "owner" ? "border-violet-500 bg-violet-50"
                  : r.value === "procurement" ? "border-amber-500 bg-amber-50"
                  : r.value === "finance" ? "border-blue-500 bg-blue-50"
                  : "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <p className={`text-sm font-semibold ${
                role === r.value
                  ? r.value === "owner" ? "text-violet-700"
                  : r.value === "procurement" ? "text-amber-700"
                  : r.value === "finance" ? "text-blue-700"
                  : "text-emerald-700"
                  : "text-slate-700"
              }`}>{r.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{r.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Menyimpan..." : user ? "Simpan Perubahan" : "Buat User"}
        </Button>
      </div>
    </form>
  )
}
