import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Copy, Eye, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import {
  createStoreEvent,
  deleteStoreEvents,
  getStoreEvents,
  toggleStoreEvent,
  updateStoreEvent,
} from '../../api/store/storeEventApi'
import Modal from '../../common/components/Modal'

const MAX_ITEMS = 50
const MAX_DESCRIPTION = 1000
const MAX_ITEM_NAME = 120
const MAX_ITEM_FIELD = 50
const MAX_IMAGE_URL = 500
const QUICK_EMOJIS = ['🎁', '🎉', '✨', '🔥', '☕', '🍰', '🍺', '🍜', '⭐', '💖', '👍', '📢']

const FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'live', label: '진행중' },
  { id: 'soon', label: '예약중' },
  { id: 'off', label: 'OFF' },
  { id: 'ended', label: '종료' },
  { id: 'relay', label: '태그시 표시' },
]

const SORTS = [
  { id: 'newest', label: '최신순' },
  { id: 'name', label: '이름순' },
]

const emptyItem = () => ({ key: crypto.randomUUID(), name: '', price: '', quantity: '', imageUrl: '' })

function isValidImageUrl(value) {
  if (!value) return true
  const lower = value.toLowerCase()
  return (lower.startsWith('https://') || lower.startsWith('http://')) && value.length <= MAX_IMAGE_URL
}

/** 리뷰유형관리(RedirectingLocales)와 동일 */
const EVENT_LOCALES = [
  { id: 'ko', nameField: 'name', descField: 'description', name: '한국어', short: 'KO', requiredName: true },
  { id: 'en', nameField: 'nameEn', descField: 'descriptionEn', name: 'English', short: 'EN' },
  { id: 'ja', nameField: 'nameJa', descField: 'descriptionJa', name: '日本語', short: 'JA' },
  { id: 'zh', nameField: 'nameZh', descField: 'descriptionZh', name: '中文', short: 'ZH' },
  { id: 'fr', nameField: 'nameFr', descField: 'descriptionFr', name: 'Français', short: 'FR' },
]

const emptyForm = {
  enabled: true,
  name: '',
  nameEn: '',
  nameJa: '',
  nameZh: '',
  nameFr: '',
  description: '',
  descriptionEn: '',
  descriptionJa: '',
  descriptionZh: '',
  descriptionFr: '',
  noTimeLimit: true,
  showOnReviewRelay: false,
  startAt: '',
  endAt: '',
  items: [],
}

function localeMeta(localeId) {
  return EVENT_LOCALES.find((item) => item.id === localeId) || EVENT_LOCALES[0]
}

function filledLocales(event, kind) {
  return EVENT_LOCALES
    .filter((locale) => String(event?.[kind === 'name' ? locale.nameField : locale.descField] || '').trim())
    .map((locale) => locale.short)
}

function displayEventName(event) {
  return event?.name || event?.nameEn || event?.nameJa || event?.nameZh || event?.nameFr || ''
}

