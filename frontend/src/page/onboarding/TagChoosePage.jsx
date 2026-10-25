import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Languages, Wifi } from 'lucide-react'
import { Navigate, useSearchParams } from 'react-router-dom'
import eventItemPlaceholder from '../../assets/event-item-placeholder.svg'
import Modal from '../../common/components/Modal'
import RetapLogo from '../../common/components/RetapLogo'
import { withBase } from '../../common/appPath'

const LOCALES = [
  { id: 'ko', name: '한국어', short: 'KO' },
  { id: 'en', name: 'English', short: 'EN' },
  { id: 'ja', name: '日本語', short: 'JA' },
  { id: 'zh', name: '中文', short: 'ZH' },
  { id: 'fr', name: 'Français', short: 'FR' },
]

const COPY = {
  ko: {
    wifi: '와이파이',
    wifiName: '네트워크',
    wifiPw: '비밀번호',
    wifiDesc: '비밀번호는 가려져 있으며 복사로만 확인할 수 있습니다.',
    language: '언어',
    events: '이벤트',
    eventMissing: '이 언어로 안내된 이벤트 정보가 없어요. 직원에게 이벤트를 문의해 주세요.',
    moreDetail: '자세히 보기',
    remainAlways: '상시',
    remainSoon: '곧 종료',
    remainMins: '{n}분 남음',
    remainHours: '{n}시간 남음',
    remainTomorrow: '내일 종료',
    remainDays: '{n}일 남음',
    keywords: '키워드',
    reviews: '리뷰·채널',
    reviewsDesc: '원하는 서비스를 누르면 이동합니다.',
    loading: '불러오는 중...',
    empty: '등록된 이동 주소가 없습니다.',
    error: '선택 목록을 불러오지 못했습니다.',
    copied: '복사됨',
    copy: '복사',
    close: '닫기',
    spotsTitle: '추천 관광지',
    spotsDesc: '여행을 오셨나요? 다음은 어디로 가볼까요? 추천드릴게요.',
    storeFallback: '매장',
    thanksTitle: '{store}에 방문해 주셔서 감사합니다',
    thanksDesc: '리뷰로 소중한 마음을 남겨 주세요.',
  },
  en: {
    wifi: 'Wi‑Fi',
    wifiName: 'Network',
    wifiPw: 'Password',
    wifiDesc: 'The password is hidden. Copy it to use.',
    language: 'Language',
    events: 'Events',
    eventMissing: 'Event details aren’t available in this language. Please kindly ask a staff member about the event.',
    moreDetail: 'See more',
    remainAlways: 'Ongoing',
    remainSoon: 'Ending soon',
    remainMins: '{n}m left',
    remainHours: '{n}h left',
    remainTomorrow: 'Ends tomorrow',
    remainDays: '{n} days left',
    keywords: 'Keywords',
    reviews: 'Reviews & channels',
    reviewsDesc: 'Tap a service to open that page.',
    loading: 'Loading...',
    empty: 'No destinations are registered.',
    error: 'Could not load the destination list.',
    copied: 'Copied',
    copy: 'Copy',
    close: 'Close',
    storeFallback: 'Store',
    spotsTitle: 'Recommended sights',
    spotsDesc: 'Here for a trip? Where to next? Here are a few picks.',
  },
  ja: {
    wifi: 'Wi‑Fi',
    wifiName: 'ネットワーク',
    wifiPw: 'パスワード',
    wifiDesc: 'パスワードは非表示です。コピーしてご利用ください。',
    language: '言語',
    events: 'イベント',
    eventMissing: 'この言語のイベント案内がありません。スタッフにイベントについてお尋ねください。',
    moreDetail: '詳しく見る',
    remainAlways: '常時',
    remainSoon: 'まもなく終了',
    remainMins: '残り{n}分',
    remainHours: '残り{n}時間',
    remainTomorrow: '明日終了',
    remainDays: '残り{n}日',
    keywords: 'キーワード',
    reviews: 'レビュー・チャンネル',
    reviewsDesc: 'サービスをタップすると移動します。',
    loading: '読み込み中...',
    empty: '登録された移動先がありません。',
    error: '一覧を読み込めませんでした。',
    copied: 'コピーしました',
    copy: 'コピー',
    close: '閉じる',
    storeFallback: '店舗',
    spotsTitle: 'おすすめ観光地',
    spotsDesc: '旅行ですか？次はどこへ行きますか？おすすめします。',
  },
  zh: {
    wifi: 'Wi‑Fi',
    wifiName: '网络',
    wifiPw: '密码',
    wifiDesc: '密码已隐藏，请复制后使用。',
    language: '语言',
    events: '活动',
    eventMissing: '暂无该语言的活动说明。请向店员咨询活动详情。',
    moreDetail: '查看详情',
    remainAlways: '长期',
    remainSoon: '即将结束',
    remainMins: '剩余{n}分钟',
    remainHours: '剩余{n}小时',
    remainTomorrow: '明天结束',
    remainDays: '剩余{n}天',
    keywords: '关键词',
    reviews: '评价与频道',
    reviewsDesc: '点击服务即可前往。',
    loading: '加载中...',
    empty: '暂无可用的跳转地址。',
    error: '无法加载列表。',
    copied: '已复制',
    copy: '复制',
    close: '关闭',
    storeFallback: '店铺',
    spotsTitle: '推荐景点',
    spotsDesc: '来旅行了吗？接下来去哪儿？给您推荐几个地方。',
  },
  fr: {
    wifi: 'Wi‑Fi',
    wifiName: 'Réseau',
    wifiPw: 'Mot de passe',
    wifiDesc: 'Le mot de passe est masqué. Copiez-le pour l’utiliser.',
    language: 'Langue',
    events: 'Événements',
    eventMissing: 'Les détails de l’événement ne sont pas disponibles dans cette langue. Merci de demander au personnel.',
    moreDetail: 'Voir plus',
    remainAlways: 'Permanent',
    remainSoon: 'Bientôt fini',
    remainMins: '{n} min restantes',
    remainHours: '{n} h restantes',
    remainTomorrow: 'Finit demain',
    remainDays: '{n} jours restants',
    keywords: 'Mots-clés',
    reviews: 'Avis et canaux',
    reviewsDesc: 'Appuyez pour ouvrir la page.',
    loading: 'Chargement...',
    empty: 'Aucune destination enregistrée.',
    error: 'Impossible de charger la liste.',
    copied: 'Copié',
    copy: 'Copier',
    close: 'Fermer',
    storeFallback: 'Magasin',
    spotsTitle: 'Lieux recommandés',
    spotsDesc: 'Vous voyagez ? Où aller ensuite ? Voici nos suggestions.',
  },
}

