import { Children, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, CalendarDays, FileDown, MousePointerClick, Radio, Store, Tags, TrendingUp } from 'lucide-react'
import { getDashboardCharts, getDashboardSummary } from '../../api/dashboard/dashboardApi'
import { useAuth } from '../../auth/AuthContext'
import StoreSelect from '../../common/components/StoreSelect'
import TagRedirectStatsCard from '../../common/components/TagRedirectStatsCard'
import YearPdfModal from './YearPdfModal'

const chartAxis = { fontSize: 10, fill: '#8b95a7' }

const experienceTypeLabels = {
  STANDARD: '스탠다드',
  PREMIUM: '프리미엄',
}

const formatDate = (value) => {
  if (!value || typeof value !== 'string') return '-'
  const parts = value.split('-')
  if (parts.length < 3) return value
  const month = Number(parts[1])
  const day = Number(parts[2])
  if (!month || !day) return value
  return `${month}.${day}`
}

const formatDateKo = (value) => {
  if (!value || typeof value !== 'string') return '-'
  const parts = value.split('-')
  if (parts.length < 3) return value
  const month = Number(parts[1])
  const day = Number(parts[2])
  if (!month || !day) return value
  return `${month}월 ${day}일`
}

const formatMonth = (value) => {
  if (!value || typeof value !== 'string') return '-'
  const parts = value.split('-')
  if (parts.length < 2) return value
  const year = parts[0]
  const month = Number(parts[1])
  if (year.length < 2 || !month) return value
  return `${year.slice(-2)}년${month}월`
}

const isCanceled = (error) => error?.canceled || error?.code === 'ERR_CANCELED'

const weekdayStem = (value) => {
  if (!value) return null
  return value.endsWith('요일') ? value.slice(0, -2) : value
}

const WEEKDAY_SHORT = ['일', '월', '화', '수', '목', '금', '토']

const weekdayFromIso = (value) => {
  if (!value || typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null
  const date = new Date(`${value.slice(0, 10)}T00:00:00+09:00`)
  if (Number.isNaN(date.getTime())) return null
  return WEEKDAY_SHORT[date.getDay()]
}

const describeDelta = (current, previous) => {
  const cur = Number(current || 0)
  const prev = Number(previous || 0)
  if (prev === 0 && cur === 0) return null
  if (prev === 0) return { kind: 'new' }
  const pct = Math.round(((cur - prev) / prev) * 100)
  if (pct === 0) return { kind: 'flat' }
  return { kind: pct > 0 ? 'up' : 'down', pct: Math.abs(pct) }
}

const seoulYmd = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())

const shiftYmd = (ymd, days) => {
  const date = new Date(`${ymd}T12:00:00+09:00`)
  date.setDate(date.getDate() + days)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(date)
}

const rowOnDate = (rows = [], ymd) => rows.find((row) => row?.date === ymd)

const lastVsPreviousDelta = (rows = []) => {
  if (rows.length < 2) return null
  return describeDelta(rows[rows.length - 1]?.count, rows[rows.length - 2]?.count)
}

const peakRow = (rows = []) => {
  if (!rows.length) return null
  const peak = rows.reduce((best, row) => (
    Number(row?.count || 0) >= Number(best?.count || 0) ? row : best
  ))
  return Number(peak?.count || 0) > 0 ? peak : null
}

const dailyPeakLabel = (row) => {
  if (!row?.date) return null
  const weekday = weekdayStem(row.dayOfWeek) || weekdayFromIso(row.date)
  const dateLabel = formatDateKo(row.date)
  return weekday ? `${dateLabel}(${weekday})` : dateLabel
}

function DeltaPhrase({ prefix, delta }) {
  if (!delta) return null
  if (delta.kind === 'new') return <>비교할 이전 조회가 없어 비율은 표시하지 않아요</>
  if (delta.kind === 'flat') return <>{prefix} 같아요</>
  const word = delta.kind === 'up' ? '상승' : '하락'
  return (
    <>
      {prefix}{' '}
      <b className={delta.kind === 'up' ? 'delta-up' : 'delta-down'}>{delta.pct}%</b>
      {` ${word}했어요`}
    </>
  )
}

