import { useState } from 'react'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { scrapeMarketData } from '../services/api'
import './RefreshButton.css'

export default function RefreshButton({ onRefresh, loading: externalLoading }) {
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [message, setMessage] = useState('')

  const handleRefresh = async () => {
    if (status === 'loading') return
    setStatus('loading')
    setMessage('')

    try {
      const result = await scrapeMarketData()
      setStatus(result.success ? 'success' : 'error')
      setMessage(
        result.success
          ? `Updated ${result.coins_scraped} coins`
          : result.error || 'Update failed'
      )
      if (onRefresh) onRefresh()
    } catch (err) {
      setStatus('error')
      setMessage('Unable to update market data')
    }

    setTimeout(() => setStatus('idle'), 4000)
  }

  const isLoading = status === 'loading' || externalLoading

  return (
    <div className="refresh-wrapper">
      <button
        id="refresh-market-btn"
        className={`btn btn-primary refresh-btn ${isLoading ? 'loading' : ''}`}
        onClick={handleRefresh}
        disabled={isLoading}
      >
        <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
        {isLoading ? 'Updating...' : 'Refresh Data'}
      </button>

      {status === 'success' && (
        <div className="refresh-toast success">
          <CheckCircle size={14} />
          <span>{message}</span>
        </div>
      )}
      {status === 'error' && (
        <div className="refresh-toast error">
          <AlertCircle size={14} />
          <span>{message}</span>
        </div>
      )}
    </div>
  )
}
