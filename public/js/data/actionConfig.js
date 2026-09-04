// Action Engine thresholds, extracted from scripts/update_latest_from_sales.py (make_action / reorder_timing).
// Values are unchanged from the existing logic on purpose - only the location moved so they can be
// tuned later without touching the decision logic itself.
window.WackyActionConfig = {
  REORDER_SELL_THROUGH_THRESHOLD: 30,
  REORDER_NEAR_THRESHOLD: 25,
  PROMOTION_WOW_THRESHOLD: -35,
  PROMOTION_STOCKRATE_THRESHOLD: 65,
  REALLOCATION_STOCK_THRESHOLD: 800,
  REALLOCATION_STOCKRATE_THRESHOLD: 55,
  KPI_SELL_THROUGH_HEALTHY: 60,
  KPI_STOCKRATE_RISK: 65
};
