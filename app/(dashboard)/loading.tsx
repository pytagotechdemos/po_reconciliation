"use client"

import { KPICardSkeleton } from "@/components/ui/Skeleton"

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="h-40 rounded-2xl shimmer" />

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
      </div>

      {/* Charts + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="h-6 w-40 rounded shimmer mb-6" />
            <div className="h-64 rounded-xl shimmer" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="h-6 w-40 rounded shimmer mb-6" />
          <div className="space-y-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full shimmer shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 rounded shimmer" />
                  <div className="h-2 w-1/2 rounded shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
