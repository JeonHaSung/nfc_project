export function isAllowedRedirectUrl(value) {
  const url = String(value || '').trim()
  if (!url || url.length > 2048) return false
  if (/[\s\\]/.test(url)) return false
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
    if (parsed.username || parsed.password) return false
    return Boolean(parsed.hostname)
  } catch {
    return false
  }
}

export function toEditorRedirectings(entries = []) {
  return (entries || []).map((entry) => ({
    id: entry.id,
    type: entry.type,
    value: entry.value,
    label: entry.label,
    color: entry.color,
    quick: Boolean(entry.quick),
  }))
}

export function toRedirectUpsertPayload(items, { includeId = false } = {}) {
  return (items || []).map((item) => ({
    ...(includeId && item.id ? { id: item.id } : {}),
    type: item.type,
    value: String(item.value || '').trim(),
    quick: Boolean(item.quick),
  }))
}

export function redirectItemsError(items) {
  if (!items?.length) return '리다이렉트를 1개 이상 등록해 주세요.'
  for (const item of items) {
    if (!isAllowedRedirectUrl(item.value)) {
      return 'http:// 또는 https:// 주소로 올바르게 입력해 주세요.'
    }
  }
  return ''
}
