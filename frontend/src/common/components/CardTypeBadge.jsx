const labels = {
  STANDARD: '스탠다드',
  SPECIAL: '스페셜',
}

function CardTypeBadge({ value = 'STANDARD' }) {
  const normalized = value === 'SPECIAL' ? 'SPECIAL' : 'STANDARD'
  return (
    <span className={`card-type-badge ${normalized.toLowerCase()}`}>
      {labels[normalized]}
    </span>
  )
}

export default CardTypeBadge
