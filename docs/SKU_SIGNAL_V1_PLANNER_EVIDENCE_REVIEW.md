# SKU Signal v1 planner evidence review

Status: **COMPLETE — READ-ONLY WORDING / MISSINGNESS REVIEW**.

This review does not define a score, rank, priority, threshold, recommendation, reorder quantity, routing rule, production label, or automatic action. It reviews whether the existing state-machine evidence can be read safely by a planner and what display wording is required before any isolated read-only viewer is built.

Source: `data/sku-signal-v1-state-machine.json` (439 current 26FW APP SKUs) plus the already-completed Special Market/direct-ship applicability diagnostic for cross-context only. No external sync or source mutation was run.

## Fixed review sample

The sample is intentionally small and fixed. Five SKUs cover every currently populated lifecycle and every current conflict/data-quality marker.

| SKU | Lifecycle | Coverage in this review |
|---|---|---|
| `WA2603CD12GR` | PRE_SALE | lifecycle wording; unavailable completed demand/cover; `NEGATIVE_REMAINING_ORDER` |
| `WA2603CD65CM` | WTD_ONLY | WTD-only wording; first-completed-week missingness; unavailable trend |
| `WA2603CR14CM` | W1 | observation-only lifecycle; legacy vs selling-age velocity/cover difference; `ANALOG_PACE_PRESENT_OUTSIDE_W2_W8` |
| `WA2603CD11BL` | W2-W8 | fully available Early Pace facts; legacy vs selling-age difference; `STYLE_FORECAST_RAW_JOIN_OUTSIDE_W9_PLUS` |
| `WA2603CRT1BK` | W2-W8 | `NEGATIVE_ERP_STOCK`; `NEGATIVE_STOCK_COVER`; confirmed Taiwan direct-ship cross-context |

There is no current W9+ row, so W9+ planner wording cannot be current-row reviewed. Its branch remains covered only by synthetic state-machine tests.
## Review findings

### 1. Lifecycle meaning is structurally sound, but internal enum names are not planner copy

- `PRE_SALE` must not be shown as “출시 전”. The data only proves that no positive completed-week or current-WTD sale is observed; launch status itself is unknown. Planner copy should be **“판매 미관측 · 출시 여부 미판정”**.
- `WTD_ONLY` should read **“당주 판매만 관측 · 첫 완료주 대기”**. It must not be promoted to W1.
- `W1` should read **“첫 완료 판매주 · 관찰 전용”**.
- `W2-W8` should read **“판매 2~8주 · Early Pace 참고 가능”**.
- W9+ wording should remain provisional until a real current row exists; do not invent a current example.

### 2. Availability states need a display-language layer

The current machine states are correct for audit, but raw `AVAILABLE / DISPLAY_ONLY / UNAVAILABLE / NOT_APPLICABLE` labels are too technical for planner-facing UI.

- `AVAILABLE` → **사용 가능**
- `DISPLAY_ONLY` → **참고값**
- `UNAVAILABLE` → **계산 불가**, with the concrete reason adjacent
- `NOT_APPLICABLE` → **현재 단계 미적용**

A null `missingnessReason` on `NOT_APPLICABLE` is not missing evidence and must not be rendered as “사유 없음”. The lifecycle/applicability contract should supply the plain-language explanation instead.
### 3. “Conflict” markers are factual differences, not planner-facing errors

- `LEGACY_VS_SELLING_AGE_VELOCITY_DIFFERENT` → **기존 기준과 판매연령 기준 속도가 다름**. This is expected from different denominators and must not be called an error.
- `LEGACY_VS_SELLING_AGE_COVER_DIFFERENT` → **기존 기준과 판매연령 기준 커버가 다름**. Show both denominators if both values are visible.
- `ANALOG_PACE_PRESENT_OUTSIDE_W2_W8` → **원천 Pace 값 존재 · 현재 판매주차에서는 미적용**.
- `STYLE_FORECAST_RAW_JOIN_OUTSIDE_W9_PLUS` → **STYLE Forecast 원천 연결됨 · W9+ 전이라 SKU 판단에는 미적용**.

The internal `conflicts` array can remain unchanged. A viewer should translate it instead of exposing enum names or using warning/error styling by default.

### 4. Negative raw values require literal, non-prescriptive wording

- `NEGATIVE_REMAINING_ORDER`: say **“입고누계가 발주수량을 초과해 잔여오더 원천값이 음수”**. Do not call the value “pending”, “shortage”, or “excess stock”.
- `NEGATIVE_ERP_STOCK`: say **“ERP 재고 원천값이 음수”**. Do not infer urgency or stockout.
- `NEGATIVE_STOCK_COVER`: say **“음수 ERP 재고를 그대로 사용해 커버도 음수”**. Do not floor to zero and do not interpret as weeks-to-stockout.

### 5. Special Market scope must be visible next to domestic supply facts

`WA2603CRT1BK` proves the display risk: its state-machine row correctly preserves negative ERP stock and cover, while the separate applicability diagnostic now confirms it is Taiwan direct ship and domestic inbound/on-hand/cover risk interpretation is not applicable. The same applies to the other four confirmed Special Market SKUs.

A future read-only viewer may join the already-existing Special Market diagnostic strictly as display context so a planner does not mistake preserved domestic ERP anomalies for a domestic supply-risk conclusion. This is a presentation join only; it must not suppress rows, alter source facts, change lifecycle, or create a production rule.
## Verdict

**PASS FOR AN ISOLATED READ-ONLY VIEWER, WITH COPY GUARDRAILS.**

The evidence blocks are sufficiently separated and missingness is technically explicit. The main remaining risk is presentation: raw lifecycle enums, availability enums, conflict-marker names, and negative source values can be misread as business conclusions if shown without translation.

No state-machine schema or production logic change is required from this review.

## Next safe scope

If implemented separately, an isolated read-only viewer should:

- read only `data/sku-signal-v1-state-machine.json` plus `data/sku-special-market-applicability-diagnostic.json` for adjacent scope context;
- keep the SKU row as the primary unit;
- group lifecycle, demand, inventory, supply, Analog Pace, trend, and STYLE Forecast facts separately;
- use the planner-facing wording above for lifecycle, availability, applicability, and factual markers;
- show exact missing/unavailable reasons where they exist;
- preserve raw negative values and direct-ship scope context without turning either into an action signal;
- add no score, rank, priority, threshold, recommendation, reorder quantity, production label, routing, or external sync.

Production behavior changed: **NO**.

SKU_SIGNAL_V1_PLANNER_EVIDENCE_REVIEW_COMPLETE