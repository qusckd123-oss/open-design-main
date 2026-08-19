@AGENTS.md

# Wacky Willy business memory

## Role

- Act as the Korean-language AI assistant for B:CAVE WACKY WILLY merchandising work.
- Support apparel planning work for manager Han Byeonghyun and planning operator Byeon Changhyun.
- Keep answers concise and practical. If information is not recorded, say so.
- User-confirmed current org context: Seong Hyeonjin is the WACKY WILLY apparel planning team lead.
- Kim Minhyuk was the WACKY WILLY apparel planning team lead during the Teams chat history below, but has since moved departments. If the current org chart differs, treat the chat as historical context.

## Output Rule

- This rule applies to all generated deliverables, not only briefing HTML.
- Save every newly generated user-facing file under `output/` by default: HTML, PDF, PNG, PPTX, DOCX, XLSX, MD, CSV, scripts made as deliverables, and any supporting assets.
- Treat source/reference folders such as `?? ??/`, `?? ???/`, `???? ?????/`, `ST01, 02 ??/`, Teams data folders, and template folders as inputs only unless the user explicitly asks to overwrite or update a source file.
- Even when the user references a source folder or template path, create the generated result in `output/` unless they explicitly say to save there or modify the original.
- For HTML/report deliverables, create a dedicated folder under `output/` and put the main file at `index.html` when practical. Copy required images/assets into that output folder and use relative paths so the deliverable opens independently.

## Teams Update Response Rule

- When the user asks to summarize Teams chat/channel updates through today and save decided items to memory, update `CLAUDE.md`, and push to GitHub, always also answer directly in chat with the three requested sections: `결정된 것`, `안 정해진 것`, and `다음 할 일`.
- The final chat answer should include the substantive summary first, then briefly mention saved files, commit, and push status.

## Wacky Apparel Meeting HTML Skill Rule

- Use the local Codex skill `wacky-apparel-meeting-html` for WACKY WILLY apparel weekly meeting HTML reports based on the fixed `26SS_26FW_8월2주차_어패럴_주간회의자료.html` layout.
- The skill is saved locally at `C:\Users\bcave\.codex\skills\wacky-apparel-meeting-html`.
- Keep the report APP-first. ACC/SHOES should be shown only as reference KPI/context unless the user explicitly asks for total-company sales.
- Split KPI labels as `APP 전체 (과시즌 포함)`, `26SS APP`, `26FW APP`, `ERP 전체 (ACC/과시즌 포함)`, and separate ACC reference rows. Do not collapse the main KPI into `26SS+26FW APP` when the user needs season visibility.
- For APP figures, use apparel product-code categories only. Treat `WA2601/WA2602` as 26SS APP, `WA2603` as 26FW APP, and older season codes as 과시즌 APP unless the user gives a different season map.
- Product images should not be solved as internal-only. When the user allows external lookup, search Wacky Willy official pages first and Musinsa second by base style code, then attach the color code after confirming product name, option text, image alt text, or visible color label.
- Do not leave visible `IMAGE CHECK` text in final HTML. If an image cannot be confirmed, use an empty fixed `.no-img` container or a clearly labeled source limitation note outside the image box.
- For the 2026-08-03 to 2026-08-09 generated report, the corrected KPI basis is: APP 전체 8.35억, 26SS APP 6.32억, 26FW APP 3,157만, 과시즌 APP 1.71억, ERP 전체 10.05억.

## Current Teams Summary - 2026-08-19

- Use `workspace/memory/current-teams-update-summary-2026-08-19.md` as the latest Teams update source for decided items, unresolved items, and next actions from local Teams chat/channel backup files written on 2026-08-18 morning and clipped as 2026-08-17. No local Teams backup clipped as 2026-08-18 or 2026-08-19 was found.
- 2026-08-19 결정된 것: 27SS 2PACK/3PACK 선발주는 1월 입고 목표로 진행 가능하며 2PACK 20,000SET, 3PACK 10,000SET 기준이다. 2PACK에는 WH 컬러 추가분을 포함한다. 3PACK은 기존 15,000SET 방향에서 10,000SET로 축소하고, 우선 10,000SET 진행 후 판매 흐름에 따라 추가 여부를 판단한다. WA2602STE1 2PACK은 현재 운영을 유지하면서 행사 및 매장 전 채널로 하반기 판매를 진행하고, WA2602STE3 3PACK은 백화점/쇼핑몰 재고를 아울렛, 면세, 플래그쉽 중심으로 RT해 잔여 약 4,000PCS를 하반기에 최대 소진한다. 단기 3PACK 리오더는 3,000SET에서 2,000SET로 축소해 우선 진행하는 방향이다. 26FW SPOT 해외 오더 1,885PCS는 PO를 분리하지 않고 국내 입고 후 글로벌팀에서 이관하며 별도 택갈이는 하지 않는다. WA2603ST13은 BLUE에서 YELLOW로 변경됐다. 26FW QR 구성 파일은 `26FW 와키윌리 QR구성(SPOT,Reorder).xlsx`로 실시간 업데이트한다. 광복점 익스클루시브는 오픈에이 진행 예정이며 BT 불출 요청과 20수 싱글 소재 기준이 공유됐다. WA2601LT15 위클리플랜 생산 건은 금주 PO 발행, 브라운 1컬러 1,000장 기준으로 10/1~10/2 물류 입고 가능하다고 확인됐다. 데님라이크는 봄 상품 SDPK, 여름 상품 아이제이로 진행한다. 27SS 재고 원단 소진 계획은 `27SS 재고 원단 소진 계획.xlsx`와 `★27SS 아이템별 상품 MAP.xlsx` 기준으로 업데이트하며 온타이드 건은 별도 소진 계획이 필요 없어 리스트에서 삭제됐다. WA2604JK21 대만지사 건은 판매가 기재 요청이 들어왔다.
- 2026-08-19 안 정해진 것: 2PACK/3PACK 선발주와 원사 발주가 실제 PO로 완료됐는지, 3PACK 10,000SET의 채널별 배분과 RT 실행 수량, 단기 3PACK 2,000SET 리오더의 최종 오더/면세 판매 반영/PO 완료 여부, 플래그쉽 전용 파자마 WA0000SU01의 시즌 품번 변경 여부, 더현대 팝업의 최종 상품 리스트와 프로모션 조건, WA2601LT15의 AS-IS 편직 또는 유사 스트라이프 대체 여부, 광복점 익스클루시브의 최종 품번/작업지시서/생산 일정, 26FW 워싱물 및 기모 스웻류의 스타일별 수량/협력사/납기/PO 데드라인, 대만 직송 관련 O.C/대만지사 반영 완료 여부는 확인이 필요하다.
- 2026-08-19 다음 할 일: 2PACK/3PACK 발주 상태와 2PACK WH/3PACK 축소안 반영을 확인한다. 8/20 면세 판매 후 가용 재고를 기준으로 단기 3PACK 리오더와 27SS 10,000SET 선입고 계획을 분리 확정한다. WA2602STE3 하반기 RT 배분표를 확정한다. 더현대 팝업 상품 리스트, 할인/GWP/프리오더 조건, 리오더 필요 스타일을 영업기획과 재확인한다. WA2601LT15는 AS-IS 편직과 대체 원단을 납기/MOQ/원가 기준으로 비교한다. 26FW QR 파일의 SPOT/REORDER 최신 수량, 납기, 협력사, PO 데드라인을 업데이트한다. 27SS 재고 원단 소진 계획과 `★27SS 아이템별 상품 MAP.xlsx`를 맞추고 협력사 변경 검토 품번을 별도 표시한다. WA2604JK21 판매가와 대만 직송 파일 반영 여부를 확인한다.

## Current Teams Summary - 2026-08-18

- Use `workspace/memory/current-teams-update-summary-2026-08-18.md` as the latest Teams update source for decided items, unresolved items, and next actions from Teams chat/channel backup files written locally on 2026-08-18 morning. The newest local source files are clipped as 2026-08-17; no local Teams backup clipped as 2026-08-18 was found.
- 2026-08-18 결정된 것: 27SS 2PACK/3PACK 선발주는 1월 입고 목표로 무리 없다는 방향이 공유됐고, 2PACK은 20,000SET, 3PACK은 10,000SET으로 잡으며 지연 방지를 위해 원사 발주를 먼저 진행하기로 했다. 2PACK에는 WH 컬러 추가분을 포함한다. 3PACK은 기존 15,000SET에서 10,000SET으로 축소하고 면세/FSS/아울렛 전용 성격으로 운영하는 의견이 확인됐으며, 하반기 WA2602STE1 투팩은 현행 유지 및 전 채널 운영, WA2602STE3 3팩은 백화점/쇼핑몰 재고를 아울렛·면세·플래그십 집중 판매로 RT하는 방향이다. 광복점 익스클루시브 티셔츠는 4ST/4SKU로 진행하기로 결정됐고, 오픈에이 진행 예정 및 BT 불출 요청, 20수 싱글 소재 기준이 공유됐다. 방탄 지민 롱슬리브 리오더는 다음주 월요일 판매 체크 후 바로 진행하는 방향이며, 차주 화요일 오전 PO 불출 기준 10/1~10/2 납기 예상, 700장 이상 오더 시 원가율 23.8%, 700장 미만 MOQ 미충족 시 25.2%로 공유됐다. 더현대 팝업은 2026-09-17~2026-09-30 일정의 악세/영업기획 소통 내용을 정리했고, 지원 인력은 소싱팀/디자인실/마케팅팀 각 1명씩 1타임 10:00~12:00 진승현/배용준/권순범, 2타임 13:00~15:00 김호진/안동균/박다솜, 3타임 15:00~17:00 유지원/김헌수/박성민으로 수정 공유됐다. 데님라이크는 봄상품 SDPK, 여름상품 아이제이로 진행한다. 뉴베이직은 러닝 가능한 소재 기반 유니 아이템 수량을 보수적으로 가져가고, 전년과 다른 디테일/그래픽 포인트를 캐드 검토 단계에서 재점검하는 방향이다. 27SS 재고 원단 소진 계획은 `27SS 재고 원단 소진 계획.xlsx`와 `★27SS 아이템별 상품 MAP.xlsx`를 참고해 업데이트하며, 온타이드 건은 중국 보관으로 확인됐고 별도 소진 계획이 필요 없어 리스트에서 삭제됐다. WA2604JK21 대만지사 건은 판매가 기재 요청이 들어왔다.
- 2026-08-18 안 정해진 것: 2PACK 20,000SET, 3PACK 10,000SET 선발주 및 원사 발주가 실제 PO로 완료됐는지는 확인되지 않았다. 3PACK 축소 운영안의 최종 채널별 물량 배분, RT 실행 수량, 면세/FSS/아울렛별 운영 방식은 추가 확인이 필요하다. 방탄 지민 롱슬리브 리오더는 월요일 판매 체크 후 결정하기로 했으므로 최종 오더 수량, 700장 이상 진행 여부, 원가율 확정, 실제 PO 불출 여부는 미정이다. 더현대 팝업은 미팅 내용 정리는 완료됐지만 최종 운영 품목, 프로모션, 인력 확정, 부서별 실행안, 팝업 지원 타임별 실제 참석 가능 여부는 완료로 확인되지 않았다. 광복점 익스클루시브 티셔츠 4ST/4SKU의 최종 품번, 작업지시서 확정, BT 불출 완료, 생산 일정 및 납기는 파일 본문만으로는 확정되지 않았다. 데님라이크 봄 SDPK/여름 아이제이 진행 외에 세부 원가, 품질 기준, 최종 스타일별 수량은 확인이 필요하다. 27SS 재고 원단 소진 계획은 업데이트 예정 상태이며 협력사 변경 검토가 필요한 기존 진행 품번의 최종 방향은 확정되지 않았다. WA2604JK21 대만지사 판매가 기재 완료 여부는 확인되지 않았다. 2026-08-18 당일 Teams 메시지 백업은 로컬에서 확인되지 않았다.
- 2026-08-18 다음 할 일: 2PACK/3PACK은 원사 발주 및 PO 진행 상태를 확인하고, 2PACK WH 컬러 추가 반영 여부와 3PACK 10,000SET 축소 운영안을 발주 파일에 반영한다. 3PACK 하반기 운영은 WA2602STE1 현행 유지, WA2602STE3 아울렛·면세·플래그십 집중 판매 RT 기준으로 채널별 실행 수량과 이동 일정을 확정한다. 방탄 지민 롱슬리브 리오더는 다음주 월요일 판매 흐름을 체크한 뒤 700장 이상 오더 여부를 결정하고, 차주 화요일 오전 PO 불출 및 10/1~10/2 납기 가능성을 재확인한다. 광복점 익스클루시브 티셔츠는 4ST/4SKU 기준으로 오픈에이 BT 불출, 20수 싱글 소재, 작업지시서/품번/납기 확정을 진행한다. 더현대 팝업은 악세/영업기획과 정리한 미팅 내용을 기준으로 상품, 프로모션, 운영 인력, 부서별 실행안을 확정하고 타임별 지원자 참석 가능 여부를 체크한다. 데님라이크는 봄상품 SDPK, 여름상품 아이제이 기준으로 원가·품질·수량 계획을 스타일별로 확정한다. 27SS 재고 원단 소진 계획 파일을 `★27SS 아이템별 상품 MAP.xlsx`와 맞춰 업데이트하고 협력사 변경 검토 대상 품번을 별도 표시한다. WA2604JK21 대만지사 판매가를 기재하고 글로벌/대만지사 공유 파일 반영 여부를 확인한다.

## Current Teams Summary - 2026-08-13

- Use `workspace/memory/current-teams-update-summary-2026-08-13.md` as the latest Teams update source for decided items, unresolved items, and next actions from Teams chat/channel backup files written on 2026-08-13 morning. The newest local source files are clipped as 2026-08-12; no local Teams backup clipped as 2026-08-13 was found.
- 2026-08-13 결정된 것: 더현대 서울 팝업 상품 리스트 양식 `26FW 더현대 팝업 상품 LIST.xlsx`가 `MD[실무]-발주리스트-26FW` 폴더에 업로드됐다. 팝업 상품 방향은 원이 컷 기반 착장 섹션과 티셔츠류 스낵아이템, 경량패딩, 플리스 중심 세일즈 섹션으로 나누는 안으로 정리됐다. 착장 할인은 최대 20%+GWP가 적정하다는 의견이 공유됐고, 플리스/경량아우터는 30% 프리오더 선구매 방식이 제안됐다. 전체 상품 리스트는 금요일 오후 전달하고 리센느 굿즈 팝업과 머치상품 중복 여부를 확인하기 위해 전체 품목 전달이 필요하다는 점이 확인됐다. WA2601LT15 BR은 방탄 지민 콘서트 착장 노출로 무신사 판매가 급증했으며 무신사 주문 32PCS 외 약 70PCS 풀필먼트 입고 예정, 창고 잔여 약 100PCS이고 온라인 단독 운영으로 이야기됐다. WA2601LT15 리오더는 국내 생산/국내 시장지/재고 기준 30일 내 가능 여부로 검토하고, 유사 스트라이프 원단 수배 또는 AS-IS 편직 중 선택해야 한다. 샘플 판매 가격표는 아우터/바텀/이너 기준으로 정리하고 다운/자켓류는 타브랜드 기준보다 5천원 더 낮게, 티셔츠류는 5천원 통일 구조로 만들기로 했다. 27SS 뉴베이직 추가 스타일 미팅은 카테고리별 점검, SKU, 수량, 27SS 진행 스케줄을 함께 보는 방식으로 잡았다. 3PACK 리오더는 사업부장 지시에 따라 3,000SET에서 2,000SET으로 축소해 우선 진행시키고, 잔여 약 4,000PCS는 면세점 RT 및 집중 판매, 쇼핑몰/백화점 재고는 면세/아울렛/직영 RT로 운영 매장을 축소하는 방향이다. 연간 운영 스타일도 품번 이원화가 필요하다는 기준이 공유됐고, 플래그십 전용 파자마 `WA0000SU01`도 `WA2603SU01` 같은 시즌 품번 형태가 바람직하다는 의견이 제시됐다. 27SS 매장별 운영 SKU 자료는 채널별 운영 SKU 중심으로 먼저 공유됐고 최종 27SS 피드백은 차주 화요일까지 어실장 리뷰 후 공유한다. 데님라이크 신규 업체와 SDPK 원가 비교 요청이 들어갔고 3개 스타일 비교 견적이 우선 공유됐다. 27SS SKU 등급/비중 기준은 전체 수량 비중이 아니라 SKU별 수량 순위 기준으로 상위 10% SKU를 S로 자르는 방식이다. 가을 스트릿 컬렉션 KPI는 촬영 품의서 상신용으로 ASAP 작성 요청됐고, APPAREL 대상 규모는 촬영 전체 85SKU, 재고 77,887PCS, 재고금액 87.5억 원이며 콘텐츠 활용 추가 소진율 +15%, 추가 소진 11,682PCS, 추가 매출 13.1억 원 목표가 제안됐다. WA2603KT12 대만 직송일자 파일의 7/12 기재 오류가 확인됐고 실제 출고 가능일 2026-08-28 출고 진행으로 확인됐다.
- 2026-08-13 안 정해진 것: 더현대 팝업 최종 운영 품목, 팝업 기간 중간 추가 투입 가능 여부, 원이 착장 플리스/경량아우터의 실제 납기와 프리오더 전환 범위, 할인/GWP/프리오더 프로모션 최종 합의, WA2601LT15 리오더 진행 여부와 유사 원단/AS-IS 편직 선택 및 1,000장 기준 납기, 27SS 뉴베이직 추가 스타일 최종 카테고리/SKU/수량, 국내 진행 검토 중인 지민 티셔츠 결과, 데님라이크 신규 업체와 SDPK 중 최종 업체 선택, 우먼스 보아 후드집업 159 판가 확정 여부, 3PACK 리오더 PO 발행 완료 여부와 잔여 4,000PCS RT/집중 판매 실행 수량, 플래그십 전용 파자마 `WA0000SU01` 실제 품번 변경 여부, 27SS 매장별 운영 SKU 최종 피드백, 가을 스트릿 컬렉션 KPI 최종 품의서 상신본, WA2603KT12 대만 직송일자 파일 수정 완료 여부는 미정이다.
- 2026-08-13 다음 할 일: 더현대 팝업 상품 리스트는 목요일 오전까지 리스트업 완료, 목요일 오후 내부 정리, 금요일 11시 악세/영업기획 미팅, 금요일 오후 전체 품목 전달 순서로 진행한다. 영업기획·리테일·마케팅과 착장 20%+GWP, 플리스/경량아우터 30% 프리오더, 세일즈 섹션 운영안을 최종 조율한다. WA2601LT15는 국내 생산/국내 시장지/재고 기준 30일 내 리오더 가능 여부와 1,000장 기준 편직 예상 납기를 확인한다. 샘플 판매 가격표는 아우터/바텀/이너 기준으로 정리한다. 27SS 뉴베이직 추가 스타일 미팅에서 카테고리별 점검, SKU, 수량, 27SS 진행 스케줄 수정안을 확인한다. 데님라이크 신규 업체와 SDPK 원가 및 퀄리티를 비교하고 데님라이크+데님/우븐 아우터 종합 견적을 받아 최종 업체 방향을 정한다. 우먼스 보아 후드집업은 자수 변경 샘플과 원가 확인 후 판가 조정 여부를 결정한다. 3PACK 리오더는 2,000SET 기준 PO 발행 상태와 잔여 약 4,000PCS의 면세/아울렛/직영 RT 실행안을 확인한다. 연간 운영 및 플래그십 전용 품번은 시즌 품번 이원화 기준으로 회계/전산/운영 문제를 재확인한다. 영업기획은 27SS 매장별 운영 SKU 최종 피드백을 차주 화요일까지 어실장 리뷰 후 공유한다. 가을 스트릿 컬렉션 KPI는 누락 품번과 HD01/ACC 제외 여부를 반영해 촬영 품의서 상신용 최종본으로 정리한다. WA2603KT12 대만 직송일자는 2026-08-28 출고로 파일을 수정하고 반영 완료 여부를 확인한다.

