# SKU Current Risk Usability Audit

Diagnostic-only audit; no production fields or protected logic changed.

## Recommendation

**FIX_FIRST** before SKU Signal v1 DESIGN: the 26FW APP universe has selling-age velocity coverage for 180/439 SKU, but 254 PRE-SALE and 5 WTD_ONLY rows are correctly not yet velocity-usable. Existing velocity is materially depressed by leading pre-launch zeros for 90/180 comparable rows, so current stock cover is not semantically stable for the active selling population.

The safe next step is a pipeline-semantic fix/design decision for age-aware velocity and cover. This is not a SKU Signal, priority, or action recommendation.

## 26FW APP coverage

| Lifecycle | Count |
|---|---:|
| PRE_SALE | 254 |
| W1 | 31 |
| W2 | 59 |
| W3 | 43 |
| W4 | 30 |
| W5 | 2 |
| W6 | 4 |
| W7 | 9 |
| W8 | 2 |
| WTD_ONLY | 5 |

- Selling-age velocity calculable: 180 / 439
- Existing positive velocity: 180 / 439
- True missing velocity with a completed positive selling week: 0
- WTD is excluded from both completed-week velocity calculations.

## Velocity and cover comparison

- Both velocity measures calculable: 180; exact: 47; relative MAE: 0.4254; median relative difference: 0.2698.
- Existing velocity is materially depressed for 90 comparable SKU using the >=25% diagnostic rule.
- Pre-launch zero weeks appear in the existing recent-4 window for 133 SKU (254 zero-week occurrences).
- Diagnostic cover calculable: 180; existing cover calculable: 180; newly usable versus existing: 0; materially moved: 90.

## Operational archetypes

| Archetype | Count |
|---|---:|
| EARLY_SELLING_WITH_AMPLE_STOCK | 144 |
| LOW_ON_HAND_WITH_PENDING_SUPPLY | 5 |
| NO_COMPLETED_SALES | 254 |
| W1_DISPLAY_ONLY | 31 |
| WTD_ONLY | 5 |

Representative examples are stored in the JSON artifact; Analog Pace percentile is retained only as an independent W2-W8 context field.

## Full-universe context

- 586 SKU rows retained separately from the 26FW APP focus.
- Lifecycle counts: `{"PRE_SALE": 321, "W1": 41, "W2": 90, "W3": 46, "W4": 44, "W5": 9, "W6": 5, "W7": 20, "W8": 2, "W9_PLUS": 1, "WTD_ONLY": 7}`
- Archetype counts: `{"EARLY_SELLING_WITH_AMPLE_STOCK": 210, "EARLY_SELLING_WITH_USABLE_COVER": 1, "LOW_ON_HAND_WITH_PENDING_SUPPLY": 5, "MATURE_COMPLETED_SALES": 1, "NO_COMPLETED_SALES": 321, "W1_DISPLAY_ONLY": 41, "WTD_ONLY": 7}`

## Decision

FIX_FIRST ??velocity/cover semantics need a pipeline fix or explicit age-aware field before SKU Signal v1 DESIGN can use Current Risk evidence.

SKU_CURRENT_RISK_USABILITY_AUDIT_READY
