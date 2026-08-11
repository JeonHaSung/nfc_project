import client from '../client'

export const getTags = (storeId, tagType = 'ALL', experienceType = 'ALL') =>
  client.get('/management/tag/list', { params: { storeId, tagType, experienceType } })

export const getFactoryTags = (tagType, status) =>
  client.get('/management/tag/factory-list', { params: { tagType, status } })

export const getFactoryProgress = (tagType) =>
  client.get('/management/tag/factory-progress', { params: { tagType } })

export const generateTags = (payload) =>
  client.post('/management/tag/generate', payload)

export const getExcelOrders = (tagType) =>
  client.get('/management/tag/excel-orders', { params: { tagType } })

const downloadBlob = async (url, fallbackName) => {
  const axios = (await import('axios')).default
  const { ensureCsrf } = await import('../client')
  await ensureCsrf()
  const cookieMatch = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/)
  const csrf = cookieMatch ? decodeURIComponent(cookieMatch[1]) : ''

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
}

export const issueTagExcel = async (tagIds) => {
  const axios = (await import('axios')).default
  const { ensureCsrf } = await import('../client')
  await ensureCsrf()

  const cookieMatch = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/)
  const csrf = cookieMatch ? decodeURIComponent(cookieMatch[1]) : ''

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
}

export const downloadExcelOrder = (id, fallbackName = 'order.xlsx') =>
  downloadBlob(`/management/tag/excel-orders/${id}/download`, fallbackName)

export const updateTag = (payload) =>
  client.post('/management/tag/update', payload)

export const deleteTags = (ids) =>
  client.post('/management/tag/del', ids)
