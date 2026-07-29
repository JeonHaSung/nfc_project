import { useState } from 'react'
import { ArrowLeft, LockKeyhole, LogIn, RadioTower, UserRound } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

function LoginPage() {
  const { user, loading, login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [form, setForm] = useState({ loginId: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return (
      <div className="login-page">
        <div className="route-loader" role="status"><span /> 관리자 인증을 확인하는 중입니다</div>
      </div>
    )
  }

  if (user) return <Navigate to="/admin/management/dashboard" replace />

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(form)
      const from = location.state?.from
      const destination = from
        ? `${from.pathname}${from.search || ''}${from.hash || ''}`
        : '/admin/management/dashboard'
      navigate(destination, { replace: true })
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">
          <span><RadioTower size={25} /></span>
          <div><strong>NFC Manager</strong><small>ADMIN CONSOLE</small></div>
        </div>
        <div className="login-heading">
          <span>SECURE ACCESS</span>
          <h1 id="login-title">관리자 로그인</h1>
          <p>등록된 관리자 계정으로 로그인해 주세요.</p>
        </div>
        {error && <div className="notice error login-notice" role="alert">{error}</div>}
        <form className="login-form" onSubmit={submit}>
          <label htmlFor="admin-login-id">아이디</label>
          <div className="login-input">
            <UserRound size={17} />
            <input
              id="admin-login-id"
              name="loginId"
              autoComplete="username"
              value={form.loginId}
              onChange={(event) => setForm({ ...form, loginId: event.target.value })}
              placeholder="관리자 아이디"
              required
              autoFocus
            />
          </div>
          <label htmlFor="admin-password">비밀번호</label>
          <div className="login-input">
            <LockKeyhole size={17} />
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="비밀번호"
              required
            />
          </div>
          <button className="login-submit" type="submit" disabled={submitting}>
            <LogIn size={17} /> {submitting ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <Link className="login-home-link" to="/"><ArrowLeft size={14} /> 메인페이지로 돌아가기</Link>
      </section>
    </main>
  )
}

export default LoginPage
