import { Plus, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'

function RedirectEditor({ types = [], items = [], onChange, disabled = false }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [draftType, setDraftType] = useState(null)
  const [draftValue, setDraftValue] = useState('')
  const [error, setError] = useState('')

  const typeMap = useMemo(
    () => Object.fromEntries((types || []).map((type) => [type.type, type])),
    [types],
  )
  const usedTypes = new Set((items || []).map((item) => item.type))
  const availableTypes = (types || []).filter((type) => !usedTypes.has(type.type))

  const commitDraft = () => {
    const value = draftValue.trim()
    if (!draftType) return
    if (!value) {
      setError('리다이렉트 주소를 입력해 주세요.')
      return
    }
    if (!/^https?:\/\//i.test(value)) {
      setError('http:// 또는 https:// 주소로 입력해 주세요.')
      return
    }
    onChange([
      ...(items || []),
      {
        type: draftType.type,
        value,
        label: draftType.label,
        color: draftType.color,
      },
    ])
    setDraftType(null)
    setDraftValue('')
    setError('')
    setPickerOpen(false)
  }

  const removeItem = (index) => {
    onChange((items || []).filter((_, itemIndex) => itemIndex !== index))
  }

  const updateValue = (index, value) => {
    onChange((items || []).map((item, itemIndex) => (
      itemIndex === index ? { ...item, value } : item
    )))
  }

  const selectType = (type) => {
    setPickerOpen(false)
    setDraftType(type)
    setDraftValue('')
    setError('')
  }

  return (
    <div className="redirect-editor">
      <div className="redirect-editor-head">
        <strong>리다이렉트</strong>
        <span>최소 1개, 타입당 1개</span>
      </div>

      {(items || []).length === 0 && !draftType && (
        <p className="redirect-editor-empty">추가 버튼으로 이동할 서비스를 등록해 주세요.</p>
      )}

      {(items || []).length > 0 && (
        <ul className="redirect-waiting-list">
          {(items || []).map((item, index) => {
            const meta = typeMap[item.type] || item
            return (
              <li key={`${item.type}-${item.id || index}`}>
                <span className="redirect-type-chip" style={{ '--redirect-color': meta.color || '#94a3b8' }}>
                  {meta.label || item.type}
                </span>
                <input
                  value={item.value}
                  onChange={(event) => updateValue(index, event.target.value)}
                  placeholder="https://"
                  disabled={disabled}
                />
                <button
                  className="icon-button"
                  type="button"
                  disabled={disabled}
                  onClick={() => removeItem(index)}
                  aria-label="삭제"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {draftType && (
        <div className="redirect-draft">
          <span className="redirect-type-chip" style={{ '--redirect-color': draftType.color }}>
            {draftType.label}
          </span>
          <input
            value={draftValue}
            onChange={(event) => setDraftValue(event.target.value)}
            placeholder="https://"
            disabled={disabled}
            autoFocus
          />
          <button className="button primary compact" type="button" disabled={disabled} onClick={commitDraft}>
            저장
          </button>
          <button
            className="icon-button"
            type="button"
            disabled={disabled}
            onClick={() => {
              setDraftType(null)
              setDraftValue('')
              setError('')
            }}
            aria-label="취소"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {error && <p className="redirect-editor-error">{error}</p>}

      <div className="redirect-add-wrap">
        <button
          className="button ghost compact redirect-add-button"
          type="button"
          disabled={disabled || !!draftType || availableTypes.length === 0}
          onClick={() => setPickerOpen((open) => !open)}
        >
          <Plus size={15} /> 추가
        </button>
        {pickerOpen && availableTypes.length > 0 && (
          <div className="redirect-type-menu" role="listbox">
            {availableTypes.map((type) => (
              <button
                key={type.type}
                type="button"
                onClick={() => selectType(type)}
              >
                <i style={{ background: type.color }} />
                {type.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RedirectEditor
