# SKU Analog Pace Applicability Audit

26FW APP: 439 SKU

NOT_YET_APPLICABLE (PRE-SALE): 254
WTD_ONLY (WAIT_FOR_FIRST_COMPLETED_WEEK): 5
DATA_UNRESOLVED: 0
STARTED SELLING: 185
PACE_READY: 149

## Applicability classification

{
  "PACE_READY": 149,
  "PACE_NOT_YET_APPLICABLE": 254,
  "PACE_WTD_ONLY_WAIT_FOR_FIRST_COMPLETED_WEEK": 5,
  "PACE_W1_DISPLAY_ONLY": 31
}

## WTD-only confirmation

{
  "count": 5,
  "rows": [
    {
      "sku": "WA2603CD65CM",
      "styleCode": "WA2603CD65",
      "category": "CD",
      "color": "CM",
      "cumulativeSalesQty": 1.0,
      "orderQty": 1473.0,
      "firstPositiveSalesPeriod": "2026-09-09",
      "latestCompletedPeriod": "2026-09-06",
      "currentWtdPeriod": "2026-09-07~2026-09-13",
      "currentWtdQty": 1.0,
      "calculatedSellingWeek": null,
      "currentProgressInput": {
        "firstPositiveIndex": null,
        "historyLength": 10,
        "index": null,
        "orderQty": 1473.0,
        "currentCumulative": null
      },
      "reason": "WTD_ONLY",
      "historySalesSum": 0.0,
      "completedHistorySalesSum": 0.0,
      "completedPlusWtdSalesSum": 1.0,
      "unexplainedHistoricalSales": 1.0,
      "wtdReconciliationDelta": 0.0
    },
    {
      "sku": "WA2603HZ61PI",
      "styleCode": "WA2603HZ61",
      "category": "HZ",
      "color": "PI",
      "cumulativeSalesQty": 1.0,
      "orderQty": 739.0,
      "firstPositiveSalesPeriod": "2026-09-09",
      "latestCompletedPeriod": "2026-09-06",
      "currentWtdPeriod": "2026-09-07~2026-09-13",
      "currentWtdQty": 1.0,
      "calculatedSellingWeek": null,
      "currentProgressInput": {
        "firstPositiveIndex": null,
        "historyLength": 10,
        "index": null,
        "orderQty": 739.0,
        "currentCumulative": null
      },
      "reason": "WTD_ONLY",
      "historySalesSum": 0.0,
      "completedHistorySalesSum": 0.0,
      "completedPlusWtdSalesSum": 1.0,
      "unexplainedHistoricalSales": 1.0,
      "wtdReconciliationDelta": 0.0
    },
    {
      "sku": "WA2603JK62BE",
      "styleCode": "WA2603JK62",
      "category": "JK",
      "color": "BE",
      "cumulativeSalesQty": 1.0,
      "orderQty": 700.0,
      "firstPositiveSalesPeriod": "2026-09-09",
      "latestCompletedPeriod": "2026-09-06",
      "currentWtdPeriod": "2026-09-07~2026-09-13",
      "currentWtdQty": 1.0,
      "calculatedSellingWeek": null,
      "currentProgressInput": {
        "firstPositiveIndex": null,
        "historyLength": 10,
        "index": null,
        "orderQty": 700.0,
        "currentCumulative": null
      },
      "reason": "WTD_ONLY",
      "historySalesSum": 0.0,
      "completedHistorySalesSum": 0.0,
      "completedPlusWtdSalesSum": 1.0,
      "unexplainedHistoricalSales": 1.0,
      "wtdReconciliationDelta": 0.0
    },
    {
      "sku": "WA2603PT61PI",
      "styleCode": "WA2603PT61",
      "category": "PT",
      "color": "PI",
      "cumulativeSalesQty": 1.0,
      "orderQty": 456.0,
      "firstPositiveSalesPeriod": "2026-09-09",
      "latestCompletedPeriod": "2026-09-06",
      "currentWtdPeriod": "2026-09-07~2026-09-13",
      "currentWtdQty": 1.0,
      "calculatedSellingWeek": null,
      "currentProgressInput": {
        "firstPositiveIndex": null,
        "historyLength": 10,
        "index": null,
        "orderQty": 456.0,
        "currentCumulative": null
      },
      "reason": "WTD_ONLY",
      "historySalesSum": 0.0,
      "completedHistorySalesSum": 0.0,
      "completedPlusWtdSalesSum": 1.0,
      "unexplainedHistoricalSales": 1.0,
      "wtdReconciliationDelta": 0.0
    },
    {
      "sku": "WA2604PT16BL",
      "styleCode": "WA2604PT16",
      "category": "PT",
      "color": "BL",
      "cumulativeSalesQty": 1.0,
      "orderQty": 800.0,
      "firstPositiveSalesPeriod": "2026-09-09",
      "latestCompletedPeriod": "2026-09-06",
      "currentWtdPeriod": "2026-09-07~2026-09-13",
      "currentWtdQty": 1.0,
      "calculatedSellingWeek": null,
      "currentProgressInput": {
        "firstPositiveIndex": null,
        "historyLength": 10,
        "index": null,
        "orderQty": 800.0,
        "currentCumulative": null
      },
      "reason": "WTD_ONLY",
      "historySalesSum": 0.0,
      "completedHistorySalesSum": 0.0,
      "completedPlusWtdSalesSum": 1.0,
      "unexplainedHistoricalSales": 1.0,
      "wtdReconciliationDelta": 0.0
    }
  ],
  "rule": "cumulativeSalesQty == completedHistorySalesSum + currentWtdQty; completedHistorySalesSum == 0; currentWtdQty > 0",
  "analogPace": "NOT_APPLICABLE until first completed sales week; do not manufacture W1",
  "classification": "WTD_ONLY / WAIT_FOR_FIRST_COMPLETED_WEEK"
}