const SPOTS = {
  en: [
    { city: 'Seoul', name: 'Gyeongbokgung', note: 'Joseon royal palace and Gyeonghoeru' },
    { city: 'Seoul', name: 'N Seoul Tower', note: 'Namsan night view and observatory' },
    { city: 'Seoul', name: 'Bukchon Hanok Village', note: 'Hanok alleys with city views' },
    { city: 'Busan', name: 'Haeundae Beach', note: 'Busan’s signature beach' },
    { city: 'Busan', name: 'Gamcheon Culture Village', note: 'Colorful hillside mural village' },
    { city: 'Busan', name: 'Haedong Yonggungsa', note: 'Temple on the sea' },
  ],
  ja: [
    { city: 'ソウル', name: '景福宮', note: '朝鮮の法宮、勤政殿と慶会楼' },
    { city: 'ソウル', name: 'Nソウルタワー', note: '南山の夜景と展望台' },
    { city: 'ソウル', name: '北村韓屋村', note: '韓屋の路地と街並み' },
    { city: '釜山', name: '海雲台海水浴場', note: '釜山を代表するビーチ' },
    { city: '釜山', name: '甘川文化村', note: 'カラフルな山の壁画村' },
    { city: '釜山', name: '海東龍宮寺', note: '海の上に立つ寺院' },
  ],
  zh: [
    { city: '首尔', name: '景福宫', note: '朝鲜法宫，勤政殿与庆会楼' },
    { city: '首尔', name: 'N首尔塔', note: '南山夜景与观景台' },
    { city: '首尔', name: '北村韩屋村', note: '韩屋巷弄与城市景观' },
    { city: '釜山', name: '海云台海水浴场', note: '釜山代表性海滩' },
    { city: '釜山', name: '甘川文化村', note: '色彩缤纷的山城壁画村' },
    { city: '釜山', name: '海东龙宫寺', note: '伫立海边的寺庙' },
  ],
  fr: [
    { city: 'Séoul', name: 'Gyeongbokgung', note: 'Palais royal et pavillon Gyeonghoeru' },
    { city: 'Séoul', name: 'N Seoul Tower', note: 'Vue nocturne de Namsan' },
    { city: 'Séoul', name: 'Village hanok de Bukchon', note: 'Ruelle hanok et vue sur la ville' },
    { city: 'Busan', name: 'Plage de Haeundae', note: 'La plage emblématique de Busan' },
    { city: 'Busan', name: 'Village culturel de Gamcheon', note: 'Village coloré à flanc de colline' },
    { city: 'Busan', name: 'Haedong Yonggungsa', note: 'Temple au bord de la mer' },
  ],
}

