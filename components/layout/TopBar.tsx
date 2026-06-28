"use client"

import { Bell, LogOut } from "lucide-react"
import { useSession, signOut } from "next-auth/react"

export function TopBar() {
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-8">
      <div className="flex-1">
        {/* We can put breadcrumbs or search here later */}
      </div>
      <div className="flex items-center gap-6">
        <button className="relative p-2 text-slate-400 hover:text-slate-500 transition-colors">
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
          <Bell className="h-5 w-5" />
        </button>

        {session?.user && (
          <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
            <div className="text-sm text-right">
              <p className="font-medium text-slate-700">{session.user.name}</p>
              <p className="text-xs text-slate-500 capitalize">{session.user.role}</p>
            </div>
            <button 
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 text-slate-400 hover:text-red-600 transition-colors"
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
