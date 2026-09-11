# SKU Analog Pace Calibration

이 문서는 25FW 동일 시즌 historical hold-out을 이용한 CALIBRATION이며 production VALIDATION이 아니다.

- Clean sample: 348 SKU / 166 STYLE
- Representation: Analog STYLE 내부 COLOR median 후 Top5 STYLE median
- Denominators: orderSellThrough, inboundSellThrough 비교
- Production 변경: 없음

## Current 26FW APP
- SKU: 439
- Pace calculable: 180
- Simulated fast pace (percentile >=75): 37
- Stock Cover NULL + fast pace: 0
- LOW Cover + fast pace (<=4 weeks): 5
- Supply pending + fast pace (<90% inbound completion): 18
- Pace index/percentile는 진단용이며 SKU Signal이 아니다.

## Calibration Summary

| Week | ORDER P75 final >=60% | ORDER P90 final >=60% | INBOUND P75 final >=60% | INBOUND P90 final >=60% |
|---:|---:|---:|---:|---:|
| W2 | 51.85% | 50.0% | 50.0% | 50.0% |
| W3 | 45.83% | 63.64% | 45.83% | 63.64% |
| W4 | 44.0% | 67.74% | 42.31% | 66.67% |
| W5 | 54.55% | 67.65% | 50.0% | 67.65% |
| W6 | 58.33% | 68.75% | 56.0% | 68.75% |
| W8 | 53.57% | 78.12% | 52.0% | 75.76% |

## Interpretation
- ORDER denominator은 분할입고 영향을 줄여 비교 기준으로 우선 검토한다.
- INBOUND denominator은 초기 분할입고 시 pace가 과대평가될 수 있어 병행 진단한다.
- 초기 주차의 작은 expected progress는 ratio 폭주 가능성이 있어 percentile과 함께 본다.
- remaining order quantity는 실제 가용재고가 아니며 supply pending 보조진단에만 사용한다.

## Top 30

| SKU | STYLE | W | Pace index | Pace percentile | Expected progress | Method |
|---|---|---:|---:|---:|---:|---|
| WA2603CRT1GR | WA2603CRT1 | 3 | 30.59 | 100.0 | 0.0255 | STYLE_TOP5 |
| WA2603CRT1BK | WA2603CRT1 | 3 | 27.45 | 100.0 | 0.0255 | STYLE_TOP5 |
| WA2603STT2CH | WA2603STT2 | 3 | 12.41 | 100.0 | 0.0612 | STYLE_TOP5 |
| WA2603STT1BK | WA2603STT1 | 3 | 11.10 | 100.0 | 0.0612 | STYLE_TOP5 |
| WA2603STT1WH | WA2603STT1 | 3 | 11.10 | 100.0 | 0.0612 | STYLE_TOP5 |
| WA2603CD11BL | WA2603CD11 | 2 | 8.69 | 100.0 | 0.0207 | STYLE_TOP5 |
| WA2603CR62BR | WA2603CR62 | 2 | 7.62 | 100.0 | 0.0179 | STYLE_TOP5 |
| WA2603CR62NA | WA2603CR62 | 2 | 6.37 | 100.0 | 0.0179 | STYLE_TOP5 |
| WA2603CD14GR | WA2603CD14 | 2 | 5.67 | 100.0 | 0.0207 | STYLE_TOP5 |
| WA2603LT62CH | WA2603LT62 | 3 | 5.45 | 100.0 | 0.0310 | STYLE_TOP5 |
| WA2603CR12NA | WA2603CR12 | 3 | 5.31 | 100.0 | 0.0255 | STYLE_TOP5 |
| WA2603LT62OT | WA2603LT62 | 3 | 4.77 | 100.0 | 0.0310 | STYLE_TOP5 |
| WA2603CR12GR | WA2603CR12 | 3 | 4.76 | 100.0 | 0.0255 | STYLE_TOP5 |
| WA2603CD11CH | WA2603CD11 | 2 | 4.74 | 100.0 | 0.0207 | STYLE_TOP5 |
| WA2603CR11BK | WA2603CR11 | 3 | 4.58 | 100.0 | 0.0255 | STYLE_TOP5 |
| WA2603PT13GR | WA2603PT13 | 3 | 4.48 | 100.0 | 0.0370 | STYLE_TOP5 |
| WA2603HZ62BK | WA2603HZ62 | 3 | 4.18 | 100.0 | 0.0382 | STYLE_TOP5 |
| WA2603CD14CM | WA2603CD14 | 2 | 3.77 | 100.0 | 0.0207 | STYLE_TOP5 |
| WA2603PT66CH | WA2603PT66 | 1 | 3.60 | 100.0 | 0.0078 | STYLE_TOP5 |
| WA2603CR11LG | WA2603CR11 | 3 | 3.60 | 100.0 | 0.0255 | STYLE_TOP5 |
| WA2603LT52TC | WA2603LT52 | 3 | 2.56 | 100.0 | 0.0310 | STYLE_TOP5 |
| WA2603LT13CH | WA2603LT13 | 3 | 2.07 | 100.0 | 0.0295 | STYLE_TOP5 |
| WA2603LT52NA | WA2603LT52 | 2 | 1.92 | 100.0 | 0.0140 | STYLE_TOP5 |
| WA2603HZ55GR | WA2603HZ55 | 2 | 1.60 | 100.0 | 0.0219 | STYLE_TOP5 |
| WA2603PT76BL | WA2603PT76 | 3 | 1.58 | 100.0 | 0.0511 | STYLE_TOP5 |
| WA2603HZ55BL | WA2603HZ55 | 2 | 1.54 | 100.0 | 0.0219 | STYLE_TOP5 |
| WA2603HZ62CM | WA2603HZ62 | 3 | 1.33 | 100.0 | 0.0382 | STYLE_TOP5 |
| WA2603ST12IV | WA2603ST12 | 7 | 1.30 | 100.0 | 0.4120 | STYLE_TOP5 |
| WA2603ST12CH | WA2603ST12 | 7 | 1.29 | 100.0 | 0.4120 | STYLE_TOP5 |
| WA2603KT62SB | WA2603KT62 | 4 | 1.27 | 100.0 | 0.0550 | STYLE_TOP5 |
