import { useState } from 'react'
import { ArrowLeft, KeyRound, LockKeyhole, LogIn, Phone, Search, UserPlus, UserRound } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  checkSignupEmail,
  sendFindIdEmailCode,
  sendResetPasswordEmailCode,
  sendSignupEmailCode,
  verifyFindIdEmailCode,
  verifyResetPasswordEmailCode,
  verifySignupEmailCode,
} from '../../api/auth/authApi'
import { useAuth } from '../../auth/AuthContext'
import { isValidPassword, passwordPolicyText } from '../../auth/password'
import EmailVerificationField from '../../common/components/EmailVerificationField'
import { PrivacyConsentField, PrivacyPolicyModal } from '../../common/components/PrivacyPolicy'
import RetapLogo from '../../common/components/RetapLogo'

const modeCopy = {
  login: {
    eyebrow: 'SECURE ACCESS',
    title: '로그인',
    description: '계정으로 로그인해 주세요. 계정이 없으면 회원가입을 진행할 수 있습니다.',
  },
  signup: {
    eyebrow: 'CREATE ACCOUNT',
    title: '회원가입',
    description: '총판(파트너) 일반 계정을 생성합니다. 가입 전 이메일 인증이 필요합니다.',
  },
  findId: {
    eyebrow: 'ACCOUNT RECOVERY',
    title: '아이디 찾기',
    description: '가입한 이메일을 인증하면 아이디를 확인할 수 있습니다.',
  },
  resetPassword: {
    eyebrow: 'ACCOUNT RECOVERY',
    title: '비밀번호 찾기',
    description: '아이디와 가입 이메일을 인증하면 임시 비밀번호를 보내드립니다.',
  },
}

const defaultDestination = (account) => (
  account?.role === 'MASTER'
    ? '/admin/management/dashboard'
    : '/admin/management/stores'
)

