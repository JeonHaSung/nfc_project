import { CheckCircle2, CircleHelp, Link2, RadioTower, Store, Tags } from 'lucide-react'

const steps = [
  { icon: Store, number: '01', title: '매장 정보 등록', text: '매장명, 주소와 고객이 이동할 웹페이지 주소를 등록합니다.' },
  { icon: Tags, number: '02', title: '태그 만들기', text: 'NFC 또는 QR 유형을 선택하고 관리하기 쉬운 이름을 지정합니다.' },
  { icon: Link2, number: '03', title: '콘텐츠 연결', text: '메뉴, 제품 정보, 이벤트 등 보여주고 싶은 콘텐츠를 연결합니다.' },
  { icon: RadioTower, number: '04', title: '부착하고 시작', text: '고객이 쉽게 발견할 수 있는 위치에 태그를 부착하고 운영합니다.' },
]

function GuidePage() {
  return (
    <>
      <section className="subpage-hero guide-hero">
        <div className="public-container subpage-hero-inner">
          <span className="public-kicker">START GUIDE</span>
          <h1>처음이어도 괜찮아요.<br />네 단계면 충분합니다.</h1>
          <p>전문 장비나 복잡한 설정 없이<br />누구나 빠르게 NFC 서비스를 시작할 수 있습니다.</p>
        </div>
      </section>

      <section className="public-section">
        <div className="public-container guide-steps">
          {steps.map(({ icon: Icon, number, title, text }) => (
            <article className="guide-step" key={number}>
              <div className="guide-step-icon"><Icon /></div>
              <span>{number}</span>
              <h2>{title}</h2>
              <p>{text}</p>
              <CheckCircle2 />
            </article>
          ))}
        </div>
      </section>

      <section className="public-section soft-section">
        <div className="public-container faq-layout">
          <div className="section-heading"><span>FAQ</span><h2>자주 묻는 질문</h2><p>도입 전에 궁금한 내용을 먼저 확인해 보세요.</p><CircleHelp size={36} /></div>
          <div className="faq-list">
            {[
              ['별도의 앱을 설치해야 하나요?', '아니요. 대부분의 최신 스마트폰은 기본 NFC 기능만으로 태그를 인식하며 연결된 웹페이지가 바로 열립니다.'],
              ['연결한 주소는 나중에 바꿀 수 있나요?', '운영 중에도 콘텐츠를 유연하게 변경할 수 있도록 관리 기능을 단계적으로 제공하고 있습니다.'],
              ['NFC가 없는 휴대폰에서는 어떻게 하나요?', '동일한 목적지로 연결되는 QR 태그를 함께 운영해 모든 고객이 이용할 수 있습니다.'],
              ['여러 매장을 한 번에 관리할 수 있나요?', '매장별로 태그를 분류하고 이용 현황을 확인할 수 있어 여러 지점을 효율적으로 운영할 수 있습니다.'],
            ].map(([question, answer]) => (
              <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default GuidePage
