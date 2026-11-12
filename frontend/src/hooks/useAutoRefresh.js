import { useEffect, useRef } from 'react'

/**
 * Auto-refresh hook that calls a callback function at a given interval.
 * @param {Function} callback - Function to call on each tick
 * @param {number|null} intervalMs - Interval in milliseconds, or null to disable
 */
export const useAutoRefresh = (callback, intervalMs) => {
  const callbackRef = useRef(callback)
  const timerRef = useRef(null)

  // Always keep the ref up-to-date
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!intervalMs || intervalMs <= 0) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    timerRef.current = setInterval(() => {
      callbackRef.current()
    }, intervalMs)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [intervalMs])
}

export default useAutoRefresh