const loginDestination = (account, locationState) => {
  if (locationState?.loggedOut) return defaultDestination(account)
  const from = locationState?.from
  if (!from) return defaultDestination(account)
  if (account?.role !== 'MASTER' && from.pathname === '/admin/management/tags') {
    return defaultDestination(account)
  }
  return `${from.pathname}${from.search || ''}${from.hash || ''}`
}

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
    password: '',
    confirmPassword: '',
    privacyAgreed: false,
  })
  const [signupEmailVerified, setSignupEmailVerified] = useState(false)
  const [foundLoginId, setFoundLoginId] = useState('')
  const [passwordResetComplete, setPasswordResetComplete] = useState(false)
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
    return <Navigate to={loginDestination(user, location.state)} replace />
  }

  const changeMode = (nextMode) => {
    setMode(nextMode)
    setError('')
    setSignupEmailVerified(false)
    setFoundLoginId('')
    setPasswordResetComplete(false)
    setForm({
      loginId: '',
      name: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
      privacyAgreed: false,
    })
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      let authenticatedUser
      if (mode === 'signup') {
        if (!form.name.trim()) throw new Error('이름을 입력해 주세요.')
        if (!form.phone.trim()) throw new Error('휴대폰 번호를 입력해 주세요.')
        if (!form.email.trim()) throw new Error('이메일을 입력해 주세요.')
        if (!signupEmailVerified) throw new Error('이메일 인증을 완료해 주세요.')
        if (!form.privacyAgreed) throw new Error('개인정보 수집·이용에 동의해 주세요.')
        if (!isValidPassword(form.password)) throw new Error(passwordPolicyText)
        if (form.password !== form.confirmPassword) throw new Error('비밀번호 확인이 일치하지 않습니다.')

        authenticatedUser = await signup({
          loginId: form.loginId.trim(),
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          privacyAgreed: true,
          password: form.password,
        })
      } else {
        authenticatedUser = await login({
          loginId: form.loginId.trim(),
          password: form.password,
        })
      }

      navigate(loginDestination(authenticatedUser, location.state), { replace: true })
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const copy = modeCopy[mode]
  const isAuthForm = mode === 'login' || mode === 'signup'

  return (
    <main className="login-page">
      <section className={`login-card${mode !== 'login' ? ' login-card-wide' : ''}`} aria-labelledby="login-title">
        <div className="login-brand">
          <RetapLogo />
          <small>PARTNER CONSOLE</small>
        </div>
        <div className="login-heading">
          <span>{copy.eyebrow}</span>
          <h1 id="login-title">{copy.title}</h1>
          <p>{copy.description}</p>
        </div>
        {error && <div className="notice error login-notice" role="alert">{error}</div>}

        {isAuthForm && (
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
                <EmailVerificationField
                  idPrefix="admin-signup"
                  email={form.email}
                  onEmailChange={(email) => setForm((current) => ({ ...current, email }))}
                  onVerifiedChange={(verified) => setSignupEmailVerified(verified)}
                  checkEmail={checkSignupEmail}
                  sendCode={sendSignupEmailCode}
                  verifyCode={verifySignupEmailCode}
                />
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
            <button
              className="login-submit"
              type="submit"
              disabled={submitting || (mode === 'signup' && !signupEmailVerified)}
            >
              {mode === 'login'
                ? <><LogIn size={17} /> {submitting ? '로그인 중...' : '로그인'}</>
                : <><UserPlus size={17} /> {submitting ? '가입 중...' : '회원가입'}</>}
            </button>
          </form>
        )}

        {mode === 'findId' && (
          <div className="recovery-form">
            {foundLoginId ? (
              <div className="recovery-result" role="status">
                <Search size={24} />
                <span>가입된 아이디</span>
                <strong>{foundLoginId}</strong>
                <p>확인한 아이디로 로그인해 주세요.</p>
              </div>
            ) : (
              <EmailVerificationField
                idPrefix="find-id"
                email={form.email}
                onEmailChange={(email) => setForm((current) => ({ ...current, email }))}
                onVerifiedChange={(verified, result) => setFoundLoginId(verified ? result?.loginId || '' : '')}
                sendCode={sendFindIdEmailCode}
                verifyCode={verifyFindIdEmailCode}
              />
            )}
          </div>
        )}

        {mode === 'resetPassword' && (
          <div className="recovery-form">
            {passwordResetComplete ? (
              <div className="recovery-result" role="status">
                <KeyRound size={24} />
                <strong>임시 비밀번호를 이메일로 보냈습니다.</strong>
                <p>임시 비밀번호로 로그인한 뒤 마이페이지에서 비밀번호를 변경해 주세요.</p>
              </div>
            ) : (
              <>
                <label htmlFor="recovery-login-id">아이디</label>
                <div className="login-input">
                  <UserRound size={17} />
                  <input
                    id="recovery-login-id"
                    autoComplete="username"
                    value={form.loginId}
                    onChange={(event) => setForm({ ...form, loginId: event.target.value })}
                    placeholder="아이디"
                    required
                  />
                </div>
                <EmailVerificationField
                  key={`reset-password-${form.loginId}`}
                  idPrefix="reset-password"
                  email={form.email}
                  onEmailChange={(email) => setForm((current) => ({ ...current, email }))}
                  onVerifiedChange={(verified) => setPasswordResetComplete(verified)}
                  sendCode={(email) => {
                    if (!form.loginId.trim()) throw new Error('아이디를 입력해 주세요.')
                    return sendResetPasswordEmailCode(form.loginId.trim(), email)
                  }}
                  verifyCode={(email, code) =>
                    verifyResetPasswordEmailCode(form.loginId.trim(), email, code)}
                />
              </>
            )}
          </div>
        )}

        {mode === 'login' ? (
          <>
            <div className="recovery-links" aria-label="계정 찾기">
              <button type="button" onClick={() => changeMode('findId')}>아이디 찾기</button>
              <span aria-hidden="true">|</span>
              <button type="button" onClick={() => changeMode('resetPassword')}>비밀번호 찾기</button>
            </div>
            <button className="button ghost login-mode-button" type="button" onClick={() => changeMode('signup')}>
              계정이 없나요? 회원가입
            </button>
          </>
        ) : (
          <button className="button ghost login-mode-button" type="button" onClick={() => changeMode('login')}>
            로그인으로 돌아가기
          </button>
        )}

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
