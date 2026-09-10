---
name: product-sales-point-extractor
description: Create or extract Korean product sales points from Wacky Willy/Open Design 상품설명서 Excel workbooks. Use when the user provides 상품설명서 .xlsx files with IMAGE thumbnails plus 디자인실 and 소싱팀 colored input areas and asks to write, fill, extract, analyze, or convert 세일즈 포인트 - 한줄 평 and 세일즈 포인트 - 디테일 3줄.
---

# Product Sales Point Extractor

Use this skill for product-description Excel files where team-provided product facts and product images must become customer-facing sales points.

## Core Workbook Pattern

The reference workbook is `references/26ss-product-description-template.md`, converted from `추가 데이터/◎26SS 상품설명서 참고자료.xlsx`.

In the master sheet, identify the header row containing these columns:

- Visual input: `IMAGE`.
- Output: `세일즈 포인트 - 한줄 평`, `세일즈 포인트 - 디테일 3줄`.
- Design team inputs: `핏`, `디자인 설명`.
- Sourcing team inputs: `원단 정보`, `기모여부`, `세탁 정보`, `세탁코드`, `제조국`, `비고 (주의사항) /세탁주의사항`.
- Product context: `STYLE NUMBER`, `ITEM NAME`, `컬러명`, `컬러`, `발주수량`, `판매가격`, `사이즈`.

The 26SS reference uses:

- `M`: product image thumbnail.
- `U`: one-line sales point.
- `V`: three-line detailed sales point.
- `W:Y`: 디자인실 colored area, with `W` usually a size-spec hyperlink, `X` fit, and `Y` design description.
- `Z:AE`: 소싱팀 colored area, covering fabric, brushed status, wash information, wash code, country, and notes.

## Image Review Rule

Treat `IMAGE` as required design context, not decoration. Review it before drafting sales points whenever the image is available.

Use the image to confirm visible design points such as:

- raglan sleeves, contrast sleeves, contrast collars, contrast rib, and color-blocking,
- graphic placement, logo shape, artwork scale, and front/back print balance,
- embroidery, appliques, patches, labels, buttons, pockets, stitching, panel lines, trims, and hem details,
- stripe, check, camo, all-over pattern, wash tone, and obvious texture.

Reflect visible image-only design points in `세일즈 포인트 - 한줄 평` and especially the `디테일` line. For example, if the text says only “래글런” but the image clearly shows contrast raglan sleeves, write “배색 래글런 소매” as a selling point.

Do not infer non-visible or technical facts from images. Never guess fabric composition, functional performance, exact processing, country of origin, or wash method from the image alone.

## Extraction Workflow

Run the bundled script to extract the rows before drafting or filling:

```bash
python C:\Users\bcave\.codex\skills\product-sales-point-extractor\scripts\extract_product_sales_inputs.py "path\to\상품설명서.xlsx" --output extracted.md
```

Useful options:

- `--format md|csv|json`: choose output format.
- `--only-missing`: return only rows where either sales-point output is blank.

If the user asks to convert a workbook to Markdown, create a readable Markdown file with:

- workbook/sheet summary,
- writing-method sheet content if present,
- master sheet column map,
- row-level product context, existing sales points, design/sourcing inputs, and image notes.

When images are embedded in Excel, extract or visually inspect them if the task depends on design details. If automated extraction is unavailable, ask the user for a screenshot or use the visible screenshot they provide.

## Writing Rules

Write in Korean for MD/online product copy. Keep the tone concise, sales-ready, and grounded in the team inputs plus visible image evidence.

For `세일즈 포인트 - 한줄 평`:

- Write one sentence or a slash-separated short line.
- Combine the most saleable material, fit, and design hook.
- Include image-confirmed visual hooks when they are meaningful, such as 배색 래글런 소매 or 전면 오벌 로고.
- Mention customer benefit, not only construction facts.
- Avoid overclaiming if the source only states factual specs.

For `세일즈 포인트 - 디테일 3줄`:

- Produce exactly three compact lines or three bullet-like clauses.
- Cover `소재`, `핏`, and `디테일` when possible.
- Use sourcing information for fabric, care, brushed status, country, and caution notes.
- Use design information and the image for silhouette, graphics, labels, buttons, trims, stitching, color blocking, sleeve contrast, series links, and IP motifs.

Preferred detail format:

```text
소재: ...
핏: ...
디테일: ...
```

Use source fields in this priority:

1. `원단 정보`, `기모여부`, and material words from `디자인 설명` for `소재`.
2. `핏`, fit phrases from `디자인 설명`, and visible silhouette from `IMAGE` for `핏`.
3. Graphics, embroidery, trims, buttons, labels, pockets, stitching, color blocking, contrast sleeves, wash/care cautions, and series linkage for `디테일`.

## Example

Input:

- `ITEM NAME`: 오벌 로고 래글런 롱슬리브
- `핏`: 세미오버핏
- `디자인 설명`: 16수 싱글 원단, 나염 로고, 와키윌리 타이포/아트웍 컬러 매칭
- `원단 정보`: 면 100%
- `IMAGE`: contrast raglan sleeves with oval front logo

Output:

- `세일즈 포인트 - 한줄 평`: 배색 래글런 소매와 오벌 로고 그래픽이 포인트인 면 100% 세미오버핏 롱슬리브.
- `세일즈 포인트 - 디테일 3줄`:
  - 소재: 면 100% 16수 싱글 원단으로 편안한 착용감 제공
  - 핏: 세미오버핏과 래글런 소매 구조로 여유로운 실루엣 연출
  - 디테일: 배색 소매, 오벌 로고 나염, 와키윌리 타이포/아트웍 컬러 매칭 포인트

## Quality Checks

Before returning results:

- Confirm each product row has one one-line point and exactly three detail lines.
- Check `IMAGE` for visible design hooks that the text may omit.
- Preserve factual constraints such as 기모여부, 세탁주의사항, and 소재 composition.
- Do not invent fabric composition, special processing, collaboration/IP names, or functional claims.
- If several color rows share the same style and inputs, reuse the same sales points unless the color, image, or note changes the selling point.