## Selling week distribution

|Bucket|SKU|Positive sales|PACE_READY|
|---|---:|---:|---:|
|NO_SALE|254|0|0|
|WTD_ONLY|5|5|0|
|DATA_UNRESOLVED|0|0|0|
|W1|31|31|0|
|W2|59|59|59|
|W3|43|43|43|
|W4|30|30|30|
|W5|2|2|2|
|W6|4|4|4|
|W7|9|9|9|
|W8|2|2|2|
|W9-W12|0|0|0|
|W13+|0|0|0|

## Reconciliation diagnostics

Diagnostic A (informational): cumulativeSalesQty vs completed history only.
Diagnostic B (proper reconciliation): cumulativeSalesQty vs completed history plus currentWtdQty.

{
  "diagnosticA_cumulativeVsCompletedOnly": {
    "counts": {
      "remaining_mismatch": 106,
      "exact": 291,
      "within_1": 42
    },
    "maxAbsoluteDifference": 36.0,
    "p95AbsoluteDifference": 7.0
  },
  "diagnosticB_cumulativeVsCompletedPlusCurrentWtd": {
    "counts": {
      "exact": 439
    },
    "maxAbsoluteDifference": 0.0,
    "p95AbsoluteDifference": 0.0
  },
  "interpretation": "Diagnostic A is informational because cumulativeSalesQty includes current WTD while completedWeeklyHistory excludes WTD. Diagnostic B is the proper reconciliation."
}

## Incident note: CURRENT selling-week semantic bug

Confirmed: the prior current diagnostic used `firstPositiveIndex + 1` on oldest-to-newest completed history. The corrected current week is elapsed completed selling weeks since first positive, inclusive: `historyLength - firstPositiveIndex`. For example, index 6 in a 10-period history is W4, not W7; this also prevents `progress_at` from indexing past the current history. Historical 25FW W1-W8 hold-out calibration is unchanged. The stale 15/439 and 15/90 figures must not be reused.

## Root cause audits

