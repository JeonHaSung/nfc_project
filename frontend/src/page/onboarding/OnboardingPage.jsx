import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { LockKeyhole, Search, UserRound } from 'lucide-react'
import { searchAdminAccounts } from '../../api/admin/adminApi'
import {
  checkSignupEmail,
  checkSignupLoginId,
  sendSignupEmailCode,
  verifySignupEmailCode,
} from '../../api/auth/authApi'
import { useAuth } from '../../auth/AuthContext'
import { isValidPassword, passwordPolicyText } from '../../auth/password'
import EmailVerificationField from '../../common/components/EmailVerificationField'
import LoginIdCheckField from '../../common/components/LoginIdCheckField'
import PhoneNumberFields, { emptyPhoneParts, joinPhoneParts } from '../../common/components/PhoneNumberFields'
import { PrivacyConsentField, PrivacyPolicyModal } from '../../common/components/PrivacyPolicy'
import {
  attachOnboardingCard,
  getMyOnboardingStores,
  getOnboardingTag,
  registerOnboardingStore,
} from '../../api/onboarding/onboardingApi'

const categories = ['카페', '음식점', 'PC방', '주점/펍', '뷰티/미용', '기타']
const OWNER_PAGE_SIZE = 20

function OnboardingPage() {
  const { user, loading, login, signup } = useAuth()
  const [searchParams] = useSearchParams()
  const tagId = searchParams.get('ti') || ''
  const navigate = useNavigate()
  const isMaster = user?.role === 'MASTER'
  const [tag, setTag] = useState(null)
  const [stores, setStores] = useState([])
  const [accounts, setAccounts] = useState([])
  const [ownerId, setOwnerId] = useState('')
  const [selectedOwnerAccount, setSelectedOwnerAccount] = useState(null)
  const [ownerQuery, setOwnerQuery] = useState('')
  const [debouncedOwnerQuery, setDebouncedOwnerQuery] = useState('')
  const [ownerPage, setOwnerPage] = useState(1)
  const [ownerTotalPage, setOwnerTotalPage] = useState(1)
  const [ownerLoading, setOwnerLoading] = useState(false)
  const ownerRequestId = useRef(0)
  const [mode, setMode] = useState('login')
  const [authForm, setAuthForm] = useState({
    loginId: '',
    name: '',
    phoneParts: emptyPhoneParts,
    email: '',
    password: '',
    confirmPassword: '',
    privacyAgreed: false,
  })
  const [signupLoginIdAvailable, setSignupLoginIdAvailable] = useState(false)
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
    const timer = setTimeout(() => setDebouncedOwnerQuery(ownerQuery.trim()), 500)
    return () => clearTimeout(timer)
  }, [ownerQuery])

  const loadOwnerAccounts = useCallback(async (page, { replace }) => {
    if (!isMaster) return
    const requestId = ++ownerRequestId.current
    setOwnerLoading(true)
    try {
      const pageData = await searchAdminAccounts({
        page,
        size: OWNER_PAGE_SIZE,
        searchText: debouncedOwnerQuery,
      })
      if (requestId !== ownerRequestId.current) return
      const list = pageData?.dtoList ?? []
      setAccounts((prev) => (replace ? list : [...prev, ...list]))
      setOwnerPage(pageData?.current ?? page)
      setOwnerTotalPage(pageData?.totalPage ?? 1)
    } catch (error) {
      if (requestId !== ownerRequestId.current) return
      setMessage(error.message)
    } finally {
      if (requestId === ownerRequestId.current) setOwnerLoading(false)
    }
  }, [isMaster, debouncedOwnerQuery])

  useEffect(() => {
    if (!user || !isMaster) return
    setOwnerId((current) => current || String(user.id))
  }, [user, isMaster])

  useEffect(() => {
    if (!user || !isMaster) return
    setAccounts([])
    setOwnerPage(1)
    setOwnerTotalPage(1)
    loadOwnerAccounts(1, { replace: true })
  }, [user, isMaster, debouncedOwnerQuery, loadOwnerAccounts])

  useEffect(() => {
    if (!user) return
    if (isMaster && !ownerId) {
      setStores([])
      setChoice('new')
      setSelectedStoreId('')
      return
    }

    const params = isMaster ? { registeredById: ownerId } : {}
    getMyOnboardingStores(params)
      .then((list) => {
        setStores(list ?? [])
        if ((list ?? []).length > 0) {
          setChoice('existing')
          setSelectedStoreId(list[0].id)
        } else {
          setChoice('new')
          setSelectedStoreId('')
        }
      })
      .catch((error) => setMessage(error.message))
  }, [user, isMaster, ownerId])

  const isSelfOwner = isMaster && String(ownerId) === String(user?.id)
  const ownerHasMore = ownerPage < ownerTotalPage
  const masterSelfVisible = (() => {
    if (!user || !isMaster) return false
    const keyword = debouncedOwnerQuery.toLowerCase()
    if (!keyword) return true
    const haystack = `마스터 본인 ${user.loginId || ''} ${user.name || ''}`.toLowerCase()
    return haystack.includes(keyword)
  })()

  const selectedOwnerLabel = isSelfOwner
    ? `마스터 본인 (${user?.loginId || user?.name || ''})`
    : selectedOwnerAccount
      ? `대리 · ${selectedOwnerAccount.loginId} (${selectedOwnerAccount.name})`
      : '계정을 선택해 주세요'

  const selectOwner = (account, self = false) => {
    setOwnerId(String(account.id))
    setSelectedOwnerAccount(self ? null : account)
  }

  const onOwnerListScroll = (event) => {
    const el = event.currentTarget
    if (!ownerHasMore || ownerLoading) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 48) {
      loadOwnerAccounts(ownerPage + 1, { replace: false })
    }
  }

  if (!tagId) return <Navigate to="/" replace />

  const submitAuth = async (event) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      if (mode === 'signup') {
        const phone = joinPhoneParts(authForm.phoneParts)
        if (!signupLoginIdAvailable) throw new Error('아이디 중복 확인을 완료해 주세요.')
        if (!authForm.name.trim()) throw new Error('이름을 입력해 주세요.')
        if (phone.length !== 11) throw new Error('휴대폰 번호를 모두 입력해 주세요.')
        if (!authForm.email.trim()) throw new Error('이메일을 입력해 주세요.')
        if (!signupEmailVerified) throw new Error('이메일 인증을 완료해 주세요.')
        if (!authForm.privacyAgreed) throw new Error('개인정보 수집·이용에 동의해 주세요.')
        if (!isValidPassword(authForm.password)) throw new Error(passwordPolicyText)
        if (authForm.loginId.trim() === authForm.password) {
          throw new Error('아이디와 비밀번호는 같을 수 없습니다.')
        }
        if (authForm.password !== authForm.confirmPassword) throw new Error('비밀번호 확인이 일치하지 않습니다.')
        await signup({
          loginId: authForm.loginId.trim(),
          name: authForm.name.trim(),
          phone,
          email: authForm.email.trim(),
          privacyAgreed: true,
          password: authForm.password,
        })
      } else {
        await login({ loginId: authForm.loginId.trim(), password: authForm.password })
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
      if (isMaster && !ownerId) {
        throw new Error('등록할 계정을 선택해 주세요.')
      }
      if (choice === 'existing') {
        await attachOnboardingCard({
          tagId,
          storeId: selectedStoreId,
          cardNickname: storeForm.cardNickname.trim(),
        })
      } else {
        const payload = {
          tagId,
          name: storeForm.name.trim(),
          redirectUrl: storeForm.redirectUrl.trim(),
          description: storeForm.description,
          cardNickname: storeForm.cardNickname.trim(),
          category: storeForm.category,
        }
        if (isMaster) payload.registeredById = Number(ownerId)
        await registerOnboardingStore(payload)
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

  const listEmpty = !masterSelfVisible && accounts.length === 0 && !ownerLoading

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
              {mode === 'signup' ? (
                <LoginIdCheckField
                  id="onboard-login-id"
                  value={authForm.loginId}
                  onChange={(loginId) => setAuthForm((current) => ({ ...current, loginId }))}
                  available={signupLoginIdAvailable}
                  onAvailableChange={setSignupLoginIdAvailable}
                  checkLoginId={checkSignupLoginId}
                />
              ) : (
                <>
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
                </>
              )}
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
                  <label htmlFor="onboard-phone-1">휴대폰 번호 (필수)</label>
                  <PhoneNumberFields
                    idPrefix="onboard"
                    value={authForm.phoneParts}
                    onChange={(phoneParts) => setAuthForm((current) => ({ ...current, phoneParts }))}
                  />
                  <EmailVerificationField
                    idPrefix="onboard-signup"
                    email={authForm.email}
                    onEmailChange={(email) => setAuthForm((current) => ({ ...current, email }))}
                    onVerifiedChange={(verified) => setSignupEmailVerified(verified)}
                    checkEmail={checkSignupEmail}
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
                disabled={busy || (mode === 'signup' && (!signupLoginIdAvailable || !signupEmailVerified))}
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
                setSignupLoginIdAvailable(false)
                setSignupEmailVerified(false)
                setMessage('')
                setAuthForm({
                  loginId: '',
                  name: '',
                  phoneParts: emptyPhoneParts,
                  email: '',
                  password: '',
                  confirmPassword: '',
                  privacyAgreed: false,
                })
              }}
            >
              {mode === 'login' ? '회원가입으로 전환' : '로그인으로 전환'}
            </button>
            {privacyOpen && <PrivacyPolicyModal onClose={() => setPrivacyOpen(false)} />}
          </>
        ) : (
          <form className="login-form onboard-register-form" onSubmit={submitRegister}>
            {isMaster && (
              <div className="onboard-owner-picker">
                <span className="onboard-owner-label">등록 계정</span>
                <div className="onboard-owner-selected" aria-live="polite">
                  선택됨: <strong>{selectedOwnerLabel}</strong>
                </div>
                <div className="onboard-owner-search">
                  <Search size={16} aria-hidden />
                  <input
                    type="search"
                    value={ownerQuery}
                    onChange={(e) => setOwnerQuery(e.target.value)}
                    placeholder="아이디·이름·연락처 검색"
                    aria-label="등록 계정 검색"
                  />
                </div>
                <div
                  className="onboard-owner-list"
                  role="listbox"
                  aria-label="등록 계정 목록"
                  onScroll={onOwnerListScroll}
                >
                  {masterSelfVisible && (
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelfOwner}
                      className={`onboard-owner-option${isSelfOwner ? ' active' : ''}`}
                      onClick={() => selectOwner(user, true)}
                    >
                      <span className="onboard-owner-option-main">
                        마스터 본인 · {user.loginId}
                      </span>
                      <span className="onboard-owner-option-sub">{user.name}</span>
                    </button>
                  )}
                  {accounts.map((account) => {
                    const active = String(ownerId) === String(account.id)
                    return (
                      <button
                        key={account.id}
                        type="button"
                        role="option"
                        aria-selected={active}
                        className={`onboard-owner-option${active ? ' active' : ''}`}
                        onClick={() => selectOwner(account)}
                      >
                        <span className="onboard-owner-option-main">
                          대리 · {account.loginId}
                        </span>
                        <span className="onboard-owner-option-sub">
                          {account.name}
                          {account.phone ? ` · ${account.phone}` : ''}
                        </span>
                      </button>
                    )
                  })}
                  {listEmpty && (
                    <p className="onboard-owner-empty">검색 결과가 없습니다.</p>
                  )}
                  {ownerLoading && (
                    <p className="onboard-owner-empty">불러오는 중...</p>
                  )}
                  {!ownerLoading && ownerHasMore && (
                    <p className="onboard-owner-empty">아래로 스크롤하면 더 불러옵니다</p>
                  )}
                </div>
                <small className="field-help">
                  {isSelfOwner
                    ? '마스터 계정 이름으로 매장이 등록됩니다.'
                    : selectedOwnerAccount
                      ? '선택한 계정 이름으로 매장이 등록됩니다. 해당 계정이 아직 매장을 만들지 않아도 됩니다.'
                      : '등록할 계정을 선택해 주세요.'}
                </small>
              </div>
            )}

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
            <button className="login-submit" type="submit" disabled={busy || (isMaster && !ownerId)}>
              {busy ? '등록 중...' : isMaster && !isSelfOwner ? '대리 등록' : '등록'}
            </button>
          </form>
        )}

        <Link className="login-home-link" to="/">홈으로</Link>
      </section>
    </main>
  )
}

export default OnboardingPage
