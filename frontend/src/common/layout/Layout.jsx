import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  ChevronDown,
  LogOut,
  QrCode,
  Store,
  UserCog,
  UserRound,
} from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import ProfileModal from '../components/ProfileModal'
import RetapLogo from '../components/RetapLogo'

function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const profileRef = useRef(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const isMaster = user?.role === 'MASTER'

  const menus = [
    { to: '/admin/management/dashboard', label: '통계', icon: ChartNoAxesCombined },
    ...(isMaster ? [{ to: '/admin/management/tags', label: 'NFC/QR 생성', icon: QrCode }] : []),
    { to: '/admin/management/stores', label: '매장조회', icon: Store },
  ]

  useEffect(() => {
    if (!profileOpen) return undefined

    const closeOnOutside = (event) => {
      if (!profileRef.current?.contains(event.target)) setProfileOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setProfileOpen(false)
    }

    document.addEventListener('mousedown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [profileOpen])

  const handleLogout = async () => {
    setProfileOpen(false)
    await logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink className="brand" to="/admin/management/dashboard">
            <RetapLogo />
          </NavLink>
          <nav className="main-nav" aria-label="주 메뉴">
            {menus.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                <Icon size={17} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="topbar-actions">
            <NavLink className="public-home-link" to="/">
              메인페이지로 이동
              <ArrowUpRight size={15} />
            </NavLink>
            <div className="profile-menu" ref={profileRef}>
              <button
                className="profile-trigger"
                type="button"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen((open) => !open)}
              >
                <span className="profile-avatar"><UserRound size={16} /></span>
                <span className="profile-copy"><strong>{user.name}</strong><small>{user.role}</small></span>
                <ChevronDown size={14} />
              </button>
              {profileOpen && (
                <div className="profile-dropdown" role="menu">
                  <div className="profile-summary">
                    <strong>{user.name}</strong>
                    <span>{user.loginId}</span>
                    <small>{user.role === 'MASTER' ? '최고 관리자' : '일반 사용자'}</small>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setProfileOpen(false)
                      setEditProfileOpen(true)
                    }}
                  >
                    <UserCog size={15} /> 마이페이지
                  </button>
                  <button className="logout-menu-item" type="button" role="menuitem" onClick={handleLogout}>
                    <LogOut size={15} /> 로그아웃
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="main-content"><Outlet /></main>
      {editProfileOpen && <ProfileModal onClose={() => setEditProfileOpen(false)} />}
    </div>
  )
}

export default Layout
