import { useCallback, useEffect, useState } from 'react'
import { BarChart3, CheckCircle2, Copy, ExternalLink, Pencil, Plus, QrCode, Radio, RotateCcw, Tags, Trash2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { createTag, deleteTags, getTags, updateTag } from '../../api/tag/tagApi'
import nfcRegistrationGuide from '../../assets/nfc-tag-registration-guide.png'
import CardTypeBadge from '../../common/components/CardTypeBadge'
import Modal from '../../common/components/Modal'
import StoreSelect from '../../common/components/StoreSelect'

const emptyForm = { nickname: '', type: 'NFC', useTag: true }
const tagTypes = ['ALL', 'NFC', 'QR']

function TagPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tags, setTags] = useState([])
  const [selected, setSelected] = useState([])
  const [editing, setEditing] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [createdTagUrl, setCreatedTagUrl] = useState('')
  const [updateResult, setUpdateResult] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [selectedStoreName, setSelectedStoreName] = useState('')
  const storeId = searchParams.get('storeId') ?? ''
  const typeParam = searchParams.get('tagType')
  const tagType = tagTypes.includes(typeParam) ? typeParam : 'ALL'

  const loadTags = useCallback(async () => {
    if (!storeId) { setTags([]); return }
    setLoading(true)
    try {
      const response = await getTags(storeId, tagType)
      setTags(response.data ?? [])
      setSelected([])
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }, [storeId, tagType])

  useEffect(() => { loadTags() }, [loadTags])

  const updateFilter = (nextFilter) => {
    const nextParams = new URLSearchParams(searchParams)
    Object.entries(nextFilter).forEach(([key, value]) => {
      if (value) nextParams.set(key, value)
      else nextParams.delete(key)
    })
    setSearchParams(nextParams)
  }

  const resetFilters = () => {
    setSearchParams({})
    setSelected([])
    setMessage(null)
  }

  const openForm = (tag = null) => {
    setEditing(tag)
    setForm(tag ? { nickname: tag.nickname, type: tag.category, useTag: tag.used ?? tag.isUsed } : { ...emptyForm, type: tagType === 'ALL' ? 'NFC' : tagType })
    setModalOpen(true)
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!storeId || !form.nickname.trim()) {
      setMessage({ type: 'error', text: '매장과 태그 별칭을 입력해 주세요.' })
      return
    }
    setSaving(true)
    try {
      if (editing) {
        const response = await updateTag({ storeId, type: form.type, nickname: form.nickname, useTag: form.useTag, tagId: editing.id })
        setUpdateResult(response.data)
      } else {
        const response = await createTag({ storeId, ...form })
        setCreatedTagUrl(response.data)
      }
      setModalOpen(false)
      await loadTags()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!selected.length || !window.confirm(`${selected.length}개 태그를 삭제할까요?`)) return
    try {
      await deleteTags(selected)
      setMessage({ type: 'success', text: '선택한 태그가 삭제되었습니다.' })
      await loadTags()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  const copyUrl = async (url) => {
    await navigator.clipboard.writeText(url)
    setMessage({ type: 'success', text: '태그 URL을 복사했습니다.' })
  }

  const allSelected = tags.length > 0 && tags.every((tag) => selected.includes(tag.id))
  const activeCount = tags.filter((tag) => tag.used ?? tag.isUsed).length
  const totalHitCount = tags.reduce((sum, tag) => sum + Number(tag.hitCount || 0), 0)

  return (
    <div className="page">
      <div className="page-heading">
        <div><span className="eyebrow">MANAGEMENT</span><h1>태그관리</h1><p>매장별 NFC·QR 태그와 사용 상태를 관리합니다.</p></div>
        <button className="button primary" type="button" disabled={!storeId} onClick={() => openForm()}><Plus size={17} /> 태그 등록</button>
      </div>
      {message && <div className={`notice ${message.type}`} onClick={() => setMessage(null)}>{message.text}</div>}
      <div className="stats-grid">
        <div className="stat-card"><span className="stat-icon blue"><Tags size={19} /></span><div><small>조회 태그</small><strong>{tags.length}</strong></div></div>
        <div className="stat-card"><span className="stat-icon green"><Radio size={19} /></span><div><small>사용 중</small><strong>{activeCount}</strong></div></div>
        <div className="stat-card"><span className="stat-icon violet"><BarChart3 size={19} /></span><div><small>총 조회수</small><strong>{totalHitCount.toLocaleString()}</strong></div></div>
      </div>
      <section className="panel">
        <div className="toolbar tag-filters">
          <div className="filter-group">
            <StoreSelect
              value={storeId}
              onChange={(value) => updateFilter({ storeId: value, tagType })}
              onSelectedStoreChange={(store) => setSelectedStoreName(store?.name || '')}
            />
            <button className="button ghost filter-reset" type="button" onClick={resetFilters}><RotateCcw size={15} /> 리셋</button>
            <div className="segmented" aria-label="태그 유형">{tagTypes.map((type) => <button type="button" key={type} className={tagType === type ? 'active' : ''} onClick={() => updateFilter({ tagType: type })}>{type === 'NFC' ? <Radio size={15} /> : type === 'QR' ? <QrCode size={15} /> : <Tags size={15} />}{type === 'ALL' ? '전체' : type}</button>)}</div>
          </div>
          <button className="button danger ghost" type="button" disabled={!selected.length} onClick={remove}><Trash2 size={16} /> 선택 삭제 {selected.length > 0 && `(${selected.length})`}</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th className="check-cell"><input type="checkbox" checked={allSelected} onChange={(e) => setSelected(e.target.checked ? tags.map((tag) => tag.id) : [])} /></th><th>태그 별칭</th><th>유형</th><th>카드 타입</th><th>태그 URL</th><th>접속 수</th><th>상태</th><th /></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="8" className="empty">태그 정보를 불러오는 중입니다.</td></tr>
                : !storeId ? <tr><td colSpan="8" className="empty">태그를 조회할 매장을 선택하세요.</td></tr>
                  : tags.length === 0 ? <tr><td colSpan="8" className="empty">이 매장에 등록된 {tagType === 'ALL' ? '전체' : tagType} 태그가 없습니다.</td></tr>
                    : tags.map((tag) => {
                      const used = tag.used ?? tag.isUsed
                      return (
                        <tr key={tag.id}>
                          <td className="check-cell"><input type="checkbox" checked={selected.includes(tag.id)} onChange={() => setSelected((prev) => prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id])} /></td>
                          <td><strong>{tag.nickname}</strong><small className="cell-sub">{tag.id}</small></td>
                          <td><span className="badge neutral">{tag.category}</span></td>
                          <td><CardTypeBadge value={tag.experienceType} /></td>
                          <td><div className="url-actions"><span className="url-cell">{tag.tagUrl}</span><button className="icon-button" type="button" onClick={() => copyUrl(tag.tagUrl)}><Copy size={14} /></button><a className="icon-button" href={tag.tagUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /></a></div></td>
                          <td>{Number(tag.hitCount || 0).toLocaleString()}회</td>
                          <td><span className={`status ${used ? 'on' : 'off'}`}><i />{used ? '사용 중' : '사용 안 함'}</span></td>
                          <td><button className="icon-button" type="button" onClick={() => openForm(tag)}><Pencil size={16} /></button></td>
                        </tr>
                      )
                    })}
            </tbody>
          </table>
        </div>
      </section>
      {modalOpen && (
        <Modal title={editing ? '태그 정보 수정' : '새 태그 등록'} description={editing ? '태그 별칭과 사용 상태를 변경합니다.' : '선택한 매장에 새 태그를 연결합니다.'} onClose={() => setModalOpen(false)}
          actions={<><button className="button ghost" type="button" onClick={() => setModalOpen(false)}>취소</button><button className="button primary" type="submit" form="tag-form" disabled={saving}>{saving ? '저장 중...' : '저장'}</button></>}>
          <form id="tag-form" className="form-grid" onSubmit={submit}>
            <label className="full">연결 매장<select value={storeId} disabled><option>{selectedStoreName || storeId}</option></select></label>
            <label>태그 유형<select value={form.type} disabled={Boolean(editing)} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>NFC</option><option>QR</option></select></label>
            <label>태그 별칭<input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} placeholder="예: 테이블 1번" /></label>
            <label className="switch-row full"><span><strong>태그 사용</strong><small>비활성화하면 태그 접속을 중지합니다.</small></span><input type="checkbox" checked={form.useTag} onChange={(e) => setForm({ ...form, useTag: e.target.checked })} /></label>
          </form>
        </Modal>
      )}
      {updateResult && (
        <Modal
          title="태그 수정 완료"
          description="요청한 태그 정보가 정상적으로 반영되었습니다."
          onClose={() => setUpdateResult(null)}
          actions={<button className="button primary" type="button" onClick={() => setUpdateResult(null)}>확인</button>}
        >
          <div className="update-result">
            <CheckCircle2 size={42} />
            <strong>수정된 항목</strong>
            <ul>
              {updateResult.isNicknameChanged && <li><span>태그 별칭</span><small>새로운 별칭으로 변경되었습니다.</small></li>}
              {updateResult.isUseTagChanged && <li><span>사용 상태</span><small>태그 사용 여부가 변경되었습니다.</small></li>}
            </ul>
          </div>
        </Modal>
      )}
      {createdTagUrl && (
        <Modal
          title="태그 등록 완료"
          description="새로운 태그 URL이 정상적으로 생성되었습니다."
          onClose={() => setCreatedTagUrl('')}
          actions={<button className="button primary" type="button" onClick={() => setCreatedTagUrl('')}>확인</button>}
        >
          <div className="tag-create-result">
            <img src={nfcRegistrationGuide} alt="스마트폰으로 NFC 또는 QR 태그를 등록하는 방법" />
            <div className="tag-create-guide">
              <CheckCircle2 size={22} />
              <div>
                <strong>태그에 URL을 등록해 주세요</strong>
                <p>모바일 NFC Tools를 사용하여 아래 URL을 NFC 또는 QR에 등록해 주세요.</p>
              </div>
            </div>
            <div className="created-url-box">
              <span>{createdTagUrl}</span>
              <button type="button" onClick={() => copyUrl(createdTagUrl)}>
                <Copy size={15} />
                복사
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default TagPage
