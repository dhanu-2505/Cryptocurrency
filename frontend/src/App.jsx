import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import MainLayout from './layouts/MainLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Markets from './pages/Markets'
import CoinDetail from './pages/CoinDetail'
import History from './pages/History'
import Analytics from './pages/Analytics'
import Watchlist from './pages/Watchlist'
import Compare from './pages/Compare'
import Heatmap from './pages/Heatmap'
import Replay from './pages/Replay'
import Alerts from './pages/Alerts'
import Portfolio from './pages/Portfolio'
import SystemHealth from './pages/SystemHealth'
import ProtectedRoute from './components/ProtectedRoute'
import './components/ProtectedRoute.css'

function LoadingScreen() {
  return (
    <div className="auth-loading-screen">
      <div className="auth-loading-spinner" />
      <p className="auth-loading-text">Loading CryptoTrack...</p>
    </div>
  )
}

function RootRoute() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return <LoadingScreen />
  }
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  return <Landing />
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return <LoadingScreen />
  }
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function CatchAllRoute() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return <LoadingScreen />
  }
  return <Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />
}

function AppRoutes() {
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleRefresh = () => {
    setLastUpdated(new Date())
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<RootRoute />} />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />

      {/* Protected Routes inside MainLayout */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout
              lastUpdated={lastUpdated}
              onRefresh={handleRefresh}
              refreshing={refreshing}
            />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard key={refreshTrigger} />} />
        <Route path="/markets" element={<Markets key={refreshTrigger} />} />
        <Route path="/compare" element={<Compare key={refreshTrigger} />} />
        <Route path="/heatmap" element={<Heatmap key={refreshTrigger} />} />
        <Route path="/analytics" element={<Analytics key={refreshTrigger} />} />
        <Route path="/replay" element={<Replay key={refreshTrigger} />} />
        <Route path="/watchlist" element={<Watchlist key={refreshTrigger} />} />
        <Route path="/alerts" element={<Alerts key={refreshTrigger} />} />
        <Route path="/portfolio" element={<Portfolio key={refreshTrigger} />} />
        <Route path="/history" element={<History key={refreshTrigger} />} />
        <Route path="/system" element={<SystemHealth key={refreshTrigger} />} />
        <Route path="/scraper" element={<Navigate to="/system" replace />} />
        <Route path="/coin/:symbol" element={<CoinDetail />} />
        <Route path="/coins/:symbol" element={<CoinDetail />} />
      </Route>

      {/* Fallback Catch-all */}
      <Route path="*" element={<CatchAllRoute />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
