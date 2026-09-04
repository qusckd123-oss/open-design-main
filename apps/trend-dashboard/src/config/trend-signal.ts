export const combinedTrendSignalConfig = {
  hotSearchChange4w: 30,
  hotShoppingRatio: 60,
  risingSearchChange1w: 8,
  coolingSearchChange1w: -10,
  coolingShoppingRatio: 35,
  targetSearchChange4w: 20,
  targetShoppingRatio: 55,
  crossAgeShoppingRatio: 50,
  emergingYoY: 20,
  seasonalYoYTolerance: 15,
  qualityGoodCoverage: 0.8,
  qualityCheckCoverage: 0.45,
  qualityLowAverageRatio: 8
} as const;
