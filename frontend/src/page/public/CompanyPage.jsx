import { HeartHandshake, Lightbulb, ShieldCheck, Users } from 'lucide-react'
import RetapLogo from '../../common/components/RetapLogo'

function CompanyPage() {
  return (
    <>
      <section className="subpage-hero">
        <div className="public-container subpage-hero-inner">
          <span className="public-kicker">ABOUT RETAP</span>
          <h1>기술은 보이지 않게,<br />경험은 선명하게.</h1>
          <p>우리는 사람과 공간 사이의 불편한 한 단계를 없애고,<br />누구나 자연스럽게 연결되는 세상을 만듭니다.</p>
        </div>
      </section>

      <section className="public-section">
        <div className="public-container story-grid">
          <div className="story-visual">
            <div className="story-symbol"><RetapLogo /></div>
            <span className="story-tag tag-a">Simple</span>
            <span className="story-tag tag-b">Connected</span>
            <span className="story-tag tag-c">Human</span>
          </div>
          <div className="section-heading story-copy">
            <span>OUR STORY</span>
            <h2>일상의 접점을<br />더 가치 있게 만듭니다</h2>
            <p>RETAP은 오프라인에서 좋은 정보가 고객에게 닿지 못하는 문제에서 시작했습니다. 복잡한 절차 대신 스마트폰을 가볍게 태그하는 행동 하나로 매장과 제품의 이야기가 전달되도록 설계합니다.</p>
            <p>기술 자체를 드러내기보다 사용자가 가장 편안하게 느끼는 경험을 만드는 것, 그것이 RETAP이 추구하는 연결입니다.</p>
          </div>
        </div>
      </section>

      <section className="public-section soft-section">
        <div className="public-container">
          <div className="section-heading centered"><span>OUR VALUES</span><h2>우리가 지키는 세 가지 원칙</h2></div>
          <div className="value-grid">
            {[
              { icon: Lightbulb, title: '쉽고 명확하게', text: '설명하지 않아도 이해되는 단순한 제품과 서비스를 만듭니다.' },
              { icon: Users, title: '사람을 중심으로', text: '모든 기술적 결정의 기준은 실제 사용자의 편안함입니다.' },
              { icon: ShieldCheck, title: '신뢰할 수 있게', text: '안정적인 운영과 투명한 데이터로 오래가는 관계를 만듭니다.' },
            ].map(({ icon: Icon, title, text }) => (
              <article className="value-card" key={title}><Icon /><h3>{title}</h3><p>{text}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section">
        <div className="public-container company-message">
          <HeartHandshake size={32} />
          <p>“좋은 연결은 기술을 의식하지 않는 순간 완성됩니다.”</p>
          <span>RETAP Team</span>
        </div>
      </section>
    </>
  )
}

export default CompanyPage
