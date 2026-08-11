import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Pencil, QrCode, Radio, Tags, Trash2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { deleteTags, getTags, updateTag } from '../../api/tag/tagApi'
import { useAuth } from '../../auth/AuthContext'
import CardTypeBadge from '../../common/components/CardTypeBadge'
import Modal from '../../common/components/Modal'

const tagTypes = ['ALL', 'NFC', 'QR']
const experienceTypes = [
  { value: 'ALL', label: '전체 카드' },
  { value: 'STANDARD', label: '스탠다드' },
  { value: 'PREMIUM', label: '프리미엄' },
]

function StoreCardsPage() {
  const { storeId } = useParams()
  const { user } = useAuth()
  const isMaster = user?.role === 'MASTER'
  const [items, setItems] = useState([])
  const [tagType, setTagType] = useState('ALL')
  const [experienceType, setExperienceType] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const [editing, setEditing] = useState(null)
  const [nickname, setNickname] = useState('')
  const [selected, setSelected] = useState([])
  const colCount = isMaster ? 8 : 7

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getTags(storeId, tagType, experienceType)
      setItems(response.data ?? [])
      setSelected([])
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }, [storeId, tagType, experienceType])

  useEffect(() => { load() }, [load])

  const totalHitCount = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.hitCount || 0), 0),
    [items],
  )

  const saveNickname = async (event) => {
    event.preventDefault()
    try {
      await updateTag({ tagId: editing.id, nickname })
      setEditing(null)
      setMessage({ type: 'success', text: '카드 별칭이 수정되었습니다.' })
      await load()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  const remove = async () => {
    if (!selected.length || !window.confirm(`${selected.length}개 카드를 삭제할까요?`)) return
    try {
      await deleteTags(selected)
      setMessage({ type: 'success', text: '선택한 카드가 삭제되었습니다.' })
      await load()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  const allSelected = items.length > 0 && items.every((item) => selected.includes(item.id))
  const toggleAll = (checked) => setSelected(checked ? items.map((item) => item.id) : [])

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">CARDS</span>
          <h1>소속카드</h1>
          <p>매장 {storeId}에 등록된 카드 목록입니다.</p>
        </div>
        <div className="row-actions">
          <Link className="button ghost" to="/admin/management/stores">
            <ArrowLeft size={15} /> 매장조회로
          </Link>
          {isMaster && (
            <button className="button danger" type="button" disabled={!selected.length} onClick={remove}>
              <Trash2 size={15} /> 선택 삭제
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`notice ${message.type}`} role="alert" onClick={() => setMessage(null)}>
          {message.text}
        </div>
      )}

      <section className="panel">
        <div className="toolbar tag-filters">
          <div className="filter-group">
            <div className="segmented" aria-label="태그 유형">
              {tagTypes.map((type) => (
                <button
                  type="button"
                  key={type}
                  className={tagType === type ? 'active' : ''}
                  onClick={() => setTagType(type)}
                >
                  {type === 'NFC' ? <Radio size={15} /> : type === 'QR' ? <QrCode size={15} /> : <Tags size={15} />}
                  {type === 'ALL' ? '전체' : type}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <div className="segmented" aria-label="카드 타입">
              {experienceTypes.map((type) => (
                <button
                  type="button"
                  key={type.value}
                  className={experienceType === type.value ? 'active' : ''}
                  onClick={() => setExperienceType(type.value)}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          <div className="cards-summary-meta">
            <span>카드 {items.length}개</span>
            <span>조회수 합계 {totalHitCount.toLocaleString()}회</span>
          </div>
        </div>
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
                <th>카드 ID</th>
                <th>유형</th>
                <th>카드 타입</th>
                <th>별칭</th>
                <th>조회수</th>
                <th>URL</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={colCount} className="empty">불러오는 중...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={colCount} className="empty">등록된 카드가 없습니다.</td></tr>
              ) : items.map((item) => (
                <tr
                  key={item.id}
                  className={`card-type-row-${String(item.experienceType || 'STANDARD').toLowerCase()}`}
                >
                  {isMaster && (
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.includes(item.id)}
                        onChange={() => setSelected((prev) => (
                          prev.includes(item.id)
                            ? prev.filter((id) => id !== item.id)
                            : [...prev, item.id]
                        ))}
                      />
                    </td>
                  )}
                  <td>{item.id}</td>
                  <td>{item.category}</td>
                  <td><CardTypeBadge value={item.experienceType} /></td>
                  <td>{item.nickname || '-'}</td>
                  <td>{item.hitCount ?? 0}</td>
                  <td className="mono">{item.tagUrl}</td>
                  <td>
                    <button
                      className="button ghost compact"
                      type="button"
                      onClick={() => {
                        setEditing(item)
                        setNickname(item.nickname || '')
                      }}
                    >
                      <Pencil size={15} /> 수정
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {editing && (
        <Modal
          title="카드 별칭 수정"
          onClose={() => setEditing(null)}
          actions={(
            <>
              <button className="button ghost" type="button" onClick={() => setEditing(null)}>취소</button>
              <button className="button primary" type="submit" form="card-edit-form">저장</button>
            </>
          )}
        >
          <form id="card-edit-form" className="form-grid" onSubmit={saveNickname}>
            <label className="full">
              별칭
              <input value={nickname} onChange={(event) => setNickname(event.target.value)} required />
            </label>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default StoreCardsPage