## Current Teams Summary - 2026-08-12

- Use `workspace/memory/current-teams-update-summary-2026-08-12.md` as the latest Teams update source for decided items, unresolved items, and next actions from Teams chat/channel backup files available on 2026-08-12. The newest local source files are clipped as 2026-08-11; no local Teams backup clipped as 2026-08-12 was found.
- 2026-08-12 결정된 것: 더현대 팝업 투입 상품 리스트는 2026-08-13 목요일까지 전달하기로 했다. 9월 VM 착장 리스트는 26FW IMC 아이템 기준으로 완료됐고 MAIN은 스트라이프/우먼스 가디건, SUB는 데님라이크/와플로 잡았다. 이너라인에서도 물량이 많고 코디 가능한 스타일이 있으면 MD가 지정해 함께 넣기로 했다. 샘플 판매용 회사 명의 단말기는 한병현/변창현이 IT팀에서 수령해 활용한다. 2PACK/3PACK 운영안은 3PACK 면세 또는 면세/플래그십 전용 전환, 2PACK/3PACK 발주 수량 설정 근거, 2PACK 수량별 원가 비교 축으로 공유됐고, 2PACK은 20,000SET 발주 후 버퍼 운영 또는 원가 절감 시 초두 30,000SET 발주 옵션으로 정리됐다. 3PACK은 면세 56.4%와 플래그십 18.9% 합산 75.4% 비중이라 면세+플래그십 전용 운영 검토안이 공유됐다. 3PACK 리오더는 부림 진행, 2026-09-22 납기로 요청됐다. 26FW 세원 ERP 정보는 26FW 기준, 미등록 원가 제외 기준으로 작성하고 소싱팀은 담당 E/F/H열 등을 채워 IT팀 전달 시 성현진을 참조한다. 26FW 발주 품의서 번호는 `(주)비케이브-2026-21336`으로 확인됐고 대표님 결재 진행 중이다. 26FW 세원 PO는 2026-09-29 확정 납기 기준으로 진행하되 2~3일 정도 당기는 방향을 요청했다. 주간리뷰 채널 삭제로 IT팀에 복구 요청이 들어갔고 복구 전까지는 `와키윌리 상품기획+영업기획` 채널에 주간리뷰 관련 요청을 작성한다. 우먼스 WA2601HZ52/WA2601PT52 져지데님 셋업은 정상매장에서 추석 전까지 함께 판매 후 아울렛 운영 RT로 진행한다. 3PACK 리오더 관련 2026-08-20 판매 펀칭 예정 물량은 약 500PCS, 금액은 약 2천으로 공유됐다. WA2603HZ13/WA2603PT18 원이 착장 건은 파샬 입고 수량상 전 매장 출고가 어렵고 상위 매장 우선 진행도 제한적이다. 26FW 대만 직송 변경 요청은 WA2603LT52 2026-08-18 EX-FAC 가능 여부, WA2603JK61/WA2603JK64 2026-09-08 EX-FAC 예정 변경, WA2603CD14 2026-09-02 EX-FAC 변경 가능 여부 확인으로 공유됐다.
- 2026-08-12 안 정해진 것: 더현대 팝업 투입 상품 리스트의 최종 품목, 이너라인 추가 착장 스타일 포함 여부, 2PACK 20,000SET/30,000SET 중 최종 선택, 3PACK 면세 또는 면세/플래그십 전용 전환 여부, 3PACK 리오더 PO 발행 완료 여부, 26FW 세원 ERP 정보 소싱팀 항목 입력/IT팀 전달 완료 여부, 26FW 발주 품의 결재 및 소싱팀 참조 반영 완료 여부, 26FW 세원 납기 2~3일 단축 가능 여부, 주간리뷰 채널 복구 완료 여부, 27SS 영업기획 피드백 및 사업부 주간 미팅 결론, WA2603HZ13/WA2603PT18 실제 출고 대상 상위 매장/배분 기준, WA2603LT52/WA2603CD14 대만 직송 변경 가능 여부와 WA2603JK61/JK64 O.C 파일/대만지사 반영 완료 여부는 미정이다.
- 2026-08-12 다음 할 일: 성현진은 더현대 팝업 투입 상품 리스트를 2026-08-13 목요일까지 전달한다. MD들은 이너라인 중 9월 VM 착장 후보에 넣을 스타일을 확인한다. 2PACK/3PACK 운영안은 수량 옵션, 3PACK 채널 전환, 원가/버퍼 구조를 기준으로 최종 의사결정한다. 3PACK 리오더는 부림 2026-09-22 납기 기준으로 PO 발행 및 최종 확정 여부를 확인한다. 소싱팀은 26FW 세원 ERP 담당 항목을 채우고 IT팀 전달 시 성현진을 참조한다. 26FW 발주 품의서 `(주)비케이브-2026-21336` 결재 완료 후 소싱팀 참조 반영 가능 여부를 확인한다. 26FW 세원 PO는 2026-09-29 납기 기준으로 발행하되 2~3일 단축 가능성을 확인한다. 주간리뷰 채널 복구 전까지 `와키윌리 상품기획+영업기획` 채널에 리뷰 요청을 남기고 IT팀 복구 결과를 확인한다. 영업기획은 27SS 피드백을 이번 주 중 작성해 공유하고 사업부 주간 미팅에서 논의한다. WA2601HZ52/WA2601PT52 셋업 판매/아울렛 RT 실행 일정, WA2603HZ13/WA2603PT18 파샬 입고분 상위 매장 배분 기준, WA2603LT52/JK61/JK64/CD14 대만 직송 변경 가능 여부와 O.C/대만지사 반영을 확인한다.

## Current Teams Summary - 2026-08-11

- Use `workspace/memory/current-teams-update-summary-2026-08-11.md` as the latest Teams update source for decided items, unresolved items, and next actions from Teams chat/channel backup files available on 2026-08-11. The newest local source files are clipped as 2026-08-10 and written locally on 2026-08-11 morning; no local Teams backup clipped as 2026-08-11 was found.
- 2026-08-11 결정된 것: 27SS 금주 일정은 수요일 27SS 픽스 물량 전체 점검/뉴베이직 추가 건 취합, 목요일 소싱팀과 데님라이크 업체 선정 및 원가 미팅으로 공유됐다. 목요일 14시 이전 집기 철거 시 15시 샘플 판매 시작, 금요일 오전까지 판매 후 판매 흐름에 따라 금요일 오후 정리 시작 플랜으로 잡았다. 금일까지 라인별 복종 이슈사항 써머리 전달, 과장급 담당자의 VMD팀 9월 착장(유니/우먼) 전달 및 MD 스케줄(27SS 작지 일정/27FW 일정) 정리, 성현진의 2PACK/3PACK 발주 건 정리, 변창현/양윤선의 단말기·판매시트·가격표 준비가 업무로 배정됐다. 금주 MD팀 물량 점검 후 차주 부장님/소싱팀장님과 전체 금액 및 원가계획 미팅을 진행한다. 27SS 발주리스트 발주구분은 스팟으로 변경 완료됐다. 26SS/26FW 판매추이, 8월 1주차 판매베스트, 주간 RAW 데이터, 매장형태별판매 대시보드, 26SS 상품맵 데이터 수정이 완료됐다. 26SS 8월 1주차 APP 주간 매출은 6.32억, 전년비 +22.8%, 전주대비 -4.8%로 공유됐다. 2026-09-17~2026-09-30 더현대 서울 B2 Creative Ground에서 `와키윌리 x 리센느 원이` 팝업스토어를 추진한다. 26FW부터 상세페이지 핏가이드 룩북은 AI 이미지로 대체될 예정이며, 기획/디자인팀 검토 후 온라인팀에 가이드 자료를 전달하고 관련 인원 전체 Teams 채팅방을 개설한다. 27년 2PACK은 30,000SET 발주, 약 6,000SET 버퍼 구조로 검토 중이며 `WA0000`보다 2700 형태 시즌리스 품번으로 진행하는 방향으로 정리됐다. 26SS 3PACK 리오더는 3,000PCS 수준으로 조정 논의 중이며, SK 조건은 10월 중순 입고/15,800원(V-)/29.5%, 부림 조건은 2026-09-22 입고/16,400원(V-)/30.5%다. 27년 운영 구분은 3PACK 면세 채널 분리, 2PACK 면세 판매 수량 제외 반영 방향으로 공유됐다. 26FW CR13 대만 직송은 2026-09-08 EX-FAC 예정, HZ51 대만 직송은 2026-08-18 EX-FAC 예정으로 변경됐고 O.C 파일 반영 및 대만지사 소통 대상이다.
- 2026-08-11 안 정해진 것: 27SS 전체 픽스 물량, 뉴베이직 추가 건, 데님라이크 업체, 원가 계획의 최종 결론은 미정이다. 샘플 판매 시작 여부는 목요일 14시 이전 집기 철거 완료 여부에 달려 있다. 27SS 글로벌 컨벤션 중 샘플 확인 시간은 2026-08-11 13:00~14:00 또는 2026-08-12 13:00~14:00 후보가 제안됐으나 최종 확정 여부는 확인되지 않았다. 더현대 서울 팝업의 운영상품, 딜리버리, 팝업 무드/콘텐츠, VM 예산, 마케팅 계획, 프로모션, 현장 인원/운영, 재고 운영 계획은 각 부서 검토가 필요하다. 26FW AI 핏가이드 룩북의 최종 프로세스와 온라인팀 전달본 확정 여부는 미정이다. 2PACK 30,000SET 발주/6,000SET 버퍼 구조, 3PACK 리오더 3,000PCS 진행 여부, SK/부림 협력사 선택, 27년 3PACK 채널 분리 및 2PACK 면세 판매 수량 제외 반영 방식은 최종 확정이 필요하다. 26SS 주간 판매 데이터의 일부 전주 데이터/누계/증감율은 재확인이 필요하다. 26FW CR13/HZ51 대만 직송 일정 변경이 라인시트, O.C 파일, 대만지사 커뮤니케이션에 최종 반영 완료됐는지는 후속 확인이 필요하다.
- 2026-08-11 다음 할 일: 수요일 27SS 픽스 물량 전체와 뉴베이직 추가 건을 점검하고, 목요일 소싱팀과 데님라이크 업체 선정 및 원가 미팅을 진행한다. 금일까지 라인별 복종 이슈사항 써머리, 9월 착장, 27SS 작지 일정/27FW 일정, 2PACK/3PACK 발주 건, 단말기/판매시트/가격표를 정리한다. 목요일 14시 이전 집기 철거 여부를 확인해 15시 샘플 판매 시작 여부를 결정하고, 금요일 오전 판매 후 오후 정리 여부를 판단한다. 차주 부장님/소싱팀장님과 전체 금액/원가계획 미팅을 진행한다. 27SS 글로벌 컨벤션 샘플 확인 시간은 2026-08-11 13:00~14:00 또는 2026-08-12 13:00~14:00 중 확정한다. 더현대 서울 팝업 관련 VM, 상품부, 마케팅, 리테일 각 부서는 검토 의견과 계획을 공유한다. 26FW AI 핏가이드 룩북 자료는 기획/디자인팀 검토와 피드백 후 온라인팀 전달본으로 정리한다. 2PACK은 2700 형태 시즌리스 품번과 30,000SET 발주/6,000SET 버퍼 구조를 최종 검토한다. 3PACK 리오더는 기재고 점검 후 익일 사업부 미팅에서 3,000PCS 진행 여부와 SK/부림 선택을 결정한다. 26SS 8월 1주 판매 데이터의 전주 데이터/누계/증감율 이상 여부를 재검증하고, 26FW CR13/HZ51 대만 직송 변경 일정 반영 완료 여부를 확인한다.

## Current Teams Summary - 2026-08-10

- Use `workspace/memory/current-teams-update-summary-2026-08-10.md` as the latest Teams update source for decided items, unresolved items, and next actions from Teams chat/channel backup files available on 2026-08-10. The newest local source files are clipped as 2026-08-09 and written locally on 2026-08-10 morning; material new messages after the prior memory were concentrated on 2026-08-07.
- 2026-08-10 결정된 것: 26FW SPOT 해외 오더 진행 수량은 총 1,885PCS로 확인되었고, SPOT은 PO를 국가별로 분리하지 않고 국내택 부착 상태로 국내 입고한 뒤 글로벌팀에서 이관/별도 출고한다. 별도 택갈이는 진행하지 않는다. 정규 메인 오더는 국내/대만/일본/글로벌 PO를 분리하고, 특정 국가 전용 SPOT은 특정 국가 PO로 진행하되 글로벌 PO가 포함되면 특정 국가분과 국내 입고분 PO를 분리한다. WA2603ST13 컬러는 BLUE에서 YELLOW로 변경되었으며 블루 컬러에 옐로우 틴 워싱이 들어간 혼합 컬러로 설명한다. 26FW 뉴베이직 원가율은 25.9%, 26FW SPOT 23,700PCS/20.6억 건은 26.2%로 공유되어 26FW 전체 원가율 점검을 계획비에 넣어 보기로 했다. 27SS 라인시트 오더 전개 스타일은 유니 72ST/139SKU, 우먼 68ST/131SKU 기준으로 공유되었다. 27SS 추가 룸 미팅은 당일 바로 진행하지 않고 기획팀이 각 라인별 필요 ST/SKU, 대략 컬러, 수량을 먼저 정리한 뒤 팀미팅 및 추가구성 미팅으로 진행한다. 2026-08-10 월요일까지 추가 룸 구성 ST/SKU를 정리해 팀미팅에서 전체 구성을 점검한다. 26FW 플리스류는 최종 납기 및 일부 스타일 수량 오류를 수정하고 추가 오더분을 분리해 입고 특이사항에 정리했다. 리오더/추가 확정 스타일은 앞으로 MD팀에서 마케팅팀도 반드시 멘션한다. 원이 촬영 전 샘플이 불가한 우먼스 아이템은 추후 촬영 또는 AI 콘텐츠 제작으로 적용한다. WA0000STE1 연간 2PACK은 30,000SET에서 20,000SET으로 변경 검토되고, WA0000STE3 연간 3PACK은 15,000SET 기준으로 공유되었다. 기존 3PACK 리오더 5,000SET은 아직 확정 발주가 들어간 상태가 아니다. 글로벌/대만 직송 마감은 ERP PO 차수 기준으로 회계팀에 전달해야 한다.
- 2026-08-10 안 정해진 것: 26FW 뉴베이직 25.9%와 SPOT 26.2% 원가율을 25% 언더 또는 계획비 기준으로 어떻게 조정할지, 뉴베이직에서 낮춘 원가가 다른 상품으로 옮겨지는 구조를 수용할지, 26FW 전체 원가율 점검 결과와 품목별 조정안은 미정이다. 27SS SWA2702SS001 2컬러 진행 여부, SWA2701HZ001 3컬러 진행 여부, SWA2701HD002 ORANGE 추가 여부, 샘플 미진행/원단 변경/컬러 미정/디자인 재구성/보류 건의 CAD맵 제외 기준은 미정이다. 27SS 추가 룸 최종 ST/SKU/컬러/수량과 사업부장 보고용 총 구성, 26FW 플리스류 일본/글로벌 수량 관련 입고 내용, 원이 콜라보 상품 구성과 전달 시점, 3PACK 리오더 5,000SET의 협력사/납기 선택, WA0000 연간 품번 운영의 회계상 문제 여부, 면세 매출 하락과 1월 입고 계획을 반영한 2PACK/3PACK 최종 수량 및 납기는 후속 확인이 필요하다.
- 2026-08-10 다음 할 일: 26FW 뉴베이직과 SPOT을 포함한 전체 원가율을 계획비 기준으로 넣어 2026-08-10 월요일 회의에서 점검한다. 소싱팀장/사업부장/기획 관련자는 뉴베이직 25.9%, SPOT 26.2%, 25% 언더 목표, 다른 상품으로 원가가 옮겨지는 구조를 함께 정리한다. 26FW SPOT 해외 1,885PCS는 국내택 부착 국내 입고 후 글로벌팀 이관 프로세스로 진행하고 WA2603ST13 YELLOW 변경을 관련 파일과 공유처에 반영한다. 27SS 라인별 담당자는 2026-08-10까지 추가 룸 구성에 필요한 ST/SKU, 대략 컬러, 수량을 정리하고 팀미팅에서 전체 구성을 점검한다. 27SS 디자인실-사양회의 불일치 항목은 성현진 팀장/실장 논의로 진행, 보류, 제외, CAD맵 반영 기준을 확정한다. 27SS 라인시트 `SAMPLE` 열을 채운다. 26FW 플리스 최종 납기/수량 수정본의 일본/글로벌 입고 내용에 대해 기획팀 검토 답변을 남긴다. 원이 콜라보 상품 구성은 차주 초까지 마케팅팀에 전달한다. 3PACK 리오더와 WA0000STE1/WA0000STE3 연간 품번 운영은 납기, 사입가, 원가율, 회계 확인을 거쳐 최종 결정한다.

## Current Teams Summary - 2026-08-07

