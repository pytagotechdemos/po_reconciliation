"use client";

import Link from "next/link"
import { ClipboardList, PackagePlus, Truck, AlertCircle, BarChart3, Settings, User, Building2, Package, ShieldAlert, ReceiptText } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react"
import { useSidebar } from "./SidebarContext"

export function Sidebar({ className }: { className?: string }) {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const { isOpen, close, discrepancyCount } = useSidebar();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm md:hidden transition-opacity"
          onClick={close}
        />
      )}

      <aside className={cn(
        "fixed left-0 top-0 z-40 h-screen w-60 border-r border-white/20 bg-white/60 md:bg-white/60 backdrop-blur-xl shadow-[4px_0_24px_rgb(0,0,0,0.02)] transition-transform duration-300 ease-in-out md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        className
      )}>
      <div className="flex h-16 items-center border-b border-slate-200/50 px-6">
        <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight">Pytagotech</h1>
      </div>

      <div className="flex flex-col justify-between h-[calc(100vh-4rem)]">
        <div className="px-4 py-6 space-y-6">

          <div className="space-y-1">
            <Link onClick={close} href="/dashboard" className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm transition-all duration-200">
              <ClipboardList className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              Dashboard
            </Link>

            {/* MASTER DATA (Procurement & Owner) */}
            {(role === 'procurement' || role === 'owner') && (
              <>
                <div className="pt-5 pb-2">
                  <h3 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Master Data</h3>
                </div>

                <Link onClick={close} href="/items" className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm transition-all duration-200">
                  <Package className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  Barang
                </Link>
                <Link onClick={close} href="/suppliers" className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm transition-all duration-200">
                  <Building2 className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  Supplier
                </Link>
              </>
            )}

            {/* PROCUREMENT ONLY */}
            {role === 'procurement' && (
              <>
                <div className="pt-5 pb-2">
                  <h3 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Purchase Order</h3>
                </div>

                <Link onClick={close} href="/purchase-orders" className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm transition-all duration-200">
                  <ClipboardList className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  Daftar PO
                </Link>
                <Link onClick={close} href="/purchase-orders/new" className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm transition-all duration-200">
                  <PackagePlus className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  Buat PO Baru
                </Link>
              </>
            )}

            {/* WAREHOUSE ONLY */}
            {role === 'warehouse' && (
              <>
                <div className="pt-5 pb-2">
                  <h3 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Penerimaan</h3>
                </div>

                <Link onClick={close} href="/purchase-orders" className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-white hover:text-emerald-600 hover:shadow-sm transition-all duration-200">
                  <Truck className="h-5 w-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  Penerimaan Barang
                </Link>
              </>
            )}

            {/* FINANCE ONLY */}
            {role === 'finance' && (
              <>
                <div className="pt-5 pb-2">
                  <h3 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Selisih & Laporan</h3>
                </div>

                <Link onClick={close} href="/discrepancies" className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-white hover:text-rose-600 hover:shadow-sm transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
                    Discrepancy
                  </div>
                  {discrepancyCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-[10px] font-bold text-rose-600">
                      {discrepancyCount}
                    </span>
                  )}
                </Link>

                <Link onClick={close} href="/invoices" className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all duration-200">
                  <ReceiptText className="h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  Invoice
                </Link>

                <Link onClick={close} href="/reports" className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm transition-all duration-200">
                  <BarChart3 className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  Laporan Rekonsiliasi
                </Link>
              </>
            )}

            {/* AUDIT & SECURITY (Owner & Finance) */}
            {(role === 'owner' || role === 'finance') && (
              <>
                <div className="pt-5 pb-2">
                  <h3 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Keamanan & Audit</h3>
                </div>

                <Link onClick={close} href="/audit-logs" className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-white hover:text-rose-600 hover:shadow-sm transition-all duration-200">
                  <ShieldAlert className="h-5 w-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
                  Audit Trail
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200/50 p-4 space-y-2">
          <Link onClick={close} href="/settings" className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm transition-all duration-200">
            <Settings className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
            Pengaturan
          </Link>
          <div className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 bg-slate-50/50">
            <User className="h-5 w-5 text-slate-400" />
            {role ? <span className="capitalize">{role}</span> : "Guest"}
          </div>
        </div>
        </div>
      </aside>
    </>
  )
}
