const labels = {
  STANDARD: '스탠다드',
  PREMIUM: '프리미엄',
}

function CardTypeBadge({ value = 'STANDARD' }) {
  const normalized = String(value || 'STANDARD').trim().toUpperCase()
  return (
    <span className={`card-type-badge ${normalized.toLowerCase()}`}>
      {labels[normalized] || normalized}
    </span>
  )
}

export default CardTypeBadge
