export const emptyPhoneParts = { part1: '010', part2: '', part3: '' }

export const joinPhoneParts = (parts) =>
  `${parts?.part1 || ''}${parts?.part2 || ''}${parts?.part3 || ''}`

function PhoneNumberFields({ idPrefix, value, onChange }) {
  const parts = value || emptyPhoneParts

  const updatePart = (key, maxLength, raw, nextFocusId) => {
    const digits = raw.replace(/\D/g, '').slice(0, maxLength)
    onChange({ ...parts, [key]: digits })
    if (digits.length === maxLength && nextFocusId) {
      document.getElementById(nextFocusId)?.focus()
    }
  }

  return (
    <div className="phone-parts" role="group" aria-label="휴대폰 번호">
      <div className="login-input phone-part">
        <input
          id={`${idPrefix}-phone-1`}
          name={`${idPrefix}-phone-1`}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={parts.part1}
          onChange={(event) => updatePart('part1', 3, event.target.value, `${idPrefix}-phone-2`)}
          placeholder="010"
          maxLength={3}
          required
          aria-label="휴대폰 앞자리"
        />
      </div>
      <span className="phone-part-sep" aria-hidden="true">-</span>
      <div className="login-input phone-part">
        <input
          id={`${idPrefix}-phone-2`}
          name={`${idPrefix}-phone-2`}
          type="tel"
          inputMode="numeric"
          value={parts.part2}
          onChange={(event) => updatePart('part2', 4, event.target.value, `${idPrefix}-phone-3`)}
          placeholder="0000"
          maxLength={4}
          required
          aria-label="휴대폰 중간자리"
        />
      </div>
      <span className="phone-part-sep" aria-hidden="true">-</span>
      <div className="login-input phone-part">
        <input
          id={`${idPrefix}-phone-3`}
          name={`${idPrefix}-phone-3`}
          type="tel"
          inputMode="numeric"
          value={parts.part3}
          onChange={(event) => updatePart('part3', 4, event.target.value)}
          placeholder="0000"
          maxLength={4}
          required
          aria-label="휴대폰 끝자리"
        />
      </div>
    </div>
  )
}

export default PhoneNumberFields
