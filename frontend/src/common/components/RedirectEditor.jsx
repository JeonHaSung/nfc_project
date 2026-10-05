import { Lock, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { isAllowedRedirectUrl } from '../redirecting'

function RedirectEditor({ types = [], items = [], onChange, disabled = false }) {
  const list = items || []
  const [pickerOpen, setPickerOpen] = useState(false)
  const [draftType, setDraftType] = useState(null)
  const [draftValue, setDraftValue] = useState('')
  const [error, setError] = useState('')
  const [wantQuick, setWantQuick] = useState(() => list.some((item) => item.quick))

  const typeMap = useMemo(
    () => Object.fromEntries((types || []).map((type) => [type.type, type])),
    [types],
  )
  const usedTypes = useMemo(() => new Set(list.map((item) => item.type)), [list])
  const availableTypes = useMemo(
    () => (types || []).filter((type) => !usedTypes.has(type.type)),
    [types, usedTypes],
  )
  const quickType = list.find((item) => item.quick)?.type || ''
  const quickSignature = list.map((item) => `${item.type}:${item.quick ? 1 : 0}`).join('|')
  const prevSignature = useRef(quickSignature)

  useEffect(() => {
    if (prevSignature.current === quickSignature) return
    prevSignature.current = quickSignature
    setWantQuick(quickSignature.split('|').some((part) => part.endsWith(':1')))
  }, [quickSignature])

  const toggleQuick = (enabled) => {
    setWantQuick(enabled)
    if (!enabled) {
      onChange(list.map((item) => ({ ...item, quick: false })))
      return
    }
    if (list.length && !list.some((item) => item.quick)) {
      onChange(list.map((item, index) => ({ ...item, quick: index === 0 })))
    }
  }

  const selectQuick = (type) => {
    onChange(list.map((item) => ({ ...item, quick: item.type === type })))
  }

  const commitDraft = () => {
    const value = draftValue.trim()
    if (!draftType) return
    if (!value) {
      setError('리다이렉트 주소를 입력해 주세요.')
      return
    }
    if (!isAllowedRedirectUrl(value)) {
      setError('http:// 또는 https:// 주소로 올바르게 입력해 주세요.')
      return
    }
    onChange([
      ...list,
      {
        type: draftType.type,
        value,
        label: draftType.label,
        color: draftType.color,
        quick: wantQuick && !list.some((item) => item.quick),
      },
    ])
    setDraftType(null)
    setDraftValue('')
    setError('')
    setPickerOpen(false)
  }

  const removeItem = (index) => {
    const target = list[index]
    if (target?.quick) return
    onChange(list.filter((_, itemIndex) => itemIndex !== index))
  }

  const updateValue = (index, value) => {
    if (list[index]?.quick) return
    onChange(list.map((item, itemIndex) => (
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
      <section className="redirect-quick-panel" aria-label="빠른이동">
        <label className="redirect-quick-toggle">
          <input
            type="checkbox"
            checked={wantQuick}
            disabled={disabled}
            onChange={(event) => toggleQuick(event.target.checked)}
          />
          <span>
            <strong>빠른이동</strong>
            <small>체크하면 태그 시 선택한 주소로 바로 이동합니다. 배정된 주소는 잠깁니다.</small>
          </span>
        </label>
        {wantQuick && (
          <div className="redirect-quick-assign">
            <span>이동할 리다이렉트 배정</span>
            {list.length === 0 ? (
              <p className="redirect-editor-empty">아래에서 리다이렉트 주소를 먼저 추가해 주세요.</p>
            ) : (
              <select
                value={quickType}
                disabled={disabled}
                onChange={(event) => selectQuick(event.target.value)}
              >
                {list.map((item) => {
                  const meta = typeMap[item.type] || item
                  return (
                    <option key={item.type} value={item.type}>
                      {meta.label || item.type}
                    </option>
                  )
                })}
              </select>
            )}
          </div>
        )}
      </section>

      <section className="redirect-list-panel" aria-label="리다이렉트 주소">
        <div className="redirect-editor-head">
          <strong>리다이렉트 주소</strong>
          <span>최소 1개, 타입당 1개</span>
        </div>

        {list.length === 0 && !draftType && (
          <p className="redirect-editor-empty">추가 버튼으로 이동할 서비스를 등록해 주세요.</p>
        )}

        {list.length > 0 && (
          <ul className="redirect-waiting-list">
            {list.map((item, index) => {
              const meta = typeMap[item.type] || item
              return (
                <li key={`${item.type}-${item.id || index}`} className={item.quick ? 'redirect-item-quick' : undefined}>
                  <span className="redirect-type-chip" style={{ '--redirect-color': meta.color || '#94a3b8' }}>
                    {meta.label || item.type}
                    {item.quick ? ' · 빠른이동' : ''}
                  </span>
                  <input
                    value={item.value}
                    onChange={(event) => updateValue(index, event.target.value)}
                    placeholder="https://"
                    disabled={disabled || item.quick}
                    readOnly={item.quick}
                    title={item.quick ? '빠른이동 중에는 주소를 바꿀 수 없습니다.' : undefined}
                  />
                  {item.quick ? (
                    <span className="redirect-lock-slot" title="빠른이동을 끄면 수정·삭제할 수 있습니다.">
                      <Lock size={14} aria-hidden />
                    </span>
                  ) : (
                    <button
                      className="icon-button"
                      type="button"
                      disabled={disabled}
                      onClick={() => removeItem(index)}
                      aria-label="삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
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
        {!draftType && availableTypes.length === 0 && (
          <p className="redirect-editor-empty">
            {(types || []).length === 0
              ? '등록된 리뷰 유형이 없습니다.'
              : '등록할 수 있는 유형을 모두 추가했습니다.'}
          </p>
        )}
      </section>
    </div>
  )
}

export default RedirectEditor