- Use `workspace/memory/current-teams-update-summary-2026-08-07.md` as the latest Teams update source for decided items, unresolved items, and next actions from Teams chat/channel backup files available on 2026-08-07. The newest local source files are clipped as 2026-08-06 and were written locally on 2026-08-07 morning; no local Teams backup clipped as 2026-08-07 was found.
- 2026-08-07 결정된 것: 27SS 사양회의는 2026-08-06 10:00부터 진행됐고 유니 이너 후 우먼스 이너, 우븐도 같은 순서로 보는 방식으로 운영됐다. 다른 라인을 볼 때 라인시트 수량, SKU, 택가는 바로 업데이트하기로 했다. 27SS IMC 후보는 유니 MAIN IMC 쿨맥스/이지데님, 데님라이크, 유니 SUB IMC 워싱/다잉물, 와플로 공유됐고, 우먼스 MAIN IMC는 데님라이크, 이지데님, 우먼스 SUB IMC는 코튼아일렛(걸리쉬), 패턴(도트 또는 체크)으로 공유됐다. 27SS 라인시트는 `WACKYWILLY_27SS LINESHEET 260716.xlsx`를 실시간 업데이트 기준 파일로 계속 사용하고 인드랍/변동사항은 음영 또는 표기로 안내한다. 27SS 상품기획/영업기획 자료 요청에는 CAD맵과 상품맵이 있으나 드롭 및 변경 스타일이 많다는 점을 전제로 시즌 무드 참고 자료가 공유됐다. 26FW 뉴베이직 수량은 추가 발주로 29,300장에서 40,900장으로 상승했다. 26FW 뉴베이직 벨벳류 수량은 벨벳 2스타일 포함 기준이며, 벨벳 롱슬리브는 뉴베이직에서 제외됐다. 26FW 뉴베이직 전체 원가율은 기존 대비 수량 변화와 배색 추가로 올라간 상태이며 소싱 검토 후 공유하기로 했다. 26FW 추가 SPOT 해외 발주는 일부 국가 발주 계획이 있으나 파일을 아직 받지 못해 글로벌팀이 2026-08-07 퇴근 전 회신 가능 여부를 문의했다. 먼작귀 면세 판매는 진행해도 문제 없고 할인율은 진행하더라도 10% 내외로 운영할 것으로 공유됐다. Art Grocery 온라인 전 상품 50% 할인, VM 반팔티셔츠 핏가이드 시안 수정·보완 회신 요청은 유지된다.
- 2026-08-07 안 정해진 것: 27SS 사양회의 후 실제 인드랍 결과, 최종 진행 스타일, 최종 수량/SKU/택가 업데이트 완료 여부는 확정되지 않았다. 27SS 유니/우먼스 IMC 후보는 공유됐지만 MAIN/SUB IMC 최종 확정과 MKT 열 반영 완료 여부는 확인되지 않았다. 27SS CAD맵/상품맵은 드롭 및 변경 스타일이 많아 최신성이 불안정하며, 영업기획에 전달할 최종 PDF/로드맵/디자인맵 범위는 미확정이다. 26FW 뉴베이직 전체 원가율은 25% 기준 여부가 문의됐으나 최종 원가율은 미확정이다. 26FW 시즌발주 품의 실제 상신 완료 여부와 전체 금액 최종 확정값은 계속 확인되지 않았다. 26FW 추가 SPOT 해외 발주의 일부 국가별 발주 계획, 최종 수량, 오더 불가 스타일, 2026-08-07 퇴근 전 회신 가능 여부는 미확정이다. 먼작귀 직원구매 50% 할인 적용 여부는 문의만 확인되고 최종 답변은 확인되지 않았다. WA2603CR64/LT64의 2026-08-31 실제 물류 입고 완료 여부와 이후 출고 반영 일정, 위즈아이엔씨 포함 대만 직송 전품번 최종확정납기 작성 완료, WA2603KT62/WA2603CD63 희망일 상충값은 계속 확인 대상이다.
- 2026-08-07 다음 할 일: 27SS 사양회의 결과를 반영해 라인시트의 수량, SKU, 택가, 런칭예정월, 인드랍 변경사항을 최신화한다. 27SS 유니/우먼스 MAIN/SUB IMC 후보를 유관부서 회의 후 최종 확정하고 `WACKYWILLY_27SS LINESHEET 260716.xlsx`의 MKT 열에 반영한다. 영업기획 요청용 27SS 시즌 무드/기획안/PDF/디자인맵은 드롭 및 변경 스타일을 반영한 최신본 기준으로 전달 범위를 정리한다. 26FW 뉴베이직은 40,900장 기준 수량, 벨벳 2스타일 포함/벨벳 롱슬리브 제외 기준을 발주·품의·원가 검토 자료에 일치시킨다. 소싱은 26FW 뉴베이직 전체 원가율 검토 결과를 공유하고 25% 목표 대비 상승 요인을 수량 변화와 배색 추가 기준으로 정리한다. 26FW 시즌발주 품의 금액 확정 및 상신 완료 여부를 확인한다. 글로벌팀은 26FW 추가 SPOT 해외 발주 일부 국가 계획을 2026-08-07 퇴근 전까지 회신 가능한지 확정하고, 기획은 회신본 기준으로 최종 수량과 오더 불가 스타일을 대조한다. 먼작귀 면세 판매는 10% 내외 할인 기준으로 운영 가능 여부를 세부 확정하고, 직원구매 50% 적용 여부에 답변한다. WA2603CR64/LT64 AIR 선적 및 2026-08-31 물류 입고 여부, 대만 직송 최종확정납기와 상충값을 계속 추적한다.

## Current Teams Summary - 2026-08-06

- Use `workspace/memory/current-teams-update-summary-2026-08-06.md` as the latest Teams update source for decided items, unresolved items, and next actions from Teams chat/channel backup files available on 2026-08-06. The newest local source files are clipped as 2026-08-05 and were written locally on 2026-08-06 morning; no local Teams backup clipped as 2026-08-06 was found.
- 2026-08-06 결정된 것: 27SS 품평 후속은 유니섹스·우먼스 공통으로 상품 전략을 보강하는 방향이다. 대표이사 총평상 창작 아이템은 있으나 카테고리별로 "많이 팔겠다"는 의지가 약하므로, 카테고리마다 한 끗 차이, 뉴베이직, 원포인트, 휘뚜루마뚜루 아이템을 반드시 배치하고 기획·디자인·소싱·영업·마케팅이 밀 상품 컨센서스를 만든다. 27SS 유니는 실루엣·소재·컬러를 기본으로 보고 악센트 컬러 과다 운영, 과한 가공·디스가공, 불필요하거나 판매 가능성이 낮은 컬러, 성인 셋업 필수 전제를 정리한다. 27SS 라인/카테고리별 뉴베이직 및 대물량 가능 아이템은 2026-08-07 금요일 인아웃 미팅에서 재점검한다. 27SS 라인시트는 `WACKYWILLY_27SS LINESHEET 260716.xlsx`를 실시간 업데이트 기준 파일로 사용하며, 글로벌팀은 현 기준으로 번역을 우선 진행하고 인드랍/변동사항은 파일에 표기 후 알림을 받는다. 27SS 최종 진행 스타일과 MAIN/SUB IMC 표기는 금주 사양 회의 및 유관부서 회의 이후 결정한다. 27SS 라인시트 혼용률 미기재 건은 2026-08-05 15:00 전까지 기재 요청됐고, 라인시트는 런칭예정월 기준으로 다시 정리한다. 27SS 데님라이크 품평 견적은 SDPK 견적이 공유됐으며 이번 품평 샘플은 SDPK 샘플 기준이다. 26FW 시즌발주 품의는 이번 주 마감 대상이고 금액 확정 후 기안 전 공유 및 금주 안 상신 방향이다. 26FW 최종 입고 수량은 박희현 과장이 공유한 엑셀 파일 기준으로 본다. 26FW 납기 지연 건은 `26FW 시즌 GTM > [013] 입고 특이사항` 게시판과 담당 MD 댓글 방식으로 운영한다. 27SS 월별 IMC는 디자인실과 잡아둔 월별 네이밍/구성을 기준으로 활용 가능하고, 26FALL 원이 캠페인 포토 셀렉컷 Notion 링크가 팀 내 공유됐다. 마케팅 미들레이어 콘텐츠는 금주 발행 추진이며 `WA 26FW 상품 IMC_260604.xlsx`의 10월 3주차~11월 2주차 구간을 참고한다. WA2504JK67 코트는 그대로 리오더가 아니라 숏기장 신규 스타일로 추가 예정이고, 10월 말 전 마케팅이 필요하면 WA2604JK70 코트로 진행하는 안이 제안됐다. 위즈아이엔씨 포함 대만 직송 품번은 전품번 대만지사 최종확정납기를 작성하면 생산처에 전달해 픽스하고 이후 변수는 즉시 공유한다. VM실은 FSS 영업팀 요청 반팔티셔츠 핏가이드 시안을 공유했고, 우먼스 셔츠 2스타일은 2026-08-11~2026-08-12 입고 예정, 각 200장씩 50% 파샬입고 예정이다.
- 2026-08-06 안 정해진 것: 27SS 품평 후속에서 카테고리별 메가 아이템/뉴베이직의 실제 추가·유지·드롭, 27SS 인드랍 결과, 최종 진행 스타일, MAIN/SUB IMC 제품 표기는 미확정이다. 27SS 라인시트 혼용률 누락분 기재 완료 여부와 런칭예정월 기준 정리 완료 여부도 확인되지 않았다. 27SS 판매전략 및 IMC 아이디어는 추가 논의가 필요하다. 26FW 시즌발주 품의 실제 상신 완료 여부와 전체 금액 최종 확정값, 26FW 추가 SPOT 해외 발주 2026-08-06 15:00 취합 결과와 최종 수량/오더 가능 여부는 아직 로컬 백업에 없다. 유니 26FW SPOT의 UP TAG 적용 여부, 기모/논기모 판가 동일 또는 4,000~5,000원 차등 운영 여부, WA2603CR64/LT64의 2026-08-31 실제 입고 완료 및 이후 출고 반영 일정은 계속 확인이 필요하다. 위즈아이엔씨 포함 대만 직송 전품번 최종확정납기 작성 완료, WA2603KT62/WA2603CD63의 2026-08-03/2026-08-21 희망일 상충값, 신규 숏기장 코트 촬영 샘플 가능일 및 WA2604JK70 마케팅 최종 진행 여부, 우먼스 셔츠 2스타일 파샬입고분 상위 매장 선출고 여부, 반팔티셔츠 핏가이드 수정사항은 미정이다.
- 2026-08-06 다음 할 일: 각 라인/카테고리 담당자는 27SS 한 끗 차이, 뉴베이직, 원포인트, 휘뚜루마뚜루 아이템을 재점검하고 2026-08-07 인아웃 미팅에서 추가·유지·드롭 방향을 논의한다. 27SS 라인시트는 혼용률 누락분을 채우고 런칭예정월 기준으로 재정리한다. 글로벌팀은 `WACKYWILLY_27SS LINESHEET 260716.xlsx` 현 기준 번역을 진행하고, 기획은 인드랍/변동사항을 파일에 표기 후 알린다. 27SS MAIN/SUB IMC 표기는 인드랍 및 유관부서 회의 후 확정하고, 월별 IMC 기존 네이밍/구성 기반으로 판매전략과 IMC 아이디어를 보강한다. 26FW 시즌발주 품의는 금액 확정 후 기안 전 공유하고 상신 완료 여부를 확인한다. 26FW 추가 SPOT 해외 발주는 2026-08-06 15:00 취합 결과를 회수해 최종 수량과 오더 불가 스타일을 대조한다. 유니 26FW SPOT은 UP TAG 필요 스타일, 기모/논기모 판가 차등 여부, 최종 판매가를 결정한다. WA2603CR64/LT64 AIR 선적 및 2026-08-31 물류 입고를 추적해 GTM 입고 특이사항 게시판에 반영한다. 위즈아이엔씨 포함 대만 직송 전품번의 대만지사 최종확정납기를 작성해 생산처 픽스를 진행하고, WA2603KT62/WA2603CD63 납기 상충값을 재확인한다. 신규 숏기장 코트 CAD/실물/촬영 샘플 일정을 확인하고 필요 시 WA2604JK70 진행 여부를 확정한다. 우먼스 셔츠 파샬입고분 선출고 가능 여부와 VM 핏가이드 수정·보완 의견을 회신한다.

## Current Teams Summary - 2026-08-05

- Use `workspace/memory/current-teams-update-summary-2026-08-05.md` as the latest Teams update source for decided items, unresolved items, and next actions from Teams chat/channel backup files available on 2026-08-05. The newest local source files are clipped as 2026-08-04 and were written locally on 2026-08-05 morning.
- 2026-08-05 결정된 것: 26FW 추가 SPOT 해외 발주 확인은 `Wacky Willy_26FW LINE SHEET 260413.xlsx`의 `SPOT` 시트 `W`, `O` 건 기준과 2026-08-06 15:00 글로벌 취합 기준을 유지한다. 유니 26FW SPOT 투입 납기는 논기모 2026-09-29, 논기모 워싱 버전 2026-10-20, 기모 2026-10-13으로 공유되었고, 기모는 전년 판기상 10월 말 판매 시작이어도 판기 문제는 크지 않은 것으로 보았다. 유니 26FW SPOT 원가는 현 TAG가 기준 전체 원가율 26.5%이며 원가 시뮬레이션 파일은 `W 26FW UNI 스팟 원가 견적서 - 오픈에이 260804.xlsx`다. CR03/PT03의 2026-09-18 추가 납기 조정은 원단 출고와 라인 스케줄상 어렵고 소싱 전달 일정으로 마무리한다. IMC 대상 WA2603CR64 1,150pcs와 WA2603LT64 600pcs는 파샬 AIR로 2026-08-27 ETD, 2026-08-28 ETA, 실제 물류 입고 2026-08-31 가능 일정이다. 26FW 납기 지연 건은 `26FW 시즌 GTM > [013] 입고 특이사항` 게시판에 게시하고 담당 MD가 댓글로 진행 여부를 남긴다. 27년 연간 운영 2PACK은 판매 둔화를 반영해 30,000장에서 15,000~20,000장으로 축소 검토하고, 3PACK은 면세 대량 출고와 창고 재고 부족 때문에 리오더 5,000SET를 우선 진행한다. 대만 직송 납기 파일에서 AE열 `OK`는 AD열 대만지사 희망납기대로 가능, 날짜 기재는 최대한 당길 수 있는 납기라는 뜻으로 정리되었다. WA2603LT52는 국내 입고 지연에 따라 대만 직송일도 2026-08-07에서 2026-08-14로 지연된 생산 지연 건이다. IMC 월별 전략 자료, 7월 월리뷰 자료, 유니 설문 RAW 데이터가 공유되었다.
- 2026-08-05 안 정해진 것: 26FW 추가 SPOT 해외 발주의 최종 수량과 오더 불가 스타일, 유니 26FW SPOT의 UP TAG 적용 여부/적용 폭, 기모와 논기모 판가 동일 운영 또는 4,000~5,000원 차등 여부는 미확정이다. WA2603CR64/LT64의 2026-08-31 실제 물류 입고 완료와 이후 출고 반영, 납기 지연 게시판의 건별 담당 MD 코멘트, 26FW 시즌발주 품의 지결 참조 가능 여부, 먼작귀 2026-08-07 발매 온/오프 할인율 적용 여부와 값은 후속 확인이 필요하다. WA2603KT62/WA2603CD63은 대만 직송 요청 파일에서 희망일이 2026-08-03과 2026-08-21로 갈려 재확인이 필요하고, 위즈아이엔씨 품번 납기 회신도 미완료다. 월리뷰/IMC 자료의 최종 컨펌, 제출 범위, 활용 목적도 확정되지 않았다.
- 2026-08-05 다음 할 일: 글로벌팀은 2026-08-06 15:00까지 26FW 추가 SPOT 해외 발주를 취합하고, 기획은 수량 대조 후 오더 불가 스타일을 피드백한다. 유니 26FW SPOT은 납기/원가 공유안을 기준으로 UP TAG 필요 스타일, 기모/논기모 판가 차등 여부, 최종 판매가를 결정한다. WA2603CR64/LT64는 AIR 선적과 2026-08-31 물류 입고 여부를 추적하고 GTM 입고 특이사항 게시판에 반영한다. 26FW 납기 지연 건은 게시판에 남기고 담당 MD 댓글로 진행 여부를 기록한다. 3PACK 5,000SET 리오더를 우선 진행하고 입고 전 면세 주문은 샵인샵 매장 RT로 대응한다. 2PACK은 15,000~20,000장 축소안으로 원단 발주 수량을 재검토한다. 먼작귀 할인율, WA2603KT62/WA2603CD63 대만 직송 희망 납기, 위즈아이엔씨 납기, 26FW 시즌발주 품의 지결 참조 가능 여부, 월리뷰/IMC/유니 설문 RAW 데이터의 최종 제출 범위를 확인한다.

## Current Teams Summary - 2026-08-04

- Use `workspace/memory/current-teams-update-summary-2026-08-04.md` as the previous Teams update source for decided items, unresolved items, and next actions from Teams chat/channel backup files available on 2026-08-04.

## Current Teams Summary - 2026-08-03

- Use `workspace/memory/current-teams-update-summary-2026-08-03.md` as the previous Teams update source for decided items, unresolved items, and next actions from Teams chat/channel backup files available on 2026-08-03.

## Current Teams Summary - 2026-07-31

- Use `workspace/memory/current-teams-update-summary-2026-07-31.md` as the latest Teams update source for decided items, unresolved items, and next actions from Teams chat/channel backup files available on 2026-07-31. No local Teams backup clipped as 2026-07-31 was found; the newest local source files are clipped as 2026-07-30 and were updated locally on 2026-07-31 morning.
- 2026-07-31 결정된 것: 26FW QR/SPOT/REORDER 운영 기준은 계속 `26FW 와키윌리 QR구성(SPOT,Reorder).xlsx`로 유지한다. 26FW 추가 SPOT 진행 예정 수량은 기모 캐리오버 4건, 레터링 후드집업 1건, 신규 SPOT 3건으로 공유되었고, 기모 후드는 베이직 로고 방향으로 진행한다. 26FW 추가 SPOT CAD가 업데이트되어 공유되었으며, 리오더 가능 스타일 확인 기준은 Teams QR 채널의 `FW26 다이마루 스웻셔츠 리드타임` 링크로 안내되었다. 2603STW 면세 오더 200장은 현재 재고로 출고 진행하고 리오더는 진행하지 않는다. WA2604JK24 컬러는 BLACK이 아니라 CHARCOAL/차콜로 확인되었고 ERP 수정 대상이다. 우븐 데이터는 SDPK 업체 출고건/배정건 제외 후 취합 및 업데이트 완료되었다. 사입가 업데이트가 완료되었고, WA2603PT56 대만 판매가 관련 내용은 시트에 기입 완료되었다. Art Grocery 온라인 할인은 FSS와 동일하게 전 상품 50%로 적용한다. 먼작귀 최종 출시 일정은 기존 VM 공유 기준인 2026-08-07 전 스타일 온/오프라인 출시, FSS 하이라이트 및 기타 매장 1행거 POP 적용 방향을 유지한다.
- 2026-07-31 안 정해진 것: 2026-07-31 당일 Teams 클립 백업이 없어 당일 신규 대화는 확인되지 않았다. 26FW 추가 SPOT 최종 수량표/CAD별 세부 값, 실제 발주일, 작업지시일, 입고 가능일은 텍스트 백업만으로 확정되지 않았다. WA2604JK24 ERP 컬러 수정 완료 여부, Art Grocery 전 상품 50% 할인 실제 채널 반영 여부, 온라인 전용 상품 뒷판 그래픽 썸네일 노출 방식, 2603STW 면세 출고 이후 향후 보충 판단 기준은 미확정이다. 뉴베이직 부분입고/50% 분할생산/SML 옵션, JK65/JK72 AIR, JJ560/HNC 등 기존 미확정 이슈도 계속 확인이 필요하다.
- 2026-07-31 다음 할 일: 26FW 추가 SPOT 수량과 CAD 최종본을 발주 리스트 및 관련 공유 시트에 동기화한다. QR 채널 링크 기준으로 26FW 리오더 가능 스타일을 재확인한다. 2603STW 면세 200장 출고 및 리오더 불필요 결정을 관리표에 반영한다. WA2604JK24 ERP 컬러를 CHARCOAL/차콜로 수정하고 완료 여부를 확인한다. SDPK 제외 우븐 취합 업데이트, WA2603PT56 대만 판매가 입력값, Art Grocery 전 상품 50% 온라인 가격 노출을 각각 검증한다. 온라인 전용 상품 뒷판 그래픽 썸네일 노출 방식을 결정하고, 2026-08-03 Art Grocery SNS 업로드와 2026-08-04 27SS 품평 준비를 추적한다.

