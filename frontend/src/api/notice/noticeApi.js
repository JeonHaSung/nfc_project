import client from '../client'

export const getNotices = () =>
  client.get('/management/notice/list')

export const getActiveNotice = () =>
  client.get('/management/notice/active')

export const createNotice = (payload) =>
  client.post('/management/notice/create', payload)

export const updateNotice = (payload) =>
  client.post('/management/notice/update', payload)

export const deleteNotices = (ids) =>
  client.post('/management/notice/del', ids)

export const selectNotice = (id) =>
  client.post(`/management/notice/select/${id}`)

export const clearNoticeSelection = () =>
  client.post('/management/notice/select/clear')
