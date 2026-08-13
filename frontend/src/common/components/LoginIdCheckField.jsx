import { useState } from 'react'
import { CheckCircle2, UserRound } from 'lucide-react'

function LoginIdCheckField({
  id,
  value,
  onChange,
  available,
  onAvailableChange,
  checkLoginId,
  label = '아이디 (필수)',
}) {
  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState(null)

  const handleChange = (nextValue) => {
    onChange(nextValue)
    if (available) onAvailableChange(false)
    setMessage(null)
  }

  const handleCheck = async () => {
    const loginId = value.trim()
    if (!loginId) {
      setMessage({ type: 'error', text: '아이디를 입력해 주세요.' })
      return
    }
    if (loginId.length < 2) {
      setMessage({ type: 'error', text: '아이디는 2자 이상 입력해 주세요.' })
      return
    }

    setChecking(true)
    setMessage(null)
    try {
      await checkLoginId(loginId)
      onAvailableChange(true)
      setMessage({ type: 'success', text: '사용 가능한 아이디입니다.' })
    } catch (error) {
      onAvailableChange(false)
      setMessage({ type: 'error', text: error.message })
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="login-id-check">
      <label htmlFor={id}>{label}</label>
      <div className={`login-input${available ? ' available' : ''}`}>
        {available ? <CheckCircle2 size={17} /> : <UserRound size={17} />}
        <input
          id={id}
          name="loginId"
          autoComplete="username"
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          placeholder="아이디"
          required
        />
        {available && <span className="verification-badge available">사용 가능</span>}
      </div>
      {!available && (
        <div className="verification-actions">
          <button
            className="button ghost verification-send"
            type="button"
            onClick={handleCheck}
            disabled={checking || !value.trim()}
          >
            {checking ? '확인 중...' : '아이디 중복 확인'}
          </button>
        </div>
      )}
      <div
        className={`verification-message ${message?.type || ''}`}
        role={message?.type === 'error' ? 'alert' : 'status'}
        aria-live="polite"
      >
        {message?.text}
      </div>
    </div>
  )
}

export default LoginIdCheckField
