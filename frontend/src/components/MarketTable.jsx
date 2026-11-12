import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpDown, ArrowUp, ArrowDown, Search, ExternalLink, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { formatPrice, formatMarketCap, formatChange } from '../utils/formatters'
import { getWatchlistSymbols, addToWatchlist, removeFromWatchlist } from '../services/api'
import CoinIcon from './CoinIcon'
import './MarketTable.css'

const PAGE_SIZE = 10

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <ArrowUpDown size={13} className="sort-icon neutral" />
  return sortDir === 'asc'
    ? <ArrowUp size={13} className="sort-icon active" />
    : <ArrowDown size={13} className="sort-icon active" />
}

export default function MarketTable({ coins, loading }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('rank')
  const [sortDir, setSortDir] = useState('asc')
  const [filter, setFilter] = useState('all') // all | gainers | losers
  const [page, setPage] = useState(1)
  const [watchedSymbols, setWatchedSymbols] = useState([])

  useEffect(() => {
    getWatchlistSymbols()
      .then(syms => setWatchedSymbols(syms || []))
      .catch(() => {})
  }, [])

  const handleToggleWatch = async (e, symbol) => {
    e.stopPropagation()
    const sym = symbol.toUpperCase()
    const isWatched = watchedSymbols.includes(sym)
    try {
      if (isWatched) {
        await removeFromWatchlist(sym)
        setWatchedSymbols(prev => prev.filter(s => s !== sym))
      } else {
        await addToWatchlist(sym)
        setWatchedSymbols(prev => [...prev, sym])
      }
    } catch (err) {
      console.error('Failed to toggle watchlist:', err)
    }
  }

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
    setPage(1)
  }

  const filtered = useMemo(() => {
    let list = [...(coins || [])]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
      )
    }
    if (filter === 'gainers') list = list.filter(c => (c.change_24h ?? 0) > 0)
    if (filter === 'losers')  list = list.filter(c => (c.change_24h ?? 0) < 0)

    list.sort((a, b) => {
      let va = a[sortField] ?? (sortDir === 'asc' ? Infinity : -Infinity)
      let vb = b[sortField] ?? (sortDir === 'asc' ? Infinity : -Infinity)
      if (typeof va === 'string') va = va.toLowerCase()
      if (typeof vb === 'string') vb = vb.toLowerCase()
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [coins, search, sortField, sortDir, filter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (loading) {
    return (
      <div className="market-table-container card">
        <div className="market-table-toolbar">
          <div className="skeleton" style={{ width: 220, height: 36, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 160, height: 36, borderRadius: 8 }} />
        </div>
        <div className="table-wrapper" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                {['#', 'Coin', 'Price', '24h Change', 'Market Cap', 'Status'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {[40, 160, 100, 80, 120, 60].map((w, j) => (
                    <td key={j}><div className="skeleton" style={{ width: w, height: 14 }} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="market-table-container card">
      {/* Toolbar */}
      <div className="market-table-toolbar">
        <div className="search-wrapper">
          <Search size={15} className="search-icon" />
          <input
            className="input search-input"
            placeholder="Search by name or symbol…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            id="coin-search"
          />
        </div>
        <div className="filter-tabs">
          {['all', 'gainers', 'losers'].map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => { setFilter(f); setPage(1) }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>No coins found</h3>
          <p>Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
                <th onClick={() => handleSort('rank')}>
                  # <SortIcon field="rank" sortField={sortField} sortDir={sortDir} />
                </th>
                <th onClick={() => handleSort('name')}>
                  Coin <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
                </th>
                <th onClick={() => handleSort('price')}>
                  Price <SortIcon field="price" sortField={sortField} sortDir={sortDir} />
                </th>
                <th onClick={() => handleSort('change_24h')}>
                  24h % <SortIcon field="change_24h" sortField={sortField} sortDir={sortDir} />
                </th>
                <th onClick={() => handleSort('market_cap')}>
                  Market Cap <SortIcon field="market_cap" sortField={sortField} sortDir={sortDir} />
                </th>
                <th>Status</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(coin => {
                const pos = coin.change_24h != null && coin.change_24h >= 0
                const isWatched = watchedSymbols.includes(coin.symbol.toUpperCase())
                return (
                  <tr
                    key={coin.symbol}
                    className="table-row-clickable"
                    onClick={() => navigate(`/coin/${coin.symbol}`)}
                  >
                    <td onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn-star"
                        onClick={e => handleToggleWatch(e, coin.symbol)}
                        title={isWatched ? 'Remove from Watchlist' : 'Add to Watchlist'}
                      >
                        <Star
                          size={15}
                          fill={isWatched ? '#f59e0b' : 'none'}
                          color={isWatched ? '#f59e0b' : 'var(--text-muted)'}
                        />
                      </button>
                    </td>
                    <td className="rank-cell">#{coin.rank}</td>
                    <td>
                      <div className="coin-name-cell">
                        <CoinIcon symbol={coin.symbol} size={28} />
                        <div>
                          <div className="coin-name">{coin.name}</div>
                          <div className="coin-symbol">{coin.symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className="price-cell mono">{formatPrice(coin.price)}</td>
                    <td>
                      <span className={`badge ${pos ? 'badge-gain' : 'badge-loss'}`}>
                        {coin.change_24h != null ? (pos ? '+' : '') + coin.change_24h.toFixed(2) + '%' : '—'}
                      </span>
                    </td>
                    <td className="mono">{formatMarketCap(coin.market_cap)}</td>
                    <td><span className="badge badge-live">Live</span></td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={e => { e.stopPropagation(); navigate(`/coin/${coin.symbol}`) }}
                        title="View details"
                      >
                        <ExternalLink size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="table-pagination">
          <span className="pagination-info">
            {filtered.length} coins · Page {page} of {totalPages}
          </span>
          <div className="pagination-btns">
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft size={15} />
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