function TrendLines({ peakText, compareText, delta }) {
  return (
    <>
      {peakText ? <p>{peakText}</p> : null}
      {delta ? (
        <p>
          <DeltaPhrase prefix={compareText} delta={delta} />
        </p>
      ) : null}
    </>
  )
}

function Settlement({ children }) {
  const items = Children.toArray(children).filter(Boolean)
  if (!items.length) return null
  return <div className="chart-settlement">{items}</div>
}

function ChartTooltip({ active, payload, label, type }) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  const title = type === 'hour'
    ? (data.label || `${label}:00`)
    : type === 'year'
      ? `${label}년`
      : type === 'month'
        ? formatMonth(label)
        : formatDate(label)
  return (
    <div className="dashboard-tooltip">
      <strong>{title}</strong>
      <span>{type === 'year' ? '한해 조회수' : type === 'hour' ? '오늘 조회수' : '상승 조회수'} <b>{Number(payload[0].value || 0).toLocaleString()}회</b></span>
      {type !== 'hour' && (
        <span>누적 조회수 <b>{Number(data.cumulativeCount || 0).toLocaleString()}회</b></span>
      )}
      {(type === 'month' || type === 'year') && data.mostClickedDayOfWeek && (
        <span>최다 요일 <b>{data.mostClickedDayOfWeek}</b></span>
      )}
      {(type === 'day' || type === 'month' || type === 'year') && data.mostClickedHour && (
        <span>최다 시간 <b>{data.mostClickedHour}</b></span>
      )}
    </div>
  )
}

