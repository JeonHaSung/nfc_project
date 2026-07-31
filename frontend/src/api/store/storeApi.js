import client from '../client'

export const getStores = (params = {}) =>
  client.get('/management/store/list', { params })

export const getStoreSelectList = () =>
  client.get('/management/store/select/list')

export const updateStore = (payload) =>
  client.post('/management/store/update', payload)

export const deleteStores = (ids) =>
  client.post('/management/store/del', ids)
