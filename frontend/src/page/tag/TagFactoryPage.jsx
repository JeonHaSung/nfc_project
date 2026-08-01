import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Copy, Download, Factory, Plus, QrCode, Radio, RefreshCw, Trash2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import {
  downloadExcelOrder,
  deleteTags,
  generateTags,
  getExcelOrders,
  getFactoryProgress,
  getFactoryTags,
  issueTagExcel,
} from '../../api/tag/tagApi'

const normalizeTagType = (value) => (value === 'QR' ? 'QR' : 'NFC')
const normalizeStatus = (value) => (value === 'FACTORY_ORDERED' ? 'FACTORY_ORDERED' : 'CREATED')

const batchToneClass = (seq) => {
  if (!seq) return ''
  return `order-batch-${((Number(seq) - 1) % 6) + 1}`
}

function TagFactoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tagType = normalizeTagType(searchParams.get('tagType'))
  const statusTab = normalizeStatus(searchParams.get('status'))
  const [count, setCount] = useState(1)
  const [items, setItems] = useState([])
  const [excelOrders, setExcelOrders] = useState([])
  const [batchProgress, setBatchProgress] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const showExcelActions = statusTab === 'CREATED'
  const isFactoryTab = statusTab === 'FACTORY_ORDERED'
  const colCount = isFactoryTab ? 6 : 5

  const updateFilter = ({ tagType: nextType = tagType, status: nextStatus = statusTab }) => {
    const nextParams = new URLSearchParams()
    nextParams.set('tagType', normalizeTagType(nextType))
    nextParams.set('status', normalizeStatus(nextStatus))
    setSearchParams(nextParams)
  }

  const loadExcelOrders = useCallback(async () => {
    try {
      const response = await getExcelOrders(tagType)
      setExcelOrders(response.data ?? [])
    } catch {
      setExcelOrders([])
    }
  }, [tagType])

  const loadBatchProgress = useCallback(async () => {
    if (statusTab !== 'FACTORY_ORDERED') {
      setBatchProgress([])
      return
    }
    try {
      const response = await getFactoryProgress(tagType)
      setBatchProgress(response.data ?? [])
    } catch {
      setBatchProgress([])
    }
  }, [tagType, statusTab])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getFactoryTags(tagType, statusTab)
      setItems(response.data ?? [])
      setSelected([])
      await Promise.all([loadExcelOrders(), loadBatchProgress()])
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }, [tagType, statusTab, loadExcelOrders, loadBatchProgress])

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
    const counts = new Map()
    items.forEach((item) => {
      if (!item.factoryOrderSeq) return
      const key = Number(item.factoryOrderSeq)
      counts.set(key, (counts.get(key) || 0) + 1)
    })
    return [...counts.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([seq, current]) => {
        const order = excelOrders.find((item) => Number(item.orderSeq) === seq)
        return {
          seq,
          current,
          initial: order?.tagCount ?? null,
          assigned: 0,
          inProgress: false,
        }
      })
  }, [isFactoryTab, items, excelOrders, batchProgress])

  const registrationProgress = useMemo(
    () => batchSummary.filter((batch) => batch.inProgress),
    [batchSummary],
  )

  const createBatch = async () => {
    const value = Number(count)
    if (!Number.isInteger(value) || value < 1 || value > 500) {
      setMessage({ type: 'error', text: '생성 수량은 1~500 사이여야 합니다.' })
      return
    }
    setBusy(true)
    try {
      await generateTags({ type: tagType, count: value })
      updateFilter({ status: 'CREATED' })
      const list = await getFactoryTags(tagType, 'CREATED')
      const rows = list.data ?? []
      setItems(rows)
      setSelected([])
      setMessage({ type: 'success', text: `현재 ${tagType} 생성됨 태그 ${rows.length}개` })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setBusy(false)
    }
  }

  const downloadExcel = async () => {
    if (!selected.length) {
      setMessage({ type: 'error', text: '엑셀 발급할 태그를 선택해 주세요.' })
      return
    }
    setBusy(true)
    try {
      const blob = await issueTagExcel(selected)
      await loadExcelOrders()
      const latest = (await getExcelOrders(tagType)).data?.[0]
      const fileName = latest?.fileName || `${tagType.toLowerCase()}-tags.xlsx`
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = fileName
      anchor.click()
      URL.revokeObjectURL(url)
      setMessage({
        type: 'success',
        text: `${selected.length}개 태그를 ${latest?.orderSeq || ''}차 발주로 이동했습니다.`,
      })
      updateFilter({ status: 'FACTORY_ORDERED' })
      const list = await getFactoryTags(tagType, 'FACTORY_ORDERED')
      setItems(list.data ?? [])
      setSelected([])
    } catch (error) {
      setMessage({ type: 'error', text: error.message || '엑셀 발급에 실패했습니다. Supabase 설정을 확인하세요.' })
    } finally {
      setBusy(false)
    }
  }

  const removeSelected = async () => {
    if (!selected.length) return

    const selectedRows = items.filter((item) => selected.includes(item.id))
    const affectedSeqs = [...new Set(
      selectedRows.map((item) => item.factoryOrderSeq).filter(Boolean),
    )].sort((a, b) => a - b)

    let confirmText = `${selected.length}개 태그를 완전 삭제할까요? 복구할 수 없습니다.`
    if (isFactoryTab) {
      const seqText = affectedSeqs.length
        ? affectedSeqs.map((seq) => `${seq}차`).join(', ')
        : '해당'
      confirmText = [
        `${selected.length}개 공장발주 태그를 완전 삭제합니다.`,
        `${seqText} 발주 엑셀의 초기 수량과 달라질 수 있으니, 초기 발주 수에 맞게 엑셀을 수정해 주세요.`,
      ].join('\n')
    }

    if (!window.confirm(confirmText)) return
    setBusy(true)
    try {
      await deleteTags(selected)
      if (isFactoryTab && affectedSeqs.length) {
        setMessage({
          type: 'warning',
          text: `${selected.length}개 삭제 완료. ${affectedSeqs.map((seq) => `${seq}차`).join(', ')} 발주 엑셀을 초기 발주 수에 맞게 수정해 주세요.`,
        })
      } else {
        setMessage({ type: 'success', text: `${selected.length}개 태그가 삭제되었습니다.` })
      }
      await load()
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
          <h1>NFC / QR 생성</h1>
          <p>태그를 생성하고 엑셀 발급 후 공장발주 상태로 전환합니다.</p>
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
              <span className="factory-filter-label">유형</span>
              <div className="segmented factory-segmented" aria-label="태그 유형">
                <button type="button" className={tagType === 'NFC' ? 'active' : ''} onClick={() => updateFilter({ tagType: 'NFC' })}>
                  <Radio size={15} /> NFC
                </button>
                <button type="button" className={tagType === 'QR' ? 'active' : ''} onClick={() => updateFilter({ tagType: 'QR' })}>
                  <QrCode size={15} /> QR
                </button>
              </div>
            </div>

            <div className="factory-filter-divider" aria-hidden="true" />

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
              <label className="inline-field">
                생성 수량
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={count}
                  onChange={(event) => setCount(event.target.value)}
                />
              </label>
              <button className="button primary" type="button" onClick={createBatch} disabled={busy}>
                <Plus size={16} /> 생성
              </button>
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
                <button className="button" type="button" onClick={downloadExcel} disabled={busy || !selected.length}>
                  <Download size={16} /> 엑셀 발급
                </button>
              )}
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
                <strong>{batch.seq}차 발주</strong>
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
                  순번 {batch.seq} · {batch.current}개 태그등록 진행중
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="excel-order-panel">
          <div className="excel-order-heading">
            <strong>최근 {tagType} 발주 엑셀</strong>
            <span>{tagType} 기준 최대 10개 · 차수 카운트 분리 · 초과 시 오래된 파일 자동 삭제</span>
          </div>
          {excelOrders.length === 0 ? (
            <div className="excel-order-empty">발주된 엑셀이 없습니다.</div>
          ) : (
            <ul className="excel-order-list">
              {excelOrders.map((order) => (
                <li key={order.id} className={batchToneClass(order.orderSeq)}>
                  <div>
                    <div className="excel-order-title-row">
                      <strong title={order.fileName}>{order.fileName}</strong>
                      <span className={`excel-order-status status-${(order.status || 'WAITING').toLowerCase()}`}>
                        {order.statusLabel || '발주대기'}
                      </span>
                    </div>
                    <small>
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
                      {order.status === 'COMPLETED' && (
                        <>
                          <br />
                          공장발주 잔여가 없습니다. 등록 작업이 완료되었습니다.
                        </>
                      )}
                    </small>
                  </div>
                  <button className="button ghost compact" type="button" onClick={() => handleOrderDownload(order)}>
                    <Download size={13} /> 다운
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {!showExcelActions && (
          <div className="panel-hint">
            공장발주 태그는 완전 삭제할 수 있습니다. 삭제 시 해당 차수 엑셀을 초기 발주 수에 맞게 수정해 주세요.
          </div>
        )}

        {selected.length > 0 && (
          <div className="panel-hint selection-hint">
            {selected.length}개 태그가 선택되었습니다.
            {showExcelActions
              ? ' 엑셀 발급 시 같은 발주 순번으로 공장발주됩니다.'
              : ' 삭제하면 해당 차수 엑셀을 초기 발주 수에 맞게 수정해 주세요.'}
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
                <th>유형</th>
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
                <tr key={item.id} className={isFactoryTab ? batchToneClass(item.factoryOrderSeq) : ''}>
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
                        {item.factoryOrderSeq ? `${item.factoryOrderSeq}차` : '-'}
                      </span>
                    </td>
                  )}
                  <td>{item.id}</td>
                  <td>{item.category}</td>
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
    </div>
  )
}

export default TagFactoryPage
