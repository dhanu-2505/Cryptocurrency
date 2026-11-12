import { createContext, useContext, useState, useEffect } from 'react'
import { getMe, loginUser, registerUser } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Validate stored token against /api/auth/me on application startup
  useEffect(() => {
    let isMounted = true

    const validateSession = async () => {
      const storedToken = localStorage.getItem('token')
      if (!storedToken) {
        if (isMounted) {
          setUser(null)
          setToken(null)
          setIsAuthenticated(false)
          setLoading(false)
        }
        return
      }

      try {
        const userData = await getMe()
        if (isMounted) {
          setUser(userData)
          setToken(storedToken)
          setIsAuthenticated(true)
        }
      } catch (err) {
        console.warn('Session verification failed, clearing stale token:', err)
        localStorage.removeItem('token')
        if (isMounted) {
          setUser(null)
          setToken(null)
          setIsAuthenticated(false)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    validateSession()

    return () => {
      isMounted = false
    }
  }, [])

  const login = async (credentials) => {
    const data = await loginUser(credentials)
    localStorage.setItem('token', data.token)
    setToken(data.token)
    setUser(data.user)
    setIsAuthenticated(true)
    return data
  }

  const register = async (userData) => {
    const data = await registerUser(userData)
    localStorage.setItem('token', data.token)
    setToken(data.token)
    setUser(data.user)
    setIsAuthenticated(true)
    return data
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