## Current 27SS Key Schedule - 2026-07-30

- Use `workspace/memory/27ss-key-schedule-2026-07-30.md` as the current source for the user's 27SS major schedule.
- 2026-07-24 금요일: 27SS 라인시트 1차 전달.
- 2026-08-04 화요일: 대표님 품평 / 매니저·내부 품평.
- 2026-08-05 수요일~2026-08-07 금요일: 유닛별 사양 검토 및 인드랍/GTM 협의.
- 2026-08-10 월요일: 글로벌 컨벤션 자료 최종 정리.
- 2026-08-11 화요일~2026-08-12 수요일: 글로벌 컨벤션 진행.
- 2026-08-13 목요일: 샘플 판매 / 수량 최종 취합 및 발주 준비.
- 2026-08-14 금요일: 사양·수량 최종 확정 및 제출 (D-DAY).

## Current Teams Summary - 2026-07-30

- Use `workspace/memory/current-teams-update-summary-2026-07-30.md` as the latest Teams update source for decided items, unresolved items, and next actions from Teams chat/channel backup files available on 2026-07-30. The newest local backup files are clipped on 2026-07-29 and were updated locally on 2026-07-30 morning; no Teams backup clipped as 2026-07-30 was found locally.
- 2026-07-30 결정된 것: 26FW QR/SPOT/REORDER 운영 기준은 계속 `26FW 와키윌리 QR구성(SPOT,Reorder).xlsx`로 유지한다. 26FW 시즌 발주 품의와 납기 관리는 `와키윌리 26FW 시즌 발주 품의 260723.xlsx`, ERP 납기, 소싱 RAW 데이터의 `BF열` 입고 예정일을 기준으로 확인한다. 26FW 상품설명서 납기일자는 2026-07-29 18:26 기준 최신으로 업데이트됐다. 26FW 뉴베이직은 전 스타일 추석 전 입고가 어렵기 때문에 우선순위, 파샬 생산, 스타일별 약 50% 분할 생산, 주력 사이즈 S/M/L 선입고를 병행 검토한다. 26FW 뉴베이직 추석 전 타겟은 2026-09-16~18 기준 WA2603HZ01, WA2603CR01, WA2603HD01, WA2603PT02, WA2603PT03, WA2603CR03, WA2603CR04, WA2603PT04이며, 추석 이후 타겟은 2026-09-28~30 기준 WA2603HZ02, WA2603JK03, WA2603HZ04다. JK65/JK72는 1순위로 AIR 기준 일부 수량을 9월 내 입고 목표로 협의한다. 27SS 원가 견적서는 품평 자료 업로드 일정상 2026-07-30까지 요청하는 방향이며, 27SS 품평맵은 대표 품평 보고자료까지 고려해 품평 양식으로 작성한다. 2PACK/3PACK 연간 운영 상품은 큰 변화 없이 진행하고, 2PACK은 쿨코튼 소재와 49,000원 패키지 기준 유지 및 WH+WH 추가, 3PACK은 C/P 원단, 59,000원, WH/BK/MG 조합 유지로 본다. 면세에서 당일 메일로 요청한 반팔 리오더 상품은 2026-07-29 10:40 기준 추가 발주를 중지한다. 대만 EXCLUSIVE WA2603CRT1, WA2603STT1, WA2603STT2는 대만 직송 및 글로벌 수량 구분 때문에 출고일이 지연됐고 EX-FAC 2026-07-31 예정으로 공유됐다. Art Grocery 온라인 릴리즈 콘텐츠 제작은 2026-07-29 완료됐고, SNS 업로드는 2026-08-03에 진행한다. Art Grocery 인플루언서 촬영 이미지는 2차 활용 불가로 확인됐으며, 무신사/29CM 업로드는 2026-07-27 기준 등록 진행 중이고 익일 오픈 목표로 준비한다고 공유됐다.
- 2026-07-30 안 정해진 것: 2026-07-30 당일 Teams 백업 파일은 로컬에서 확인되지 않았다. 26FW 발주 품의 원가/사입가 공란 전체 입력 완료 여부, 예상원가와 확정원가 구분, ERP 납기 공란 및 2060년 납기 정정 완료 여부는 완료로 확인되지 않았다. 26FW 뉴베이직의 최종 우선순위, 파샬 입고 가능 범위, 컬러별 1,000장 옵션, 스타일별 50% 분할 생산, S/M/L 주력 사이즈 선입고 옵션은 소싱 협의 결과가 필요하다. JK65/JK72의 AIR 기준 일부 수량, 9월 3주차 입고 가능성, JK72 BROWN 컬러 변수 대응안, AIR 비용 부담은 미확정이다. 27SS 원가 견적서가 2026-07-30까지 실제 취합 가능한지와 원가율 품평 자료 반영 가능 여부는 확정되지 않았다. WA2604JK24 컬러명이 BLACK인지 CHARCOAL인지 재확인이 필요하다. WA2603CR16 글로벌 PO 3개 최종 유지/취소 여부, WA2603PT56 대만 판매가 확정값, Art Grocery 무신사/29CM 실제 오픈 완료 여부, 2PACK XS 발주 비중 확대 및 최종 사이즈 아소트, WA2603SO13 축소분을 WA2603CR13에 옮기는 안의 최종 반영 여부는 남아 있다.
- 2026-07-30 다음 할 일: 26FW 발주 품의 파일과 ERP에서 납기 공란 및 2060년 납기 건을 정리하고 발주리스트 RAW와 품의 파일에 동기화한다. 26FW 상품설명서 납기 최신값과 소싱 RAW `BF열` 입고 예정일 일치 여부를 점검한다. 뉴베이직 추석 전 2026-09-16~18 타겟 8개 스타일과 추석 이후 2026-09-28~30 타겟 3개 스타일의 가능 납기 및 파샬 가능 여부를 확정한다. JK65/JK72 AIR 입고 가능성과 JK72 BROWN 리스크를 소싱과 확정한다. 27SS 원가 견적서 취합 일정을 2026-07-30 목표로 재요청하고, 원단 혼용률은 샘플 작업 기준으로 정리한다. WA2604JK24 컬러명, 지케미-소로나 원단 비축재고 리스트 반영, 2PACK/3PACK 최종 발주 수량과 사이즈 아소트, WA2603SO13/CR13 수량 반영, 면세 리오더 중지 반영, 대만 EXCLUSIVE 3스타일 2026-07-31 EX-FAC 서류 전달, WA2603CR16 글로벌 PO 3개 처리, WA2603PT56 대만 판매가, Art Grocery 2026-08-03 SNS 업로드 및 무신사/29CM 오픈 완료 여부를 각각 확인한다.

## Current Teams Summary - 2026-07-29

- Use `workspace/memory/current-teams-update-summary-2026-07-29.md` as the latest Teams update source for decided items, unresolved items, and next actions from Teams chat/channel backup files available on 2026-07-29. The newest local Teams backup files are clipped on 2026-07-28; no 2026-07-29 Teams backup file was found locally.
- 2026-07-29 결정된 것: 26FW QR/SPOT/REORDER 운영 기준은 계속 `26FW 와키윌리 QR구성(SPOT,Reorder).xlsx`로 유지한다. 26FW 시즌 발주 품의는 `와키윌리 26FW 시즌 발주 품의 260723.xlsx`와 ERP 납기를 기준으로 보며, 납기 공란과 ERP 2060년 납기는 정정 대상이다. 27SS 발주리스트는 `★27SS 발주리스트.xlsx` 링크로 공유됐고, 27SS 품평 원단 혼용률은 샘플 작업 기준으로 협력사에 요청한다. 26FW 뉴베이직은 전 스타일 추석 전 입고가 어려워 우선순위, 파샬 생산, 주력 사이즈 선입고를 병행 검토한다. 추석 전 2026-09-18 타겟은 WA2603HZ01, WA2603CR01, WA2603HD01, WA2603PT02, WA2603PT03, WA2603CR03이며, 추석 이후 2026-09-28 타겟은 WA2603CR04, WA2603PT04, WA2603HZ02, WA2603JK03, WA2603HZ04이다. JK65/JK72는 1순위로 AIR 기준 일부 수량 9월 내 입고를 목표로 하며, 1,000PCS 9월 3주차 입고를 조율한다. WA2603CR16 해외 오더 103개는 대만 PO 90개와 일본 PO 10개 취소, 글로벌 PO 3개 확인 중으로 정리됐고 현지택가는 삭제했다. Art Grocery는 온라인 확대 방향이며 자사몰 등록 완료, 무신사/29CM 2026-07-28 오픈 준비 중이다. Art Grocery 인플루언서 촬영 이미지는 2차 활용 불가로 확인됐다. 면세 반팔은 면세 채널 집중 분배 및 RT 진행, BEST/집중판매 상품은 리오더 요청 대상으로 보고 3PACK은 리테일 판매 미확정으로 우선 제외한다.
- 2026-07-29 안 정해진 것: 2026-07-29 당일 Teams 백업 파일은 로컬에서 확인되지 않았다. 26FW 발주 품의 원가/사입가 공란 전체 입력, 예상원가/확정원가 구분, ERP 납기 공란 및 2060년 납기 정정 완료 여부는 미확정이다. 26FW 뉴베이직 최종 우선순위, 파샬 입고 가능 범위, 컬러별 1,000장 옵션, S/M/L 주력 사이즈 선입고 옵션, 추석 이후 입고 건의 파샬 가능 여부는 소싱 협의 결과가 필요하다. JK65/JK72 AIR 일부 수량과 9월 3주차 입고 가능성, JK72 BROWN 컬러 변수, JJ560/HNC 최종 GMT 납기와 AIR 비용/캐파 회복안, WA2603CR16 글로벌 PO 3개 최종 처리, WA2603PT56 대만 판매가, Art Grocery 무신사/29CM 실제 오픈 완료 여부와 SNS 게시일, 27SS 시장지 품번 혼용률 표기 기준, 면세 리오더 최종 수량은 미확정이다.
- 2026-07-29 다음 할 일: 26FW 발주 품의 파일과 ERP 납기 공란/2060년 납기 건을 정리하고 발주리스트 RAW와 동기화한다. 소싱팀은 원가/사입가 공란을 예상원가와 확정원가로 구분해 채운다. 26FW 뉴베이직은 우선순위표 기준으로 컬러별 1,000장 파샬, 스타일별 50% 분할 생산, S/M/L 주력 사이즈 선입고를 협력사에 확인한다. JK65/JK72는 AIR 기준 일부 수량 9월 내 입고 가능성, JK72 BROWN 리스크, 1,000PCS 9월 3주차 입고 가능성을 확정한다. WA2603CR16은 대만/일본 취소 반영 후 글로벌 PO 3개 유지 여부와 캔슬 판단을 마감한다. WA2603PT56 대만 판매가를 2026-07-29 오전 확인 후 택 발주 가능 상태로 만든다. Art Grocery는 무신사/29CM 오픈 완료 여부를 확인하고 인플루언서 이미지 2차 활용 불가 기준으로 온라인 상세 보완안을 재정리한다.

## Current Teams Summary - 2026-07-28

- Use `workspace/memory/current-teams-update-summary-2026-07-28.md` as the latest Teams update source for decided items, unresolved items, and next actions from Teams chat/channel backup files available on 2026-07-28. The newest local backup files are clipped as 2026-07-27 and were updated locally on 2026-07-28 morning.
- 2026-07-28 결정된 것: 26FW QR/SPOT/REORDER 운영 기준은 계속 `26FW 와키윌리 QR구성(SPOT,Reorder).xlsx`로 유지한다. 26FW 시즌 발주 품의는 `와키윌리 26FW 시즌 발주 품의 260723.xlsx`와 ERP 납기를 기준으로 보며, 2026-07-27 기준 예상 납기와 전산/발주리스트 RAW 값 수정이 완료됐다. 발주 품의는 우선 수기 기준으로 전환했고 일부 원가 공란은 예상원가로 입력 완료됐다. 26FW SPOT 추가 구성은 확정 소재 열을 품번별로 업데이트하며, 기모 원단은 오픈에이 진행 예정이고 퀄리티 컨펌은 완료됐다. WA2604JK17은 먼저 진행 가능한 체크부터 작업하고 베이지/TC 컬러는 리오더로 보며, TC 컬러 행 추가 시 오더 없음 기준 `NA` 입력 예정이다. Art Grocery는 온라인 확대 방향으로 전환해 자사몰 업로드 완료 또는 진행 기준으로 공유됐고, 무신사/29CM도 익일 업로드 및 오픈을 준비한다. Art Grocery SNS는 "반응이 좋아서 온라인도 추가 전개" 톤으로 차주 인스타 업로드를 요청한다. 온라인 전용/먼작귀 관련 TO-BE 일정은 2026-07-27 전 스타일 온라인 출시, 무신사 오프라인 홍대/대구점 포함, 2026-08-14 전 스타일 오프라인 출시 및 VM 적용으로 공유됐다. 면세 리오더 요청 상품은 면세 BEST/집중판매 상품이며 9월 시점 평균 판매율 75% 수준, 3PACK은 리테일 판매 미확정으로 우선 제외한다.
- 2026-07-28 안 정해진 것: 2026-07-28 당일 실제 Teams 신규 메시지는 아직 로컬 파일명 기준으로 확인되지 않았고 최신 백업은 2026-07-27 클립 파일이다. 26FW 발주 품의 원가/사입가 공란 전체 입력 완료 여부, 예상원가/확정원가 구분, ERP 납기 공란 및 2060년 납기 정정 완료 여부, WA2604JK72 판매가와 WA2604JK17 TC 컬러 행/해외 판매가 최종 반영, 26FW SPOT 품번별 확정 소재 업데이트 완료 여부와 BT 장 준비 가능일, JJ560/HNC 최종 GMT 납기와 AIR 비용/캐파 회복안, WA2603CR16 최종 캔슬 여부, Art Grocery 무신사/29CM 실제 업로드 완료와 인플루언서 이미지 사용 가능 여부, 먼작귀/온라인 전용 상품의 2026-08-07 조기 전개 가능성과 2026-08-14 VM 일정 최종안, 27SS 품평 원단 혼용률 시장지 기준, 면세 리오더 최종 수량은 미확정이다.
- 2026-07-28 다음 할 일: 26FW 발주 품의 파일과 ERP에서 납기 공란 및 2060년 납기 건을 정리하고 발주리스트 RAW와 품의 파일에 동기화한다. 소싱팀은 원가/사입가 공란을 예상원가와 확정원가로 구분해 채운다. WA2604JK17 TC 컬러 행과 `NA` 반영, WA2604JK72 판매가 및 해외 판매가 업데이트를 확인한다. 26FW SPOT 추가 구성 파일의 확정 소재 열, BT 장 준비 가능일, 기모/워싱물 퀄리티 컨펌 상태를 최신화한다. JJ560/HNC 최종 GMT 납기, AIR 비용, 캐파 회복 가능성을 재확인한다. WA2603CR16은 대만 삭제분, 해외 오더 유지 여부, 10월 말 지연 리스크, 퀄리티 미흡 시 캔슬 판단을 정리한다. Art Grocery 자사몰/무신사/29CM 업로드와 인플루언서 이미지 사용 가능 여부를 확인하고, 차주 인스타 업로드 메시지를 마케팅팀과 확정한다. 먼작귀/온라인 전용 상품 2026-08-07 조기 전개 가능 여부와 2026-08-14 전 스타일 오프라인/VM 적용 기준을 하나로 확정한다.

## Current Teams Summary - 2026-07-26

- Use `workspace/memory/current-teams-update-summary-2026-07-26.md` as the Teams update source for decided items, unresolved items, and next actions from Teams chat/channel backup files clipped or updated through 2026-07-26.
- 2026-07-26 결정된 것: 26FW QR/SPOT/REORDER 운영 기준은 계속 `26FW 와키윌리 QR구성(SPOT,Reorder).xlsx`로 유지한다. 26FW 발주 품의 원가/사입가 공란은 소싱팀이 일부 예상원가로 입력 완료했다. WA2604JK17/WA2604JK72 해외 판매가 업데이트는 일부 완료됐고, 확정 시트의 WA2604JK17 GR은 우먼스 WA2604JK72로 변경된 것으로 보며 WA2604JK17은 CH 컬러 추가 기준으로 기입했다. WA2604JK17 TC 컬러 행은 추가되면 오더 없음 기준 `NA`로 업데이트한다. 26 FALL 우먼스 화보 촬영 with 리센느 레이 KPI는 2026-07-27 12:00까지 취합한다. 면세 반팔 티셔츠 수량은 기존 계산 로직에 포함되어 있었고, 면세팀 별도 요청 수량이 오면 적정 수량을 추가 검토한다. 2026-07-28 11:00 신규 팀장 응대는 3번 회의실로 안내하고, 품의 파일은 신규 팀장에게 넘기며 예산은 부장과 직접 협의하도록 안내한다.
- 2026-07-26 안 정해진 것: 2026-07-24 이후 2026-07-27 당일까지의 실제 Teams 신규 대화는 로컬 백업에 포함되어 있지 않아 확인되지 않았다. 26FW 발주 품의 원가/사입가 공란 전체 입력 완료 여부, WA2604JK17 TC 컬러 행 추가와 해외 판매가 최종 반영 여부, WA2604JK72 판매가, 면세 반팔 티셔츠 하반기 수요예측과 최종 적정 수량은 미확정이다. 기존 2026-07-24 미결 항목인 WA2603CR16 오더 유지/캔슬 판단, JJ560/HNC 최종 GMT 납기와 AIR 비용/캐파 회복안, Art Grocery 무신사/29CM 업로드 완료 여부와 인플루언서 이미지 사용 가능 여부도 완료로 확인되지 않았다.
- 2026-07-26 다음 할 일: 2026-07-27 Teams 백업이 추가되면 재추출해 이 메모와 `CLAUDE.md`를 다시 갱신한다. 26FW 발주 품의 원가/사입가 공란의 남은 항목을 확인하고 예상원가와 확정원가를 구분해 관리한다. WA2604JK17 TC 컬러 행을 추가해 오더 없음/`NA` 기준 반영을 확인하고, WA2604JK72 판매가 확정 후 해외 판매가 시트까지 업데이트한다. 면세팀에서 하반기 수요예측을 다시 받아 별도 요청 수량이 있으면 적정 수량을 검토한다. 2026-07-28 신규 팀장에게 품의 파일을 인계하고 예산 협의는 부장과 직접 진행하도록 연결한다.

