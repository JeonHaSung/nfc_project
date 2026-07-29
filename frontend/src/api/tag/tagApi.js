import client from '../client'

export const getTags = (storeId, tagType) =>
  client.get('/management/tag/list', { params: { storeId, tagType } })

export const createTag = (payload) =>
  client.post('/management/tag/insert', payload)

export const updateTag = (payload) =>
  client.post('/management/tag/update', payload)

export const deleteTags = (ids) =>
  client.post('/management/tag/del', ids)
