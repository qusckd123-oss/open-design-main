import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { VisualDiffusionReferenceStrip } from "@/components/VisualDiffusionReferences";
import { visualDiffusionReferencesForItem } from "@/config/visual-diffusion-references";
import { attributeBarWidthPercent } from "@/lib/attribute-visual";
import { editorialRecentDirection } from "@/lib/editorial-momentum";
import { selectEditorialVisualContext } from "@/lib/editorial-visual-context";
import { attributeKoreanLabel, attributeTypeKoreanLabel } from "@/lib/korean-labels";
import { buildSignalInterpretation, type SignalInterpretation } from "@/lib/signal-interpretation";
import { sourceLabel } from "@/lib/market-ui";
import { bundleEvidenceStrength, type AttributeBundle, type BundleAttribute, type BundleEvidenceArticle } from "@/services/attribute-bundle-service";

/**
 * FASHION EDITORIAL INTELLIGENCE surface for attribute bundles: whitespace,
 * typography, and thin dividers carry the hierarchy instead of bordered
 * boxes. Every element is still backed by a direct attribute relation -
 * only the presentation changed in this pass, never the underlying claim.
 */

/**
 * The only evidence article allowed to back a bundle hero is one whose image
 * is DIRECT_BLOCK/ADJACENT_BLOCK to the attribute's own evidence text
 * (evidenceImageUrl set) - never one that only has an ARTICLE_HERO image.
 * See src/collectors/editorial/image-relation.ts for why this is currently
 * null for every REAL bundle (no source stores block-level image position
 * yet), which is the correct, honest state - not a bug to work around here.
 */
function findHeroArticle(bundle: AttributeBundle): BundleEvidenceArticle | null {
  return bundle.evidenceArticles.find((article) => article.evidenceImageUrl) ?? null;
}

const HERO_CAPTION: Record<string, string> = {
  DIRECT_BLOCK: "본문 동일 문단 이미지",
  ADJACENT_BLOCK: "본문 인접 문단 이미지"
};

/** Renders a document-position-confident image with an honest caption. Never called with an article-hero-only image. */
function BundleHeroImage({ heroArticle, alt, size }: { heroArticle: BundleEvidenceArticle; alt: string; size: "md" | "lg" }) {
  const caption = HERO_CAPTION[heroArticle.imageRelation] ?? "본문 근접 이미지";
  return (
    <div className="flex flex-col items-center gap-1">
      <ProductImage src={heroArticle.evidenceImageUrl} alt={alt} size={size} />
      <span className="text-[10px] text-muted" title="아이템 자체의 사진이 아니라, 이 속성이 언급된 문단과 문서상 가까운 이미지입니다.">
        {caption}
      </span>
    </div>
  );
}

/**
 * Article heroes are visual context for the cited articles only. They never
 * enter BundleHeroImage, never prove an attribute/mood, and never affect
 * ranking.
 *
 * Presentation is now smaller/muted-toned by default (text-muted, not the
 * text-signal accent FACT/UNKNOWN use) so it reads as a supporting, lower-
 * trust-tier lane rather than a bundle hero. `limit` defaults to 6
 * (unchanged from before the 2026-09-14 P1-2 "Visual Evidence Hierarchy"
 * pass) - this component's own default behavior is deliberately untouched
 * so a future consumer never silently gets fewer images than before.
 * `SelectedSignalDetail` explicitly passes `limit={3}` for its own
 * restrained, after-interpretation placement; that is a caller-site choice,
 * not a change to this shared component's default. The persistent
 * disclaimer stays VISIBLE TEXT, never a title-only/hover-only tooltip.
 */
