import { useEffect } from 'react'
import { CheckCircle2, Home, Store } from 'lucide-react'
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
      <section className="login-card onboard-complete-card" aria-labelledby="onboard-complete-title">
        <div className="onboard-complete-hero">
          <span className="onboard-complete-check" aria-hidden="true">
            <CheckCircle2 size={34} />
          </span>
          <span className="onboard-complete-kicker">REGISTRATION COMPLETE</span>
          <h1 id="onboard-complete-title">매장이 등록되었습니다</h1>
          <p className="onboard-complete-lead">
            태그 연결이 완료되었습니다.
            <br />
            다음 태그부터는 등록된 주소로 바로 이동합니다.
          </p>
        </div>

        <ul className="onboard-complete-points">
          <li>
            <strong>이번 등록</strong>
            <span>현재 태그가 매장에 연결되었습니다.</span>
          </li>
          <li>
            <strong>다음 태그</strong>
            <span>같은 태그/QR를 다시 찍으면 등록된 리다이렉트 주소로 이동합니다.</span>
          </li>
          {tagId && (
            <li>
              <strong>태그 ID</strong>
              <span className="mono">{tagId}</span>
            </li>
          )}
        </ul>

        <div className="onboard-complete-actions">
          <Link className="button primary" to="/admin/management/stores">
            <Store size={16} /> 매장조회 가기
          </Link>
          <Link className="button ghost" to="/">
            <Home size={16} /> 홈으로
          </Link>
        </div>
      </section>
    </main>
  )
}

export default OnboardingCompletePage
