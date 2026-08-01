import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { isValidPassword, passwordPolicyText } from '../../auth/password'
import { deleteAdminAccount, getAdminAccounts, setAdminSuspended } from '../../api/admin/adminApi'
import Modal from './Modal'

function ProfileModal({ onClose }) {
  const { user, updateMe } = useAuth()
  const isMaster = user?.role === 'MASTER'
  const [form, setForm] = useState({
    loginId: user.loginId,
    name: user.name,
    phone: user.phone || '',
    email: user.email || '',
    companyName: user.companyName || '',
    businessNumber: user.businessNumber || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [accountsMessage, setAccountsMessage] = useState('')

  const loadAccounts = () => {
    if (!isMaster) return
    getAdminAccounts()
      .then((list) => setAccounts(list ?? []))
      .catch((error) => setAccountsMessage(error.message))
  }

  useEffect(() => {
    loadAccounts()
  }, [isMaster])

  const submit = async (event) => {
    event.preventDefault()
    setMessage(null)

    if (!form.loginId.trim() || !form.name.trim() || !form.currentPassword) {
      setMessage({ type: 'error', text: '아이디, 이름, 현재 비밀번호를 모두 입력해 주세요.' })
      return
    }
    if (!isMaster && (!form.phone.trim() || !form.email.trim())) {
      setMessage({ type: 'error', text: '휴대폰 번호와 이메일을 입력해 주세요.' })
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
        phone: form.phone.trim(),
        email: form.email.trim(),
        companyName: form.companyName.trim() || null,
        businessNumber: form.businessNumber.trim() || null,
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

  const toggleSuspend = async (account) => {
    try {
      const updated = await setAdminSuspended(account.id, !account.suspended)
      setAccounts((prev) => prev.map((item) => (item.id === account.id ? updated : item)))
      setAccountsMessage('')
    } catch (error) {
      setAccountsMessage(error.message)
    }
  }

  const removeAccount = async (account) => {
    if (!window.confirm(`${account.name}(${account.loginId}) 계정을 삭제할까요?\n개인정보는 파기(마스킹)되며 복구할 수 없습니다.`)) {
      return
    }
    try {
      await deleteAdminAccount(account.id)
      setAccounts((prev) => prev.filter((item) => item.id !== account.id))
      setAccountsMessage('계정이 삭제되었습니다.')
    } catch (error) {
      setAccountsMessage(error.message)
    }
  }

  return (
    <Modal
      title="마이페이지"
      description={isMaster ? '내 정보 수정과 등록 유저 관리' : '계정 정보 변경을 위해 현재 비밀번호를 입력해 주세요.'}
      onClose={onClose}
      wide={isMaster}
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
        <label htmlFor="profile-phone">
          휴대폰 번호{isMaster ? ' (선택)' : ''}
          <input
            id="profile-phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            required={!isMaster}
          />
        </label>
        <label htmlFor="profile-email">
          이메일{isMaster ? ' (선택)' : ''}
          <input
            id="profile-email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required={!isMaster}
          />
        </label>
        <label htmlFor="profile-company">
          회사명 (선택)
          <input
            id="profile-company"
            value={form.companyName}
            onChange={(event) => setForm({ ...form, companyName: event.target.value })}
          />
        </label>
        <label htmlFor="profile-biz">
          사업자등록번호 (선택)
          <input
            id="profile-biz"
            value={form.businessNumber}
            onChange={(event) => setForm({ ...form, businessNumber: event.target.value })}
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

      {isMaster && (
        <div className="master-accounts-panel">
          <div className="master-accounts-heading">
            <h3>등록 유저</h3>
            <span>비밀번호 제외 · 정지/삭제 가능</span>
          </div>
          {accountsMessage && <div className="notice warning modal-notice">{accountsMessage}</div>}
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>아이디</th>
                  <th>휴대폰</th>
                  <th>이메일</th>
                  <th>회사</th>
                  <th>상태</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 ? (
                  <tr><td colSpan={7} className="empty">등록된 일반 유저가 없습니다.</td></tr>
                ) : accounts.map((account) => (
                  <tr key={account.id}>
                    <td>{account.name}</td>
                    <td className="mono">{account.loginId}</td>
                    <td>{account.phone || '-'}</td>
                    <td>{account.email || '-'}</td>
                    <td>{account.companyName || '-'}</td>
                    <td>
                      <span className={`status ${account.suspended ? 'off' : 'on'}`}>
                        <i />{account.suspended ? '사용정지' : '정상'}
                      </span>
                    </td>
                    <td>
                      <div className="account-actions">
                        <button className="button ghost compact" type="button" onClick={() => toggleSuspend(account)}>
                          {account.suspended ? '해제' : '정지'}
                        </button>
                        <button className="button danger ghost compact" type="button" onClick={() => removeAccount(account)}>
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default ProfileModal
