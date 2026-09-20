import { BarChart3 } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

function TagRedirectStatsCard({ tagId, nickname, items = [] }) {
  const hasCounts = items.some((item) => Number(item.count || 0) > 0)

  return (
    <article className="tag-redirect-card">
      <div className="tag-redirect-meta">
        {tagId && <small>{tagId}</small>}
        <h3>{nickname || '별칭 없음'}</h3>
        <ul className="tag-redirect-counts">
          {items.map((item) => (
            <li key={item.id || item.type}>
              <span>
                <i style={{ background: item.color }} />
                {item.label}
              </span>
              <strong>{Number(item.count || 0).toLocaleString()}회</strong>
            </li>
          ))}
          {items.length === 0 && <li className="muted">등록된 리다이렉트가 없습니다.</li>}
        </ul>
      </div>
      <div className="tag-redirect-donut">
        {hasCounts ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={items.map((item) => ({
                  name: item.label,
                  value: Number(item.count || 0),
                  color: item.color,
                }))}
                dataKey="value"
                nameKey="name"
                innerRadius={42}
                outerRadius={68}
                paddingAngle={2}
              >
                {items.map((item) => (
                  <Cell key={item.id || item.type} fill={item.color || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${Number(value).toLocaleString()}회`, '조회수']} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-empty">
            <BarChart3 size={21} />
            <span>집계된 데이터가 없습니다.</span>
          </div>
        )}
      </div>
    </article>
  )
}

export default TagRedirectStatsCard
