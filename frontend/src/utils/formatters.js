/**
 * Format a number as USD currency
 */
export const formatPrice = (value, compact = false) => {
  if (value == null || isNaN(value)) return '—'
  if (compact && value >= 1e9) {
    return '$' + (value / 1e9).toFixed(2) + 'B'
  }
  if (compact && value >= 1e6) {
    return '$' + (value / 1e6).toFixed(2) + 'M'
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value)
}

/**
 * Format market cap with T/B/M suffix
 */
export const formatMarketCap = (value) => {
  if (value == null || isNaN(value)) return '—'
  if (value >= 1e12) return '$' + (value / 1e12).toFixed(2) + 'T'
  if (value >= 1e9) return '$' + (value / 1e9).toFixed(2) + 'B'
  if (value >= 1e6) return '$' + (value / 1e6).toFixed(2) + 'M'
  return '$' + value.toLocaleString()
}

/**
 * Format a percentage change
 */
export const formatChange = (value) => {
  if (value == null || isNaN(value)) return '—'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

/**
 * Get CSS class for positive/negative change
 */
export const getChangeClass = (value) => {
  if (value == null) return ''
  return value >= 0 ? 'gain' : 'loss'
}

/**
 * Format a date/time string
 */
export const formatDate = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatDateShort = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export const formatTimeAgo = (value) => {
  if (!value) return '—'
  const now = new Date()
  const then = new Date(value)
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

/**
 * Get a CoinGecko icon URL fallback by coin symbol
 */
export const getCoinIconUrl = (symbol) => {
  const symbolMap = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    BNB: 'binancecoin',
    XRP: 'ripple',
    ADA: 'cardano',
    SOL: 'solana',
    DOGE: 'dogecoin',
    DOT: 'polkadot',
    MATIC: 'matic-network',
    SHIB: 'shiba-inu',
    AVAX: 'avalanche-2',
    LINK: 'chainlink',
    LTC: 'litecoin',
    UNI: 'uniswap',
    ATOM: 'cosmos',
    USDT: 'tether',
    USDC: 'usd-coin',
    TRX: 'tron',
  }
  const id = symbolMap[symbol?.toUpperCase()]
  if (!id) return null
  return `https://assets.coingecko.com/coins/images/1/small/${id}.png`
}

/**
 * Abbreviate large numbers
 */
export const abbreviateNumber = (value) => {
  if (value == null) return '—'
  if (value >= 1e12) return (value / 1e12).toFixed(1) + 'T'
  if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B'
  if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M'
  if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K'
  return value.toString()
}

/**
 * Aliases for compatibility
 */
export const formatCurrency = formatPrice
export const formatPercent = formatChange
export const formatCompactNumber = abbreviateNumber
