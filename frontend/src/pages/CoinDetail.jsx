import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Star,
  Bell,
  Activity,
  Compass,
  ArrowDownRight,
  ShieldAlert,
  Plus,
  X,
  CheckCircle2,
} from 'lucide-react'
import { useCoinHistory } from '../hooks/useCoins'
import PriceChart from '../components/charts/PriceChart'
import CoinIcon from '../components/CoinIcon'
import {
  getCoinVolatility,
  getCoinTrend,
  getCoinDrawdown,
  getWatchlistSymbols,
  addToWatchlist,
  removeFromWatchlist,
  createAlert,
} from '../services/api'
import { formatPrice, formatMarketCap, formatDate, formatCurrency } from '../utils/formatters'
import './CoinDetail.css'

const TIME_FILTERS = [
  { label: '1H', hours: 1 },
  { label: '24H', hours: 24 },
  { label: '7D', hours: 168 },
  { label: '30D', hours: 720 },
  { label: 'All', hours: Infinity },
]

export default function CoinDetail() {
  const { symbol } = useParams()
  const navigate = useNavigate()
  const { coin, history, loading: historyLoading, error: historyError } = useCoinHistory(symbol)
  const [timeFilter, setTimeFilter] = useState('All')

  // Intelligence states
  const [volatility, setVolatility] = useState(null)
  const [trend, setTrend] = useState(null)
  const [drawdown, setDrawdown] = useState(null)
  const [isWatched, setIsWatched] = useState(false)
  const [intelLoading, setIntelLoading] = useState(true)

  // Alert modal states
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [alertType, setAlertType] = useState('price_above')
  const [alertTarget, setAlertTarget] = useState('')
  const [alertSuccessMsg, setAlertSuccessMsg] = useState('')
  const [alertSubmitting, setAlertSubmitting] = useState(false)

  // Load intelligence metrics and watchlist status
  useEffect(() => {
    if (!symbol) return
    let active = true

    async function loadCoinIntelligence() {
      try {
        setIntelLoading(true)
        const [volData, trendData, ddData, watchList] = await Promise.all([
          getCoinVolatility(symbol).catch(() => null),
          getCoinTrend(symbol).catch(() => null),
          getCoinDrawdown(symbol).catch(() => null),
          getWatchlistSymbols().catch(() => []),
        ])

        if (active) {
          setVolatility(volData)
          setTrend(trendData)
          setDrawdown(ddData)
          setIsWatched(watchList.includes(symbol.toUpperCase()))
        }
      } catch (err) {
        console.error('Failed to load coin intelligence:', err)
      } finally {
        if (active) setIntelLoading(false)
      }
    }

    loadCoinIntelligence()
    return () => {
      active = false
    }
  }, [symbol])

  const toggleWatchlist = async () => {
    try {
      if (isWatched) {
        await removeFromWatchlist(symbol)
        setIsWatched(false)
      } else {
        await addToWatchlist(symbol)
        setIsWatched(true)
      }
    } catch (err) {
      console.error('Failed to toggle watchlist:', err)
      alert('Could not update watchlist.')
    }
  }

  const handleCreateAlert = async (e) => {
    e.preventDefault()
    if (!alertTarget || isNaN(Number(alertTarget))) {
      alert('Please enter a valid number.')
      return
    }

    try {
      setAlertSubmitting(true)
      await createAlert({
        symbol: symbol.toUpperCase(),
        condition_type: alertType,
        target_value: Number(alertTarget),
      })
      setAlertSuccessMsg(`Alert successfully set for ${symbol}!`)
      setAlertTarget('')
      setTimeout(() => {
        setAlertSuccessMsg('')
        setShowAlertModal(false)
      }, 1500)
    } catch (err) {
      console.error('Alert creation failed:', err)
      alert('Failed to set price alert.')
    } finally {
      setAlertSubmitting(false)
    }
  }

  const filteredHistory = useMemo(() => {
    const tf = TIME_FILTERS.find((t) => t.label === timeFilter)
    if (!tf || tf.hours === Infinity) return history
    const cutoff = new Date(Date.now() - tf.hours * 3600 * 1000)
    return history.filter((h) => new Date(h.recorded_at) >= cutoff)
  }, [history, timeFilter])

  if (historyLoading) {
    return (
      <div>
        <div style={{ marginBottom: 20 }}>
          <div className="skeleton" style={{ width: 120, height: 16, marginBottom: 16 }} />
          <div className="skeleton" style={{ width: 200, height: 28, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 100, height: 14 }} />
        </div>
        <div className="card">
          <div className="skeleton" style={{ width: '100%', height: 300 }} />
        </div>
      </div>
    )
  }

  if (historyError || !coin) {
    return (
      <div>
        <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>Coin Not Found</h3>
          <p>{historyError || `No data found for symbol "${symbol}". Try refreshing the market data.`}</p>
        </div>
      </div>
    )
  }

  const isPos = (coin.change_24h ?? 0) >= 0

  return (
    <div className="coin-detail-page">
      {/* Back and Action Buttons */}
      <div className="coin-detail-top-nav">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} /> Back to Markets
        </button>
        <div className="coin-action-buttons">
          <button
            className={`btn btn-sm ${isWatched ? 'btn-watchlist-active' : 'btn-outline'}`}
            onClick={toggleWatchlist}
            title={isWatched ? 'Remove from Watchlist' : 'Add to Watchlist'}
          >
            <Star size={15} fill={isWatched ? '#f59e0b' : 'none'} color={isWatched ? '#f59e0b' : 'currentColor'} />
            {isWatched ? 'On Watchlist' : 'Add to Watchlist'}
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowAlertModal(true)}
            title="Create Price Alert"
          >
            <Bell size={15} />
            Set Price Alert
          </button>
        </div>
      </div>

      {/* Header Card */}
      <div className="coin-detail-header card" style={{ marginBottom: 20 }}>
        <div className="coin-detail-identity">
          <CoinIcon symbol={coin.symbol} size={52} />
          <div>
            <h1 className="coin-detail-name">{coin.name}</h1>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
              <span className="badge badge-neutral">{coin.symbol}</span>
              <span className="badge badge-neutral">Rank #{coin.rank}</span>
              <span className="badge badge-live">Live</span>
            </div>
          </div>
        </div>

        <div className="coin-detail-stats">
          <div className="coin-stat">
            <div className="coin-stat-label">Price</div>
            <div className="coin-stat-value large">{formatPrice(coin.price)}</div>
          </div>
          <div className="coin-stat">
            <div className="coin-stat-label">24h Change</div>
            <div className={`coin-stat-value ${isPos ? 'gain-text' : 'loss-text'}`}>
              {isPos ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {coin.change_24h != null ? (isPos ? '+' : '') + coin.change_24h.toFixed(2) + '%' : '—'}
            </div>
          </div>
          <div className="coin-stat">
            <div className="coin-stat-label">Market Cap</div>
            <div className="coin-stat-value">{formatMarketCap(coin.market_cap)}</div>
          </div>
          <div className="coin-stat">
            <div className="coin-stat-label">Last Updated</div>
            <div className="coin-stat-value" style={{ fontSize: 13 }}>
              {formatDate(coin.recorded_at)}
            </div>
          </div>
        </div>
      </div>

      {/* SMART MARKET INTELLIGENCE LAYER: Trend, Volatility, Drawdown */}
      <div className="intelligence-indicators-grid" style={{ marginBottom: 20 }}>
        {/* Trend & Momentum Card */}
        <div className="intel-indicator-card">
          <div className="indicator-title-row">
            <span className="indicator-label">
              <Compass size={15} /> Statistical Trend
            </span>
            <span className={`trend-badge trend-${(trend?.trend || 'neutral').toLowerCase().replace(' ', '-')}`}>
              {trend?.trend || 'Neutral'}
            </span>
          </div>
          <div className="indicator-main-stat">
            <span className={`momentum-val font-mono ${(trend?.momentum || 0) >= 0 ? 'text-gain' : 'text-loss'}`}>
              {trend ? `${trend.momentum > 0 ? '+' : ''}${trend.momentum}%` : '0.00%'}
            </span>
            <span className="indicator-sub-label">Momentum</span>
          </div>
          <div className="indicator-footer-meta font-mono text-secondary text-xs">
            Short MA: {trend?.short_ma ? formatCurrency(trend.short_ma) : '—'} · Long MA:{' '}
            {trend?.long_ma ? formatCurrency(trend.long_ma) : '—'}
          </div>
        </div>

        {/* Volatility Card */}
        <div className="intel-indicator-card">
          <div className="indicator-title-row">
            <span className="indicator-label">
              <Activity size={15} /> Volatility Rating
            </span>
            <span className={`volatility-badge vol-${(volatility?.volatility || 'low').toLowerCase()}`}>
              {volatility?.volatility || 'Low'}
            </span>
          </div>
          <div className="indicator-main-stat">
            <span className="volatility-val font-mono">
              {volatility ? `${volatility.volatility_score}%` : '0.00%'}
            </span>
            <span className="indicator-sub-label">Std Dev of Returns</span>
          </div>
          <div className="indicator-footer-meta font-mono text-secondary text-xs">
            Range: {volatility?.price_min ? formatCurrency(volatility.price_min) : '—'} to{' '}
            {volatility?.price_max ? formatCurrency(volatility.price_max) : '—'} ({volatility?.observations ?? 0} obs)
          </div>
        </div>

        {/* Drawdown Detector Card */}
        <div className="intel-indicator-card">
          <div className="indicator-title-row">
            <span className="indicator-label">
              <ArrowDownRight size={15} /> Drawdown from High
            </span>
            <span className={`volatility-badge vol-${(drawdown?.classification || 'low').toLowerCase()}`}>
              {drawdown?.classification || 'Low'}
            </span>
          </div>
          <div className="indicator-main-stat">
            <span className="drawdown-val font-mono text-loss">
              {drawdown ? `${drawdown.drawdown_pct}%` : '0.00%'}
            </span>
            <span className="indicator-sub-label">Drawdown vs Rolling High</span>
          </div>
          <div className="indicator-footer-meta font-mono text-secondary text-xs">
            Rolling High: {drawdown?.reference_high ? formatCurrency(drawdown.reference_high) : '—'}
          </div>
        </div>
      </div>

      {/* Chart Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="chart-header">
          <h2 className="chart-title">Price History</h2>
          <div className="time-filter-tabs">
            {TIME_FILTERS.map((tf) => (
              <button
                key={tf.label}
                className={`time-tab ${timeFilter === tf.label ? 'active' : ''}`}
                onClick={() => setTimeFilter(tf.label)}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
        <PriceChart data={filteredHistory} coinName={coin.name} />
        {filteredHistory.length > 0 && (
          <div className="chart-footer">
            {filteredHistory.length} data point{filteredHistory.length !== 1 ? 's' : ''} · Stored historical price observations
          </div>
        )}
      </div>

      {/* Recent History Table */}
      {history.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Recent Records</h2>
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Price</th>
                  <th>24h Change</th>
                  <th>Market Cap</th>
                </tr>
              </thead>
              <tbody>
                {[...history]
                  .reverse()
                  .slice(0, 20)
                  .map((h) => {
                    const pos = (h.change_24h ?? 0) >= 0
                    return (
                      <tr key={h.id}>
                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                          {formatDate(h.recorded_at)}
                        </td>
                        <td className="mono">{formatPrice(h.price)}</td>
                        <td>
                          <span className={`badge ${pos ? 'badge-gain' : 'badge-loss'}`}>
                            {h.change_24h != null ? (pos ? '+' : '') + h.change_24h.toFixed(2) + '%' : '—'}
                          </span>
                        </td>
                        <td className="mono">{formatMarketCap(h.market_cap)}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Alert Modal */}
      {showAlertModal && (
        <div className="modal-backdrop" onClick={() => setShowAlertModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Set Alert for {coin.name} ({coin.symbol})</h3>
              <button className="btn-close" onClick={() => setShowAlertModal(false)}>
                <X size={18} />
              </button>
            </div>

            {alertSuccessMsg ? (
              <div className="alert-success-banner">
                <CheckCircle2 size={20} className="text-gain" />
                <span>{alertSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleCreateAlert} className="modal-form">
                <div className="form-group">
                  <label>Trigger Condition</label>
                  <select
                    value={alertType}
                    onChange={(e) => setAlertType(e.target.value)}
                    className="form-input"
                  >
                    <option value="price_above">Price goes Above ($)</option>
                    <option value="price_below">Price falls Below ($)</option>
                    <option value="change_above">24h Gain goes Above (+%)</option>
                    <option value="change_below">24h Drop falls Below (-%)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Target Threshold</label>
                  <input
                    type="number"
                    step="any"
                    placeholder={alertType.startsWith('price') ? `Current: ${coin.price}` : 'e.g. 5.0'}
                    value={alertTarget}
                    onChange={(e) => setAlertTarget(e.target.value)}
                    className="form-input"
                    required
                    autoFocus
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setShowAlertModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={alertSubmitting}
                  >
                    {alertSubmitting ? 'Saving...' : 'Set Alert'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
