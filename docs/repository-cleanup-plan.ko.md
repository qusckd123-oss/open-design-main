# Repository Cleanup Plan

작성일: 2026-09-08

## 목표

`open-design-main-1` 루트에 섞여 있는 코드, 업무 원본, 보고 산출물, 임시 파일을 분리한다. 개발 레포 경계는 유지하고, 업무 파일은 찾기 쉬운 규칙으로 재배치한다.

## 현재 진단

- 개발 레포 핵심 영역: `apps/`, `packages/`, `tools/`, `e2e/`, `docs/`, `specs/`, `scripts/`, `skills/`, `design-systems/`, `assets/`, `templates/`.
- 업무/산출물 주요 영역: `추가 데이터/`, `output/`, `보고 자료/`, `와키윌리 발주리스트/`, `와키윌리 영업 데이터/`, `와키윌리 IMC/`, `teams 채널 데이터/`, `teams 채팅 데이터/`, `회의 녹음본/`, `원가데이터/`.
- 루트 임시 파일: `.tmp_product_template_copy.xlsx`, `.tmp_updated_po.xlsx`, `.tmp_verify.xlsx`.
- 루트 임시 폴더: `tmp/`, `_tmp_full_recheck_sheets/`, `_tmp_full_recheck_sheets_final/`, `_tmp_pdf_pages/`.
- `추가 데이터/`, `output/`, `보고 자료/`는 이미 git 추적 파일이 많으므로 대량 이동은 `git mv` 기준으로 별도 커밋 처리해야 한다.

## 보존 영역

아래는 개발 레포 구조이므로 이동하지 않는다.

```text
apps/
packages/
tools/
e2e/
docs/
specs/
scripts/
skills/
design-systems/
assets/
templates/
```

아래 루트 파일도 그대로 둔다.

```text
AGENTS.md
README.md
README.ko.md
README.zh-CN.md
QUICKSTART.md
CONTRIBUTING.md
CONTRIBUTING.zh-CN.md
LICENSE
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
```

## 추천 최종 구조

```text
work/
  00_inbox/
  10_source-data/
    sales/
    product-planning/
    teams/
    cost/
    orders/
    recordings/
  20_projects/
    2026-09-07_global-po-registration/
    2026-09-07_squad-tf-meeting/
    2026-08_27ss-product-planning/
  30_reports/
    html/
    pdf/
    pptx/
    teams-copy/
  90_archive/

output/
  2026-09-07_global-po-registration/
    input/
    work/
    final/
    preview/
```

## 이동 후보

| 현재 위치 | 추천 위치 | 처리 |
| --- | --- | --- |
| `추가 데이터/판매 데이터/` | `work/10_source-data/sales/` | `git mv` |
| `추가 데이터/카테고리 분석/` | `work/20_projects/category-analysis/` | `git mv` |
| `추가 데이터/래퍼런스/` | `work/10_source-data/product-planning/references/` | `git mv` |
| `추가 데이터/작업물/` | `work/20_projects/` | 하위 프로젝트별 분류 후 `git mv` |
| `보고 자료/` | `work/30_reports/` | 하위 포맷별 분류 후 `git mv` |
| `와키윌리 발주리스트/` | `work/10_source-data/orders/wacky-willy/` | `git mv` |
| `와키윌리 영업 데이터/` | `work/10_source-data/sales/wacky-willy/` | `git mv` |
| `teams 채널 데이터/` | `work/10_source-data/teams/channels/` | `git mv` |
| `teams 채팅 데이터/` | `work/10_source-data/teams/chats/` | `git mv` |
| `회의 녹음본/` | `work/10_source-data/recordings/` | `git mv` |
| `원가데이터/` | `work/10_source-data/cost/` | `git mv` |
| `output/*` | `output/YYYY-MM-DD_project-name/{input,work,final,preview}/` | 프로젝트별 재분류 |
| `.tmp_*`, `_tmp*`, `tmp/` | `.tmp/cleanup-YYYY-MM-DD/` 또는 삭제 | git 제외 |

## 파일명 규칙

앞으로 새로 만드는 업무 파일은 아래 접미사를 사용한다.

```text
{프로젝트명}__source_YYMMDD.ext
{프로젝트명}__work_YYMMDD_HHMM.ext
{프로젝트명}__backup-before-{작업명}_YYMMDD_HHMM.ext
{프로젝트명}__final_YYMMDD.ext
```

## 실행 순서

1. 루트 임시 파일을 `.tmp/cleanup-2026-09-08/`로 이동한다.
2. `work/` 기본 폴더를 만든다.
3. git 추적 중인 대형 업무 폴더는 한 번에 하나씩 `git mv`로 이동한다.
4. 이동 직후 `git status --short`로 rename이 정상 감지되는지 확인한다.
5. 개발 검증이 필요한 변경이 아니므로 대량 이동 커밋은 코드 변경과 분리한다.

## 주의

