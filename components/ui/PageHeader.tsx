import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  subtitle?: string
  icon?: ReactNode
  actions?: ReactNode
  color?: "violet" | "indigo" | "rose" | "emerald" | "amber" | "blue" | "slate"
}

const colorVariants = {
  violet: "bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 shadow-violet-200/40",
  indigo: "bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 shadow-indigo-200/50",
  rose: "bg-gradient-to-br from-rose-500 via-pink-600 to-rose-700 shadow-rose-200/40",
  emerald: "bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 shadow-emerald-200/40",
  amber: "bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 shadow-amber-200/40",
  blue: "bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-800 shadow-blue-200/40",
  slate: "bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 shadow-slate-200/40",
}

const iconColors = {
  violet: "text-white bg-white/20 backdrop-blur-sm",
  indigo: "text-white bg-white/20 backdrop-blur-sm",
  rose: "text-white bg-white/20 backdrop-blur-sm",
  emerald: "text-white bg-white/20 backdrop-blur-sm",
  amber: "text-white bg-white/20 backdrop-blur-sm",
  blue: "text-white bg-white/20 backdrop-blur-sm",
  slate: "text-white bg-white/20 backdrop-blur-sm",
}

export function PageHeader({ title, description, subtitle, icon, actions, color = "violet" }: PageHeaderProps) {
  return (
    <div className={cn(
      "relative mb-8 overflow-hidden rounded-2xl p-6 sm:p-8 shadow-xl text-white",
      colorVariants[color]
    )}>
      {/* Decorative dot pattern */}
      <div className="absolute top-0 right-0 -translate-y-8 translate-x-8 opacity-15 pointer-events-none">
        <svg width="320" height="320" fill="none" viewBox="0 0 320 320">
          <defs>
            <pattern id="pattern-circles" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="2" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="320" height="320" fill="url(#pattern-circles)" />
        </svg>
      </div>

      {/* Decorative blur orb */}
      <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-4 sm:gap-5">
          {icon && (
            <div className={cn("p-3 sm:p-4 rounded-xl shadow-inner shrink-0", iconColors[color])}>
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{title}</h1>
            {description && (
              <p className="text-white/75 text-sm sm:text-base mt-0.5 font-medium">{description}</p>
            )}
            {subtitle && (
              <p className="text-white/60 text-xs sm:text-sm mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
