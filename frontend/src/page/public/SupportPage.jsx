import SupportChannels from '../../common/components/SupportChannels'

function SupportPage() {
  return (
    <>
      <section className="subpage-hero support-hero">
        <div className="public-container subpage-hero-inner">
          <span className="public-kicker">CUSTOMER SUPPORT</span>
          <h1>무엇을 도와드릴까요?</h1>
          <p>
            서비스 도입부터 제품 선택, 운영 중 궁금한 점까지<br />
            RETAP 팀이 함께 답을 찾아드립니다.
          </p>
        </div>
      </section>

      <section className="public-section">
        <div className="public-container support-channels">
          <div className="section-heading centered">
            <span>GET IN TOUCH</span>
            <h2>편한 방법으로 문의해 주세요</h2>
            <p>이메일 또는 카카오톡 채널로 남겨주시면 영업일 기준 빠르게 안내드립니다.</p>
          </div>
          <SupportChannels />
        </div>
      </section>
    </>
  )
}

export default SupportPage
