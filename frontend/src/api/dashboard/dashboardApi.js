import client from '../client'

export const getDashboardSummary = () =>
  client.get('/management/dashboard/summary')

export const getDashboardCharts = (storeId) =>
  client.get('/management/dashboard/charts', { params: { storeId } })
