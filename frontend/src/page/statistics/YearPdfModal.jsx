import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Modal from '../../common/components/Modal'
import RetapLogo from '../../common/components/RetapLogo'

const weekdayStem = (value) => {
  if (!value) return null
  return value.endsWith('요일') ? value.slice(0, -2) : value
}

const yearFromMonthStart = (value) => {
  if (value == null || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (Array.isArray(value) && value.length) return Number(value[0]) || null
  const match = String(value).match(/^(\d{4})/)
  return match ? Number(match[1]) : null
}

const monthLabel = (value) => {
  const parts = String(value || '').split('-')
  const year = parts[0] || ''
  const month = Number(parts[1])
  if (year.length < 2 || !month) return '-'
  return `${year.slice(-2)}년${month}월`
}

const waitForImages = (node) => Promise.all(
  [...node.querySelectorAll('img')].map((img) => {
    if (img.complete) return Promise.resolve()
    return new Promise((resolve) => {
      img.addEventListener('load', resolve, { once: true })
      img.addEventListener('error', resolve, { once: true })
    })
  }),
)

function YearPdfModal({
  open,
  onClose,
  yearly = [],
  monthly = [],
  storeName,
  storeId,
}) {
  const years = useMemo(
    () => [...new Set(yearly.map((row) => Number(row.year)).filter(Boolean))].sort((a, b) => a - b),
    [yearly],
  )
  const [index, setIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const sheetRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setError('')
    setIndex(Math.max(0, years.length - 1))
  }, [open, years.length])

  const selectedYear = years[index]
  const yearRow = yearly.find((row) => Number(row.year) === selectedYear)
  const yearMonths = useMemo(
    () => monthly.filter((row) => yearFromMonthStart(row.monthStartDate) === selectedYear),
    [monthly, selectedYear],
  )

  const day = weekdayStem(yearRow?.mostClickedDayOfWeek)
  const hour = yearRow?.mostClickedHour
  const count = Number(yearRow?.count || 0)
  const printedAt = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })
  const summary = yearRow && day && hour
    ? `${selectedYear}년에는 총 태그가 ${count.toLocaleString()}회였고, 가장 많이 이용한 요일은 ${day}요일이며 ${hour}에 가장 활발했어요`
    : yearRow
      ? `${selectedYear}년 한해 조회수는 ${count.toLocaleString()}회입니다.`
      : ''

  const save = async () => {
    const node = sheetRef.current
    if (!node || selectedYear == null) return
    setSaving(true)
    setError('')
    try {
      await waitForImages(node)
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])
      const canvas = await html2canvas(node, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: node.scrollWidth,
        windowHeight: node.scrollHeight,
      })
      const img = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgW = pageW
      let imgH = (canvas.height * imgW) / canvas.width
      let y = 0
      let remaining = imgH
      pdf.addImage(img, 'PNG', 0, 0, imgW, imgH, undefined, 'FAST')
      remaining -= pageH
      y -= pageH
      while (remaining > 1) {
        pdf.addPage()
        pdf.addImage(img, 'PNG', 0, y, imgW, imgH, undefined, 'FAST')
        remaining -= pageH
        y -= pageH
      }
      const safeStore = String(storeId || 'store').replace(/[\\/:*?"<>|]/g, '_')
      pdf.save(`RETAP_${selectedYear}_결산_${safeStore}.pdf`)
      onClose()
    } catch {
      setError('PDF를 만들지 못했습니다. 다시 시도해 주세요.')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const sheet = (
    <div className="year-pdf-offscreen" aria-hidden="true">
      <article className="year-pdf-sheet" ref={sheetRef}>
        <header className="year-pdf-sheet-header">
          <div>
            <RetapLogo className="year-pdf-logo" alt="RETAP" />
            <p>{selectedYear}년 단일 결산</p>
          </div>
          <strong>{selectedYear}년</strong>
        </header>
        <dl className="year-pdf-meta">
          <div>
            <dt>매장</dt>
            <dd>{storeName || '-'}</dd>
          </div>
          <div>
            <dt>매장 ID</dt>
            <dd>{storeId || '-'}</dd>
          </div>
          <div>
            <dt>출력일</dt>
            <dd>{printedAt}</dd>
          </div>
        </dl>
        <section className="year-pdf-kpis">
          <article>
            <small>{selectedYear}년 조회수</small>
            <strong>{count.toLocaleString()}회</strong>
          </article>
          <article>
            <small>{selectedYear}년 최다 요일</small>
            <strong>{yearRow?.mostClickedDayOfWeek || '-'}</strong>
          </article>
          <article>
            <small>{selectedYear}년 최다 시간대</small>
            <strong>{hour || '-'}</strong>
          </article>
        </section>
        {summary && <p className="year-pdf-summary">{summary}</p>}
        <section>
          <h3>{selectedYear}년 월별 조회수</h3>
          {yearMonths.length ? (
            <table className="year-pdf-table">
              <thead>
                <tr>
                  <th>월</th>
                  <th>조회수</th>
                  <th>최다 요일</th>
                  <th>최다 시간</th>
                </tr>
              </thead>
              <tbody>
                {yearMonths.map((row) => (
                  <tr key={row.monthStartDate}>
                    <td>{monthLabel(row.monthStartDate)}</td>
                    <td>{Number(row.count || 0).toLocaleString()}회</td>
                    <td>{row.mostClickedDayOfWeek || '-'}</td>
                    <td>{row.mostClickedHour || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="year-pdf-empty">{selectedYear}년 월별 집계가 없습니다.</p>
          )}
        </section>
        <footer>RETAP · {selectedYear}년 단일 결산 · {storeId}</footer>
      </article>
    </div>
  )

  return (
    <>
      <Modal
        title="연도별 결산 PDF"
        description="연도를 고르면 그해 데이터만 PDF로 저장됩니다."
        onClose={() => { if (!saving) onClose() }}
        wide
        actions={(
          <>
            <button className="button ghost" type="button" onClick={onClose} disabled={saving}>취소</button>
            <button className="button primary" type="button" onClick={save} disabled={saving || selectedYear == null}>
              {saving ? '저장 중…' : '저장'}
            </button>
          </>
        )}
      >
        {years.length === 0 ? (
          <p className="year-pdf-empty">저장할 연도 데이터가 없습니다.</p>
        ) : (
          <div className="year-pdf-picker">
            <div className="year-pdf-year-display">{selectedYear}년</div>
            <input
              type="range"
              min={0}
              max={Math.max(years.length - 1, 0)}
              step={1}
              value={index}
              onChange={(event) => setIndex(Number(event.target.value))}
              aria-label="결산 연도"
              disabled={saving || years.length < 2}
            />
            <div className="year-pdf-ticks">
              {years.map((year) => (
                <span key={year} className={year === selectedYear ? 'active' : undefined}>{year}</span>
              ))}
            </div>
            <ul className="year-pdf-preview-stats">
              <li><span>{selectedYear}년 조회수</span><b>{count.toLocaleString()}회</b></li>
              <li><span>최다 요일</span><b>{yearRow?.mostClickedDayOfWeek || '-'}</b></li>
              <li><span>최다 시간</span><b>{hour || '-'}</b></li>
              <li><span>월별 건수</span><b>{yearMonths.length}개월</b></li>
            </ul>
            {error && <p className="year-pdf-error">{error}</p>}
          </div>
        )}
      </Modal>
      {createPortal(sheet, document.body)}
    </>
  )
}

export default YearPdfModal
