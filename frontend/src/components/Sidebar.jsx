import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BarChart3,
  GitCompare,
  LayoutGrid,
  TrendingUp,
  PlaySquare,
  Star,
  Bell,
  Briefcase,
  Clock,
  Activity,
  Zap,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
} from 'lucide-react'
import './Sidebar.css'

const navGroups = [
  {
    title: 'MARKET',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/markets', icon: BarChart3, label: 'Markets' },
      { to: '/compare', icon: GitCompare, label: 'Compare' },
      { to: '/heatmap', icon: LayoutGrid, label: 'Heatmap' },
    ],
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { to: '/analytics', icon: TrendingUp, label: 'Analytics' },
      { to: '/replay', icon: PlaySquare, label: 'Replay' },
      { to: '/watchlist', icon: Star, label: 'Watchlist' },
      { to: '/alerts', icon: Bell, label: 'Alerts' },
    ],
  },
  {
    title: 'PORTFOLIO',
    items: [
      { to: '/portfolio', icon: Briefcase, label: 'Portfolio' },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { to: '/history', icon: Clock, label: 'History' },
      { to: '/system', icon: Activity, label: 'Scraper Health' },
    ],
  },
]

export default function Sidebar({ collapsed, mobileOpen, onToggle, user, onLogout }) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={onToggle} />
      )}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Zap size={18} />
          </div>
          {!collapsed && (
            <div className="logo-text">
              <span className="logo-name">CryptoTrack</span>
              <span className="logo-tagline">Market Intelligence</span>
            </div>
          )}
        </div>

        {/* Toggle button */}
        <button className="sidebar-toggle" onClick={onToggle} title="Toggle sidebar">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navGroups.map((group, gIdx) => (
            <div key={group.title} className="nav-group-section">
              {!collapsed && (
                <div className="nav-section-label" style={{ marginTop: gIdx > 0 ? 12 : 0 }}>
                  {group.title}
                </div>
              )}
              {group.items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? 'active' : ''}`
                  }
                  title={collapsed ? label : undefined}
                >
                  <Icon size={17} className="nav-icon" />
                  {!collapsed && <span className="nav-label">{label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User profile & Logout area in Sidebar */}
        {user && (
          <div className="sidebar-user-container">
            <div className="sidebar-user-card">
              <div className="sidebar-user-info" title={user.email}>
                <span className="sidebar-user-emoji">👤</span>
                {!collapsed && (
                  <div className="sidebar-user-details">
                    <span className="sidebar-user-name">{user.name}</span>
                    <span className="sidebar-user-email">{user.email}</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                className="sidebar-logout-btn"
                onClick={onLogout}
                title="Logout"
                id="sidebar-logout-btn"
              >
                <span className="sidebar-logout-icon">🚪</span>
                {!collapsed && <span>Logout</span>}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        {!collapsed && (
          <div className="sidebar-footer">
            <div className="sidebar-footer-text">
              <span>CryptoTrack v1.1.0</span>
              <span>·</span>
              <span>Selenium Intelligence</span>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
