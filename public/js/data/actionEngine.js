// Action Engine: decides REORDER / REALLOCATION / PROMOTION / WATCH-style outcomes for a style.
// This mirrors scripts/update_latest_from_sales.py's make_action()/reorder_timing() 1:1 so that
// results for existing local data never change. It only runs when a source does NOT already
// provide action/priority (e.g. a future remote sales feed with raw numbers only) - see normalize.js.
window.WackyActionEngine = (function (config) {
  function reorderTiming(sellThrough) {
    const target = config.REORDER_SELL_THROUGH_THRESHOLD;
    if (sellThrough >= target) {
      return { label: "30% 도달/초과", gap: 0 };
    }
    if (sellThrough >= config.REORDER_NEAR_THRESHOLD) {
      return { label: "30% 임박", gap: Math.round(target - sellThrough) };
    }
    return { label: "30% 전 관찰", gap: Math.round(target - sellThrough) };
  }

  // Internal action codes kept distinct from the Korean UI labels, per the "Action Engine" spec:
  // REORDER / REALLOCATION / PROMOTION / WATCH. UI copy is produced separately in toDisplayAction().
  const ACTION_CODES = {
    REORDER: "REORDER",
    REALLOCATION: "REALLOCATION",
    PROMOTION: "PROMOTION",
    WATCH: "WATCH"
  };

  const ACTION_LABELS = {
    REORDER: "리오더 검토",
    REALLOCATION: "배분/RT 검토",
    PROMOTION: "프로모션 검토",
    WATCH: "배분/RT 검토"
  };

  function decide({ wow, sellThrough, stock }) {
    const stockRate = Math.max(0, 100 - sellThrough);
    const timing = reorderTiming(sellThrough);

    if (sellThrough >= config.REORDER_SELL_THROUGH_THRESHOLD) {
      return {
        code: ACTION_CODES.REORDER,
        action: ACTION_LABELS.REORDER,
        priority: "P1",
        note: `${timing.label} 구간입니다. 판매율 30% 시점 기준으로 리오더 투입 여부와 예상 입고 시점을 우선 확인`,
        reorderTiming: timing.label
      };
    }
    if (sellThrough >= config.REORDER_NEAR_THRESHOLD) {
      return {
        code: ACTION_CODES.REORDER,
        action: ACTION_LABELS.REORDER,
        priority: "P2",
        note: `${timing.label} 구간으로 30%까지 약 ${timing.gap}%p 남았습니다. 판매율 30% 도달 전 선제 리오더 검토`,
        reorderTiming: timing.label
      };
    }
    if (wow != null && wow <= config.PROMOTION_WOW_THRESHOLD && stockRate >= config.PROMOTION_STOCKRATE_THRESHOLD) {
      return {
        code: ACTION_CODES.PROMOTION,
        action: ACTION_LABELS.PROMOTION,
        priority: "P3",
        note: "전주 대비 둔화와 높은 잔여재고율이 동시에 발생해 가격 할인/행사 검토",
        reorderTiming: timing.label
      };
    }
    if (stock >= config.REALLOCATION_STOCK_THRESHOLD && stockRate >= config.REALLOCATION_STOCKRATE_THRESHOLD) {
      return {
        code: ACTION_CODES.REALLOCATION,
        action: ACTION_LABELS.REALLOCATION,
        priority: "P2",
        note: "잔여재고율과 절대 재고가 높아 매장 이동(RT) 또는 채널 추가 배분 검토",
        reorderTiming: timing.label
      };
    }
    return {
      code: ACTION_CODES.WATCH,
      action: ACTION_LABELS.WATCH,
      priority: "P3",
      note: "금주 판매 흐름과 매장별 재고 편차 기준으로 배분 유지",
      reorderTiming: timing.label
    };
  }

  return { reorderTiming, decide, ACTION_CODES, ACTION_LABELS };
})(window.WackyActionConfig);
