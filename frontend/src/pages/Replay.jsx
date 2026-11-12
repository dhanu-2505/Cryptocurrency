import { useState, useEffect, useRef } from 'react'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Clock,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Calendar,
  Zap,
} from 'lucide-react'
import { getReplayTimestamps, getReplaySnapshot } from '../services/api'
import { formatCurrency, formatPercent, formatCompactNumber } from '../utils/formatters'
import './Replay.css'

export default function Replay() {
  const [timestamps, setTimestamps] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [snapshot, setSnapshot] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1) // 1x, 2x, 5x
  const [loading, setLoading] = useState(true)
  const [loadingSnapshot, setLoadingSnapshot] = useState(false)
  const [error, setError] = useState(null)
  const timerRef = useRef(null)

  // 1. Fetch available timestamps
  useEffect(() => {
    async function init() {
      try {
        setLoading(true)
        setError(null)
        const res = await getReplayTimestamps()
        if (res.status === 'insufficient_data' || !res.timestamps || res.timestamps.length < 2) {
          setError('Market replay requires additional historical observations.')
          setTimestamps(res.timestamps || [])
          return
        }
        setTimestamps(res.timestamps)
        setCurrentIndex(0)
      } catch (err) {
        console.error('Failed to load replay timestamps:', err)
        setError('Unable to load replay timeline.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // 2. Fetch snapshot whenever currentIndex changes
  useEffect(() => {
    if (timestamps.length === 0 || currentIndex >= timestamps.length) return

    let cancelled = false
    async function loadCurrentSnapshot() {
      try {
        setLoadingSnapshot(true)
        const ts = timestamps[currentIndex]
        const data = await getReplaySnapshot(ts)
        if (!cancelled) {
          setSnapshot(data)
        }
      } catch (err) {
        console.error('Failed to load snapshot:', err)
      } finally {
        if (!cancelled) setLoadingSnapshot(false)
      }
    }

    loadCurrentSnapshot()
    return () => {
      cancelled = true
    }
  }, [currentIndex, timestamps])

  // 3. Play / Pause interval loop
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(500, 2000 / playbackSpeed)
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev + 1 >= timestamps.length) {
            setIsPlaying(false) // Reached end
            return prev
          }
          return prev + 1
        })
      }, intervalMs)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, playbackSpeed, timestamps.length])

  const handlePrev = () => {
    setIsPlaying(false)
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setIsPlaying(false)
    setCurrentIndex((prev) => Math.min(timestamps.length - 1, prev + 1))
  }

  const handleSliderChange = (e) => {
    setIsPlaying(false)
    setCurrentIndex(Number(e.target.value))
  }

  const currentTsString = timestamps[currentIndex]
    ? new Date(timestamps[currentIndex]).toLocaleString()
    : '—'

  return (
    <div className="replay-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Historical Market Replay</h1>
          <p className="page-subtitle">
            Step through and playback recorded market history observation by observation.
          </p>
        </div>
        <div className="replay-badge">
          <Clock size={15} />
          <span>Timeline Mode</span>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <Clock size={28} className="spinning text-accent" />
          <p>Loading market replay timeline...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <ShieldAlert size={36} className="text-warning" />
          <h3>Timeline Notice</h3>
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* Timeline Control Bar */}
          <div className="timeline-control-panel">
            <div className="timeline-slider-row">
              <span className="timeline-bound-time">
                {new Date(timestamps[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <div className="slider-wrapper">
                <input
                  type="range"
                  min={0}
                  max={timestamps.length - 1}
                  value={currentIndex}
                  onChange={handleSliderChange}
                  className="timeline-slider"
                  aria-label="Replay timeline position"
                />
                <div className="current-timestamp-indicator">
                  <Calendar size={13} />
                  <span>{currentTsString}</span>
                  <span className="step-count">
                    ({currentIndex + 1} of {timestamps.length})
                  </span>
                </div>
              </div>
              <span className="timeline-bound-time">
                {new Date(timestamps[timestamps.length - 1]).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {/* Playback Button Controls */}
            <div className="playback-controls-row">
              <div className="playback-btns">
                <button
                  className="control-btn"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  title="Previous Observation"
                >
                  <SkipBack size={18} />
                </button>
                <button
                  className="control-btn play-pause-btn"
                  onClick={() => setIsPlaying(!isPlaying)}
                  title={isPlaying ? 'Pause' : 'Play Replay'}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <button
                  className="control-btn"
                  onClick={handleNext}
                  disabled={currentIndex >= timestamps.length - 1}
                  title="Next Observation"
                >
                  <SkipForward size={18} />
                </button>
                <button
                  className="control-btn"
                  onClick={() => {
                    setIsPlaying(false)
                    setCurrentIndex(0)
                  }}
                  title="Reset to Beginning"
                >
                  <RotateCcw size={16} />
                </button>
              </div>

              <div className="speed-selector">
                <span className="speed-label">Speed:</span>
                {[1, 2, 5].map((speed) => (
                  <button
                    key={speed}
                    className={`speed-chip ${playbackSpeed === speed ? 'active' : ''}`}
                    onClick={() => setPlaybackSpeed(speed)}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Snapshot Highlight Cards */}
          <div className="snapshot-cards-grid">
            <div className="snapshot-card">
              <span className="snapshot-card-label">Bitcoin (BTC)</span>
              <span className="snapshot-card-val font-mono">
                {snapshot?.btc_price ? formatCurrency(snapshot.btc_price) : '—'}
              </span>
            </div>
            <div className="snapshot-card">
              <span className="snapshot-card-label">Ethereum (ETH)</span>
              <span className="snapshot-card-val font-mono">
                {snapshot?.eth_price ? formatCurrency(snapshot.eth_price) : '—'}
              </span>
            </div>
            <div className="snapshot-card">
              <span className="snapshot-card-label">Solana (SOL)</span>
              <span className="snapshot-card-val font-mono">
                {snapshot?.sol_price ? formatCurrency(snapshot.sol_price) : '—'}
              </span>
            </div>
            <div className="snapshot-card">
              <span className="snapshot-card-label">Market Mood</span>
              <span className="snapshot-card-val text-accent">
                {snapshot?.market_mood?.score ?? 50} / 100 ({snapshot?.market_mood?.label ?? 'Neutral'})
              </span>
            </div>
            <div className="snapshot-card">
              <span className="snapshot-card-label">Top Gainer at Timestamp</span>
              <span className="snapshot-card-val text-gain font-mono">
                {snapshot?.top_gainer
                  ? `${snapshot.top_gainer.symbol} (+${snapshot.top_gainer.change_24h}%)`
                  : '—'}
              </span>
            </div>
            <div className="snapshot-card">
              <span className="snapshot-card-label">Top Loser at Timestamp</span>
              <span className="snapshot-card-val text-loss font-mono">
                {snapshot?.top_loser
                  ? `${snapshot.top_loser.symbol} (${snapshot.top_loser.change_24h}%)`
                  : '—'}
              </span>
            </div>
          </div>

          {/* Coins Table at this Timestamp */}
          <div className="replay-table-card">
            <div className="card-header">
              <h3 className="card-title">
                Market Snapshot at {currentTsString}
              </h3>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Coin</th>
                    <th>Price at Timestamp</th>
                    <th>24h Change</th>
                    <th>Market Cap</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot?.coins?.map((c) => {
                    const isPositive = (c.change_24h || 0) >= 0
                    return (
                      <tr key={c.symbol}>
                        <td className="rank-cell">#{c.rank}</td>
                        <td className="font-semibold">
                          {c.name} <span className="coin-symbol-pill">{c.symbol}</span>
                        </td>
                        <td className="font-mono price-cell">
                          {c.price !== null ? formatCurrency(c.price) : '—'}
                        </td>
                        <td>
                          <span className={`change-badge ${isPositive ? 'positive' : 'negative'}`}>
                            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {formatPercent(c.change_24h)}
                          </span>
                        </td>
                        <td className="font-mono text-secondary">
                          {c.market_cap ? `$${formatCompactNumber(c.market_cap)}` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
