import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutGrid, RefreshCw, ShieldAlert, TrendingUp, TrendingDown, Info } from 'lucide-react'
import { getTopCoins } from '../services/api'
import { formatCurrency, formatPercent, formatCompactNumber } from '../utils/formatters'
import './Heatmap.css'

export default function Heatmap() {
  const [coins, setCoins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getTopCoins()
      setCoins(data || [])
    } catch (err) {
      console.error('Failed to load heatmap data:', err)
      setError('Unable to load cryptocurrency heatmap data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Calculate total market cap of top 10 to determine tile weights
  const totalMcap = coins.reduce((acc, c) => acc + (c.market_cap || 0), 0)

  // Color generator based on 24h % change
  const getTileStyle = (change24h) => {
    const chg = change24h || 0
    if (chg >= 5.0) {
      return {
        background: 'linear-gradient(135deg, rgba(16, 217, 135, 0.45), rgba(16, 217, 135, 0.2))',
        border: '1px solid rgba(16, 217, 135, 0.6)',
        color: '#ffffff',
      }
    } else if (chg >= 2.0) {
      return {
        background: 'linear-gradient(135deg, rgba(16, 217, 135, 0.3), rgba(16, 217, 135, 0.12))',
        border: '1px solid rgba(16, 217, 135, 0.4)',
        color: '#ffffff',
      }
    } else if (chg >= 0) {
      return {
        background: 'linear-gradient(135deg, rgba(16, 217, 135, 0.18), rgba(16, 217, 135, 0.06))',
        border: '1px solid rgba(16, 217, 135, 0.25)',
        color: '#e8edf5',
      }
    } else if (chg >= -2.0) {
      return {
        background: 'linear-gradient(135deg, rgba(255, 78, 106, 0.18), rgba(255, 78, 106, 0.06))',
        border: '1px solid rgba(255, 78, 106, 0.25)',
        color: '#e8edf5',
      }
    } else if (chg >= -5.0) {
      return {
        background: 'linear-gradient(135deg, rgba(255, 78, 106, 0.3), rgba(255, 78, 106, 0.12))',
        border: '1px solid rgba(255, 78, 106, 0.4)',
        color: '#ffffff',
      }
    } else {
      return {
        background: 'linear-gradient(135deg, rgba(255, 78, 106, 0.45), rgba(255, 78, 106, 0.2))',
        border: '1px solid rgba(255, 78, 106, 0.6)',
        color: '#ffffff',
      }
    }
  }

  return (
    <div className="heatmap-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Market Heatmap</h1>
          <p className="page-subtitle">
            Visual treemap of top 10 cryptocurrencies weighted by market capitalization and 24h price movement.
          </p>
        </div>
        <button
          className="btn btn-outline btn-sm"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'spinning' : ''} />
          Refresh
        </button>
      </div>

      {/* Legend & Summary */}
      <div className="heatmap-legend-bar">
        <div className="legend-items">
          <span className="legend-title"><Info size={14} /> 24h Movement:</span>
          <span className="legend-chip deep-loss">&lt; -5%</span>
          <span className="legend-chip mod-loss">-2% to -5%</span>
          <span className="legend-chip mild-loss">0% to -2%</span>
          <span className="legend-chip mild-gain">0% to +2%</span>
          <span className="legend-chip mod-gain">+2% to +5%</span>
          <span className="legend-chip deep-gain">&gt; +5%</span>
        </div>
        <div className="legend-hint">
          Click any tile to inspect coin details &amp; intelligence
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <RefreshCw size={24} className="spinning text-accent" />
          <p>Calculating market-cap weighted heatmap...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <ShieldAlert size={32} className="text-loss" />
          <p>{error}</p>
          <button className="btn btn-outline btn-sm" onClick={loadData}>
            Retry
          </button>
        </div>
      ) : coins.length === 0 ? (
        <div className="empty-state">
          <LayoutGrid size={44} className="text-muted" />
          <h3>No Market Data Available</h3>
          <p>Trigger a market scrape to populate the crypto heatmap.</p>
        </div>
      ) : (
        <div className="heatmap-treemap-container">
          {coins.map((coin) => {
            const mcap = coin.market_cap || 0
            const share = totalMcap > 0 ? (mcap / totalMcap) * 100 : 10
            const isPositive = (coin.change_24h || 0) >= 0
            const style = getTileStyle(coin.change_24h)

            // Dynamic flex or grid span based on market share
            let sizeClass = 'tile-small'
            if (share > 35) sizeClass = 'tile-giant'
            else if (share > 15) sizeClass = 'tile-large'
            else if (share > 5) sizeClass = 'tile-medium'

            return (
              <div
                key={coin.symbol}
                className={`heatmap-tile ${sizeClass}`}
                style={style}
                onClick={() => navigate(`/coin/${coin.symbol}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigate(`/coin/${coin.symbol}`)
                }}
                title={`${coin.name} (${coin.symbol}): ${formatCurrency(coin.price)} (${formatPercent(coin.change_24h)})`}
              >
                <div className="tile-top">
                  <div className="tile-symbol-rank">
                    <span className="tile-symbol">{coin.symbol}</span>
                    <span className="tile-rank">#{coin.rank}</span>
                  </div>
                  <span className="tile-name">{coin.name}</span>
                </div>

                <div className="tile-bottom">
                  <div className="tile-price font-mono">
                    {coin.price !== null ? formatCurrency(coin.price) : '—'}
                  </div>
                  <div className="tile-footer">
                    <span className={`tile-change ${isPositive ? 'positive' : 'negative'}`}>
                      {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {formatPercent(coin.change_24h)}
                    </span>
                    <span className="tile-mcap">
                      MCap ${formatCompactNumber(coin.market_cap)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
