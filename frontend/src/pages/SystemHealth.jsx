import { useState, useEffect } from 'react'
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Server,
  Zap,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { getSystemHealth, getDataQuality, scrapeMarketData } from '../services/api'
import './SystemHealth.css'

export default function SystemHealth() {
  const [health, setHealth] = useState(null)
  const [quality, setQuality] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scraping, setScraping] = useState(false)
  const [error, setError] = useState(null)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [healthData, qualityData] = await Promise.all([
        getSystemHealth(20),
        getDataQuality().catch(() => null),
      ])
      setHealth(healthData)
      setQuality(qualityData)
    } catch (err) {
      console.error('Failed to load system health:', err)
      setError('Unable to load system telemetry.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleManualScrape = async () => {
    try {
      setScraping(true)
      await scrapeMarketData()
      await loadData()
    } catch (err) {
      console.error('Scrape execution failed:', err)
      alert('Manual scrape failed. Check logs.')
    } finally {
      setScraping(false)
    }
  }

  const runs = health?.recent_runs || []

  return (
    <div className="system-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Scraper &amp; System Health</h1>
          <p className="page-subtitle">
            Telemetry, execution duration, and scrape log auditing directly from the database.
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary btn-sm"
            onClick={handleManualScrape}
            disabled={scraping || loading}
          >
            <Zap size={15} className={scraping ? 'spinning' : ''} />
            {scraping ? 'Scraping CMC...' : 'Run Scraper Now'}
          </button>
          <button className="btn btn-outline btn-sm" onClick={loadData} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <Activity size={24} className="spinning text-accent" />
          <p>Gathering system telemetry and scrape logs...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <ShieldAlert size={32} className="text-loss" />
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* Health Metrics Grid */}
          <div className="health-kpi-grid">
            <div className="health-card">
              <span className="health-label">Scraper Status</span>
              <div className="status-indicator-row">
                <span className={`status-dot ${health?.status?.toLowerCase()}`} />
                <span className="health-value">{health?.status || 'Unknown'}</span>
              </div>
              <span className="health-sub">Selenium automation engine</span>
            </div>

            <div className="health-card">
              <span className="health-label">Success Rate</span>
              <span className="health-value text-gain font-mono">
                {health?.success_rate}%
              </span>
              <span className="health-sub">
                {health?.success_runs} of {health?.total_runs} total runs successful
              </span>
            </div>

            <div className="health-card">
              <span className="health-label">Last Duration</span>
              <span className="health-value font-mono">
                {health?.last_duration}s
              </span>
              <span className="health-sub">
                Avg: {health?.average_duration_seconds}s per run
              </span>
            </div>

            <div className="health-card">
              <span className="health-label">Data Quality Score</span>
              <span className="health-value text-accent font-mono">
                {quality ? `${quality.score}%` : '—'}
              </span>
              <span className="health-sub">
                {quality?.valid_prices}/{quality?.expected_coins} valid prices &amp; mcaps
              </span>
            </div>
          </div>

          {/* Charts: Duration & Coins Scraped */}
          <div className="health-charts-grid">
            <div className="health-chart-card">
              <div className="chart-header">
                <h3 className="chart-title">Scrape Execution Duration History</h3>
                <p className="chart-subtitle">Elapsed seconds per scrape run</p>
              </div>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={runs} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
                    <XAxis
                      dataKey="started_at"
                      stroke="#4a5a74"
                      fontSize={10}
                      tickFormatter={(t) => (t ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}
                    />
                    <YAxis stroke="#4a5a74" fontSize={10} unit="s" />
                    <Tooltip
                      contentStyle={{ background: '#131c32', border: '1px solid #1e2d4a', borderRadius: '8px' }}
                      formatter={(val) => [`${val}s`, 'Duration']}
                    />
                    <Line
                      type="monotone"
                      dataKey="duration_seconds"
                      stroke="#3b7fff"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="health-chart-card">
              <div className="chart-header">
                <h3 className="chart-title">Coins Collected per Run</h3>
                <p className="chart-subtitle">Top cryptocurrencies extracted</p>
              </div>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={runs} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
                    <XAxis
                      dataKey="started_at"
                      stroke="#4a5a74"
                      fontSize={10}
                      tickFormatter={(t) => (t ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}
                    />
                    <YAxis stroke="#4a5a74" fontSize={10} domain={[0, 12]} />
                    <Tooltip
                      contentStyle={{ background: '#131c32', border: '1px solid #1e2d4a', borderRadius: '8px' }}
                      formatter={(val) => [`${val} coins`, 'Scraped']}
                    />
                    <Bar dataKey="coins_scraped" fill="#10d987" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Historical Scrape Logs Table */}
          <div className="scrape-logs-table-card">
            <div className="card-header">
              <h3 className="card-title">Scraper Execution Audit Log</h3>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Run ID</th>
                    <th>Started At</th>
                    <th>Duration</th>
                    <th>Coins Collected</th>
                    <th>Status</th>
                    <th>Error Message</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id}>
                      <td className="font-mono text-secondary">#{run.id}</td>
                      <td className="font-mono">
                        {run.started_at ? new Date(run.started_at).toLocaleString() : '—'}
                      </td>
                      <td className="font-mono">{run.duration_seconds}s</td>
                      <td className="font-mono">{run.coins_scraped} / 10</td>
                      <td>
                        <span
                          className={`status-badge ${
                            run.status === 'success'
                              ? 'status-success'
                              : run.status === 'running'
                              ? 'status-running'
                              : 'status-failed'
                          }`}
                        >
                          {run.status}
                        </span>
                      </td>
                      <td className="text-secondary text-sm">
                        {run.error_message || 'None'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
