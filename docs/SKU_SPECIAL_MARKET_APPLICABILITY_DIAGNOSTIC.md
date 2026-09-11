# SKU Special Market / Direct-Ship Applicability Diagnostic

Status: **READ-ONLY DIAGNOSTIC CONTRACT**. Production Current Risk, reorder logic, SKU Signal, Forecast, Analog Pace, priority, Action Engine, and protected fields are unchanged.

## Decision

`isSpecialMarket` and `directShipStatus` are separate facts. Current metadata provides only `isSpecialMarket`, derived from the STYLE product-name marker `[대만]`. Neither the current STYLE snapshot nor ERP SKU snapshot contains a direct-shipment, destination-country, logistics-route, or domestic-receipt-applicability field.

Direct shipment is therefore accepted only from exact-SKU evidence. It is never inferred from Special Market status, a `[대만]` name, another color in the same STYLE, negative ERP stock, negative Stock Cover, sales greater than recorded inbound, or missing domestic receipts.

## Confirmed evidence

`WA2603CRT1BK` is user-confirmed as a Taiwan-branch-exclusive SKU shipped entirely and directly to Taiwan. Its observed demand remains valid as demand evidence, but domestic inbound, ERP on-hand, Stock Cover, and domestic supply-risk interpretations are not applicable. This evidence is SKU-specific and is not propagated to `WA2603CRT1GR`.

## Current 26FW APP impact

| Measure | Count |
|---|---:|
| Total SKU | 439 |
| `isSpecialMarket=true` | 5 SKU / 3 STYLE |
| Exact-SKU confirmed direct ship | 1 |
| Special Market with direct ship `UNKNOWN` | 4 |
| Current market scope `UNKNOWN` | 295 |
| Confirmed domestic Current Risk misclassification | 1 |
| Possible misclassification requiring shipment evidence | 4 |

The five identified candidates are:

| SKU | STYLE | Direct ship | Domestic risk applicability | Current anomaly |
|---|---|---|---|---|
| WA2603CRT1BK | WA2603CRT1 | CONFIRMED | NOT APPLICABLE | ERP stock -48; selling-age cover -2.0571 |
| WA2603CRT1GR | WA2603CRT1 | UNKNOWN | REVIEW REQUIRED | ERP stock -73; selling-age cover -2.8077 |
| WA2603STT1BK | WA2603STT1 | UNKNOWN | REVIEW REQUIRED | ERP stock -42; selling-age cover -1.8529 |
| WA2603STT1WH | WA2603STT1 | UNKNOWN | REVIEW REQUIRED | ERP stock -37; selling-age cover -1.6324 |
| WA2603STT2CH | WA2603STT2 | UNKNOWN | REVIEW REQUIRED | ERP stock -67; selling-age cover -2.6447 |

All five current negative ERP stock and negative Stock Cover cases occur in the Special Market set. This is a strong reason to obtain route evidence, but it is not proof that the other four SKUs are direct-shipped.

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

## Next evidence needed

Obtain an authoritative SKU-level shipment route or destination field for the remaining four Special Market candidates and, separately, improve STYLE metadata coverage for the 295 unknown rows. Until then, retain `UNKNOWN`; do not implement production suppression or infer business rules from naming patterns.
