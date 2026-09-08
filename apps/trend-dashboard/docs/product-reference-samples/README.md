# Multi-Brand Product Reference Sample Manifests

Persisted 30-product-URL samples for the 2026-09-08 multi-brand portability
pass documented in `docs/PRODUCT_REFERENCE_MULTIBRAND_AUDIT.md`. Each
`.jsonl` file is one JSON object per line: `brand`, `sourceDomain`,
`canonicalUrl`, `productId`, `sampledAt`, `productName`. No product
description/body text is stored here (reproducibility only, not archival
content storage) - re-fetch each `canonicalUrl` to get current description
text.

## Reproducibility record

- **Extractor version**: commit `f43d432` (`feat: expand product reference
  taxonomy coverage`) for the BEFORE/baseline measurement in
  `docs/PRODUCT_REFERENCE_MULTIBRAND_AUDIT.md`; this pass's own commit (see
  that doc's Validation section) for the AFTER/Round-2 measurement.
- **Sample timestamp**: 2026-09-08T11:00:00+09:00 (all four brands fetched
  within the same session, sequentially, with a 0.6s delay between requests
  per brand, matching this project's established crawl-courtesy convention).
- **Sampling method**: deterministic, evenly-spaced across each brand's full
  current product-URL catalog (as listed in that brand's own public sitemap
  at fetch time), avoiding both cherry-picking and consecutive-SKU bias:
  for a catalog of size `K`, position `i` (`i = 0..29`) is
  `round(1 + i * (K - 1) / 29)`, guaranteeing the first and last catalog
  entries are always included and the remaining 28 span the full range
  evenly. This is a generalization of the position-formula method used for
  the Covernat sample in the prior pass (`1, 20, 40, ..., 580`), adapted to
  work for any catalog size `K` rather than only one sized for a fixed step
  of 20.
- **Per-brand catalog size at fetch time**: KIRSH 1,641 product URLs (across
  `sitemap0.xml.gz` + `sitemap1.xml.gz`); MMLG 1,179 (`sitemap.xml`, flat);
  The North Face Korea 3,431 (`sitemap/NF-sitemap-products.xml`); POST
  ARCHIVE FACTION 93 (`/ko/sitemap_products_1.xml`, the Korean-locale
  shard - the brand's default/global sitemap serves English/Japanese-priced
  copy and was not used for sampling).

## Files

| File | Brand | Domain | Category |
|---|---|---|---|
| `kirsh-30.jsonl` | KIRSH (키르시) | kirsh.co.kr | Street/casual |
| `mmlg-30.jsonl` | MMLG | mmlg.co.kr | Contemporary |
| `tnf-korea-30.jsonl` | The North Face Korea | thenorthfacekorea.co.kr | Sports/outdoor-inspired |
| `paf-30.jsonl` | POST ARCHIVE FACTION (PAF) | postarchivefaction.com | Designer/youth |

None of these four brands is B:CAVE-operated, and none shares ownership with
Covernat or with each other. See `docs/PRODUCT_REFERENCE_MULTIBRAND_AUDIT.md`
Section 3 for the full candidate-discovery table (10 domains examined, 4
selected) and access/robots verification for each.
