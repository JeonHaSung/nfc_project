import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import {
  createStoreReviewKeyword,
  deleteStoreReviewKeywords,
  getStoreReviewKeywords,
  updateStoreReviewKeyword,
} from '../../api/store/storeApi'
import Modal from '../../common/components/Modal'

const MAX_KEYWORDS = 50

function ReviewKeywordModal({ store, onClose }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [message, setMessage] = useState(null)

  const load = useCallback(async () => {
    if (!store?.id) return
    setLoading(true)
    try {
      const response = await getStoreReviewKeywords(store.id)
      setItems(response.data ?? [])
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [store?.id])

  useEffect(() => {
    load()
  }, [load])

  const addKeyword = async (event) => {
    event.preventDefault()
    const keyword = draft.trim()
    if (!keyword) {
      setMessage({ type: 'error', text: '키워드를 입력해 주세요.' })
      return
    }
    if (items.length >= MAX_KEYWORDS) {
      setMessage({ type: 'error', text: `키워드는 최대 ${MAX_KEYWORDS}개까지 등록할 수 있습니다.` })
      return
    }
    setSaving(true)
    try {
      await createStoreReviewKeyword(store.id, keyword)
      setDraft('')
      setMessage({ type: 'success', text: '키워드가 추가되었습니다.' })
      await load()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditValue(item.keyword || '')
  }

  const saveEdit = async (event) => {
    event.preventDefault()
    if (editingId == null) return
    const keyword = editValue.trim()
    if (!keyword) {
      setMessage({ type: 'error', text: '키워드를 입력해 주세요.' })
      return
    }
    setSaving(true)
    try {
      await updateStoreReviewKeyword(store.id, editingId, keyword)
      setEditingId(null)
      setEditValue('')
      setMessage({ type: 'success', text: '키워드가 수정되었습니다.' })
      await load()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  const removeOne = async (item) => {
    if (!window.confirm(`「${item.keyword}」키워드를 삭제할까요?`)) return
    try {
      await deleteStoreReviewKeywords(store.id, [item.id])
      setMessage({ type: 'success', text: '키워드가 삭제되었습니다.' })
      if (editingId === item.id) {
        setEditingId(null)
        setEditValue('')
      }
      await load()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  return (
    <Modal
      title="리뷰 키워드 관리"
      description={`${store?.name || '매장'} · 손님 리뷰 작성에 도움이 될 키워드를 추천·유도합니다 · ${items.length}/${MAX_KEYWORDS}`}
      onClose={onClose}
      wide
      actions={<button className="button ghost" type="button" onClick={onClose}>닫기</button>}
    >
      {message && (
        <div className={`notice ${message.type}`} role="alert" onClick={() => setMessage(null)}>
          {message.text}
        </div>
      )}

      <form className="review-keyword-add" onSubmit={addKeyword}>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="예: 분위기 좋은, 커피가 맛있는"
          maxLength={100}
          disabled={saving || items.length >= MAX_KEYWORDS}
        />
        <button className="button primary" type="submit" disabled={saving || items.length >= MAX_KEYWORDS}>
          <Plus size={15} /> 추가
        </button>
      </form>

      <div className="review-keyword-list">
        {loading ? (
          <p className="muted">불러오는 중...</p>
        ) : items.length === 0 ? (
          <p className="muted">등록된 키워드가 없습니다.</p>
        ) : (
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                {editingId === item.id ? (
                  <form className="review-keyword-edit" onSubmit={saveEdit}>
                    <input
                      value={editValue}
                      onChange={(event) => setEditValue(event.target.value)}
                      maxLength={100}
                      disabled={saving}
                      autoFocus
                    />
                    <button className="button primary compact" type="submit" disabled={saving}>저장</button>
                    <button
                      className="button ghost compact"
                      type="button"
                      onClick={() => {
                        setEditingId(null)
                        setEditValue('')
                      }}
                    >
                      취소
                    </button>
                  </form>
                ) : (
                  <>
                    <span>{item.keyword}</span>
                    <div className="row-actions">
                      <button className="button ghost compact" type="button" onClick={() => startEdit(item)}>
                        <Pencil size={14} /> 수정
                      </button>
                      <button className="button ghost compact" type="button" onClick={() => removeOne(item)}>
                        <Trash2 size={14} /> 삭제
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}

export default ReviewKeywordModal
