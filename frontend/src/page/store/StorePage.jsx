import { useCallback, useEffect, useRef, useState } from 'react'
import { CreditCard, Hash, Pencil, RotateCcw, Search, Store, Trash2, Wifi } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { deleteStores, getStoreForEdit, getStores, updateStore } from '../../api/store/storeApi'
import { useAuth } from '../../auth/AuthContext'
import AccountSelect from '../../common/components/AccountSelect'
import CardTypeBadge from '../../common/components/CardTypeBadge'
import Modal from '../../common/components/Modal'
import Pagination from '../../common/components/Pagination'
import ReviewKeywordModal from './ReviewKeywordModal'
import StoreEventModal, { isStoreEventLive } from './StoreEventModal'
import WifiModal from './WifiModal'

const categories = ['카페', '음식점', 'PC방', '주점/펍', '뷰티/미용', '기타']
const emptyForm = { category: '카페', name: '', description: '' }
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
const sortOptions = [
  { value: 'CREATED', label: '최신 등록순' },
  { value: 'HIT_COUNT', label: '태그 수 높은 순' },
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
  const [keywordStore, setKeywordStore] = useState(null)
  const [eventStore, setEventStore] = useState(null)
  const [wifiStore, setWifiStore] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const requestId = useRef(0)
  const registeredById = searchParams.get('registeredById') ?? ''
  const experienceType = searchParams.get('experienceType') ?? 'ALL'
  const sort = searchParams.get('sort') === 'HIT_COUNT' ? 'HIT_COUNT' : 'CREATED'
  const liveEventOnly = searchParams.get('liveEventOnly') === '1'
  const page = Math.max(1, Number(searchParams.get('page') || 1) || 1)
  const totalCount = data?.totalCount ?? 0
  const colCount = isMaster ? 9 : 7

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword.trim()), 500)
    return () => clearTimeout(timer)
  }, [keyword])

  const buildParams = ({
    searchText = debouncedKeyword,
    registeredById: nextRegisteredById = registeredById,
    experienceType: nextExperienceType = experienceType,
    sort: nextSort = sort,
    liveEventOnly: nextLiveEventOnly = liveEventOnly,
    page: nextPage = 1,
  } = {}) => {
    const nextParams = new URLSearchParams()
    if (searchText) nextParams.set('searchText', searchText)
    if (nextRegisteredById) nextParams.set('registeredById', nextRegisteredById)
    if (nextExperienceType && nextExperienceType !== 'ALL') {
      nextParams.set('experienceType', nextExperienceType)
    }
    if (nextSort && nextSort !== 'CREATED') nextParams.set('sort', nextSort)
    if (nextLiveEventOnly) nextParams.set('liveEventOnly', '1')
    if (nextPage > 1) nextParams.set('page', String(nextPage))
    return nextParams
  }

  // 검색어 디바운스 반영 시 1페이지로 URL 동기화
  useEffect(() => {
    const current = searchParams.get('searchText') ?? ''
    if (current === debouncedKeyword) return
    setSearchParams(buildParams({
      searchText: debouncedKeyword,
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
        sort: sort === 'HIT_COUNT' ? 'HIT_COUNT' : undefined,
        liveEventOnly: liveEventOnly || undefined,
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
  }, [debouncedKeyword, registeredById, experienceType, sort, liveEventOnly, isMaster, page])

  useEffect(() => {
    loadStores()
  }, [loadStores])

  const openEdit = async (storeData) => {
    setEditing(storeData)
    setForm({
      category: storeData.category || '기타',
      name: storeData.name || '',
      description: storeData.description || '',
    })
    setModalOpen(true)
    try {
      const response = await getStoreForEdit(storeData.id)
      const detail = response.data ?? {}
      setForm({
        category: detail.category || storeData.category || '기타',
        name: detail.name || storeData.name || '',
        description: detail.description || '',
      })
    } catch (error) {
      setMessage({ type: 'error', text: error.message || '매장 정보를 불러오지 못했습니다.' })
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!form.name.trim()) {
      setMessage({ type: 'error', text: '매장명을 입력해 주세요.' })
      return
    }
    setSaving(true)
    try {
      // wifi 필드는 null로 보내 기존 값 유지 (와이파이는 별도 모달)
      await updateStore({
        id: editing.id,
        category: form.category,
        name: form.name,
        description: form.description,
        wifiName: null,
        wifiPassword: null,
      })
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
    <div className="page store-page">
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
        <div className="toolbar store-toolbar">
          <div className="store-toolbar-search">
            <div className="search-box">
              <Search size={16} />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="매장명, 등록자, ID 검색"
              />
            </div>
          </div>

          <div className="store-toolbar-filters">
            <div className="store-toolbar-row">
              <div className="segmented store-type-segmented" role="group" aria-label="카드 타입">
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
            </div>

            <div className="store-toolbar-row store-toolbar-controls">
              <select
                className="store-sort-select"
                value={sort}
                onChange={(event) => setSearchParams(buildParams({ sort: event.target.value, page: 1 }))}
                aria-label="정렬"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <button
                type="button"
                className={`store-live-filter${liveEventOnly ? ' active' : ''}`}
                onClick={() => setSearchParams(buildParams({ liveEventOnly: !liveEventOnly, page: 1 }))}
                aria-pressed={liveEventOnly}
                title="이벤트 진행중인 매장"
              >
                <span className="store-live-dot" aria-hidden="true" />
                이벤트 진행중인 매장
              </button>
              {isMaster && (
                <div className="store-toolbar-account">
                  <AccountSelect
                    value={registeredById}
                    onChange={(nextId) => setSearchParams(buildParams({ registeredById: nextId, page: 1 }))}
                    role="ALL"
                  />
                </div>
              )}
              <button
                className="button ghost store-toolbar-reset"
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
        </div>

        <div className="table-wrap store-table-wrap">
          <table className="store-table">
            <thead>
              <tr>
                {isMaster && (
                  <th className="col-check">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(event) => toggleAll(event.target.checked)}
                      aria-label="전체선택"
                    />
                  </th>
                )}
                <th className="col-store">매장</th>
                {isMaster && <th className="col-owner">등록자</th>}
                <th className="col-type">타입</th>
                <th className="col-num">카드</th>
                <th className="col-num">태그 수</th>
                <th className="col-keyword">키워드</th>
                <th className="col-event">이벤트</th>
                <th className="col-manage">관리</th>
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
                      <td className="col-check">
                        <input
                          type="checkbox"
                          checked={selected.includes(store.id)}
                          onChange={() => toggleOne(store.id)}
                        />
                      </td>
                    )}
                    <td className="col-store">
                      <strong className="cell-title"><Store size={14} /> {store.name}</strong>
                      <div className="muted">{store.id} · {store.category || '기타'}</div>
                    </td>
                    {isMaster && (
                      <td className="col-owner">
                        <div>{store.registeredByName || '-'}</div>
                        <div className="muted registrant-meta">
                          {store.registeredByPhone || '-'}
                          {store.registeredByLoginId ? ` · ${store.registeredByLoginId}` : ''}
                        </div>
                      </td>
                    )}
                    <td className="col-type">
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
                    <td className="col-num">{(store.cardCount ?? 0).toLocaleString()}</td>
                    <td className="col-num">
                      <span className="store-hit-pill">{(store.totalHitCount ?? 0).toLocaleString()}회</span>
                    </td>
                    <td className="col-keyword">
                      <button
                        className="button ghost compact store-tool-btn"
                        type="button"
                        onClick={() => setKeywordStore(store)}
                      >
                        <Hash size={14} />
                        키워드
                      </button>
                    </td>
                    <td className="col-event">
                      <button
                        type="button"
                        className={`store-event-btn${store.hasLiveEvent ? ' live' : ''}`}
                        onClick={() => setEventStore(store)}
                        aria-label={`${store.name} 이벤트 목록`}
                      >
                        <span className="store-event-btn-status" aria-hidden="true">
                          {store.hasLiveEvent ? (
                            <span className="store-event-btn-count">{store.liveEventCount || 1}</span>
                          ) : null}
                        </span>
                        <span className="store-event-btn-label">이벤트</span>
                      </button>
                    </td>
                    <td className="col-manage">
                      <div className="store-tool-group">
                        <button
                          className="button ghost compact store-tool-btn"
                          type="button"
                          onClick={() => setWifiStore(store)}
                        >
                          <Wifi size={14} />
                          와이파이
                        </button>
                        <Link
                          className="button ghost compact store-tool-btn"
                          to={`/admin/management/stores/${store.id}/cards`}
                        >
                          <CreditCard size={14} />
                          카드
                        </Link>
                        {isMaster && (
                          <button
                            className="button ghost compact store-tool-btn"
                            type="button"
                            onClick={() => openEdit(store)}
                          >
                            <Pencil size={14} />
                            수정
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
              메모
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} />
            </label>
          </form>
        </Modal>
      )}

      {wifiStore && (
        <WifiModal
          store={wifiStore}
          onClose={() => setWifiStore(null)}
        />
      )}

      {keywordStore && (
        <ReviewKeywordModal store={keywordStore} onClose={() => setKeywordStore(null)} />
      )}

      {eventStore && (
        <StoreEventModal
          store={eventStore}
          onClose={() => setEventStore(null)}
          onChanged={(events) => {
            const liveCount = (events || []).filter((item) => isStoreEventLive(item)).length
            setStores((prev) => prev.map((item) => (
              item.id === eventStore.id
                ? { ...item, hasLiveEvent: liveCount > 0, liveEventCount: liveCount }
                : item
            )))
          }}
        />
      )}
    </div>
  )
}

export default StorePage
