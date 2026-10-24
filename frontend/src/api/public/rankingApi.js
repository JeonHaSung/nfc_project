import client from '../client'

export const getPublicRankings = () =>
  client.get('/public/rankings', { skipUnauthorizedEvent: true, skipCsrf: true })
    .then((response) => response.data)