const EVENT_NAME_KEYS = {
  ko: 'name',
  en: 'nameEn',
  ja: 'nameJa',
  zh: 'nameZh',
  fr: 'nameFr',
}

const EVENT_DESC_KEYS = {
  ko: 'description',
  en: 'descriptionEn',
  ja: 'descriptionJa',
  zh: 'descriptionZh',
  fr: 'descriptionFr',
}

function detectLocale() {
  const language = String(navigator.language || 'ko').toLowerCase()
  const found = LOCALES.find((item) => language.startsWith(item.id))
  return found?.id || 'ko'
}

function itemLabel(item, locale) {
  return item?.labels?.[locale] || item?.labels?.ko || item?.label || ''
}

function eventField(event, locale, keys) {
  return String(event?.[keys[locale]] || '').trim()
}

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

function seoulDateKey(msOrValue) {
  const ms = typeof msOrValue === 'number' ? msOrValue : parseSeoulMs(msOrValue)
  if (ms == null) return ''
  return new Date(ms).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
}

function formatEventRemain(event, copy, now = Date.now()) {
  if (event?.noTimeLimit) return copy.remainAlways
  const endMs = parseSeoulMs(event?.endAt)
  if (endMs == null) return null
  const safe = Math.max(0, endMs - now)
  const minute = 60 * 1000
  const hour = 60 * minute
  const fill = (template, n) => String(template || '').replace('{n}', String(n))

  if (safe < minute) return copy.remainSoon
  if (safe < hour) {
    return fill(copy.remainMins, Math.max(1, Math.ceil(safe / minute)))
  }
  if (seoulDateKey(endMs) === seoulDateKey(now)) {
    return fill(copy.remainHours, Math.max(1, Math.ceil(safe / hour)))
  }
  const today = seoulDateKey(now)
  const target = seoulDateKey(endMs)
  const days = Math.max(
    1,
    Math.round((new Date(`${target}T00:00:00+09:00`).getTime() - new Date(`${today}T00:00:00+09:00`).getTime()) / (24 * hour)),
  )
  if (days === 1) return copy.remainTomorrow
  return fill(copy.remainDays, days)
}

function copyText(value) {
  const text = String(value || '')
  if (!text) return Promise.reject(new Error('COPY_EMPTY'))
  if (navigator?.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).catch(() => copyTextFallback(text))
  }
  return copyTextFallback(text)
}

function copyTextFallback(text) {
  return new Promise((resolve, reject) => {
    try {
      const area = document.createElement('textarea')
      area.value = text
      area.setAttribute('readonly', '')
      area.style.position = 'fixed'
      area.style.left = '-9999px'
      document.body.appendChild(area)
      area.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(area)
      if (ok) resolve()
      else reject(new Error('COPY_FAILED'))
    } catch (error) {
      reject(error)
    }
  })
}

function EventItemThumb({ src, alt = '' }) {
  const [broken, setBroken] = useState(false)
  useEffect(() => {
    setBroken(false)
  }, [src])
  const showPlaceholder = !src || broken
  return (
    <img
      className={`tag-choose-event-thumb${showPlaceholder ? ' is-placeholder' : ''}`}
      src={showPlaceholder ? eventItemPlaceholder : src}
      alt={alt}
      loading="lazy"
      onError={() => {
        if (!broken) setBroken(true)
      }}
    />
  )
}

function EventItems({ items }) {
  if (!items.length) return null
  return (
    <ul className="tag-choose-event-items">
      {items.map((item, index) => (
        <li key={`${item.name}-${index}`}>
          <EventItemThumb src={item.imageUrl} alt="" />
          <div>
            <b>{item.name}</b>
          </div>
        </li>
      ))}
    </ul>
  )
}

function EventPreviewItem({ items, onOpen }) {
  if (!items.length) return null
  const first = items[0]
  const extra = items.length - 1
  return (
    <button
      type="button"
      className="tag-choose-event-preview-item"
      onClick={onOpen}
    >
      <EventItemThumb src={first.imageUrl} alt="" />
      <b>{first.name || '—'}</b>
      {extra > 0 ? <span className="tag-choose-event-preview-count">+{extra}</span> : null}
    </button>
  )
}

