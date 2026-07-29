import { ArrowRight, Coffee, CreditCard, ExternalLink, LayoutGrid, Package, ShoppingBag, Store } from 'lucide-react'
import { Link } from 'react-router-dom'

const products = [
  { icon: CreditCard, badge: 'BEST', title: 'NFC 카드', text: '카운터와 테이블 어디에나 어울리는 슬림한 카드형 태그', tone: 'blue' },
  { icon: LayoutGrid, badge: 'FLEXIBLE', title: 'NFC 스티커', text: '제품 패키지와 진열대에 간편하게 부착하는 스티커형 태그', tone: 'mint' },
  { icon: Package, badge: 'PREMIUM', title: '테이블 스탠드', text: '브랜드 메시지와 태그를 함께 보여주는 맞춤형 스탠드', tone: 'violet' },
]

function ProductsPage() {
  return (
    <>
      <section className="subpage-hero products-hero">
        <div className="public-container subpage-hero-inner">
          <span className="public-kicker">STORE & PRODUCTS</span>
          <h1>어떤 공간에도 어울리는<br />스마트한 연결 도구</h1>
          <p>카페부터 쇼룸까지, 공간의 분위기는 그대로 유지하며<br />고객 경험에 새로운 접점을 더합니다.</p>
        </div>
      </section>

      <section className="public-section">
        <div className="public-container">
          <div className="section-heading split-heading"><div><span>PRODUCT LINEUP</span><h2>공간에 맞게 선택하세요</h2></div><p>작은 스티커부터 브랜드 맞춤형 스탠드까지<br />설치 환경에 최적화된 형태를 제공합니다.</p></div>
          <div className="product-grid">
            {products.map(({ icon: Icon, badge, title, text, tone }) => (
              <article className="product-card" key={title}>
                <div className={`product-preview ${tone}`}>
                  <span>{badge}</span>
                  <Icon />
                  <i />
                </div>
                <div className="product-info"><h3>{title}</h3><p>{text}</p><button type="button">자세히 보기 <ExternalLink size={14} /></button></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section soft-section">
        <div className="public-container">
          <div className="section-heading centered"><span>USE CASE</span><h2>다양한 매장에서 활용됩니다</h2></div>
          <div className="usecase-grid">
            {[
              { icon: Coffee, title: '카페·레스토랑', text: '디지털 메뉴, 원산지 정보, 이벤트 안내' },
              { icon: ShoppingBag, title: '리테일·팝업', text: '제품 상세 정보, 리뷰, 온라인 구매 연결' },
              { icon: Store, title: '쇼룸·전시장', text: '작품 해설, 브랜드 스토리, 상담 신청' },
              { icon: LayoutGrid, title: '공유공간', text: '시설 안내, 예약, 이용 수칙 전달' },
            ].map(({ icon: Icon, title, text }) => (
              <article className="usecase-card" key={title}><span><Icon /></span><h3>{title}</h3><p>{text}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="public-container slim-cta">
        <div><small>맞춤 제작이 필요하신가요?</small><h2>브랜드와 공간에 꼭 맞는 형태를 제안해 드립니다.</h2></div>
        <Link className="public-button primary" to="/support">제품 문의 <ArrowRight size={17} /></Link>
      </section>
    </>
  )
}

export default ProductsPage
