"use client"

import { Button } from "@/components/ui/Button"
import { Printer } from "lucide-react"

export function PrintButton() {
  const handlePrint = () => {
    window.print()
  }

  return (
    <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
      <Printer className="w-4 h-4" />
      Print / PDF
    </Button>
  )
}
