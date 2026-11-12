import { TrendingUp, TrendingDown, DollarSign, Layers, AlertCircle } from 'lucide-react'
import { formatPrice, formatMarketCap, formatChange } from '../utils/formatters'
import './SummaryCards.css'

function StatCard({ icon: Icon, iconColor, title, value, sub, subColor }) {
  return (
    <div className="stat-card card">
      <div className="stat-card-header">
        <div className="stat-icon" style={{ '--icon-color': iconColor }}>
          <Icon size={18} />
        </div>
        <span className="stat-title">{title}</span>
      </div>
      <div className="stat-value">{value}</div>
      {sub && (
        <div className="stat-sub" style={{ color: subColor || 'var(--text-muted)' }}>
          {sub}
        </div>
      )}
    </div>
  )
}

export default function SummaryCards({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card card">
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 8, marginBottom: 12 }} />
            <div className="skeleton" style={{ width: '50%', height: 12, marginBottom: 10 }} />
            <div className="skeleton" style={{ width: '75%', height: 22, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: '60%', height: 12 }} />
          </div>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="alert alert-info" style={{ marginBottom: 24 }}>
        <AlertCircle size={16} />
        <span>No market data yet. Click <strong>Refresh Data</strong> to scrape live prices.</span>
      </div>
    )
  }

  const gainerChange = stats.top_gainer?.change_24h
  const loserChange = stats.top_loser?.change_24h

  return (
    <div className="grid-4">
      <StatCard
        icon={Layers}
        iconColor="var(--accent-blue)"
        title="Coins Tracked"
        value={stats.total_coins || 0}
        sub="Top cryptocurrencies"
      />
      <StatCard
        icon={TrendingUp}
        iconColor="var(--gain-color)"
        title="Top Gainer (24h)"
        value={stats.top_gainer?.name || '—'}
        sub={gainerChange != null ? `+${gainerChange.toFixed(2)}%` : '—'}
        subColor="var(--gain-color)"
      />
      <StatCard
        icon={TrendingDown}
        iconColor="var(--loss-color)"
        title="Top Loser (24h)"
        value={stats.top_loser?.name || '—'}
        sub={loserChange != null ? `${loserChange.toFixed(2)}%` : '—'}
        subColor="var(--loss-color)"
      />
      <StatCard
        icon={DollarSign}
        iconColor="var(--purple-color)"
        title="Total Market Cap"
        value={formatMarketCap(stats.total_market_cap)}
        sub="Combined top 10"
      />
    </div>
  )
}