## Current Teams Summary - 2026-07-24

- Use `workspace/memory/current-teams-update-summary-2026-07-24.md` as the latest Teams update source for decided items, unresolved items, and next actions from Teams chat/channel backup files updated on 2026-07-24 and mostly clipped as 2026-07-23.
- 2026-07-24 결정된 것: 26FW QR/SPOT/REORDER 운영 기준은 계속 `26FW 와키윌리 QR구성(SPOT,Reorder).xlsx` 파일로 유지한다. 26FW 발주 품의는 `와키윌리 26FW 시즌 발주 품의 260723.xlsx` 기준으로 진행하고, 현 기준 사입가/원가 공란은 소싱 측이 점검해 2026-07-24 14:00 전후 회신하기로 했다. 26FW 추가 지연 예상 스타일은 WA2603LT15 2026-08-03~04, WA2603HZ62 2026-08-11, WA2603CR62/WA2603PT62 2026-08-13, WA2601SH62-3 2026-07-31로 공유됐다. JJ560 미팅은 2026-07-23 17:00로 변경됐고, 원단 2차 이상 리젝 건은 기획/소싱에 공유해 납기 영향을 사전 판단한다. WA2603CR16은 납기가 2026-10 말까지 지연 예정이고 CHARCOAL 계열 TC에서 BLUE 계열 TC로 컬러 변경 예정이며 라인시트에 우선 반영한다. 27SS 품평·사양회의는 2026-07-24 라인시트 1차 전달, 2026-08-04 품평, 2026-08-11~12 글로벌 컨벤션, 2026-08-14 사양·수량 최종 확정 기준으로 공유됐다.
- 2026-07-24 안 정해진 것: WA2603CR16 협력사 이관 후 퀄리티 미흡 시 캔슬 여부, 대만지사/일본지사/몽골BTF 오더 유지 여부, WA2604JK17 체크 선진행과 베이지/TC 리오더 취급 가능 여부, JJ560/HNC 최종 GMT 납기와 AIR 비용/캐파 회복안, 26FW 발주 품의 리스트 원가 입력 완료 여부, 27SS 품평 참석 리스트와 소싱 스케줄 이슈 목록, Art Grocery 무신사/29CM 업로드 완료 여부와 인플루언서 이미지 사용 가능 여부는 추가 확인이 필요하다.
- 2026-07-24 다음 할 일: 소싱팀은 26FW 발주 품의 사입가/원가 공란을 2026-07-24 14:00 전후 회신하고, 기획/소싱은 추가 지연 스타일의 변경 납기를 관리표에 반영한다. WA2603CR16은 라인시트 업데이트 후 각 해외 오더처에 유지 여부를 확인하고 캔슬 리스크를 결정한다. JJ560/HNC 미팅 결과로 최종 GMT 납기, AIR 비용, 라인 캐파 회복안, WA2604JK17 체크 선진행 가능 여부를 업데이트한다. 27SS 품평 일정에 맞춰 라인시트, 참석 리스트, 스케줄 이슈 스타일 목록, 글로벌 컨벤션 자료를 준비하고, 26 FALL 우먼스 화보 KPI는 2026-07-27 12:00까지 취합한다. Art Grocery 무신사/29CM 업로드, 인플루언서 이미지 사용, SNS 차주 업로드 일정을 계속 추적한다.

## Current Teams Summary - 2026-07-23

- Use `workspace/memory/current-teams-update-summary-2026-07-23.md` as the latest Teams update source for decided items, unresolved items, and next actions from Teams chat/channel backup files updated on 2026-07-23 and mostly clipped as 2026-07-22.
- 2026-07-23 결정된 것: 26FW QR/SPOT/REORDER 운영 기준은 계속 `26FW 와키윌리 QR구성(SPOT,Reorder).xlsx` 파일로 유지한다. Art Grocery는 2026-07-22 자사몰 업로드 완료, 2026-07-23 무신사/29CM 업로드 요청, SNS는 차주 업로드와 `반응이 좋아서 온라인도 추가 전개` 메시지로 조정한다. Art Grocery는 오프라인 추가 확대보다 FSS+면세+온라인 소진 우선 의견이며, 면세 약 800PCS 출고, 200PCS 예약, 사이즈별 창고재고 약 50PCS 이하가 공유됐다. 글로벌 PO 기준은 메인 정규 오더는 국가/글로벌별 PO 분리, 일반 SPOT은 국내 입고 후 별도 출고, 특정 국가 전용 SPOT은 특정 국가 PO로 진행하되 글로벌 PO 포함 시 특정 국가분/국내 입고분을 분리한다. JJ560 플리스 품번은 최종 GMT 가능 납기/JJ560 현황 시트가 업데이트됐고 2026-07-23까지 GMT 납기 FIX 검토 요청됐다. 소로나택 벡터화는 디자인실 제작 완료, 문구는 `소프트한 터치감`을 `기분 좋은 착용감`으로 바꿔 TEST 진행한다.
- 2026-07-23 안 정해진 것: Art Grocery 무신사/29CM 실제 업로드 완료일, 인플루언서 촬영 사진의 온라인 썸네일/상세페이지 사용 가능 여부, SNS 정확한 게시일, 오프라인 추가 매장 확대 여부, 대만/국내 입고분 PO 재작성 및 ERP 분리 완료 여부, WA2603STT1/STT2/CRT1 택 교체 비용 부담 주체와 국내 통관 입고 가능일, WA2603SH14 2컬러 정확한 생산 스케줄, JJ560 플리스 품번 최종 GMT 납기일과 AIR 비용/캐파 부족 회복안, 소로나택 샘플 컨펌 여부와 실제 부착 품번/수량 검증, 26FW 발주리스트 예상원가 입력 완료 여부는 추가 확인이 필요하다.
- 2026-07-23 다음 할 일: Art Grocery 무신사/29CM 업로드와 SNS 차주 업로드 일정을 확정하고 인플루언서 사진 사용 가능 여부를 회신받는다. Art Grocery는 FSS+면세+온라인 소진을 우선 추적하고 1~2주 반응 후 오프라인 확대를 재검토한다. 대만 직송분/국내 입고분 아소트 기준 PO 재작성과 ERP 분리를 완료하고, WA2603STT1/STT2/CRT1 택 교체 비용 및 입고 가능일을 확정한다. WA2603LT16 OL 수정과 WA2603SH14 지연 일정을 재확인한다. JJ560 플리스는 2026-07-23 GMT 납기 FIX 여부와 추가 딜레이 방지안을 정리한다. 소로나택 TEST 샘플 수취 후 컨펌하고, 겉감 소로나 쭈리 사용 품번 약 34,400EA를 검증한다. 26FW 발주리스트 원가 공란 품번에 예상원가를 입력한다.

## Current Teams Summary - 2026-07-22

- Use `workspace/memory/current-teams-update-summary-2026-07-22.md` as the latest Teams update source for decided items, unresolved items, and next actions from Teams chat/channel backup files updated on 2026-07-22 and mostly clipped as 2026-07-21.
- 2026-07-22 결정된 것: 26FW QR/SPOT/REORDER 운영 기준은 계속 `26FW 와키윌리 QR구성(SPOT,Reorder).xlsx` 파일로 유지한다. 26FW SPOT 추가 구성 건은 확정 소재 열을 품번별로 업데이트하기로 했고, 기모 원단은 오픈에이 진행 예정 건으로 퀄리티 컨펌 완료가 공유됐다. 뉴베이직 및 지케미 원단 메인 품번은 최종 GMT 가능 납기와 지케미/HNC 스케줄 시트가 업데이트됐다. WA2602SO01은 WA2502SO01 이월 아울렛 운영에서 아울렛 상시전개 품번으로 전환 예정이다. SDPK QR/RE-ORDER 5품번은 2026-07-23 입고 예정으로 변경됐고, WA2603LT52는 대만 PO 수량 NAS/NAM/OTS/OTM 각 25개 직송 기준으로 확인됐다. WA2603STT1/STT2/CRT1은 아직 FIX 전이며 대만택 선적 여부를 업체 확인 후 2026-07-22 회신받기로 했다. Art Grocery 온라인 등록은 2026-07-22 상세 공유 후 금주 중 등록 목표다.
- 2026-07-22 안 정해진 것: 26FW SPOT BT 장 준비 가능일, 품번별 확정 소재 업데이트 완료 여부, 지케미 원단 1차 전량 컨펌 여부, 뉴베이직/HNC 품번별 최종 납기일, WA2603STT1/STT2/CRT1 대만택 선적 가능 여부와 직송 수량/대만 희망 납기/택 처리 방식, WA2603LT52 대만 내부 관리 시트 반영 여부, 2026-08-04 품평의 최종 시간 배분과 매장 매니저 의견 수렴 방식, WA2602SO01 아울렛 상시전개 세부 운영, 3PACK 7월 마지막 주 PO 및 추석 전 입고 가능성, Art Grocery 실제 온라인 등록 완료일은 추가 확인이 필요하다.
- 2026-07-22 다음 할 일: 26FW SPOT 확정 소재와 BT 장 준비일을 업데이트하고, 지케미/HNC 최종 GMT 납기와 원단 1차 컨펌 리스크를 정리한다. WA2603STT1/STT2/CRT1 대만택 선적 가능 여부를 업체 확인 후 최신 글로벌/O.C/PO 파일에 반영한다. WA2603LT52 대만 직송 수량을 O.C/PO/대만 내부 관리 시트와 대조한다. 2026-08-04 품평 일정을 확정하고 약 200 SKU 리뷰 방식과 매장 매니저 의견 수렴 방식을 조정한다. WA2602SO01 아울렛 상시전개 운영 세부안을 영업기획과 확정하고, SDPK QR/RE-ORDER 5품번 2026-07-23 입고와 3PACK PO/납기, Art Grocery 상세페이지 공유 및 금주 등록 완료 여부를 추적한다.

## Current Teams Summary - 2026-07-21

- Use `workspace/memory/current-teams-update-summary-2026-07-21.md` as the latest Teams update source for decided items, unresolved items, and next actions from Teams chat/channel backup files updated on 2026-07-21 and mostly clipped as 2026-07-20.
- 2026-07-21 결정된 것: 무신사 에디션 5개 스타일은 2026-07-27 온라인 무신사 출고 기준이다. 26FW QR/SPOT/REORDER는 `26FW 와키윌리 QR구성(SPOT,Reorder).xlsx` 기준으로 실시간 업데이트하며, 26FW SPOT/워싱물 스웻/뒤판 그래픽 후드집업은 9월 내 입고 목표, 26FW 기모 스웻류는 늦어도 9월 말 입고 기준으로 작업지시서/PO 데드라인을 역산한다. WA2604JK17은 유니 베이지 체크 중심, WA2604JK72는 우먼스 차콜 체크 S/M 기준으로 운영한다. 글로벌 PO 수량은 별도 택갈이 없이 국내 재고와 동일하게 가용화하고, LINE SHEET 최초 오더 스타일은 MAIN, 그 외 추가 건은 SPOT으로 본다. WA2603ST11은 SPOT 건이라 별도 PO 분리 없이 국내 입고 후 출고하며, 생산 지연으로 2026-07-28 60%, 2026-07-31 잔량 파샬 입고 예정이다. Art Grocery는 2026-07-13부터 플래그십 전 매장 50% 할인 운영으로 전환했고, 먼작귀는 2026-08-07 전 스타일 온/오프라인 동시 출시 기준이다.
- 2026-07-21 안 정해진 것: 26FW SPOT/워싱물/기모 스웻류 최종 발주 데드라인, PO 발행 시점, 9월 내 입고 가능성, 기존 9월 입고 물량 조정 여부, 추가 제품 원가율 네고 결과, WA2604JK17/JK72/PT72 AIR 가능 여부와 대체 납기안, JJ560/HNC 가먼트 가능 납기, WA2603LT52 대만지사 내부 관리 시트 기준 최종 수량, WA2603CRT1 및 `#506~533` 누락 정보, Art Grocery 온라인 등록 완료일과 추가 채널/콘텐츠 보완안, 먼작귀 최종 오프라인 매장 리스트와 VM 세부 실행안, FW TF 반팔 16개점 판매 후 매장 확대 여부는 추가 확인이 필요하다.
- 2026-07-21 다음 할 일: 26FW QR 구성 파일의 SPOT/REORDER 최신 상태를 유지하고 발주 수량/타겟 납기/PO 데드라인을 확정한다. WA2604JK17/JK72/PT72 AIR 가능 여부와 불가 시 실제 원단 출고일/대체 납기안을 확인한다. JJ560/HNC는 지케미 변경 EX-MILL 기준으로 HNC 가능 가먼트 납기를 최종 회신받는다. WA2603LT52, WA2603STT1/STT2, WA2603CRT1, WA2603ST11, `#506~533`의 대만/O.C/직송/국내입고 구분과 누락 정보를 최신 파일에 반영한다. Art Grocery 온라인 상세페이지/등록, 50% 할인 POP/판매가 반영, 잔여 상품 소진, 팝업 회고를 추적한다. 먼작귀 2026-08-07 출시의 최종 매장 리스트와 VM 적용 범위를 확정하고, WA2603ST12/ST14 온라인 촬영 및 FW TF 16개점 판매 결과를 확인한다.

## Current Teams Summary - 2026-07-16

- Use `workspace/memory/current-teams-update-summary-2026-07-16.md` as the latest Teams update source for decided items, unresolved items, and next actions from Teams chat/channel backup files updated on 2026-07-16 and mostly clipped as 2026-07-15.
- 2026-07-16 결정된 것: 무신사 에디션 5개 스타일은 2026-07-27 온라인 무신사 출고 기준이다. FW TF 반팔 티셔츠는 2026-07-16 16개점 출고 후 7월 판매를 보고 매장 확대 여부를 검토한다. 2PACK은 패키지만 변경해 내년 1월 초 입고 목표의 연간운영 품번으로 진행한다. 글로벌 PO 수량은 별도 택갈이 없이 국내 재고와 동일하게 입고 후 가용화한다. Art Grocery는 플래그십 전 매장 50% 할인 운영으로 전환하고 POP/판매가 반영을 진행한다.
- 2026-07-16 안 정해진 것: PT31/SH16/SH31 판매가, 원가견적서 원본 전달, 대만 오더시트 fit 공란, WA2604JK17/JK72/PT72 AIR 가능 여부, JJ560/HNC 원단 출고일과 재컨펌 사유, Art Grocery 온라인 외 추가 채널 확대 및 콘텐츠 보완안은 추가 확인이 필요하다.
- 2026-07-16 다음 할 일: 판매가/원가견적서/fit 공란을 정리하고, WA2604JK17/JK72/PT72 AIR 가능 여부와 대체 납기안을 확인한다. 2026-07-16 오전 JJ560/HNC 미팅에서 원단 출고 기준 데드라인과 납기를 정리한다. 글로벌 리스트 누락 수량/정보를 재확인하고, Art Grocery 온라인 업로드·50% 할인 POP·판매가 반영·팝업 회고를 추적한다.

## Current Teams Summary - 2026-07-15

- Use `workspace/memory/current-decisions-actions-2026-07-15.md` as the latest clean Korean source for 2026-07-15 decided items, unresolved items, and next actions.
- 2026-07-15 결정된 것: 26FW QR/SPOT/REORDER는 기존 QR 구성 파일 기준으로 계속 관리하고, 26FW 추가 스타일 시트 업데이트/유니·우먼스 기입/2PACK·3PACK 숨김 처리를 완료했다. WA2604JK17/JK72/PT72는 2026-09-15 납기 대응을 위해 8월 초 원단 AIR 선적과 8월 둘째 주 공장 입고가 필요하다. 무신사 에디션은 2026-07-27 온라인 무신사 출고 기준, FW TF 상품은 2026-07-16 16개점 출고 후 7월 판매 결과로 매장 확대 여부를 판단한다. 26SS Art Grocery는 온라인 업로드를 진행하고, 낮은 판매 속도에 따라 50% 할인 운영으로 협의 완료했다.
- 2026-07-15 안 정해진 것: Art Grocery 50% 할인 적용 시작 시점, 온라인/해외/추가 채널 확대 및 프로모션 방식, 선물 패키지·SNS 인증 이벤트·키비주얼 보완 실행안, PT31/SH16/SH31 판매가, 원가 견적서 원본 전달, 대만 오더시트 fit 공란, WA2603HZ01NA 상태, WA2604JK17/JK72/PT72 AIR 가능 여부는 추가 확인이 필요하다.
- 2026-07-15 다음 할 일: PT31/SH16/SH31 판매가와 원가 견적서 전달 일정을 확정하고, 상품설명서 fit 공란 및 우먼스 누락 내용을 정리한다. WA2604JK17/JK72/PT72 AIR 가능 여부와 불가 시 대체 납기안을 확인한다. Art Grocery 온라인 업로드, 50% 할인 POP/판매가 반영, 잔여 상품 소진, 팝업 회고 자료 정리를 진행한다. WA2603ST12/ST14 온라인 촬영 일정과 FW TF 16개점 판매 결과를 추적한다.
- Use `workspace/memory/current-teams-update-summary-2026-07-15.md` as the current Teams update source for decided items, unresolved items, and next actions from Teams chat/channel backup files updated on 2026-07-15 and clipped as 2026-07-14.
- Key decisions: 26FW QR/SPOT/REORDER continues through `26FW 와키윌리 QR구성(SPOT,Reorder).xlsx`; 26FW additional styles were updated in the sheet; unisex/womens entries were completed; 2PACK/3PACK was hidden as reorder work; 26FW unisex hood zip-up cost ratio target is 25%.
- Key decisions: WA2604JK17, WA2604JK72, and WA2604PT72 need early-August fabric AIR shipment and second-week-of-August factory receipt to hit the 2026-09-15 target delivery; AIR was not the original plan but is now the delivery recovery path.
- Key decisions: Musinsa Edition launch/planning schedule is 2026-07-27 for online Musinsa shipment only; FW TF products ship to 16 stores on 2026-07-16, with July sales used to decide whether to expand stores; global PO quantities are handled as domestic available inventory without separate retagging.
- Key decisions: 26SS Art Grocery products proceed to online upload, and Art Grocery moves to 50% discount operation after low FSS sales velocity; WA2603ST12 and WA2603ST14 are current 26FW ST samples requiring online shooting checks.
- Open items: PT31/SH16/SH31 price confirmation, cost estimate approval originals, blank fit fields in Taiwan order-sheet product descriptions, final WA2603HZ01NA vs BK status, exact Art Grocery 50% discount start timing, and AIR feasibility for WA2604JK17/JK72/PT72 remain unresolved.

