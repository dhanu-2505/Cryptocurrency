import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'
import { formatMarketCap, abbreviateNumber } from '../../utils/formatters'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 13,
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
        {formatMarketCap(payload[0].value)}
      </div>
    </div>
  )
}

const COLORS = [
  '#3b7fff','#8b5cf6','#10d987','#f59e0b','#ff4e6a',
  '#06b6d4','#ec4899','#84cc16','#f97316','#a78bfa',
]

export default function MarketCapChart({ coins = [] }) {
  if (!coins.length) return (
    <div className="empty-state" style={{ height: 260 }}>
      <div className="empty-state-icon">📊</div>
      <h3>No data available</h3>
    </div>
  )

  const data = coins
    .filter(c => c.market_cap)
    .map(c => ({ name: c.symbol, market_cap: c.market_cap }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => '$' + abbreviateNumber(v)}
          width={72}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Bar dataKey="market_cap" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
