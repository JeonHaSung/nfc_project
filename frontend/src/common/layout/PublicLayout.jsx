import { ArrowRight, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { PrivacyPolicyModal } from '../components/PrivacyPolicy'
import RetapLogo from '../components/RetapLogo'

const publicMenus = [
  { to: '/', label: '홈', end: true },
  { to: '/company', label: '회사소개' },
  { to: '/products', label: '매장·제품소개' },
  { to: '/guide', label: '이용방법' },
  { to: '/support', label: '고객지원' },
]

function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)

  return (
    <div className="public-site">
      <header className="public-header">
        <div className="public-container public-header-inner">
          <NavLink className="public-brand" to="/" onClick={() => setMenuOpen(false)}>
            <RetapLogo />
          </NavLink>

          <button
            className="public-menu-toggle"
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-label="메뉴 열기"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>

          <nav className={`public-nav${menuOpen ? ' open' : ''}`} aria-label="공용 메뉴">
            {publicMenus.map((menu) => (
              <NavLink
                key={menu.to}
                to={menu.to}
                end={menu.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                {menu.label}
              </NavLink>
            ))}
            <NavLink
              to="/admin/login"
              onClick={() => setMenuOpen(false)}
              className="public-admin-link"
            >
              관리자
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="public-main"><Outlet /></main>

      <footer className="public-footer">
        <div className="public-container public-footer-grid">
          <div>
            <NavLink className="public-brand footer-brand" to="/">
              <RetapLogo />
            </NavLink>
            <p>NFC 기술로 오프라인의 모든 순간을<br />더 빠르고 자연스럽게 연결합니다.</p>
          </div>
          <div className="public-footer-links">
            <strong>바로가기</strong>
            <NavLink to="/company">회사소개</NavLink>
            <NavLink to="/products">매장·제품소개</NavLink>
            <NavLink to="/guide">이용방법</NavLink>
          </div>
          <div className="public-footer-links">
            <strong>고객지원</strong>
            <NavLink to="/support">문의하기</NavLink>
            <a href="mailto:hello@retapnfc.com">hello@retapnfc.com</a>
            <span>평일 09:00 — 18:00</span>
          </div>
          <NavLink className="footer-cta" to="/support">
            도입 문의
            <ArrowRight size={17} />
          </NavLink>
        </div>
        <div className="public-container public-footer-bottom">
          <span>© 2026 RETAP. All rights reserved.</span>
          <button className="privacy-policy-link footer-privacy-link" type="button" onClick={() => setPrivacyOpen(true)}>
            개인정보 처리방침
          </button>
        </div>
      </footer>
      {privacyOpen && <PrivacyPolicyModal onClose={() => setPrivacyOpen(false)} />}
    </div>
  )
}

export default PublicLayout
