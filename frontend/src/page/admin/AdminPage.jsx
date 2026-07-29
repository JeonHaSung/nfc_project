import { useCallback, useEffect, useState } from 'react'
import { KeyRound, Pencil, Plus, ShieldCheck, Trash2, UserRound } from 'lucide-react'
import {
  createAdminAccount,
  deleteAdminAccount,
  getAdminAccounts,
  resetAdminPassword,
  updateAdminAccount,
} from '../../api/admin/adminApi'
import { isValidPassword, passwordPolicyText } from '../../auth/password'
import Modal from '../../common/components/Modal'

const emptyForm = { name: '', loginId: '', password: '', confirmPassword: '' }

function AdminPage() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formOpen, setFormOpen] = useState(false)
  const [resetTarget, setResetTarget] = useState(null)
  const [resetForm, setResetForm] = useState({ password: '', confirmPassword: '' })
  const [message, setMessage] = useState(null)
  const [modalError, setModalError] = useState('')

  const loadAccounts = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getAdminAccounts()
      setAccounts(Array.isArray(response) ? response : response?.dtoList ?? [])
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAccounts() }, [loadAccounts])

  const openForm = (account = null) => {
    setEditing(account)
    setForm(account
      ? { name: account.name, loginId: account.loginId, password: '', confirmPassword: '' }
      : { ...emptyForm })
    setModalError('')
    setFormOpen(true)
  }

  const submitAccount = async (event) => {
    event.preventDefault()
    setModalError('')

    if (!form.name.trim() || !form.loginId.trim()) {
      setModalError('이름과 아이디를 모두 입력해 주세요.')
      return
    }
    if (!editing && !form.password) {
      setModalError('비밀번호를 입력해 주세요.')
      return
    }
    if (form.password && !isValidPassword(form.password)) {
      setModalError(passwordPolicyText)
      return
    }
    if (form.password !== form.confirmPassword) {
      setModalError('비밀번호와 비밀번호 확인이 일치하지 않습니다.')
      return
    }

    setSaving(true)
    try {
      const payload = { name: form.name.trim(), loginId: form.loginId.trim() }
      if (form.password) payload.password = form.password

      if (editing) await updateAdminAccount(editing.id, payload)
      else await createAdminAccount(payload)

      setFormOpen(false)
      setMessage({ type: 'success', text: `관리자 계정이 ${editing ? '수정' : '추가'}되었습니다.` })
      await loadAccounts()
    } catch (error) {
      setModalError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const openPasswordReset = (account) => {
    setResetTarget(account)
    setResetForm({ password: '', confirmPassword: '' })
    setModalError('')
  }

  const submitPasswordReset = async (event) => {
    event.preventDefault()
    setModalError('')

    if (!isValidPassword(resetForm.password)) {
      setModalError(passwordPolicyText)
      return
    }
    if (resetForm.password !== resetForm.confirmPassword) {
      setModalError('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.')
      return
    }

    setSaving(true)
    try {
      await resetAdminPassword(resetTarget.id, resetForm.password)
      setResetTarget(null)
      setMessage({ type: 'success', text: `${resetTarget.name} 관리자의 비밀번호가 초기화되었습니다.` })
    } catch (error) {
      setModalError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const removeAccount = async (account) => {
    if (!window.confirm(`${account.name} 관리자 계정을 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) return

    try {
      await deleteAdminAccount(account.id)
      setMessage({ type: 'success', text: '관리자 계정이 삭제되었습니다.' })
      await loadAccounts()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">MASTER ONLY</span>
          <h1>관리자 관리</h1>
          <p>서비스에 접근할 일반 관리자 계정을 추가하고 관리합니다.</p>
        </div>
        <button className="button primary" type="button" onClick={() => openForm()}>
          <Plus size={17} /> 관리자 추가
        </button>
      </div>
      {message && (
        <div
          className={`notice ${message.type}`}
          role={message.type === 'error' ? 'alert' : 'status'}
          onClick={() => setMessage(null)}
        >
          {message.text}
        </div>
      )}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon blue"><UserRound size={19} /></span>
          <div><small>일반 관리자</small><strong>{accounts.length}</strong></div>
        </div>
        <div className="stat-card">
          <span className="stat-icon violet"><ShieldCheck size={19} /></span>
          <div><small>현재 권한</small><strong className="stat-role">MASTER</strong></div>
        </div>
      </div>
      <section className="panel">
        <div className="admin-panel-heading">
          <div><strong>관리자 계정 목록</strong><small>등록된 ADMIN 권한 계정입니다.</small></div>
        </div>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>이름</th><th>아이디</th><th>권한</th><th>계정 관리</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="empty">관리자 계정을 불러오는 중입니다.</td></tr>
              ) : accounts.length === 0 ? (
                <tr><td colSpan="4" className="empty">등록된 일반 관리자 계정이 없습니다.</td></tr>
              ) : accounts.map((account) => (
                <tr key={account.id}>
                  <td><strong>{account.name}</strong><small className="cell-sub">ID {account.id}</small></td>
                  <td>{account.loginId}</td>
                  <td><span className="badge blue">{account.role || 'ADMIN'}</span></td>
                  <td>
                    <div className="admin-row-actions">
                      <button className="button ghost compact" type="button" onClick={() => openForm(account)}>
                        <Pencil size={14} /> 수정
                      </button>
                      <button className="button ghost compact" type="button" onClick={() => openPasswordReset(account)}>
                        <KeyRound size={14} /> 비밀번호 초기화
                      </button>
                      <button
                        className="icon-button danger-icon"
                        type="button"
                        aria-label={`${account.name} 계정 삭제`}
                        onClick={() => removeAccount(account)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {formOpen && (
        <Modal
          title={editing ? '관리자 계정 수정' : '관리자 계정 추가'}
          description={editing ? '계정 기본 정보와 선택적으로 비밀번호를 변경합니다.' : '서비스에 접근할 일반 관리자 계정을 생성합니다.'}
          onClose={() => setFormOpen(false)}
          actions={(
            <>
              <button className="button ghost" type="button" onClick={() => setFormOpen(false)}>취소</button>
              <button className="button primary" type="submit" form="admin-account-form" disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </>
          )}
        >
          {modalError && <div className="notice error modal-notice" role="alert">{modalError}</div>}
          <form id="admin-account-form" className="form-grid" onSubmit={submitAccount}>
            <label htmlFor="account-name">
              이름
              <input
                id="account-name"
                autoComplete="name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
              />
            </label>
            <label htmlFor="account-login-id">
              아이디
              <input
                id="account-login-id"
                autoComplete="username"
                value={form.loginId}
                onChange={(event) => setForm({ ...form, loginId: event.target.value })}
                required
              />
            </label>
            <label htmlFor="account-password">
              {editing ? '새 비밀번호 (선택)' : '비밀번호'}
              <input
                id="account-password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required={!editing}
              />
              <small className="field-help">{passwordPolicyText}</small>
            </label>
            <label htmlFor="account-confirm-password">
              비밀번호 확인
              <input
                id="account-confirm-password"
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                required={!editing}
              />
            </label>
          </form>
        </Modal>
      )}

      {resetTarget && (
        <Modal
          title="비밀번호 초기화"
          description={`${resetTarget.name} 관리자의 새 비밀번호를 지정합니다.`}
          onClose={() => setResetTarget(null)}
          actions={(
            <>
              <button className="button ghost" type="button" onClick={() => setResetTarget(null)}>취소</button>
              <button className="button primary" type="submit" form="password-reset-form" disabled={saving}>
                {saving ? '변경 중...' : '비밀번호 변경'}
              </button>
            </>
          )}
        >
          {modalError && <div className="notice error modal-notice" role="alert">{modalError}</div>}
          <form id="password-reset-form" className="form-grid" onSubmit={submitPasswordReset}>
            <label className="full" htmlFor="reset-password">
              새 비밀번호
              <input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                value={resetForm.password}
                onChange={(event) => setResetForm({ ...resetForm, password: event.target.value })}
                required
              />
              <small className="field-help">{passwordPolicyText}</small>
            </label>
            <label className="full" htmlFor="reset-confirm-password">
              새 비밀번호 확인
              <input
                id="reset-confirm-password"
                type="password"
                autoComplete="new-password"
                value={resetForm.confirmPassword}
                onChange={(event) => setResetForm({ ...resetForm, confirmPassword: event.target.value })}
                required
              />
            </label>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default AdminPage
