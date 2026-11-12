import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { formatDateShort, formatPrice } from '../../utils/formatters'

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
        {formatPrice(payload[0].value)}
      </div>
    </div>
  )
}

export default function PriceChart({ data = [], coinName = '' }) {
  if (!data.length) {
    return (
      <div className="empty-state" style={{ height: 300 }}>
        <div className="empty-state-icon">📊</div>
        <h3>No price history</h3>
        <p>Scrape market data a few times to build a price trend chart.</p>
      </div>
    )
  }

  const chartData = data.map(d => {
    const dt = new Date(d.recorded_at)
    return {
      date: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      price: d.price,
    }
  })

  const prices = data.map(d => d.price).filter(Boolean)
  const minPrice = Math.min(...prices) * 0.995
  const maxPrice = Math.max(...prices) * 1.005
  const isGain = prices[prices.length - 1] >= prices[0]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
        <XAxis
          dataKey="date"
          tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[minPrice, maxPrice]}
          tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => formatPrice(v, true)}
          width={80}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="price"
          stroke={isGain ? 'var(--gain-color)' : 'var(--loss-color)'}
          strokeWidth={2}
          dot={data.length < 30 ? { fill: isGain ? 'var(--gain-color)' : 'var(--loss-color)', r: 4 } : false}
          activeDot={{ r: 6, fill: isGain ? 'var(--gain-color)' : 'var(--loss-color)' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
