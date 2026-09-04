export const featureFlags = {
  enableNaverTrends: (process.env.ENABLE_NAVER_TRENDS ?? "false").toLowerCase() === "true",
  enableInternalSales: (process.env.ENABLE_INTERNAL_SALES ?? "false").toLowerCase() === "true"
};
