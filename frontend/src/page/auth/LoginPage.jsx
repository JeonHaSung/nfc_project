import { useState } from 'react'
import { ArrowLeft, LockKeyhole, LogIn, Mail, Phone, RadioTower, UserPlus, UserRound } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { isValidPassword, passwordPolicyText } from '../../auth/password'
import { PrivacyConsentField, PrivacyPolicyModal } from '../../common/components/PrivacyPolicy'

function LoginPage() {
  const { user, loading, login, signup } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    loginId: '',
    name: '',
    phone: '',
    email: '',
    companyName: '',
    businessNumber: '',
    password: '',
    confirmPassword: '',
    privacyAgreed: false,
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)

  if (loading) {
    return (
      <div className="login-page">
        <div className="route-loader" role="status"><span /> 관리자 인증을 확인하는 중입니다</div>
      </div>
    )
  }

  if (user) {
    const from = location.state?.from
    const destination = from
      ? `${from.pathname}${from.search || ''}${from.hash || ''}`
      : '/admin/management/dashboard'
    return <Navigate to={destination} replace />
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'signup') {
        if (!form.name.trim()) {
          setError('이름을 입력해 주세요.')
          return
        }
        if (!form.phone.trim()) {
          setError('휴대폰 번호를 입력해 주세요.')
          return
        }
        if (!form.email.trim()) {
          setError('이메일을 입력해 주세요.')
          return
        }
        if (!form.privacyAgreed) {
          setError('개인정보 수집·이용에 동의해 주세요.')
          return
        }
        if (!isValidPassword(form.password)) {
          setError(passwordPolicyText)
          return
        }
        if (form.password !== form.confirmPassword) {
          setError('비밀번호 확인이 일치하지 않습니다.')
          return
        }
        await signup({
          loginId: form.loginId.trim(),
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          companyName: form.companyName.trim() || null,
          businessNumber: form.businessNumber.trim() || null,
          privacyAgreed: true,
          password: form.password,
        })
      } else {
        await login({ loginId: form.loginId, password: form.password })
      }
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
      <section className={`login-card${mode === 'signup' ? ' login-card-wide' : ''}`} aria-labelledby="login-title">
        <div className="login-brand">
          <span><RadioTower size={25} /></span>
          <div><strong>NFC Manager</strong><small>ADMIN CONSOLE</small></div>
        </div>
        <div className="login-heading">
          <span>SECURE ACCESS</span>
          <h1 id="login-title">{mode === 'login' ? '로그인' : '회원가입'}</h1>
          <p>
            {mode === 'login'
              ? '계정으로 로그인해 주세요. 계정이 없으면 회원가입을 진행할 수 있습니다.'
              : '총판(파트너) 일반 계정을 생성합니다. 개인정보 수집·이용 동의가 필요합니다.'}
          </p>
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
              placeholder="아이디"
              required
              autoFocus
            />
          </div>
          {mode === 'signup' && (
            <>
              <label htmlFor="admin-name">이름 (필수)</label>
              <div className="login-input">
                <UserRound size={17} />
                <input
                  id="admin-name"
                  name="name"
                  autoComplete="name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="이름"
                  required
                />
              </div>
              <label htmlFor="admin-phone">휴대폰 번호 (필수)</label>
              <div className="login-input">
                <Phone size={17} />
                <input
                  id="admin-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  placeholder="01012345678"
                  required
                />
              </div>
              <label htmlFor="admin-email">이메일 (필수)</label>
              <div className="login-input">
                <Mail size={17} />
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="partner@example.com"
                  required
                />
              </div>
              <div className="login-form-row">
                <label htmlFor="admin-company">
                  회사명 (선택)
                  <input
                    id="admin-company"
                    value={form.companyName}
                    onChange={(event) => setForm({ ...form, companyName: event.target.value })}
                    placeholder="회사명"
                  />
                </label>
                <label htmlFor="admin-biz">
                  사업자등록번호 (선택)
                  <input
                    id="admin-biz"
                    value={form.businessNumber}
                    onChange={(event) => setForm({ ...form, businessNumber: event.target.value })}
                    placeholder="000-00-00000"
                  />
                </label>
              </div>
            </>
          )}
          <label htmlFor="admin-password">비밀번호</label>
          <div className="login-input">
            <LockKeyhole size={17} />
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="비밀번호"
              required
            />
          </div>
          {mode === 'signup' && (
            <>
              <label htmlFor="admin-confirm-password">비밀번호 확인</label>
              <div className="login-input">
                <LockKeyhole size={17} />
                <input
                  id="admin-confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                  placeholder="비밀번호 확인"
                  required
                />
              </div>
              <small className="field-help">{passwordPolicyText}</small>
              <PrivacyConsentField
                checked={form.privacyAgreed}
                onChange={(privacyAgreed) => setForm({ ...form, privacyAgreed })}
                onOpenPolicy={() => setPrivacyOpen(true)}
              />
            </>
          )}
          <button className="login-submit" type="submit" disabled={submitting}>
            {mode === 'login'
              ? <><LogIn size={17} /> {submitting ? '로그인 중...' : '로그인'}</>
              : <><UserPlus size={17} /> {submitting ? '가입 중...' : '회원가입'}</>}
          </button>
        </form>
        <button
          className="button ghost"
          type="button"
          style={{ width: '100%', marginTop: 12 }}
          onClick={() => {
            setMode((current) => (current === 'login' ? 'signup' : 'login'))
            setError('')
          }}
        >
          {mode === 'login' ? '계정이 없나요? 회원가입' : '이미 계정이 있나요? 로그인'}
        </button>
        <div className="login-footer-links">
          <button className="privacy-policy-link" type="button" onClick={() => setPrivacyOpen(true)}>
            개인정보 처리방침
          </button>
          <Link className="login-home-link" to="/"><ArrowLeft size={14} /> 메인페이지로 돌아가기</Link>
        </div>
      </section>
      {privacyOpen && <PrivacyPolicyModal onClose={() => setPrivacyOpen(false)} />}
    </main>
  )
}

export default LoginPage
