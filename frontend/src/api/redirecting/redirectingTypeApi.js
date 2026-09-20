import client from '../client'

export const listReviewTypes = () =>
  client.get('/management/redirecting-types')

export const createReviewType = (payload) =>
  client.post('/management/redirecting-types', payload)

export const updateReviewType = (id, payload) =>
  client.put(`/management/redirecting-types/${id}`, payload)

export const deleteReviewType = (id) =>
  client.delete(`/management/redirecting-types/${id}`)
