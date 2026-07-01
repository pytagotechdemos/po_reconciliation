"use client"

import { Bell, LogOut, Menu } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { useSidebar } from "./SidebarContext"

export function TopBar() {
  const { data: session } = useSession()
  const { toggle, discrepancyCount } = useSidebar()

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/20 bg-white/60 backdrop-blur-md px-4 md:px-8 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <button onClick={toggle} className="md:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <Menu className="h-6 w-6" />
        </button>
        {/* We can put breadcrumbs or search here later */}
      </div>
      <div className="flex items-center gap-6">
        <button className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all duration-200">
          <span className={`absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white ${discrepancyCount > 0 ? "animate-pulse" : "hidden"}`}></span>
          <Bell className="h-5 w-5" />
        </button>

        {session?.user && (
          <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
            <div className="text-sm text-right">
              <p className="font-semibold text-slate-800 tracking-tight">{session.user.name}</p>
              <p className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full capitalize inline-block mt-0.5">{session.user.role}</p>
            </div>
            <button 
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
