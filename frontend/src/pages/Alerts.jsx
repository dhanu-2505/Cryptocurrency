import { useState, useEffect } from 'react'
import {
  Bell,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  Power,
  TrendingUp,
  TrendingDown,
  Clock,
} from 'lucide-react'
import {
  getAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  getCoins,
} from '../services/api'
import { formatCurrency, formatPercent } from '../utils/formatters'
import './Alerts.css'

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [availableCoins, setAvailableCoins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Form states
  const [symbol, setSymbol] = useState('BTC')
  const [conditionType, setConditionType] = useState('price_above')
  const [targetValue, setTargetValue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [alertsData, coinsData] = await Promise.all([
        getAlerts(),
        getCoins().catch(() => []),
      ])
      setAlerts(alertsData || [])
      setAvailableCoins(coinsData || [])
    } catch (err) {
      console.error('Failed to load alerts:', err)
      setError('Unable to load price alerts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!targetValue || isNaN(Number(targetValue))) {
      alert('Please enter a valid numeric target value.')
      return
    }

    try {
      setSubmitting(true)
      await createAlert({
        symbol: symbol.toUpperCase(),
        condition_type: conditionType,
        target_value: Number(targetValue),
      })
      setTargetValue('')
      await loadData()
    } catch (err) {
      console.error('Failed to create alert:', err)
      alert('Failed to create price alert.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (alertItem) => {
    try {
      await updateAlert(alertItem.id, { is_active: !alertItem.is_active })
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertItem.id ? { ...a, is_active: !a.is_active } : a
        )
      )
    } catch (err) {
      console.error('Failed to update alert:', err)
      alert('Failed to update alert.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this price alert?')) return
    try {
      await deleteAlert(id)
      setAlerts((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      console.error('Failed to delete alert:', err)
      alert('Failed to delete alert.')
    }
  }

  const activeAlerts = alerts.filter((a) => a.is_active && !a.triggered_at)
  const triggeredAlerts = alerts.filter((a) => a.triggered_at)
  const inactiveAlerts = alerts.filter((a) => !a.is_active)

  const formatCondition = (type, val) => {
    switch (type) {
      case 'price_above':
        return `Price Above ${formatCurrency(val)}`
      case 'price_below':
        return `Price Below ${formatCurrency(val)}`
      case 'change_above':
        return `24h Change Above +${val}%`
      case 'change_below':
        return `24h Change Below ${val}%`
      default:
        return `${type} ${val}`
    }
  }

  return (
    <div className="alerts-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Smart Price Alerts</h1>
          <p className="page-subtitle">
            Configure threshold triggers for price boundaries and 24h percentage swings.
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={loadData} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'spinning' : ''} />
          Refresh
        </button>
      </div>

      {/* Create Alert Card */}
      <div className="create-alert-card">
        <div className="card-header">
          <h3 className="card-title">
            <Plus size={18} /> Create New Market Alert
          </h3>
        </div>
        <form onSubmit={handleCreate} className="create-alert-form">
          <div className="form-group">
            <label>Cryptocurrency</label>
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
            <label>Condition Type</label>
            <select
              value={conditionType}
              onChange={(e) => setConditionType(e.target.value)}
              className="form-input"
            >
              <option value="price_above">Price Above Target ($)</option>
              <option value="price_below">Price Below Target ($)</option>
              <option value="change_above">24h Change Above (+%)</option>
              <option value="change_below">24h Change Below (-%)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Target Value</label>
            <input
              type="number"
              step="any"
              placeholder={conditionType.startsWith('price') ? 'e.g. 70000' : 'e.g. 5.0'}
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary form-submit-btn"
            disabled={submitting}
          >
            <Plus size={16} />
            {submitting ? 'Creating...' : 'Set Alert'}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="loading-state">
          <RefreshCw size={24} className="spinning text-accent" />
          <p>Evaluating active alerts against live market records...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <ShieldAlert size={32} className="text-loss" />
          <p>{error}</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="empty-state">
          <Bell size={44} className="text-muted" />
          <h3>No Alerts Configured</h3>
          <p>Create your first price alert above to get notified when market targets are reached.</p>
        </div>
      ) : (
        <div className="alerts-sections-grid">
          {/* Active Alerts */}
          <div className="alerts-column-card">
            <div className="column-header">
              <h3 className="column-title">
                <CheckCircle2 size={16} className="text-gain" />
                Active Monitoring ({activeAlerts.length})
              </h3>
            </div>
            {activeAlerts.length === 0 ? (
              <p className="no-items-text">No active alerts waiting for triggers.</p>
            ) : (
              <div className="alerts-list">
                {activeAlerts.map((a) => (
                  <div key={a.id} className="alert-item">
                    <div className="alert-item-left">
                      <span className="alert-symbol">{a.symbol}</span>
                      <span className="alert-condition">
                        {formatCondition(a.condition_type, a.target_value)}
                      </span>
                      <span className="alert-curr-meta">
                        Current: {a.current_price ? formatCurrency(a.current_price) : '—'}
                        {a.current_change_24h !== null && (
                          <span className={a.current_change_24h >= 0 ? 'text-gain' : 'text-loss'}>
                            {' '}({formatPercent(a.current_change_24h)})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="alert-item-actions">
                      <button
                        className="btn-icon"
                        onClick={() => handleToggleActive(a)}
                        title="Pause Alert"
                      >
                        <Power size={15} className="text-gain" />
                      </button>
                      <button
                        className="btn-icon delete"
                        onClick={() => handleDelete(a.id)}
                        title="Delete Alert"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Triggered Alerts */}
          <div className="alerts-column-card">
            <div className="column-header">
              <h3 className="column-title">
                <AlertTriangle size={16} className="text-warning" />
                Triggered Alerts ({triggeredAlerts.length})
              </h3>
            </div>
            {triggeredAlerts.length === 0 ? (
              <p className="no-items-text">No alerts have triggered yet.</p>
            ) : (
              <div className="alerts-list">
                {triggeredAlerts.map((a) => (
                  <div key={a.id} className="alert-item triggered">
                    <div className="alert-item-left">
                      <div className="triggered-title-row">
                        <span className="alert-symbol">{a.symbol}</span>
                        <span className="triggered-badge">TRIGGERED</span>
                      </div>
                      <span className="alert-condition">
                        {formatCondition(a.condition_type, a.target_value)}
                      </span>
                      <span className="alert-curr-meta">
                        <Clock size={12} /> Triggered at:{' '}
                        {new Date(a.triggered_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="alert-item-actions">
                      <button
                        className="btn-icon delete"
                        onClick={() => handleDelete(a.id)}
                        title="Dismiss & Delete Alert"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
