import client from '../client'

export const getRestoreStores = (registeredById) =>
  client.get('/management/restore/stores', { params: { registeredById } })

export const getRestoreTags = (storeId) =>
  client.get(`/management/restore/stores/${encodeURIComponent(storeId)}/tags`)

export const restoreStore = (storeId) =>
  client.post(`/management/restore/stores/${encodeURIComponent(storeId)}`)

export const restoreTag = (tagId) =>
  client.post(`/management/restore/tags/${encodeURIComponent(tagId)}`)

export const recycleTag = (tagId) =>
  client.post(`/management/restore/tags/${encodeURIComponent(tagId)}/recycle`)

export const getStorePurgeLogs = () =>
  client.get('/management/restore/purge-logs')

export const purgeStore = (storeId, payload) =>
  client.post(`/management/restore/stores/${encodeURIComponent(storeId)}/purge`, payload)