const EVENT_AUTO_MS = 5000

function TagChooseEventCard({ event, locale, copy, onOpenDetail }) {
  const bodyRef = useRef(null)
  const [overflow, setOverflow] = useState(false)
  const [nowTick, setNowTick] = useState(() => Date.now())
  const name = eventField(event, locale, EVENT_NAME_KEYS)
  const description = eventField(event, locale, EVENT_DESC_KEYS)
  const eventItems = Array.isArray(event.items) ? event.items : []
  const hasLocaleContent = Boolean(name || description)
  const hasItems = eventItems.length > 0
  const remain = formatEventRemain(event, copy, nowTick)
  const showMore = overflow || hasItems || !hasLocaleContent
  const openDetail = () => onOpenDetail({
    name: name || copy.events,
    description: hasLocaleContent ? description : copy.eventMissing,
    items: eventItems,
    remain,
  })

  useEffect(() => {
    if (event?.noTimeLimit || !event?.endAt) return undefined
    const timer = window.setInterval(() => setNowTick(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [event?.noTimeLimit, event?.endAt])

  useEffect(() => {
    const el = bodyRef.current
    if (!el) {
      setOverflow(false)
      return undefined
    }
    const check = () => setOverflow(el.scrollHeight > el.clientHeight + 1)
    check()
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [name, description, locale, hasLocaleContent, hasItems])

  return (
    <article className={`tag-choose-event${overflow ? ' is-clamped' : ''}${hasItems ? ' has-preview-item' : ''}`}>
      <div className="tag-choose-event-head">
        <small>{copy.events}</small>
        {remain ? <span className="tag-choose-event-remain">{remain}</span> : null}
      </div>
      {name ? <h2>{name}</h2> : null}
      <div className="tag-choose-event-body" ref={bodyRef}>
        {hasLocaleContent ? (
          description ? <p>{description}</p> : null
        ) : (
          <p className="tag-choose-event-missing">{copy.eventMissing}</p>
        )}
      </div>
      {hasItems ? (
        <EventPreviewItem items={eventItems} onOpen={openDetail} />
      ) : null}
      {showMore ? (
        <button
          type="button"
          className="tag-choose-event-more"
          onClick={openDetail}
        >
          {copy.moreDetail}
        </button>
      ) : null}
    </article>
  )
}

function TagChooseEventCarousel({ events, locale, copy, onOpenDetail, paused }) {
  const [index, setIndex] = useState(0)
  const touchStartX = useRef(null)
  const touchDeltaX = useRef(0)
  const count = events.length

  useEffect(() => {
    setIndex(0)
  }, [count, locale])

  useEffect(() => {
    if (count <= 1 || paused) return undefined
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % count)
    }, EVENT_AUTO_MS)
    return () => window.clearInterval(timer)
  }, [count, paused, index])

  if (count === 0) return null

  const go = (delta) => {
    setIndex((prev) => (prev + delta + count) % count)
  }

  const onTouchStart = (event) => {
    if (count <= 1) return
    const touch = event.touches?.[0]
    if (!touch) return
    touchStartX.current = touch.clientX
    touchDeltaX.current = 0
  }

  const onTouchMove = (event) => {
    if (touchStartX.current == null) return
    const touch = event.touches?.[0]
    if (!touch) return
    touchDeltaX.current = touch.clientX - touchStartX.current
  }

  const onTouchEnd = () => {
    if (touchStartX.current == null) return
    const dx = touchDeltaX.current
    touchStartX.current = null
    touchDeltaX.current = 0
    if (Math.abs(dx) < 44) return
    go(dx < 0 ? 1 : -1)
  }

  return (
    <section className="tag-choose-events" aria-label={copy.events} aria-roledescription="carousel">
      <div className="tag-choose-event-carousel">
        {count > 1 ? (
          <div className="tag-choose-event-dots" aria-hidden="true">
            {events.map((event, eventIndex) => (
              <button
                key={event.id}
                type="button"
                className={eventIndex === index ? 'active' : ''}
                onClick={() => setIndex(eventIndex)}
                tabIndex={-1}
              />
            ))}
          </div>
        ) : null}

        <div
          className="tag-choose-event-viewport"
          aria-live="polite"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
        >
          <div
            className="tag-choose-event-track"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {events.map((event, eventIndex) => {
              const active = eventIndex === index
              return (
                <div
                  key={event.id}
                  className="tag-choose-event-slide"
                  aria-hidden={!active}
                  {...(!active ? { inert: '' } : {})}
                >
                  <TagChooseEventCard
                    event={event}
                    locale={locale}
                    copy={copy}
                    onOpenDetail={onOpenDetail}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {count > 1 ? (
          <>
            <button
              type="button"
              className="tag-choose-event-nav prev"
              aria-label="Previous event"
              onClick={() => go(-1)}
            >
              <ChevronLeft size={18} strokeWidth={2.4} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="tag-choose-event-nav next"
              aria-label="Next event"
              onClick={() => go(1)}
            >
              <ChevronRight size={18} strokeWidth={2.4} aria-hidden="true" />
            </button>
          </>
        ) : null}
      </div>
    </section>
  )
}

function TagChoosePage() {
  const [searchParams] = useSearchParams()
  const tagId = searchParams.get('ti') || ''
  const [locale, setLocale] = useState(detectLocale)
  const [langOpen, setLangOpen] = useState(false)
  const [wifiOpen, setWifiOpen] = useState(false)
  const [eventDetail, setEventDetail] = useState(null)
  const [items, setItems] = useState([])
  const [events, setEvents] = useState([])
  const [keywords, setKeywords] = useState([])
  const [wifi, setWifi] = useState(null)
  const [storeName, setStoreName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [copiedKey, setCopiedKey] = useState('')
  const langRef = useRef(null)
  const copyTimer = useRef(0)
  const copy = COPY[locale] || COPY.ko
  const spots = SPOTS[locale]
  const showSpots = locale !== 'ko' && Array.isArray(spots)
  const displayStore = storeName.trim() || copy.storeFallback || '매장'
  const thanksTitle = (copy.thanksTitle || '').replace('{store}', displayStore)

  useEffect(() => {
    if (!tagId) return undefined
    const controller = new AbortController()
    setLoading(true)
    setError(false)
    const base = import.meta.env.VITE_API_BASE_URL || ''
    fetch(`${base}/tag/choices?ti=${encodeURIComponent(tagId)}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json()
        if (!response.ok || !payload?.success) {
          throw new Error('CHOICES_ERROR')
        }
        const data = payload.data
        setStoreName(data?.storeName || '')
        setWifi(data?.wifi?.name ? data.wifi : null)
        setEvents(Array.isArray(data?.events) ? data.events : [])
        setKeywords(Array.isArray(data?.keywords) ? data.keywords : [])
        setItems(Array.isArray(data?.items) ? data.items : [])
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return
        setError(true)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [tagId])

  useEffect(() => {
    if (!langOpen) return undefined
    const onPointer = (event) => {
      if (!langRef.current?.contains(event.target)) setLangOpen(false)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') setLangOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [langOpen])

  useEffect(() => () => window.clearTimeout(copyTimer.current), [])

  const visibleItems = useMemo(
    () => items.map((item) => ({ ...item, viewLabel: itemLabel(item, locale) })),
    [items, locale],
  )

  const markCopied = (key) => {
    setCopiedKey(key)
    window.clearTimeout(copyTimer.current)
    copyTimer.current = window.setTimeout(() => setCopiedKey(''), 1400)
  }

  const handleCopy = async (key, value) => {
    try {
      await copyText(value)
      markCopied(key)
    } catch {
      /* ignore */
    }
  }

  if (!tagId) return <Navigate to="/" replace />

  return (
    <main className="tag-choose-page">
      <div className="tag-choose-shell">
        <header className="tag-choose-top">
          <div className="tag-choose-brand">
            <RetapLogo className="tag-choose-logo" alt="retap" />
            <h1>{loading ? '…' : displayStore}</h1>
          </div>

          <div className="tag-choose-actions">
            {wifi ? (
              <button
                type="button"
                className="tag-choose-chip"
                aria-label={copy.wifi}
                onClick={() => {
                  setLangOpen(false)
                  setWifiOpen(true)
                }}
              >
                <Wifi size={15} strokeWidth={2.2} aria-hidden="true" />
                Wi‑Fi
              </button>
            ) : null}

            <div className="tag-choose-lang" ref={langRef}>
              <button
                type="button"
                className={`tag-choose-chip${langOpen ? ' open' : ''}`}
                aria-haspopup="listbox"
                aria-expanded={langOpen}
                aria-label={copy.language}
                onClick={() => {
                  setWifiOpen(false)
                  setLangOpen((prev) => !prev)
                }}
              >
                <Languages size={15} strokeWidth={2.2} aria-hidden="true" />
                {copy.language}
              </button>
              {langOpen ? (
                <div className="tag-choose-lang-menu" role="listbox" aria-label={copy.language}>
                  {LOCALES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={locale === item.id}
                      className={locale === item.id ? 'active' : ''}
                      onClick={() => {
                        setLocale(item.id)
                        setLangOpen(false)
                      }}
                    >
                      <b>{item.short}</b>
                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {wifiOpen && wifi ? (
          <Modal
            title={copy.wifi}
            description={copy.wifiDesc}
            onClose={() => setWifiOpen(false)}
            actions={(
              <>
                <button className="button ghost" type="button" onClick={() => setWifiOpen(false)}>
                  {copy.close}
                </button>
                {wifi.password ? (
                  <button
                    className="button primary"
                    type="button"
                    onClick={() => handleCopy('wifi', wifi.password)}
                  >
                    {copiedKey === 'wifi' ? copy.copied : copy.copy}
                  </button>
                ) : null}
              </>
            )}
          >
            <div className="tag-choose-wifi-modal">
              <label>
                <span>{copy.wifiName}</span>
                <strong>{wifi.name}</strong>
              </label>
              {wifi.password ? (
                <label>
                  <span>{copy.wifiPw}</span>
                  <strong className="tag-choose-wifi-pw" aria-label={copy.wifiPw}>••••••••</strong>
                </label>
              ) : null}
            </div>
          </Modal>
        ) : null}

        {loading && <p className="tag-choose-status">{copy.loading}</p>}
        {error && <p className="tag-choose-status error">{copy.error}</p>}

        {!loading && !error && events.length > 0 ? (
          <TagChooseEventCarousel
            events={events}
            locale={locale}
            copy={copy}
            onOpenDetail={setEventDetail}
            paused={Boolean(eventDetail || wifiOpen || langOpen)}
          />
        ) : null}

        {eventDetail ? (
          <Modal
            className="tag-choose-event-modal"
            title={eventDetail.name || copy.events}
            description={copy.events}
            onClose={() => setEventDetail(null)}
            actions={(
              <button className="button primary" type="button" onClick={() => setEventDetail(null)}>
                {copy.close}
              </button>
            )}
          >
            <div className="tag-choose-event-detail">
              {eventDetail.remain ? (
                <span className="tag-choose-event-remain">{eventDetail.remain}</span>
              ) : null}
              {eventDetail.description ? <p>{eventDetail.description}</p> : null}
              <EventItems items={eventDetail.items || []} />
            </div>
          </Modal>
        ) : null}

        {!loading && !error && keywords.length > 0 ? (
          <section className="tag-choose-keywords" aria-label={copy.keywords}>
            {keywords.map((keyword) => (
              <button
                key={keyword}
                type="button"
                className="tag-choose-keyword"
                onClick={() => handleCopy(`kw:${keyword}`, keyword)}
              >
                {copiedKey === `kw:${keyword}` ? copy.copied : keyword}
              </button>
            ))}
          </section>
        ) : null}

        <section className="tag-choose-reviews" aria-label={copy.reviews}>
          <div className="tag-choose-reviews-head">
            <strong>{copy.reviews}</strong>
            <p>{copy.reviewsDesc}</p>
          </div>
          {!loading && !error && visibleItems.length === 0 && (
            <p className="tag-choose-status">{copy.empty}</p>
          )}
          <div className="tag-choose-list">
            {visibleItems.map((item) => (
              <a
                key={item.id}
                className="tag-choose-option"
                href={withBase(`/tag/go?ri=${item.id}`)}
                style={{ '--choose-color': item.color }}
              >
                <i />
                <strong>{item.viewLabel}</strong>
              </a>
            ))}
          </div>
        </section>

        {locale === 'ko' ? (
          <section className="tag-choose-thanks" aria-label={thanksTitle}>
            <strong>{thanksTitle}</strong>
            <p>{copy.thanksDesc}</p>
          </section>
        ) : showSpots ? (
          <section className="tag-choose-spots" aria-label={copy.spotsTitle}>
            <strong>{copy.spotsTitle}</strong>
            <p>{copy.spotsDesc}</p>
            <ul>
              {spots.map((spot) => (
                <li key={`${spot.city}-${spot.name}`}>
                  <em>{spot.city}</em>
                  <b>{spot.name}</b>
                  <span>{spot.note}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  )
}

export default TagChoosePage
