# Forecast Signal v1 Methodology

## 목적

Forecast Signal v1은 현재 재고위험인 `stockRisk`와 독립적으로 미래 재고 부족 가능성이 높은 APP STYLE을 선별하는 보조지표다. 자동 발주 기준이 아니며 기존 Preview, P1/P2, eligibility 및 Action Engine에 점수를 더하거나 판단을 변경하지 않는다.

## 데이터 범위

- Reference: 25FW APP 487 컬러 SKU / 222 STYLE
- 국내 성인 APP: 대만 직송 및 키즈 제외, 462 컬러 SKU / 207 STYLE
- Clean Analog: 348 컬러 SKU / 166 STYLE
- 판매 관측 구간: 2025-07-06부터 2025-12-28까지의 주간 데이터
- 12월 말 목표값은 2025-12-28 누계판매를 proxy로 사용
- 운영 Target: sales dashboard의 APP STYLE. ACC는 v1에서 제외

## Clean Analog 정의

다음 조건을 제외한다.

- 최초판매가와 현판매가가 다른 가격변경 컬러 SKU
- 입고 RAW에서 02차 이상이 확인된 컬러 SKU
- 분석 시작 전 누계판매가 존재하는 컬러 SKU
- 2025-12-28 누계판매 50pcs 미만 컬러 SKU
- 입고/발주 비율이 90% 미만인 컬러가 있는 공급제약 의심 STYLE
- 대만/TAIWAN 직송 및 키즈 상품

원본 Excel은 `.local-forecast-reference/`에만 두며 public 또는 dist에 포함하지 않는다. Builder 출력은 집계된 STYLE 곡선과 비식별 계산 메타만 `data/forecast-reference-v1.json`에 저장한다.

## Analog 선택

후보는 동일 복종이면서 Target과 다른 STYLE이어야 한다. 품명 구조 keyword, 가격, 성별, 판매 시작시점을 합산해 상위 5 STYLE을 선택한다.

- 구조 keyword: 일치 keyword당 1.5점, 최대 4.0점
- 동일 성별: 1.0점
- 판매 시작시점: 최대 1.0점
- 가격 유사도: 최대 1.0점

Keyword dictionary와 모든 weight는 `config/forecast-v1.json`에서 관리한다.

## Forecast 공식

Selling Week 1은 최초 positive 판매가 발생한 완료주다. 달력 일수 차이가 아니라 PDPER의 실제 weekly period sequence로 Selling Week를 계산하며 현재 partial WTD는 제외한다.

각 Analog의 Selling Week k 누적비중은 `Selling Week k 누적판매 / 2025-12-28 누계판매`다. 곡선은 cumulative max로 단조 증가를 보장하며 보정 발생 시 reference warning에 기록한다.

```text
baseForecastQty = currentCumulativeSales / analogCumulativeShare

trendFactor = 최근 완료 2주 평균 판매 / 최근 완료 4주 평균 판매

adjustedForecastQty = currentCumulativeSales
  + (baseForecastQty - currentCumulativeSales)
  * trendFactor ^ alpha

forecastSellThrough = adjustedForecastQty / PMETA[7] 순입고
```

Trend factor는 최대 1.5로 제한한다. 4주 이력이 부족하면 강제 계산하지 않는다. Alpha는 W1-W4 0, W5-W6 0.25, W7 0.5, W8 이상 0.75다. Adjusted Forecast는 현재 누계판매보다 작을 수 없다.

## Confidence

- W1-W3: LOW
- W4-W5: LOW_MID
- W6-W7: MID
- W8 이상: MID_HIGH
- Top Analog 3개 미만: 한 단계 하향
- 해당 복종 Clean 컬러 SKU sample 10개 미만: 한 단계 하향
- 판매 이력, Analog share, Trend 이력 또는 순입고 분모가 부족한 경우: INSUFFICIENT

## Forecast Signal

- HIGH: Forecast 판매율 60% 이상이고 Confidence가 MID 이상
- WATCH: Forecast 판매율 60% 이상이지만 Confidence가 MID 미만
- NORMAL: 그 외
- INSUFFICIENT: 계산 근거 부족

60%는 검토 후보 선별 기준이며 자동 리오더 기준이 아니다. Back-test 근거가 없는 추가 공식 threshold는 사용하지 않는다.

## Back-test 결과

- W8 Analog Top5: MdAPE 20.2%, WAPE 30.3%
- W8 Analog + Trend: MdAPE 16.6%, WAPE 27.9%
- Forecast 판매율 60% 이상 판정: Precision 70.9%, Recall 76.2%

## 한계 및 재검증

- 25FW 단일 시즌 결과다.
- 12월 28일 누계를 시즌말 proxy로 사용한다.
- 가격변경 SKU를 제외했다.
- 02차 리오더 표본은 2개 STYLE뿐이다.
- 26FW actual이 축적되면 threshold, 유사도 weight, alpha 및 confidence를 recalibration해야 한다.
