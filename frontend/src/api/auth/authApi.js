import client, { ensureCsrf } from '../client'

export const getCsrf = () => ensureCsrf()

export const loginAdmin = (payload) =>
  client.post('/management/auth/login', payload, { skipUnauthorizedEvent: true })
    .then((response) => response.data)

export const signupAdmin = (payload) =>
  client.post('/management/auth/signup', payload, { skipUnauthorizedEvent: true })
    .then((response) => response.data)

export const logoutAdmin = () =>
  client.post('/management/auth/logout')

export const getCurrentAdmin = () =>
  client.get('/management/auth/me')
    .then((response) => response.data)

export const updateCurrentAdmin = (payload) =>
  client.put('/management/auth/me', payload)
    .then((response) => response.data)
