export const naverShoppingInsightSupport = {
  endpoint: "/shopping/v1/category/keyword/age",
  ageGroups: ["10", "20", "30", "40", "50", "60"],
  targetAgeGroups: {
    "10": "10-19",
    "20": "20-29"
  },
  note:
    "Shopping Insight keyword age supports decade-level age groups only. Use Search Trend for finer 13-18, 19-24, 25-29 planning views."
} as const;
