"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "./Button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

export function Pagination({ totalPages }: { totalPages: number }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  const currentPage = Number(searchParams.get("page")) || 1

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", pageNumber.toString())
    return `${pathname}?${params.toString()}`
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 bg-white border-t border-slate-100">
      <span className="text-xs text-slate-500 font-medium">
        Halaman {currentPage} dari {totalPages}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => replace(createPageURL(1))}
          className="h-8 w-8 p-0"
          title="Halaman pertama"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => replace(createPageURL(currentPage - 1))}
          className="h-8 px-2"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          <span className="text-xs">Prev</span>
        </Button>
        <div className="h-8 px-3 flex items-center text-sm font-semibold text-slate-700">
          {currentPage} / {totalPages}
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => replace(createPageURL(currentPage + 1))}
          className="h-8 px-2"
        >
          <span className="text-xs">Next</span>
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => replace(createPageURL(totalPages))}
          className="h-8 w-8 p-0"
          title="Halaman terakhir"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
