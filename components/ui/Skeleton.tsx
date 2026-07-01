"use client"

import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "rect" | "circle"
  width?: string | number
  height?: string | number
}

function Skeleton({ className, variant = "rect", width, height, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "shimmer rounded",
        variant === "text" && "h-4 rounded",
        variant === "circle" && "rounded-full",
        variant === "rect" && "rounded-lg",
        className
      )}
      style={{ width, height }}
      {...props}
    />
  )
}

function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b border-slate-200">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="text" className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex gap-4 py-3 border-b border-slate-100">
          {Array.from({ length: cols }).map((_, col) => (
            <Skeleton key={col} variant="text" className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton variant="circle" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="h-4 w-3/4" />
          <Skeleton variant="text" className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton variant="rect" className="h-32 w-full" />
      <div className="flex gap-2">
        <Skeleton variant="rect" className="h-8 w-20" />
        <Skeleton variant="rect" className="h-8 w-20" />
      </div>
    </div>
  )
}

function KPICardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-violet-100 p-6 shadow-sm space-y-3">
      <div className="flex justify-between">
        <Skeleton variant="text" className="h-3 w-24" />
        <Skeleton variant="circle" width={40} height={40} />
      </div>
      <Skeleton variant="text" className="h-9 w-16" />
      <Skeleton variant="text" className="h-3 w-32" />
    </div>
  )
}

export { Skeleton, TableSkeleton, CardSkeleton, KPICardSkeleton }
