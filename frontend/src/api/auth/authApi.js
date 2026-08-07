import client, { ensureCsrf } from '../client'

export const getCsrf = () => ensureCsrf()

export const loginAdmin = (payload) =>
  client.post('/management/auth/login', payload, { skipUnauthorizedEvent: true })
    .then((response) => response.data)

export const signupAdmin = (payload) =>
  client.post('/management/auth/signup', payload, { skipUnauthorizedEvent: true })
    .then((response) => response.data)

export const sendSignupEmailCode = (email) =>
  client.post('/management/auth/email/signup/send', { email }, { skipUnauthorizedEvent: true })
    .then((response) => response.data)

export const verifySignupEmailCode = (email, code) =>
  client.post('/management/auth/email/signup/verify', { email, code }, { skipUnauthorizedEvent: true })
    .then((response) => response.data)

export const sendFindIdEmailCode = (email) =>
  client.post('/management/auth/recovery/find-id/send', { email }, { skipUnauthorizedEvent: true })
    .then((response) => response.data)

export const verifyFindIdEmailCode = (email, code) =>
  client.post('/management/auth/recovery/find-id/verify', { email, code }, { skipUnauthorizedEvent: true })
    .then((response) => response.data)

export const sendResetPasswordEmailCode = (loginId, email) =>
  client.post(
    '/management/auth/recovery/reset-password/send',
    { loginId, email },
    { skipUnauthorizedEvent: true },
  ).then((response) => response.data)

export const verifyResetPasswordEmailCode = (loginId, email, code) =>
  client.post(
    '/management/auth/recovery/reset-password/verify',
    { loginId, email, code },
    { skipUnauthorizedEvent: true },
  ).then((response) => response.data)

export const logoutAdmin = () =>
  client.post('/management/auth/logout')

export const getCurrentAdmin = () =>
  client.get('/management/auth/me')
    .then((response) => response.data)

export const updateCurrentAdmin = (payload) =>
  client.put('/management/auth/me', payload)
    .then((response) => response.data)