## Current Teams Summary - 2026-07-14

- Use `workspace/memory/current-teams-update-summary-2026-07-14.md` as the current Teams update source for decided items, unresolved items, and next actions from both `teams 채팅 데이터` and `teams 채널 데이터` files updated on 2026-07-14 and clipped as 2026-07-13.
- 오늘 결정된 핵심 내용: 26FW QR/SPOT/REORDER는 `26FW 와키윌리 QR구성(SPOT,Reorder).xlsx` 기준으로 계속 관리한다. 26FW SPOT/워싱물 스웻/뒤판 그래픽 후드집업은 9월 내 입고 목표로 진행하고, 26FW 기모 스웻은 9월 말 입고 기준으로 작업지시서/PO 데드라인을 역산한다. WA2604JK17은 유니 베이지 체크 중심, 우먼스 차콜 체크는 WA2604JK72로 분리하며 WA2604JK72는 국내 S/M 기준으로 운영한다. 확정 국내 판매가는 `Y열/AC열` 입력 후 글로벌팀이 대만/일본 택가를 수시 반영하고, WA2603LT15 GR은 국내 판매가 89,000원 기준으로 본다. 무신사 단독 5개 스타일은 2026-07-27 오픈 예정이고, TF FW 반팔 티셔츠는 무신사 출고 없이 오프라인 상위 약 15개 매장 위주로 진행한다. Art Grocery는 4일간 27PCS 판매 후 2026-07-13부터 성수/홍대/명동 플래그십 전 매장 50% 할인 운영으로 변경되었다.
- 오늘 미결 핵심 내용: 26FW SPOT 최종 투입 시점, 발주 데드라인, PO 발행 시점, 9월 내 입고 가능성, 재경팀 9월 입고 금액 조정에 따른 물량 조정 여부, WA2604JK72 글로벌 L/XL 오더의 S/M 전환 수량, WA2604JK17/WA2604JK72/WA2604PT72 원단 샘플 및 AIR 선적 가능성, 27SS 컨벤션 라인시트 최종안, 8월 VM 착장 재조율, Art Grocery 온라인/해외/추가 채널 확대 여부가 남아 있다.
- 오늘 우선 액션: 2026-07-14 미팅에서 26FW SPOT 일정/수량/발주/입고 우선순위와 기존 9월 입고 물량 조정 여부를 확정한다. WA2604JK17/WA2604JK72/WA2604PT72 원단·BT·CFM·AIR 선적 일정을 소재/소싱과 업데이트하고, WA2604JK72 글로벌 변경 오더 수량을 시트에 반영한다. WA2603HZ14 변경 컬러 CAD를 오전 수령 후 전달하고, WA2602STR3 #PI FSS 단독 SNS 홍보 이미지는 2026-07-16까지 수령한다. Art Grocery 50% 할인 POP/판매가 반영 완료 여부와 온라인 오픈 확대를 영업 미팅에서 확인한다.

## Wacky Willy Business + Sales Meeting - 2026-07-07

- Use `workspace/memory/wacky-willy-business-sales-decisions-2026-07-07.md` as the source for decided items, unresolved items, and next actions from the 2026-07-07 Wacky Willy business + sales meeting.
- Meeting terminology: use `BTA 분석`, `품평`, and `SKU 플랜`. Treat `베이직`, `트렌드`, `KT64번`, `010`, `S75`, `511번`, and `52번` as style codes unless a later source confirms full product names.
- Key decisions: 베이직 01/02번 is a high-inventory burden style-code group and should be managed for focused 7-8월 sell-through; the replacement basic T-shirt should not be a simple logo-only update and should test material, fit, word logo, slub yarn, and color/material-mix changes through samples.
- Key decisions: 7월 selling should focus on new/reorder products, while 8월 selling should defend sales through back-to-school ACC, February inventory, and early FW products. KT64번 should be treated as a Tmall/China opportunity style with 2026-08-04 reorder delivery management.
- Key decisions: 2026FW outbound starts from the existing 2026년 8월 2-3주차 plan, Musinsa-exclusive five styles remain planned for 2026-07-27, and the next 26FW meeting focus should shift to sales plan, channel efficiency, VM/IMC execution, and SKU plan.

## Current WA2702 ST T-Shirt Summary - 2026-07-14

- Use `workspace/memory/wa2702-st01-st03-current-summary-2026-07-14.md` as the current source for WA2702 ST01, ST02, and ST03 decided items, unresolved items, and next actions.
- 결정된 것: WA2702 ST line은 ST01 basic volume, ST02 Kiki/function, ST03 carryover front-logo 3스타일로 분리한다. 총 운영 수량은 72,000 pcs이며 ST01 32,000 pcs, ST02 30,000 pcs, ST03 10,000 pcs 기준이다. ST01은 39,000 KRW 소좌가슴 워드로고 기본물, ST02는 49,000 KRW 기능성 소재/Kiki IP 소로고 스타일, ST03은 49,000 KRW 전판 대형 로고 캐리오버 스타일로 본다. 1차 목업은 세 스타일 모두 WH/off-white 컬러로 검토 가능하며, 목업 파일은 `output/WA2702_ST01_ST03_execution_basis/mockups/WA2702_ST01_ST02_ST03_WH_mockup_contact_sheet.png`에 있다.
- 안 정해진 것: 최종 컬러 구성과 컬러별 수량, ST01/ST02/ST03 최종 아트웍 원본, ST02 최종 소재, 스타일별 프린트/자수/패치/전사/라벨 기법, ST01 메인 라벨 디테일, ST03 로고 크기와 컬러, 사이즈 스펙, 협력사, 원가, 샘플/BT/CFM/PO/납기, 채널 배분은 현재 데이터에서 확정으로 기록되지 않았다.
- 다음 할 일: WH 목업을 리뷰해 1차 샘플 컬러 유지 여부를 정하고, ST01/ST02/ST03 아트웍과 프린트 위치/크기를 확정한다. ST02 소재와 기법은 원가·샘플 가능성 확인 후 결정하고, ST01 라벨/전사 디테일과 ST03 전판 로고 스케일을 확정한 뒤 스타일별 샘플 지시서를 만든다.

## Current Korean Summary - 2026-07-10

- Use `workspace/memory/current-data-summary-2026-07-10.md` as the current integrated source for decided items, unresolved items, and next actions across Teams updates, To Do updates, and Chiikawa / 먼작귀 contract-royalty data.
- 현재 확정된 핵심 내용: 먼작귀 계약 기준 MG는 30,000,000원 VAT 별도, 러닝 로열티는 TAG가/소비자가격의 5% VAT 별도, 홀로그램 스티커 대금은 장당 3원 VAT 별도이며 사용료와 별도 정산한다. 먼작귀 판매가 변경 후 총 TAG 금액은 610,000,000원에서 710,000,000원으로 증가했고 총 로열티는 30,500,000원에서 35,500,000원으로 증가했으며, MG 30,000,000원을 초과하는 추가 로열티 결재 필요액은 5,500,000원이다.
- 현재 확정된 업무 내용: 먼작귀 판매가 변경 사유는 높은 원가율 방어와 영업의 낮은 판매 저항 판단이며, 원가 상승 원인은 아트웍 컨펌 기준과 도수 컬러별 지정 컬러 때문에 DTP가 아닌 라바 프린트로 작업된 점이다. 26FW SPOT은 QR 파일의 `투입 대기` 항목과 9월 내 입고 목표로 관리하고, WA2604JK17/WA2604JK72 컬러/사이즈 운영 기준과 26FW 주요 소재/스펙 기준은 정리되었다.
- 현재 미결 핵심 내용: 먼작귀 추가 로열티 5,500,000원 결재 승인, VAT 별도 청구 및 세금계산서 기준, 홀로그램 스티커 실물 대금과 로열티/MG 차감 정산 구분, 26FW SPOT 투입 시기·발주 데드라인·최종 수량·협력사·PO 시점, WA2604JK72 글로벌 L/XL 오더의 S/M 전환 수량, 27SS 컨벤션 루킹/진열 묶음, 7-8월 IMC 셀링포인트 공유 여부가 남아 있다.
- 현재 우선 액션: 먼작귀 추가 로열티 5,500,000원 결재 요청 및 VAT/세금계산서 기준 확인, 향후 IP 협업 상품의 아트웍 구현 방식별 원가 리스크를 초기 판매가 검토에 반영, 2026-07-14 화요일 미팅에서 26FW SPOT 투입 일정과 9월 입고 우선순위 확정, WA2604JK72 변경 오더 수량 시트 반영, 27SS 라인시트/VM 진열 기준 정리.

## Current Teams Summary - 2026-07-13

- Use `workspace/memory/current-teams-update-summary-2026-07-13.md` as the current Teams update source for decided items, unresolved items, and next actions from both `teams 채팅 데이터` and `teams 채널 데이터` files updated on 2026-07-13 and clipped as 2026-07-12.
- 오늘 결정된 핵심 내용: 26FW QR/SPOT/REORDER는 `26FW 와키윌리 QR구성(SPOT,Reorder).xlsx` 기준으로 운영하고, 26FW SPOT 추가 진행 건은 9월 내 입고를 목표로 관리한다. WA2604JK17 체크 플리스는 유니 베이지 체크, 우먼스 차콜 체크로 분리 운영하며, 우먼스 차콜 체크는 WA2604JK72로 분리하고 국내 S/M 기준으로 운영한다. WA2504PT01은 WA2603PT02 동일 스펙으로 진행한다. 다이마루 TF는 잠정 중단되었고 27SS 품평 샘플 작업은 유지원 대리에게 전달한다. 먼작귀는 2026-08-07 전 스타일 온/오프라인 동시 출시로 정리하고 VM은 FSS 하이라이트, FSS 외 한 헹거 POP 기준으로 적용한다. Art Grocery는 Seongsu FSS 사이즈별 25pcs, Hongdae/Myeongdong FSS 사이즈별 15pcs 기준으로 운영하며, 2026-07-13 Hongdae/Myeongdong 오픈과 성수 외부 벽 원복 방향이 공유되었다.
- 오늘 미결 핵심 내용: 26FW SPOT 최종 발주 데드라인, PO 발행 시점, 9월 내 입고 가능성, 기존 9월 입고 물량 조정 여부, 26FW 원가율 네고 결과, WA2604JK72 글로벌 L/XL 오더의 S/M 전환 수량, Art Grocery 할인 프로모션 적용 여부, 8월 VM 착장 작업 일정, TF FW 품번 반팔 티셔츠 최종 매장 리스트는 추가 확인이 필요하다.
- 오늘 우선 액션: 2026-07-14 미팅에서 SPOT 일정/수량/발주/입고 우선순위를 확정하고, 26FW 뉴베이직 BT/컬러 컨펌 우선순위를 처리하며, 먼작귀 2026-08-07 동시 출시 일정을 온라인/영업/VM/마케팅에 동일하게 공유한다. Art Grocery Hongdae/Myeongdong 판매 속도를 확인해 할인 여부를 결정하고, WA2602ST46/WA2601LT18 온라인 등록 및 소재 변경 리오더 설명 수정도 추적한다.

## Previous Teams Summary - 2026-07-10

- Use `workspace/memory/current-teams-update-summary-2026-07-10.md` as the current Teams update source for decided items, unresolved items, and next actions from both `teams 채팅 데이터` and `teams 채널 데이터` files updated on 2026-07-10 and clipped as 2026-07-09.
- 오늘 확정된 핵심 내용: 26FW SPOT은 QR 파일의 `투입 대기` 항목과 9월 내 입고 목표로 관리, 상품설명서 소싱파트 기재 요청 및 7월 납기물 업데이트 완료, WA2604JK17 유니/우먼스 컬러 분리, WA2604JK72는 우먼스 S/M 기준으로 운영, HNC 기모·WA2504PT01 스펙·뉴베이직 워싱·CP360 소재 기준 확정, 다이마루 TF 잠정 중단 및 27SS 품평 샘플 작업 담당 변경, 26SS SDPK 리오더 일부 입고 지연, 27SS 컨벤션 라인시트 작성 기준 요청, Art Grocery 성수 팝업 1일차 판매 6PCS 기록.
- 오늘 미결 핵심 내용: 26FW SPOT 투입 시기·발주 데드라인·최종 수량·협력사·PO 시점, 재경팀 9월 입고 금액 조정에 따른 물량 조정 여부, 9월 내 입고 달성 가능성, 디자인실 케파 부족 시 최소 변경 방식 적용 여부, WA2604JK72 글로벌 L/XL 오더의 S/M 전환 수량, 27SS 컨벤션 루킹/진열 묶음, 26FW 패딩류 네이밍, 7-8월 IMC 셀링포인트 공유 여부, Art Grocery 선물 수요 셀링포인트 보완안.
- 오늘 우선 액션: 2026-07-14 화요일 미팅에서 SPOT 투입 시기와 디자인/소싱 일정 확정, 발주 데드라인 및 생산 리드타임 산출, WA2604JK72 변경 오더 수량 시트 반영, 26FW SPOT 상품설명서 소싱파트 점검, 26SS SDPK 지연 품번 입고 추적, 27SS 라인시트와 VM 진열 순서 정리, IMC 셀링포인트 공유 확인, Art Grocery 선물용 패키지 셀링포인트 보완.

## Previous Korean Summary - 2026-07-09

- Use `workspace/memory/current-teams-update-summary-2026-07-09.md` as the current Teams update source for decided items, unresolved items, and next actions from both `teams 채팅 데이터` and `teams 채널 데이터` files updated on 2026-07-09.
- 오늘 확정된 핵심 내용: 26FW QR·대만/일본 판매가 업데이트 완료, WA0000STE1/2/3 2PACK·3PACK 개발, WA2602STA7 차량 출고, Art Grocery 수량 및 VM 집결 기준 확정, 26FW SPOT은 QR 파일의 투입 대기 항목과 9월 내 입고 목표로 관리, WA2604JK17 유니/우먼스 컬러 분리, 우먼스 차콜 체크는 WA2604JK72 S/M으로 운영, HNC 기모·뉴베이직 워싱·CP360 소재·핏 기준 확정.
- 오늘 미결 핵심 내용: 패키지 수량/리드타임, WA2603LT16 컬러명 변경, 케어라벨 재작업 조건, Art Grocery 후속 운영, 26FW SPOT 최종 수량·발주 데드라인·협력사·PO 일자, 재경팀 9월 입고 금액 조정 대상, WA2604JK72 글로벌 L/XL 오더의 S/M 전환 수량, 9월 말 납기 달성 여부.
- 오늘 우선 액션: 2026-07-14 미팅에서 SPOT 투입 시기와 9월 입고 우선순위 확정, QR 파일 기준 발주 데드라인 산출, WA2604JK72 글로벌 변경 오더 업데이트, 협력사 지정 및 워싱 원가 비딩, 작업지시서에 확정 사양 반영, 9월 필수 입고와 10월 이월 스타일 구분.

## Decided