function ScrollChart({ points = 0, minPointWidth = 52, children }) {
  const scrollerRef = useRef(null)
  const minWidth = Math.max(points * minPointWidth, 280)
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollLeft = el.scrollWidth
  }, [points, minWidth])
  return (
    <div className="chart-scroll" ref={scrollerRef}>
      <div className="chart-scroll-inner" style={{ minWidth: `${minWidth}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function StatisticsPage() {
  const { user } = useAuth()
  const isMaster = user?.role === 'MASTER'
  const [searchParams, setSearchParams] = useSearchParams()
  const [summary, setSummary] = useState({ storeCount: 0, tagCount: 0, experienceTypeCounts: [] })
  const [selectedStore, setSelectedStore] = useState(null)
  const [charts, setCharts] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [pdfOpen, setPdfOpen] = useState(false)
  const storeId = searchParams.get('storeId') ?? ''

  useEffect(() => {
    const controller = new AbortController()
    getDashboardSummary({ signal: controller.signal })
      .then((summaryResponse) => {
        setSummary(summaryResponse.data ?? { storeCount: 0, tagCount: 0, experienceTypeCounts: [] })
      })
      .catch((error) => {
        if (isCanceled(error)) return
        setMessage(error.message)
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!storeId) {
      setCharts(null)
      setLoading(false)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    setMessage('')
    getDashboardCharts(storeId, { signal: controller.signal })
      .then((response) => setCharts(response.data))
      .catch((error) => {
        if (isCanceled(error)) return
        setCharts(null)
        setMessage(error.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [storeId])

  const lastWeekDay = weekdayStem(charts?.lastWeekMostClickedDayOfWeek)
  const lastMonthDay = weekdayStem(charts?.lastMonthMostClickedDayOfWeek)
  const lastYearDay = weekdayStem(charts?.lastYearMostClickedDayOfWeek)
  const hasTodayHours = (charts?.todayHourly ?? []).some((item) => Number(item.count || 0) > 0)
  const todayTotal = useMemo(
    () => (charts?.todayHourly ?? []).reduce((total, item) => total + Number(item.count || 0), 0),
    [charts],
  )
  const yesterdayTotal = useMemo(() => {
    const yesterday = shiftYmd(seoulYmd(), -1)
    return Number(rowOnDate(charts?.daily ?? [], yesterday)?.count || 0)
  }, [charts])
  const todayPace = useMemo(() => {
    if (yesterdayTotal <= 0) {
      if (todayTotal <= 0) return null
      return { kind: 'new' }
    }
    if (todayTotal < yesterdayTotal) {
      return { kind: 'progress', pct: Math.round((todayTotal / yesterdayTotal) * 100) }
    }
    if (todayTotal === yesterdayTotal) return { kind: 'even' }
    return {
      kind: 'ahead',
      pct: Math.round(((todayTotal - yesterdayTotal) / yesterdayTotal) * 100),
    }
  }, [todayTotal, yesterdayTotal])
  const annualMostClickedDay = useMemo(
    () => charts?.lastYearMostClickedDayOfWeek || charts?.latestMonthMostClickedDayOfWeek || null,
    [charts],
  )
  const dailyTrend = useMemo(() => {
    const rows = charts?.daily ?? []
    const peak = peakRow(rows)
    const today = seoulYmd()
    const yesterday = rowOnDate(rows, shiftYmd(today, -1))
    const dayBefore = rowOnDate(rows, shiftYmd(today, -2))
    return {
      peakText: peak ? `이 14일 안에서 태그가 제일 많았던 날은 ${dailyPeakLabel(peak)}예요` : null,
      compareText: '어제 조회수는 그저께보다',
      delta: yesterday && dayBefore
        ? describeDelta(yesterday.count, dayBefore.count)
        : null,
    }
  }, [charts])
  const weeklyTrend = useMemo(() => {
    const rows = charts?.weekly ?? []
    const peak = peakRow(rows)
    return {
      peakText: peak?.weekStartDate ? `이 차트에서 태그가 제일 많았던 주는 ${formatDateKo(peak.weekStartDate)}에 시작한 주예요` : null,
      compareText: '지난주 조회수는 전전주보다',
      delta: lastVsPreviousDelta(rows),
    }
  }, [charts])
  const monthlyTrend = useMemo(() => {
    const rows = charts?.monthly ?? []
    const peak = peakRow(rows)
    return {
      peakText: peak?.monthStartDate ? `이 1년 안에서 태그가 제일 많았던 달은 ${formatMonth(peak.monthStartDate)}예요` : null,
      compareText: '저번달 조회수는 전전달보다',
      delta: lastVsPreviousDelta(rows),
    }
  }, [charts])
  const yearlyTrend = useMemo(() => {
    const rows = charts?.yearly ?? []
    const peak = peakRow(rows)
    return {
      peakText: peak?.year ? `집계된 해 중 태그가 제일 많았던 해는 ${peak.year}년이에요` : null,
      compareText: '지난해 조회수는 전전해보다',
      delta: lastVsPreviousDelta(rows),
    }
  }, [charts])

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">DASHBOARD</span>
          <h1>매장 분석</h1>
          <p>선택한 매장 기준으로 이용 흐름을 기간별로 확인합니다.</p>
        </div>
      </div>

      {message && <div className="notice error" onClick={() => setMessage('')}>{message}</div>}

      <div className="dashboard-summary">
        <article className="dashboard-summary-card">
          <span className="stat-icon blue"><Store size={20} /></span>
          <div><small>등록된 매장</small><strong>{summary.storeCount.toLocaleString()}</strong><p>조회 가능한 매장</p></div>
        </article>
        <article className="dashboard-summary-card">
          <span className="stat-icon violet"><Tags size={20} /></span>
          <div>
            <small>배포된 카드</small>
            <strong>{summary.tagCount.toLocaleString()}</strong>
            <p>매장에 등록된 카드</p>
            <ul className="dashboard-type-counts" aria-label="카드 타입별 수량">
              {(summary.experienceTypeCounts ?? []).map((item) => (
                <li key={item.experienceType} className={`type-${String(item.experienceType || '').toLowerCase()}`}>
                  <span>{experienceTypeLabels[item.experienceType] || item.experienceType}</span>
                  <strong>{Number(item.count || 0).toLocaleString()}개</strong>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </div>

      <section className="dashboard-filter-panel">
        <div>
          <span className="eyebrow">STORE FILTER</span>
          <h2>분석할 매장을 선택하세요</h2>
        </div>
        <StoreSelect
          value={storeId}
          onChange={(value) => setSearchParams(value ? { storeId: value } : {})}
          onSelectedStoreChange={setSelectedStore}
          showRegistrant={isMaster}
        />
      </section>

      {!storeId ? (
        <section className="dashboard-empty">
          <span><BarChart3 size={27} /></span>
          <h2>매장을 선택하면 분석이 시작됩니다</h2>
          <p>일별·주별·월별·연도별 조회수와 고객 반응이 높은 요일을 확인할 수 있습니다.</p>
        </section>
      ) : loading ? (
        <section className="dashboard-empty"><span className="dashboard-spinner" /><p>통계 데이터를 불러오는 중입니다.</p></section>
      ) : charts && (
        <>
          <div className="dashboard-context">
            <div>
              <Radio size={15} />
              <span>{selectedStore?.name ?? storeId}</span>
              <small>{storeId}</small>
              {isMaster && (
                <small className="dashboard-registrant">
                  {selectedStore?.registeredByName || '-'}
                  {selectedStore?.registeredByPhone ? ` · ${selectedStore.registeredByPhone}` : ''}
                </small>
              )}
            </div>
            <p>마지막으로 완료된 집계 데이터 기준</p>
          </div>

          <div className="insight-grid">
            <article className="insight-card total">
              <span><MousePointerClick /></span>
              <div><small>현재 누적 조회수</small><strong>{Number(charts.currentHitCount || 0).toLocaleString()}회</strong><p>현재 등록된 태그의 조회수 합계</p></div>
            </article>
            <article className="insight-card current">
              <span><CalendarDays /></span>
              <div><small>최근 월 최다 조회 요일</small><strong>{charts.latestMonthMostClickedDayOfWeek ?? '데이터 없음'}</strong><p>가장 최근 완료된 월의 일별 집계 기준</p></div>
            </article>
            <article className="insight-card annual">
              <span><TrendingUp /></span>
              <div><small>최근 결산 최다 조회 요일</small><strong>{annualMostClickedDay ?? '데이터 없음'}</strong><p>끝난 해 결산 기준, 없으면 월별 최다 요일 빈도</p></div>
            </article>
          </div>

          <div className="dashboard-chart-grid">
            <section className="chart-panel hourly-chart">
              <div className="chart-heading">
                <div>
                  <span>TODAY</span>
                  <h2>오늘 조회수</h2>
                  <p>실시간 · {todayTotal.toLocaleString()}회</p>
                  <Settlement>
                    {todayPace?.kind === 'progress' ? (
                      <p>어제대비 <b>{todayPace.pct}%</b> 태그 진행 중</p>
                    ) : null}
                    {todayPace?.kind === 'ahead' ? (
                      <p>어제대비 <b className="delta-up">{todayPace.pct}%</b> 더 많은 태그를 기록 중입니다</p>
                    ) : null}
                    {todayPace?.kind === 'even' ? (
                      <p>어제와 같은 조회수를 기록 중입니다</p>
                    ) : null}
                    {todayPace?.kind === 'new' ? (
                      <p>오늘은 조회가 진행 중이에요</p>
                    ) : null}
                  </Settlement>
                </div>
                <b>LIVE</b>
              </div>
              <div className="chart-body">
                {!hasTodayHours ? <ChartEmpty /> : (
                  <ScrollChart points={24} minPointWidth={36}>
                    <BarChart data={charts.todayHourly} margin={{ top: 8, right: 12, left: -18, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f5" />
                      <XAxis dataKey="label" tick={chartAxis} axisLine={false} tickLine={false} interval={1} minTickGap={12} />
                      <YAxis tick={chartAxis} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip type="hour" />} />
                      <Bar dataKey="count" fill="#0f766e" radius={[5, 5, 0, 0]} maxBarSize={22} />
                    </BarChart>
                  </ScrollChart>
                )}
              </div>
            </section>

            <section className="chart-panel daily-chart">
              <div className="chart-heading">
                <div>
                  <span>DAILY</span>
                  <h2>일별 조회수</h2>
                  <p>최근 완료된 2주</p>
                  <Settlement>
                    {charts.yesterdayMostClickedHour
                      ? <p>어제는 {charts.yesterdayMostClickedHour}시에 가장 많이 태그를 했어요!</p>
                      : null}
                    <TrendLines
                      peakText={dailyTrend.peakText}
                      compareText={dailyTrend.compareText}
                      delta={dailyTrend.delta}
                    />
                  </Settlement>
                </div>
                <b>14 DAYS</b>
              </div>
              <div className="chart-body">
                {!charts.daily?.length ? <ChartEmpty /> : (
                  <ScrollChart points={charts.daily.length} minPointWidth={42}>
                    <BarChart data={charts.daily} margin={{ top: 8, right: 12, left: -18, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f5" />
                      <XAxis dataKey="date" tickFormatter={formatDate} tick={chartAxis} axisLine={false} tickLine={false} interval={0} minTickGap={8} />
                      <YAxis tick={chartAxis} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip type="day" />} />
                      <Bar dataKey="count" fill="#416cea" radius={[5, 5, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ScrollChart>
                )}
              </div>
            </section>

            <section className="chart-panel weekly-chart">
              <div className="chart-heading">
                <div>
                  <span>WEEKLY</span>
                  <h2>주별 조회수</h2>
                  <p>최근 완료된 5개월</p>
                  <Settlement>
                    {lastWeekDay ? <p>지난주에는 {lastWeekDay}요일 태그가 가장 많았어요</p> : null}
                    <TrendLines
                      peakText={weeklyTrend.peakText}
                      compareText={weeklyTrend.compareText}
                      delta={weeklyTrend.delta}
                    />
                  </Settlement>
                </div>
                <b>5 MONTHS</b>
              </div>
              <div className="chart-body">
                {!charts.weekly?.length ? <ChartEmpty /> : (
                  <ScrollChart points={charts.weekly.length} minPointWidth={64}>
                    <AreaChart data={charts.weekly} margin={{ top: 8, right: 16, left: -18, bottom: 4 }}>
                      <defs><linearGradient id="weeklyFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#416cea" stopOpacity={0.28} /><stop offset="100%" stopColor="#416cea" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f5" />
                      <XAxis dataKey="weekStartDate" tickFormatter={formatDate} tick={chartAxis} axisLine={false} tickLine={false} interval={0} minTickGap={12} padding={{ left: 12, right: 12 }} />
                      <YAxis tick={chartAxis} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip type="week" />} />
                      <Area type="monotone" dataKey="count" stroke="#416cea" strokeWidth={2} fill="url(#weeklyFill)" />
                    </AreaChart>
                  </ScrollChart>
                )}
              </div>
            </section>

            <section className="chart-panel monthly-chart">
              <div className="chart-heading">
                <div>
                  <span>MONTHLY</span>
                  <h2>월별 조회수</h2>
                  <p>최근 완료된 1년 · 막대에 마우스를 올려 최다 요일 확인</p>
                  <Settlement>
                    {lastMonthDay && charts.lastMonthMostClickedHour
                      ? <p>저번달에는 {lastMonthDay}요일 탭이 가장 많았고, {charts.lastMonthMostClickedHour}에 가장 많이 이용했어요</p>
                      : lastMonthDay
                        ? <p>저번달에는 {lastMonthDay}요일 탭이 가장 많았어요</p>
                        : charts.lastMonthMostClickedHour
                          ? <p>저번달에는 {charts.lastMonthMostClickedHour}에 가장 많이 이용했어요</p>
                          : null}
                    <TrendLines
                      peakText={monthlyTrend.peakText}
                      compareText={monthlyTrend.compareText}
                      delta={monthlyTrend.delta}
                    />
                  </Settlement>
                </div>
                <b>12 MONTHS</b>
              </div>
              <div className="chart-body large">
                {!charts.monthly?.length ? <ChartEmpty /> : (
                  <ScrollChart points={charts.monthly.length} minPointWidth={72}>
                    <BarChart data={charts.monthly} margin={{ top: 10, right: 16, left: -12, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f5" />
                      <XAxis dataKey="monthStartDate" tickFormatter={formatMonth} tick={chartAxis} axisLine={false} tickLine={false} interval={0} minTickGap={10} />
                      <YAxis tick={chartAxis} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip type="month" />} />
                      <Bar dataKey="count" fill="#1b9b69" radius={[5, 5, 0, 0]} maxBarSize={38} />
                    </BarChart>
                  </ScrollChart>
                )}
              </div>
            </section>

            <section className="chart-panel yearly-chart">
              <div className="chart-heading">
                <div>
                  <span>YEARLY</span>
                  <div className="chart-heading-row">
                    <h2>연도별 조회수</h2>
                    <button
                      className="button ghost compact chart-pdf-btn"
                      type="button"
                      onClick={() => setPdfOpen(true)}
                      disabled={!charts.yearly?.length}
                    >
                      <FileDown size={13} />
                      PDF로 저장
                    </button>
                  </div>
                  <p>끝난 해 결산 · 한해 조회수와 최다 요일</p>
                  <Settlement>
                    {charts.lastYearCount != null && lastYearDay && charts.lastYearMostClickedHour
                      ? <p>지난해에는 총 태그가 {Number(charts.lastYearCount).toLocaleString()}회였고, 가장 많이 이용한 요일은 {lastYearDay}요일이며 {charts.lastYearMostClickedHour}에 가장 활발했어요</p>
                      : charts.lastYearCount != null && lastYearDay
                        ? <p>지난해에는 총 태그가 {Number(charts.lastYearCount).toLocaleString()}회였고, 가장 많이 이용한 요일은 {lastYearDay}요일이에요</p>
                        : charts.lastYearCount != null && charts.lastYearMostClickedHour
                          ? <p>지난해에는 총 태그가 {Number(charts.lastYearCount).toLocaleString()}회였고, {charts.lastYearMostClickedHour}에 가장 활발했어요</p>
                          : charts.lastYearCount != null
                            ? <p>지난해에는 총 태그가 {Number(charts.lastYearCount).toLocaleString()}회예요</p>
                            : null}
                    <TrendLines
                      peakText={yearlyTrend.peakText}
                      compareText={yearlyTrend.compareText}
                      delta={yearlyTrend.delta}
                    />
                  </Settlement>
                </div>
                <b>YEAR</b>
              </div>
              <div className="chart-body">
                {!charts.yearly?.length ? <ChartEmpty /> : (
                  <ScrollChart points={charts.yearly.length} minPointWidth={72}>
                    <BarChart data={charts.yearly} margin={{ top: 8, right: 16, left: -18, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f5" />
                      <XAxis dataKey="year" tick={chartAxis} axisLine={false} tickLine={false} interval={0} minTickGap={16} />
                      <YAxis tick={chartAxis} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip type="year" />} />
                      <Bar dataKey="count" fill="#c2410c" radius={[5, 5, 0, 0]} maxBarSize={38} />
                    </BarChart>
                  </ScrollChart>
                )}
              </div>
            </section>
          </div>

          <YearPdfModal
            open={pdfOpen}
            onClose={() => setPdfOpen(false)}
            yearly={charts.yearly ?? []}
            monthly={charts.monthly ?? []}
            storeName={selectedStore?.name}
            storeId={storeId}
          />

          {(charts.tagRedirectStats ?? []).length > 0 && (
            <section className="tag-redirect-stats" aria-label="태그별 리다이렉트 조회수">
              <div className="chart-heading">
                <div><span>TAG REDIRECT</span><h2>태그별 이동 조회수</h2><p>타입을 추가하면 도넛에 바로 반영됩니다.</p></div>
              </div>
              {(charts.tagRedirectStats ?? []).map((tag) => (
                <TagRedirectStatsCard
                  key={tag.tagId}
                  tagId={tag.tagId}
                  nickname={tag.nickname}
                  items={tag.items ?? []}
                />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}

function ChartEmpty() {
  return <div className="chart-empty"><BarChart3 size={21} /><span>집계된 데이터가 없습니다.</span></div>
}

export default StatisticsPage
