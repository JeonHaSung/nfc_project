import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <>
      <section className="subpage-hero">
        <div className="public-container subpage-hero-inner">
          <span className="public-kicker">404 NOT FOUND</span>
          <h1>잘못된 주소입니다</h1>
          <p>요청하신 페이지가 없거나 주소가 변경되었습니다.<br />입력한 주소를 다시 확인해 주세요.</p>
        </div>
      </section>

      <section className="public-section">
        <div className="public-container not-found-content">
          <Link className="public-button primary" to="/">
            <ArrowLeft size={17} /> 홈으로 돌아가기
          </Link>
        </div>
      </section>
    </>
  )
}

export default NotFoundPage
