import client from '../client'

export const getTags = (storeId, tagType = 'ALL', experienceType = 'ALL') =>
  client.get('/management/tag/list', { params: { storeId, tagType, experienceType } })

export const getFactoryTags = (status) =>
  client.get('/management/tag/factory-list', { params: { status } })

export const getFactoryProgress = () =>
  client.get('/management/tag/factory-progress')

export const generateTags = (payload) =>
  client.post('/management/tag/generate', payload)

export const getExcelOrders = () =>
  client.get('/management/tag/excel-orders')

const toApiError = async (error) => {
  const data = error?.response?.data
  if (data instanceof Blob) {
    try {
      const json = JSON.parse(await data.text())
      return new Error(json.message || '요청 처리 중 오류가 발생했습니다.')
    } catch {
      return new Error(error.message || '요청 처리 중 오류가 발생했습니다.')
    }
  }
  return new Error(error?.response?.data?.message || error.message || '요청 처리 중 오류가 발생했습니다.')
}

const downloadBlob = async (url, fallbackName) => {
  const axios = (await import('axios')).default
  const { ensureCsrf } = await import('../client')
  await ensureCsrf()
  const cookieMatch = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/)
  const csrf = cookieMatch ? decodeURIComponent(cookieMatch[1]) : ''

  try {
    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || ''}${url}`, {
      withCredentials: true,
      responseType: 'blob',
      headers: { 'X-XSRF-TOKEN': csrf },
    })

    const disposition = response.headers['content-disposition'] || ''
    const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i)
    const plainMatch = disposition.match(/filename="?([^"]+)"?/i)
    const fileName = utfMatch
      ? decodeURIComponent(utfMatch[1])
      : (plainMatch?.[1] || fallbackName)

    const blobUrl = URL.createObjectURL(response.data)
    const anchor = document.createElement('a')
    anchor.href = blobUrl
    anchor.download = fileName
    anchor.click()
    URL.revokeObjectURL(blobUrl)
  } catch (error) {
    throw await toApiError(error)
  }
}

export const issueTagExcel = async (tagIds) => {
  const axios = (await import('axios')).default
  const { ensureCsrf } = await import('../client')
  await ensureCsrf()

  const cookieMatch = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/)
  const csrf = cookieMatch ? decodeURIComponent(cookieMatch[1]) : ''

  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL || ''}/management/tag/excel`,
      { tagIds },
      {
        withCredentials: true,
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': csrf,
        },
      },
    )
    return response.data
  } catch (error) {
    throw await toApiError(error)
  }
}

export const downloadExcelOrder = (id, fallbackName = 'order.xlsx') =>
  downloadBlob(`/management/tag/excel-orders/${id}/download`, fallbackName)

export const deleteExcelOrder = (id) =>
  client.delete(`/management/tag/excel-orders/${id}`)

export const updateTag = (payload) =>
  client.post('/management/tag/update', payload)

export const getRedirectingTypes = () =>
  client.get('/management/tag/redirecting-types')

export const deleteTags = (ids) =>
  client.post('/management/tag/del', ids)
