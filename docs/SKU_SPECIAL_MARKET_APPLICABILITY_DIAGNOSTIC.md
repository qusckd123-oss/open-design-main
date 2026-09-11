# SKU Special Market / Direct-Ship Applicability Diagnostic

Status: **READ-ONLY DIAGNOSTIC CONTRACT**. Production Current Risk, reorder logic, SKU Signal, Forecast, Analog Pace, priority, Action Engine, and protected fields are unchanged.

## Decision

`isSpecialMarket` and `directShipStatus` are separate facts. Current metadata provides only `isSpecialMarket`, derived from the STYLE product-name marker `[대만]`. Neither the current STYLE snapshot nor ERP SKU snapshot contains a direct-shipment, destination-country, logistics-route, or domestic-receipt-applicability field.

Direct shipment is therefore accepted only from exact-SKU evidence. It is never inferred from Special Market status, a `[대만]` name, another color in the same STYLE, negative ERP stock, negative Stock Cover, sales greater than recorded inbound, or missing domestic receipts.

## Confirmed evidence

`WA2603CRT1BK` remains user-confirmed as a Taiwan-branch-exclusive SKU shipped entirely and directly to Taiwan.

The four previously unresolved SKUs are now also confirmed from two independent company records used together:

- The overseas-order PO `26FW 해외오더 PO_유니.xlsx` assigns each exact SKU to Taiwan: `WA2603CRT1GR` (`상품기획안_종합!E455,M455`; `ERP!A1102,K1102`), `WA2603STT1WH` (`E518,M518`; `A1106,K1106`), `WA2603STT1BK` (`E519,M519`; `A1105,K1105`), and `WA2603STT2CH` (`E526,M526`; `A1107,K1107`).
- The retained company logistics conversation (`teams-data-memorial-2026-09-04.md`, lines 73351-73359) identifies `WA2603CRT1`, `WA2603STT1`, and `WA2603STT2` as Taiwan-exclusive styles using the Taiwan direct-shipment route.

The PO supplies the exact SKU-to-Taiwan mapping; the logistics record supplies the direct-shipment route for the matching STYLE. Neither source alone is used to infer other SKUs. For all five confirmed SKUs, observed demand remains valid as demand evidence, while domestic inbound, ERP on-hand, Stock Cover, and domestic supply-risk interpretations are not applicable.

## Current 26FW APP impact

| Measure | Count |
|---|---:|
| Total SKU | 439 |
| `isSpecialMarket=true` | 5 SKU / 3 STYLE |
| Exact-SKU confirmed direct ship | 5 |
| Special Market with direct ship `UNKNOWN` | 0 |
| Current market scope `UNKNOWN` | 295 |
| Confirmed domestic Current Risk misclassification | 5 |
| Possible misclassification requiring shipment evidence | 0 |

The five identified candidates are:

| SKU | STYLE | Direct ship | Domestic risk applicability | Current anomaly |
|---|---|---|---|---|
| WA2603CRT1BK | WA2603CRT1 | CONFIRMED | NOT APPLICABLE | ERP stock -48; selling-age cover -2.0571 |
| WA2603CRT1GR | WA2603CRT1 | CONFIRMED | NOT APPLICABLE | ERP stock -73; selling-age cover -2.8077 |
| WA2603STT1BK | WA2603STT1 | CONFIRMED | NOT APPLICABLE | ERP stock -42; selling-age cover -1.8529 |
| WA2603STT1WH | WA2603STT1 | CONFIRMED | NOT APPLICABLE | ERP stock -37; selling-age cover -1.6324 |
| WA2603STT2CH | WA2603STT2 | CONFIRMED | NOT APPLICABLE | ERP stock -67; selling-age cover -2.6447 |

All five current negative ERP stock and negative Stock Cover cases occur in the Special Market set. Their domestic supply-risk interpretation is excluded only because each SKU now has authoritative route evidence, not because of that anomaly pattern.

The 295 `UNKNOWN` market-scope rows reflect missing STYLE metadata joins. They are reported as an evidence-coverage gap, not labeled as Special Market or direct ship and not included in the five identified candidates.

## Diagnostic contract

- `SPECIAL_MARKET` + exact direct-ship evidence: domestic supply-risk facts are `NOT_APPLICABLE_CONFIRMED_DIRECT_SHIP`.
- `SPECIAL_MARKET` + no direct-ship evidence: `REVIEW_REQUIRED_DIRECT_SHIP_UNKNOWN`.
- Special Market metadata unavailable: `UNKNOWN_MARKET_SCOPE`.
- Not marked Special Market: no Special Market exception is asserted, but direct-ship status is still not claimed as false.
- Demand, inventory, and supply facts remain separate. The diagnostic overlay does not rewrite any source value.

Reproducible inputs and output:

- Evidence registry: `config/special-market-direct-ship-evidence.json`
- Generator: `scripts/sku_special_market_applicability_diagnostic.py`
- Artifact: `data/sku-special-market-applicability-diagnostic.json`
- Tests: `tests/sku_special_market_applicability_diagnostic_test.py`

## Remaining evidence gap

No unresolved direct-ship status remains among the five currently identified Special Market SKUs. Separately, STYLE metadata coverage is still unavailable for 295 rows. They remain `UNKNOWN` market scope and must not be labeled Special Market, domestic, or direct ship without authoritative evidence. This diagnostic does not implement production suppression or infer business rules from naming patterns.
