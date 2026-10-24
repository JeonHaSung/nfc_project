const appBase = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')

export const apiBase = import.meta.env.VITE_API_BASE_URL || appBase

export const withBase = (path) => {
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${appBase}${suffix}`
}
