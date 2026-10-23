import client from '../client'

const base = (storeId) => `/management/store/${encodeURIComponent(storeId)}/events`

export const getStoreEvents = (storeId) =>
  client.get(base(storeId))

export const createStoreEvent = (storeId, payload) =>
  client.post(base(storeId), payload)

export const updateStoreEvent = (storeId, eventId, payload) =>
  client.post(`${base(storeId)}/${eventId}/update`, payload)

export const toggleStoreEvent = (storeId, eventId, enabled) =>
  client.post(`${base(storeId)}/${eventId}/toggle`, { enabled })

export const deleteStoreEvents = (storeId, ids) =>
  client.post(`${base(storeId)}/del`, ids)
