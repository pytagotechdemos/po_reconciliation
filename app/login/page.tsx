"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { motion } from "framer-motion"

const roles = [
  { value: "procurement", label: "Procurement", desc: "Pengadaan & Pembelian", color: "bg-amber-100 text-amber-700" },
  { value: "warehouse", label: "Warehouse", desc: "Penerimaan Barang", color: "bg-emerald-100 text-emerald-700" },
  { value: "finance", label: "Finance", desc: "Keuangan", color: "bg-blue-100 text-blue-700" },
  { value: "owner", label: "Owner", desc: "Pemilik", color: "bg-violet-100 text-violet-700" },
]

export default function LoginPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState("procurement")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      setError("Kata sandi wajib diisi.")
      return
    }
    setLoading(true)
    setError("")

    const res = await signIn("credentials", {
      username: selectedRole,
      password,
      redirect: false,
    })
    console.log("LOGIN RES:", res)

    if (res?.error) {
      setError("Kata sandi salah.")
      setLoading(false)
    } else {
      router.refresh()
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 relative overflow-hidden">
      {/* Animated background blobs */}
      <motion.div
        animate={{ y: [-10, 10, -10], x: [-5, 5, -5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] rounded-full bg-violet-300/20 blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{ y: [10, -10, 10], x: [5, -5, 5] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] rounded-full bg-purple-300/20 blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[60%] left-[10%] w-[20%] h-[20%] rounded-full bg-violet-300/15 blur-[80px] pointer-events-none"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-slate-200/60 overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-purple-700 px-8 py-10 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg mb-4"
            >
              <span className="text-2xl font-black text-white">P</span>
            </motion.div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Pytagotech</h1>
            <p className="text-white/70 mt-1 text-sm font-medium">Sistem Rekonsiliasi PO</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role selector */}
              <div className="space-y-1.5">
                <label htmlFor="role" className="text-sm font-semibold text-slate-700">Masuk sebagai</label>
                <select
                  id="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.75rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.25rem 1.25rem',
                    paddingRight: '2.5rem',
                  }}
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label} — {role.desc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700">Kata Sandi</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-3.5 text-sm font-bold text-white hover:from-violet-700 hover:to-purple-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : "Masuk"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
              &copy; 2026 Pytagotech Internal System
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
