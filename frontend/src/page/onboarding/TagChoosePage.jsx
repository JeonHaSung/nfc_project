import { useEffect, useMemo, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'

const LOCALES = [
  { id: 'ko', name: '한국어' },
  { id: 'en', name: 'English' },
  { id: 'ja', name: '日本語' },
  { id: 'zh', name: '中文' },
  { id: 'fr', name: 'Français' },
]

const COPY = {
  ko: {
    title: '이동할 서비스를 선택하세요',
    desc: '원하는 리뷰·채널을 누르면 해당 페이지로 이동합니다.',
    loading: '불러오는 중...',
    empty: '등록된 이동 주소가 없습니다.',
    error: '선택 목록을 불러오지 못했습니다.',
    spotsTitle: '추천 관광지',
    spotsDesc: '여행을 오셨나요? 다음은 어디로 가볼까요? 추천드릴게요.',
    thanksTitle: '{store}에 방문해 주셔서 감사합니다',
    thanksDesc: '리뷰로 소중한 마음을 남겨 주세요.',
  },
  en: {
    title: 'Choose a service',
    desc: 'Tap a review or channel to open that page.',
    loading: 'Loading...',
    empty: 'No destinations are registered.',
    error: 'Could not load the destination list.',
    spotsTitle: 'Recommended sights',
    spotsDesc: 'Here for a trip? Where to next? Here are a few picks.',
  },
  ja: {
    title: '移動するサービスを選んでください',
    desc: 'レビューやチャンネルをタップすると、そのページに移動します。',
    loading: '読み込み中...',
    empty: '登録された移動先がありません。',
    error: '一覧を読み込めませんでした。',
    spotsTitle: 'おすすめ観光地',
    spotsDesc: '旅行ですか？次はどこへ行きますか？おすすめします。',
  },
  zh: {
    title: '请选择要前往的服务',
    desc: '点击评价或频道即可前往对应页面。',
    loading: '加载中...',
    empty: '暂无可用的跳转地址。',
    error: '无法加载列表。',
    spotsTitle: '推荐景点',
    spotsDesc: '来旅行了吗？接下来去哪儿？给您推荐几个地方。',
  },
  fr: {
    title: 'Choisissez un service',
    desc: 'Appuyez sur un avis ou un canal pour ouvrir la page.',
    loading: 'Chargement...',
    empty: 'Aucune destination enregistrée.',
    error: 'Impossible de charger la liste.',
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

function detectLocale() {
  const language = String(navigator.language || 'ko').toLowerCase()
  const found = LOCALES.find((item) => language.startsWith(item.id))
  return found?.id || 'ko'
}

function itemLabel(item, locale) {
  return item?.labels?.[locale] || item?.labels?.ko || item?.label || ''
}

function TagChoosePage() {
  const [searchParams] = useSearchParams()
  const tagId = searchParams.get('ti') || ''
  const [locale, setLocale] = useState(detectLocale)
  const [items, setItems] = useState([])
  const [storeName, setStoreName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const copy = COPY[locale] || COPY.ko
  const spots = SPOTS[locale]
  const showSpots = locale !== 'ko' && Array.isArray(spots)
  const displayStore = storeName.trim() || '매장'
  const thanksTitle = (copy.thanksTitle || '').replace('{store}', displayStore)

  useEffect(() => {
    if (!tagId) return
    setLoading(true)
    fetch(`/tag/choices?ti=${encodeURIComponent(tagId)}`)
      .then(async (response) => {
        const payload = await response.json()
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || COPY.ko.error)
        }
        const data = payload.data
        setStoreName(data?.storeName || '')
        setItems(Array.isArray(data?.items) ? data.items : [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [tagId])

  const visibleItems = useMemo(
    () => items.map((item) => ({ ...item, viewLabel: itemLabel(item, locale) })),
    [items, locale],
  )

  if (!tagId) return <Navigate to="/" replace />

  return (
    <main className="tag-choose-page">
      <div className="tag-choose-shell">
        <aside className="tag-choose-langs" aria-label="Language">
          {LOCALES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={locale === item.id ? 'active' : ''}
              onClick={() => setLocale(item.id)}
            >
              {item.name}
            </button>
          ))}
        </aside>
        <section className="tag-choose-card">
          <span>RETAP</span>
          <h1>{copy.title}</h1>
          <p>{copy.desc}</p>
          {loading && <p className="tag-choose-status">{copy.loading}</p>}
          {error && <p className="tag-choose-status error">{error}</p>}
          {!loading && !error && visibleItems.length === 0 && (
            <p className="tag-choose-status">{copy.empty}</p>
          )}
          <div className="tag-choose-list">
            {visibleItems.map((item) => (
              <a
                key={item.id}
                className="tag-choose-option"
                href={`/tag/go?ri=${item.id}`}
                style={{ '--choose-color': item.color }}
              >
                <i />
                <strong>{item.viewLabel}</strong>
              </a>
            ))}
          </div>
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
        </section>
      </div>
    </main>
  )
}

export default TagChoosePage
