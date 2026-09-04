// Thresholds for classifying NAVER Shopping Insight DEMAND observations.
// These operate on raw index-POINT change (current ratio - previous ratio),
// never on a % of the ratio - the ratio is already a 0-100 relative index,
// so a percent-of-percent reading is easy to misread as far more dramatic
// than the underlying index movement actually is.
export const demandSignalConfig = {
  // |point change| at or above this is reported as 관심 증가/관심 감소.
  changeThresholdPt: 6
} as const;
