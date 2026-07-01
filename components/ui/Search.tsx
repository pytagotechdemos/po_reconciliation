"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition, useState, useEffect } from "react"
import { Input } from "./Input"
import { Search as SearchIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchProps {
  size?: "sm" | "md" | "lg"
  placeholder?: string
  className?: string
}

const sizeMap = {
  sm: "h-9",
  md: "h-10",
  lg: "h-11",
}

const iconSizeMap = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
}

const paddingMap = {
  sm: "pl-9 pr-9",
  md: "pl-10 pr-10",
  lg: "pl-11 pr-11",
}

export function Search({ size = "md", placeholder = "Cari...", className }: SearchProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()
  const [isPending, startTransition] = useTransition()
  const [term, setTerm] = useState(searchParams.get("q")?.toString() || "")

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams)
      params.set("page", "1")
      if (term) {
        params.set("q", term)
      } else {
        params.delete("q")
      }
      startTransition(() => {
        replace(`${pathname}?${params.toString()}`)
      })
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [term, pathname, replace, searchParams])

  return (
    <div className={cn("relative w-full", size === "sm" ? "max-w-xs" : "max-w-sm", className)}>
      <div className={cn("absolute inset-y-0 left-0 flex items-center pointer-events-none", size === "sm" ? "pl-3" : size === "lg" ? "pl-4" : "pl-3.5")}>
        <SearchIcon className={cn(iconSizeMap[size], "text-slate-400")} />
      </div>
      <Input
        type="search"
        placeholder={placeholder}
        className={cn(
          paddingMap[size],
          sizeMap[size],
          "placeholder:text-slate-400"
        )}
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      {term && (
        <button
          onClick={() => setTerm("")}
          className={cn(
            "absolute inset-y-0 right-0 flex items-center text-slate-400 hover:text-slate-600 transition-colors",
            size === "sm" ? "pr-3" : size === "lg" ? "pr-4" : "pr-3"
          )}
        >
          <X className={iconSizeMap[size]} />
        </button>
      )}
      {isPending && (
        <div className={cn(
          "absolute inset-y-0 right-0 flex items-center",
          size === "sm" ? "pr-3" : size === "lg" ? "pr-4" : "pr-3"
        )}>
          <div className={cn("border-2 border-slate-200 border-t-violet-600 rounded-full animate-spin", size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} />
        </div>
      )}
    </div>
  )
}