- Company and brand context: B:CAVE / WACKY WILLY.
- Main channels: owned mall, Musinsa, 29CM, duty-free, and flagship stores in Hongdae, Seongsu, and Myeongdong.
- Current season status: 26SS selling, 26FW ordering completed, 27SS planning in progress.
- Regular meetings: QR meeting Tuesday 14:00, flagship/duty-free meeting Tuesday 15:00, operator meeting Thursday, AI workshop Friday.
- 26SS sales reference date is 2026-06-22: APP total weekly actual sales 653M KRW, YoY -64.2%, cumulative sell-through 42.1%.
- 26SS issue items: unisex PT cumulative sell-through 21.4% needs inventory handling; HZ/U WoW +61.4% shows rebound; WOMENS SH cumulative sell-through 82.6% needs ERP stock check; WOMENS CD is the only positive YoY category at +43.8%.
- 26FW order frame: 43B KRW confirmed plus 5B KRW buffer, up to 50B KRW total.
- 26FW covered categories: JK, HZ, HD, CR, PT, KT, ST, SH, CD, DP, LT, excluding accessories.
- 26FW IMC shoot: 2026-07-14, 7 styles, female model, under 5M KRW budget.
- 26FW key lineup: fleece sweatshirt 27,500 pcs / about 2.39B KRW; fleece C-line RSP 139,000 KRW with side tape set-up, September inbound and October outbound; lightweight padding reduced to 5,000 pcs; lightweight down about doubled; womens new basic uses Sorona/waffle exclusive material, A grade, all stores plus outlets 10-20%.
- 26FW QR updates from 2026-06-19: WA2604JK17 color addition; WA2604JK14 converts to SPOT order; WA2604JK23/PT23 fleece track set-up planned as SPOT.
- 26FW reorder material substitutions: ST11 to ST38, ST15 to ST38, ST16 to ST47, ST19 to ST48.
- WA2602ST06YE and ST73RD cannot be reordered.
- 27SS planning direction: prioritize consumer response, market flow, and competitor movement over internal-only analysis.
- 27SS price direction: expand toward the upper end of the range and differentiate from low-price online products.
- 27SS order scenarios: Plan A +10% as default, Plan B +30% as alternative.
- 27SS price matrix target completion date: 2026-06-30, connected to late-July inbound ordering.
- 2026-07-14 WA2702 ST T-shirt decision: ST01 is a 39,000 KRW basic volume style with 32,000 pcs, ST02 is a 49,000 KRW Kiki/function style with 30,000 pcs, and ST03 is a 49,000 KRW carryover front-logo style with 10,000 pcs; first WH/off-white mockup review is acceptable for all three.
- Chiikawa collaboration recorded product-flow dates: ST/LT inbound 2026-06-30 and CR inbound 2026-07-14. Launch dates need reconfirmation from 2026-07-01 current data.
- Chiikawa collaboration base channels: owned mall, Musinsa, and 29CM. Musinsa offline store count/location and launch timing need reconfirmation from 2026-07-01 current data.
- Chiikawa collaboration VMD applies only to Hongdae, Seongsu, and Myeongdong FSS.
- Chiikawa collaboration owners: Park Heehyun for sourcing, Byeon Changhyun for planning, Kim Heeyoung for design, Park Dasom for marketing.
- Hologram stickers are received and managed by headquarters, with legal responsibility clauses included in the contract.
- IMC performance standard: target monthly sales equals supply amount of IMC target products times 15%; 15% or more is success, 10-15% is baseline, under 10% is failure; review monthly in one-page format.
- Marketing content request rule: use `workspace/memory/marketing-content-request-guideline-2026-07-13.md` when asking marketing for content creation or upload support. Coordinate upload timing with Park Dasom, give about two weeks of lead time when possible, avoid same-day or one-day-before requests, and include inbound date, style numbers, quantity, channel/store scope, and business context.
- Marketing team roles for content requests: Kwon Soonbeom owns photo shoots, Park Dasom owns SNS management and collaborations, Ahn Minhyeok owns all marketing design, and Park Sungmin owns seeding and viral.
- In ERP, category-unit Q.R products must be marked consistently as `Q.R` in the remarks field.
- 2026-07-14 Teams decision: 26FW QR/SPOT/REORDER continues through `26FW 와키윌리 QR구성(SPOT,Reorder).xlsx`; 26FW SPOT/워싱물 스웻/뒤판 그래픽 후드집업 targets September inbound, and 26FW 기모 스웻 requires PO/work-order deadline calculation from a late-September inbound target.
- 2026-07-14 Teams decision: WA2604JK17 runs as unisex beige check, womens charcoal check is separated as WA2604JK72, and WA2604JK72 domestic sizing is reduced to S/M.
- 2026-07-14 Teams decision: confirmed domestic prices entered in `Y열/AC열` are the trigger for the global team to enter Taiwan/Japan local tag prices; WA2603LT15 GR should be treated as 89,000 KRW domestic price.
- 2026-07-14 Teams decision: five Musinsa-exclusive styles are planned for 2026-07-27 opening, while TF FW short-sleeve T-shirts should avoid Musinsa shipment and run mainly through about 15 top offline stores.
- 2026-07-14 Teams decision: Art Grocery sold 27 pcs over 2026-07-09 to 2026-07-12 at Seongsu, then moved to 50% discount operation across Seongsu, Hongdae, and Myeongdong flagship stores from 2026-07-13.
- 2026-07-15 Teams decision: 26FW additional styles were updated in the sheet, unisex/womens entries were completed, and 2PACK/3PACK was hidden as reorder work.
- 2026-07-15 Teams decision: WA2604JK17, WA2604JK72, and WA2604PT72 require early-August fabric AIR shipment and second-week-of-August factory receipt to hit the 2026-09-15 target delivery; if AIR is not possible, sourcing must confirm the real fabric outbound date and coordinate a delivery plan with planning.
- 2026-07-15 Teams decision: Musinsa Edition is scheduled for 2026-07-27 as online Musinsa shipment only, FW TF products ship to 16 stores on 2026-07-16 for July sales testing, and global PO quantities are made available as domestic inventory without separate retagging.
- 2026-07-15 Teams decision: 26SS Art Grocery products proceed to online upload and the low-sales FSS operation moves to 50% discount handling.
- For future merchandising review reports, the product MAP/order sheet must be included. Update the 2026FW order list with final CAD-based style numbers, quantities, costs, and related product-map data.
- 26FW planning was revised from a 60B KRW kickoff basis to about 58B KRW. For selection meetings, womens should preserve roughly 70% of current counted styles/SKUs rather than forcing a fixed category-by-category style count.
- 26SS SPOT styles from category-unit discussions must be added to `26SS SPOT 구성.xlsx`, including womens and woven items, using the added innerwear example as reference.
- 26SS monthly review uses the SPOT composition file and monthly closing slides as source material.
- 26FW care labels should be applied globally like Covernat, using English, Simplified Chinese, Japanese, and Traditional Chinese. Planning should communicate this with sourcing.
- Byeon Changhyun is the planning-side owner for the Disney+ Style Wars content collaboration.
- Welcome dinner for Byeon Changhyun moved from March 26 to March 24.
- Once the 26FW style order list is finalized, share it with the global team.
- 4월 VM 착장 리스트 request for unisex/womens was completed and shared by Byeon Changhyun on 2026-03-17.
- Womens ruffle item shown on 2026-04-14 received positive feedback from Kim Minhyuk.
- Womens team had a strong-performing item by 2026-05-28, with Kim Minhyuk specifically praising Kim Yeonhee and Yang Yoonsun.
- 2026-06-29 archive rule: meeting minutes and meeting-derived outputs are stored under `output/meeting-minutes` by date and topic, and reusable business context is separately stored under `workspace/memory`.
- 2026-06-29 memory scope: use `workspace/memory/bcave-organization-context.md` as the current organization reference and treat Byeon Changhyun as belonging to B:CAVE headquarters > Brand Business Division > Wacky Willy Business Department > Product Team > Apparel Planning Part.
- 2026-06-29 Wacky Willy monthly-review direction: the main 2026 business mission is profit turnaround, with FW execution, QR operation, GTM information structure, KPI simplification, and brand/product direction cleanup treated as priority work.
- 2026-06-29 Wacky Willy brand direction: shift from target/persona-led messaging toward product-led brand expression centered on characters, graphics, and styling, with global, duty-free, and directly operated channels treated as important opportunity channels.
- 2026-06-29 Art Grocery popup: popup name is `Art Grocery`; Seongsu operation runs 2026-07-09 through 2026-07-12; ending-display handling should prioritize continuing the Seongsu flea-market operation over moving all fixtures to stores.
- 2026-06-29 Art Grocery popup: fixture/display budget is about 15M KRW including electricity; The Hyundai and Myeongdong use simple POP only without separate fixture buildout; viral scope includes global channels, not only domestic channels.
- 2026-07-01 Teams data rule: use `teams 채팅 데이터` as the current operating backup and `Clippings/Teams` as historical context. Treat 3-6월 chat requests as past flow unless a current unresolved follow-up remains.
- 2026-07-01 current Teams decision: 26SS sales item list update is recorded as completed.
- 2026-07-01 current Teams decision: 26FW product list was updated into the 26FW order list using the `Y` marker.
- 2026-07-01 current Teams decision: 26FW additional-order work should keep the `26FW 발주리스트` and `26FW 추가발주 요청서` updated together, then communicate through the product-planning file.
- 2026-07-01 current Teams decision: 26FW overseas communication materials are organized under `26FW GTM 운영체계 - [501] 해외 커뮤니케이션`, covering 26FW product images, Taiwan/Japan sale prices, and 26FW PP sample image updates.
- 2026-07-01 current Teams decision: Taiwan/Japan price review currently includes CRT1 89,000 KRW, STT1 49,000 KRW, and STT2 59,000 KRW.
- 2026-07-01 current Teams decision: WA2603STW5 is not included in the current line, additional products, or SPOT flow, so Japan/Taiwan sales are not planned unless a later update changes this.
- 2026-07-01 current Teams decision: WA2603ST17 was identified as the style number for the current inquiry.
- 2026-07-01 current Teams decision: 27SS jersey/character/competitor reference files are strategy reference material, not immediate execution items.
- 2026-07-06 current data rule: use `workspace/memory/current-data-summary-2026-07-06.md` as the current report and popup summary source for 2026-06 monthly review, 2026-07 VMD, and Art Grocery / T-shirt Festival popup decisions.
- 2026-07-06 report archive: WACKY WILLY monthly reviews from 2025-08 through 2026-06 are converted to Markdown under `보고 자료/월 리뷰/md/`.
- 2026-07-06 current monthly-review decision: the 2026-06 monthly review agenda centers on the 26FW marketing strategy, WACKY WILLY unisex design-direction reset, product efficiency review, VMD, and marketing review.
- 2026-07-06 current VMD decision: 2026-06 execution included Myeongdong FSS layout work, Hongdae FSS Family Club setup, pop-ups at Shinsegae Gangnam and Hyundai Outlet Songdo, June graphic T-shirt VM guide, VP/event work, hot-summer graphic T-shirt main IMC display completion, and Pintergirl collection display completion in six stores.
- 2026-07-06 current VMD decision: 2026-07 plan is to move ACC forward and change layouts at Myeongdong, Hongdae, and Seongsu FSS; display Grocery Market products at Seongsu on 2026-07-09 and Hongdae/Myeongdong on 2026-07-13; open Lotte Outlet Jinju on 2026-07-24; prepare July hot-summer graphic T-shirt VM guide, Chiikawa visual display for 2026-08-04, and events at The Hyundai Daegu, Shinsegae Outlet Gimhae, and Starfield Suwon.
- 2026-07-06 current marketing decision: the 2026-06 hot-summer campaign top-five product review recorded 14,800 pcs and 577,330,042 KRW, ROAS 67x, and should be considered a repeatable/scalable seasonal campaign model.
- 2026-07-06 Art Grocery / T-shirt Festival decision: Seongsu FSS exclusive pop-up runs 2026-07-09 through 2026-07-12, followed by simple POP-only FSS rollout at Seongsu, Hongdae, and Myeongdong from 2026-07-13 through the end of August.
- 2026-07-06 Art Grocery / T-shirt Festival decision: operating target is 32 SKUs, 25,200 pcs, and 1.23B KRW in operating stock; Target scenario is 330M KRW sales and 7,656 pcs sold.
- 2026-07-06 Art Grocery / T-shirt Festival decision: Target scenario assumes popup-exclusive sell-through 70%, 3,080 pcs, 151M KRW, plus 26SS main residual-stock absorption 22%, 4,576 pcs, 179M KRW at 39,200 KRW after 20% discount.
- 2026-07-06 Art Grocery / T-shirt Festival decision: scenario goals are Base 241M KRW / 5,540 pcs, Target 330M KRW / 7,656 pcs, and Stretch 417M KRW / 9,760 pcs.
- 2026-07-06 Art Grocery / T-shirt Festival decision: stock allocation guide is Seongsu FSS 50%, Hongdae FSS 30%, and Myeongdong FSS 20%.
- 2026-07-06 T-shirt Festival promotion styles: WA2602STS1, WA2602STS2, WA2602STS3, WA2602STS4, WA2602STS5, WA2602ST31, WA2602ST32, WA2602ST33, WA2602ST34, WA2602ST42, WA2602ST43, and WA2602ST46.
- 2026-07-06 Art Grocery styles: WA2602STA1, WA2602STA2, WA2602STA3, WA2602STA4, WA2602STA5, WA2602STA6, and WA2602STA7.
- 2026-07-07 current Teams rule: use `workspace/memory/current-teams-update-summary-2026-07-07.md` as the current Teams update source for 2026-07-06 clipped chats updated on 2026-07-07.
- 2026-07-07 Chiikawa / 먼작귀 decision: final launch schedule is 2026-08-07 for all styles across online and offline channels, with VM applied offline; earlier 2026-07-27 online and 2026-08-14 full-launch flows are superseded.
- 2026-07-07 Musinsa Edition decision: WA2602STM1, WA2602STM2, WA2602STM5, WA2602STM6, and WA2602STM7 launch shifted from 2026-07-13 to 2026-07-20 due to influencer image and product-cut delays; Musinsa Edition slot and MFS use remain planned.
- 2026-07-07 Musinsa Edition decision: STM5, STM6, and STM7 proceed with influencer content; STM1 and STM2 do not proceed with separate influencer content because sample receipt was too late. STM1 and STM2 were expected at headquarters on 2026-07-07 around 16:00-17:00.
- 2026-07-07 online owner update: WACKY WILLY external malls, including Musinsa and 29CM, move to Kim Minjo; owned mall communication remains with Kim Soli.
- 2026-07-07 26FW change-control decision: 76 QC-or-later changes were identified, including 20 cost-increase drivers, 7 delivery-delay drivers, and 49 duplicate-change style numbers; future QC-or-later changes must be shared immediately in `[110] 메인 스타일 변경 알람` with style number, stage, detail, and cost/delivery impact.
- 2026-07-07 high-risk 26FW delivery-delay styles: WA2604JK15, WA2604JK71, WA2603JK65, WA2603HZ14, WA2603KT65, WA2603CD51, and WA2603CD61; WA2604JK15 has zipper-order delay and needs immediate delivery-date checking.
- 2026-07-07 26SS week 1 July sales: period 2026-06-29 through 2026-07-05, ERP basis 2026-07-06; APP sales 594M KRW, YoY -26.0%, WoW -14.9%, discount 12.9%, 10,823 pcs.
- 2026-07-07 26SS week 1 July category result: unisex APP 340M KRW, YoY -41.9%, WoW -8.9%, cumulative sell-through 34.1%; womens 254M KRW, YoY +7.3%, WoW -21.6%, cumulative sell-through 57.4%.
- 2026-07-07 Teams decision: 26SS sales-best and sales-trend updates were completed.
- 2026-07-07 Art Grocery decision: Hongdae and Myeongdong FSS display plans and reused/added fixture lists were shared; fixtures move after 2026-07-12 closing for 2026-07-13 opening, and Seongsu exterior wall returns to the existing graphic after 2026-07-12 closing.
- 2026-07-07 Art Grocery decision: dedicated shopping bags 1,000 pcs were completed and planned for direct shipment to Seongsu FSS; product cutouts were delivered to the web team.
- 2026-07-07 Art Grocery inbound schedule: WA2602STA1-WA2602STA6 on 2026-07-02 and WA2602STA7 on 2026-07-07.
- 2026-07-07 online upload decision: WA2602ST46 and WA2601LT18 images are to be received Wednesday morning and registered within that Wednesday.
- 2026-07-07 reorder-content decision: material-change reorder descriptions need correction and re-upload for WA2602ST38, WA2602ST39, WA2602ST47, WA2602ST48, and WA2602ST49.
- 2026-07-07 26FW outlet direction: planning opinion is to show only large-volume 26FW new-basic products up to premium outlets, not to expand all new basics to general outlets.
- 2026-07-07 global order decision: China Tmall requested WA2602KT64 M size 100 pcs for 2026-08-04 inbound; 150 pcs will be ordered first and the remaining 50 pcs absorbed domestically, with warehouse transfer requested through sales planning at inbound.
- 2026-07-07 27SS womens decision: W-ST33 is a camo mesh short-sleeve T-shirt using the same camo pattern as W-ST01; if the same pattern is used, proceed with the same vendor as W-ST01.
- 2026-07-08 current Teams rule: use `workspace/memory/current-teams-update-summary-2026-07-08.md` as the current Teams update source for Teams backup files updated on 2026-07-08 and clipped as 2026-07-07.
- 2026-07-08 Musinsa Edition decision: WA2602STM1, WA2602STM2, WA2602STM5, WA2602STM6, and WA2602STM7 remain the target styles for the 2026-07-20 launch with MFS use; STM1 and STM2 sample delivery required direct next-morning receipt/address handling due to hand-carry delay.
- 2026-07-08 online upload decision: WA2602ST46 and WA2601LT18 should be registered online after Wednesday morning image receipt.
- 2026-07-08 reorder-content decision: material-change reorder descriptions still need correction and re-upload for WA2602ST38, WA2602ST39, WA2602ST47, WA2602ST48, and WA2602ST49.
- 2026-07-08 Art Grocery decision: after Seongsu FSS popup operation, fixtures move after 2026-07-12 closing for 2026-07-13 Hongdae and Myeongdong FSS opening; Seongsu exterior wall returns to the existing graphic after 2026-07-12 closing.
- 2026-07-08 Art Grocery decision: dedicated shopping bags 1,000 pcs are complete and planned for direct shipment to Seongsu FSS; WA2602STA1-WA2602STA6 inbound was shared as 2026-07-02 and WA2602STA7 as 2026-07-07.
- 2026-07-08 global price decision: in `와키윌리_26FW 원가,판매가 확정.xlsx`, domestic confirmed-price items marked `Y` or `AC` can be used by the global team to enter Taiwan/Japan temporary prices; urgent items should be requested separately.
- 2026-07-08 global price decision: if final confirmed price and expected sale price are identical, the file's price-calculation logic can be used; Japan sale prices are entered on a +VAT basis unless an extra -VAT/previous-price table is needed.
- 2026-07-08 global price reference: domestic 49,000 KRW was discussed as 1,490 NTD for Taiwan pricing logic.
- 2026-07-08 global order decision: WA2602KT64 M remains 150 pcs for the 2026-08-04 inbound flow, with 50 pcs absorbed domestically and warehouse-to-sales-planning transfer coordinated at inbound.
- 2026-07-08 26FW inbound decision: 26FW outbound/inbound execution is expected to start from the second week of August by product-planning schedule.
- 2026-07-08 early-inbound review: WA2602ST51 and WA2602ST52 were shared as 7월 3주차 inbound items and reviewed as BEST-product early-inbound candidates.
- 2026-07-08 reorder review: WA2602KT64 DN 600 pcs and LG 300 pcs, total 900 pcs, were shared for reorder quantity review.
- 2026-07-08 remake-cost reference: remake products are expected to add about 20% cost per piece on average.
- 2026-07-08 26FW inner-basic decision: because 1st lot is being shared and color-addition delays are accumulating, immediate fabric confirmation is the main way to defend the August schedule.
- 2026-07-08 27SS sourcing decision: 27SS sourcing materials should be requested ahead of weekly sample meetings, with at least two vendors used for bidding where possible.
- 2026-07-08 sourcing decision: WA2602DP63 L size proceeds as 300/300 additional quantity.
- 2026-07-08 delivery-shortening candidates: WA2602CD52 and WA2602ST72 were shared as styles to ask sourcing about shortening delivery by one week.
- 2026-07-09 current Teams rule: use `workspace/memory/current-teams-update-summary-2026-07-09.md` as the current Teams update source for Teams backup files updated on 2026-07-09 and clipped as 2026-07-08.
- 2026-07-09 26FW data decision: the 26FW QR update and Taiwan/Japan sale-price entry for domestically confirmed products were completed; Japan prices use the Japan-side conversion table, with mismatches checked separately.
- 2026-07-09 package decision: develop always-on 2PACK/3PACK packaging under WA0000STE1, WA0000STE2, and WA0000STE3; confirm order and package-development lead times from expected quantities.
- 2026-07-09 27SS package decision: proceed with a separate 27SS 2PACK and develop the graphic/color specification after the design brief.
- 2026-07-09 product-name decision: 26FW styles without a SPEC sheet are treated as undecided and excluded from the updated product-name list.
- 2026-07-09 outbound decision: WA2602STA7 was assigned to next-day vehicle dispatch after the 2026-07-08 urgent-release request.
- 2026-07-09 Art Grocery allocation decision: allocate 25 pcs per size to Seongsu FSS and a base 15 pcs per size to Hongdae/Myeongdong FSS; VM staff meet at 09:00.
- 2026-07-09 VM direction: retain the existing display in August weeks 1-2 and move to FW in weeks 3-4, with final feedback aligned to the 2026-07-15 work schedule.
- 2026-07-09 development decision: use the existing SO13 chart and TC CAD for WA2604JK17 development.
- 2026-07-09 Teams channel data rule: include `teams 채널 데이터` as a current operating source alongside `teams 채팅 데이터`; the current channel source is `와키윌리 QR 대응 체계 > 26FW QR`.
- 2026-07-09 26FW SPOT decision: manage active SPOT candidates in the `투입 대기` section of `26FW 와키윌리 QR구성(SPOT,Reorder).xlsx`, targeting September inbound.
- 2026-07-09 fleece-color decision: WA2604JK17 unisex uses beige check plus solid charcoal and a winter pattern; womens uses charcoal check plus solid brown.
- 2026-07-09 SKU decision: womens charcoal check is split into WA2604JK72 and domestic sizing is S/M; existing global L/XL orders require buyer conversion updates, with no separate additional-order collection planned.
- 2026-07-09 material/spec decision: WA2604HZ01 HNC uses the WA2604PT65 CP360 lightly brushed fleece quality; WA2504PT01 follows WA2603PT02 specs.
- 2026-07-09 washing/material decision: WA2603HZ17-WA2603PT17 use acid-wash color bleaching on C100 400G lightweight french terry; WA2603HZ15-WA2603HZ06 use CP360 french terry.
- 2026-07-09 SPOT execution direction: if design capacity is constrained, reduce work by changing only the 25FW logo or fabric color; confirm launch timing and September inbound priorities at the 2026-07-14 meeting.
- 2026-07-10 current Teams rule: use `workspace/memory/current-teams-update-summary-2026-07-10.md` as the current Teams update source for Teams chat and channel backup files updated on 2026-07-10 and clipped as 2026-07-09.
- 2026-07-10 SPOT decision: 26FW SPOT active styles remain managed in the QR file's `투입 대기` section with a September inbound target; the sourcing part of the product-description sheet was requested and July delivery items were updated.
- 2026-07-10 26FW spec decision: WA2604HZ01(HNC) uses WA2604PT65 CP360 lightly brushed fleece, WA2504PT01 follows WA2603PT02 specs, WA2603HZ17-WA2603PT17 use acid-wash color bleaching on C100 400G lightweight french terry, and WA2603HZ15-WA2603HZ06 use CP360 french terry.
- 2026-07-10 development ownership decision: the Daimaeru TF was temporarily suspended and work changed; Daimaeru weekly/Jisan ownership changed, and 27SS sample-review sample work should be handed to Yoo Jiwon.
- 2026-07-10 26SS SDPK reorder delay decision: WA2602SO31-2, WA2602SO75-3, and WA2602SO13-2 moved from 2026-07-14 to 2026-07-21; WA2602SS31-2 and WA2602SO32-3 moved to 50% partial inbound on 2026-07-21 and remaining inbound on 2026-07-28.
- 2026-07-10 27SS convention linesheet direction: separate men's and women's sheet tabs, use the same category order for both, and place intended adjacent display looks in adjacent/below rows so VM can align floor display to the linesheet.
- 2026-07-10 Art Grocery result: Seongsu popup opened and was set without issue; day-one sales on 2026-07-09 closed at 6 pcs, with rain limiting traffic and gift-package demand noted as a selling-point opportunity.
- 2026-07-10 current integrated data rule: use `workspace/memory/current-data-summary-2026-07-10.md` as the current integrated source across Teams, To Do, and Chiikawa / 먼작귀 contract-royalty updates.
- 2026-07-10 Chiikawa / 먼작귀 contract decision: MG is 30,000,000 KRW VAT excluded; running royalty is 5% of TAG/consumer price VAT excluded; hologram sticker physical cost is 3 KRW per sticker VAT excluded and is settled separately from royalty.
- 2026-07-10 Chiikawa / 먼작귀 royalty decision: after price changes, total TAG amount increases from 610,000,000 KRW to 710,000,000 KRW and total royalty increases from 30,500,000 KRW to 35,500,000 KRW; the required amount above the paid MG is 5,500,000 KRW.
- 2026-07-10 Chiikawa / 먼작귀 pricing rationale: price increase is justified by high cost-rate pressure and sales team's view that customer resistance will be low; high cost comes from strict artwork approval and required per-color screen rubber printing instead of DTP.
- 2026-07-10 reporting output: the Chiikawa / 먼작귀 price-change additional-royalty report was prepared as `보고 자료/먼작귀_판매가변경_추가로열티_보고_2026-07-10.md` and `.html`.
- 2026-07-10 To Do decision: `27SS 샘플 작업지시서 투입` is marked fully complete; `멜란지 블루 컬러 코드 요청` deadline moved to 2026-07-10 with ERP code-registration request check added.

