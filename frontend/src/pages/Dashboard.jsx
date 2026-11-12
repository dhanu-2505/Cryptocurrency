import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCoins } from '../hooks/useCoins'
import useAutoRefresh from '../hooks/useAutoRefresh'
import SummaryCards from '../components/SummaryCards'
import MarketTable from '../components/MarketTable'
import CoinCard from '../components/CoinCard'
import {
  AlertCircle,
  RefreshCw,
  Clock,
  Flame,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  LayoutGrid,
  Star,
  Bell,
  Activity,
  ArrowRight,
} from 'lucide-react'
import {
  getMarketMood,
  getDataQuality,
  getWatchlist,
  getRecentTriggeredAlerts,
  getSystemHealth,
} from '../services/api'
import { formatCurrency, formatPercent, formatTimeAgo, formatCompactNumber } from '../utils/formatters'
import './Dashboard.css'

const REFRESH_OPTIONS = [
  { label: 'Off', value: null },
  { label: '5 min', value: 5 * 60 * 1000 },
  { label: '15 min', value: 15 * 60 * 1000 },
  { label: '30 min', value: 30 * 60 * 1000 },
]

export default function Dashboard() {
  const { coins, stats, loading: coinsLoading, error, lastUpdated, refetch } = useCoins()
  const [autoInterval, setAutoInterval] = useState(null)
  const [view, setView] = useState('table') // table | cards

  // Intelligence state
  const [mood, setMood] = useState(null)
  const [quality, setQuality] = useState(null)
  const [watchlist, setWatchlist] = useState([])
  const [recentAlerts, setRecentAlerts] = useState([])
  const [systemHealth, setSystemHealth] = useState(null)
  const [intelLoading, setIntelLoading] = useState(true)

  useAutoRefresh(refetch, autoInterval)

  const loadIntelligence = async () => {
    try {
      setIntelLoading(true)
      const [moodData, qualData, watchData, alertsData, healthData] = await Promise.all([
        getMarketMood().catch(() => null),
        getDataQuality().catch(() => null),
        getWatchlist().catch(() => []),
        getRecentTriggeredAlerts().catch(() => []),
        getSystemHealth(5).catch(() => null),
      ])
      setMood(moodData)
      setQuality(qualData)
      setWatchlist(watchData || [])
      setRecentAlerts(alertsData || [])
      setSystemHealth(healthData)
    } catch (err) {
      console.error('Failed to load dashboard intelligence:', err)
    } finally {
      setIntelLoading(false)
    }
  }

  useEffect(() => {
    loadIntelligence()
  }, [coins])

  const handleManualRefresh = () => {
    refetch()
    loadIntelligence()
  }

  const moodLabelClass =
    mood?.label === 'Bullish'
      ? 'mood-bullish'
      : mood?.label === 'Bearish'
      ? 'mood-bearish'
      : 'mood-neutral'

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="page-header dashboard-header">
        <div>
          <h1 className="page-title">Market Dashboard</h1>
          <p className="page-subtitle">Real-time cryptocurrency analytics and smart market intelligence</p>
        </div>
        <div className="dashboard-controls">
          <button
            className="btn btn-primary btn-sm"
            onClick={handleManualRefresh}
            disabled={coinsLoading || intelLoading}
          >
            <RefreshCw size={14} className={coinsLoading || intelLoading ? 'spinning' : ''} />
            Refresh Market Data
          </button>
          <div className="auto-refresh-control">
            <Clock size={14} style={{ color: 'var(--text-muted)' }} />
            <span className="auto-refresh-label">Auto-refresh:</span>
            <select
              className="input auto-refresh-select"
              value={autoInterval ?? ''}
              onChange={(e) => setAutoInterval(e.target.value ? Number(e.target.value) : null)}
              id="auto-refresh-select"
            >
              {REFRESH_OPTIONS.map((o) => (
                <option key={o.label} value={o.value ?? ''}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="view-toggle">
            <button
              className={`btn btn-ghost btn-sm ${view === 'table' ? 'active-view' : ''}`}
              onClick={() => setView('table')}
            >
              Table
            </button>
            <button
              className={`btn btn-ghost btn-sm ${view === 'cards' ? 'active-view' : ''}`}
              onClick={() => setView('cards')}
            >
              Cards
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <AlertCircle size={16} />
          <span>{error}. Showing last available data.</span>
        </div>
      )}

      {/* TOP SECTION: Market Mood & Data Quality Scores */}
      <section className="intel-top-banner">
        {/* Market Mood Card */}
        <div className="hero-intel-card mood-hero-card">
          <div className="card-top-title">
            <span className="hero-tag">
              <Flame size={15} /> Market Mood Score
            </span>
            <span className={`mood-pill ${moodLabelClass}`}>
              {mood?.label?.toUpperCase() || 'NEUTRAL'}
            </span>
          </div>

          <div className="mood-score-display">
            <span className="mood-score-number font-mono">
              {mood ? mood.score : 50}
            </span>
            <span className="mood-score-max">/ 100</span>
          </div>

          <div className="mood-breakdown-row">
            <div className="mood-stat">
              <span className="mood-stat-label">Positive Coins</span>
              <span className="mood-stat-val text-gain font-mono">
                {mood?.positive_coins ?? '—'}
              </span>
            </div>
            <div className="mood-stat">
              <span className="mood-stat-label">Negative Coins</span>
              <span className="mood-stat-val text-loss font-mono">
                {mood?.negative_coins ?? '—'}
              </span>
            </div>
            <div className="mood-stat">
              <span className="mood-stat-label">Avg 24h Change</span>
              <span className={`mood-stat-val font-mono ${(mood?.average_change_24h || 0) >= 0 ? 'text-gain' : 'text-loss'}`}>
                {mood ? `${mood.average_change_24h > 0 ? '+' : ''}${mood.average_change_24h}%` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Data Quality Card */}
        <div className="hero-intel-card quality-hero-card">
          <div className="card-top-title">
            <span className="hero-tag">
              <ShieldCheck size={15} /> Data Quality Score
            </span>
            <span className="badge badge-live">
              {quality?.last_scrape_status?.toUpperCase() || 'OPERATIONAL'}
            </span>
          </div>

          <div className="mood-score-display">
            <span className="mood-score-number font-mono text-accent">
              {quality ? `${quality.score}%` : '100%'}
            </span>
          </div>

          <div className="mood-breakdown-row">
            <div className="mood-stat">
              <span className="mood-stat-label">Coins Collected</span>
              <span className="mood-stat-val font-mono">
                {quality ? `${quality.coins_collected} / ${quality.expected_coins}` : '10 / 10'}
              </span>
            </div>
            <div className="mood-stat">
              <span className="mood-stat-label">Prices Valid</span>
              <span className="mood-stat-val font-mono">
                {quality ? `${quality.valid_prices} / ${quality.expected_coins}` : '10 / 10'}
              </span>
            </div>
            <div className="mood-stat">
              <span className="mood-stat-label">Market Caps Valid</span>
              <span className="mood-stat-val font-mono">
                {quality ? `${quality.valid_market_caps} / ${quality.expected_coins}` : '10 / 10'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Summary Cards */}
      <section style={{ marginBottom: 28 }}>
        <SummaryCards stats={stats} loading={coinsLoading} />
      </section>

      {/* Live Market Table */}
      <section style={{ marginBottom: 28 }}>
        <div className="section-header">
          <h2 className="section-title">Live Market</h2>
          {lastUpdated && (
            <span className="section-meta">
              <span className="badge badge-live">Live</span>
              Last updated {formatTimeAgo(lastUpdated)}
            </span>
          )}
        </div>

        {view === 'table' ? (
          <MarketTable coins={coins} loading={coinsLoading} />
        ) : (
          <div className="grid-4">
            {coinsLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="card" style={{ height: 140 }}>
                    <div
                      className="skeleton"
                      style={{ width: '100%', height: '100%', borderRadius: 10 }}
                    />
                  </div>
                ))
              : coins.map((coin) => <CoinCard key={coin.symbol} coin={coin} />)}
          </div>
        )}
      </section>

      {/* 2-Column Section: Heatmap Preview & Personal Watchlist */}
      <section className="dashboard-two-col-grid" style={{ marginBottom: 28 }}>
        {/* Heatmap Preview */}
        <div className="dashboard-widget-card">
          <div className="widget-header">
            <h3 className="widget-title">
              <LayoutGrid size={16} /> Market Heatmap Preview
            </h3>
            <Link to="/heatmap" className="widget-link">
              Full Heatmap <ArrowRight size={13} />
            </Link>
          </div>
          <div className="mini-heatmap-grid">
            {coins.slice(0, 6).map((coin) => {
              const pos = (coin.change_24h || 0) >= 0
              return (
                <Link
                  key={coin.symbol}
                  to={`/coin/${coin.symbol}`}
                  className={`mini-heat-tile ${pos ? 'gain-tile' : 'loss-tile'}`}
                >
                  <span className="mini-symbol">{coin.symbol}</span>
                  <span className="mini-change font-mono">
                    {pos ? '+' : ''}{coin.change_24h != null ? coin.change_24h.toFixed(2) : '0.00'}%
                  </span>
                  <span className="mini-price font-mono">{formatCurrency(coin.price)}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Watchlist Preview */}
        <div className="dashboard-widget-card">
          <div className="widget-header">
            <h3 className="widget-title">
              <Star size={16} className="text-warning" /> Personal Watchlist ({watchlist.length})
            </h3>
            <Link to="/watchlist" className="widget-link">
              Manage Watchlist <ArrowRight size={13} />
            </Link>
          </div>
          {watchlist.length === 0 ? (
            <div className="widget-empty">
              <p>No coins in your watchlist yet.</p>
              <Link to="/markets" className="btn btn-outline btn-sm mt-2">
                Add Favorites
              </Link>
            </div>
          ) : (
            <div className="mini-watchlist-list">
              {watchlist.slice(0, 4).map((coin) => {
                const pos = (coin.change_24h || 0) >= 0
                return (
                  <Link
                    key={coin.symbol}
                    to={`/coin/${coin.symbol}`}
                    className="mini-watchlist-item"
                  >
                    <div>
                      <span className="mini-coin-name font-semibold">{coin.name}</span>
                      <span className="coin-symbol-pill">{coin.symbol}</span>
                    </div>
                    <div className="mini-coin-right">
                      <span className="font-mono">{formatCurrency(coin.price)}</span>
                      <span className={`change-badge ${pos ? 'positive' : 'negative'}`}>
                        {formatPercent(coin.change_24h)}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* 2-Column Section: Recent Alerts & Scraper Health */}
      <section className="dashboard-two-col-grid">
        {/* Recent Triggered Alerts */}
        <div className="dashboard-widget-card">
          <div className="widget-header">
            <h3 className="widget-title">
              <Bell size={16} /> Recent Price Alerts
            </h3>
            <Link to="/alerts" className="widget-link">
              All Alerts <ArrowRight size={13} />
            </Link>
          </div>
          {recentAlerts.length === 0 ? (
            <div className="widget-empty">
              <p>No alerts triggered recently.</p>
              <Link to="/alerts" className="btn btn-outline btn-sm mt-2">
                Create Alert
              </Link>
            </div>
          ) : (
            <div className="mini-alerts-list">
              {recentAlerts.map((a) => (
                <div key={a.id} className="mini-alert-row">
                  <div>
                    <span className="alert-symbol">{a.symbol}</span>
                    <span className="alert-type-text"> {a.condition_type.replace('_', ' ')}: {a.target_value}</span>
                  </div>
                  <span className="font-mono text-muted text-xs">
                    {a.triggered_at ? new Date(a.triggered_at).toLocaleTimeString() : 'Recent'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scraper Health Widget */}
        <div className="dashboard-widget-card">
          <div className="widget-header">
            <h3 className="widget-title">
              <Activity size={16} /> Scraper Health Status
            </h3>
            <Link to="/system" className="widget-link">
              System Telemetry <ArrowRight size={13} />
            </Link>
          </div>
          <div className="system-widget-body">
            <div className="sys-stat-row">
              <span className="text-secondary">Engine Status:</span>
              <span className="font-semibold text-gain">
                {systemHealth?.status || 'Operational'}
              </span>
            </div>
            <div className="sys-stat-row">
              <span className="text-secondary">Success Rate:</span>
              <span className="font-mono text-gain">
                {systemHealth?.success_rate ?? 100}%
              </span>
            </div>
            <div className="sys-stat-row">
              <span className="text-secondary">Last Run Duration:</span>
              <span className="font-mono">
                {systemHealth?.last_duration ?? 0}s
              </span>
            </div>
            <div className="sys-stat-row">
              <span className="text-secondary">Coins Scraped:</span>
              <span className="font-mono">
                {systemHealth?.last_coins_scraped ?? 10} / 10
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
