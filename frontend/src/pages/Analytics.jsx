import { useCoins } from '../hooks/useCoins'
import MarketCapChart from '../components/charts/MarketCapChart'
import GainLossChart from '../components/charts/GainLossChart'
import { formatPrice, formatMarketCap } from '../utils/formatters'
import { TrendingUp, TrendingDown, DollarSign, BarChart2, AlertCircle } from 'lucide-react'
import './Analytics.css'

export default function Analytics() {
  const { coins, stats, loading, error } = useCoins()

  const sortedByMcap = [...coins].sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0))
  const sortedByGain = [...coins].filter(c => c.change_24h != null).sort((a, b) => b.change_24h - a.change_24h)
  const topGainer = sortedByGain[0]
  const topLoser = sortedByGain[sortedByGain.length - 1]
  const avgPrice = coins.length
    ? coins.reduce((s, c) => s + (c.price || 0), 0) / coins.filter(c => c.price).length
    : null

  return (
    <div>
      <div className="page-header">
        <h1>Analytics</h1>
        <p>Market insights and performance metrics</p>
      </div>

      {error && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Highlight cards */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <div className="analytics-card card">
          <div className="analytics-card-icon" style={{ background: 'var(--gain-bg)', color: 'var(--gain-color)' }}>
            <TrendingUp size={18} />
          </div>
          <div className="analytics-card-label">Top 24h Gainer</div>
          {loading ? (
            <div className="skeleton" style={{ width: '80%', height: 20 }} />
          ) : (
            <div className="analytics-card-value gain-text">
              {topGainer ? `${topGainer.name} (+${topGainer.change_24h?.toFixed(2)}%)` : '—'}
            </div>
          )}
        </div>

        <div className="analytics-card card">
          <div className="analytics-card-icon" style={{ background: 'var(--loss-bg)', color: 'var(--loss-color)' }}>
            <TrendingDown size={18} />
          </div>
          <div className="analytics-card-label">Top 24h Loser</div>
          {loading ? (
            <div className="skeleton" style={{ width: '80%', height: 20 }} />
          ) : (
            <div className="analytics-card-value loss-text">
              {topLoser ? `${topLoser.name} (${topLoser.change_24h?.toFixed(2)}%)` : '—'}
            </div>
          )}
        </div>

        <div className="analytics-card card">
          <div className="analytics-card-icon" style={{ background: 'var(--purple-bg)', color: 'var(--purple-color)' }}>
            <DollarSign size={18} />
          </div>
          <div className="analytics-card-label">Avg Price (Top 10)</div>
          {loading ? (
            <div className="skeleton" style={{ width: '80%', height: 20 }} />
          ) : (
            <div className="analytics-card-value">{formatPrice(avgPrice)}</div>
          )}
        </div>

        <div className="analytics-card card">
          <div className="analytics-card-icon" style={{ background: 'var(--accent-blue-dim)', color: 'var(--accent-blue)' }}>
            <BarChart2 size={18} />
          </div>
          <div className="analytics-card-label">Total Market Cap</div>
          {loading ? (
            <div className="skeleton" style={{ width: '80%', height: 20 }} />
          ) : (
            <div className="analytics-card-value">{formatMarketCap(stats?.total_market_cap)}</div>
          )}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h2 className="chart-section-title">Market Cap Comparison</h2>
          <MarketCapChart coins={coins} />
        </div>
        <div className="card">
          <h2 className="chart-section-title">24h Gain / Loss</h2>
          <GainLossChart coins={coins} />
        </div>
      </div>

      {/* Market overview table */}
      <div className="card">
        <h2 className="chart-section-title" style={{ marginBottom: 16 }}>Market Overview</h2>
        <div className="table-wrapper" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Coin</th>
                <th>Price</th>
                <th>24h Change</th>
                <th>Market Cap</th>
                <th>Market Share</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {[40,120,90,80,110,80].map((w,j) => (
                        <td key={j}><div className="skeleton" style={{ width: w, height: 14 }} /></td>
                      ))}
                    </tr>
                  ))
                : sortedByMcap.map(coin => {
                    const pos = (coin.change_24h ?? 0) >= 0
                    const share = stats?.total_market_cap && coin.market_cap
                      ? ((coin.market_cap / stats.total_market_cap) * 100).toFixed(1)
                      : null
                    return (
                      <tr key={coin.symbol}>
                        <td style={{ color: 'var(--text-muted)' }}>#{coin.rank}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{coin.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{coin.symbol}</div>
                        </td>
                        <td className="mono">{formatPrice(coin.price)}</td>
                        <td>
                          <span className={`badge ${pos ? 'badge-gain' : 'badge-loss'}`}>
                            {coin.change_24h != null ? (pos ? '+' : '') + coin.change_24h.toFixed(2) + '%' : '—'}
                          </span>
                        </td>
                        <td className="mono">{formatMarketCap(coin.market_cap)}</td>
                        <td>
                          {share ? (
                            <div className="market-share-bar">
                              <div className="market-share-fill" style={{ width: `${Math.min(100, share)}%` }} />
                              <span className="market-share-label">{share}%</span>
                            </div>
                          ) : '—'}
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