- `apps/nextjs`와 `packages/shared`는 복원하지 않는다.
- `output/` 전체를 ignore하지 않는다. 일부 보고 산출물은 현재 git 추적 대상이다.
- 대용량 원본 Excel, PDF, 녹음 파일은 앞으로 원칙적으로 git에 추가하지 않는 방향이 좋다.

## 1차 적용 현황

2026-09-08에 아래 작업을 적용했다.

- 루트 임시 Excel 3개를 `.tmp/cleanup-2026-09-08/`로 이동했다.
- `work/README.md`를 추가해 업무 자료 폴더 사용 규칙을 만들었다.
- `output/27ss_global_po_registration_260907/` 파일을 `output/2026-09-07_global-po-registration/final/`로 이동했다.
- 최근 untracked 업무 파일을 아래 프로젝트 폴더로 분류했다.

```text
work/20_projects/2026-09-07_global-po-registration/
work/20_projects/2026-09-07_squad-tf-meeting/
work/20_projects/2026-09-08_26fw-delivery-rate/
```

아래 파일 2개는 Excel 또는 OneDrive 프로세스가 잡고 있어 이동하지 못했다. 파일을 닫은 뒤 다시 이동한다.

```text
추가 데이터/글로벌 상품 정보 등록용.xlsx
추가 데이터/상품엑셀파일양식_260907_차수별등록시트.xlsx
```

2026-09-09에 원본 2개 삭제가 완료되었다. 새 위치의 복사본은 아래에 남아 있다.

```text
work/20_projects/2026-09-07_global-po-registration/input/글로벌 상품 정보 등록용.xlsx
work/20_projects/2026-09-07_global-po-registration/final/상품엑셀파일양식_260907_차수별등록시트.xlsx
```

## 2차 적용 현황

2026-09-09에 아래 작업을 추가 적용했다.

- 루트 업무 원본 폴더를 `work/10_source-data/`로 이동했다.

```text
원가데이터/ -> work/10_source-data/cost/raw/
와키윌리 발주리스트/ -> work/10_source-data/orders/wacky-willy/
와키윌리 영업 데이터/ -> work/10_source-data/sales/wacky-willy/focus-store/
회의 녹음본/ -> work/10_source-data/recordings/meetings/
teams 채팅 데이터/ -> work/10_source-data/teams/chats/
```

- 루트 업무 프로젝트/자료 폴더를 `work/20_projects/`, `work/30_reports/`, `work/90_archive/`, `work/00_inbox/`로 이동했다.

```text
보고 자료/ -> work/30_reports/archive/
ST01, 02 개발/ -> work/20_projects/st01-02-development/
와키윌리 IMC/ -> work/20_projects/wacky-willy-imc/
fashion-concept-board-26fw/ -> work/20_projects/26fw-fashion-concept-board/
Clippings/ -> work/10_source-data/clippings/
third_button_symbol_study/ -> work/20_projects/third-button-symbol-study/
third_button_note002/ -> work/20_projects/third-button-note002/
converted-md/ -> work/90_archive/converted-md/
TO DO LIST/ -> work/00_inbox/to-do-list/
티셔츠 페스티벌 팝업 7.9~7.12/ -> work/20_projects/tshirt-festival-popup-2026-07-09_0712/
story/ -> work/20_projects/story/
calendar/ -> work/00_inbox/calendar/
```

- 루트 단발 업무 파일을 `work/` 아래로 이동했다.

```text
260626_와키윌리 아트 그로서리 팝업스토어_최종.pdf -> work/30_reports/archive/art-grocery-popup/
KPI_5과제_초안.txt -> work/20_projects/2026-kpi/
변창현_2026_KPI_보완안.txt -> work/20_projects/2026-kpi/
주간 리뷰 COPY본 예시.md -> work/30_reports/teams-copy/
무제.md -> work/00_inbox/misc/
```

- 루트 임시/검증 폴더를 archive로 이동했다.

```text
_tmp_full_recheck_sheets/ -> work/90_archive/generated-checks/_tmp_full_recheck_sheets/
_tmp_full_recheck_sheets_final/ -> work/90_archive/generated-checks/_tmp_full_recheck_sheets_final/
_tmp_pdf_pages/ -> work/90_archive/generated-checks/_tmp_pdf_pages/
tmp/ -> work/90_archive/generated-checks/tmp/
```

- `추가 데이터/`의 일반 자료는 `work/00_inbox/additional-data/`로 이동했다.
- `workspace/`는 `work/90_archive/workspace/`로 이동했다.

의도적으로 현재 위치에 유지하는 작업 공간:

```text
추가 데이터/wacky-product-planning-dashboard/
```

이 폴더는 현재 작업 중인 데이터와 미커밋 변경사항을 포함한 별도 git repository다. Windows `ReparsePoint`이기도 하므로 이번 정리 범위에서 제외하고, 이동·삭제·내용 변경 없이 현재 위치에 유지한다.
