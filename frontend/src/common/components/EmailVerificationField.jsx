import { useEffect, useState } from 'react'
import { CheckCircle2, Mail } from 'lucide-react'

const CODE_EXPIRY_SECONDS = 10 * 60
const RESEND_COOLDOWN_SECONDS = 60

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

function EmailVerificationField({
  idPrefix,
  email,
  onEmailChange,
  onVerifiedChange,
  sendCode,
  verifyCode,
  checkEmail,
  emailLabel = '이메일 (필수)',
}) {
  const [code, setCode] = useState('')
  const [phase, setPhase] = useState('idle') // idle | available | sent | verified
  const [checking, setChecking] = useState(false)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [sentAt, setSentAt] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (phase !== 'sent') return undefined
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [phase])

  const elapsed = sentAt ? Math.floor((now - sentAt) / 1000) : 0
  const cooldown = Math.max(0, RESEND_COOLDOWN_SECONDS - elapsed)
  const remaining = Math.max(0, CODE_EXPIRY_SECONDS - elapsed)
  const expired = phase === 'sent' && remaining === 0
  const needsAvailabilityCheck = typeof checkEmail === 'function'
  const canSendCode = !needsAvailabilityCheck || phase === 'available' || phase === 'sent'

  const resetVerification = (nextEmail) => {
    setCode('')
    setPhase('idle')
    setSentAt(0)
    setMessage(null)
    onEmailChange(nextEmail)
    onVerifiedChange(false, null)
  }

  const handleCheckEmail = async () => {
    const normalizedEmail = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setMessage({ type: 'error', text: '올바른 이메일 주소를 입력해 주세요.' })
      return
    }
    if (!needsAvailabilityCheck) return

    setChecking(true)
    setMessage(null)
    try {
      await checkEmail(normalizedEmail)
      setPhase('available')
      setMessage({ type: 'success', text: '사용 가능한 이메일입니다. 인증번호를 전송해 주세요.' })
    } catch (error) {
      setPhase('idle')
      setMessage({ type: 'error', text: error.message })
    } finally {
      setChecking(false)
    }
  }

  const handleSend = async () => {
    const normalizedEmail = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setMessage({ type: 'error', text: '올바른 이메일 주소를 입력해 주세요.' })
      return
    }
    if (needsAvailabilityCheck && phase === 'idle') {
      setMessage({ type: 'error', text: '이메일 중복 확인을 먼저 진행해 주세요.' })
      return
    }

    setSending(true)
    setMessage(null)
    try {
      await sendCode(normalizedEmail)
      const timestamp = Date.now()
      setNow(timestamp)
      setSentAt(timestamp)
      setCode('')
      setPhase('sent')
      onVerifiedChange(false, null)
      setMessage({ type: 'success', text: '인증번호를 이메일로 전송했습니다.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSending(false)
    }
  }

  const handleVerify = async () => {
    if (expired) {
      setMessage({ type: 'error', text: '인증번호가 만료되었습니다. 다시 전송해 주세요.' })
      return
    }
    if (!/^\d{6}$/.test(code)) {
      setMessage({ type: 'error', text: '6자리 인증번호를 입력해 주세요.' })
      return
    }

    setVerifying(true)
    setMessage(null)
    try {
      const result = await verifyCode(email.trim(), code)
      setPhase('verified')
      setMessage({
        type: 'success',
        text: needsAvailabilityCheck
          ? '이메일 인증이 완료되었습니다. 30분 안에 회원가입을 완료해 주세요.'
          : '이메일 인증이 완료되었습니다.',
      })
      onVerifiedChange(true, result)
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
      onVerifiedChange(false, null)
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="email-verification">
      <label htmlFor={`${idPrefix}-email`}>{emailLabel}</label>
      <div className={`login-input${phase === 'verified' ? ' verified' : ''}${phase === 'available' ? ' available' : ''}`}>
        {phase === 'verified' || phase === 'available' ? <CheckCircle2 size={17} /> : <Mail size={17} />}
        <input
          id={`${idPrefix}-email`}
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => resetVerification(event.target.value)}
          placeholder="partner@example.com"
          required
          readOnly={phase === 'verified'}
          aria-describedby={`${idPrefix}-email-status`}
        />
        {phase === 'verified' && <span className="verification-badge">인증 완료</span>}
        {phase === 'available' && <span className="verification-badge available">사용 가능</span>}
      </div>

      {phase !== 'verified' && (
        <div className="verification-actions">
          {needsAvailabilityCheck && phase === 'idle' && (
            <button
              className="button ghost verification-send"
              type="button"
              onClick={handleCheckEmail}
              disabled={checking || !email.trim()}
            >
              {checking ? '확인 중...' : '이메일 중복 확인'}
            </button>
          )}
          {canSendCode && (
            <button
              className="button ghost verification-send"
              type="button"
              onClick={handleSend}
              disabled={sending || (phase === 'sent' && cooldown > 0)}
            >
              {sending
                ? '전송 중...'
                : phase === 'sent' && cooldown > 0
                  ? `재전송 ${formatTime(cooldown)}`
                  : phase === 'sent' ? '인증번호 재전송' : '인증번호 전송'}
            </button>
          )}
        </div>
      )}

      {phase === 'sent' && (
        <>
          <label htmlFor={`${idPrefix}-code`}>이메일 인증번호</label>
          <div className="verification-code-row">
            <div className="login-input">
              <input
                id={`${idPrefix}-code`}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="6자리 숫자"
                aria-label="이메일 인증번호 6자리"
              />
            </div>
            <button
              className="button primary"
              type="button"
              onClick={handleVerify}
              disabled={verifying || code.length !== 6 || expired}
            >
              {verifying ? '확인 중...' : '인증 확인'}
            </button>
          </div>
          <small className={`verification-timer${expired ? ' expired' : ''}`}>
            {expired ? '인증번호가 만료되었습니다. 재전송해 주세요.' : `유효시간 ${formatTime(remaining)}`}
          </small>
        </>
      )}

      <div
        id={`${idPrefix}-email-status`}
        className={`verification-message ${message?.type || ''}`}
        role={message?.type === 'error' ? 'alert' : 'status'}
        aria-live="polite"
      >
        {message?.text}
      </div>
    </div>
  )
}

export default EmailVerificationField
