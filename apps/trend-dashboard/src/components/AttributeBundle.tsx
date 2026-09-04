import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { attributeBarWidthPercent } from "@/lib/attribute-visual";
import { attributeKoreanLabel, attributeTypeKoreanLabel } from "@/lib/korean-labels";
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
function EvidenceDots({ sourceSpread, articlePresence, label }: { sourceSpread: number; articlePresence: number; label: string }) {
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
 * CURRENT SIGNAL - the dashboard's lead story, not a card in a grid. No
 * border, no shadow, no background surface: whitespace and type scale alone
 * signal that this is the strongest thing on the page. Only rendered for a
 * genuinely REPEATED bundle (bundleArticlePresence >= 2 - the same threshold
 * bundleEvidenceStrength already uses for "반복 관측").
 *
 * The composed name (bundle.displayName, "재활용 원단 토트백") is the ONE
 * dominant headline - a planner's actual final answer to "어떤 속성의 어떤
 * 아이템인가?". It must not be preceded by a giant MATERIAL/ITEM typographic
 * breakdown that restates the same two facts as separate headlines before
 * the reader even reaches the combined name.
 */
export function CurrentSignalHero({ bundle }: { bundle: AttributeBundle }) {
  const strength = bundleEvidenceStrength({ articlePresence: bundle.bundleArticlePresence, sourceSpread: bundle.bundleSourceSpread });
  const heroArticle = findHeroArticle(bundle);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-signal">Current Signal</p>

      {heroArticle?.evidenceImageUrl ? (
        <div className="mt-5 flex justify-center sm:justify-start">
          <BundleHeroImage heroArticle={heroArticle} alt={bundle.displayName} size="lg" />
        </div>
      ) : null}

      <h2 className="mt-4 text-4xl font-bold leading-[1.05] text-ink md:text-6xl">{bundle.displayName}</h2>
      <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-muted">{englishSubtitle(bundle)}</p>

      <div className="mt-5">
        <EvidenceDots sourceSpread={bundle.bundleSourceSpread} articlePresence={bundle.bundleArticlePresence} label={strength} />
      </div>
      <p className="mt-2 text-sm text-muted">
        {bundle.bundleArticlePresence}개 기사 · {bundle.bundleSourceSpread}개 매체
        {bundle.latestObservedAt ? ` · 최근 ${bundle.latestObservedAt.toISOString().slice(0, 10)}` : ""}
      </p>

      <Link className="mt-5 inline-block text-sm font-semibold text-signal" href={`/items/${encodeURIComponent(bundle.specificItem)}`}>
        근거 보기 →
      </Link>
    </div>
  );
}

/**
 * A single-observation bundle, presented as a light editorial tile - title,
 * english descriptor, evidence line - separated from its neighbors by a
 * thin top divider rather than each sitting in its own bordered box. Never
 * upgraded in wording just because it sits next to CurrentSignalHero.
 */
export function SecondaryBundleCard({ bundle }: { bundle: AttributeBundle }) {
  const strength = bundleEvidenceStrength({ articlePresence: bundle.bundleArticlePresence, sourceSpread: bundle.bundleSourceSpread });
  return (
    <Link href={`/items/${encodeURIComponent(bundle.specificItem)}`} className="block border-t border-line py-4 transition first:border-t-0 first:pt-0 hover:opacity-70">
      <div className="text-base font-semibold leading-snug text-ink">{bundle.displayName}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-muted">{englishSubtitle(bundle)}</div>
      <div className="mt-2 text-xs text-muted">
        {strength} · {bundle.bundleArticlePresence}기사 · {bundle.bundleSourceSpread}매체
      </div>
    </Link>
  );
}

/**
 * Uniform-weight bundle tile, used when no bundle is yet a genuinely repeated
 * observation (so nothing should look "primary" by arbitrary list order) and
 * on /items where bundles sit in a multi-column grid rather than a linear
 * list. A thin top rule stands in for the old full border+shadow box.
 */
export function AttributeBundleCard({ bundle }: { bundle: AttributeBundle }) {
  const strength = bundleEvidenceStrength({ articlePresence: bundle.bundleArticlePresence, sourceSpread: bundle.bundleSourceSpread });
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
  const strength = bundleEvidenceStrength({ articlePresence: bundle.bundleArticlePresence, sourceSpread: bundle.bundleSourceSpread });
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
