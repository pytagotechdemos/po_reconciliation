"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Search, X } from "lucide-react"

type Item = {
  sku: string
  name: string
  unit: string
  buyPrice: number | string | { toNumber: () => number }
}

type ItemComboboxProps = {
  items: Item[]
  value: string // SKU
  onChange: (sku: string) => void
  className?: string
  placeholder?: string
}

export function ItemCombobox({ items, value, onChange, className, placeholder = "Cari SKU atau nama..." }: ItemComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedItem = items.find(i => i.sku === value)

  const filtered = query === ""
    ? items.slice(0, 20)
    : items.filter(i =>
        i.sku.toLowerCase().includes(query.toLowerCase()) ||
        i.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 30)

  const handleSelect = (sku: string) => {
    onChange(sku)
    setQuery("")
    setOpen(false)
    setHighlightedIndex(-1)
    inputRef.current?.blur()
  }

  const handleClear = () => {
    onChange("")
    setQuery("")
    setHighlightedIndex(-1)
    inputRef.current?.focus()
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || filtered.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHighlightedIndex(prev => Math.min(prev + 1, filtered.length - 1))
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightedIndex(prev => Math.max(prev - 1, 0))
        break
      case "Enter":
        e.preventDefault()
        if (highlightedIndex >= 0 && filtered[highlightedIndex]) {
          handleSelect(filtered[highlightedIndex].sku)
        }
        break
      case "Escape":
        e.preventDefault()
        setOpen(false)
        setHighlightedIndex(-1)
        break
    }
  }, [open, filtered, highlightedIndex])

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedEl = listRef.current.children[highlightedIndex] as HTMLElement
      if (highlightedEl) {
        highlightedEl.scrollIntoView({ block: "nearest" })
      }
    }
  }, [highlightedIndex])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Element
      if (!target.closest(".item-combobox-root")) {
        setOpen(false)
        setQuery("")
        setHighlightedIndex(-1)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Reset highlight when query changes
  useEffect(() => {
    setHighlightedIndex(-1)
  }, [query])

  return (
    <div ref={containerRef} className={cn("relative item-combobox-root", className)}>
      {value && selectedItem ? (
        <div className="flex items-center gap-2 p-2 bg-violet-50 border border-violet-200 rounded-lg">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-violet-600 truncate">{selectedItem.sku}</p>
            <p className="text-sm font-medium text-slate-800 truncate">{selectedItem.name}</p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded hover:bg-violet-100 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
            aria-label="Hapus pilihan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full h-10 pl-10 pr-4 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white"
            aria-label="Cari barang"
            aria-haspopup="listbox"
            aria-expanded={open}
            autoComplete="off"
          />
        </div>
      )}

      {/* Dropdown results */}
      {open && !value && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-400 text-center">
              Tidak ada barang ditemukan
            </div>
          ) : (
            <ul ref={listRef} className="divide-y divide-slate-100" role="listbox">
              {filtered.map((item, index) => (
                <li key={item.sku} role="option" aria-selected={highlightedIndex === index}>
                  <button
                    type="button"
                    onClick={() => handleSelect(item.sku)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      "w-full px-4 py-3 text-left hover:bg-violet-50 transition-colors flex items-start gap-3",
                      highlightedIndex === index && "bg-violet-50 ring-1 ring-inset ring-violet-300"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.sku}
                        </span>
                        <span className="text-sm font-medium text-slate-800 truncate">
                          {item.name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {item.unit} · Rp {Number(item.buyPrice).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
