import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { LockKeyhole, Phone, UserRound } from 'lucide-react'
import { sendSignupEmailCode, verifySignupEmailCode } from '../../api/auth/authApi'
import { useAuth } from '../../auth/AuthContext'
import { isValidPassword, passwordPolicyText } from '../../auth/password'
import EmailVerificationField from '../../common/components/EmailVerificationField'
import { PrivacyConsentField, PrivacyPolicyModal } from '../../common/components/PrivacyPolicy'
import {
  attachOnboardingCard,
  getMyOnboardingStores,
  getOnboardingTag,
  registerOnboardingStore,
} from '../../api/onboarding/onboardingApi'

const categories = ['카페', '음식점', 'PC방', '주점/펍', '뷰티/미용', '기타']

function OnboardingPage() {
  const { user, loading, login, signup } = useAuth()
  const [searchParams] = useSearchParams()
  const tagId = searchParams.get('ti') || ''
  const navigate = useNavigate()
  const [tag, setTag] = useState(null)
  const [stores, setStores] = useState([])
  const [mode, setMode] = useState('login')
  const [authForm, setAuthForm] = useState({
    loginId: '',
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    privacyAgreed: false,
  })
  const [signupEmailVerified, setSignupEmailVerified] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [choice, setChoice] = useState('new')
  const [selectedStoreId, setSelectedStoreId] = useState('')
  const [storeForm, setStoreForm] = useState({
    name: '',
    redirectUrl: '',
    description: '',
    cardNickname: '',
    category: '기타',
  })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [tagLoading, setTagLoading] = useState(true)

  useEffect(() => {
    if (!tagId) return
    setTagLoading(true)
    getOnboardingTag(tagId)
      .then(setTag)
      .catch((error) => {
        const code = error.code
        if (code === 'T4') navigate('/tag/not-ready', { replace: true })
        else if (code === 'T1' || code === 'T5') navigate('/tag/not-found', { replace: true })
        else setMessage(error.message)
      })
      .finally(() => setTagLoading(false))
  }, [tagId, navigate])

  useEffect(() => {
    if (!user) return
    getMyOnboardingStores()
      .then((list) => {
        setStores(list ?? [])
        if ((list ?? []).length > 0) {
          setChoice('existing')
          setSelectedStoreId(list[0].id)
        } else {
          setChoice('new')
        }
      })
      .catch((error) => setMessage(error.message))
  }, [user])

  if (!tagId) return <Navigate to="/" replace />

  const submitAuth = async (event) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      if (mode === 'signup') {
        if (!authForm.phone.trim()) throw new Error('휴대폰 번호를 입력해 주세요.')
        if (!authForm.email.trim()) throw new Error('이메일을 입력해 주세요.')
        if (!signupEmailVerified) throw new Error('이메일 인증을 완료해 주세요.')
        if (!authForm.privacyAgreed) throw new Error('개인정보 수집·이용에 동의해 주세요.')
        if (!isValidPassword(authForm.password)) throw new Error(passwordPolicyText)
        if (authForm.password !== authForm.confirmPassword) throw new Error('비밀번호 확인이 일치하지 않습니다.')
        await signup({
          loginId: authForm.loginId.trim(),
          name: authForm.name.trim(),
          phone: authForm.phone.trim(),
          email: authForm.email.trim(),
          privacyAgreed: true,
          password: authForm.password,
        })
      } else {
        await login({ loginId: authForm.loginId, password: authForm.password })
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  const submitRegister = async (event) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      if (choice === 'existing') {
        await attachOnboardingCard({
          tagId,
          storeId: selectedStoreId,
          cardNickname: storeForm.cardNickname.trim(),
        })
      } else {
        await registerOnboardingStore({
          tagId,
          name: storeForm.name.trim(),
          redirectUrl: storeForm.redirectUrl.trim(),
          description: storeForm.description,
          cardNickname: storeForm.cardNickname.trim(),
          category: storeForm.category,
        })
      }
      navigate(`/onboarding/complete?ti=${encodeURIComponent(tagId)}`, { replace: true })
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading || tagLoading) {
    return (
      <div className="login-page">
        <div className="route-loader" role="status"><span /> 확인 중...</div>
      </div>
    )
  }

  return (
    <main className="login-page">
      <section className={`login-card${!user && mode === 'signup' ? ' login-card-wide' : ''}`}>
        <div className="login-heading">
          <span>FIRST USE</span>
          <h1>태그 첫 등록</h1>
          <p>
            {tag
              ? `${tag.category} 태그(${tag.tagId})를 매장에 연결합니다.`
              : '태그 정보를 확인할 수 없습니다.'}
          </p>
        </div>
        {message && <div className="notice error login-notice" role="alert">{message}</div>}

        {!user ? (
          <>
            <form className="login-form" onSubmit={submitAuth}>
              <label htmlFor="onboard-login-id">아이디</label>
              <div className="login-input">
                <UserRound size={17} />
                <input
                  id="onboard-login-id"
                  value={authForm.loginId}
                  onChange={(e) => setAuthForm({ ...authForm, loginId: e.target.value })}
                  required
                />
              </div>
              {mode === 'signup' && (
                <>
                  <label htmlFor="onboard-name">이름 (필수)</label>
                  <div className="login-input">
                    <UserRound size={17} />
                    <input
                      id="onboard-name"
                      value={authForm.name}
                      onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <label htmlFor="onboard-phone">휴대폰 번호 (필수)</label>
                  <div className="login-input">
                    <Phone size={17} />
                    <input
                      id="onboard-phone"
                      type="tel"
                      value={authForm.phone}
                      onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })}
                      placeholder="01012345678"
                      required
                    />
                  </div>
                  <EmailVerificationField
                    idPrefix="onboard-signup"
                    email={authForm.email}
                    onEmailChange={(email) => setAuthForm((current) => ({ ...current, email }))}
                    onVerifiedChange={(verified) => setSignupEmailVerified(verified)}
                    sendCode={sendSignupEmailCode}
                    verifyCode={verifySignupEmailCode}
                  />
                </>
              )}
              <label htmlFor="onboard-password">비밀번호</label>
              <div className="login-input">
                <LockKeyhole size={17} />
                <input
                  id="onboard-password"
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  required
                />
              </div>
              {mode === 'signup' && (
                <>
                  <label htmlFor="onboard-confirm">비밀번호 확인</label>
                  <div className="login-input">
                    <LockKeyhole size={17} />
                    <input
                      id="onboard-confirm"
                      type="password"
                      value={authForm.confirmPassword}
                      onChange={(e) => setAuthForm({ ...authForm, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                  <small className="field-help">{passwordPolicyText}</small>
                  <PrivacyConsentField
                    checked={authForm.privacyAgreed}
                    onChange={(privacyAgreed) => setAuthForm({ ...authForm, privacyAgreed })}
                    onOpenPolicy={() => setPrivacyOpen(true)}
                  />
                </>
              )}
              <button
                className="login-submit"
                type="submit"
                disabled={busy || (mode === 'signup' && !signupEmailVerified)}
              >
                {mode === 'login' ? '로그인' : '회원가입'}
              </button>
            </form>
            <button
              className="button ghost"
              type="button"
              style={{ width: '100%', marginTop: 12 }}
              onClick={() => {
                setMode((current) => (current === 'login' ? 'signup' : 'login'))
                setSignupEmailVerified(false)
                setMessage('')
              }}
            >
              {mode === 'login' ? '회원가입으로 전환' : '로그인으로 전환'}
            </button>
            {privacyOpen && <PrivacyPolicyModal onClose={() => setPrivacyOpen(false)} />}
          </>
        ) : (
          <form className="login-form onboard-register-form" onSubmit={submitRegister}>
            {stores.length > 0 && (
              <div className="segmented" style={{ marginBottom: 12 }}>
                <button type="button" className={choice === 'existing' ? 'active' : ''} onClick={() => setChoice('existing')}>
                  기존 매장에 카드 추가
                </button>
                <button type="button" className={choice === 'new' ? 'active' : ''} onClick={() => setChoice('new')}>
                  새 매장 등록
                </button>
              </div>
            )}

            {choice === 'existing' ? (
              <label>
                매장 선택
                <select value={selectedStoreId} onChange={(e) => setSelectedStoreId(e.target.value)} required>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </label>
            ) : (
              <>
                <label>
                  매장명
                  <input value={storeForm.name} onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })} required />
                </label>
                <label>
                  리다이렉트 URL
                  <input
                    value={storeForm.redirectUrl}
                    onChange={(e) => setStoreForm({ ...storeForm, redirectUrl: e.target.value })}
                    required
                    placeholder="https://"
                  />
                </label>
                <label>
                  카테고리
                  <select value={storeForm.category} onChange={(e) => setStoreForm({ ...storeForm, category: e.target.value })}>
                    {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </label>
                <label>
                  메모 (선택)
                  <textarea value={storeForm.description} onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })} rows={3} />
                </label>
              </>
            )}

            <label>
              카드 별칭
              <input
                value={storeForm.cardNickname}
                onChange={(e) => setStoreForm({ ...storeForm, cardNickname: e.target.value })}
                required
              />
            </label>
            <button className="login-submit" type="submit" disabled={busy}>
              {busy ? '등록 중...' : '등록'}
            </button>
          </form>
        )}

        <Link className="login-home-link" to="/">홈으로</Link>
      </section>
    </main>
  )
}

export default OnboardingPage
