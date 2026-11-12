import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import LogoutModal from '../components/LogoutModal'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import './MainLayout.css'

export default function MainLayout({ lastUpdated, onRefresh, refreshing }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const { user, logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) setMobileOpen((o) => !o)
    else setCollapsed((c) => !c)
  }

  const handleOpenLogout = () => {
    setShowLogoutModal(true)
  }

  const handleCloseLogout = () => {
    setShowLogoutModal(false)
  }

  const handleConfirmLogout = () => {
    logout()
    setShowLogoutModal(false)
    showToast('👋 Logged Out Successfully', 'success')
    navigate('/', { replace: true })
  }

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggle={toggleSidebar}
        user={user}
        onLogout={handleOpenLogout}
      />
      <div className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Header
          lastUpdated={lastUpdated}
          onRefresh={onRefresh}
          refreshing={refreshing}
          onMenuToggle={toggleSidebar}
          user={user}
          onLogout={handleOpenLogout}
        />
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={handleCloseLogout}
        onConfirm={handleConfirmLogout}
      />
    </div>
  )
}
