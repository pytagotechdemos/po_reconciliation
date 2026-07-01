import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  icon?: ReactNode
  actions?: ReactNode
  color?: "indigo" | "rose" | "emerald" | "amber" | "blue"
}

const colorVariants = {
  indigo: "bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 shadow-indigo-200/50",
  rose: "bg-gradient-to-r from-rose-500 via-pink-600 to-rose-700 shadow-rose-200/50",
  emerald: "bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-700 shadow-emerald-200/50",
  amber: "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 shadow-amber-200/50",
  blue: "bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-800 shadow-blue-200/50",
}

const iconColors = {
  indigo: "text-white bg-white/20 backdrop-blur-sm",
  rose: "text-white bg-white/20 backdrop-blur-sm",
  emerald: "text-white bg-white/20 backdrop-blur-sm",
  amber: "text-white bg-white/20 backdrop-blur-sm",
  blue: "text-white bg-white/20 backdrop-blur-sm",
}

export function PageHeader({ title, description, icon, actions, color = "indigo" }: PageHeaderProps) {
  return (
    <div className={cn(
      "relative mb-8 overflow-hidden rounded-3xl p-8 shadow-xl text-white",
      colorVariants[color]
    )}>
      {/* Decorative patterns */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 opacity-20 pointer-events-none">
        <svg width="404" height="384" fill="none" viewBox="0 0 404 384">
          <defs>
            <pattern id="pattern-circles" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="2" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="404" height="384" fill="url(#pattern-circles)" />
        </svg>
      </div>
      
      <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 opacity-10 pointer-events-none">
        <div className="w-64 h-64 rounded-full bg-white blur-3xl"></div>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {icon && (
            <div className={cn("p-4 rounded-2xl shadow-inner", iconColors[color])}>
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">{title}</h1>
            {description && <p className="text-white/80 font-medium text-sm md:text-base">{description}</p>}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
