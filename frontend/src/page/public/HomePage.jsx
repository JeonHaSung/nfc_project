import { ArrowRight, BarChart3, Check, MousePointerClick, RadioTower, Sparkles, Store, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

const benefits = [
  { icon: MousePointerClick, title: '탭 한 번의 경험', text: '앱 설치 없이 스마트폰을 태그하는 순간 원하는 콘텐츠로 연결됩니다.' },
  { icon: BarChart3, title: '데이터로 보는 반응', text: '태그별 이용 현황을 확인하고 고객 접점을 더 정교하게 운영합니다.' },
  { icon: Zap, title: '빠른 설치와 운영', text: '복잡한 장비 없이 태그를 부착하고 연결 주소만 설정하면 준비가 끝납니다.' },
]

function HomePage() {
  return (
    <>
      <section className="public-hero">
        <div className="public-orb orb-one" />
        <div className="public-orb orb-two" />
        <div className="public-container hero-grid">
          <div className="hero-copy">
            <span className="public-kicker"><Sparkles size={14} /> Offline, now connected</span>
            <h1>한 번의 탭으로<br /><em>경험을 연결하다</em></h1>
            <p>TapLink는 NFC 태그를 통해 매장, 제품, 고객을 가장 간단한 방식으로 연결하는 스마트 접점 플랫폼입니다.</p>
            <div className="hero-actions">
              <Link className="public-button primary" to="/products">제품 둘러보기 <ArrowRight size={17} /></Link>
              <Link className="public-button secondary" to="/guide">이용방법 알아보기</Link>
            </div>
            <div className="hero-trust">
              <span><Check size={14} /> 별도 앱 불필요</span>
              <span><Check size={14} /> 간편한 콘텐츠 변경</span>
              <span><Check size={14} /> 실시간 이용 집계</span>
            </div>
          </div>

          <div className="tap-visual" aria-label="NFC 태그 사용 예시">
            <div className="visual-glow" />
            <div className="phone-mockup">
              <div className="phone-bar" />
              <div className="phone-content">
                <span className="mini-brand"><RadioTower size={15} /> TAPLINK</span>
                <div className="phone-image"><Store size={42} /></div>
                <small>WELCOME TO</small>
                <strong>Blue Bottle Cafe</strong>
                <p>메뉴와 매장 이야기를 확인해 보세요.</p>
                <button type="button">매장 둘러보기</button>
              </div>
            </div>
            <div className="nfc-card">
              <span><RadioTower /></span>
              <small>SMART NFC</small>
              <strong>TAP HERE</strong>
            </div>
            <div className="tap-ripple ripple-one" />
            <div className="tap-ripple ripple-two" />
          </div>
        </div>
      </section>

      <section className="public-section">
        <div className="public-container">
          <div className="section-heading centered">
            <span>WHY TAPLINK</span>
            <h2>오프라인 경험을 더 가볍고,<br />운영은 더 똑똑하게</h2>
            <p>필요한 순간에 정확한 정보를 전달하고, 그 반응까지 한곳에서 확인하세요.</p>
          </div>
          <div className="benefit-grid">
            {benefits.map(({ icon: Icon, title, text }, index) => (
              <article className="public-card benefit-card" key={title}>
                <span className={`card-number c${index + 1}`}>0{index + 1}</span>
                <div className="feature-icon"><Icon /></div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section process-section">
        <div className="public-container process-grid">
          <div className="section-heading">
            <span>HOW IT WORKS</span>
            <h2>시작은 단순하게,<br />활용은 무한하게</h2>
            <p>매장을 등록하고 태그를 연결하면 고객과 만날 준비가 끝납니다.</p>
            <Link className="text-link" to="/guide">자세한 이용방법 <ArrowRight size={16} /></Link>
          </div>
          <div className="process-list">
            {[
              ['01', '매장 등록', '기본 정보와 고객에게 보여줄 연결 주소를 등록합니다.'],
              ['02', '태그 연결', 'NFC 또는 QR 태그에 알아보기 쉬운 별칭을 지정합니다.'],
              ['03', '부착 후 운영', '원하는 위치에 태그를 부착하고 반응 데이터를 확인합니다.'],
            ].map(([number, title, text]) => (
              <div className="process-item" key={number}>
                <span>{number}</span><div><h3>{title}</h3><p>{text}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="public-container public-cta">
        <div>
          <span>READY TO CONNECT?</span>
          <h2>당신의 공간에도<br />새로운 연결을 시작하세요.</h2>
        </div>
        <Link className="public-button light" to="/support">도입 문의하기 <ArrowRight size={17} /></Link>
      </section>
    </>
  )
}

export default HomePage
