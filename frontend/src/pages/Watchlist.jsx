import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Star,
  Trash2,
  TrendingUp,
  TrendingDown,
  Plus,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react'
import {
  getWatchlist,
  removeFromWatchlist,
  addToWatchlist,
  getCoins,
} from '../services/api'
import { formatCurrency, formatPercent, formatCompactNumber } from '../utils/formatters'
import './Watchlist.css'

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState([])
  const [availableCoins, setAvailableCoins] = useState([])
  const [selectedCoinToAdd, setSelectedCoinToAdd] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState(null)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [watchData, allCoins] = await Promise.all([
        getWatchlist(),
        getCoins().catch(() => []),
      ])
      setWatchlist(watchData || [])
      setAvailableCoins(allCoins || [])
    } catch (err) {
      console.error('Failed to load watchlist:', err)
      setError('Unable to load watchlist. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRemove = async (symbol) => {
    try {
      await removeFromWatchlist(symbol)
      setWatchlist((prev) => prev.filter((item) => item.symbol !== symbol))
    } catch (err) {
      console.error('Failed to remove coin from watchlist:', err)
      alert(`Could not remove ${symbol} from watchlist.`)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!selectedCoinToAdd) return
    try {
      setAdding(true)
      await addToWatchlist(selectedCoinToAdd)
      setSelectedCoinToAdd('')
      await loadData()
    } catch (err) {
      console.error('Failed to add coin to watchlist:', err)
      alert(`Could not add coin to watchlist.`)
    } finally {
      setAdding(false)
    }
  }

  const unaddedCoins = availableCoins.filter(
    (c) => !watchlist.some((w) => w.symbol === c.symbol)
  )

  return (
    <div className="watchlist-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Personal Watchlist</h1>
          <p className="page-subtitle">
            Track your favorite cryptocurrencies with live prices, volatility, and trend momentum.
          </p>
        </div>
        <div className="header-actions">
          {unaddedCoins.length > 0 && (
            <form onSubmit={handleAdd} className="add-watchlist-form">
              <select
                className="coin-select"
                value={selectedCoinToAdd}
                onChange={(e) => setSelectedCoinToAdd(e.target.value)}
                disabled={adding}
                aria-label="Select coin to add"
              >
                <option value="">+ Add Coin to Watchlist...</option>
                {unaddedCoins.map((c) => (
                  <option key={c.symbol} value={c.symbol}>
                    {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={!selectedCoinToAdd || adding}
              >
                <Plus size={16} />
                Add
              </button>
            </form>
          )}
          <button
            className="btn btn-outline btn-sm"
            onClick={loadData}
            disabled={loading}
            title="Refresh Watchlist"
          >
            <RefreshCw size={15} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <RefreshCw size={24} className="spinning text-accent" />
          <p>Calculating market intelligence for watchlist...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <ShieldAlert size={32} className="text-loss" />
          <p>{error}</p>
          <button className="btn btn-outline btn-sm" onClick={loadData}>
            Retry
          </button>
        </div>
      ) : watchlist.length === 0 ? (
        <div className="empty-state">
          <Star size={44} className="text-muted" />
          <h3>Your Watchlist is Empty</h3>
          <p>
            You haven't added any coins to your watchlist yet. Use the selector above or the star icon on the Markets and Dashboard pages to start tracking.
          </p>
          <Link to="/markets" className="btn btn-primary mt-3">
            Explore Markets
          </Link>
        </div>
      ) : (
        <div className="watchlist-table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Coin</th>
                  <th>Price</th>
                  <th>24h Change</th>
                  <th>Market Cap</th>
                  <th>Trend</th>
                  <th>Volatility</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map((coin) => {
                  const isPositive = (coin.change_24h || 0) >= 0
                  return (
                    <tr key={coin.symbol}>
                      <td className="rank-cell">#{coin.rank || '—'}</td>
                      <td>
                        <Link to={`/coin/${coin.symbol}`} className="coin-name-cell">
                          <span className="coin-name-bold">{coin.name}</span>
                          <span className="coin-symbol-pill">{coin.symbol}</span>
                        </Link>
                      </td>
                      <td className="font-mono price-cell">
                        {coin.price !== null ? formatCurrency(coin.price) : '—'}
                      </td>
                      <td>
                        <span
                          className={`change-badge ${
                            isPositive ? 'positive' : 'negative'
                          }`}
                        >
                          {isPositive ? (
                            <TrendingUp size={13} />
                          ) : (
                            <TrendingDown size={13} />
                          )}
                          {formatPercent(coin.change_24h)}
                        </span>
                      </td>
                      <td className="text-secondary font-mono">
                        {coin.market_cap ? `$${formatCompactNumber(coin.market_cap)}` : '—'}
                      </td>
                      <td>
                        <span className={`trend-badge trend-${(coin.trend || 'neutral').toLowerCase().replace(' ', '-')}`}>
                          {coin.trend || 'Neutral'}
                        </span>
                      </td>
                      <td>
                        <span className={`volatility-badge vol-${(coin.volatility || 'low').toLowerCase()}`}>
                          {coin.volatility || 'Low'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Link
                            to={`/coin/${coin.symbol}`}
                            className="icon-action-btn view-btn"
                            title="View Coin Details"
                          >
                            <ExternalLink size={16} />
                          </Link>
                          <button
                            className="icon-action-btn delete-btn"
                            onClick={() => handleRemove(coin.symbol)}
                            title="Remove from Watchlist"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
