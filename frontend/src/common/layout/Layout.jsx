import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  ChevronDown,
  CreditCard,
  LogOut,
  Megaphone,
  Store,
  UserCog,
  UserRound,
} from 'lucide-react'
import { getActiveNotice } from '../../api/notice/noticeApi'
import { useAuth } from '../../auth/AuthContext'
import Modal from '../components/Modal'
import ProfileModal from '../components/ProfileModal'
import RetapLogo from '../components/RetapLogo'

function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const profileRef = useRef(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [activeNotice, setActiveNotice] = useState(null)
  const [noticeOpen, setNoticeOpen] = useState(false)
  const isMaster = user?.role === 'MASTER'

  const menus = [
    { to: '/admin/management/dashboard', label: '통계', icon: ChartNoAxesCombined },
    ...(isMaster ? [{ to: '/admin/management/tags', label: '태그카드 생성', icon: CreditCard }] : []),
    { to: '/admin/management/stores', label: '매장조회', icon: Store },
    { to: '/admin/management/notices', label: '공지사항', icon: Megaphone },
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

  useEffect(() => {
    let alive = true
    const loadActive = async () => {
      try {
        const response = await getActiveNotice()
        if (!alive) return
        setActiveNotice(response.data ?? null)
      } catch {
        if (!alive) return
        setActiveNotice(null)
      }
    }
    loadActive()
    const onChanged = () => loadActive()
    window.addEventListener('notice:changed', onChanged)
    return () => {
      alive = false
      window.removeEventListener('notice:changed', onChanged)
    }
  }, [])

  const handleLogout = async () => {
    setProfileOpen(false)
    await logout()
    navigate('/admin/login', {
      replace: true,
      state: { loggedOut: true },
    })
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
      <main className="main-content">
        {activeNotice?.title && (
          <button
            className="admin-notice-banner"
            type="button"
            onClick={() => setNoticeOpen(true)}
            title="공지 본문 보기"
          >
            <span className="admin-notice-visual" aria-hidden="true">
              <span className="admin-notice-visual-glow" />
              <Megaphone size={22} strokeWidth={2.2} />
            </span>
            <span className="admin-notice-copy">
              <small>공지사항</small>
              <strong>{activeNotice.title}</strong>
            </span>
            <span className="admin-notice-action">자세히 보기</span>
          </button>
        )}
        <Outlet />
      </main>
      {editProfileOpen && <ProfileModal onClose={() => setEditProfileOpen(false)} />}
      {noticeOpen && activeNotice && (
        <Modal
          title={activeNotice.title}
          description="현재 선택된 공지입니다."
          onClose={() => setNoticeOpen(false)}
          actions={(
            <button className="button ghost" type="button" onClick={() => setNoticeOpen(false)}>닫기</button>
          )}
        >
          <div className="notice-detail-body">{activeNotice.body}</div>
        </Modal>
      )}
    </div>
  )
}

export default Layout
