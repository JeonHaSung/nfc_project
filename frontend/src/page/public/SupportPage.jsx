import { Clock3, Mail, MapPin, MessageCircleMore, Phone } from 'lucide-react'

function SupportPage() {
  return (
    <>
      <section className="subpage-hero support-hero">
        <div className="public-container subpage-hero-inner">
          <span className="public-kicker">CUSTOMER SUPPORT</span>
          <h1>무엇을 도와드릴까요?</h1>
          <p>서비스 도입부터 제품 선택, 운영 중 궁금한 점까지<br />RETAP 팀이 함께 답을 찾아드립니다.</p>
        </div>
      </section>

      <section className="public-section">
        <div className="public-container support-grid">
          <div className="support-info">
            <div className="section-heading"><span>GET IN TOUCH</span><h2>편한 방법으로<br />문의해 주세요.</h2><p>남겨주신 내용은 담당자가 확인 후 영업일 기준 1일 이내에 안내드립니다.</p></div>
            <div className="contact-list">
              <div><span><Mail /></span><p><small>이메일</small><strong>hello@retapnfc.com</strong></p></div>
              <div><span><Phone /></span><p><small>대표번호</small><strong>02-1234-5678</strong></p></div>
              <div><span><Clock3 /></span><p><small>운영시간</small><strong>평일 09:00 — 18:00</strong></p></div>
              <div><span><MapPin /></span><p><small>오피스</small><strong>서울특별시 성동구 성수이로</strong></p></div>
            </div>
          </div>

          <form className="contact-form" onSubmit={(event) => event.preventDefault()}>
            <div className="form-title"><MessageCircleMore /><div><h2>도입 문의</h2><p>아래 정보를 남겨주시면 맞춤 안내를 드립니다.</p></div></div>
            <div className="contact-form-grid">
              <label>이름<input placeholder="이름을 입력하세요" /></label>
              <label>연락처<input placeholder="010-0000-0000" /></label>
              <label className="full">이메일<input type="email" placeholder="email@example.com" /></label>
              <label className="full">문의 유형<select defaultValue=""><option value="" disabled>문의 유형을 선택하세요</option><option>서비스 도입</option><option>제품 구매</option><option>이용 문의</option><option>기타</option></select></label>
              <label className="full">문의 내용<textarea rows="6" placeholder="궁금한 내용을 자유롭게 작성해 주세요." /></label>
            </div>
            <label className="privacy-check"><input type="checkbox" /> 개인정보 수집 및 이용에 동의합니다.</label>
            <button className="public-button primary submit-button" type="submit">문의 내용 보내기</button>
          </form>
        </div>
      </section>
    </>
  )
}

export default SupportPage
