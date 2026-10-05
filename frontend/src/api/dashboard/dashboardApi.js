import client from "../client";

export const getDashboardSummary = (config = {}) =>
  client.get("/management/dashboard/summary", config);

export const getDashboardCharts = (storeId, config = {}) =>
  client.get("/management/dashboard/charts", { params: { storeId }, ...config });
