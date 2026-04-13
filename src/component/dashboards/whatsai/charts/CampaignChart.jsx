import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

export function CampaignChart({ data }) {
  const chartData = (data || []).map((c) => ({
    name: c.name?.slice(0, 12) || 'Campaign',
    sent: c.sent || 0,
    failed: c.failed || 0,
  }))

  if (!chartData.length) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500 text-sm">
        No campaign data yet
      </div>
    )
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8 }}
            labelStyle={{ color: '#F1F5F9' }}
          />
          <Bar dataKey="sent" fill="#25D366" name="Sent" radius={[4, 4, 0, 0]} />
          <Bar dataKey="failed" fill="#EF4444" name="Failed" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
