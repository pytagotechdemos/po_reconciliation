"use client";

import Link from "next/link"
import { ClipboardList, PackagePlus, Truck, AlertCircle, BarChart3, Settings, User, Building2, Package, ShieldAlert, ReceiptText, LayoutDashboard, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react"
import { useSidebar } from "./SidebarContext"
import { motion } from "framer-motion"

const sections = [
  { key: "Master Data", role: ["owner", "procurement"], items: [
    { href: "/items", icon: Package, label: "Barang" },
    { href: "/suppliers", icon: Building2, label: "Supplier" },
  ]},
  { key: "Purchase Order", role: ["procurement"], items: [
    { href: "/purchase-orders", icon: ClipboardList, label: "Daftar PO" },
    { href: "/purchase-orders/new", icon: PackagePlus, label: "Buat PO Baru" },
  ]},
  { key: "Penerimaan", role: ["warehouse"], items: [
    { href: "/purchase-orders", icon: Truck, label: "Penerimaan Barang" },
  ]},
  { key: "Selisih & Laporan", role: ["finance"], items: [
    { href: "/discrepancies", icon: AlertCircle, label: "Discrepancy", badge: true },
    { href: "/invoices", icon: ReceiptText, label: "Invoice" },
    { href: "/reports", icon: BarChart3, label: "Laporan" },
  ]},
  { key: "Keamanan & Audit", role: ["owner", "finance"], items: [
    { href: "/audit-logs", icon: ShieldAlert, label: "Audit Trail" },
  ]},
]

const roleColors: Record<string, string> = {
  owner: "text-violet-600 bg-violet-50",
  finance: "text-blue-600 bg-blue-50",
  warehouse: "text-emerald-600 bg-emerald-50",
  procurement: "text-amber-600 bg-amber-50",
}

export function Sidebar({ className }: { className?: string }) {
  const { data: session } = useSession()
  const role = session?.user?.role
  const { isOpen, close, isCollapsed, toggleCollapse, discrepancyCount } = useSidebar()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={close}
        />
      )}

      {/* Mobile sidebar: full-width overlay */}
      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-slate-200 shadow-[2px_0_20px_rgb(0,0,0,0.03)]",
          "transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        <SidebarInner role={role} roleColors={roleColors} discrepancyCount={discrepancyCount} close={close} collapsed={false} onToggleCollapse={toggleCollapse} />
      </div>

      {/* Desktop sidebar: fixed, collapsible */}
      <div
        className={cn(
          "hidden lg:block fixed left-0 top-0 z-40 h-screen bg-white border-r border-slate-200 shadow-[2px_0_20px_rgb(0,0,0,0.03)]",
          "transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-64",
          className
        )}
      >
        <SidebarInner role={role} roleColors={roleColors} discrepancyCount={discrepancyCount} close={close} collapsed={isCollapsed} onToggleCollapse={toggleCollapse} />
      </div>
    </>
  )
}

function SidebarInner({
  role, roleColors, discrepancyCount, close, collapsed, onToggleCollapse
}: {
  role?: string
  roleColors: Record<string, string>
  discrepancyCount: number
  close: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const visibleSections = sections.filter(s => !role || s.role.includes(role))

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className={cn(
        "h-16 flex items-center border-b border-slate-200 shrink-0",
        collapsed ? "justify-center px-1" : "px-5"
      )}>
        {collapsed ? (
          <span className="text-xl font-black text-violet-600">P</span>
        ) : (
          <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-purple-600 tracking-tight">Pytagotech</h1>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-5">
        <NavLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={close} collapsed={collapsed} />

        {visibleSections.map(section => (
          <div key={section.key}>
            {!collapsed && (
              <div className="px-3 mb-1.5">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{section.key}</h3>
              </div>
            )}
            {collapsed && <div className="h-px bg-slate-100 mx-2 mb-3" />}
            {section.items.map(item => (
              <NavLink
                key={item.href + item.label}
                href={item.href}
                icon={item.icon}
                label={item.label}
                badge={item.badge ? discrepancyCount : undefined}
                onClick={close}
                collapsed={collapsed}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 p-2 space-y-1 shrink-0">
        <NavLink href="/settings" icon={Settings} label="Pengaturan" onClick={close} collapsed={collapsed} />
        {!collapsed ? (
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 bg-slate-50/80">
            <User className="h-5 w-5 text-slate-400 shrink-0" />
            <span className="capitalize truncate">{role || "Guest"}</span>
          </div>
        ) : (
          <div className={cn(
            "flex items-center justify-center h-10 rounded-xl text-sm font-medium capitalize",
            role && roleColors[role] ? roleColors[role] : "text-slate-400 bg-slate-50"
          )}>
            <User className="h-5 w-5" />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="text-xs">Ciutkan</span>}
        </button>
      </div>
    </div>
  )
}

function NavLink({
  href, icon: Icon, label, badge, onClick, collapsed = false
}: {
  href: string
  icon: React.ElementType
  label: string
  badge?: number
  onClick?: () => void
  collapsed?: boolean
}) {
  if (collapsed) {
    return (
      <div className="relative group mb-0.5">
        <Link
          href={href}
          onClick={onClick}
          className="flex items-center justify-center h-10 w-full rounded-xl text-slate-500 hover:bg-violet-50 hover:text-violet-600 transition-all duration-150"
        >
          <Icon className="h-5 w-5 shrink-0" />
          {badge && badge > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </Link>
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          {label}
        </div>
      </div>
    )
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 mb-0.5 text-slate-500 hover:bg-white hover:text-violet-600 hover:shadow-sm"
    >
      <Icon className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-violet-500 transition-colors" />
      <span className="flex-1 truncate">{label}</span>
      {badge && badge > 0 && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-[10px] font-bold text-rose-600">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  )
}