/** 백엔드 LocalDateTime(서울 벽시계)을 epoch ms로 해석 */
function parseSeoulMs(value) {
  if (!value) return null
  const raw = String(value)
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/)
  if (match) {
    const sec = match[6] || '00'
    const ms = new Date(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${sec}+09:00`).getTime()
    return Number.isNaN(ms) ? null : ms
  }
  const ms = new Date(raw).getTime()
  return Number.isNaN(ms) ? null : ms
}

function toLocalInput(value) {
  if (!value) return ''
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/)
  if (match) return `${match[1]}T${match[2]}`
  const ms = parseSeoulMs(value)
  if (ms == null) return ''
  return new Date(ms).toLocaleString('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).replace(' ', 'T')
}

function toApiDateTime(value) {
  if (!value) return null
  return value.length === 16 ? `${value}:00` : value
}

function formatPeriod(event) {
  if (event.noTimeLimit) return '기간 제한 없음'
  if (!event.startAt || !event.endAt) return '기간 미설정'
  const fmt = (value) => {
    const ms = parseSeoulMs(value)
    if (ms == null) return '-'
    return new Date(ms).toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }
  return `${fmt(event.startAt)} ~ ${fmt(event.endAt)}`
}

function seoulDateKey(msOrValue) {
  const ms = typeof msOrValue === 'number' ? msOrValue : parseSeoulMs(msOrValue)
  if (ms == null) return ''
  return new Date(ms).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
}

function formatRemain(targetMs, { soon, now } = {}) {
  if (targetMs == null || Number.isNaN(targetMs)) return null
  const nowMs = now ?? Date.now()
  const safe = Math.max(0, targetMs - nowMs)
  const minute = 60 * 1000
  const hour = 60 * minute

  if (safe < minute) return soon ? '곧 시작' : '곧 종료'
  if (safe < hour) {
    const mins = Math.max(1, Math.ceil(safe / minute))
    return soon ? `${mins}분 후 시작` : `${mins}분 남음`
  }
  if (seoulDateKey(targetMs) === seoulDateKey(nowMs)) {
    const hours = Math.max(1, Math.ceil(safe / hour))
    return soon ? `${hours}시간 후 시작` : `${hours}시간 남음`
  }

  const today = seoulDateKey(nowMs)
  const target = seoulDateKey(targetMs)
  const dayMs = 24 * hour
  const days = Math.max(
    1,
    Math.round((new Date(`${target}T00:00:00+09:00`).getTime() - new Date(`${today}T00:00:00+09:00`).getTime()) / dayMs),
  )
  if (days === 1) return soon ? '내일 시작' : '내일 종료'
  return soon ? `${days}일 후 시작` : `${days}일 남음`
}

function remainLabel(event, now = Date.now()) {
  if (event?.noTimeLimit) return null
  if (isStoreEventSoon(event, now) && event.startAt) {
    const start = parseSeoulMs(event.startAt)
    if (start == null) return null
    return formatRemain(start, { soon: true, now })
  }
  if (isStoreEventLive(event, now) && event.endAt) {
    const end = parseSeoulMs(event.endAt)
    if (end == null) return null
    return formatRemain(end, { soon: false, now })
  }
  return null
}

export function isStoreEventExpired(event, now = Date.now()) {
  if (event?.noTimeLimit || !event?.endAt) return false
  const end = parseSeoulMs(event.endAt)
  return end != null && now > end
}

export function isStoreEventLive(event, now = Date.now()) {
  if (!event?.enabled || isStoreEventExpired(event, now)) return false
  if (event.noTimeLimit) return true
  if (!event.startAt || !event.endAt) return false
  const start = parseSeoulMs(event.startAt)
  const end = parseSeoulMs(event.endAt)
  if (start == null || end == null) return false
  return now >= start && now <= end
}

export function isStoreEventSoon(event, now = Date.now()) {
  if (!event?.enabled || isStoreEventExpired(event, now) || isStoreEventLive(event, now)) return false
  if (event.noTimeLimit || !event.startAt) return false
  const start = parseSeoulMs(event.startAt)
  return start != null && now < start
}

export function hasLiveStoreEvent(events = []) {
  return events.some((event) => isStoreEventLive(event))
}

function statusMeta(event, now = Date.now()) {
  if (isStoreEventExpired(event, now)) return { label: '종료', className: 'ended' }
  if (!event.enabled) return { label: 'OFF', className: '' }
  if (isStoreEventLive(event, now)) return { label: '진행중', className: 'live' }
  if (isStoreEventSoon(event, now)) return { label: '예약중', className: 'soon' }
  return { label: 'ON', className: 'on' }
}

function matchesFilter(event, filter, now = Date.now()) {
  switch (filter) {
    case 'live':
      return isStoreEventLive(event, now)
    case 'soon':
      return isStoreEventSoon(event, now)
    case 'off':
      return !event.enabled && !isStoreEventExpired(event, now)
    case 'ended':
      return isStoreEventExpired(event, now)
    case 'relay':
      return Boolean(event.showOnReviewRelay)
    default:
      return true
  }
}

function EventFormView({
  storeName,
  mode,
  form,
  message,
  setMessage,
  update,
  addItem,
  updateItem,
  removeItem,
  itemsRef,
  contentLocale,
  setContentLocale,
  nameInputRef,
  onSubmit,
  onBack,
  saving,
}) {
  const descRef = useRef(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewError, setPreviewError] = useState(false)
  const locale = localeMeta(contentLocale)
  const nameValue = form[locale.nameField] || ''
  const descValue = form[locale.descField] || ''
  const hasKoreanName = Boolean(String(form.name || '').trim())
  const title = mode === 'edit' ? '이벤트 수정' : mode === 'clone' ? '이벤트 복제' : '이벤트 등록'
  const description = mode === 'edit'
    ? '기존 이벤트를 수정합니다.'
    : mode === 'clone'
      ? '내용이 복사되었습니다. 기간을 다시 설정해 주세요.'
      : '새 이벤트를 등록합니다.'
  const editEndMs = form.endAt
    ? parseSeoulMs(form.endAt.length === 16 ? `${form.endAt}:00` : form.endAt)
    : null
  const expiredEdit = mode === 'edit'
    && !form.noTimeLimit
    && editEndMs != null
    && editEndMs < Date.now()

  const insertEmoji = (emoji) => {
    const current = descValue
    if (current.length >= MAX_DESCRIPTION) return
    const el = descRef.current
    const start = el && typeof el.selectionStart === 'number' ? el.selectionStart : current.length
    const end = el && typeof el.selectionEnd === 'number' ? el.selectionEnd : start
    const next = `${current.slice(0, start)}${emoji}${current.slice(end)}`.slice(0, MAX_DESCRIPTION)
    update({ [locale.descField]: next })
    requestAnimationFrame(() => {
      if (!el) return
      const cursor = Math.min(start + emoji.length, next.length)
      el.focus()
      el.setSelectionRange(cursor, cursor)
    })
  }

  const localeFilled = (item) => (
    String(form[item.nameField] || '').trim() || String(form[item.descField] || '').trim()
  )

  return (
    <Modal
      title={title}
      description={`${storeName} · ${description}`}
      onClose={onBack}
      wide
      actions={(
        <>
          <button className="button ghost" type="button" onClick={onBack} disabled={saving}>
            <ArrowLeft size={15} /> 목록
          </button>
          <button className="button primary" type="submit" form="store-event-form" disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </>
      )}
    >
      {message && (
        <div className={`notice ${message.type}`} role="alert" onClick={() => setMessage(null)}>
          {message.text}
        </div>
      )}

      <form id="store-event-form" className="store-event-form" onSubmit={onSubmit}>
        <section className="store-event-section">
          <div className="store-event-toggle-row">
            <div>
              <strong>이벤트 상태</strong>
              <p>
                {expiredEdit
                  ? '종료된 이벤트는 ON으로 저장할 수 없습니다. 복제 후 기간을 다시 설정하세요.'
                  : form.enabled
                    ? 'ON · 손님에게 이벤트가 노출됩니다'
                    : 'OFF · 이벤트가 꺼져 있습니다'}
              </p>
            </div>
            <button
              type="button"
              className={`store-event-switch${form.enabled && !expiredEdit ? ' on' : ''}`}
              onClick={() => {
                if (expiredEdit) {
                  setMessage({ type: 'error', text: '기한이 끝난 이벤트는 ON으로 바꿀 수 없습니다. 복제해 주세요.' })
                  return
                }
                update({ enabled: !form.enabled })
              }}
              aria-pressed={form.enabled && !expiredEdit}
              disabled={saving}
            >
              <span>{form.enabled && !expiredEdit ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          <div className="store-event-i18n">
            <div className="store-event-desc-toolbar">
              <div className="store-event-desc-head">
                <strong>다국어 입력</strong>
                <span className="muted">한국어 이름은 필수 · 다른 언어는 선택</span>
              </div>
              <label className="store-event-desc-locale">
                <span className="sr-only">언어</span>
                <select
                  value={contentLocale}
                  onChange={(event) => setContentLocale(event.target.value)}
                  disabled={saving}
                  aria-label="이벤트 언어"
                >
                  {EVENT_LOCALES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {item.requiredName ? ' (필수)' : ''}
                      {localeFilled(item) ? ' · 입력됨' : ''}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {!hasKoreanName && contentLocale !== 'ko' && (
              <p className="store-event-ko-required" role="status">
                한국어 이벤트 이름이 없습니다. 언어를 한국어로 바꿔 이름을 입력해야 저장됩니다.
              </p>
            )}

            <label>
              이벤트 이름{locale.requiredName ? ' (한국어 · 필수)' : ` (${locale.name} · 선택)`}
              <input
                ref={locale.id === 'ko' ? nameInputRef : undefined}
                value={nameValue}
                onChange={(event) => update({ [locale.nameField]: event.target.value })}
                maxLength={80}
                disabled={saving}
                placeholder={locale.requiredName ? '한국어 이벤트 이름 (필수)' : `${locale.name} 이벤트 이름`}
              />
            </label>

            <div className="store-event-desc-field">
              <div className="store-event-desc-head">
                <strong>손님용 메모/설명</strong>
                <span className="muted">선택</span>
              </div>
              <div className="store-event-emoji-bar" role="group" aria-label="빠른 이모티콘">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="store-event-emoji-btn"
                    onClick={() => insertEmoji(emoji)}
                    disabled={saving || descValue.length >= MAX_DESCRIPTION}
                    title={`${emoji} 넣기`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <textarea
                ref={descRef}
                value={descValue}
                onChange={(event) => update({ [locale.descField]: event.target.value })}
                rows={4}
                maxLength={MAX_DESCRIPTION}
                disabled={saving}
                placeholder={`${locale.name} 메모/설명`}
              />
            </div>
          </div>

          <label className="store-event-check">
            <input
              type="checkbox"
              checked={form.noTimeLimit}
              onChange={(event) => {
                const noTimeLimit = event.target.checked
                update(noTimeLimit
                  ? { noTimeLimit: true, startAt: '', endAt: '' }
                  : { noTimeLimit: false })
              }}
              disabled={saving || mode === 'clone'}
            />
            <span>기간 제한 없음{mode === 'clone' ? ' (복제 시 기간 설정 필요)' : ''}</span>
          </label>

          <label className="store-event-check">
            <input
              type="checkbox"
              checked={form.showOnReviewRelay}
              onChange={(event) => update({ showOnReviewRelay: event.target.checked })}
              disabled={saving}
            />
            <span>태그시 표시</span>
          </label>

          {!form.noTimeLimit && (
            <div className="store-event-period">
              <label>
                시작
                <input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(event) => update({ startAt: event.target.value })}
                  step={60}
                  required={mode === 'clone' || !form.noTimeLimit}
                  disabled={saving}
                />
              </label>
              <label>
                종료
                <input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(event) => update({ endAt: event.target.value })}
                  step={60}
                  required={mode === 'clone' || !form.noTimeLimit}
                  disabled={saving}
                />
              </label>
            </div>
          )}
        </section>

        <section className="store-event-section optional">
          <div className="store-event-section-head">
            <div>
              <strong>이벤트 품목</strong>
              <p>선택 · 품목·금액·수량·이미지 주소 · {form.items.length}/{MAX_ITEMS}</p>
            </div>
            <button
              className="button ghost compact"
              type="button"
              onClick={addItem}
              disabled={saving || form.items.length >= MAX_ITEMS}
            >
              <Plus size={14} /> 품목 추가
            </button>
          </div>

          {form.items.length === 0 ? (
            <p className="muted store-event-empty">등록된 품목이 없습니다.</p>
          ) : (
            <ul className="store-event-items" ref={itemsRef}>
              {form.items.map((item, index) => (
                <li key={item.key}>
                  <span className="store-event-item-index">{index + 1}</span>
                  <input
                    value={item.name}
                    onChange={(event) => updateItem(item.key, { name: event.target.value })}
                    placeholder="품목"
                    maxLength={MAX_ITEM_NAME}
                    disabled={saving}
                  />
                  <input
                    value={item.price}
                    onChange={(event) => updateItem(item.key, { price: event.target.value })}
                    placeholder="금액"
                    inputMode="decimal"
                    maxLength={MAX_ITEM_FIELD}
                    disabled={saving}
                  />
                  <input
                    value={item.quantity}
                    onChange={(event) => updateItem(item.key, { quantity: event.target.value })}
                    placeholder="수량"
                    inputMode="numeric"
                    maxLength={MAX_ITEM_FIELD}
                    disabled={saving}
                  />
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => removeItem(item.key)}
                    aria-label="품목 삭제"
                    disabled={saving}
                  >
                    <Trash2 size={15} />
                  </button>
                  <div className="store-event-item-image-row">
                    <input
                      value={item.imageUrl}
                      onChange={(event) => updateItem(item.key, { imageUrl: event.target.value })}
                      placeholder="이미지 주소 (https://...)"
                      inputMode="url"
                      maxLength={MAX_IMAGE_URL}
                      disabled={saving}
                    />
                    <button
                      className="button ghost compact"
                      type="button"
                      disabled={saving || !isValidImageUrl(String(item.imageUrl || '').trim()) || !String(item.imageUrl || '').trim()}
                      onClick={() => {
                        setPreviewError(false)
                        setPreviewUrl(String(item.imageUrl || '').trim())
                      }}
                    >
                      <Eye size={14} /> 보기
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </form>

      {previewUrl && (
        <div
          className="store-event-image-preview"
          role="presentation"
          onMouseDown={() => {
            setPreviewUrl(null)
            setPreviewError(false)
          }}
        >
          <div
            className="store-event-image-preview-card"
            role="dialog"
            aria-label="이미지 미리보기"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="store-event-image-preview-head">
              <strong>이미지 미리보기</strong>
              <button
                className="icon-button"
                type="button"
                aria-label="미리보기 닫기"
                onClick={() => {
                  setPreviewUrl(null)
                  setPreviewError(false)
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="store-event-image-preview-body">
              {previewError ? (
                <p className="muted">이미지를 불러오지 못했습니다. 주소를 확인해 주세요.</p>
              ) : (
                <img
                  src={previewUrl}
                  alt="이벤트 품목 미리보기"
                  onError={() => setPreviewError(true)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

function StoreEventModal({ store, onClose, onChanged }) {
  const [view, setView] = useState('list')
  const [mode, setMode] = useState('create')
  const [editing, setEditing] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [message, setMessage] = useState(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('newest')
  const [busyKey, setBusyKey] = useState(null)
  const [nowTick, setNowTick] = useState(() => Date.now())
  const [contentLocale, setContentLocale] = useState('ko')
  const itemsRef = useRef(null)
  const nameInputRef = useRef(null)

  useEffect(() => {
    if (view !== 'list') return undefined
    const timer = window.setInterval(() => setNowTick(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [view])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = events.filter((event) => {
      if (!matchesFilter(event, filter, nowTick)) return false
      if (!q) return true
      const hay = [
        event.name,
        event.nameEn,
        event.nameJa,
        event.nameZh,
        event.nameFr,
        event.description,
        event.descriptionEn,
        event.descriptionJa,
        event.descriptionZh,
        event.descriptionFr,
        ...(event.items || []).map((item) => item.name),
      ].join(' ').toLowerCase()
      return hay.includes(q)
    })

    rows.sort((a, b) => {
      if (sort === 'name') {
        const byName = displayEventName(a).localeCompare(displayEventName(b), 'ko')
        if (byName !== 0) return byName
        return Number(b.id || 0) - Number(a.id || 0)
      }
      // 최신순: 등록 id 기준
      return Number(b.id || 0) - Number(a.id || 0)
    })
    return rows
  }, [events, filter, query, sort, nowTick])

  const filterCounts = useMemo(() => {
    const counts = { all: events.length, live: 0, soon: 0, off: 0, ended: 0, relay: 0 }
    for (const event of events) {
      if (isStoreEventLive(event, nowTick)) counts.live += 1
      if (isStoreEventSoon(event, nowTick)) counts.soon += 1
      if (!event.enabled && !isStoreEventExpired(event, nowTick)) counts.off += 1
      if (isStoreEventExpired(event, nowTick)) counts.ended += 1
      if (event.showOnReviewRelay) counts.relay += 1
    }
    return counts
  }, [events, nowTick])

  const load = useCallback(async () => {
    if (!store?.id) return
    setLoading(true)
    try {
      const response = await getStoreEvents(store.id)
      const rows = response.data ?? []
      setEvents(rows)
      onChanged?.(rows)
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
      setEvents([])
      // 실패 시 매장 목록 라이브 배지를 0으로 덮어쓰지 않음
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid reload loop from parent callback identity
  }, [store?.id])

  useEffect(() => {
    setView('list')
    setEditing(null)
    setMode('create')
    setMessage(null)
    setQuery('')
    setFilter('all')
    setSort('newest')
    load()
  }, [store?.id, load])

  const openCreate = () => {
    setMode('create')
    setEditing(null)
    setForm({ ...emptyForm, items: [] })
    setContentLocale('ko')
    setMessage(null)
    setView('form')
  }

  const openEdit = (eventItem) => {
    const expired = isStoreEventExpired(eventItem)
    setMode('edit')
    setEditing(eventItem)
    setForm({
      enabled: expired ? false : Boolean(eventItem.enabled),
      name: eventItem.name || '',
      nameEn: eventItem.nameEn || '',
      nameJa: eventItem.nameJa || '',
      nameZh: eventItem.nameZh || '',
      nameFr: eventItem.nameFr || '',
      description: eventItem.description || '',
      descriptionEn: eventItem.descriptionEn || '',
      descriptionJa: eventItem.descriptionJa || '',
      descriptionZh: eventItem.descriptionZh || '',
      descriptionFr: eventItem.descriptionFr || '',
      noTimeLimit: eventItem.noTimeLimit !== false,
      showOnReviewRelay: Boolean(eventItem.showOnReviewRelay),
      startAt: toLocalInput(eventItem.startAt),
      endAt: toLocalInput(eventItem.endAt),
      items: (eventItem.items || []).map((item) => ({
        key: crypto.randomUUID(),
        name: item.name || '',
        price: item.price ?? '',
        quantity: item.quantity ?? '',
        imageUrl: item.imageUrl ?? '',
      })),
    })
    setContentLocale('ko')
    setMessage(null)
    setView('form')
  }

  const openClone = (eventItem) => {
    setMode('clone')
    setEditing(null)
    setForm({
      enabled: true,
      name: eventItem.name || '',
      nameEn: eventItem.nameEn || '',
      nameJa: eventItem.nameJa || '',
      nameZh: eventItem.nameZh || '',
      nameFr: eventItem.nameFr || '',
      description: eventItem.description || '',
      descriptionEn: eventItem.descriptionEn || '',
      descriptionJa: eventItem.descriptionJa || '',
      descriptionZh: eventItem.descriptionZh || '',
      descriptionFr: eventItem.descriptionFr || '',
      noTimeLimit: false,
      showOnReviewRelay: Boolean(eventItem.showOnReviewRelay),
      startAt: '',
      endAt: '',
      items: (eventItem.items || []).map((item) => ({
        key: crypto.randomUUID(),
        name: item.name || '',
        price: item.price ?? '',
        quantity: item.quantity ?? '',
        imageUrl: item.imageUrl ?? '',
      })),
    })
    setContentLocale('ko')
    setMessage(null)
    setView('form')
  }

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const addItem = () => {
    setForm((prev) => {
      if (prev.items.length >= MAX_ITEMS) return prev
      return { ...prev, items: [...prev.items, emptyItem()] }
    })
    requestAnimationFrame(() => {
      const el = itemsRef.current
      if (el) el.scrollTop = el.scrollHeight
    })
  }

  const updateItem = (key, patch) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    }))
  }

  const removeItem = (key) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.key !== key),
    }))
  }

  const handleToggle = async (eventItem) => {
    if (busyKey) return
    if (isStoreEventExpired(eventItem, nowTick) && !eventItem.enabled) {
      setMessage({ type: 'error', text: '기한이 끝난 이벤트는 ON으로 바꿀 수 없습니다. 복제 후 기간을 다시 설정해 주세요.' })
      return
    }
    const key = `toggle:${eventItem.id}`
    setBusyKey(key)
    try {
      await toggleStoreEvent(store.id, eventItem.id, !eventItem.enabled)
      await load()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setBusyKey(null)
    }
  }

  const removeEvent = async (eventItem) => {
    if (busyKey) return
    if (!window.confirm(`「${eventItem.name}」이벤트를 삭제할까요?`)) return
    const key = `del:${eventItem.id}`
    setBusyKey(key)
    try {
      await deleteStoreEvents(store.id, [eventItem.id])
      await load()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setBusyKey(null)
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    const name = String(form.name || '').trim()
    // 다른 언어만 채워도 저장 불가 — 한국어 이름 필수
    if (!name) {
      setContentLocale('ko')
      setMessage({ type: 'error', text: '한국어 이벤트 이름은 필수입니다. 영어 등 다른 언어만으로는 저장할 수 없습니다.' })
      requestAnimationFrame(() => nameInputRef.current?.focus())
      return
    }
    const noTimeLimit = mode === 'clone' ? false : form.noTimeLimit
    let startMs = null
    let endMs = null
    if (!noTimeLimit) {
      if (!form.startAt || !form.endAt) {
        setMessage({ type: 'error', text: '시작·종료 일시를 모두 선택해 주세요.' })
        return
      }
      startMs = parseSeoulMs(form.startAt.length === 16 ? `${form.startAt}:00` : form.startAt)
      endMs = parseSeoulMs(form.endAt.length === 16 ? `${form.endAt}:00` : form.endAt)
      if (startMs == null || endMs == null) {
        setMessage({ type: 'error', text: '시작·종료 일시 형식이 올바르지 않습니다.' })
        return
      }
      if (startMs >= endMs) {
        setMessage({ type: 'error', text: '종료 시각은 시작 시각보다 늦어야 합니다.' })
        return
      }
    }

    const rawItems = form.items.map((item) => ({
      name: String(item.name || '').trim(),
      price: String(item.price ?? '').trim(),
      quantity: String(item.quantity ?? '').trim(),
      imageUrl: String(item.imageUrl ?? '').trim(),
    }))
    const filled = rawItems.filter((item) => item.name || item.price || item.quantity || item.imageUrl)
    if (filled.some((item) => !item.name)) {
      setMessage({ type: 'error', text: '품목 이름을 입력해 주세요. 금액·수량·이미지만 있는 행은 저장할 수 없습니다.' })
      return
    }
    if (filled.some((item) => item.imageUrl && !isValidImageUrl(item.imageUrl))) {
      setMessage({ type: 'error', text: '이미지 주소는 http:// 또는 https:// 로 시작하는 URL이어야 합니다.' })
      return
    }
    if (filled.length > MAX_ITEMS) {
      setMessage({ type: 'error', text: `품목은 최대 ${MAX_ITEMS}개까지 등록할 수 있습니다.` })
      return
    }

    const endPast = !noTimeLimit && endMs != null && endMs < Date.now()
    const payload = {
      enabled: endPast ? false : form.enabled,
      name,
      nameEn: form.nameEn.trim() || null,
      nameJa: form.nameJa.trim() || null,
      nameZh: form.nameZh.trim() || null,
      nameFr: form.nameFr.trim() || null,
      description: form.description.trim() || null,
      descriptionEn: form.descriptionEn.trim() || null,
      descriptionJa: form.descriptionJa.trim() || null,
      descriptionZh: form.descriptionZh.trim() || null,
      descriptionFr: form.descriptionFr.trim() || null,
      noTimeLimit,
      showOnReviewRelay: Boolean(form.showOnReviewRelay),
      startAt: noTimeLimit ? null : toApiDateTime(form.startAt),
      endAt: noTimeLimit ? null : toApiDateTime(form.endAt),
      items: filled,
    }

    setSaving(true)
    try {
      if (mode === 'edit' && editing?.id) {
        await updateStoreEvent(store.id, editing.id, payload)
      } else {
        await createStoreEvent(store.id, payload)
      }
      setView('list')
      setEditing(null)
      setMode('create')
      setMessage(null)
      await load()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  if (view === 'form') {
    return (
      <EventFormView
        storeName={store?.name || '매장'}
        mode={mode}
        form={form}
        message={message}
        setMessage={setMessage}
        update={update}
        addItem={addItem}
        updateItem={updateItem}
        removeItem={removeItem}
        itemsRef={itemsRef}
        contentLocale={contentLocale}
        setContentLocale={setContentLocale}
        nameInputRef={nameInputRef}
        onSubmit={submit}
        saving={saving}
        onBack={() => {
          setView('list')
          setEditing(null)
          setMode('create')
          setContentLocale('ko')
          setMessage(null)
        }}
      />
    )
  }

  return (
    <Modal
      title="이벤트 목록"
      description={`${store?.name || '매장'} · 여러 이벤트를 등록할 수 있습니다.`}
      onClose={onClose}
      wide
      actions={<button className="button ghost" type="button" onClick={onClose}>닫기</button>}
    >
      {message && (
        <div className={`notice ${message.type}`} role="alert" onClick={() => setMessage(null)}>
          {message.text}
        </div>
      )}

      <div className="store-event-list-head">
        <button className="button primary" type="button" onClick={openCreate}>
          <Plus size={15} /> 이벤트 등록
        </button>
        <span className="muted">총 {events.length}개 · 표시 {filtered.length}개</span>
      </div>

      <div className="store-event-toolbar">
        <label className="store-event-search">
          <Search size={14} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="이름·메모·품목 검색"
            disabled={loading}
          />
        </label>
        <select
          className="store-event-sort"
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          disabled={loading}
          aria-label="정렬"
        >
          {SORTS.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
      </div>

      <div className="store-event-filters" role="tablist" aria-label="이벤트 필터">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            className={`store-event-filter${filter === item.id ? ' active' : ''}`}
            onClick={() => setFilter(item.id)}
            disabled={loading}
          >
            {item.label}
            <em>{filterCounts[item.id] ?? 0}</em>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="muted store-event-empty">불러오는 중...</p>
      ) : events.length === 0 ? (
        <p className="muted store-event-empty">등록된 이벤트가 없습니다. 위에서 새로 등록해 주세요.</p>
      ) : filtered.length === 0 ? (
        <p className="muted store-event-empty">조건에 맞는 이벤트가 없습니다.</p>
      ) : (
        <ul className="store-event-list">
          {filtered.map((item) => {
            const expired = isStoreEventExpired(item, nowTick)
            const live = isStoreEventLive(item, nowTick)
            const soon = isStoreEventSoon(item, nowTick)
            const status = statusMeta(item, nowTick)
            const remain = remainLabel(item, nowTick)
            const period = formatPeriod(item)
            const rowBusy = busyKey === `toggle:${item.id}` || busyKey === `del:${item.id}`
            return (
              <li
                key={item.id}
                className={expired ? 'ended' : live ? 'live' : soon ? 'soon' : undefined}
              >
                <div className="store-event-list-main">
                  <div className="store-event-list-title">
                    <span className={`store-event-badge${status.className ? ` ${status.className}` : ''}`}>
                      {status.label}
                    </span>
                    {remain && (
                      <span className={`store-event-badge remain${status.className ? ` ${status.className}` : ''}`}>
                        {remain}
                      </span>
                    )}
                    {item.showOnReviewRelay && (
                      <span className="store-event-badge relay">태그시</span>
                    )}
                    <strong title={displayEventName(item)}>{displayEventName(item)}</strong>
                    {filledLocales(item, 'name').length > 1 && (
                      <span className="store-event-desc-langs-hint">
                        {filledLocales(item, 'name').join(' · ')}
                      </span>
                    )}
                  </div>
                  <p title={period}>{period}</p>
                  {filledLocales(item, 'desc').length > 0 ? (
                    <small
                      className="store-event-desc"
                      title={EVENT_LOCALES
                        .map((entry) => item[entry.descField])
                        .filter(Boolean)
                        .join('\n')}
                    >
                      {item.description || item.descriptionEn || item.descriptionJa
                        || item.descriptionZh || item.descriptionFr}
                      {filledLocales(item, 'desc').length > 1 && (
                        <span className="store-event-desc-langs-hint">
                          {filledLocales(item, 'desc').join(' · ')}
                        </span>
                      )}
                    </small>
                  ) : null}
                  {(item.items?.length || 0) > 0 && (
                    <small>품목 {item.items.length}개</small>
                  )}
                </div>
                <div className="store-event-list-actions">
                  <button
                    type="button"
                    className={`store-event-switch compact${item.enabled && !expired ? ' on' : ''}`}
                    onClick={() => handleToggle(item)}
                    disabled={Boolean(busyKey) || (expired && !item.enabled)}
                    title={expired ? '종료된 이벤트는 복제 후 기간을 다시 설정하세요' : undefined}
                  >
                    {item.enabled && !expired ? 'ON' : 'OFF'}
                  </button>
                  <button className="button ghost compact" type="button" onClick={() => openEdit(item)} disabled={rowBusy}>
                    <Pencil size={14} /> 수정
                  </button>
                  <button className="button ghost compact" type="button" onClick={() => openClone(item)} disabled={rowBusy}>
                    <Copy size={14} /> 복제
                  </button>
                  <button className="button ghost compact" type="button" onClick={() => removeEvent(item)} disabled={Boolean(busyKey)}>
                    <Trash2 size={14} /> 삭제
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}

export default StoreEventModal