export function EditorialVisualContextStrip({ articles, limit = 6 }: { articles: BundleEvidenceArticle[]; limit?: number }) {
  const visuals = selectEditorialVisualContext(articles, limit);

  if (visuals.length === 0) {
    return (
      <section aria-labelledby="editorial-visual-context-title" className="mt-6 border-t border-line pt-4">
        <p id="editorial-visual-context-title" className="text-xs font-semibold text-muted">기사 비주얼 맥락</p>
        <p className="mt-1 text-sm text-muted">현재 연결된 기사 대표 이미지가 없습니다.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="editorial-visual-context-title" data-testid="editorial-visual-context" className="mt-6 min-w-0 border-t border-line pt-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <p id="editorial-visual-context-title" className="text-xs font-semibold text-muted">기사 비주얼 맥락</p>
        <p className="max-w-sm text-[11px] leading-relaxed text-muted">
          기사 대표 이미지 · 아이템/속성/무드를 직접 증명하지 않음
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-3">
        {visuals.map((article, index) => {
          const publishedAt = article.publishedAt?.toISOString().slice(0, 10) ?? "날짜 미상";
          const publisher = sourceLabel(article.source);
          return (
            <a
              key={`${article.imageUrl}:${article.url}`}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group w-20 shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal sm:w-24"
              aria-label={`${publisher} 기사 열기: ${article.title || "제목 없음"}`}
            >
              <div className="aspect-square overflow-hidden rounded bg-slate-200">
                {/* Article-level visual context only; never a bundle hero or direct-relation image. Small, muted, secondary treatment - see the doc comment above. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.imageUrl ?? undefined}
                  alt={`기사 비주얼 맥락: ${article.title || publisher}`}
                  className="h-full w-full object-cover grayscale-[15%] transition duration-300 group-hover:grayscale-0"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </div>
              <div className="mt-1 text-[10px] leading-tight text-muted">
                <span className="font-semibold text-ink">{publisher}</span> · <span className="tabular-nums">{publishedAt}</span>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Small editorial subtitle line under a Korean composed name - the raw
 * taxonomy values in English uppercase (e.g. "RECYCLED FABRIC / TOTE BAG"),
 * a magazine-style descriptor line under the Korean headline. Never a
 * separate translation - literally the same values already shown as chips
 * elsewhere on the page.
 */
function englishSubtitle(bundle: AttributeBundle): string {
  const attributeText = bundle.directAttributes.map((attribute) => attribute.value.replaceAll("_", " ")).join(" · ");
  const itemText = bundle.specificItem.replaceAll("_", " ");
  return attributeText ? `${attributeText} / ${itemText}` : itemText;
}

/**
 * Three dots = distinct outlets, not a score. One outlet can never look like
 * broad coverage no matter how many articles it published. Teal is used here
 * deliberately as the "signal indicator" - one of the few sanctioned uses of
 * the accent color in this pass's reduced palette.
 */
export function EvidenceDots({ sourceSpread, articlePresence, label }: { sourceSpread: number; articlePresence: number; label: string }) {
  const filled = Math.min(3, Math.max(sourceSpread, articlePresence >= 2 ? 1 : 0));
  return (
    <div className="flex items-center gap-2" title={`${articlePresence}개 기사 · ${sourceSpread}개 매체`}>
      <span aria-hidden className="tracking-[0.15em] text-signal">
        {"●".repeat(filled)}
        <span className="text-line">{"○".repeat(3 - filled)}</span>
      </span>
      <span className="text-sm font-semibold text-ink">{label}</span>
    </div>
  );
}

export function AttributeChip({ attribute }: { attribute: BundleAttribute }) {
  return (
    <span className="rounded-full border border-line bg-canvas px-2.5 py-1 text-xs font-medium text-ink">
      {attributeKoreanLabel(attribute.value)}
      <span className="ml-1 text-[10px] text-muted">{attributeTypeKoreanLabel(attribute.type)}</span>
    </span>
  );
}

/**
 * WATCHLIST COMPACT ROW (2026-09-14, replaces the old SecondaryBundleCard /
 * SpecificComboCard) - one row in the home "상품기획 워치리스트" list. Pure
 * content, no click handling: selection lives in the client-side Watchlist
 * shell (src/components/Watchlist.tsx), which wraps this in a button. Only
 * the fields the approved P1 Watchlist proposal specifies for a compact row:
 * position, Korean composed name, 관측 강도 (existing dots/label, unchanged
 * computation), a compact article/source count line, 최신 관측, up to two
 * existing attribute chips, and AT MOST ONE small ARTICLE_HERO thumbnail.
 *
 * The thumbnail's disclaimer is a PERSISTENT VISIBLE caption ("기사 이미지"),
 * never a title-only/hover-only explanation - mobile has no dependable hover
 * state, so a tooltip alone would silently lose the disclaimer there. The
 * fuller canonical disclaimer sentence still rides along as a `title`
 * attribute as a bonus for pointer users, never as the sole mechanism.
 *
 * Deliberately excludes FACT / UNKNOWN / PLANNING QUESTION, 최근 방향 (always
 * "판단 불가" at this exact-bundle grain - stated once at the Watchlist
 * section level in src/app/page.tsx instead of once per row), the English
 * taxonomy subtitle, and any invented "why it matters" copy - all of that
 * stays exclusive to SelectedSignalDetail below.
 */
export function WatchlistRow({ bundle, position }: { bundle: AttributeBundle; position: number }) {
  const strength = bundleEvidenceStrength({ articlePresence: bundle.bundleArticlePresence, sourceSpread: bundle.bundleSourceSpread, independentEvidenceClusterCount: bundle.independentEvidenceClusterCount });
  const [thumbnail] = selectEditorialVisualContext(bundle.evidenceArticles, 1);
  const latest = bundle.latestObservedAt?.toISOString().slice(0, 10) ?? "확인 불가";
  // Reuses the SAME Korean-first name SelectedSignalDetail already shows
  // (buildSignalInterpretation's composeLeadSignalName fallback) instead of
  // the raw bundle.displayName, so a row and its own open detail never show
  // two different names for the same bundle (e.g. "스트라이프 SHIRT" next to
  // "스트라이프 셔츠"). Deliberately NOT a change to the shared
  // specificItemKoreanLabel dictionary or to bundle.displayName itself - both
  // stay exactly as they were for every other consumer (AttributeBundleCard,
  // BundleHighlight, /items, item detail pages).
  const { signalName } = buildSignalInterpretation(bundle);

  return (
    <div className="flex items-start gap-3">
      <span className="w-6 shrink-0 pt-0.5 text-xs font-semibold tabular-nums text-muted" aria-hidden>
        {String(position).padStart(2, "0")}
      </span>

      {thumbnail ? (
        <div className="flex shrink-0 flex-col items-center gap-1">
          {/* Article-level visual context only, never a bundle hero or direct-relation image - same rule as EditorialVisualContextStrip. Persistent visible label, not a hover-only tooltip. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnail.imageUrl ?? undefined}
            alt="기사 대표 이미지"
            className="h-11 w-11 rounded object-cover"
            loading="lazy"
            title="기사 대표 이미지 · 아이템/속성/무드를 직접 증명하지 않음"
          />
          <span className="text-[9px] font-semibold leading-none text-muted">기사 이미지</span>
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="text-base font-semibold leading-snug text-ink">{signalName}</div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {bundle.directAttributes.slice(0, 2).map((attribute) => (
            <AttributeChip key={`${attribute.type}:${attribute.value}`} attribute={attribute} />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <EvidenceDots sourceSpread={bundle.bundleSourceSpread} articlePresence={bundle.bundleArticlePresence} label={strength} />
          <span>{bundle.bundleArticlePresence}개 기사 · {bundle.bundleSourceSpread}개 매체</span>
          <span>최신 {latest}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * SELECTED SIGNAL DETAIL (2026-09-14, renamed from CurrentSignalHero;
 * reordered 2026-09-14 P1-2 "Visual Evidence Hierarchy" pass) - the open
 * detail for whichever Watchlist row is currently selected (desktop: a
 * right-hand pane beside the row list; mobile: an inline accordion panel
 * directly beneath the selected row).
 *
 * Content order now deliberately reads WHAT IS THE SIGNAL -> WHAT DO WE
 * KNOW -> WHAT DON'T WE KNOW -> WHAT SHOULD A PLANNER INVESTIGATE -> WHAT
 * VISUAL CONTEXT EXISTS, so interpretation is always encountered before
 * generic article imagery: heading -> (dormant direct/adjacent-relation
 * hero image, a strictly stronger evidence tier than article context, kept
 * near the heading rather than folded into the de-prioritized strip below)
 * -> 관측강도/최근방향/최신관측 -> FACT/UNKNOWN/PLANNING QUESTION ->
 * EditorialVisualContextStrip (now visually restrained - see that
 * component) -> VisualDiffusionReferenceStrip -> 근거 보기. Every field's
 * own content/semantics are unchanged from before this reorder - this is
 * intentionally still the ONLY interpretation system on the page (see
 * AGENT_OPERATING_RULES.md "Do not create a second interpretation system").
 */
export function SelectedSignalDetail({ bundle }: { bundle: AttributeBundle }) {
  const strength = bundleEvidenceStrength({ articlePresence: bundle.bundleArticlePresence, sourceSpread: bundle.bundleSourceSpread, independentEvidenceClusterCount: bundle.independentEvidenceClusterCount });
  const heroArticle = findHeroArticle(bundle);
  const interpretation = buildSignalInterpretation(bundle);
  // Pure, synchronous, in-memory config lookup (no DB/network) - see
  // src/config/visual-diffusion-references.ts. Renders nothing (see
  // VisualDiffusionReferenceStrip) until a reviewer actually curates an
  // entry for this specific item, so this is currently a safe no-op.
  const visualDiffusionItems = visualDiffusionReferencesForItem(bundle.specificItem);

  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold tracking-[0.12em] text-signal">선택한 신호</p>
      <h2 className="mt-2 text-3xl font-bold leading-[1.08] text-ink md:text-4xl">{interpretation.signalName}</h2>

      {heroArticle?.evidenceImageUrl ? (
        <div className="mt-4 flex justify-center sm:justify-start">
          <BundleHeroImage heroArticle={heroArticle} alt={bundle.displayName} size="lg" />
        </div>
      ) : null}

      <LeadSignalDimensions bundle={bundle} strength={strength} />

      <SignalInterpretationBlock interpretation={interpretation} />

      <EditorialVisualContextStrip articles={bundle.evidenceArticles} limit={3} />

      <VisualDiffusionReferenceStrip items={visualDiffusionItems} />

      <Link className="mt-6 inline-block text-sm font-semibold text-signal" href={`/items/${encodeURIComponent(bundle.specificItem)}`}>
        근거 보기 →
      </Link>
    </div>
  );
}

function LeadSignalDimensions({ bundle, strength }: { bundle: AttributeBundle; strength: string }) {
  const direction = editorialRecentDirection({});
  const latest = bundle.latestObservedAt?.toISOString().slice(0, 10) ?? "확인 불가";
  return (
    <section aria-label="선택한 신호 지표" data-testid="lead-signal-dimensions" className="mt-6 grid grid-cols-3 divide-x divide-line border-y border-line">
      <div className="min-w-0 py-3 pr-3">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-muted">관측 강도</p>
        <div className="mt-1"><EvidenceDots sourceSpread={bundle.bundleSourceSpread} articlePresence={bundle.bundleArticlePresence} label={strength} /></div>
      </div>
      <div className="min-w-0 px-3 py-3">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-muted">최근 방향</p>
        <p className="mt-1 text-sm font-semibold text-ink">{direction.symbol} {direction.label}</p>
        <p className="mt-0.5 text-[10px] leading-snug text-muted">조합 단위 비교값 없음</p>
      </div>
      <div className="min-w-0 py-3 pl-3">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-muted">최신 관측</p>
        <p className="mt-1 text-sm font-semibold tabular-nums text-ink">{latest}</p>
      </div>
    </section>
  );
}

function SignalInterpretationBlock({ interpretation }: { interpretation: SignalInterpretation }) {
  return (
    <section aria-label="현재 신호 해석" data-testid="signal-interpretation" className="mt-4 border-t border-line">
      <dl className="divide-y divide-line">
        <div className="py-3">
          <dt className="text-[11px] font-semibold tracking-[0.08em] text-signal">관측된 사실</dt>
          <dd className="mt-1 text-sm leading-relaxed text-ink">{interpretation.observedFact}</dd>
        </div>
        <div className="py-3">
          <dt className="text-[11px] font-semibold tracking-[0.08em] text-muted">아직 확인되지 않음</dt>
          <dd className="mt-1 text-sm leading-relaxed text-muted">{interpretation.unknowns.join(" · ")}</dd>
        </div>
        <div className="border-l-2 border-signal py-3 pl-3">
          <dt className="text-[11px] font-semibold tracking-[0.08em] text-signal">기획 검토 질문</dt>
          <dd className="mt-1 text-sm font-semibold leading-relaxed text-ink">{interpretation.planningQuestion}</dd>
        </div>
      </dl>
    </section>
  );
}

/**
 * Uniform-weight bundle tile, used when no bundle is yet a genuinely repeated
 * observation (so nothing should look "primary" by arbitrary list order) and
 * on /items where bundles sit in a multi-column grid rather than a linear
 * list. A thin top rule stands in for the old full border+shadow box.
 */
export function AttributeBundleCard({ bundle }: { bundle: AttributeBundle }) {
  const strength = bundleEvidenceStrength({ articlePresence: bundle.bundleArticlePresence, sourceSpread: bundle.bundleSourceSpread, independentEvidenceClusterCount: bundle.independentEvidenceClusterCount });
  return (
    <article className="border-t-2 border-ink pt-3">
      <div className="text-lg font-semibold leading-snug text-ink">{bundle.displayName}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-muted">{englishSubtitle(bundle)}</div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {bundle.directAttributes.map((attribute) => (
          <AttributeChip key={`${attribute.type}:${attribute.value}`} attribute={attribute} />
        ))}
      </div>

      <div className="mt-3 text-xs text-muted">
        {strength} · {bundle.bundleArticlePresence}개 기사 · {bundle.bundleSourceSpread}개 매체
        {bundle.latestObservedAt ? ` · 최근 ${bundle.latestObservedAt.toISOString().slice(0, 10)}` : ""}
      </div>

      <Link className="mt-3 inline-block text-xs font-semibold text-signal" href={`/items/${encodeURIComponent(bundle.specificItem)}`}>
        근거 보기 →
      </Link>
    </article>
  );
}

/**
 * CURRENT COMBINATION - the item detail page's lead line, restating the
 * bundle that got a planner here without repeating the big attribute
 * typography (the DIRECT ATTRIBUTES bar chart right below it already is
 * that visual). No border box; a single bottom divider closes the block.
 */
export function BundleHighlight({ bundle }: { bundle: AttributeBundle }) {
  const strength = bundleEvidenceStrength({ articlePresence: bundle.bundleArticlePresence, sourceSpread: bundle.bundleSourceSpread, independentEvidenceClusterCount: bundle.independentEvidenceClusterCount });
  const heroArticle = findHeroArticle(bundle);

  return (
    <section className="border-b border-line pb-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">Current Combination</p>

      {heroArticle?.evidenceImageUrl ? (
        <div className="mt-4 flex justify-center sm:justify-start">
          <BundleHeroImage heroArticle={heroArticle} alt={bundle.displayName} size="lg" />
        </div>
      ) : null}

      <h2 className="mt-3 text-3xl font-semibold leading-tight text-ink">{bundle.displayName}</h2>
      <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-muted">{englishSubtitle(bundle)}</p>

      <div className="mt-4">
        <EvidenceDots sourceSpread={bundle.bundleSourceSpread} articlePresence={bundle.bundleArticlePresence} label={strength} />
      </div>
      <p className="mt-2 text-sm text-muted">
        {bundle.bundleArticlePresence}개 기사 · {bundle.bundleSourceSpread}개 매체
        {bundle.latestObservedAt ? ` · 최근 ${bundle.latestObservedAt.toISOString().slice(0, 10)}` : ""}
      </p>
    </section>
  );
}

/**
 * Attribute matrix: attributes grouped by dimension (소재/디테일/...) with a
 * thin rule under each dimension label, one horizontal bar per attribute
 * sized strictly by its real articlePresence relative to the item's
 * strongest attribute. Bars use near-black (not the teal accent) to read as
 * an editorial data rule rather than a UI control; exact counts stay
 * right-aligned next to every bar so length and count compare at a glance.
 */
export function AttributeMatrix({ attributes, totalArticlePresence }: { attributes: BundleAttribute[]; totalArticlePresence: number }) {
  if (attributes.length === 0) return null;
  const max = Math.max(totalArticlePresence, ...attributes.map((attribute) => attribute.articlePresence), 1);

  const groups = new Map<string, BundleAttribute[]>();
  for (const attribute of attributes) {
    const list = groups.get(attribute.type) ?? [];
    list.push(attribute);
    groups.set(attribute.type, list);
  }

  return (
    <div className="space-y-6">
      {[...groups.entries()].map(([type, rows]) => (
        <div key={type}>
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-ink">{attributeTypeKoreanLabel(type)}</span>
            <span aria-hidden className="h-px flex-1 bg-line" />
          </div>
          <div className="mt-3 space-y-3">
            {rows.map((attribute) => (
              <div key={`${attribute.type}:${attribute.value}`} className="flex items-center gap-3">
                <span className="w-24 shrink-0 truncate text-sm font-medium text-ink">{attributeKoreanLabel(attribute.value)}</span>
                <div className="h-3 flex-1 rounded-full bg-slate-100">
                  <div className="h-3 rounded-full bg-ink" style={{ width: `${attributeBarWidthPercent(attribute.articlePresence, max)}%` }} />
                </div>
                <span className="w-32 shrink-0 text-right text-xs tabular-nums text-muted">
                  {attribute.articlePresence}개 기사 · {attribute.sourceSpread}개 매체
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function BundleEmptyState({ message }: { message: string }) {
  return <p className="border-t border-line pt-4 text-sm text-muted">{message}</p>;
}
