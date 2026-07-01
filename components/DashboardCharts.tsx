"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

type MonthlyData = {
  month: string
  poCount: number
}

type DashboardChartsProps = {
  totalReceived: number
  totalDiscrepancy: number
  totalPending: number
  monthlyData?: MonthlyData[]
}

export function DashboardCharts({
  totalReceived,
  totalDiscrepancy,
  totalPending,
  monthlyData = []
}: DashboardChartsProps) {
  const pieData = [
    { name: 'Selesai (Received)', value: totalReceived },
    { name: 'Menunggu (Pending)', value: totalPending },
    { name: 'Selisih (Discrepancy)', value: totalDiscrepancy },
  ].filter(d => d.value > 0)

  const barData = monthlyData.length > 0
    ? monthlyData
    : [
        { month: 'Jan', poCount: 0 },
        { month: 'Feb', poCount: 0 },
        { month: 'Mar', poCount: 0 },
        { month: 'Apr', poCount: 0 },
        { month: 'May', poCount: 0 },
        { month: 'Jun', poCount: 0 },
      ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <div className="rounded-xl border border-slate-200/60 bg-white/60 backdrop-blur-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Tren Purchase Order (6 Bulan Terakhir)</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="poCount" name="Jumlah PO" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/60 bg-white/60 backdrop-blur-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Distribusi Status PO</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