SEASON_WEEK_OUT_OF_RANGE: 0 → {'A_MATURE_W9_PLUS': 0, 'B_REFERENCE_TRUNCATED': 0, 'C_SELLING_WEEK_CALC_ERROR': 0, 'D_CALENDAR_ALIGNMENT': 0, 'E_OTHER_NO_CUMULATIVE_SALES': 0}
NO_CURRENT_PROGRESS: 0 (positive sales: 0)

## ERP cumulative vs weekly reconciliation
{
  "diagnosticA_cumulativeVsCompletedOnly": {
    "counts": {
      "remaining_mismatch": 106,
      "exact": 291,
      "within_1": 42
    },
    "maxAbsoluteDifference": 36.0,
    "p95AbsoluteDifference": 7.0
  },
  "diagnosticB_cumulativeVsCompletedPlusCurrentWtd": {
    "counts": {
      "exact": 439
    },
    "maxAbsoluteDifference": 0.0,
    "p95AbsoluteDifference": 0.0
  },
  "interpretation": "Diagnostic A is informational because cumulativeSalesQty includes current WTD while completedWeeklyHistory excludes WTD. Diagnostic B is the proper reconciliation."
}

## Historical/source range
{
  "historicalMaxSellingWeekDistribution": {
    "W20+": 348
  },
  "weeklySourcePeriods": {
    "currentMin": "2026-07-05",
    "currentMax": "2026-09-06",
    "uniqueCount": 10
  },
  "sourceRange": {
    "earliest": "2025-07-06",
    "latest": "2026-04-30",
    "periodCount": 44
  }
}

## True applicable universe
{
  "ALL_26FW_APP": 439,
  "NOT_YET_APPLICABLE": 254,
  "WTD_ONLY": 5,
  "DATA_UNRESOLVED": 0,
  "STARTED_SELLING": 185,
  "EARLY_PACE_APPLICABLE": 149,
  "PACE_DATA_ELIGIBLE": 149,
  "PACE_READY": 149,
  "PACE_FAILED": 0,
  "PRE_SALE": 254
}

## Coverage
{
  "ready_all": 33.94,
  "ready_started": 80.54,
  "ready_early": 100.0,
  "ready_dataeligible": 100.0
}

## Category started vs ready
{
  "CD": {
    "total": 36,
    "started": 27,
    "earlyApplicable": 26,
    "ready": 26
  },
  "CR": {
    "total": 56,
    "started": 23,
    "earlyApplicable": 15,
    "ready": 15
  },
  "DP": {
    "total": 28,
    "started": 0,
    "earlyApplicable": 0,
    "ready": 0
  },
  "HD": {
    "total": 19,
    "started": 8,
    "earlyApplicable": 7,
    "ready": 7
  },
  "HZ": {
    "total": 47,
    "started": 13,
    "earlyApplicable": 7,
    "ready": 7
  },
  "JK": {
    "total": 69,
    "started": 5,
    "earlyApplicable": 1,
    "ready": 1
  },
  "KT": {
    "total": 20,
    "started": 13,
    "earlyApplicable": 11,
    "ready": 11
  },
  "LT": {
    "total": 28,
    "started": 20,
    "earlyApplicable": 20,
    "ready": 20
  },
  "PT": {
    "total": 77,
    "started": 30,
    "earlyApplicable": 21,
    "ready": 21
  },
  "SH": {
    "total": 17,
    "started": 13,
    "earlyApplicable": 10,
    "ready": 10
  },
  "SO": {
    "total": 4,
    "started": 0,
    "earlyApplicable": 0,
    "ready": 0
  },
  "SR": {
    "total": 10,
    "started": 7,
    "earlyApplicable": 5,
    "ready": 5
  },
  "ST": {
    "total": 28,
    "started": 26,
    "earlyApplicable": 26,
    "ready": 26
  }
}

Pipeline fix required: NO — diagnostic classification corrected
Recommended lifecycle: PRE-SALE → observation; W1 → display only; W2-W8 → Analog Pace diagnostic; W9+ → Current Risk/Trend/Forecast context.

Production change: NO
SKU Signal: NO

SKU_ANALOG_PACE_APPLICABILITY_AUDIT_READY
