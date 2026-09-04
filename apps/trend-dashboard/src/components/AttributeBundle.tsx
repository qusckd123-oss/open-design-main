import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { attributeBarWidthPercent } from "@/lib/attribute-visual";
import { attributeKoreanLabel, attributeTypeKoreanLabel, specificItemKoreanLabel } from "@/lib/korean-labels";
import { sourceLabel } from "@/lib/market-ui";
import { bundleEvidenceStrength, type AttributeBundle, type BundleAttribute, type BundleEvidenceArticle } from "@/services/attribute-bundle-service";

/**
 * Visual-first bundle card. Reading order is image -> composed name ->
 * attribute chips -> evidence strength -> counts, so a planner can scan it
 * without reading a table. Every element is backed by a direct attribute
 * relation; nothing here is inferred from the image itself.
 */
export function AttributeBundleCard({ bundle }: { bundle: AttributeBundle }) {
  const strength = bundleEvidenceStrength({ articlePresence: bundle.bundleArticlePresence, sourceSpread: bundle.bundleSourceSpread });
  const heroArticle = findHeroArticle(bundle);
  const itemLabel = specificItemKoreanLabel(bundle.specificItem) ?? bundle.specificItem.replaceAll("_", " ");

  return (
    <article className="flex flex-col overflow-hidden rounded border border-line bg-white shadow-subtle">
      <div className="flex items-center justify-center bg-slate-50 p-3">
        <BundleImage heroArticle={heroArticle} alt={bundle.displayName} bundle={bundle} size="lg" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <div className="text-xl font-semibold leading-tight text-ink">{bundle.displayName}</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.08em] text-muted">
            {bundle.specificItem.replaceAll("_", " ")}
            {bundle.directAttributes.length > 0 ? ` · ${bundle.directAttributes.map((attribute) => attribute.value.replaceAll("_", " ")).join(" · ")}` : ""}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {bundle.directAttributes.map((attribute) => (
            <AttributeChip key={`${attribute.type}:${attribute.value}`} attribute={attribute} />
          ))}
        </div>

        <div className="mt-auto space-y-1">
          <EvidenceDots sourceSpread={bundle.bundleSourceSpread} articlePresence={bundle.bundleArticlePresence} label={strength} />
          <div className="text-xs text-muted">
            {bundle.bundleArticlePresence}개 기사 · {bundle.bundleSourceSpread}개 매체
            {bundle.latestObservedAt ? ` · 최근 ${bundle.latestObservedAt.toISOString().slice(0, 10)}` : ""}
          </div>
          <div className="text-[11px] text-muted">매체 {bundle.evidenceArticles.map((article) => sourceLabel(article.source)).filter((value, index, all) => all.indexOf(value) === index).join(" / ")}</div>
        </div>

        <Link className="text-xs font-semibold text-signal" href={`/items/${encodeURIComponent(bundle.specificItem)}`}>
          근거 보기 →
        </Link>
        <p className="text-[11px] leading-snug text-muted">{itemLabel}을(를) 직접 수식한 표현에서만 추출했습니다.</p>
      </div>
    </article>
  );
}

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

/**
 * Bundle hero image. Only ever renders a DIRECT_BLOCK/ADJACENT_BLOCK image
 * (never the article's overall hero) with an honest caption naming exactly
 * why it is trustworthy. When no such image exists, the fallback is an
 * attribute-centric panel - dimension labels plus the item and counts -
 * instead of an empty "이미지 없음" box or, worse, a plausible-looking but
 * unrelated article photo. Showing nothing is safer than showing the wrong
 * thing.
 */
