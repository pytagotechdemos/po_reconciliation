"use client"

import { Button } from "@/components/ui/Button"
import { Download } from "lucide-react"
import Papa from "papaparse"

export function ExportButton({ data, filename, label = "Export CSV" }: { data: Record<string, string | number | null | undefined>[], filename: string, label?: string }) {
  const handleExport = () => {
    if (data.length === 0) return;
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
      <Download className="w-4 h-4" />
      {label}
    </Button>
  )
}
