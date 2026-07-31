import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

function OnboardingCompletePage() {
  const [searchParams] = useSearchParams()
  const tagId = searchParams.get('ti') || ''

  useEffect(() => {
    const blockPop = () => {
      window.history.pushState(null, '', window.location.href)
    }
    window.history.pushState(null, '', window.location.href)
    window.addEventListener('popstate', blockPop)
    return () => window.removeEventListener('popstate', blockPop)
  }, [])

  return (
    <main className="login-page">
      <section className="login-card" style={{ maxWidth: 520 }}>
        <div className="login-heading">
          <span>DONE</span>
          <h1>등록이 완료되었습니다</h1>
          <p>
            앞으로 등록된 리다이렉트 주소로 이동됩니다.
            다시 태그를 하시면 리다이렉트로 이동합니다.
          </p>
          {tagId && <p className="muted">태그 ID: {tagId}</p>}
        </div>
        <div className="row-actions" style={{ justifyContent: 'center', marginTop: 20 }}>
          <Link className="button primary" to="/admin/management/stores">매장조회 가기</Link>
          <Link className="button ghost" to="/">홈으로</Link>
        </div>
      </section>
    </main>
  )
}

export default OnboardingCompletePage
