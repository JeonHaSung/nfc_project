import { useEffect } from 'react'
import { CheckCircle2, Home } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

function OnboardingCompletePage() {
  const [searchParams] = useSearchParams()
  const tagId = searchParams.get('ti') || ''
  const attached = searchParams.get('kind') === 'attach'
  const quick = searchParams.get('quick') === '1'

  useEffect(() => {
    const lockUrl = window.location.href
    const blockPop = () => {
      window.history.pushState({ onboardComplete: true }, '', lockUrl)
    }

    window.history.replaceState({ onboardComplete: true }, '', lockUrl)
    for (let i = 0; i < 8; i += 1) {
      window.history.pushState({ onboardComplete: true }, '', lockUrl)
    }
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
          <h1 id="onboard-complete-title">
            {attached ? '카드가 등록되었습니다' : '매장이 등록되었습니다'}
          </h1>
          <p className="onboard-complete-lead">
            태그 연결이 완료되었습니다.
            <br />
            {quick
              ? '다음부터 이 태그를 찍으면 지정한 주소로 바로 이동합니다.'
              : '다음부터 이 태그를 찍으면 등록된 서비스 목록에서 골라 이동합니다.'}
          </p>
        </div>

        <ul className="onboard-complete-points">
          <li>
            <strong>이번 등록</strong>
            <span>
              {attached
                ? '현재 태그가 선택한 매장에 연결되었습니다.'
                : '현재 태그가 새 매장에 연결되었습니다.'}
            </span>
          </li>
          <li>
            <strong>다음 태그</strong>
            <span>
              {quick
                ? '같은 태그/QR를 다시 찍으면 빠른이동 주소로 바로 갑니다.'
                : '같은 태그/QR를 다시 찍으면 등록된 서비스 목록에서 골라 이동합니다.'}
            </span>
          </li>
          {tagId && (
            <li>
              <strong>태그 ID</strong>
              <span className="mono">{tagId}</span>
            </li>
          )}
        </ul>

        <div className="onboard-complete-actions">
          <Link className="button primary" to="/">
            <Home size={16} /> 메인으로
          </Link>
        </div>
      </section>
    </main>
  )
}

export default OnboardingCompletePage
