import RetapLogo from '../../common/components/RetapLogo'

const factChecks = [
  {
    number: '01',
    title: '평점 1점 상승 = 매출 5%~9% 수직 상승!',
    points: [
      '온라인 평점 1스타(1-Star) 상승 시 독립 자영업 매장의 실질 매출 5%~9% 즉각 상승 검증',
    ],
    source: '하버드 경영대학원(Harvard Business School) Michael Luca 교수 연구팀, 논문 『Reviews, Reputation, and Revenue: The Case of Yelp.com』',
  },
  {
    number: '02',
    title: '오프라인 방문객 97%의 리뷰 검색 & 93% 구매 전환',
    points: [
      '지역 매장 방문 전 소비자의 97%가 온라인 리뷰를 확인하며, 84%는 지인 추천만큼 신뢰',
      '리뷰를 확인한 소비자의 93%가 실제 매장 방문 및 결제로 직행',
    ],
    source: '글로벌 마케팅 조사기관 BrightLocal Consumer Review Survey & Nielsen Global Trust Report',
  },
  {
    number: '03',
    title: '네이버·구글 플레이스 로컬 SEO 상위 노출 3위 (15% 비중)',
    points: [
      '리뷰 수량, 유입 속도(Velocity), 최신성은 지도 검색 알고리즘 순위 결정 요인 중 3위(15%) 차지',
    ],
    source: '글로벌 검색엔진 최적화(SEO) 전문 분석 기관 Moz Local Ranking Factors Report',
  },
  {
    number: '04',
    title: "Top 3 진입률 69.1%와 '4.8~4.9점 스위트 스팟'",
    points: [
      '200개 이상의 진짜 리뷰를 축적한 매장의 지도 검색 상위 3위 이내 노출률 68.9%~73.0% 달성',
    ],
    source: '지역 검색 데이터 분석 기관 Localo (16,098개 비즈니스 프로필 실증 분석)',
  },
  {
    number: '05',
    title: 'QR 대비 리뷰 수집량 +38% 증가',
    points: [
      '1단계 즉각 태그(NFC)는 QR 대비 고객 이탈(85~90%)을 차단하여 동일 환경 대비 수집량 38% 증대',
    ],
    source: '국제 리테일 학술지 IJRDM (International Journal of Retail & Distribution Management)',
  },
]

function CompanyPage() {
  return (
    <>
      <section className="subpage-hero company-hero">
        <div className="public-container subpage-hero-inner">
          <span className="public-kicker">ABOUT RE:TAP</span>
          <h1>오프라인 매장과 온라인 신뢰를<br />잇는 디지털 포털</h1>
          <p>
            RE:TAP은 테이블 위의 터치 한 번을<br />
            매장의 가장 강력한 온라인 평판 자산으로 바꿉니다.
          </p>
        </div>
      </section>

      <section className="public-section">
        <div className="public-container story-grid">
          <div className="story-visual" aria-hidden="true">
            <div className="story-glow" />
            <div className="story-ripple story-ripple-a" />
            <div className="story-ripple story-ripple-b" />
            <div className="story-symbol"><RetapLogo /></div>
            <span className="story-tag tag-a">Trust</span>
            <span className="story-tag tag-b">Review</span>
            <span className="story-tag tag-c">Offline</span>
          </div>
          <div className="section-heading story-copy">
            <span>BRAND VISION</span>
            <h2>브랜드 비전</h2>
            <p>오프라인 매장과 온라인 신뢰를 잇는 디지털 포털</p>
            <p>
              RE:TAP은 테이블 위의 터치 한 번을 매장의 가장 강력한
              온라인 평판 자산으로 바꿉니다.
            </p>
          </div>
        </div>
      </section>

      <section className="public-section soft-section">
        <div className="public-container">
          <div className="section-heading centered">
            <span>FACT-BASED DATA</span>
            <h2>학술 논문 및 글로벌 연구기관<br />팩트체크</h2>
            <p>리뷰가 매출과 노출에 미치는 영향을 검증된 데이터로 확인하세요.</p>
          </div>

          <div className="fact-list">
            {factChecks.map((item) => (
              <article className="fact-card" key={item.number}>
                <span className="fact-number">{item.number}</span>
                <div className="fact-body">
                  <h3>{item.title}</h3>
                  <ul>
                    {item.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                  <p className="fact-source">[출처] {item.source}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default CompanyPage
