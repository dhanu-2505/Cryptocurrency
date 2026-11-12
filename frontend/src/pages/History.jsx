import { useState, useEffect, useMemo } from 'react'
import { Download, Filter, AlertCircle } from 'lucide-react'
import { getCoins } from '../services/api'
import { exportCSV } from '../services/api'
import { formatPrice, formatMarketCap, formatDate } from '../utils/formatters'
import './History.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'

export default function History() {
  const [history, setHistory] = useState([])
  const [coins, setCoins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [selectedCoin, setSelectedCoin] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [changeFilter, setChangeFilter] = useState('all') // all | gainers | losers

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { default: api } = await import('../services/api')
        const coinsRes = await api.get('/api/coins').then(r => r.data)
        // Fetch history for all coins in parallel
        const histPromises = coinsRes.map(c =>
          api.get(`/api/coins/${c.symbol}/history`, { params: { limit: 50 } })
            .then(r => r.data.map(h => ({ ...h, name: c.name, symbol: c.symbol, rank: c.rank })))
            .catch(() => [])
        )
        const allHistory = (await Promise.all(histPromises)).flat()
        allHistory.sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))
        setHistory(allHistory)
        setCoins(coinsRes)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = history
    if (selectedCoin) list = list.filter(h => h.symbol === selectedCoin)
    if (minPrice) list = list.filter(h => h.price >= Number(minPrice))
    if (maxPrice) list = list.filter(h => h.price <= Number(maxPrice))
    if (changeFilter === 'gainers') list = list.filter(h => (h.change_24h ?? 0) > 0)
    if (changeFilter === 'losers')  list = list.filter(h => (h.change_24h ?? 0) < 0)
    return list
  }, [history, selectedCoin, minPrice, maxPrice, changeFilter])

  const handleExport = () => {
    const url = selectedCoin
      ? `${API_BASE}/api/export/csv?symbol=${selectedCoin}`
      : `${API_BASE}/api/export/csv`
    const link = document.createElement('a')
    link.href = url
    link.download = `crypto_history_${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div>
      <div className="page-header history-header">
        <div>
          <h1>History</h1>
          <p>Historical price records across all scrape sessions</p>
        </div>
        <button className="btn btn-secondary" onClick={handleExport} id="export-csv-btn">
          <Download size={15} />
          Export CSV
        </button>
      </div>

      {error && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="history-filters card" style={{ marginBottom: 20 }}>
        <div className="filters-row">
          <div className="filter-group">
            <label className="filter-label">Coin</label>
            <select
              className="input"
              value={selectedCoin}
              onChange={e => setSelectedCoin(e.target.value)}
              id="history-coin-filter"
            >
              <option value="">All Coins</option>
              {coins.map(c => <option key={c.symbol} value={c.symbol}>{c.name} ({c.symbol})</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Min Price ($)</label>
            <input className="input" type="number" placeholder="0" value={minPrice}
              onChange={e => setMinPrice(e.target.value)} id="history-min-price" />
          </div>
          <div className="filter-group">
            <label className="filter-label">Max Price ($)</label>
            <input className="input" type="number" placeholder="∞" value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)} id="history-max-price" />
          </div>
          <div className="filter-group">
            <label className="filter-label">24h Change</label>
            <select className="input" value={changeFilter} onChange={e => setChangeFilter(e.target.value)}
              id="history-change-filter">
              <option value="all">All</option>
              <option value="gainers">Gainers Only</option>
              <option value="losers">Losers Only</option>
            </select>
          </div>
          <button
            className="btn btn-ghost btn-sm filter-reset"
            onClick={() => { setSelectedCoin(''); setMinPrice(''); setMaxPrice(''); setChangeFilter('all') }}
          >
            Clear Filters
          </button>
        </div>
        <div className="filter-result-count">
          Showing <strong>{filtered.length}</strong> of {history.length} records
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="table-wrapper card">
          <div style={{ padding: 20 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 40, marginBottom: 8 }} />
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">📋</div>
          <h3>No records found</h3>
          <p>Adjust your filters or scrape market data to build history.</p>
        </div>
      ) : (
        <div className="table-wrapper card" style={{ padding: 0 }}>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Rank</th>
                  <th>Coin</th>
                  <th>Price</th>
                  <th>24h Change</th>
                  <th>Market Cap</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 200).map((h, i) => {
                  const pos = (h.change_24h ?? 0) >= 0
                  return (
                    <tr key={`${h.id}-${i}`}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{formatDate(h.recorded_at)}</td>
                      <td style={{ color: 'var(--text-muted)' }}>#{h.rank}</td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600 }}>{h.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{h.symbol}</div>
                        </div>
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
    </div>
  )
}
