"use client";

import Link from "next/link"
import { ClipboardList, PackagePlus, Truck, AlertCircle, BarChart3, Settings, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react"

export function Sidebar({ className }: { className?: string }) {
  const { data: session } = useSession();
  const role = session?.user?.role;
  
  // Dummy discrepancy count for now
  const discrepancyCount = 1;

  return (
    <aside className={cn("fixed left-0 top-0 z-40 h-screen w-60 border-r border-slate-200 bg-white", className)}>
      <div className="flex h-16 items-center border-b border-slate-200 px-6">
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">Sidoarjo Grosir</h1>
      </div>
      
      <div className="flex flex-col justify-between h-[calc(100vh-4rem)]">
        <div className="px-4 py-6 space-y-6">
          
          <div className="space-y-1">
            <Link href="/dashboard" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
              <ClipboardList className="h-5 w-5 text-slate-500" />
              Dashboard
            </Link>
            
            {/* PROCUREMENT ONLY */}
            {(role === 'procurement' || !role) && (
              <>
                <div className="pt-4 pb-2">
                  <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Purchase Order</h3>
                </div>
                
                <Link href="/purchase-orders" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                  <ClipboardList className="h-5 w-5 text-slate-500" />
                  Daftar PO
                </Link>
                <Link href="/purchase-orders/new" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                  <PackagePlus className="h-5 w-5 text-slate-500" />
                  Buat PO Baru
                </Link>
              </>
            )}

            {/* WAREHOUSE ONLY */}
            {(role === 'warehouse' || !role) && (
              <>
                <div className="pt-4 pb-2">
                  <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Penerimaan</h3>
                </div>
                
                <Link href="/purchase-orders" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                  <Truck className="h-5 w-5 text-slate-500" />
                  Penerimaan Barang
                </Link>
              </>
            )}

            {/* FINANCE ONLY */}
            {(role === 'finance' || !role) && (
              <>
                <div className="pt-4 pb-2">
                  <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Selisih & Laporan</h3>
                </div>
                
                <Link href="/discrepancy" className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-slate-500" />
                    Discrepancy
                  </div>
                  {discrepancyCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600">
                      {discrepancyCount}
                    </span>
                  )}
                </Link>
                
                <Link href="/reports" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                  <BarChart3 className="h-5 w-5 text-slate-500" />
                  Laporan Rekonsiliasi
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 p-4 space-y-1">
          <Link href="/settings" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
            <Settings className="h-5 w-5 text-slate-500" />
            Pengaturan
          </Link>
          <div className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-500">
            <User className="h-5 w-5 text-slate-400" />
            {role ? <span className="capitalize">{role}</span> : "Guest"}
          </div>
        </div>
      </div>
    </aside>
  )
}
