import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Copy, Download, Factory, ChevronDown, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import {
  downloadExcelOrder,
  deleteExcelOrder,
  deleteTags,
  generateTags,
  getExcelOrders,
  getFactoryProgress,
  getFactoryTags,
  issueTagExcel,
} from '../../api/tag/tagApi'
import CardTypeBadge from '../../common/components/CardTypeBadge'
import Modal from '../../common/components/Modal'

/** 신규 생성은 SERIES2. 목록은 DB에 있는 기존 시리즈도 그대로 보여준다. */
const TAG_SERIES = 'SERIES2'
const RECYCLE_SEQ = 0
const normalizeStatus = (value) => (value === 'FACTORY_ORDERED' ? 'FACTORY_ORDERED' : 'CREATED')

const isRecycleSeq = (seq) => seq != null && Number(seq) === RECYCLE_SEQ

const orderSeqLabel = (seq) => {
  if (seq == null || seq === '') return '-'
  if (isRecycleSeq(seq)) return '재사용'
  return `${seq}차`
}

const seqListLabel = (seqs) => seqs.map((seq) => (isRecycleSeq(seq) ? '재사용' : `${seq}차`)).join(', ')

const batchToneClass = (seq) => {
  if (seq == null || seq === '') return ''
  if (isRecycleSeq(seq)) return 'order-batch-recycle'
  return `order-batch-${((Number(seq) - 1) % 6) + 1}`
}

const cardTypeToneClass = (value) => (
  `card-type-row-${String(value || 'STANDARD').toLowerCase()}`
)

const CARD_TYPES = [
  { value: 'STANDARD', label: '스탠다드' },
  { value: 'PREMIUM', label: '프리미엄' },
]

const cardTypeLabels = Object.fromEntries(CARD_TYPES.map((type) => [type.value, type.label]))
const GENERATE_CHUNK = 50

function FactoryGauge({ progress, label }) {
  const percent = !progress?.total
    ? 0
    : Math.round((progress.done / progress.total) * 100)
  return (
    <div
      className="factory-create-gauge"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={progress.total}
      aria-valuenow={progress.done}
      aria-label={label}
    >
      <div className="factory-create-gauge-track">
        <div
          className={progress.done === 0 ? 'waiting' : ''}
          style={progress.done === 0 ? undefined : { width: `${percent}%` }}
        />
      </div>
      <span>{progress.done}/{progress.total}</span>
    </div>
  )
}

function TagFactoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const statusTab = normalizeStatus(searchParams.get('status'))
  const [createType, setCreateType] = useState('STANDARD')
  const [createCount, setCreateCount] = useState(1)
  const [createProgress, setCreateProgress] = useState(null)
  const [orderProgress, setOrderProgress] = useState(null)
  const [progressModalOpen, setProgressModalOpen] = useState(false)
  const [typeOpen, setTypeOpen] = useState(false)
  const typePickerRef = useRef(null)
  const [items, setItems] = useState([])
  const [excelOrders, setExcelOrders] = useState([])
  const [batchProgress, setBatchProgress] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const showExcelActions = statusTab === 'CREATED'
  const isFactoryTab = statusTab === 'FACTORY_ORDERED'
  const colCount = isFactoryTab ? 7 : 6

  useEffect(() => {
    if (!typeOpen) return undefined
    const close = (event) => {
      if (!typePickerRef.current?.contains(event.target)) setTypeOpen(false)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') setTypeOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [typeOpen])

  const updateFilter = ({ status: nextStatus = statusTab } = {}) => {
    const nextParams = new URLSearchParams()
    nextParams.set('status', normalizeStatus(nextStatus))
    setSearchParams(nextParams)
  }

  const loadExcelOrders = useCallback(async () => {
    try {
      const response = await getExcelOrders()
      setExcelOrders(response.data ?? [])
    } catch {
      setExcelOrders([])
    }
  }, [])

  const loadBatchProgress = useCallback(async () => {
    if (statusTab !== 'FACTORY_ORDERED') {
      setBatchProgress([])
      return
    }
    try {
      const response = await getFactoryProgress()
      setBatchProgress(response.data ?? [])
    } catch {
      setBatchProgress([])
    }
  }, [statusTab])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getFactoryTags(statusTab)
      setItems(response.data ?? [])
      setSelected([])
      await Promise.all([loadExcelOrders(), loadBatchProgress()])
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }, [statusTab, loadExcelOrders, loadBatchProgress])

  useEffect(() => { load() }, [load])

  const batchSummary = useMemo(() => {
    if (!isFactoryTab) return []
    if (batchProgress.length > 0) {
      return batchProgress
        .filter((item) => Number(item.remainingCount) > 0)
        .map((item) => ({
          seq: Number(item.orderSeq),
          current: Number(item.remainingCount),
          initial: Number(item.initialCount),
          assigned: Number(item.assignedCount),
          inProgress: Boolean(item.inProgress),
        }))
    }
    const seqCounts = new Map()
    items.forEach((item) => {
      if (item.factoryOrderSeq == null) return
      const seq = Number(item.factoryOrderSeq)
      seqCounts.set(seq, (seqCounts.get(seq) || 0) + 1)
    })
    return [...seqCounts.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([seq, current]) => {
        const order = excelOrders.find((item) => Number(item.orderSeq) === seq)
        return {
          seq,
          current,
          initial: isRecycleSeq(seq) ? current : (order?.tagCount ?? null),
          assigned: 0,
          inProgress: isRecycleSeq(seq),
        }
      })
  }, [isFactoryTab, items, excelOrders, batchProgress])

  const registrationProgress = useMemo(
    () => batchSummary.filter((batch) => batch.inProgress),
    [batchSummary],
  )

  // 현재 공장발주 목록 행 기준 차수별 개수
  const listBatchCounts = useMemo(() => {
    if (!isFactoryTab) return []
    const seqCounts = new Map()
    items.forEach((item) => {
      const seq = item.factoryOrderSeq == null ? null : Number(item.factoryOrderSeq)
      const key = seq == null ? 'none' : String(seq)
      const current = seqCounts.get(key)
      seqCounts.set(key, {
        seq,
        count: (current?.count || 0) + 1,
      })
    })
    return [...seqCounts.values()]
      .sort((a, b) => {
        if (a.seq === RECYCLE_SEQ) return -1
        if (b.seq === RECYCLE_SEQ) return 1
        if (a.seq == null) return 1
        if (b.seq == null) return -1
        return a.seq - b.seq
      })
  }, [isFactoryTab, items])

  const createBatch = async () => {
    const value = Number(createCount)
    if (!Number.isInteger(value) || value < 1 || value > 500) {
      setMessage({ type: 'error', text: '생성 수량은 1~500 사이여야 합니다.' })
      return
    }
    setBusy(true)
    setProgressModalOpen(true)
    setCreateProgress({ done: 0, total: value })
    let done = 0
    try {
      while (done < value) {
        const count = Math.min(GENERATE_CHUNK, value - done)
        await generateTags({ type: TAG_SERIES, experienceType: createType, count })
        done += count
        setCreateProgress({ done, total: value })
      }
      updateFilter({ status: 'CREATED' })
      const list = await getFactoryTags('CREATED')
      const rows = list.data ?? []
      setItems(rows)
      setSelected([])
      setMessage({
        type: 'success',
        text: `태그카드 ${cardTypeLabels[createType]} ${value}개를 생성했습니다.`,
      })
    } catch (error) {
      if (done > 0) {
        updateFilter({ status: 'CREATED' })
        try {
          const list = await getFactoryTags('CREATED')
          setItems(list.data ?? [])
          setSelected([])
        } catch {
          /* 이미 생성된 목록은 다음 조회에서 맞춘다 */
        }
        setMessage({
          type: 'error',
          text: `${done}개까지 생성한 뒤 중단되었습니다. ${error.message}`,
        })
      } else {
        setMessage({ type: 'error', text: error.message })
      }
    } finally {
      setBusy(false)
      setCreateProgress(null)
    }
  }

  const downloadExcel = async () => {
    if (!selected.length) {
      setMessage({ type: 'error', text: '엑셀 발급할 태그를 선택해 주세요.' })
      return
    }
    const ids = [...selected]
    const total = ids.length
    setBusy(true)
    setProgressModalOpen(true)
    setOrderProgress({ done: 0, total })
    const started = Date.now()
    const expectedMs = Math.max(900, total * 25)
    const timer = window.setInterval(() => {
      const ratio = 1 - Math.exp(-(Date.now() - started) / expectedMs)
      const done = Math.min(total - 1, Math.floor(ratio * total))
      setOrderProgress({ done: Math.max(0, done), total })
    }, 120)
    try {
      const blob = await issueTagExcel(ids)
      window.clearInterval(timer)
      setOrderProgress({ done: total, total })
      await loadExcelOrders()
      const latest = (await getExcelOrders()).data?.[0]
      const fileName = latest?.fileName || 'tag-card-order.xlsx'
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = fileName
      anchor.click()
      URL.revokeObjectURL(url)
      setMessage({
        type: 'success',
        text: `${total}개 태그카드를 ${latest?.orderSeq || ''}차 발주로 이동했습니다.`,
      })
      updateFilter({ status: 'FACTORY_ORDERED' })
      const list = await getFactoryTags('FACTORY_ORDERED')
      setItems(list.data ?? [])
      setSelected([])
    } catch (error) {
      setMessage({ type: 'error', text: error.message || '엑셀 발급에 실패했습니다. Supabase 설정을 확인하세요.' })
    } finally {
      window.clearInterval(timer)
      setBusy(false)
      setOrderProgress(null)
    }
  }

  const executeDelete = async (ids, affectedSeqs) => {
    setBusy(true)
    try {
      await deleteTags(ids)
      if (isFactoryTab && affectedSeqs.length) {
        setMessage({
          type: 'success',
          text: `${ids.length}개 삭제했습니다. ${seqListLabel(affectedSeqs)} 잔여가 줄었습니다.`,
        })
      } else {
        setMessage({ type: 'success', text: `${ids.length}개 태그가 삭제되었습니다.` })
      }
      await load()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setBusy(false)
      setDeleteModalOpen(false)
      setDeleteConfirmText('')
      setPendingDelete(null)
    }
  }

  const closeDeleteModal = () => {
    if (busy) return
    setDeleteModalOpen(false)
    setDeleteConfirmText('')
    setPendingDelete(null)
  }

  const removeSelected = async () => {
    if (!selected.length) return

    const selectedRows = items.filter((item) => selected.includes(item.id))
    const affectedSeqs = [...new Set(
      selectedRows.map((item) => item.factoryOrderSeq).filter((seq) => seq != null),
    )].sort((a, b) => Number(a) - Number(b))

    if (isFactoryTab) {
      setPendingDelete({ ids: [...selected], affectedSeqs })
      setDeleteConfirmText('')
      setDeleteModalOpen(true)
      return
    }

    if (!window.confirm(`${selected.length}개 태그를 완전 삭제할까요? 복구할 수 없습니다.`)) return
    await executeDelete(selected, affectedSeqs)
  }

  const confirmFactoryDelete = async () => {
    if (!pendingDelete || deleteConfirmText.trim() !== '동의' || busy) return
    await executeDelete(pendingDelete.ids, pendingDelete.affectedSeqs)
  }

  const handleDeleteDiscardedOrder = async (order) => {
    if (!window.confirm(`${order.fileName || '폐기된 발주'}를 목록에서 삭제할까요?`)) return
    setBusy(true)
    try {
      await deleteExcelOrder(order.id)
      setMessage({ type: 'success', text: '폐기된 발주를 삭제했습니다.' })
      await loadExcelOrders()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setBusy(false)
    }
  }

  const handleOrderDownload = async (order) => {
    try {
      await downloadExcelOrder(order.id, order.fileName)
    } catch (error) {
      setMessage({ type: 'error', text: error.message || '엑셀 다운로드에 실패했습니다.' })
    }
  }

  const copyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url)
      setMessage({ type: 'success', text: '태그 URL을 복사했습니다.' })
    } catch {
      setMessage({ type: 'error', text: 'URL 복사에 실패했습니다.' })
    }
  }

  const allSelected = items.length > 0 && items.every((item) => selected.includes(item.id))
  const someSelected = selected.length > 0 && !allSelected
  const selectAllRef = useRef(null)

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected
    }
  }, [someSelected])

  const toggleAll = (checked) => setSelected(checked ? items.map((item) => item.id) : [])
  const toggleOne = (id) => setSelected((prev) => (
    prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
  ))

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">FACTORY</span>
          <h1>태그카드 생성</h1>
          <p>태그카드를 생성하고 엑셀 발급 후 공장발주 상태로 전환합니다.</p>
        </div>
        <button className="button ghost" type="button" onClick={load} disabled={loading}>
          <RefreshCw size={16} /> 새로고침
        </button>
      </div>

      {message && (
        <div className={`notice ${message.type}`} role="alert" onClick={() => setMessage(null)}>
          {message.text}
        </div>
      )}

      <section className="panel factory-panel">
        <div className="factory-toolbar">
          <div className="factory-filter-bar">
            <div className="factory-filter-group">
              <span className="factory-filter-label">상태</span>
              <div className="segmented factory-segmented" aria-label="상태">
                <button type="button" className={statusTab === 'CREATED' ? 'active' : ''} onClick={() => updateFilter({ status: 'CREATED' })}>
                  생성됨
                </button>
                <button type="button" className={statusTab === 'FACTORY_ORDERED' ? 'active' : ''} onClick={() => updateFilter({ status: 'FACTORY_ORDERED' })}>
                  <Factory size={15} /> 공장발주
                </button>
              </div>
            </div>

            <div className="factory-count-card">
              <small>현재 목록</small>
              <strong>{items.length}<span>개</span></strong>
            </div>
          </div>

          <div className="factory-action-bar">
            <div className="factory-create-group">
              <div className="factory-type-picker" ref={typePickerRef}>
                <button
                  type="button"
                  className={`factory-type-trigger${typeOpen ? ' open' : ''}`}
                  aria-haspopup="listbox"
                  aria-expanded={typeOpen}
                  onClick={() => setTypeOpen((open) => !open)}
                  disabled={busy}
                >
                  {cardTypeLabels[createType]}
                  <ChevronDown size={14} aria-hidden="true" />
                </button>
                <div className={`factory-type-slide${typeOpen ? ' open' : ''}`} role="listbox" aria-label="카드 타입">
                  {CARD_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      role="option"
                      aria-selected={createType === type.value}
                      className={createType === type.value ? 'active' : ''}
                      onClick={() => {
                        setCreateType(type.value)
                        setTypeOpen(false)
                      }}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="inline-field">
                수량
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={createCount}
                  disabled={busy}
                  onChange={(event) => setCreateCount(event.target.value)}
                />
                <span className="factory-count-limit">최대 500</span>
              </label>
              <button className="button primary" type="button" onClick={createBatch} disabled={busy}>
                <Plus size={16} /> {createProgress ? '생성 중' : '태그 생성'}
              </button>
              {createProgress ? (
                <FactoryGauge progress={createProgress} label="태그 생성 진행" />
              ) : null}
            </div>

            <div className="factory-action-divider" aria-hidden="true" />

            <div className="factory-select-group">
              <span className="selection-count">
                {selected.length > 0 ? `${selected.length}개 선택` : '선택 없음'}
                <small> / 전체 {items.length}개</small>
              </span>
              <button
                className="button ghost"
                type="button"
                disabled={!items.length}
                onClick={() => toggleAll(!allSelected)}
              >
                {allSelected ? '전체선택 해제' : '전체선택'}
              </button>
            </div>

            <div className="factory-action-buttons">
              {showExcelActions && (
                <button className="button primary" type="button" onClick={downloadExcel} disabled={busy || !selected.length}>
                  <Download size={16} /> {orderProgress ? '발주 중' : '태그발주'}
                </button>
              )}
              {orderProgress ? (
                <FactoryGauge progress={orderProgress} label="태그 발주 진행" />
              ) : null}
              <button className="button danger" type="button" onClick={removeSelected} disabled={busy || !selected.length}>
                <Trash2 size={16} /> 완전 삭제
              </button>
            </div>
          </div>
        </div>

        {isFactoryTab && batchSummary.length > 0 && (
          <div className="factory-batch-summary">
            {batchSummary.map((batch) => (
              <div key={batch.seq} className={`factory-batch-chip ${batchToneClass(batch.seq)}`}>
                <strong>{isRecycleSeq(batch.seq) ? '재사용 그룹' : `${batch.seq}차 발주`}</strong>
                <span>
                  현재 {batch.current}개
                  {batch.initial != null ? ` · 초기 ${batch.initial}개` : ''}
                  {batch.assigned > 0 ? ` · 등록완료 ${batch.assigned}개` : ''}
                </span>
              </div>
            ))}
          </div>
        )}

        {isFactoryTab && registrationProgress.length > 0 && (
          <div className="factory-registration-progress">
            <strong>등록 진행상황</strong>
            <div className="factory-registration-chips">
              {registrationProgress.map((batch) => (
                <div key={`progress-${batch.seq}`} className={`factory-progress-chip ${batchToneClass(batch.seq)}`}>
                  {isRecycleSeq(batch.seq) ? '재사용 그룹' : `순번 ${batch.seq}`} · {batch.current}개 태그등록 진행중
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="excel-order-panel">
          <div className="excel-order-heading">
            <strong>최근 태그카드 발주 엑셀</strong>
            <span>차수는 전체 기준 · 완료/폐기된 발주만 10개 넘으면 정리됩니다</span>
          </div>
          {excelOrders.length === 0 ? (
            <div className="excel-order-empty">발주된 엑셀이 없습니다.</div>
          ) : (
            <ul className="excel-order-list">
              {excelOrders.map((order) => {
                const discarded = order.status === 'DISCARDED'
                return (
                <li
                  key={order.id}
                  className={discarded ? 'excel-order-discarded' : batchToneClass(order.orderSeq)}
                >
                  <div>
                    <div className="excel-order-title-row">
                      <strong title={order.fileName}>{order.fileName}</strong>
                      <span className={`excel-order-status status-${discarded ? 'discarded' : (order.status || 'WAITING').toLowerCase()}`}>
                        {discarded ? '폐기된 발주' : (order.statusLabel || '발주대기')}
                      </span>
                    </div>
                    <small>
                      {order.category ? `${order.category} · ` : ''}
                      초기 {order.tagCount}개
                      {order.assignedCount != null ? ` · 등록 ${order.assignedCount}개` : ''}
                      {order.remainingCount != null ? ` · 잔여 ${order.remainingCount}개` : ''}
                      <br />
                      {order.createdAt}
                      {order.status === 'NEEDS_EDIT' && (
                        <>
                          <br />
                          삭제된 태그가 있습니다. 엑셀을 초기 수량에 맞게 수정해 주세요.
                        </>
                      )}
                      {discarded && (
                        <>
                          <br />
                          태그가 모두 삭제되어 폐기된 발주입니다. 목록에서 삭제할 수 있습니다.
                        </>
                      )}
                      {order.status === 'COMPLETED' && (
                        <>
                          <br />
                          공장발주 잔여가 없습니다. 등록 작업이 완료되었습니다.
                        </>
                      )}
                    </small>
                  </div>
                  {discarded ? (
                    <button
                      className="button danger compact"
                      type="button"
                      onClick={() => handleDeleteDiscardedOrder(order)}
                      disabled={busy}
                    >
                      <Trash2 size={13} /> 삭제
                    </button>
                  ) : (
                    <button
                      className="button ghost compact"
                      type="button"
                      onClick={() => handleOrderDownload(order)}
                      disabled={busy}
                      title="다운로드"
                    >
                      <Download size={13} /> 다운
                    </button>
                  )}
                </li>
                )
              })}
            </ul>
          )}
        </div>

        {!showExcelActions && (
          <div className="panel-hint">
            공장발주 태그를 삭제하면 잔여가 줄어듭니다. 실물 URL이므로 동의 입력이 필요합니다.
          </div>
        )}

        {selected.length > 0 && (
          <div className="panel-hint selection-hint">
            {selected.length}개 태그가 선택되었습니다.
            {showExcelActions
              ? ' 엑셀 발급 시 같은 발주 순번으로 공장발주됩니다.'
              : ' 공장발주 삭제는 동의 후 가능하고, 잔여가 줄어듭니다.'}
          </div>
        )}

        {isFactoryTab && listBatchCounts.length > 0 && (
          <div className="factory-list-batch-bar">
            <span className="factory-list-batch-total">목록 {items.length}개</span>
            <div className="factory-list-batch-chips">
              {listBatchCounts.map((batch) => (
                <span
                  key={`list-batch-${batch.seq == null ? 'none' : batch.seq}`}
                  className={`factory-list-batch-chip ${batch.seq == null ? '' : batchToneClass(batch.seq)}`}
                >
                  {batch.seq == null ? '순번없음' : orderSeqLabel(batch.seq)} {batch.count}개
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="table-wrap factory-table-scroll">
          <table>
            <thead>
              <tr>
                <th className="select-all-cell">
                  <label className="select-all-label">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={allSelected}
                      onChange={(event) => toggleAll(event.target.checked)}
                      aria-label={allSelected ? '전체선택 해제' : '전체선택'}
                    />
                    <span>{allSelected ? '해제' : '전체'}</span>
                  </label>
                </th>
                {isFactoryTab && <th>발주순번</th>}
                <th>태그 ID</th>
                <th>시리즈</th>
                <th>카드 타입</th>
                <th>URL</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={colCount} className="empty">불러오는 중...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={colCount} className="empty">표시할 태그가 없습니다.</td></tr>
              ) : items.map((item) => (
                <tr
                  key={item.id}
                  className={isFactoryTab
                    ? batchToneClass(item.factoryOrderSeq)
                    : cardTypeToneClass(item.experienceType)}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(item.id)}
                      onChange={() => toggleOne(item.id)}
                      aria-label={`${item.id} 선택`}
                    />
                  </td>
                  {isFactoryTab && (
                    <td>
                      <span className={`order-seq-pill ${batchToneClass(item.factoryOrderSeq)}`}>
                        {orderSeqLabel(item.factoryOrderSeq)}
                      </span>
                    </td>
                  )}
                  <td>{item.id}</td>
                  <td>{item.category}</td>
                  <td><CardTypeBadge value={item.experienceType} /></td>
                  <td className="factory-url-cell">
                    {!isFactoryTab ? (
                      <span className="url-cell mono factory-url-masked">
                        {(item.tagUrl || '').slice(0, 6)}....
                      </span>
                    ) : (
                      <div className="url-actions">
                        <span className="url-cell mono">{item.tagUrl}</span>
                        <button
                          className="icon-button"
                          type="button"
                          onClick={() => copyUrl(item.tagUrl)}
                          aria-label="URL 복사"
                          title="URL 복사"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                  <td>
                    {item.status === 'CREATED' ? (
                      '생성됨'
                    ) : item.registrationInProgress ? (
                      <span className="factory-status-progress">태그등록 진행중</span>
                    ) : (
                      '공장발주'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {progressModalOpen && (createProgress || orderProgress) && (
        <Modal
          className="factory-progress-modal"
          title={createProgress ? '태그 생성 중' : '태그 발주 중'}
          description="게이지는 대략적인 진행입니다. 모달을 닫아도 작업은 계속되며, 화면의 게이지로 확인할 수 있습니다."
          onClose={() => setProgressModalOpen(false)}
          actions={(
            <button className="button ghost" type="button" onClick={() => setProgressModalOpen(false)}>
              닫기
            </button>
          )}
        >
          <div className="factory-progress-modal-body">
            <span className="factory-progress-spin" aria-hidden="true" />
            <FactoryGauge
              progress={createProgress || orderProgress}
              label={createProgress ? '태그 생성 진행' : '태그 발주 진행'}
            />
          </div>
        </Modal>
      )}

      {deleteModalOpen && pendingDelete && (
        <Modal
          title="태그카드 영구 삭제"
          description="해당 태그카드는 영구 소멸합니다. 실물카드인 경우 별도 앱으로 태그ID를 재발급 하십시오."
          onClose={closeDeleteModal}
          actions={(
            <>
              <button className="button ghost" type="button" onClick={closeDeleteModal} disabled={busy}>
                취소
              </button>
              <button
                className="button danger"
                type="button"
                disabled={busy || deleteConfirmText.trim() !== '동의'}
                onClick={confirmFactoryDelete}
              >
                {busy ? '삭제 중...' : '영구삭제'}
              </button>
            </>
          )}
        >
          <div className="delete-confirm-box">
            <p>
              {pendingDelete.ids.length}개 태그를 삭제합니다.
              {pendingDelete.affectedSeqs.length
                ? ` ${seqListLabel(pendingDelete.affectedSeqs)} 잔여가 줄어듭니다.`
                : ''}
            </p>
            <label className="delete-confirm-label">
              계속하려면 아래 입력란에 <strong>동의</strong> 를 입력하세요.
              <input
                value={deleteConfirmText}
                onChange={(event) => setDeleteConfirmText(event.target.value)}
                placeholder="동의"
                autoFocus
                disabled={busy}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    confirmFactoryDelete()
                  }
                }}
              />
            </label>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default TagFactoryPage
