import { ChevronDown, Search, Store } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getStoreSelectById, searchStoreSelectList } from '../../api/store/storeApi'

const PAGE_SIZE = 20

function StoreSelect({
  value,
  onChange,
  showRegistrant = false,
  onSelectedStoreChange,
}) {
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [stores, setStores] = useState([])
  const [page, setPage] = useState(1)
  const [totalPage, setTotalPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selectedStore, setSelectedStore] = useState(null)
  const containerRef = useRef(null)
  const requestId = useRef(0)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword.trim()), 500)
    return () => clearTimeout(timer)
  }, [keyword])

  useEffect(() => {
    if (!value) {
      setSelectedStore(null)
      onSelectedStoreChange?.(null)
      return
    }
    if (selectedStore?.id === value) return

    const fromList = stores.find((store) => store.id === value)
    if (fromList) {
      setSelectedStore(fromList)
      onSelectedStoreChange?.(fromList)
      return
    }

    getStoreSelectById(value)
      .then((store) => {
        setSelectedStore(store)
        onSelectedStoreChange?.(store)
      })
      .catch(() => {
        setSelectedStore({ id: value, name: value })
        onSelectedStoreChange?.(null)
      })
  }, [value, stores, selectedStore?.id, onSelectedStoreChange])

  const loadStores = useCallback(async (nextPage, { replace }) => {
    const id = ++requestId.current
    setLoading(true)
    try {
      const pageData = await searchStoreSelectList({
        page: nextPage,
        size: PAGE_SIZE,
        searchText: debouncedKeyword,
      })
      if (id !== requestId.current) return
      const list = pageData?.dtoList ?? []
      setStores((prev) => (replace ? list : [...prev, ...list]))
      setPage(pageData?.current ?? nextPage)
      setTotalPage(pageData?.totalPage ?? 1)
    } catch {
      if (id !== requestId.current) return
      if (replace) setStores([])
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [debouncedKeyword])

  useEffect(() => {
    if (!open) return
    setStores([])
    setPage(1)
    setTotalPage(1)
    loadStores(1, { replace: true })
  }, [open, debouncedKeyword, loadStores])

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  const hasMore = page < totalPage

  const onOptionsScroll = (event) => {
    const el = event.currentTarget
    if (!hasMore || loading) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      loadStores(page + 1, { replace: false })
    }
  }

  const registrantLabel = (store) => {
    if (!showRegistrant || !store?.registeredByName) return null
    return store.registeredByName
  }

  return (
    <div className="store-select" ref={containerRef}>
      <span className="filter-label">매장 선택</span>
      <button
        className={`store-select-trigger${open ? ' open' : ''}`}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <Store size={15} />
        <span>
          {selectedStore ? (
            <>
              <strong>
                {selectedStore.name}
                {registrantLabel(selectedStore) && (
                  <em className="store-registrant-inline"> ({registrantLabel(selectedStore)})</em>
                )}
              </strong>
              <small>{selectedStore.id}</small>
            </>
          ) : '매장을 선택하세요'}
        </span>
        <ChevronDown size={15} />
      </button>

      {open && (
        <div className="store-select-panel">
          <div className="store-select-search">
            <Search size={15} />
            <input
              autoFocus
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={showRegistrant ? '매장명, 등록자, ID 검색' : '매장명 또는 ID 검색'}
            />
          </div>
          <div className="store-select-options" onScroll={onOptionsScroll}>
            {stores.length === 0 && !loading ? (
              <p>검색 결과가 없습니다.</p>
            ) : (
              stores.map((store) => (
                <button
                  type="button"
                  key={store.id}
                  className={store.id === value ? 'selected' : ''}
                  onClick={() => {
                    setSelectedStore(store)
                    onSelectedStoreChange?.(store)
                    onChange(store.id)
                    setOpen(false)
                    setKeyword('')
                  }}
                >
                  <span>
                    {store.name}
                    {registrantLabel(store) && (
                      <em className="store-registrant-inline"> ({registrantLabel(store)})</em>
                    )}
                  </span>
                  <small>{store.id}</small>
                </button>
              ))
            )}
            {loading && <p>불러오는 중...</p>}
            {!loading && hasMore && <p>아래로 스크롤하면 더 불러옵니다</p>}
          </div>
        </div>
      )}
    </div>
  )
}

export default StoreSelect
