"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/Button"
import { AlertCircle } from "lucide-react"

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 p-4">
      <div className="flex max-w-md flex-col items-center rounded-xl bg-white p-8 text-center shadow-sm border border-slate-200">
        <div className="mb-4 rounded-full bg-red-100 p-3 text-red-600">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-slate-900">Terjadi Kesalahan!</h2>
        <p className="mb-6 text-slate-600">
          Maaf, terjadi masalah saat memuat halaman ini. Silakan coba lagi.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => window.location.href = "/"}>Ke Beranda</Button>
          <Button variant="outline" onClick={() => reset()}>
            Coba Lagi
          </Button>
        </div>
      </div>
    </div>
  )
}
