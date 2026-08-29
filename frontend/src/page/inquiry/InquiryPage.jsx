import SupportChannels from '../../common/components/SupportChannels'

function InquiryPage() {
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">INQUIRY</span>
          <h1>문의</h1>
          <p>서비스 도입부터 제품 선택, 운영 중 궁금한 점까지 RETAP 팀이 함께 답을 찾아드립니다.</p>
        </div>
      </div>

      <section className="panel inquiry-panel">
        <div className="inquiry-heading">
          <span>GET IN TOUCH</span>
          <h2>편한 방법으로 문의해 주세요</h2>
          <p>이메일 또는 카카오톡 채널로 남겨주시면 영업일 기준 빠르게 안내드립니다.</p>
        </div>
        <SupportChannels />
      </section>
    </div>
  )
}

export default InquiryPage
