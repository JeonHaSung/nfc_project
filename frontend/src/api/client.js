import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: { 'Content-Type': 'application/json' },
})

let csrfPromise = null
let csrfToken = null

export const ensureCsrf = () => {
  if (!csrfPromise) {
    csrfPromise = client.get('/management/auth/csrf', { skipCsrf: true })
      .then((response) => {
        csrfToken = response.data
        return csrfToken
      })
      .catch((error) => {
        csrfToken = null
        throw error
      })
      .finally(() => {
        csrfPromise = null
      })
  }
  return csrfPromise
}

client.interceptors.request.use(async (config) => {
  const method = config.method?.toLowerCase()
  if (!config.skipCsrf && ['post', 'put', 'patch', 'delete'].includes(method)) {
    await ensureCsrf()
    config.headers.set('X-XSRF-TOKEN', csrfToken)
  }
  return config
})

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || error.message || '요청 처리 중 오류가 발생했습니다.'
    const requestError = new Error(message)
    requestError.status = error.response?.status
    requestError.code = error.response?.data?.code

    if (requestError.status === 401 && !error.config?.skipUnauthorizedEvent) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }

    return Promise.reject(requestError)
  },
)

export default client
