import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 2 min for scraping
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor to attach JWT auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for error normalization
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Connection refused / Network error / Backend unavailable
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !error.response) {
      return Promise.reject(new Error('❌ Oops! Unable to connect to the CryptoTrack server.'))
    }

    const status = error.response.status
    const detail = error.response.data?.detail
    const message = error.response.data?.message

    // 2. Duplicate email
    if (status === 400 && typeof detail === 'string' && detail.toLowerCase().includes('already registered')) {
      return Promise.reject(new Error('⚠️ Warning! This email is already registered.'))
    }

    // 3. Validation errors (FastAPI 422 Unprocessable Entity)
    if (status === 422) {
      if (Array.isArray(detail)) {
        const emailErr = detail.find((d) => d.loc?.includes('email'))
        if (emailErr) {
          return Promise.reject(new Error('❌ Oops! Please enter a valid email address.'))
        }
        const pwdErr = detail.find((d) => d.loc?.includes('password'))
        if (pwdErr) {
          return Promise.reject(new Error('❌ Oops! Password must be at least 6 characters.'))
        }
        return Promise.reject(new Error(`❌ Oops! ${detail[0].msg || 'Validation failed.'}`))
      }
      return Promise.reject(new Error('❌ Oops! Please check your input details.'))
    }

    // 4. Bad Request (400)
    if (status === 400) {
      return Promise.reject(new Error(`⚠️ Warning! ${detail || message || 'Invalid request.'}`))
    }

    // 5. Unauthorized (401)
    if (status === 401) {
      return Promise.reject(new Error(`❌ Oops! ${detail || 'Invalid email or password.'}`))
    }

    // 6. Server errors (500+)
    if (status >= 500) {
      return Promise.reject(new Error('❌ Oops! CryptoTrack server error. Please try again later.'))
    }

    return Promise.reject(new Error(detail || message || error.message || 'An unexpected error occurred'))
  }
)

// ─── Auth ─────────────────────────────────────────────────────────
export const loginUser = (credentials) =>
  api.post('/api/auth/login', credentials).then((r) => r.data)

export const registerUser = (userData) =>
  api.post('/api/auth/register', userData).then((r) => r.data)

export const getMe = () =>
  api.get('/api/auth/me').then((r) => r.data)

// ─── Health ───────────────────────────────────────────────────────
export const checkHealth = () => api.get('/api/health').then(r => r.data)

// ─── Coins ────────────────────────────────────────────────────────
export const getCoins = () => api.get('/api/coins').then(r => r.data)

export const getTopCoins = () => api.get('/api/coins/top10').then(r => r.data)

export const getCoin = (symbol) => api.get(`/api/coins/${symbol}`).then(r => r.data)

export const getCoinHistory = (symbol, params = {}) =>
  api.get(`/api/coins/${symbol}/history`, { params }).then(r => r.data)

// ─── Stats ────────────────────────────────────────────────────────
export const getStats = () => api.get('/api/stats').then(r => r.data)

// ─── Scrape ───────────────────────────────────────────────────────
export const scrapeMarketData = () => api.post('/api/scrape').then(r => r.data)

export const getScrapeStatus = () => api.get('/api/scrape/status').then(r => r.data)

// ─── Export ───────────────────────────────────────────────────────
export const getExportCsvUrl = (symbol = null) => {
  const params = symbol ? `?symbol=${symbol}` : ''
  return `${BASE_URL}/api/export/csv${params}`
}

export const exportCSV = (symbol = null) => {
  const url = getExportCsvUrl(symbol)
  const link = document.createElement('a')
  link.href = url
  link.download = `crypto_export_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// ─── Market Intelligence ──────────────────────────────────────────
export const getMarketMood = () => api.get('/api/intelligence/mood').then(r => r.data)

export const getDataQuality = () => api.get('/api/intelligence/data-quality').then(r => r.data)

export const compareCoins = (symbols) => {
  const symStr = Array.isArray(symbols) ? symbols.join(',') : symbols
  return api.get(`/api/compare?symbols=${encodeURIComponent(symStr)}`).then(r => r.data)
}

export const getCoinVolatility = (symbol) =>
  api.get(`/api/coins/${symbol}/volatility`).then(r => r.data)

export const getCoinTrend = (symbol) =>
  api.get(`/api/coins/${symbol}/trend`).then(r => r.data)

export const getCoinDrawdown = (symbol) =>
  api.get(`/api/coins/${symbol}/drawdown`).then(r => r.data)

// ─── Watchlist ────────────────────────────────────────────────────
export const getWatchlist = () => api.get('/api/watchlist').then(r => r.data)

export const getWatchlistSymbols = () => api.get('/api/watchlist/symbols').then(r => r.data)

export const addToWatchlist = (symbol) =>
  api.post(`/api/watchlist/${symbol}`).then(r => r.data)

export const removeFromWatchlist = (symbol) =>
  api.delete(`/api/watchlist/${symbol}`).then(r => r.data)

// ─── Alerts ───────────────────────────────────────────────────────
export const getAlerts = () => api.get('/api/alerts').then(r => r.data)

export const createAlert = (data) => api.post('/api/alerts', data).then(r => r.data)

export const updateAlert = (id, data) => api.put(`/api/alerts/${id}`, data).then(r => r.data)

export const deleteAlert = (id) => api.delete(`/api/alerts/${id}`).then(r => r.data)

export const getRecentTriggeredAlerts = () =>
  api.get('/api/alerts/recent-triggered').then(r => r.data)

// ─── Portfolio ────────────────────────────────────────────────────
export const getPortfolio = () => api.get('/api/portfolio').then(r => r.data)

export const addPortfolioHolding = (data) => api.post('/api/portfolio', data).then(r => r.data)

export const updatePortfolioHolding = (id, data) =>
  api.put(`/api/portfolio/${id}`, data).then(r => r.data)

export const deletePortfolioHolding = (id) =>
  api.delete(`/api/portfolio/${id}`).then(r => r.data)

// ─── Replay ───────────────────────────────────────────────────────
export const getReplayTimestamps = () => api.get('/api/replay/timestamps').then(r => r.data)

export const getReplaySnapshot = (timestamp = null) => {
  const params = timestamp ? `?timestamp=${encodeURIComponent(timestamp)}` : ''
  return api.get(`/api/replay/snapshot${params}`).then(r => r.data)
}

// ─── System Health ────────────────────────────────────────────────
export const getSystemHealth = (runLimit = 20) =>
  api.get(`/api/system/health?run_limit=${runLimit}`).then(r => r.data)

export default api
