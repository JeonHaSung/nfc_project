import Modal from './Modal'

const PRIVACY_SECTIONS = [
  {
    title: '1. 수집·이용 목적',
    body: '총판(파트너) 계정 생성 및 이메일 인증, 아이디 찾기, 비밀번호 재설정, 담당 매장 NFC/QR 등록 및 관리, 서비스 관련 주요 공지 전달을 위해 개인정보를 수집·이용합니다.',
  },
  {
    title: '2. 수집 항목',
    body: '[필수] 이름, 연락처(전화번호), 이메일',
  },
  {
    title: '3. 보유 및 이용 기간',
    body: '파트너 계약 종료 또는 회원 탈퇴 시까지 보유합니다. 단, 관계 법령에 의하여 보존할 필요가 있는 경우 해당 기간까지 보관합니다.',
  },
  {
    title: '4. 동의 거부 권리',
    body: '개인정보 수집 동의를 거부할 수 있으나, 거부 시 시스템 이용 및 매장 등록이 제한될 수 있습니다.',
  },
  {
    title: '5. 비밀번호 및 보안',
    body: '비밀번호는 복호화가 불가능한 단방향 암호화(BCrypt)로 저장되며, 서비스 통신은 HTTPS(SSL/TLS) 환경에서 보호됩니다.',
  },
  {
    title: '6. 계정 삭제',
    body: '계정 삭제 요청 또는 관리자 삭제 시 해당 계정의 개인정보는 파기(마스킹) 처리되며 더 이상 이용할 수 없습니다.',
  },
]

export function PrivacyPolicyContent() {
  return (
    <div className="privacy-policy-content">
      <p className="privacy-policy-lead">
        RETAP 총판(파트너) 관리 시스템은 개인정보보호법을 준수하며, 아래와 같이 개인정보를 처리합니다.
      </p>
      {PRIVACY_SECTIONS.map((section) => (
        <section key={section.title}>
          <h3>{section.title}</h3>
          <p>{section.body}</p>
        </section>
      ))}
    </div>
  )
}

export function PrivacyPolicyModal({ onClose }) {
  return (
    <Modal
      title="개인정보 처리방침"
      description="총판(파트너) 계정 및 서비스 이용과 관련된 개인정보 처리 안내"
      onClose={onClose}
      wide
      actions={<button className="button primary" type="button" onClick={onClose}>확인</button>}
    >
      <PrivacyPolicyContent />
    </Modal>
  )
}

export function PrivacyConsentField({ checked, onChange, onOpenPolicy }) {
  return (
    <div className="privacy-consent">
      <label className="privacy-consent-check">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          required
        />
        <span>
          <strong>[필수]</strong> 개인정보 수집·이용에 동의합니다.
        </span>
      </label>
      <div className="privacy-consent-summary">
        <p>수집·이용 목적: 계정 생성 및 이메일 인증, 아이디 찾기, 비밀번호 재설정, 담당 매장 NFC/QR 등록 및 관리, 서비스 관련 주요 공지 전달</p>
        <p>수집 항목: [필수] 이름, 연락처(전화번호), 이메일</p>
        <p>보유 및 이용 기간: 파트너 계약 종료 또는 회원 탈퇴 시까지 (단, 관계 법령에 의하여 보존할 필요가 있는 경우 해당 기간까지)</p>
        <p>동의 거부 권리: 개인정보 수집 동의를 거부할 수 있으나, 거부 시 시스템 이용 및 매장 등록이 제한될 수 있습니다.</p>
      </div>
      <button className="privacy-policy-link" type="button" onClick={onOpenPolicy}>
        개인정보 처리방침 전체 보기
      </button>
    </div>
  )
}

export default PrivacyPolicyModal
