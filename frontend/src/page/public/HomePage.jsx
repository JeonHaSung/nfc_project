import { ArrowRight, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import RetapLogo from '../../common/components/RetapLogo'

const costCompareRows = [
  ['월간 고정비', '매월 30~100만 원 구독료', '월 구독료 0원\n(단 1회 구매로 평생 소장)'],
  ['계정 안전성', 'AI 탐지로 매장 블라인드 및 제재 위험', '100% 정상 실방문객 리뷰\n(계정 제재 0%)'],
  ['리뷰 수집 방식', '가짜 트래픽 조작 (단기적 효과)', '스마트폰 터치 1초\n(영구적 자산 축적)'],
  ['소비 효율', '매달 빠져나가는 소모성 지출', '가장 합리적이고 영구적인\n1회성 투자'],
]

const channelCompareRows = [
  ['이동 단계', '4~5단계 (앱실행/검색/선택)', '2~3단계 (카메라/초점인식)', '1단계 (스마트폰 접촉)'],
  ['소요 시간', '평균 25초 ~ 40초', '평균 8초 ~ 12초', '1초 미만 즉시 진입'],
  ['이탈/위험', '고객의 85%~90% 도중 이탈', '큐싱(피싱) 위험, 인식 지연', '이탈 제로 / 칩 암호화 보안'],
  ['리뷰 수집량', '기준점 (매우 낮음)', '기준점', 'QR 대비 +38% 증가 검증'],
]

const whyPointsTop = [
  {
    title: '월 구독료 0원, 완벽한 소비 효율',
    text: '매달 빠져나가는 불필요한 마케팅 유지비가 전혀 없습니다. 단 한 번의 결제로 매장 운영 기간 내내 평생 무료로 사용하세요.',
  },
  {
    title: '손끝 1초, 가장 빠르고 편한 연결',
    text: '검색하고, 찾고, 들어가는 복잡한 과정은 끝났습니다. 손님이 스마트폰을 카드에 대기만 하면 1초 만에 리뷰 작성 페이지로 직행합니다.',
  },
]

const whyPointsBottom = [
  {
    title: '매장 블라인드 위험 제로 (100% 실방문객)',
    text: '가짜 리뷰 조작으로 인한 네이버/구글 계정 정지 불안에서 벗어나세요. 매장을 직접 방문해 만족한 진짜 고객의 자발적 리뷰만 차곡차곡 쌓입니다.',
  },
  {
    title: "단순한 카드가 아닌 '신뢰 매장 인증 마크'",
    text: 'RE:TAP은 조작 없이 진짜 손님의 평가를 투명하게 수용하는 정직한 매장임을 증명하는 오프라인 인증 마크입니다. 테이블 위에 올려두는 것만으로도 방문객에게 확실한 신뢰와 브랜드 프리미엄을 심어줍니다.',
  },
]

function HomePage() {
  return (
    <>
      <section className="public-hero">
        <div className="public-orb orb-one" />
        <div className="public-orb orb-two" />
        <div className="public-container hero-grid">
          <div className="hero-copy">
            <span className="public-kicker">Smart Review Solution For Businesses</span>
            <h1 className="hero-title">
              <span className="hero-title-line">오프라인 매장을 위한</span>
              <em className="hero-title-line">가장 스마트한 리뷰 솔루션</em>
            </h1>
            <p>
              매달 나가는 마케팅비는 이제 0원으로 줄이고,
              진짜 고객의 신뢰를 영구히 소장하세요.
            </p>
            <div className="hero-actions">
              <Link className="public-button primary" to="/products">
                제품 둘러보기 <ArrowRight size={17} />
              </Link>
              <Link className="public-button secondary" to="/support">도입 문의하기</Link>
            </div>
          </div>

          <div className="tap-visual review-visual" aria-label="휴대폰으로 RE:TAP 카드 태그하는 모습">
            <div className="visual-glow" />
            <div className="tag-scene">
              <div className="product-card">
                <RetapLogo className="product-card-logo" alt="RE:TAP" />
                <div className="review-stars product-stars" aria-label="별점 5점">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star key={index} size={16} fill="currentColor" strokeWidth={0} />
                  ))}
                </div>
                <p className="product-thanks">[소중한 리뷰 감사합니다]</p>
                <div className="product-divider" />
                <div className="product-actions">
                  <div className="product-nfc" aria-hidden="true">
                    <span className="product-nfc-waves" />
                    <small>NFC</small>
                  </div>
                  <div className="product-qr" aria-hidden="true" />
                </div>
                <p className="product-hint">휴대폰을 카드 NFC에 대어주세요</p>
              </div>

              <div className="phone-mockup review-phone">
                <div className="phone-bar" />
                <div className="phone-content review-phone-content">
                  <div className="nfc-toast" role="status">
                    <span className="nfc-toast-icon" aria-hidden="true" />
                    <div>
                      <strong>웹사이트 NFC 태그</strong>
                      <p>Safari에서 &apos;retapnfc.com&apos; 열기</p>
                    </div>
                  </div>
                  <div className="review-site">
                    <div className="review-site-top">
                      <small>리뷰 작성</small>
                    </div>
                    <div className="review-site-stars" aria-hidden="true">
                      {Array.from({ length: 5 }, (_, index) => (
                        <Star key={index} size={14} fill="currentColor" strokeWidth={0} />
                      ))}
                    </div>
                    <strong className="review-site-title">방문 경험을 남겨 주세요</strong>
                    <p className="review-site-copy">매장 이용은 어떠셨나요? 솔직한 리뷰가 다음 손님에게 큰 도움이 됩니다.</p>
                    <div className="review-site-field">맛있어요 / 친절해요 / 또 오고 싶어요</div>
                    <button className="review-site-submit" type="button">리뷰 등록하기</button>
                  </div>
                </div>
              </div>

              <div className="tap-pulse" aria-hidden="true" />
            </div>
            <div className="tap-ripple ripple-one" />
            <div className="tap-ripple ripple-two" />
          </div>
        </div>
      </section>

      <section className="public-section home-pitch">
        <div className="public-container home-pitch-inner">
          <span className="public-kicker">STOP FAKE REVIEW COSTS</span>
          <h2>매달 나가는 가짜 리뷰 대행비 수십만 원,<br />아직도 내고 계신가요?</h2>
          <p>
            위험한 가짜 리뷰에 매달 지출하던 고정비를 멈추고,
            단 한 번의 도입으로 진짜 손님의 솔직한 리뷰를 영구히 모으세요.
          </p>
        </div>
      </section>

      <section className="public-section compare-dark-section">
        <div className="public-container">
          <div className="section-heading centered compare-heading-light">
            <span>COST COMPARISON</span>
            <h2>매월 수십만 원 가짜 마케팅<br />vs 단 1회 결제 RE:TAP</h2>
          </div>
          <div className="compare-table-wrap dark">
            <table className="compare-table">
              <thead>
                <tr>
                  <th scope="col">비교 항목</th>
                  <th scope="col">기존 불법 리뷰 대행</th>
                  <th scope="col">RE:TAP</th>
                </tr>
              </thead>
              <tbody>
                {costCompareRows.map(([item, legacy, retap]) => (
                  <tr key={item}>
                    <th scope="row">{item}</th>
                    <td>{legacy}</td>
                    <td className="highlight">{retap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="public-section home-why">
        <div className="public-container">
          <div className="section-heading centered">
            <span>WHY RE:TAP</span>
            <h2>왜 사장님들은 RE:TAP을 선택할까요?</h2>
          </div>

          <div className="why-point-list">
            {whyPointsTop.map((point) => (
              <article className="why-point" key={point.title}>
                <h3>{point.title}</h3>
                <p>{point.text}</p>
              </article>
            ))}
          </div>

          <div className="compare-table-wrap light">
            <table className="compare-table channel">
              <thead>
                <tr>
                  <th scope="col">비교 항목</th>
                  <th scope="col">기존 지도앱 직접 검색</th>
                  <th scope="col">종이/스티커 QR코드</th>
                  <th scope="col">RE:TAP NFC 카드</th>
                </tr>
              </thead>
              <tbody>
                {channelCompareRows.map(([item, mapApp, qr, retap]) => (
                  <tr key={item}>
                    <th scope="row">{item}</th>
                    <td>{mapApp}</td>
                    <td>{qr}</td>
                    <td className="highlight">{retap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="compare-footnote">
              *출처: IJRDN(국제 리테일 학술지), Gartner, ElectroIQ의 실증 분석 통계 데이터
            </p>
          </div>

          <div className="why-point-list">
            {whyPointsBottom.map((point) => (
              <article className="why-point" key={point.title}>
                <h3>{point.title}</h3>
                <p>{point.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="public-container public-cta">
        <div>
          <span>READY TO CONNECT?</span>
          <h2>한 번의 도입으로<br />진짜 리뷰를 영구히 모으세요.</h2>
        </div>
        <Link className="public-button light" to="/support">
          도입 문의하기 <ArrowRight size={17} />
        </Link>
      </section>
    </>
  )
}

export default HomePage
