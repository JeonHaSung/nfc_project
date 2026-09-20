import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import {
  createReviewType,
  deleteReviewType,
  listReviewTypes,
  updateReviewType,
} from '../../api/redirecting/redirectingTypeApi'
import Modal from '../../common/components/Modal'

const LOCALES = [
  { id: 'ko', name: '한국어', required: true },
  { id: 'en', name: 'English' },
  { id: 'ja', name: '日本語' },
  { id: 'zh', name: '中文' },
  { id: 'fr', name: 'Français' },
]

const emptyForm = () => ({
  color: '#64748b',
  sortOrder: '',
  labels: { ko: '', en: '', ja: '', zh: '', fr: '' },
})

function ReviewTypePage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [message, setMessage] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await listReviewTypes()
      setItems(response.data ?? [])
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openForm = (item = null) => {
    setEditing(item)
    setForm(item
      ? {
          color: item.color || '#64748b',
          sortOrder: item.sortOrder ?? '',
          labels: {
            ko: item.labels?.ko || '',
            en: item.labels?.en || '',
            ja: item.labels?.ja || '',
            zh: item.labels?.zh || '',
            fr: item.labels?.fr || '',
          },
        }
      : emptyForm())
    setModalOpen(true)
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!form.labels.ko.trim()) {
      setMessage({ type: 'error', text: '한국어 멘트를 입력해 주세요.' })
      return
    }
    setSaving(true)
    try {
      const payload = {
        color: form.color,
        sortOrder: form.sortOrder === '' ? undefined : Number(form.sortOrder),
        labels: form.labels,
      }
      if (editing) {
        await updateReviewType(editing.id, payload)
        setMessage({ type: 'success', text: '리뷰 유형이 수정되었습니다.' })
      } else {
        await createReviewType(payload)
        setMessage({ type: 'success', text: '리뷰 유형이 등록되었습니다.' })
      }
      setModalOpen(false)
      await load()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item) => {
    if (item.inUse) {
      setMessage({ type: 'error', text: '사용 중인 리뷰 유형은 삭제할 수 없습니다.' })
      return
    }
    if (!window.confirm(`「${item.labels?.ko || item.code}」유형을 삭제할까요?`)) return
    try {
      await deleteReviewType(item.id)
      setMessage({ type: 'success', text: '리뷰 유형이 삭제되었습니다.' })
      await load()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">REVIEW TYPES</span>
          <h1>리뷰유형 관리</h1>
          <p>태그 선택 화면에 노출되는 이동 서비스를 등록하고, 언어별 멘트를 수정합니다.</p>
        </div>
        <button className="button primary" type="button" onClick={() => openForm()}>
          <Plus size={15} /> 유형 추가
        </button>
      </div>

      {message && (
        <div className={`notice ${message.type}`} role="alert" onClick={() => setMessage(null)}>
          {message.text}
        </div>
      )}

      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>색</th>
                <th>한국어</th>
                <th>English</th>
                <th>사용</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="empty">불러오는 중...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="empty">등록된 리뷰 유형이 없습니다.</td></tr>
              ) : items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <i className="review-type-swatch" style={{ background: item.color }} />
                  </td>
                  <td>{item.labels?.ko || '-'}</td>
                  <td>{item.labels?.en || '-'}</td>
                  <td>{item.inUse ? '사용 중' : '미사용'}</td>
                  <td>
                    <div className="row-actions">
                      <button className="button ghost compact" type="button" onClick={() => openForm(item)}>
                        <Pencil size={14} /> 수정
                      </button>
                      <button
                        className="button ghost compact"
                        type="button"
                        disabled={item.inUse}
                        title={item.inUse ? '사용 중인 유형은 삭제할 수 없습니다.' : '삭제'}
                        onClick={() => remove(item)}
                      >
                        <Trash2 size={14} /> 삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && (
        <Modal
          wide
          title={editing ? '리뷰 유형 수정' : '리뷰 유형 추가'}
          onClose={() => setModalOpen(false)}
          actions={(
            <>
              <button className="button ghost" type="button" onClick={() => setModalOpen(false)}>취소</button>
              <button className="button primary" type="submit" form="review-type-form" disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </>
          )}
        >
          <form id="review-type-form" className="form-grid" onSubmit={submit}>
            <label>
              색상
              <input
                type="color"
                value={form.color}
                onChange={(event) => setForm({ ...form, color: event.target.value })}
              />
            </label>
            <label>
              정렬
              <input
                type="number"
                value={form.sortOrder}
                onChange={(event) => setForm({ ...form, sortOrder: event.target.value })}
                placeholder="자동"
              />
            </label>
            {LOCALES.map((locale) => (
              <label key={locale.id} className="full">
                {locale.name} 멘트{locale.required ? ' (필수)' : ' (선택)'}
                <input
                  value={form.labels[locale.id]}
                  onChange={(event) => setForm({
                    ...form,
                    labels: { ...form.labels, [locale.id]: event.target.value },
                  })}
                  required={locale.required}
                  maxLength={80}
                />
              </label>
            ))}
          </form>
        </Modal>
      )}
    </div>
  )
}

export default ReviewTypePage
