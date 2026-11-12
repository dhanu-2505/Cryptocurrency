import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const v = payload[0].value
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 13,
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ color: v >= 0 ? 'var(--gain-color)' : 'var(--loss-color)', fontWeight: 600 }}>
        {v >= 0 ? '+' : ''}{v?.toFixed(2)}%
      </div>
    </div>
  )
}

export default function GainLossChart({ coins = [] }) {
  if (!coins.length) return (
    <div className="empty-state" style={{ height: 260 }}>
      <div className="empty-state-icon">📊</div>
      <h3>No data available</h3>
    </div>
  )

  const data = coins
    .filter(c => c.change_24h != null)
    .map(c => ({ name: c.symbol, change: c.change_24h }))
    .sort((a, b) => b.change - a.change)

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => v + '%'}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <ReferenceLine y={0} stroke="var(--border-hover)" strokeWidth={1} />
        <Bar dataKey="change" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.change >= 0 ? 'var(--gain-color)' : 'var(--loss-color)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
