import { useCallback, useEffect, useState } from 'react'
import { MapPin, Pencil, Plus, RotateCcw, Search, Store, Trash2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { createStore, deleteStores, getStores, updateStore } from '../../api/store/storeApi'
import Modal from '../../common/components/Modal'
import Pagination from '../../common/components/Pagination'

const categories = ['카페', '음식점', 'PC방', '주점/펍', '뷰티/미용', '기타']
const emptyForm = {
  category: '카페', name: '', address: '', detailAddress: '', description: '', redirectUrl: '',
}

function StorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState(null)
  const [keyword, setKeyword] = useState(searchParams.get('searchText') ?? '')
  const [selected, setSelected] = useState([])
  const [editing, setEditing] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const pageParam = Number(searchParams.get('page'))
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1
  const searchText = searchParams.get('searchText') ?? ''

  const updateParams = ({ page: nextPage = page, searchText: nextSearchText = searchText }) => {
    const nextParams = new URLSearchParams()
    if (nextPage > 1) nextParams.set('page', String(nextPage))
    if (nextSearchText.trim()) nextParams.set('searchText', nextSearchText.trim())
    setSearchParams(nextParams)
  }

  const resetSearch = () => {
    setKeyword('')
    setSearchParams({})
  }

  const loadStores = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getStores({ page, size: 10, searchText })
      setData(response.data)
      setSelected([])
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }, [page, searchText])

  useEffect(() => { loadStores() }, [loadStores])
  useEffect(() => { setKeyword(searchText) }, [searchText])

  const openForm = (storeData = null) => {
    setEditing(storeData)
    setForm(storeData ? { ...emptyForm, ...storeData } : { ...emptyForm })
    setModalOpen(true)
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!form.name.trim() || !form.address.trim() || !form.redirectUrl.trim()) {
      setMessage({ type: 'error', text: '매장명, 주소, 연결 URL을 입력해 주세요.' })
      return
    }
    setSaving(true)
    try {
      if (editing) await updateStore({ ...form, id: editing.id })
      else await createStore(form)
      setMessage({ type: 'success', text: `매장이 ${editing ? '수정' : '등록'}되었습니다.` })
      setEditing(null)
      setModalOpen(false)
      await loadStores()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!selected.length || !window.confirm(`${selected.length}개 매장을 삭제할까요? 연결된 태그도 함께 삭제됩니다.`)) return
    try {
      await deleteStores(selected)
      setMessage({ type: 'success', text: '선택한 매장이 삭제되었습니다.' })
      await loadStores()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  const stores = data?.dtoList ?? []
  const allSelected = stores.length > 0 && stores.every((item) => selected.includes(item.id))
  const toggleAll = (checked) => setSelected(checked ? stores.map((item) => item.id) : [])
  const toggleOne = (id) => setSelected((prev) => prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id])

  return (
    <div className="page">
      <div className="page-heading">
        <div><span className="eyebrow">MANAGEMENT</span><h1>매장관리</h1><p>매장 정보와 연결된 NFC 태그 현황을 관리합니다.</p></div>
        <button className="button primary" type="button" onClick={() => openForm()}><Plus size={17} /> 매장 등록</button>
      </div>
      {message && <div className={`notice ${message.type}`} onClick={() => setMessage(null)}>{message.text}</div>}
      <div className="stats-grid">
        <div className="stat-card"><span className="stat-icon blue"><Store size={19} /></span><div><small>전체 매장</small><strong>{data?.totalCount ?? 0}</strong></div></div>
        <div className="stat-card"><span className="stat-icon violet"><MapPin size={19} /></span><div><small>현재 페이지 조회수</small><strong>{stores.reduce((sum, item) => sum + Number(item.totalTagCount || 0), 0).toLocaleString()}</strong></div></div>
      </div>
      <section className="panel">
        <div className="toolbar">
          <div className="store-search-tools">
            <button className="button ghost" type="button" onClick={resetSearch}><RotateCcw size={15} /> 리셋</button>
            <form className="search-box" onSubmit={(event) => { event.preventDefault(); updateParams({ page: 1, searchText: keyword }) }}>
              <Search size={17} /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="매장명, ID, 설명으로 검색" />
              <button type="submit">검색</button>
            </form>
          </div>
          <button className="button danger ghost" type="button" disabled={!selected.length} onClick={remove}><Trash2 size={16} /> 선택 삭제 {selected.length > 0 && `(${selected.length})`}</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th className="check-cell"><input type="checkbox" checked={allSelected} onChange={(e) => toggleAll(e.target.checked)} /></th><th>매장명</th><th>업종</th><th>주소</th><th>총 조회수</th><th>연결 URL</th><th /></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="7" className="empty">매장 정보를 불러오는 중입니다.</td></tr>
                : stores.length === 0 ? <tr><td colSpan="7" className="empty">등록된 매장이 없습니다.</td></tr>
                  : stores.map((item) => (
                    <tr key={item.id}>
                      <td className="check-cell"><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleOne(item.id)} /></td>
                      <td><strong>{item.name}</strong><small className="cell-sub">{item.id}</small></td>
                      <td><span className="badge neutral">{item.category}</span></td>
                      <td>{item.address}<small className="cell-sub">{item.detailAddress}</small></td>
                      <td><span className="badge blue">{Number(item.totalTagCount || 0).toLocaleString()}회</span></td>
                      <td><a className="url-cell" href={item.redirectUrl} target="_blank" rel="noreferrer">{item.redirectUrl}</a></td>
                      <td><button className="icon-button" type="button" onClick={() => openForm(item)} aria-label="수정"><Pencil size={16} /></button></td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        <Pagination data={data} onChange={(nextPage) => updateParams({ page: nextPage })} />
      </section>
      {modalOpen && (
        <Modal title={editing ? '매장 정보 수정' : '새 매장 등록'} description="매장의 기본 정보와 태그 연결 목적지를 입력하세요." onClose={() => setModalOpen(false)}
          actions={<><button className="button ghost" type="button" onClick={() => setModalOpen(false)}>취소</button><button className="button primary" type="submit" form="store-form" disabled={saving}>{saving ? '저장 중...' : '저장'}</button></>}>
          <form id="store-form" className="form-grid" onSubmit={submit}>
            <label>업종<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>매장명<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="매장명을 입력하세요" /></label>
            <label className="full">주소<input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="기본 주소" /></label>
            <label className="full">상세 주소<input value={form.detailAddress} onChange={(e) => setForm({ ...form, detailAddress: e.target.value })} placeholder="층, 호수 등" /></label>
            <label className="full">연결 URL<input type="url" value={form.redirectUrl} onChange={(e) => setForm({ ...form, redirectUrl: e.target.value })} placeholder="https://example.com" disabled={Boolean(editing)} /></label>
            <label className="full">설명<textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="매장에 대한 메모" /></label>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default StorePage
