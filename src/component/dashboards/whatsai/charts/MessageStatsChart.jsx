import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

export function MessageStatsChart({ data }) {
  const chartData = data || []

  if (!chartData.length) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500 text-sm">
        No message timeline yet
      </div>
    )
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickFormatter={(d) => d?.slice(5)}
          />
          <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8 }}
            labelStyle={{ color: '#F1F5F9' }}
          />
          <Line
            type="monotone"
            dataKey="messages"
            stroke="#25D366"
            strokeWidth={2}
            dot={{ fill: '#25D366', r: 3 }}
            name="Messages"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
