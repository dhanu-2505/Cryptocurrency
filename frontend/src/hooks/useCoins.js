import { useState, useEffect, useCallback } from 'react'
import { getTopCoins, getStats } from '../services/api'

export const useCoins = () => {
  const [coins, setCoins] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [coinsData, statsData] = await Promise.all([
        getTopCoins(),
        getStats(),
      ])
      setCoins(coinsData)
      setStats(statsData)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { coins, stats, loading, error, lastUpdated, refetch: fetchData }
}

export const useCoinHistory = (symbol) => {
  const [history, setHistory] = useState([])
  const [coin, setCoin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!symbol) return

    const fetchHistory = async () => {
      setLoading(true)
      setError(null)
      try {
        const { getCoin, getCoinHistory } = await import('../services/api')
        const [coinData, historyData] = await Promise.all([
          getCoin(symbol),
          getCoinHistory(symbol, { limit: 200 }),
        ])
        setCoin(coinData)
        setHistory(historyData.reverse()) // chronological order for chart
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [symbol])

  return { coin, history, loading, error }
}
