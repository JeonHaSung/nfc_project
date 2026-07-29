import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { isValidPassword, passwordPolicyText } from '../../auth/password'
import Modal from './Modal'

function ProfileModal({ onClose }) {
  const { user, updateMe } = useAuth()
  const [form, setForm] = useState({
    loginId: user.loginId,
    name: user.name,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const submit = async (event) => {
    event.preventDefault()
    setMessage(null)

    if (!form.loginId.trim() || !form.name.trim() || !form.currentPassword) {
      setMessage({ type: 'error', text: '아이디, 이름, 현재 비밀번호를 모두 입력해 주세요.' })
      return
    }
    if (form.newPassword && !isValidPassword(form.newPassword)) {
      setMessage({ type: 'error', text: passwordPolicyText })
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      setMessage({ type: 'error', text: '새 비밀번호와 비밀번호 확인이 일치하지 않습니다.' })
      return
    }

    setSaving(true)
    try {
      const payload = {
        loginId: form.loginId.trim(),
        name: form.name.trim(),
        currentPassword: form.currentPassword,
      }
      if (form.newPassword) payload.newPassword = form.newPassword
      await updateMe(payload)
      setForm((current) => ({
        ...current,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }))
      setMessage({ type: 'success', text: '내 정보가 수정되었습니다.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="내 정보 수정"
      description="계정 정보 변경을 위해 현재 비밀번호를 입력해 주세요."
      onClose={onClose}
      actions={(
        <>
          <button className="button ghost" type="button" onClick={onClose}>닫기</button>
          <button className="button primary" type="submit" form="profile-form" disabled={saving}>
            {saving ? '저장 중...' : '변경사항 저장'}
          </button>
        </>
      )}
    >
      {message && <div className={`notice ${message.type} modal-notice`} role="alert">{message.text}</div>}
      <form id="profile-form" className="form-grid" onSubmit={submit}>
        <label htmlFor="profile-login-id">
          아이디
          <input
            id="profile-login-id"
            autoComplete="username"
            value={form.loginId}
            onChange={(event) => setForm({ ...form, loginId: event.target.value })}
            required
          />
        </label>
        <label htmlFor="profile-name">
          이름
          <input
            id="profile-name"
            autoComplete="name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
        </label>
        <label className="full" htmlFor="profile-current-password">
          현재 비밀번호
          <input
            id="profile-current-password"
            type="password"
            autoComplete="current-password"
            value={form.currentPassword}
            onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
            required
          />
        </label>
        <label htmlFor="profile-new-password">
          새 비밀번호 (선택)
          <input
            id="profile-new-password"
            type="password"
            autoComplete="new-password"
            value={form.newPassword}
            onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
          />
          <small className="field-help">{passwordPolicyText}</small>
        </label>
        <label htmlFor="profile-confirm-password">
          새 비밀번호 확인
          <input
            id="profile-confirm-password"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
          />
        </label>
      </form>
    </Modal>
  )
}

export default ProfileModal
