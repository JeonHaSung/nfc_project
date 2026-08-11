import { useCallback, useEffect, useRef, useState } from 'react'
import { CreditCard, ExternalLink, Pencil, RotateCcw, Search, Store, Trash2 } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { deleteStores, getStores, updateStore } from '../../api/store/storeApi'
import { useAuth } from '../../auth/AuthContext'
import AccountSelect from '../../common/components/AccountSelect'
import CardTypeBadge from '../../common/components/CardTypeBadge'
import Modal from '../../common/components/Modal'
import Pagination from '../../common/components/Pagination'

const categories = ['카페', '음식점', 'PC방', '주점/펍', '뷰티/미용', '기타']
const emptyForm = { category: '카페', name: '', description: '', redirectUrl: '' }
const PAGE_SIZE = 20
const typeLabels = {
  STANDARD: '스탠다드',
  PREMIUM: '프리미엄',
}
const experienceFilters = [
  { value: 'ALL', label: '전체 타입' },
  { value: 'STANDARD', label: '스탠다드' },
  { value: 'PREMIUM', label: '프리미엄' },
]

const formatTypeLabel = (value) => {
  const key = String(value || '').trim().toUpperCase()
  return typeLabels[key] || key || '-'
}

function StorePage() {
  const { user } = useAuth()
  const isMaster = user?.role === 'MASTER'
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState(null)
  const [stores, setStores] = useState([])
  const [keyword, setKeyword] = useState(searchParams.get('searchText') ?? '')
  const [debouncedKeyword, setDebouncedKeyword] = useState(searchParams.get('searchText') ?? '')
  const [selected, setSelected] = useState([])
  const [editing, setEditing] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const requestId = useRef(0)
  const registeredById = searchParams.get('registeredById') ?? ''
  const experienceType = searchParams.get('experienceType') ?? 'ALL'
  const page = Math.max(1, Number(searchParams.get('page') || 1) || 1)
  const totalCount = data?.totalCount ?? 0
  const colCount = isMaster ? 8 : 6

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword.trim()), 500)
    return () => clearTimeout(timer)
  }, [keyword])

  const buildParams = ({
    searchText = debouncedKeyword,
    registeredById: nextRegisteredById = registeredById,
    experienceType: nextExperienceType = experienceType,
    page: nextPage = 1,
  } = {}) => {
    const nextParams = new URLSearchParams()
    if (searchText) nextParams.set('searchText', searchText)
    if (nextRegisteredById) nextParams.set('registeredById', nextRegisteredById)
    if (nextExperienceType && nextExperienceType !== 'ALL') {
      nextParams.set('experienceType', nextExperienceType)
    }
    if (nextPage > 1) nextParams.set('page', String(nextPage))
    return nextParams
  }

  // 검색어 디바운스 반영 시 1페이지로 URL 동기화
  useEffect(() => {
    const current = searchParams.get('searchText') ?? ''
    if (current === debouncedKeyword) return
    setSearchParams(buildParams({
      searchText: debouncedKeyword,
      registeredById,
      experienceType,
      page: 1,
    }), { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyword debounce only
  }, [debouncedKeyword])

  const loadStores = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    try {
      const params = {
        page,
        size: PAGE_SIZE,
        searchText: debouncedKeyword,
        experienceType: experienceType === 'ALL' ? undefined : experienceType,
      }
      if (isMaster && registeredById) params.registeredById = registeredById
      const response = await getStores(params)
      if (id !== requestId.current) return
      const pageData = response.data
      setData(pageData ?? null)
      setStores(pageData?.dtoList ?? [])
      setSelected([])
    } catch (error) {
      if (id !== requestId.current) return
      setMessage({ type: 'error', text: error.message })
      setData(null)
      setStores([])
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [debouncedKeyword, registeredById, experienceType, isMaster, page])

  useEffect(() => {
    loadStores()
  }, [loadStores])

  const openEdit = (storeData) => {
    setEditing(storeData)
    setForm({
      category: storeData.category || '기타',
      name: storeData.name || '',
      description: storeData.description || '',
      redirectUrl: storeData.redirectUrl || '',
    })
    setModalOpen(true)
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!form.name.trim() || !form.redirectUrl.trim()) {
      setMessage({ type: 'error', text: '매장명과 리다이렉트 URL을 입력해 주세요.' })
      return
    }
    setSaving(true)
    try {
      await updateStore({ ...form, id: editing.id })
      setMessage({ type: 'success', text: '매장이 수정되었습니다.' })
      setModalOpen(false)
      await loadStores()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!selected.length || !window.confirm(`${selected.length}개 매장을 삭제할까요? 연결된 카드도 함께 삭제됩니다.`)) return
    try {
      await deleteStores(selected)
      setMessage({ type: 'success', text: '선택한 매장이 삭제되었습니다.' })
      if (page > 1 && stores.length === selected.length) {
        setSearchParams(buildParams({ page: page - 1 }))
      } else {
        await loadStores()
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  const allSelected = stores.length > 0 && stores.every((item) => selected.includes(item.id))
  const toggleAll = (checked) => setSelected(checked ? stores.map((item) => item.id) : [])
  const toggleOne = (id) => setSelected((prev) => (
    prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
  ))

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">STORES</span>
          <h1>매장조회</h1>
          <p>등록된 매장과 소속 카드를 조회합니다. 신규 등록은 태그 첫 사용 시 진행됩니다.</p>
        </div>
        <div className="page-heading-actions">
          <span className="row-count-badge">총 {totalCount.toLocaleString()}개</span>
          {isMaster && (
            <button className="button danger" type="button" disabled={!selected.length} onClick={remove}>
              <Trash2 size={16} /> 선택 삭제
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
        <div className="toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="매장명, 등록자, ID 검색"
            />
          </div>
          <div className="store-search-tools">
            <div className="segmented">
              {experienceFilters.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  className={experienceType === type.value ? 'active' : ''}
                  onClick={() => setSearchParams(buildParams({ experienceType: type.value, page: 1 }))}
                >
                  {type.label}
                </button>
              ))}
            </div>
            {isMaster && (
              <AccountSelect
                value={registeredById}
                onChange={(nextId) => setSearchParams(buildParams({ registeredById: nextId, page: 1 }))}
              />
            )}
            <button
              className="button ghost"
              type="button"
              onClick={() => {
                setKeyword('')
                setDebouncedKeyword('')
                setSearchParams({})
              }}
            >
              <RotateCcw size={15} /> 초기화
            </button>
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
                <th>매장</th>
                {isMaster && <th>등록자</th>}
                <th>카드 타입</th>
                <th>태그 수</th>
                <th>조회수</th>
                <th>리다이렉트</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={colCount} className="empty">불러오는 중...</td></tr>
              ) : stores.length === 0 ? (
                <tr><td colSpan={colCount} className="empty">등록된 매장이 없습니다.</td></tr>
              ) : stores.map((store) => {
                const types = store.experienceTypes ?? []
                const representative = store.representativeExperienceType
                  || (types.length === 1 ? types[0] : null)
                const hoverText = types.length > 0
                  ? `보유 타입: ${types.map(formatTypeLabel).join(', ')}`
                  : '등록된 카드 없음'
                return (
                  <tr key={store.id}>
                    {isMaster && (
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.includes(store.id)}
                          onChange={() => toggleOne(store.id)}
                        />
                      </td>
                    )}
                    <td>
                      <strong className="cell-title"><Store size={14} /> {store.name}</strong>
                      <div className="muted">{store.id} · {store.category || '기타'}</div>
                    </td>
                    {isMaster && (
                      <td>
                        <div>{store.registeredByName || '-'}</div>
                        <div className="muted registrant-meta">
                          {store.registeredByPhone || '-'}
                          {store.registeredByLoginId ? ` · ${store.registeredByLoginId}` : ''}
                        </div>
                      </td>
                    )}
                    <td>
                      {representative ? (
                        <span className="store-type-cell" title={hoverText}>
                          <CardTypeBadge value={representative} />
                          {types.length > 1 && (
                            <small className="store-type-more">+{types.length - 1}</small>
                          )}
                        </span>
                      ) : (
                        <span className="muted" title={hoverText}>-</span>
                      )}
                    </td>
                    <td>{store.cardCount ?? 0}</td>
                    <td>{store.totalHitCount ?? 0}</td>
                    <td>
                      {store.redirectUrl ? (
                        <div className="url-actions">
                          <span className="url-cell" title={store.redirectUrl}>{store.redirectUrl}</span>
                          <a
                            className="icon-button"
                            href={store.redirectUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="리다이렉트 열기"
                            title="리다이렉트 열기"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      ) : (
                        <span className="muted">-</span>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        <Link className="button ghost compact" to={`/admin/management/stores/${store.id}/cards`}>
                          <CreditCard size={15} /> 소속카드
                        </Link>
                        {isMaster && (
                          <button className="button ghost compact" type="button" onClick={() => openEdit(store)}>
                            <Pencil size={15} /> 수정
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <Pagination
          data={data}
          onChange={(nextPage) => setSearchParams(buildParams({ page: nextPage }))}
        />
      </section>

      {modalOpen && (
        <Modal
          title="매장 수정"
          description="MASTER만 매장 정보를 수정할 수 있습니다."
          onClose={() => setModalOpen(false)}
          actions={(
            <>
              <button className="button ghost" type="button" onClick={() => setModalOpen(false)}>취소</button>
              <button className="button primary" type="submit" form="store-edit-form" disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </>
          )}
        >
          <form id="store-edit-form" className="form-grid" onSubmit={submit}>
            <label>
              카테고리
              <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label>
              매장명
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </label>
            <label className="full">
              리다이렉트 URL
              <input value={form.redirectUrl} onChange={(event) => setForm({ ...form, redirectUrl: event.target.value })} required />
            </label>
            <label className="full">
              메모
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} />
            </label>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default StorePage
