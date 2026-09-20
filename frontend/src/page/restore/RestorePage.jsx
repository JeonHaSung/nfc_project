import { useCallback, useEffect, useState } from 'react'
import { RotateCcw, Store, Trash2, UserRound } from 'lucide-react'
import { getAdminAccounts } from '../../api/admin/adminApi'
import { getRestoreStores, getRestoreTags, getStorePurgeLogs, purgeStore, restoreStore, restoreTag } from '../../api/restore/restoreApi'
import CardTypeBadge from '../../common/components/CardTypeBadge'
import Modal from '../../common/components/Modal'

function RestorePage() {
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [stores, setStores] = useState([])
  const [selectedStoreId, setSelectedStoreId] = useState('')
  const [tags, setTags] = useState([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [loadingStores, setLoadingStores] = useState(false)
  const [loadingTags, setLoadingTags] = useState(false)
  const [busyKey, setBusyKey] = useState('')
  const [message, setMessage] = useState(null)
  const [purgeStoreTarget, setPurgeStoreTarget] = useState(null)
  const [purgeReason, setPurgeReason] = useState('')
  const [purgeConfirm, setPurgeConfirm] = useState('')
  const [purgeLogs, setPurgeLogs] = useState([])
  const [loadingPurgeLogs, setLoadingPurgeLogs] = useState(true)

  const loadPurgeLogs = useCallback(async () => {
    setLoadingPurgeLogs(true)
    try {
      const response = await getStorePurgeLogs()
      setPurgeLogs(response.data ?? [])
    } catch (error) {
      setPurgeLogs([])
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoadingPurgeLogs(false)
    }
  }, [])

  useEffect(() => {
    setLoadingAccounts(true)
    getAdminAccounts()
      .then((list) => setAccounts(list ?? []))
      .catch((error) => setMessage({ type: 'error', text: error.message }))
      .finally(() => setLoadingAccounts(false))
    loadPurgeLogs()
  }, [loadPurgeLogs])

  const loadStores = useCallback(async (account) => {
    if (!account?.id) return
    setLoadingStores(true)
    setSelectedStoreId('')
    setTags([])
    try {
      const response = await getRestoreStores(account.id)
      setStores(response.data ?? [])
    } catch (error) {
      setStores([])
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoadingStores(false)
    }
  }, [])

  const loadTags = useCallback(async (storeId) => {
    setLoadingTags(true)
    try {
      const response = await getRestoreTags(storeId)
      setTags(response.data ?? [])
    } catch (error) {
      setTags([])
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoadingTags(false)
    }
  }, [])

  const selectAccount = async (account) => {
    setSelectedAccount(account)
    await loadStores(account)
  }

  const selectStore = async (store) => {
    if (store.deleted) return
    setSelectedStoreId(store.id)
    await loadTags(store.id)
  }

  const onRestoreStore = async (event, store) => {
    event.stopPropagation()
    if (!window.confirm(`${store.name} 매장을 복원할까요?`)) return
    setBusyKey(`store-${store.id}`)
    try {
      await restoreStore(store.id)
      setMessage({ type: 'success', text: '매장을 복원했습니다. 소속카드는 따로 복원하세요.' })
      await loadStores(selectedAccount)
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setBusyKey('')
    }
  }

  const openPurgeModal = (event, store) => {
    event.stopPropagation()
    setPurgeStoreTarget(store)
    setPurgeReason('')
    setPurgeConfirm('')
  }

  const closePurgeModal = () => {
    if (busyKey.startsWith('purge-')) return
    setPurgeStoreTarget(null)
    setPurgeReason('')
    setPurgeConfirm('')
  }

  const onPurgeStore = async () => {
    if (!purgeStoreTarget) return
    if (!purgeReason.trim() || purgeConfirm.trim() !== '동의') return
    setBusyKey(`purge-${purgeStoreTarget.id}`)
    try {
      await purgeStore(purgeStoreTarget.id, {
        reason: purgeReason.trim(),
        confirmation: purgeConfirm.trim(),
      })
      setMessage({ type: 'success', text: '매장을 영구 삭제했습니다.' })
      setPurgeStoreTarget(null)
      setPurgeReason('')
      setPurgeConfirm('')
      await Promise.all([
        selectedAccount ? loadStores(selectedAccount) : Promise.resolve(),
        loadPurgeLogs(),
      ])
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setBusyKey('')
    }
  }

  const onRestoreTag = async (tag) => {
    if (!window.confirm(`${tag.nickname || tag.id} 카드를 복원할까요? 리다이렉트도 함께 살아납니다.`)) return
    setBusyKey(`tag-${tag.id}`)
    try {
      await restoreTag(tag.id)
      setMessage({ type: 'success', text: '카드와 리다이렉트를 복원했습니다.' })
      if (selectedStoreId) await loadTags(selectedStoreId)
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setBusyKey('')
    }
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">RESTORE</span>
          <h1>복원</h1>
          <p>계정을 고르면 매장이 나옵니다. 삭제된 행만 복원할 수 있고, 살아있는 매장을 누르면 소속카드가 열립니다.</p>
        </div>
      </div>

      {message && (
        <div className={`notice ${message.type}`} role="alert" onClick={() => setMessage(null)}>
          {message.text}
        </div>
      )}

      <div className="restore-grid">
        <section className="panel">
          <div className="toolbar">
            <strong>계정</strong>
            <span className="muted">{accounts.length}명</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>이름</th>
                  <th>아이디</th>
                  <th>권한</th>
                </tr>
              </thead>
              <tbody>
                {loadingAccounts ? (
                  <tr><td colSpan={3} className="empty">불러오는 중...</td></tr>
                ) : accounts.length === 0 ? (
                  <tr><td colSpan={3} className="empty">계정이 없습니다.</td></tr>
                ) : accounts.map((account) => (
                  <tr
                    key={account.id}
                    className={selectedAccount?.id === account.id ? 'restore-row-active' : ''}
                    onClick={() => selectAccount(account)}
                  >
                    <td><strong className="cell-title"><UserRound size={14} /> {account.name}</strong></td>
                    <td>{account.loginId}</td>
                    <td>{account.role === 'MASTER' ? 'MASTER' : '일반'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="toolbar">
            <strong>매장</strong>
            <span className="muted">
              {selectedAccount ? `${selectedAccount.name} · ${stores.length}개` : '계정을 선택하세요'}
            </span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>매장</th>
                  <th>상태</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {!selectedAccount ? (
                  <tr><td colSpan={3} className="empty">왼쪽에서 계정을 선택하세요.</td></tr>
                ) : loadingStores ? (
                  <tr><td colSpan={3} className="empty">불러오는 중...</td></tr>
                ) : stores.length === 0 ? (
                  <tr><td colSpan={3} className="empty">매장이 없습니다.</td></tr>
                ) : stores.map((store) => (
                  <tr
                    key={store.id}
                    className={[
                      store.deleted ? 'restore-row-deleted' : '',
                      selectedStoreId === store.id ? 'restore-row-active' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => selectStore(store)}
                  >
                    <td>
                      <strong className="cell-title"><Store size={14} /> {store.name}</strong>
                      <div className="muted">{store.id} · {store.category || '기타'}</div>
                    </td>
                    <td>{store.deleted ? '삭제됨' : '사용중'}</td>
                    <td>
                      {store.deleted ? (
                        <div className="row-actions">
                          <button
                            className="button ghost compact"
                            type="button"
                            disabled={busyKey === `store-${store.id}` || busyKey === `purge-${store.id}`}
                            onClick={(event) => onRestoreStore(event, store)}
                          >
                            <RotateCcw size={14} /> 복원
                          </button>
                          <button
                            className="button danger compact"
                            type="button"
                            disabled={busyKey === `store-${store.id}` || busyKey === `purge-${store.id}`}
                            onClick={(event) => openPurgeModal(event, store)}
                          >
                            <Trash2 size={14} /> 영구삭제
                          </button>
                        </div>
                      ) : (
                        <span className="muted">선택하면 카드</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {selectedStoreId && (
        <section className="panel restore-cards-panel">
          <div className="toolbar">
            <strong>소속카드</strong>
            <span className="muted">{tags.length}개 · 삭제된 카드만 복원됩니다</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>카드 ID</th>
                  <th>별칭</th>
                  <th>시리즈</th>
                  <th>타입</th>
                  <th>상태</th>
                  <th>복원</th>
                </tr>
              </thead>
              <tbody>
                {loadingTags ? (
                  <tr><td colSpan={6} className="empty">불러오는 중...</td></tr>
                ) : tags.length === 0 ? (
                  <tr><td colSpan={6} className="empty">소속카드가 없습니다.</td></tr>
                ) : tags.map((tag) => (
                  <tr key={tag.id} className={tag.deleted ? 'restore-row-deleted' : ''}>
                    <td className="mono">{tag.id}</td>
                    <td>{tag.nickname || '-'}</td>
                    <td>{tag.category}</td>
                    <td><CardTypeBadge value={tag.experienceType} /></td>
                    <td>{tag.deleted ? '삭제됨' : '사용중'}</td>
                    <td>
                      {tag.deleted ? (
                        <button
                          className="button ghost compact"
                          type="button"
                          disabled={busyKey === `tag-${tag.id}`}
                          onClick={() => onRestoreTag(tag)}
                        >
                          <RotateCcw size={14} /> 복원
                        </button>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="panel restore-log-panel">
        <div className="toolbar">
          <strong>영구삭제 로그</strong>
          <span className="muted">{purgeLogs.length}건</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>삭제한 사용자</th>
                <th>이메일</th>
                <th>전화번호</th>
                <th>매장</th>
                <th>삭제사유</th>
              </tr>
            </thead>
            <tbody>
              {loadingPurgeLogs ? (
                <tr><td colSpan={5} className="empty">불러오는 중...</td></tr>
              ) : purgeLogs.length === 0 ? (
                <tr><td colSpan={5} className="empty">영구삭제 기록이 없습니다.</td></tr>
              ) : purgeLogs.map((log) => (
                <tr key={log.id}>
                  <td>{log.actorName || '-'}</td>
                  <td>{log.actorEmail || '-'}</td>
                  <td>{log.actorPhone || '-'}</td>
                  <td>{log.storeName || '-'}</td>
                  <td className="restore-log-reason">{log.reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {purgeStoreTarget && (
        <Modal
          title="매장 영구삭제"
          description={`${purgeStoreTarget.name} 매장의 통계, 소속카드, 리다이렉트가 모두 삭제되며 되돌릴 수 없습니다.`}
          onClose={closePurgeModal}
          actions={(
            <>
              <button
                className="button ghost"
                type="button"
                onClick={closePurgeModal}
                disabled={busyKey === `purge-${purgeStoreTarget.id}`}
              >
                취소
              </button>
              <button
                className="button danger"
                type="button"
                disabled={
                  busyKey === `purge-${purgeStoreTarget.id}`
                  || !purgeReason.trim()
                  || purgeConfirm.trim() !== '동의'
                }
                onClick={onPurgeStore}
              >
                {busyKey === `purge-${purgeStoreTarget.id}` ? '삭제 중...' : '영구삭제'}
              </button>
            </>
          )}
        >
          <div className="delete-confirm-box">
            <label className="delete-confirm-label">
              삭제 사유
              <textarea
                value={purgeReason}
                onChange={(event) => setPurgeReason(event.target.value)}
                placeholder="영구삭제 사유를 입력하세요"
                rows={3}
                autoFocus
                disabled={busyKey === `purge-${purgeStoreTarget.id}`}
              />
            </label>
            <label className="delete-confirm-label">
              계속하려면 아래 입력란에 <strong>동의</strong> 를 입력하세요.
              <input
                value={purgeConfirm}
                onChange={(event) => setPurgeConfirm(event.target.value)}
                placeholder="동의"
                disabled={busyKey === `purge-${purgeStoreTarget.id}` || !purgeReason.trim()}
              />
            </label>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default RestorePage
