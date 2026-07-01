"use client"

import { Bell, LogOut, Menu, ChevronDown } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { useSidebar } from "./SidebarContext"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

export function TopBar() {
  const { data: session } = useSession()
  const { toggle } = useSidebar()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const roleColors: Record<string, string> = {
    owner: "bg-violet-100 text-violet-700",
    finance: "bg-blue-100 text-blue-700",
    warehouse: "bg-emerald-100 text-emerald-700",
    procurement: "bg-amber-100 text-amber-700",
  }

  const roleLabels: Record<string, string> = {
    owner: "Owner",
    finance: "Finance",
    warehouse: "Warehouse",
    procurement: "Procurement",
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 lg:px-8 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={toggle}
          className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notification bell */}
        <button className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors" title="Notifikasi">
          <Bell className="h-5 w-5" />
        </button>

        {/* User menu */}
        {session?.user && (
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen(p => !p)}
              className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-slate-200"
            >
              {/* Avatar */}
              <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs font-bold shadow-sm">
                {session.user.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="hidden xs:block text-sm text-left">
                <p className="font-semibold text-slate-800 leading-tight">{session.user.name}</p>
                <span className={cn(
                  "text-[11px] font-semibold px-1.5 py-0.5 rounded-full capitalize",
                  roleColors[session.user.role || ""] || "bg-slate-100 text-slate-600"
                )}>
                  {roleLabels[session.user.role || ""] || session.user.role}
                </span>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform hidden sm:block", menuOpen && "rotate-180")} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Signed in as</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{session.user.name}</p>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/login" }) }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
