import { useCallback, useEffect, useState } from 'react'
import { CreditCard, ExternalLink, Pencil, RotateCcw, Search, Store, Trash2 } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { getAdminAccounts } from '../../api/admin/adminApi'
import { deleteStores, getStores, updateStore } from '../../api/store/storeApi'
import { useAuth } from '../../auth/AuthContext'
import Modal from '../../common/components/Modal'
import Pagination from '../../common/components/Pagination'

const categories = ['카페', '음식점', 'PC방', '주점/펍', '뷰티/미용', '기타']
const emptyForm = { category: '카페', name: '', description: '', redirectUrl: '' }

function StorePage() {
  const { user } = useAuth()
  const isMaster = user?.role === 'MASTER'
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState(null)
  const [users, setUsers] = useState([])
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
  const registeredById = searchParams.get('registeredById') ?? ''
  const colCount = isMaster ? 7 : 5

  const updateParams = ({
    page: nextPage = page,
    searchText: nextSearchText = searchText,
    registeredById: nextRegisteredById = registeredById,
  }) => {
    const nextParams = new URLSearchParams()
    if (nextPage > 1) nextParams.set('page', String(nextPage))
    if (nextSearchText.trim()) nextParams.set('searchText', nextSearchText.trim())
    if (nextRegisteredById) nextParams.set('registeredById', String(nextRegisteredById))
    setSearchParams(nextParams)
  }

  const loadStores = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, size: 10, searchText }
      if (isMaster && registeredById) params.registeredById = registeredById
      const response = await getStores(params)
      setData(response.data)
      setSelected([])
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }, [page, searchText, registeredById, isMaster])

  useEffect(() => { loadStores() }, [loadStores])
  useEffect(() => { setKeyword(searchText) }, [searchText])

  useEffect(() => {
    if (!isMaster) return
    getAdminAccounts()
      .then((accounts) => setUsers(accounts ?? []))
      .catch(() => setUsers([]))
  }, [isMaster])

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
      await loadStores()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  const stores = data?.dtoList ?? []
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
        {isMaster && (
          <button className="button danger" type="button" disabled={!selected.length} onClick={remove}>
            <Trash2 size={16} /> 선택 삭제
          </button>
        )}
      </div>

      {message && (
        <div className={`notice ${message.type}`} role="alert" onClick={() => setMessage(null)}>
          {message.text}
        </div>
      )}

      <section className="panel">
        <div className="toolbar">
          <form
            className="search-box"
            onSubmit={(event) => {
              event.preventDefault()
              updateParams({ page: 1, searchText: keyword })
            }}
          >
            <Search size={16} />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="매장명, 등록자, ID 검색"
            />
            <button type="submit">검색</button>
          </form>
          <div className="store-search-tools">
            {isMaster && (
              <label className="filter-group">
                <span>등록자</span>
                <select
                  value={registeredById}
                  onChange={(event) => updateParams({ page: 1, registeredById: event.target.value })}
                >
                  <option value="">전체</option>
                  {users.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.loginId})
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button className="button ghost" type="button" onClick={() => { setKeyword(''); setSearchParams({}) }}>
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
              ) : stores.map((store) => (
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
              ))}
            </tbody>
          </table>
        </div>
        <Pagination data={data} onChange={(nextPage) => updateParams({ page: nextPage })} />
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
