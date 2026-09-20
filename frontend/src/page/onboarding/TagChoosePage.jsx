import { useEffect, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'

function TagChoosePage() {
  const [searchParams] = useSearchParams()
  const tagId = searchParams.get('ti') || ''
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!tagId) return
    setLoading(true)
    fetch(`/tag/choices?ti=${encodeURIComponent(tagId)}`)
      .then(async (response) => {
        const payload = await response.json()
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || '선택 목록을 불러오지 못했습니다.')
        }
        setItems(payload.data ?? [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [tagId])

  if (!tagId) return <Navigate to="/" replace />

  return (
    <main className="tag-choose-page">
      <section className="tag-choose-card">
        <span>RETAP</span>
        <h1>이동할 서비스를 선택하세요</h1>
        <p>원하는 리뷰·채널을 누르면 해당 페이지로 이동합니다.</p>
        {loading && <p className="tag-choose-status">불러오는 중...</p>}
        {error && <p className="tag-choose-status error">{error}</p>}
        {!loading && !error && items.length === 0 && (
          <p className="tag-choose-status">등록된 이동 주소가 없습니다.</p>
        )}
        <div className="tag-choose-list">
          {items.map((item) => (
            <a
              key={item.id}
              className="tag-choose-option"
              href={`/tag/go?ri=${item.id}`}
              style={{ '--choose-color': item.color }}
            >
              <i />
              <strong>{item.label}</strong>
            </a>
          ))}
        </div>
      </section>
    </main>
  )
}

export default TagChoosePage
