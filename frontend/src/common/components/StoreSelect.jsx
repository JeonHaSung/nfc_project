import { ChevronDown, Search, Store } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

function StoreSelect({ stores, value, onChange }) {
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const containerRef = useRef(null)
  const selectedStore = stores.find((store) => store.id === value)

  const filteredStores = useMemo(() => {
    const query = keyword.trim().toLowerCase()
    if (!query) return stores
    return stores.filter((store) =>
      `${store.name} ${store.id}`.toLowerCase().includes(query),
    )
  }, [keyword, stores])

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

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
            <><strong>{selectedStore.name}</strong><small>{selectedStore.id}</small></>
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
              placeholder="매장명 또는 ID 검색"
            />
          </div>
          <div className="store-select-options">
            {filteredStores.length === 0 ? (
              <p>검색 결과가 없습니다.</p>
            ) : filteredStores.map((store) => (
              <button
                type="button"
                key={store.id}
                className={store.id === value ? 'selected' : ''}
                onClick={() => {
                  onChange(store.id)
                  setOpen(false)
                  setKeyword('')
                }}
              >
                <span>{store.name}</span>
                <small>{store.id}</small>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default StoreSelect
