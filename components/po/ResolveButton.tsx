"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { CheckCircle, CreditCard, PauseCircle, AlertCircle } from "lucide-react"

type Resolution = "ACCEPTED" | "CREDIT_NOTE" | "HOLD"

const RESOLUTIONS: { value: Resolution; label: string; description: string; icon: React.ElementType; color: string; bg: string }[] = [
  {
    value: "ACCEPTED",
    label: "Terima & Lanjutkan",
    description: "Selisih diterima. PO dilanjutkan ke proses pembayaran.",
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50 border-green-200 hover:bg-green-100",
  },
  {
    value: "CREDIT_NOTE",
    label: "Kredit Note",
    description: "Selisih dicatat sebagai piutang ke supplier. PO tetap bisa dibayar.",
    icon: CreditCard,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200 hover:bg-blue-100",
  },
  {
    value: "HOLD",
    label: "Tahan / Investigasi",
    description: "PO ditahan untuk ditinjau lebih lanjut. Tidak ada aksi pembayaran.",
    icon: PauseCircle,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200 hover:bg-amber-100",
  },
]

export function ResolveButton({ poId }: { poId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Resolution | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const handleResolve = async () => {
    if (!selected) return
    setLoading(true)
    setErrorMsg("")
    try {
      const res = await fetch("/api/resolve-discrepancy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poId, resolution: selected })
      })

      if (res.ok) {
        setOpen(false)
        router.refresh()
      } else {
        const err = await res.json()
        setErrorMsg(err.error || "Terjadi kesalahan")
      }
    } catch {
      setErrorMsg("Gagal menghubungi server")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        <AlertCircle className="w-4 h-4 mr-2" />
        Selesaikan Selisih (Keuangan)
      </Button>

      <Modal isOpen={open} onClose={() => { setOpen(false); setSelected(null); setErrorMsg("") }} title="Pilih Tindakan Penyelesaian">
        <div className="space-y-3">
          {errorMsg && (
            <div className="rounded-md bg-red-50 p-3 border border-red-200 text-sm text-red-600">
              {errorMsg}
            </div>
          )}
          <p className="text-sm text-slate-500 mb-2">
            Pilih bagaimana selisih PO ini akan ditangani:
          </p>
          {RESOLUTIONS.map(opt => {
            const Icon = opt.icon
            return (
              <button
                key={opt.value}
                onClick={() => setSelected(opt.value)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${opt.bg} ${
                  selected === opt.value ? "border-current ring-2 ring-offset-1 ring-slate-400" : "border-transparent"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${opt.color}`} />
                  <div>
                    <p className={`font-semibold ${opt.color}`}>{opt.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{opt.description}</p>
                  </div>
                </div>
              </button>
            )
          })}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={() => { setOpen(false); setSelected(null) }}>
              Batal
            </Button>
            <Button onClick={handleResolve} disabled={!selected || loading}>
              {loading ? "Menyelesaikan..." : "Konfirmasi"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
