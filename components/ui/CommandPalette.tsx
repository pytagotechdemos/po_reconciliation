"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Calculator,
  Settings,
  Package,
  ShoppingCart,
  Truck
} from "lucide-react"

import { Command } from "cmdk"

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
      <Command 
        className="w-[90vw] max-w-[640px] bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200"
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false)
        }}
      >
        <Command.Input 
          autoFocus
          placeholder="Type a command or search..." 
          className="w-full px-4 py-4 text-lg border-b border-slate-100 outline-none text-slate-800 placeholder:text-slate-400"
        />
        <Command.List className="max-h-[300px] overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-slate-500">
            No results found.
          </Command.Empty>

          <Command.Group heading="Navigation" className="text-xs font-medium text-slate-500 px-2 py-1">
            <Command.Item 
              onSelect={() => runCommand(() => router.push("/dashboard"))}
              className="flex items-center px-2 py-3 rounded-md cursor-pointer hover:bg-slate-100 text-slate-700 text-sm aria-selected:bg-slate-100 aria-selected:text-violet-700"
            >
              <Calculator className="mr-2 h-4 w-4" />
              Dashboard
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => router.push("/purchase-orders"))}
              className="flex items-center px-2 py-3 rounded-md cursor-pointer hover:bg-slate-100 text-slate-700 text-sm aria-selected:bg-slate-100 aria-selected:text-violet-700"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Purchase Orders
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => router.push("/goods-receipts"))}
              className="flex items-center px-2 py-3 rounded-md cursor-pointer hover:bg-slate-100 text-slate-700 text-sm aria-selected:bg-slate-100 aria-selected:text-violet-700"
            >
              <Package className="mr-2 h-4 w-4" />
              Goods Receipts
            </Command.Item>
          </Command.Group>

          <Command.Separator className="h-px bg-slate-100 my-1" />

          <Command.Group heading="Master Data" className="text-xs font-medium text-slate-500 px-2 py-1">
            <Command.Item 
              onSelect={() => runCommand(() => router.push("/suppliers"))}
              className="flex items-center px-2 py-3 rounded-md cursor-pointer hover:bg-slate-100 text-slate-700 text-sm aria-selected:bg-slate-100 aria-selected:text-violet-700"
            >
              <Truck className="mr-2 h-4 w-4" />
              Suppliers
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => router.push("/items"))}
              className="flex items-center px-2 py-3 rounded-md cursor-pointer hover:bg-slate-100 text-slate-700 text-sm aria-selected:bg-slate-100 aria-selected:text-violet-700"
            >
              <Package className="mr-2 h-4 w-4" />
              Items
            </Command.Item>
          </Command.Group>

          <Command.Separator className="h-px bg-slate-100 my-1" />

          <Command.Group heading="Settings" className="text-xs font-medium text-slate-500 px-2 py-1">
            <Command.Item 
              onSelect={() => runCommand(() => router.push("/settings"))}
              className="flex items-center px-2 py-3 rounded-md cursor-pointer hover:bg-slate-100 text-slate-700 text-sm aria-selected:bg-slate-100 aria-selected:text-violet-700"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  )
}