function BundleImage({ heroArticle, alt, bundle, size }: { heroArticle: BundleEvidenceArticle | null; alt: string; bundle: AttributeBundle; size: "md" | "lg" }) {
  if (heroArticle?.evidenceImageUrl) {
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

  const boxSize = size === "lg" ? "h-48 w-48" : "h-20 w-20";
  const itemLabel = specificItemKoreanLabel(bundle.specificItem) ?? bundle.specificItem.replaceAll("_", " ");
  return (
    <div className={`flex ${boxSize} shrink-0 flex-col justify-center gap-2 rounded border border-dashed border-line bg-slate-50 p-3`}>
      {bundle.directAttributes.slice(0, 2).map((attribute) => (
        <div key={`${attribute.type}:${attribute.value}`}>
          <div className="text-[9px] font-semibold uppercase tracking-wide text-muted">{attributeTypeKoreanLabel(attribute.type)}</div>
          <div className="truncate text-xs font-semibold text-ink">{attributeKoreanLabel(attribute.value)}</div>
        </div>
      ))}
      <div>
        <div className="text-[9px] font-semibold uppercase tracking-wide text-muted">아이템</div>
        <div className="truncate text-xs font-semibold text-ink">{itemLabel}</div>
      </div>
      <div className="text-[10px] text-muted">
        {bundle.bundleArticlePresence}개 기사 · {bundle.bundleSourceSpread}개 매체
      </div>
    </div>
  );
}

/**
 * Highlights one bundle (its strongest, per getPrimaryBundleForItem) at the
 * top of an item detail page - image, composed name, chips, and evidence
 * strength together, so a planner arriving from a bundle card immediately
 * sees the same claim restated before scrolling into the fuller item detail.
 */
export function BundleHighlight({ bundle }: { bundle: AttributeBundle }) {
  const strength = bundleEvidenceStrength({ articlePresence: bundle.bundleArticlePresence, sourceSpread: bundle.bundleSourceSpread });
  const heroArticle = findHeroArticle(bundle);

  return (
    <section className="flex flex-col gap-4 rounded border border-signal/30 bg-white p-5 shadow-subtle sm:flex-row sm:items-center">
      <div className="flex justify-center sm:justify-start">
        <BundleImage heroArticle={heroArticle} alt={bundle.displayName} bundle={bundle} size="lg" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-signal">요즘 보이는 상품 조합</div>
        <div className="mt-1 text-2xl font-semibold leading-tight text-ink">{bundle.displayName}</div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {bundle.directAttributes.map((attribute) => (
            <AttributeChip key={`${attribute.type}:${attribute.value}`} attribute={attribute} />
          ))}
        </div>
        <div className="mt-3 space-y-1">
          <EvidenceDots sourceSpread={bundle.bundleSourceSpread} articlePresence={bundle.bundleArticlePresence} label={strength} />
          <div className="text-xs text-muted">{bundle.bundleArticlePresence}개 기사 · {bundle.bundleSourceSpread}개 매체</div>
        </div>
      </div>
    </section>
  );
}

export function AttributeChip({ attribute }: { attribute: BundleAttribute }) {
  return (
    <span className="rounded-full border border-signal/30 bg-signal/5 px-2.5 py-1 text-xs font-medium text-ink">
      {attributeKoreanLabel(attribute.value)}
      <span className="ml-1 text-[10px] text-muted">{attributeTypeKoreanLabel(attribute.type)}</span>
    </span>
  );
}

/**
 * Three dots = distinct outlets, not a score. One outlet can never look like
 * broad coverage no matter how many articles it published.
 */
function EvidenceDots({ sourceSpread, articlePresence, label }: { sourceSpread: number; articlePresence: number; label: string }) {
  const filled = Math.min(3, Math.max(sourceSpread, articlePresence >= 2 ? 1 : 0));
  return (
    <div className="flex items-center gap-2" title={`${articlePresence}개 기사 · ${sourceSpread}개 매체`}>
      <span aria-hidden className="tracking-[0.15em] text-signal">
        {"●".repeat(filled)}
        <span className="text-line">{"○".repeat(3 - filled)}</span>
      </span>
      <span className="text-xs font-semibold text-ink">{label}</span>
    </div>
  );
}

/**
 * Attribute matrix: attributes grouped by dimension (소재/디테일/...), one
 * CSS horizontal bar per attribute sized strictly by its real articlePresence
 * relative to the item's strongest attribute. Exact counts stay visible next
 * to every bar so the bar is a legibility aid, never the only number shown.
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
    <div className="space-y-4">
      {[...groups.entries()].map(([type, rows]) => (
        <div key={type}>
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">{attributeTypeKoreanLabel(type)}</div>
          <div className="mt-2 space-y-2.5">
            {rows.map((attribute) => (
              <div key={`${attribute.type}:${attribute.value}`} className="flex items-center gap-3">
                <span className="w-24 shrink-0 truncate text-sm font-medium text-ink">{attributeKoreanLabel(attribute.value)}</span>
                <div className="h-2.5 flex-1 rounded-full bg-slate-100">
                  <div className="h-2.5 rounded-full bg-signal" style={{ width: `${attributeBarWidthPercent(attribute.articlePresence, max)}%` }} />
                </div>
                <span className="w-28 shrink-0 text-right text-xs text-muted">
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
  return <div className="rounded border border-dashed border-line bg-white p-6 text-sm text-muted">{message}</div>;
}
