import { getCoinIconUrl } from '../utils/formatters'

/**
 * Displays a coin icon (CoinGecko image with symbol fallback)
 */
export default function CoinIcon({ symbol, size = 32 }) {
  const iconUrl = getCoinIconUrl(symbol)
  const initials = (symbol || '?').slice(0, 3).toUpperCase()

  if (iconUrl) {
    return (
      <div className="coin-icon" style={{ width: size, height: size, fontSize: size * 0.33 }}>
        <img
          src={iconUrl}
          alt={symbol}
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
        />
        <span style={{ display: 'none' }}>{initials}</span>
      </div>
    )
  }

  return (
    <div className="coin-icon" style={{ width: size, height: size, fontSize: size * 0.33 }}>
      {initials}
    </div>
  )
}