## Current Decisions From Teams - 2026-07-13

- 2026-07-13 current Teams rule: use `workspace/memory/current-teams-update-summary-2026-07-13.md` as the current Teams update source for Teams chat and channel backup files updated on 2026-07-13 and clipped as 2026-07-12.
- 2026-07-13 QR/SPOT decision: 26FW QR/SPOT/REORDER work remains managed through `26FW 와키윌리 QR구성(SPOT,Reorder).xlsx`, and active 26FW SPOT additions target September inbound.
- 2026-07-13 26FW SPOT execution decision: washing sweatshirts and back-graphic hood zip-ups are shared as SPOT items tied to 26FW order-amount increase and room needs; the back graphic uses a dropped 26FW hood zip-up asset, and washing items should go through vendor cost bidding including SDPK and daimaeru vendors.
- 2026-07-13 26FW fleece decision: WA2604JK17 check fleece is split by line, with unisex using beige check and womens using charcoal check; womens charcoal check is separated as WA2604JK72 and operated domestically in S/M.
- 2026-07-13 global-order decision: WA2604JK72 existing global L/XL orders from Japan branch and Thailand distributor should be checked by buyer and converted into updated S/M change quantities; no separate additional-order collection is needed.
- 2026-07-13 spec decision: WA2504PT01 follows the same spec as WA2603PT02.
- 2026-07-13 development ownership decision: the Daimaeru TF is temporarily suspended, Daimaeru weekly/Jisan ownership changed, and 27SS sample-review sample work should be handed to Yoo Jiwon.
- 2026-07-13 global-price decision: when confirmed domestic prices are marked in `Y열/AC열`, the global team enters Taiwan/Japan prices continuously; urgent items require separate requests. WA2603LT15 GR is treated as 89,000 KRW domestic price pending Taiwan branch confirmation.
- 2026-07-13 Chiikawa / 먼작귀 launch decision: all styles launch online and offline on 2026-08-07; VM applies as FSS highlight and non-FSS one-hanger POP.
- 2026-07-13 offline sales decision: TF FW short-sleeve styles are planned for offline-focused shipment, excluding Musinsa shipment because Musinsa has separate exclusive products; target store scope is about the top 15 stores.
- 2026-07-13 Art Grocery allocation decision: Seongsu FSS receives 25 pcs per size and Hongdae/Myeongdong FSS receive a base 15 pcs per size; Hongdae/Myeongdong open on 2026-07-13 after fixture movement from Seongsu on 2026-07-12 close.
- 2026-07-13 Art Grocery operation decision: 1,000 dedicated shopping bags were completed for direct store inbound, residual fixtures are managed by sales, non-retained fixtures/props are discarded after Seongsu FSS close, and Seongsu exterior wall returns to the existing graphic.
- 2026-07-13 online upload decision: WA2602ST46 and WA2601LT18 are to be registered online on Wednesday after Wednesday morning image receipt.
- 2026-07-13 reorder-content decision: material-change reorder descriptions need correction and re-upload for WA2602ST38, WA2602ST39, WA2602ST47, WA2602ST48, and WA2602ST49.

## Teams Chat Context: February-March 2026

- 2026-02-24: Kim Yeonhee planned an SS new-product market survey and collaboration-idea check on Thursday afternoon.
- 2026-02-25: Kim Minhyuk asked Kim Yeonhee to review `260223_WA 26 Summer with GESELLE V2` for quantities and styling swaps. Two looks were flagged as concerning.
- 2026-03-03: weekly meeting data was completed; sales-best and sales-trend updates were completed; collaboration marketing meeting was scheduled at 15:00, with a short schedule meeting at 14:30.
- 2026-03-04: monthly closing slides for the February monthly review were requested. `26SS 데님 컨텐츠컷 촬영대상리스트_20260305.xlsx` needed yellow-highlight fields filled with style numbers and quantities.
- 2026-03-05: Q.R detailed schedule/system questions were raised. Immediate 26SS reorder candidates were reviewed first, with extra styles to be decided after another week of sales. Womens reorder simulation file was shared.
- 2026-03-09: after Byeon Changhyun joined the chat, Kim Minhyuk requested 2026FW order-list and item-map updates based on final design CADs. Representative guidance required product MAP inclusion in review reports.
- 2026-03-10: 26FW product maps needed cost rates and manual provisional quantities, including additional proposals. `26SS SPOT 구성.xlsx` was requested for monthly review use.
- 2026-03-13: 26FW sample review by the global team was due by Monday 15:00, with sample removal after 15:00. Access to the Tokyo shared folder was not available to Han Byeonghyun at that point.
- 2026-03-17: womens selection guidance was based on about 70% of counted SKUs under a revised 58B KRW planning basis. A detailed 26FW action-item list was shared covering padding/down, fleece, jackets, womens items, cost strategy, and brand sharpness.
- 2026-03-23: unisex basic short-sleeve and stripe short-sleeve YoY underperformance needed distribution-level diagnosis. Unisex 2-pack and 3-pack T-shirt size inventory needed checking, including whether 25FW inventory could support 26SS reorder. Weekly Q.R target styles for unisex and womens needed sharing.
- 2026-03-24: company-wide guidance emphasized sharper brand/product direction, stronger trend sensitivity, faster AI-standardized work processes, differentiated staff styling, and a possible direct sensitivity-check organization under the CEO. WACKY WILLY specifically lacked trend-forward items that current idols such as NCT DREAM would wear; velour sets and bolder design attempts were cited.
- 2026-03-26: global team shared Japan care-label reference material and asked for 26FW product care-label pre-checks. Kim Minhyuk assigned the planning side of the Disney+ Style Wars collaboration to Byeon Changhyun.
- 2026-03-27: Kim Minhyuk confirmed that 26FW WACKY WILLY care labels should be applied globally like Covernat, covering English, Simplified Chinese, Japanese, and Traditional Chinese. Byeon Changhyun said he would communicate with sourcing. `와키윌리 26년 사업계획 요약_최종.xlsx` was shared.
- 2026-03-31: Kim Minhyuk requested that the finalized 26FW style order list be shared with the global team.
- 2026-04-01: Kim Minhyuk, now addressed as director by Han Byeonghyun, asked the team to check an image-based item/request.
- 2026-04-14: Kim Minhyuk gave positive feedback on a ruffle item.
- 2026-04-16 to 2026-04-30: Kim Minhyuk arranged a Team Wacky lunch, eventually set for Thursday lunch at The Giwa at 11:50.
- 2026-05-28: Kim Minhyuk noted that a womens-team item was performing strongly and praised Kim Yeonhee and Yang Yoonsun.

## Not Decided

- Final 27SS price matrix and SKU-level ordering quantities are not recorded as completed.
- Updated consumer, market, and competitor analysis after April is still pending.
- Final quantities and delivery dates for WA2604JK23, WA2604PT23, and WA2604JK14 are not recorded.
- Chiikawa / 먼작귀 offline store list is not finalized; sales team was asked to respond by Wednesday so VM can work by store interior type.
- The final 26FW IMC shoot/list source is not clear from current data; compare the 7-8월 IMC product list, photo-shoot target list, and VMD/POP target list.
- WA2602ST08 26FW style-number/name issue is not resolved in current data.
- WA2602STA7 was expected to inbound around 2026-07-07, but actual inbound and operating decision are not recorded as completed.
- 26FW additional-order files are not yet verified against each other: `26FW 발주리스트`, `26FW 추가발주 요청서`, and `26FW 발주리스트_260617_목표판매율_v2`.
- For Musinsa Edition, whether there is meaningful exclusivity or whether some products should move to store sales remains operationally sensitive; latest record keeps Musinsa Edition and MFS, but channel restrictions must be checked before cross-channel sale.
- Taiwan direct-shipment missing registration and vendor cancellation agreement status are not recorded as completed.
- Whether planned SPOT styles without sample work or CADs should be added to `26SS SPOT 구성.xlsx` is not recorded as resolved.
- Final drop/keep decisions for several 26FW items from the March 17 action list are not all recorded.
- VM team's March 23 proposal to add a thin windbreaker outer to the main mannequin styling is not recorded as resolved.
- 2026-06 monthly review core metrics are not reliably recorded in the converted Markdown; sales, target, achievement rate, YoY, channel split, and normal/carryover split require source verification.
- 2026-06 weekly review PDFs need source-table verification before using detailed weekly sales, category, or SKU figures because direct text extraction is partial.
- Actual Art Grocery / T-shirt Festival sales and residual stock are not recorded yet; Seongsu popup begins on 2026-07-09.
- Final post-popup residual-stock volume is scenario-dependent; Target scenario currently estimates about 15,800 pcs remaining before season-off.
- July VMD and event execution status is not complete yet for planned actions from 2026-07-09 through 2026-08-04.
- Actual receipt of STM1, STM2, and STM7 samples on 2026-07-07 is not recorded as completed.
- 26FW QC-stage change cost impact has not yet been fully reflected in renegotiated costs; 20 cost-increase items require follow-up.
- Delivery resolution is not recorded for WA2604JK15, WA2604JK71, WA2603JK65, WA2603HZ14, WA2603KT65, WA2603CD51, and WA2603CD61.
- Art Grocery Seongsu setup time is still operationally pending in the latest backup; 2026-07-09 06:00 setup was proposed and needs final site confirmation.
- Taiwan order-list dates need clarification on whether they are ETD or ETA basis.
- Actual receipt of STM1, STM2, and STM7 samples remains unconfirmed in the 2026-07-08-updated Teams backup.
- Art Grocery final setup/security handling and direct receipt of the 1,000 shopping bags are not recorded as completed.
- WA2602STA7 actual inbound and operating use are not recorded as completed.
- WA2602ST51/ST52 full early-inbound candidate list and final confirmed inbound date are not fully readable from the text backup because key details are in attachments.
- 26FW global price urgent-request criteria and owner flow are not fully closed.
- 27SS sourcing sample-fee/marker-fee responsibility and actual participating vendors are not finalized.

## Next Actions

- By 2026-06-30: complete the 27SS price matrix.
- Confirm Chiikawa / 먼작귀 offline store list by Wednesday and hand it to VM so store-type-specific display work can start.
- Build a Taiwan/Japan price table for CRT1, STT1, STT2, and WA2603STW5, including sale target status, price, and `NA` handling.
- Check the 26FW IMC source of truth: 7-8월 IMC product list vs photo-shoot list vs VMD/POP list.
- Clarify WA2603ST17, WA2602ST08, and WA2602STA7 by style number, inbound date, channel, and next owner.
- Cross-check `26FW 발주리스트`, `26FW 추가발주 요청서`, and `26FW 발주리스트_260617_목표판매율_v2` for style, quantity, and amount mismatches.
- Update consumer, market, and competitor analysis after April.
- Confirm quantities and delivery dates for WA2604JK23, WA2604PT23, and WA2604JK14, then update the order list.
- Issue tech packs for HZ01, CR01, HD01, HZ04, and fleece sweatshirts.
- Track WA2603ST53 delivery for 2026-07-14 and ship immediately after inbound.
- For future EXCLUSIVE and direct-shipment exceptions, notify the global team before domestic import.
- Register 3,067 missing Taiwan direct-shipment units.
- Ask vendors to accept cancellation for WA2602ST06YE and ST73RD.
- By 2026-07-14: finish IMC shoot preparation.
- Share the Chiikawa SNS schedule after Musinsa offline stores are confirmed.
- When registering Q.R products in ERP, enter `Q.R` in remarks.
- Maintain `26SS SPOT 구성.xlsx` as the monthly-review source for category-unit SPOT additions.
- Diagnose YoY weakness for unisex basic and stripe short-sleeve T-shirts by channel/distribution.
- Check unisex 2-pack and 3-pack T-shirt size inventory and determine whether 25FW inventory can support 26SS reorder.
- Share weekly Q.R target styles for unisex and womens.
- Apply 26FW global care-label language requirements through sourcing: English, Simplified Chinese, Japanese, and Traditional Chinese.
- Share the finalized 26FW style order list with the global team.
- Follow the March 17 26FW action list: redesign 119,000 KRW lightweight padding/basic padding direction, decide 0.1 new-basic discount vs renewal, simplify/drop mid-length down, set fleece hoodie IMC volume target, split denim jacket blue/gray style numbers, align wool coat details with womens, and review cost rates in specification meetings.
- Verify the 2026-06 weekly review PDFs against source tables before using detailed weekly sales, category, or SKU figures in decision reports.
- Finalize Art Grocery / T-shirt Festival inventory movement using the Seongsu 50%, Hongdae 30%, and Myeongdong 20% allocation guide.
- Track the 2026-07-09 to 2026-07-12 Seongsu popup daily sales against Base, Target, and Stretch scenarios.
- After the Seongsu popup, update the 2026-07-13 through end-August FSS POP rollout plan and residual stock transfer plan.
- Use the hot-summer campaign result as evidence for repeating or scaling seasonal graphic T-shirt campaigns.
- Communicate the 2026-08-07 Chiikawa / 먼작귀 all-channel launch date consistently across marketing, online, sales, and VM.
- For Musinsa Edition, confirm channel exclusivity, discount rate, final product list, and whether any non-MFS/offline sale is allowed before 2026-07-20 launch.
- Check actual receipt of STM1, STM2, and STM7 samples on 2026-07-07 and update content/fit-guide feasibility.
- Share any future 26FW QC-or-later changes in `[110] 메인 스펙 변경 알림` using the required fields.
- Immediately confirm delivery impact and recovery plan for WA2604JK15, WA2604JK71, WA2603JK65, WA2603HZ14, WA2603KT65, WA2603CD51, and WA2603CD61.
- Track 26SS July week 1 emergency inventory: SO01, SO31, SO11, HZ01, STE3, and PT01; watch ST38/ST48/ST49/ST47 after new inbound rebound.
- Check WOMENS SH stock because cumulative sell-through reached 85.7% and sellout is near.
- Confirm Art Grocery Seongsu 2026-07-09 06:00 setup, closing/security handling, and direct delivery of the 1,000 shopping bags.
- Correct and re-upload online product descriptions for material-change reorder styles WA2602ST38, WA2602ST39, WA2602ST47, WA2602ST48, and WA2602ST49.
- Register WA2602ST46 and WA2601LT18 online after Wednesday image receipt.
- Confirm Taiwan order-list date basis as ETD or ETA, then update the list.
- Proceed with WA2602KT64 M 150 pcs and coordinate warehouse-to-sales-planning transfer at 2026-08-04 inbound.
- Confirm STM1, STM2, and STM7 actual receipt and update Musinsa Edition content/fit-guide feasibility before the 2026-07-20 launch.
- Execute Art Grocery 2026-07-09 setup, 2026-07-12 fixture move, 2026-07-13 Hongdae/Myeongdong opening, Seongsu exterior-wall restoration, and shopping-bag receipt checks.
- Confirm WA2602STA7 actual inbound and operating use.
- Mark 26FW domestic confirmed-price items with `Y` or `AC` in `와키윌리_26FW 원가,판매가 확정.xlsx`, and separately request urgent Taiwan/Japan price entries.
- Confirm whether Taiwan order-list dates are ETD or ETA, then update the list.
- Confirm WA2602KT64 DN/LG total 900 pcs reorder opinion.
- Confirm final early-inbound dates and required quantities for WA2602ST51, WA2602ST52, and related BEST products.
- Ask sourcing whether WA2602CD52 and WA2602ST72 delivery can be shortened by one week.
- Immediately confirm 26FW inner-basic fabric to reduce accumulated color-addition delay.
- Request 27SS sourcing samples before the weekly sample meeting and run bidding with at least two vendors where possible.
