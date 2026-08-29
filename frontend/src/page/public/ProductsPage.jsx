import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import cardBlack from '../../assets/retap-card-black.png'
import cardWhite from '../../assets/retap-card-white.png'

const setupSteps = [
  {
    step: 'STEP 1',
    title: '매장명과 리뷰 URL 전달',
    text: '매장명과 원하시는 플랫폼의 리뷰 URL을 전달해 주세요.',
  },
  {
    step: 'STEP 2',
    title: '1:1 맞춤 URL 각인·검수',
    text: '본사 전담 엔지니어가 1:1 맞춤 URL 암호화 각인 및 검수를 진행합니다. (약 5분 소요)',
  },
  {
    step: 'STEP 3',
    title: '부착 후 즉시 사용',
    text: '완제품 수령 후 원하는 위치(테이블/카운터)에 부착하면 바로 사용할 수 있습니다.',
  },
]

function ProductsPage() {
  return (
    <>
      <section className="subpage-hero products-hero">
        <div className="public-container subpage-hero-inner">
          <span className="public-kicker">PRODUCT</span>
          <h1>매장에 바로 붙이는<br />RE:TAP 리뷰 카드</h1>
          <p>
            간편한 3단계 도입으로 5분 컷 세팅.<br />
            인테리어에 어울리는 프리미엄 아크릴 마감입니다.
          </p>
        </div>
      </section>

      <section className="public-section">
        <div className="public-container">
          <div className="section-heading centered">
            <span>COLOR OPTIONS</span>
            <h2>모던 블랙 / 클래식 화이트</h2>
            <p>프리미엄 아크릴 마감으로 어떤 매장 인테리어에도 자연스럽게 어울립니다.</p>
          </div>
          <div className="product-photo-grid">
            <figure className="product-photo-card">
              <img src={cardWhite} alt="RE:TAP 클래식 화이트 리뷰 카드" />
              <figcaption>Classic White</figcaption>
            </figure>
            <figure className="product-photo-card">
              <img src={cardBlack} alt="RE:TAP 모던 블랙 리뷰 카드" />
              <figcaption>Modern Black</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="public-section soft-section">
        <div className="public-container">
          <div className="section-heading centered">
            <span>5-MINUTE SETUP</span>
            <h2>간편한 3단계 도입 절차</h2>
            <p>도입을 원하시면 매장명과 리뷰를 받으실 URL만 전달해 주시면 됩니다.</p>
          </div>
          <div className="setup-steps">
            {setupSteps.map((item) => (
              <article className="setup-step" key={item.step}>
                <span>{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
          <p className="setup-note">
            도입을 원하시는 고객님은 매장명과 리뷰를 받으실 URL만 전달해 주시면 됩니다!
          </p>
        </div>
      </section>

      <section className="public-section">
        <div className="public-container product-support-panel">
          <div className="section-heading">
            <span>DESIGN & SUPPORT</span>
            <h2>인테리어 친화적 디자인<br />& 맞춤형 이벤트 지원</h2>
          </div>
          <ul className="product-support-list">
            <li>
              <strong>프리미엄 컬러</strong>
              <span>모던 블랙(Modern Black) / 클래식 화이트(Classic White) 아크릴 마감</span>
            </li>
            <li>
              <strong>맞춤형 리뷰 이벤트 스티커</strong>
              <span>
                &ldquo;리뷰 작성 시 음료수 서비스!&rdquo; 등 매장별 맞춤 문구 스티커 제작을 지원합니다.
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section className="public-container slim-cta">
        <div>
          <small>지금 바로 도입하시겠어요?</small>
          <h2>매장명과 리뷰 URL만 알려주시면 맞춤 제작을 도와드립니다.</h2>
        </div>
        <Link className="public-button primary" to="/support">
          제품 문의 <ArrowRight size={17} />
        </Link>
      </section>
    </>
  )
}

export default ProductsPage
