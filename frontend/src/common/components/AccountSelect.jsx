import { ChevronDown, Search, UserRound } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { searchAdminAccounts } from '../../api/admin/adminApi'

const PAGE_SIZE = 20

function AccountSelect({
  value = '',
  onChange,
  label = '',
  allLabel = '전체 등록자',
  role = 'NORMAL',
}) {
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [accounts, setAccounts] = useState([])
  const [page, setPage] = useState(1)
  const [totalPage, setTotalPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const containerRef = useRef(null)
  const requestId = useRef(0)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword.trim()), 500)
    return () => clearTimeout(timer)
  }, [keyword])

  useEffect(() => {
    if (!value) {
      setSelectedAccount(null)
      return
    }
    if (selectedAccount && String(selectedAccount.id) === String(value)) return
    const found = accounts.find((account) => String(account.id) === String(value))
    if (found) setSelectedAccount(found)
  }, [value, accounts, selectedAccount])

  const loadAccounts = useCallback(async (nextPage, { replace }) => {
    const id = ++requestId.current
    setLoading(true)
    try {
      const pageData = await searchAdminAccounts({
        page: nextPage,
        size: PAGE_SIZE,
        searchText: debouncedKeyword,
        role,
      })
      if (id !== requestId.current) return
      const list = pageData?.dtoList ?? []
      setAccounts((prev) => (replace ? list : [...prev, ...list]))
      setPage(pageData?.current ?? nextPage)
      setTotalPage(pageData?.totalPage ?? 1)
    } catch {
      if (id !== requestId.current) return
      if (replace) setAccounts([])
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [debouncedKeyword, role])

  useEffect(() => {
    if (!open) return
    setAccounts([])
    setPage(1)
    setTotalPage(1)
    loadAccounts(1, { replace: true })
  }, [open, debouncedKeyword, loadAccounts])

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  const hasMore = page < totalPage
  const selectedLabel = !value
    ? allLabel
    : selectedAccount
      ? `${selectedAccount.name} (${selectedAccount.loginId})`
      : `계정 #${value}`

  const onOptionsScroll = (event) => {
    const el = event.currentTarget
    if (!hasMore || loading) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      loadAccounts(page + 1, { replace: false })
    }
  }

  return (
    <div className="account-select" ref={containerRef}>
      {label ? <span className="filter-label">{label}</span> : null}
      <button
        className={`account-select-trigger${open ? ' open' : ''}`}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={label || '등록자 선택'}
      >
        <UserRound size={15} />
        <span>{selectedLabel}</span>
        <ChevronDown size={15} />
      </button>

      {open && (
        <div className="account-select-panel">
          <div className="account-select-search">
            <Search size={15} />
            <input
              autoFocus
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="아이디·이름·연락처 검색"
            />
          </div>
          <div className="account-select-options" onScroll={onOptionsScroll}>
            <button
              type="button"
              className={!value ? 'selected' : ''}
              onClick={() => {
                setSelectedAccount(null)
                onChange('')
                setOpen(false)
                setKeyword('')
              }}
            >
              <span>{allLabel}</span>
            </button>
            {accounts.map((account) => {
              const active = String(value) === String(account.id)
              return (
                <button
                  type="button"
                  key={account.id}
                  className={active ? 'selected' : ''}
                  onClick={() => {
                    setSelectedAccount(account)
                    onChange(String(account.id))
                    setOpen(false)
                    setKeyword('')
                  }}
                >
                  <span>
                    {account.name} ({account.loginId})
                    {account.role === 'MASTER' ? ' · MASTER' : ''}
                  </span>
                  <small>{account.phone || account.email || ''}</small>
                </button>
              )
            })}
            {accounts.length === 0 && !loading && <p>검색 결과가 없습니다.</p>}
            {loading && <p>불러오는 중...</p>}
            {!loading && hasMore && <p>아래로 스크롤하면 더 불러옵니다</p>}
          </div>
        </div>
      )}
    </div>
  )
}

export default AccountSelect
