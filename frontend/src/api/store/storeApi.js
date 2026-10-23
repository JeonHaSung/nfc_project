import client from '../client'

export const getStores = (params = {}) =>
  client.get('/management/store/list', { params })

export const searchStoreSelectList = ({ page = 1, size = 20, searchText = '', registeredById } = {}) =>
  client.get('/management/store/select/search', {
    params: {
      page,
      size,
      searchText: searchText || undefined,
      registeredById: registeredById || undefined,
    },
  }).then((response) => response.data)

export const getStoreSelectById = (storeId) =>
  client.get(`/management/store/select/${encodeURIComponent(storeId)}`)
    .then((response) => response.data)

export const getStoreForEdit = (storeId) =>
  client.get(`/management/store/${encodeURIComponent(storeId)}/edit`)

export const updateStore = (payload) =>
  client.post('/management/store/update', payload)

export const getStoreWifi = (storeId) =>
  client.get(`/management/store/${encodeURIComponent(storeId)}/wifi`)

export const updateStoreWifi = (storeId, payload) =>
  client.post(`/management/store/${encodeURIComponent(storeId)}/wifi`, payload)

export const deleteStores = (ids) =>
  client.post('/management/store/del', ids)

export const getStoreReviewKeywords = (storeId) =>
  client.get(`/management/store/${encodeURIComponent(storeId)}/review-keywords`)

export const createStoreReviewKeyword = (storeId, keyword) =>
  client.post(`/management/store/${encodeURIComponent(storeId)}/review-keywords`, { keyword })

export const updateStoreReviewKeyword = (storeId, keywordId, keyword) =>
  client.post(
    `/management/store/${encodeURIComponent(storeId)}/review-keywords/${keywordId}/update`,
    { keyword },
  )

export const deleteStoreReviewKeywords = (storeId, ids) =>
  client.post(`/management/store/${encodeURIComponent(storeId)}/review-keywords/del`, ids)
