import client from '../client'

export const getOnboardingTag = (ti) =>
  client.get('/onboarding/tag', { params: { ti } })
    .then((response) => response.data)

export const getMyOnboardingStores = (params = {}) =>
  client.get('/onboarding/my-stores', { params })
    .then((response) => response.data)

export const registerOnboardingStore = (payload) =>
  client.post('/onboarding/register-store', payload)
    .then((response) => response.data)

export const attachOnboardingCard = (payload) =>
  client.post('/onboarding/attach-card', payload)
    .then((response) => response.data)
