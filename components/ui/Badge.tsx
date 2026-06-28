import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "destructive" | "secondary"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-blue-800 text-white": variant === "default",
          "border-transparent bg-slate-100 text-slate-500": variant === "secondary", // Paid
          "border-red-300 bg-red-50 text-red-600": variant === "destructive", // Discrepancy
          "border-amber-300 bg-amber-50 text-amber-600": variant === "warning", // Partial
          "border-green-300 bg-green-50 text-green-600": variant === "success", // Received
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
