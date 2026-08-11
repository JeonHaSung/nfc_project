import { useCallback, useEffect, useState } from 'react'
import { Bell, Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import {
  clearNoticeSelection,
  createNotice,
  deleteNotices,
  getNotices,
  selectNotice,
  updateNotice,
} from '../../api/notice/noticeApi'
import { useAuth } from '../../auth/AuthContext'
import Modal from '../../common/components/Modal'

const emptyForm = { title: '', body: '' }

function NoticePage() {
  const { user } = useAuth()
  const isMaster = user?.role === 'MASTER'
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState([])
  const [editing, setEditing] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [message, setMessage] = useState(null)
  const [detail, setDetail] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getNotices()
      setItems(response.data ?? [])
      setSelected([])
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openForm = (notice = null) => {
    setEditing(notice)
    setForm(notice ? { title: notice.title || '', body: notice.body || '' } : { ...emptyForm })
    setModalOpen(true)
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.body.trim()) {
      setMessage({ type: 'error', text: '제목과 본문을 입력해 주세요.' })
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await updateNotice({ id: editing.id, title: form.title.trim(), body: form.body.trim() })
        setMessage({ type: 'success', text: '공지사항이 수정되었습니다.' })
      } else {
        await createNotice({ title: form.title.trim(), body: form.body.trim() })
        setMessage({ type: 'success', text: '공지사항이 등록되었습니다.' })
      }
      setModalOpen(false)
      await load()
      window.dispatchEvent(new CustomEvent('notice:changed'))
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  const removeSelected = async () => {
    if (!selected.length) return
    if (!window.confirm(`${selected.length}개 공지를 완전 삭제할까요? 복구할 수 없습니다.`)) return
    try {
      await deleteNotices(selected)
      setMessage({ type: 'success', text: '선택한 공지가 삭제되었습니다.' })
      await load()
      window.dispatchEvent(new CustomEvent('notice:changed'))
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  const removeOne = async (notice) => {
    if (!window.confirm(`「${notice.title}」공지를 완전 삭제할까요? 복구할 수 없습니다.`)) return
    try {
      await deleteNotices([notice.id])
      setMessage({ type: 'success', text: '공지가 삭제되었습니다.' })
      await load()
      window.dispatchEvent(new CustomEvent('notice:changed'))
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  const toggleSelectActive = async (notice) => {
    try {
      if (notice.selected) {
        await clearNoticeSelection()
        setMessage({ type: 'success', text: '상단 공지 노출을 해제했습니다.' })
      } else {
        await selectNotice(notice.id)
        setMessage({ type: 'success', text: '선택한 공지가 관리 페이지 상단에 노출됩니다.' })
      }
      await load()
      window.dispatchEvent(new CustomEvent('notice:changed'))
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  const allSelected = items.length > 0 && items.every((item) => selected.includes(item.id))
  const toggleAll = (checked) => setSelected(checked ? items.map((item) => item.id) : [])
  const toggleOne = (id) => setSelected((prev) => (
    prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
  ))

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">NOTICES</span>
          <h1>공지사항</h1>
          <p>관리 페이지 상단에 노출할 공지를 등록하고 선택합니다.</p>
        </div>
        {isMaster && (
          <div className="page-heading-actions">
            <button
              className="button danger"
              type="button"
              disabled={!selected.length}
              onClick={removeSelected}
            >
              <Trash2 size={16} /> 선택 삭제
            </button>
            <button className="button primary" type="button" onClick={() => openForm()}>
              <Plus size={16} /> 공지 등록
            </button>
          </div>
        )}
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
                {isMaster && (
                  <th>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(event) => toggleAll(event.target.checked)}
                      aria-label="전체선택"
                    />
                  </th>
                )}
                <th>상태</th>
                <th>제목</th>
                <th>등록일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isMaster ? 5 : 4} className="empty">불러오는 중...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={isMaster ? 5 : 4} className="empty">등록된 공지가 없습니다.</td></tr>
              ) : items.map((item) => (
                <tr key={item.id} className={item.selected ? 'notice-row-active' : ''}>
                  {isMaster && (
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.includes(item.id)}
                        onChange={() => toggleOne(item.id)}
                      />
                    </td>
                  )}
                  <td>
                    {item.selected ? (
                      <span className="notice-status-badge active">노출중</span>
                    ) : (
                      <span className="notice-status-badge">대기</span>
                    )}
                  </td>
                  <td>
                    <button className="notice-title-button" type="button" onClick={() => setDetail(item)}>
                      <Bell size={14} />
                      <strong>{item.title}</strong>
                    </button>
                  </td>
                  <td className="muted">{item.createdAt?.replace('T', ' ').slice(0, 16) || '-'}</td>
                  <td>
                    <div className="row-actions">
                      {isMaster && (
                        <>
                          <button
                            className={`button ghost compact${item.selected ? ' notice-select-active' : ''}`}
                            type="button"
                            onClick={() => toggleSelectActive(item)}
                          >
                            {item.selected ? <><X size={14} /> 노출해제</> : <><Check size={14} /> 상단노출</>}
                          </button>
                          <button className="button ghost compact" type="button" onClick={() => openForm(item)}>
                            <Pencil size={14} /> 수정
                          </button>
                          <button className="button ghost compact" type="button" onClick={() => removeOne(item)}>
                            <Trash2 size={14} /> 삭제
                          </button>
                        </>
                      )}
                      {!isMaster && (
                        <button className="button ghost compact" type="button" onClick={() => setDetail(item)}>
                          보기
                        </button>
                      )}
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
          title={editing ? '공지 수정' : '공지 등록'}
          description="제목과 본문을 입력하세요. 상단 노출은 목록에서 별도로 선택합니다."
          onClose={() => setModalOpen(false)}
          actions={(
            <>
              <button className="button ghost" type="button" onClick={() => setModalOpen(false)}>취소</button>
              <button className="button primary" type="submit" form="notice-form" disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </>
          )}
        >
          <form id="notice-form" className="form-grid" onSubmit={submit}>
            <label className="full">
              제목
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                maxLength={200}
                required
              />
            </label>
            <label className="full">
              본문
              <textarea
                value={form.body}
                onChange={(event) => setForm({ ...form, body: event.target.value })}
                rows={8}
                required
              />
            </label>
          </form>
        </Modal>
      )}

      {detail && (
        <Modal
          title={detail.title}
          description={detail.selected ? '현재 관리 페이지 상단에 노출 중입니다.' : undefined}
          onClose={() => setDetail(null)}
          actions={(
            <button className="button ghost" type="button" onClick={() => setDetail(null)}>닫기</button>
          )}
        >
          <div className="notice-detail-body">{detail.body}</div>
        </Modal>
      )}
    </div>
  )
}

export default NoticePage
