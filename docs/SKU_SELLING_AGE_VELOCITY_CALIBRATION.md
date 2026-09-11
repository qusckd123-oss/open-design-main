# SKU Selling-Age Velocity Calibration

25FW Clean Analog historical hold-out CALIBRATION; this is not production validation.

- Sample: 348 SKU / 166 STYLE
- Outcome: final December order sell-through; final >=60% is descriptive only.
- Production behavior changed: NO

## W1-W8 evidence

| Week | N | Legacy coverage | Age-aware coverage | Median age-vs-legacy Δ | Legacy Spearman | Age-aware Spearman | Legacy AUC >=60 | Age-aware AUC >=60 | Pre-launch zero rows/occurrences | Post-launch zero rows |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| W1 | 348 | 100.0% | 100.0% | 1.5 | 0.2412 | 0.2341 | 0.6543 | 0.6476 | 347/1022 | 0 |
| W2 | 348 | 100.0% | 100.0% | 0.4286 | 0.4124 | 0.4117 | 0.6997 | 0.6991 | 347/689 | 66 |
| W3 | 348 | 100.0% | 100.0% | 0.1111 | 0.5517 | 0.5517 | 0.7713 | 0.7713 | 347/347 | 77 |
| W4 | 348 | 100.0% | 100.0% | 0.0 | 0.6428 | 0.6428 | 0.8207 | 0.8207 | 0/0 | 81 |
| W5 | 348 | 100.0% | 100.0% | 0.0 | 0.5966 | 0.5966 | 0.7732 | 0.7732 | 0/0 | 83 |
| W6 | 348 | 100.0% | 100.0% | 0.0 | 0.6275 | 0.6275 | 0.7929 | 0.7929 | 0/0 | 83 |
| W7 | 348 | 100.0% | 100.0% | 0.0 | 0.6542 | 0.6542 | 0.7967 | 0.7967 | 0/0 | 84 |
| W8 | 348 | 100.0% | 100.0% | 0.0 | 0.636 | 0.636 | 0.7797 | 0.7797 | 0/0 | 85 |

## Stability

- Legacy: `{"adjacentPairCount": 2408, "medianAbsoluteRelativeWoWChange": 0.2848, "meanAbsoluteRelativeWoWChange": 0.8763}`
- Selling-age: `{"adjacentPairCount": 2408, "medianAbsoluteRelativeWoWChange": 0.2768, "meanAbsoluteRelativeWoWChange": 0.6317}`

## Stock-cover usefulness

Historical ERP stock snapshots are not present, so ERP stock-cover bins cannot be calibrated without hindsight or an invented stock series. The JSON includes explicitly labeled `orderQty - observed cumulative sales` proxy-cover bins for sensitivity only; they must not be treated as ERP stock-cover evidence.

## Supplemental non-ERP proxy-cover bins

| Week | <=2 | 2-4 | 4-6 | 6-10 | >10 |
|---:|---:|---:|---:|---:|---:|
| W1 | 5 / 100.0% | 0 / None% | 0 / None% | 0 / None% | 343 / 21.87% |
| W2 | 5 / 100.0% | 1 / 100.0% | 1 / 100.0% | 2 / 100.0% | 337 / 21.07% |
| W3 | 5 / 100.0% | 3 / 100.0% | 1 / 100.0% | 4 / 75.0% | 334 / 20.36% |
| W4 | 5 / 100.0% | 3 / 100.0% | 2 / 50.0% | 6 / 83.33% | 332 / 19.88% |
| W5 | 0 / None% | 2 / 100.0% | 6 / 83.33% | 12 / 75.0% | 315 / 18.73% |
| W6 | 0 / None% | 4 / 100.0% | 7 / 100.0% | 18 / 83.33% | 308 / 15.91% |
| W7 | 0 / None% | 4 / 100.0% | 11 / 100.0% | 22 / 90.91% | 306 / 13.07% |
| W8 | 0 / None% | 6 / 100.0% | 12 / 100.0% | 27 / 92.59% | 297 / 10.77% |

The proxy is not ERP stock and is excluded from the semantic decision.

## 26FW impact context

The existing 26FW APP usability audit remains the operational impact reference: 439 SKU, age-aware velocity calculable for 180, 90/180 materially depressed legacy velocity comparisons, and 133 rows containing 254 pre-launch-zero occurrences in the legacy recent-four window. These remain diagnostic facts only.

## Zero-week distortion and examples

- Pre-launch zeros are counted only inside the legacy recent-four window; post-launch zeros are counted separately after the first positive week.
- Representative rows are in `data/sku-selling-age-velocity-calibration.json` under `preLaunchZeroExamples`.

## Interpretation

Age-aware velocity is semantically cleaner for early decisions because it removes launch delay from the recency window without using future weeks. Coverage is the same in this Clean Analog checkpoint design because both measures are defined only once a first positive week exists; usefulness should be judged by stability and outcome relationship, not by coverage alone.

SKU_SELLING_AGE_VELOCITY_CALIBRATION_READY
