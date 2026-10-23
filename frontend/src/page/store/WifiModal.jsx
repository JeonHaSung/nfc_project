import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { getStoreWifi, updateStoreWifi } from '../../api/store/storeApi'
import Modal from '../../common/components/Modal'

function WifiModal({ store, onClose }) {
  const [wifiName, setWifiName] = useState('')
  const [wifiPassword, setWifiPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (!store?.id) return
    let cancelled = false
    setLoading(true)
    setMessage(null)
    getStoreWifi(store.id)
      .then((response) => {
        if (cancelled) return
        const data = response.data ?? {}
        setWifiName(data.wifiName || '')
        setWifiPassword(data.wifiPassword || '')
      })
      .catch((error) => {
        if (cancelled) return
        setMessage({ type: 'error', text: error.message || '와이파이 정보를 불러오지 못했습니다.' })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [store?.id])

  const submit = async (event) => {
    event.preventDefault()
    if (!store?.id) return
    setSaving(true)
    setMessage(null)
    try {
      await updateStoreWifi(store.id, {
        wifiName,
        wifiPassword,
      })
      onClose()
    } catch (error) {
      setMessage({ type: 'error', text: error.message || '저장에 실패했습니다.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="와이파이"
      description={`${store?.name || '매장'} 와이파이 정보를 설정합니다.`}
      onClose={onClose}
      actions={(
        <>
          <button className="button ghost" type="button" onClick={onClose}>취소</button>
          <button
            className="button primary"
            type="submit"
            form="store-wifi-form"
            disabled={loading || saving}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </>
      )}
    >
      {message && (
        <p className={`inline-message ${message.type === 'error' ? 'error' : 'success'}`}>
          {message.text}
        </p>
      )}
      {loading ? (
        <p className="muted">불러오는 중...</p>
      ) : (
        <form id="store-wifi-form" className="form-grid" onSubmit={submit}>
          <label className="full">
            와이파이 이름
            <input
              value={wifiName}
              onChange={(event) => setWifiName(event.target.value)}
              maxLength={200}
              autoComplete="off"
            />
          </label>
          <label className="full">
            와이파이 비밀번호
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={wifiPassword}
                onChange={(event) => setWifiPassword(event.target.value)}
                placeholder="비밀번호"
                maxLength={200}
                autoComplete="new-password"
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>
        </form>
      )}
    </Modal>
  )
}

export default WifiModal
