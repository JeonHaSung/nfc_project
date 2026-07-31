function TagStatusPage({ title, description }) {
  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-heading">
          <span>TAG</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </section>
    </main>
  )
}

export function TagNotReadyPage() {
  return (
    <TagStatusPage
      title="아직 사용할 수 없는 태그입니다"
      description="공장 발주 전 상태입니다. 엑셀 발급 후 공장 출고된 태그만 첫 등록이 가능합니다."
    />
  )
}

export function TagNotFoundPage() {
  return (
    <TagStatusPage
      title="태그를 찾을 수 없습니다"
      description="유효하지 않거나 삭제된 태그입니다."
    />
  )
}
