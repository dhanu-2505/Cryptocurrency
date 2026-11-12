import { useState, useEffect } from 'react'
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ShieldAlert,
  Layers,
  Activity,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import { compareCoins, getCoins } from '../services/api'
import { formatCurrency, formatPercent, formatCompactNumber } from '../utils/formatters'
import './Compare.css'

const COIN_COLORS = ['#3b7fff', '#10d987', '#f59e0b', '#8b5cf6']

export default function Compare() {
  const [availableCoins, setAvailableCoins] = useState([])
  const [selectedSymbols, setSelectedSymbols] = useState(['BTC', 'ETH', 'SOL'])
  const [comparisonData, setComparisonData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load available coins once
  useEffect(() => {
    getCoins()
      .then((coins) => {
        setAvailableCoins(coins || [])
      })
      .catch((err) => console.error('Failed to load coins list:', err))
  }, [])

  // Load comparison whenever selectedSymbols changes
  const loadComparison = async () => {
    if (selectedSymbols.length === 0) return
    try {
      setLoading(true)
      setError(null)
      const data = await compareCoins(selectedSymbols)
      setComparisonData(data)
    } catch (err) {
      console.error('Comparison error:', err)
      setError('Unable to fetch multi-coin comparison data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComparison()
  }, [selectedSymbols])

  const toggleSymbol = (sym) => {
    if (selectedSymbols.includes(sym)) {
      if (selectedSymbols.length <= 2) {
        alert('Please keep at least 2 coins for comparison.')
        return
      }
      setSelectedSymbols((prev) => prev.filter((s) => s !== sym))
    } else {
      if (selectedSymbols.length >= 4) {
        alert('You can compare a maximum of 4 coins at a time.')
        return
      }
      setSelectedSymbols((prev) => [...prev, sym])
    }
  }

  const coins = comparisonData?.coins || []
  const priceTrends = comparisonData?.price_trends || []

  return (
    <div className="compare-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Coin Comparison</h1>
          <p className="page-subtitle">
            Side-by-side performance, trend, volatility, and historical price comparison (2–4 coins).
          </p>
        </div>
        <button
          className="btn btn-outline btn-sm"
          onClick={loadComparison}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'spinning' : ''} />
          Refresh
        </button>
      </div>

      {/* Coin Selector Chips */}
      <div className="compare-selector-card">
        <div className="selector-header">
          <span className="selector-title">
            <Layers size={16} /> Select Cryptocurrencies (2 to 4)
          </span>
          <span className="selector-count">{selectedSymbols.length} of 4 selected</span>
        </div>
        <div className="coin-chips-wrapper">
          {availableCoins.map((coin) => {
            const isSelected = selectedSymbols.includes(coin.symbol)
            return (
              <button
                key={coin.symbol}
                type="button"
                className={`coin-chip ${isSelected ? 'active' : ''}`}
                onClick={() => toggleSymbol(coin.symbol)}
              >
                <span className="chip-symbol">{coin.symbol}</span>
                <span className="chip-name">{coin.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <RefreshCw size={24} className="spinning text-accent" />
          <p>Calculating comparative market metrics...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <ShieldAlert size={32} className="text-loss" />
          <p>{error}</p>
          <button className="btn btn-outline btn-sm" onClick={loadComparison}>
            Retry
          </button>
        </div>
      ) : coins.length === 0 ? (
        <div className="empty-state">
          <GitCompare size={44} className="text-muted" />
          <h3>No coins selected for comparison</h3>
          <p>Select at least 2 coins from the buttons above to view comparison data.</p>
        </div>
      ) : (
        <>
          {/* Comparison Table */}
          <div className="compare-table-card">
            <div className="card-header">
              <h3 className="card-title">Side-by-Side Metrics</h3>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    {coins.map((c, i) => (
                      <th key={c.symbol} style={{ borderBottom: `2px solid ${COIN_COLORS[i % COIN_COLORS.length]}` }}>
                        <div className="th-coin-header">
                          <span className="th-symbol" style={{ color: COIN_COLORS[i % COIN_COLORS.length] }}>
                            {c.symbol}
                          </span>
                          <span className="th-name">{c.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="metric-label">Rank</td>
                    {coins.map((c) => (
                      <td key={c.symbol} className="font-mono">#{c.rank}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Current Price</td>
                    {coins.map((c) => (
                      <td key={c.symbol} className="font-mono font-semibold">
                        {c.price !== null ? formatCurrency(c.price) : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">24h Change</td>
                    {coins.map((c) => {
                      const pos = (c.change_24h || 0) >= 0
                      return (
                        <td key={c.symbol}>
                          <span className={`change-badge ${pos ? 'positive' : 'negative'}`}>
                            {pos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {formatPercent(c.change_24h)}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                  <tr>
                    <td className="metric-label">Market Capitalization</td>
                    {coins.map((c) => (
                      <td key={c.symbol} className="font-mono text-secondary">
                        {c.market_cap ? `$${formatCompactNumber(c.market_cap)}` : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Trend Classification</td>
                    {coins.map((c) => (
                      <td key={c.symbol}>
                        <span className={`trend-badge trend-${c.trend.toLowerCase().replace(' ', '-')}`}>
                          {c.trend}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Momentum Score</td>
                    {coins.map((c) => {
                      const pos = (c.momentum || 0) >= 0
                      return (
                        <td key={c.symbol} className={`font-mono ${pos ? 'text-gain' : 'text-loss'}`}>
                          {c.momentum > 0 ? '+' : ''}{c.momentum}%
                        </td>
                      )
                    })}
                  </tr>
                  <tr>
                    <td className="metric-label">Volatility Rating</td>
                    {coins.map((c) => (
                      <td key={c.symbol}>
                        <span className={`volatility-badge vol-${c.volatility.toLowerCase()}`}>
                          {c.volatility} ({c.volatility_score}%)
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Drawdown from High</td>
                    {coins.map((c) => (
                      <td key={c.symbol} className="font-mono text-loss">
                        {c.drawdown_pct}%
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Comparison Charts */}
          <div className="compare-charts-grid">
            {/* Historical Price Trend */}
            <div className="compare-chart-card">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">Historical Price Observations</h3>
                  <p className="chart-subtitle">Direct timeline prices recorded in database</p>
                </div>
              </div>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={priceTrends} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
                    <XAxis
                      dataKey="time"
                      stroke="#4a5a74"
                      fontSize={11}
                      tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    />
                    <YAxis
                      stroke="#4a5a74"
                      fontSize={11}
                      tickFormatter={(v) => `$${formatCompactNumber(v)}`}
                    />
                    <Tooltip
                      contentStyle={{ background: '#131c32', border: '1px solid #1e2d4a', borderRadius: '8px' }}
                      formatter={(val) => [formatCurrency(val), '']}
                      labelFormatter={(label) => new Date(label).toLocaleString()}
                    />
                    <Legend />
                    {coins.map((c, i) => (
                      <Line
                        key={c.symbol}
                        type="monotone"
                        dataKey={c.symbol}
                        stroke={COIN_COLORS[i % COIN_COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 24h Change Comparison Bar Chart */}
            <div className="compare-chart-card">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">24h Percentage Change Comparison</h3>
                  <p className="chart-subtitle">Relative 24h market movement</p>
                </div>
              </div>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={coins} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
                    <XAxis dataKey="symbol" stroke="#4a5a74" fontSize={12} />
                    <YAxis stroke="#4a5a74" fontSize={11} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      contentStyle={{ background: '#131c32', border: '1px solid #1e2d4a', borderRadius: '8px' }}
                      formatter={(val) => [`${val > 0 ? '+' : ''}${val}%`, '24h Change']}
                    />
                    <Bar dataKey="change_24h" radius={[4, 4, 0, 0]}>
                      {coins.map((c) => (
                        <Cell
                          key={c.symbol}
                          fill={(c.change_24h || 0) >= 0 ? 'var(--gain-color)' : 'var(--loss-color)'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
