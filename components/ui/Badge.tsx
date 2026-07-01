import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "destructive" | "secondary" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        {
          "border border-transparent bg-violet-600 text-white": variant === "default",
          "border border-transparent bg-slate-100 text-slate-600": variant === "secondary",
          "border border-red-200 bg-red-50 text-red-600": variant === "destructive",
          "border border-amber-200 bg-amber-50 text-amber-600": variant === "warning",
          "border border-green-200 bg-green-50 text-green-600": variant === "success",
          "border border-slate-200 bg-white text-slate-600": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
