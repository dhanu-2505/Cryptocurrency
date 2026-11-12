import { useState, useEffect } from 'react'
import {
  Briefcase,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ShieldAlert,
  Award,
  AlertCircle,
  DollarSign,
  PieChart,
} from 'lucide-react'
import {
  getPortfolio,
  addPortfolioHolding,
  deletePortfolioHolding,
  getCoins,
} from '../services/api'
import { formatCurrency, formatPercent, formatCompactNumber } from '../utils/formatters'
import './Portfolio.css'

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState(null)
  const [availableCoins, setAvailableCoins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Add holding form states
  const [symbol, setSymbol] = useState('BTC')
  const [quantity, setQuantity] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [portData, coinsData] = await Promise.all([
        getPortfolio(),
        getCoins().catch(() => []),
      ])
      setPortfolio(portData)
      setAvailableCoins(coinsData || [])
    } catch (err) {
      console.error('Portfolio load error:', err)
      setError('Unable to load virtual portfolio data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAddHolding = async (e) => {
    e.preventDefault()
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      alert('Please enter a valid positive quantity.')
      return
    }

    try {
      setSubmitting(true)
      await addPortfolioHolding({
        symbol: symbol.toUpperCase(),
        quantity: Number(quantity),
        purchase_price: purchasePrice ? Number(purchasePrice) : null,
      })
      setQuantity('')
      setPurchasePrice('')
      await loadData()
    } catch (err) {
      console.error('Failed to add holding:', err)
      alert('Failed to add holding to virtual portfolio.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteHolding = async (id) => {
    if (!window.confirm('Delete this virtual holding?')) return
    try {
      await deletePortfolioHolding(id)
      await loadData()
    } catch (err) {
      console.error('Failed to delete holding:', err)
      alert('Failed to delete holding.')
    }
  }

  const holdings = portfolio?.holdings || []
  const isTotalGain = (portfolio?.total_profit_loss || 0) >= 0

  return (
    <div className="portfolio-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Portfolio Simulator</h1>
          <p className="page-subtitle">
            Virtual paper portfolio tracker with live P&amp;L valuations based on stored market prices.
          </p>
        </div>
        <div className="simulation-notice">
          <AlertCircle size={14} />
          <span>Virtual Simulation Only</span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="portfolio-summary-grid">
        <div className="summary-card highlight-card">
          <span className="summary-label">Total Portfolio Value</span>
          <span className="summary-value font-mono">
            {portfolio ? formatCurrency(portfolio.total_current_value) : '$0.00'}
          </span>
          <span className="summary-sub">Live valuation across all assets</span>
        </div>

        <div className="summary-card">
          <span className="summary-label">Total Invested Cost</span>
          <span className="summary-value font-mono">
            {portfolio ? formatCurrency(portfolio.total_invested_value) : '$0.00'}
          </span>
          <span className="summary-sub">Initial purchase basis</span>
        </div>

        <div className="summary-card">
          <span className="summary-label">Total Profit / Loss</span>
          <div className="pl-value-row">
            <span className={`summary-value font-mono ${isTotalGain ? 'text-gain' : 'text-loss'}`}>
              {portfolio
                ? `${portfolio.total_profit_loss >= 0 ? '+' : ''}${formatCurrency(portfolio.total_profit_loss)}`
                : '$0.00'}
            </span>
            <span className={`summary-pill ${isTotalGain ? 'positive' : 'negative'}`}>
              {portfolio ? formatPercent(portfolio.total_profit_loss_pct) : '0.00%'}
            </span>
          </div>
          <span className="summary-sub">Net paper return</span>
        </div>

        <div className="summary-card">
          <span className="summary-label">Best Performer</span>
          {portfolio?.best_performer ? (
            <div className="performer-info">
              <span className="performer-symbol">{portfolio.best_performer.symbol}</span>
              <span className="performer-pct text-gain font-mono">
                +{portfolio.best_performer.profit_loss_pct}%
              </span>
            </div>
          ) : (
            <span className="summary-sub mt-2">No holdings added</span>
          )}
        </div>
      </div>

      {/* Add Holding Section */}
      <div className="add-holding-card">
        <div className="card-header">
          <h3 className="card-title">
            <Plus size={18} /> Add Asset to Simulator
          </h3>
        </div>
        <form onSubmit={handleAddHolding} className="add-holding-form">
          <div className="form-group">
            <label>Asset</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="form-input"
            >
              {availableCoins.map((c) => (
                <option key={c.symbol} value={c.symbol}>
                  {c.name} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Quantity Owned</label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 0.5"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Buy Price / Unit ($ optional)</label>
            <input
              type="number"
              step="any"
              placeholder="Leave blank for live price"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              className="form-input"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary form-submit-btn"
            disabled={submitting}
          >
            <Plus size={16} />
            {submitting ? 'Adding...' : 'Add Holding'}
          </button>
        </form>
      </div>

      {/* Holdings Table */}
      {loading ? (
        <div className="loading-state">
          <RefreshCw size={24} className="spinning text-accent" />
          <p>Valuating simulated portfolio against market data...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <ShieldAlert size={32} className="text-loss" />
          <p>{error}</p>
        </div>
      ) : holdings.length === 0 ? (
        <div className="empty-state">
          <Briefcase size={44} className="text-muted" />
          <h3>No Holdings in Simulator</h3>
          <p>
            Start your virtual paper portfolio by adding your first cryptocurrency holding using the form above.
          </p>
        </div>
      ) : (
        <div className="holdings-table-card">
          <div className="card-header">
            <h3 className="card-title">Virtual Asset Holdings</h3>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Quantity</th>
                  <th>Avg Buy Price</th>
                  <th>Current Price</th>
                  <th>Invested Value</th>
                  <th>Current Value</th>
                  <th>Profit / Loss</th>
                  <th>24h Change</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => {
                  const isGain = h.profit_loss >= 0
                  return (
                    <tr key={h.id}>
                      <td className="font-semibold">
                        {h.name} <span className="coin-symbol-pill">{h.symbol}</span>
                      </td>
                      <td className="font-mono">{h.quantity}</td>
                      <td className="font-mono text-secondary">
                        {h.purchase_price ? formatCurrency(h.purchase_price) : '—'}
                      </td>
                      <td className="font-mono">{formatCurrency(h.current_price)}</td>
                      <td className="font-mono text-secondary">
                        {formatCurrency(h.invested_value)}
                      </td>
                      <td className="font-mono font-semibold">
                        {formatCurrency(h.current_value)}
                      </td>
                      <td>
                        <div className={`pl-cell ${isGain ? 'text-gain' : 'text-loss'}`}>
                          <span>{isGain ? '+' : ''}{formatCurrency(h.profit_loss)}</span>
                          <span className="pl-pct">
                            ({isGain ? '+' : ''}{h.profit_loss_pct}%)
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`change-badge ${(h.change_24h || 0) >= 0 ? 'positive' : 'negative'}`}
                        >
                          {formatPercent(h.change_24h)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="icon-action-btn delete-btn"
                          onClick={() => handleDeleteHolding(h.id)}
                          title="Remove holding"
                        >
                          <Trash2 size={16} />
                        </button>
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
