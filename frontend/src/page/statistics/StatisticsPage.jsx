import { useEffect, useMemo, useState } from 'react'
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
import { BarChart3, CalendarDays, MousePointerClick, Radio, Store, Tags, TrendingUp } from 'lucide-react'
import { getDashboardCharts, getDashboardSummary } from '../../api/dashboard/dashboardApi'
import { getStoreSelectList } from '../../api/store/storeApi'
import { useAuth } from '../../auth/AuthContext'
import StoreSelect from '../../common/components/StoreSelect'

const chartAxis = { fontSize: 10, fill: '#8b95a7' }

const formatDate = (value) => {
  if (!value) return '-'
  const [, month, day] = value.split('-')
  return `${Number(month)}.${Number(day)}`
}

const formatMonth = (value) => {
  if (!value) return '-'
  const [year, month] = value.split('-')
  return `${year.slice(2)}.${month}`
}

function ChartTooltip({ active, payload, label, type }) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="dashboard-tooltip">
      <strong>{type === 'month' ? formatMonth(label) : formatDate(label)}</strong>
      <span>조회수 <b>{Number(payload[0].value || 0).toLocaleString()}회</b></span>
      {type !== 'month' && (
        <span>누적 조회수 <b>{Number(data.cumulativeCount || 0).toLocaleString()}회</b></span>
      )}
      {type === 'month' && data.mostClickedDayOfWeek && (
        <span>최다 요일 <b>{data.mostClickedDayOfWeek}</b></span>
      )}
    </div>
  )
}

function StatisticsPage() {
  const { user } = useAuth()
  const isMaster = user?.role === 'MASTER'
  const [searchParams, setSearchParams] = useSearchParams()
  const [summary, setSummary] = useState({ storeCount: 0, tagCount: 0 })
  const [stores, setStores] = useState([])
  const [charts, setCharts] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const storeId = searchParams.get('storeId') ?? ''

  useEffect(() => {
    Promise.all([getDashboardSummary(), getStoreSelectList()])
      .then(([summaryResponse, storeResponse]) => {
        setSummary(summaryResponse.data ?? { storeCount: 0, tagCount: 0 })
        setStores(storeResponse.data ?? [])
      })
      .catch((error) => setMessage(error.message))
  }, [])

  useEffect(() => {
    if (!storeId) {
      setCharts(null)
      return
    }
    setLoading(true)
    setMessage('')
    getDashboardCharts(storeId)
      .then((response) => setCharts(response.data))
      .catch((error) => {
        setCharts(null)
        setMessage(error.message)
      })
      .finally(() => setLoading(false))
  }, [storeId])

  const annualMostClickedDay = useMemo(() => {
    const dayCounts = new Map()
    charts?.monthly?.forEach((item) => {
      const day = item.mostClickedDayOfWeek
      if (!day || day === '데이터 없음') return
      dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1)
    })
    let result = null
    let maxCount = 0
    dayCounts.forEach((count, day) => {
      if (count >= maxCount) {
        result = day
        maxCount = count
      }
    })
    return result
  }, [charts])

  const selectedStore = stores.find((storeItem) => storeItem.id === storeId)

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
          <div><small>등록된 태그</small><strong>{summary.tagCount.toLocaleString()}</strong><p>소속된 카드 수</p></div>
        </article>
      </div>

      <section className="dashboard-filter-panel">
        <div>
          <span className="eyebrow">STORE FILTER</span>
          <h2>분석할 매장을 선택하세요</h2>
        </div>
        <StoreSelect
          stores={stores}
          value={storeId}
          onChange={(value) => setSearchParams(value ? { storeId: value } : {})}
          showRegistrant={isMaster}
        />
      </section>

      {!storeId ? (
        <section className="dashboard-empty">
          <span><BarChart3 size={27} /></span>
          <h2>매장을 선택하면 분석이 시작됩니다</h2>
          <p>일별·주별·월별 조회수와 고객 반응이 높은 요일을 확인할 수 있습니다.</p>
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
              <div><small>최근 1년 최다 조회 요일</small><strong>{annualMostClickedDay ?? '데이터 없음'}</strong><p>12개월 월별 최다 요일 빈도 기준</p></div>
            </article>
          </div>

          <div className="dashboard-chart-grid">
            <section className="chart-panel daily-chart">
              <div className="chart-heading"><div><span>DAILY</span><h2>일별 조회수</h2><p>최근 완료된 2주</p></div><b>14 DAYS</b></div>
              <div className="chart-body">
                {!charts.daily?.length ? <ChartEmpty /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.daily} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f5" />
                      <XAxis dataKey="date" tickFormatter={formatDate} tick={chartAxis} axisLine={false} tickLine={false} />
                      <YAxis tick={chartAxis} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip type="day" />} />
                      <Bar dataKey="count" fill="#416cea" radius={[5, 5, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            <section className="chart-panel weekly-chart">
              <div className="chart-heading"><div><span>WEEKLY</span><h2>주별 조회수</h2><p>최근 완료된 5개월</p></div><b>5 MONTHS</b></div>
              <div className="chart-body">
                {!charts.weekly?.length ? <ChartEmpty /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.weekly} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                      <defs><linearGradient id="weeklyFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#416cea" stopOpacity={0.28} /><stop offset="100%" stopColor="#416cea" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f5" />
                      <XAxis dataKey="weekStartDate" tickFormatter={formatDate} tick={chartAxis} axisLine={false} tickLine={false} />
                      <YAxis tick={chartAxis} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip type="week" />} />
                      <Area type="monotone" dataKey="count" stroke="#416cea" strokeWidth={2} fill="url(#weeklyFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            <section className="chart-panel monthly-chart">
              <div className="chart-heading"><div><span>MONTHLY</span><h2>월별 조회수</h2><p>최근 완료된 1년 · 막대에 마우스를 올려 최다 요일 확인</p></div><b>12 MONTHS</b></div>
              <div className="chart-body large">
                {!charts.monthly?.length ? <ChartEmpty /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.monthly} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f5" />
                      <XAxis dataKey="monthStartDate" tickFormatter={formatMonth} tick={chartAxis} axisLine={false} tickLine={false} />
                      <YAxis tick={chartAxis} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip type="month" />} />
                      <Bar dataKey="count" fill="#1b9b69" radius={[5, 5, 0, 0]} maxBarSize={38} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  )
}

function ChartEmpty() {
  return <div className="chart-empty"><BarChart3 size={21} /><span>집계된 데이터가 없습니다.</span></div>
}

export default StatisticsPage
