import client from '../client'

export const getAdminAccounts = () =>
  client.get('/management/admin/accounts')
    .then((response) => response.data)

export const searchAdminAccounts = ({ page = 1, size = 20, searchText = '', role = 'NORMAL' } = {}) =>
  client.get('/management/admin/accounts/search', {
    params: {
      page,
      size,
      searchText: searchText || undefined,
      role: role || undefined,
    },
  }).then((response) => response.data)

export const setAdminSuspended = (id, suspended) =>
  client.patch(`/management/admin/accounts/${id}/suspend`, { suspended })
    .then((response) => response.data)

export const deleteAdminAccount = (id) =>
  client.delete(`/management/admin/accounts/${id}`)
    .then((response) => response.data)
