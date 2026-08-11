import client from '../client'

export const getStores = (params = {}) =>
  client.get('/management/store/list', { params })

export const getStoreSelectList = () =>
  client.get('/management/store/select/list')

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

export const updateStore = (payload) =>
  client.post('/management/store/update', payload)

export const deleteStores = (ids) =>
  client.post('/management/store/del', ids)
