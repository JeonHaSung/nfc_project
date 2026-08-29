import { Clock3, Mail, MessageCircleMore } from 'lucide-react'

export const KAKAO_CHAT_URL = 'http://pf.kakao.com/_rJDSX/chat'
export const SUPPORT_EMAIL = 'retapnfc@gmail.com'

function SupportChannels() {
  return (
    <>
      <div className="support-channel-grid">
        <a className="support-channel-card" href={`mailto:${SUPPORT_EMAIL}`}>
          <span className="support-channel-icon"><Mail /></span>
          <div>
            <small>이메일</small>
            <strong>{SUPPORT_EMAIL}</strong>
            <p>도입·제품·이용 관련 문의를 메일로 보내주세요.</p>
          </div>
        </a>

        <a
          className="support-channel-card kakao"
          href={KAKAO_CHAT_URL}
          target="_blank"
          rel="noreferrer"
        >
          <span className="support-channel-icon"><MessageCircleMore /></span>
          <div>
            <small>카카오톡 채널</small>
            <strong>RETAP 카카오톡 문의</strong>
            <p>카카오톡 플러스 친구로 바로 상담할 수 있습니다.</p>
          </div>
        </a>
      </div>

      <div className="support-hours">
        <Clock3 size={16} />
        <span>운영시간 평일 09:00 — 18:00</span>
      </div>
    </>
  )
}

export default SupportChannels
