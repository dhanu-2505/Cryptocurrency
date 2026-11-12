import { Clock, Menu, LogOut, User } from 'lucide-react'
import { formatTimeAgo } from '../utils/formatters'
import RefreshButton from './RefreshButton'
import './Header.css'

export default function Header({
  lastUpdated,
  onRefresh,
  refreshing,
  onMenuToggle,
  user,
  onLogout,
}) {
  return (
    <header className="header">
      <div className="header-left">
        <button
          className="header-menu-btn"
          onClick={onMenuToggle}
          id="menu-toggle"
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>
        <div className="header-brand">
          <h1 className="header-title">CryptoTrack</h1>
          <span className="header-subtitle">Real-time Market Intelligence</span>
        </div>
      </div>

      <div className="header-right">
        {lastUpdated && (
          <div className="header-last-updated">
            <Clock size={14} />
            <span>Updated {formatTimeAgo(lastUpdated)}</span>
          </div>
        )}
        <RefreshButton onRefresh={onRefresh} loading={refreshing} />

        {user && (
          <div className="header-auth-controls">
            <div className="header-user-display" title={`Logged in as ${user.name} (${user.email})`}>
              <span className="user-icon-emoji">👤</span>
              <span className="user-name-text">{user.name}</span>
            </div>
            <button
              type="button"
              className="header-logout-button"
              onClick={onLogout}
              id="header-logout-btn"
              title="Logout from CryptoTrack"
            >
              <span className="logout-icon-emoji">🚪</span>
              <span className="logout-text">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
