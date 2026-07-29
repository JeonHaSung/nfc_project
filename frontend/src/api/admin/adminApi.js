import client from '../client'

export const getAdminAccounts = () =>
  client.get('/management/admin/accounts')
    .then((response) => response.data)

export const createAdminAccount = (payload) =>
  client.post('/management/admin/accounts', payload)
    .then((response) => response.data)

export const updateAdminAccount = (id, payload) =>
  client.put(`/management/admin/accounts/${id}`, payload)
    .then((response) => response.data)

export const resetAdminPassword = (id, newPassword) =>
  client.patch(`/management/admin/accounts/${id}/password`, { newPassword })
    .then((response) => response.data)

export const deleteAdminAccount = (id) =>
  client.delete(`/management/admin/accounts/${id}`)
    .then((response) => response.data)
