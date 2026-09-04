import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { attributeBarWidthPercent } from "@/lib/attribute-visual";
import { attributeKoreanLabel, attributeTypeKoreanLabel, specificItemKoreanLabel } from "@/lib/korean-labels";
import { bundleEvidenceStrength, type AttributeBundle, type BundleAttribute, type BundleEvidenceArticle } from "@/services/attribute-bundle-service";

/**
 * Visual-first bundle card (uniform weight - used when no bundle is a
 * genuinely repeated observation yet, so no card should look "primary" by
 * arbitrary luck of list order). Reading order is visual -> composed name ->
 * attribute chips -> evidence strength -> counts. Every element is backed by
 * a direct attribute relation; nothing here is inferred from the image
 * itself.
 */
export function AttributeBundleCard({ bundle }: { bundle: AttributeBundle }) {
  const strength = bundleEvidenceStrength({ articlePresence: bundle.bundleArticlePresence, sourceSpread: bundle.bundleSourceSpread });
  const heroArticle = findHeroArticle(bundle);
  const itemLabel = specificItemKoreanLabel(bundle.specificItem) ?? bundle.specificItem.replaceAll("_", " ");

  return (
    <article className="flex flex-col overflow-hidden rounded border border-line bg-white shadow-subtle">
      {heroArticle?.evidenceImageUrl ? (
        <div className="flex items-center justify-center bg-slate-50 p-3">
          <BundleHeroImage heroArticle={heroArticle} alt={bundle.displayName} size="lg" />
        </div>
      ) : (
        <AttributeVisualPanel bundle={bundle} size="compact" />
      )}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="text-xl font-semibold leading-tight text-ink">{bundle.displayName}</div>

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
 * Primary card for a genuinely REPEATED bundle (bundleArticlePresence >= 2 -
 * the same threshold bundleEvidenceStrength already uses for "반복 관측").
 * Deliberately larger/more prominent than SecondaryBundleCard, but the
 * wording stays exactly as conservative as everywhere else - only the
 * SPACE/SIZE communicates "this is the strongest thing we have," never new
 * copy like "뜨는" or "기획 우선".
 */
export function PrimaryBundleCard({ bundle }: { bundle: AttributeBundle }) {
  const strength = bundleEvidenceStrength({ articlePresence: bundle.bundleArticlePresence, sourceSpread: bundle.bundleSourceSpread });
  const heroArticle = findHeroArticle(bundle);

  return (
    <article className="flex flex-col overflow-hidden rounded border-2 border-signal/40 bg-white shadow-subtle">
      {heroArticle?.evidenceImageUrl ? (
        <div className="flex items-center justify-center bg-slate-50 p-4">
          <BundleHeroImage heroArticle={heroArticle} alt={bundle.displayName} size="lg" />
        </div>
      ) : (
        <AttributeVisualPanel bundle={bundle} size="full" />
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="text-2xl font-semibold leading-tight text-ink">{bundle.displayName}</div>

        <div className="flex flex-wrap gap-1.5">
          {bundle.directAttributes.map((attribute) => (
            <AttributeChip key={`${attribute.type}:${attribute.value}`} attribute={attribute} />
          ))}
        </div>

        <div className="mt-auto space-y-1">
          <div className="text-sm font-semibold text-ink">{strength}</div>
          <div className="text-xs text-muted">
            {bundle.bundleArticlePresence}개 기사 · {bundle.bundleSourceSpread}개 매체
            {bundle.latestObservedAt ? ` · 최근 ${bundle.latestObservedAt.toISOString().slice(0, 10)}` : ""}
          </div>
        </div>

        <Link className="text-xs font-semibold text-signal" href={`/items/${encodeURIComponent(bundle.specificItem)}`}>
          근거 보기 →
        </Link>
      </div>
    </article>
  );
}

/**
 * Compact card for the remaining single-observation bundles once a primary
 * repeated bundle exists. Deliberately no image/visual-panel slot at all -
 * that's what keeps its area/emphasis visibly lower than PrimaryBundleCard,
 * per the "1기사/1매체는 compact card" rule. Wording stays "단일 관측", never
 * upgraded just because it sits next to a stronger card.
 */
export function SecondaryBundleCard({ bundle }: { bundle: AttributeBundle }) {
  const strength = bundleEvidenceStrength({ articlePresence: bundle.bundleArticlePresence, sourceSpread: bundle.bundleSourceSpread });
  return (
    <Link href={`/items/${encodeURIComponent(bundle.specificItem)}`} className="block rounded border border-line bg-white p-3 shadow-subtle transition hover:border-signal/40">
      <div className="text-sm font-semibold leading-snug text-ink">{bundle.displayName}</div>
      <div className="mt-2 flex flex-wrap gap-1">
        {bundle.directAttributes.map((attribute) => (
          <AttributeChip key={`${attribute.type}:${attribute.value}`} attribute={attribute} />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-muted">{strength}</span>
        <span className="shrink-0 text-muted">
          {bundle.bundleArticlePresence}개 기사 · {bundle.bundleSourceSpread}개 매체
        </span>
      </div>
    </Link>
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
 * Typographic attribute visual: the primary fallback whenever no
 * document-position-confident image exists (today, always). Fills the
 * available width rather than sitting in a small dashed box with empty
 * space beside it - the attributes ARE the content here, shown large, not a
 * placeholder standing in for a missing photo. Only real direct attributes
 * and the item label are ever shown; no invented color, pattern, or score.
 */
export function AttributeVisualPanel({ bundle, size }: { bundle: AttributeBundle; size: "full" | "compact" }) {
  const itemLabel = specificItemKoreanLabel(bundle.specificItem) ?? bundle.specificItem.replaceAll("_", " ");
  const rows = [
    ...bundle.directAttributes.map((attribute) => ({ key: `${attribute.type}:${attribute.value}`, label: attributeTypeKoreanLabel(attribute.type), value: attributeKoreanLabel(attribute.value) })),
    { key: "item", label: "아이템", value: itemLabel }
  ];
  const isFull = size === "full";
  return (
    <div className={isFull ? "flex flex-col justify-center gap-4 bg-slate-50 px-6 py-8" : "flex flex-col justify-center gap-2.5 bg-slate-50 px-4 py-5"}>
      {rows.map((row) => (
        <div key={row.key}>
          <div className={isFull ? "text-xs font-semibold uppercase tracking-[0.14em] text-muted" : "text-[10px] font-semibold uppercase tracking-[0.12em] text-muted"}>{row.label}</div>
          <div className={isFull ? "text-3xl font-bold leading-tight text-ink" : "text-lg font-bold leading-tight text-ink"}>{row.value}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * Highlights one bundle (its strongest, per getPrimaryBundleForItem) at the
 * top of an item detail page. With a confident hero image, the image gets
 * real side space (worth allocating to a real photo). Without one, the
 * layout goes full-width single-column - name first, then the attribute
 * visual filling the whole card width, then evidence - instead of a small
 * image-shaped box with wasted space beside it.
 */
export function BundleHighlight({ bundle }: { bundle: AttributeBundle }) {
  const strength = bundleEvidenceStrength({ articlePresence: bundle.bundleArticlePresence, sourceSpread: bundle.bundleSourceSpread });
  const heroArticle = findHeroArticle(bundle);

  if (heroArticle?.evidenceImageUrl) {
    return (
      <section className="flex flex-col gap-4 rounded border border-signal/30 bg-white p-5 shadow-subtle sm:flex-row sm:items-center">
        <div className="flex justify-center sm:justify-start">
          <BundleHeroImage heroArticle={heroArticle} alt={bundle.displayName} size="lg" />
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

  return (
    <section className="overflow-hidden rounded border border-signal/30 bg-white shadow-subtle">
      <div className="p-5 pb-0">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-signal">요즘 보이는 상품 조합</div>
        <div className="mt-1 text-2xl font-semibold leading-tight text-ink">{bundle.displayName}</div>
      </div>
      <AttributeVisualPanel bundle={bundle} size="full" />
      <div className="space-y-1 p-5 pt-4">
        <EvidenceDots sourceSpread={bundle.bundleSourceSpread} articlePresence={bundle.bundleArticlePresence} label={strength} />
        <div className="text-xs text-muted">
          {bundle.bundleArticlePresence}개 기사 · {bundle.bundleSourceSpread}개 매체
          {bundle.latestObservedAt ? ` · 최근 ${bundle.latestObservedAt.toISOString().slice(0, 10)}` : ""}
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
 * Attribute matrix: attributes grouped by dimension (소재/디테일/...) with a
 * clear divider under each dimension label, one CSS horizontal bar per
 * attribute sized strictly by its real articlePresence relative to the
 * item's strongest attribute. Exact counts stay right-aligned in a fixed
 * column (tabular-nums) next to every bar so bar length and count can be
 * compared at a glance, never an invented score.
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
    <div className="space-y-5">
      {[...groups.entries()].map(([type, rows]) => (
        <div key={type}>
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-ink">{attributeTypeKoreanLabel(type)}</span>
            <span aria-hidden className="h-px flex-1 bg-line" />
          </div>
          <div className="mt-3 space-y-3">
            {rows.map((attribute) => (
              <div key={`${attribute.type}:${attribute.value}`} className="flex items-center gap-3">
                <span className="w-24 shrink-0 truncate text-sm font-medium text-ink">{attributeKoreanLabel(attribute.value)}</span>
                <div className="h-3 flex-1 rounded-full bg-slate-100">
                  <div className="h-3 rounded-full bg-signal" style={{ width: `${attributeBarWidthPercent(attribute.articlePresence, max)}%` }} />
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
  return <div className="rounded border border-dashed border-line bg-white p-6 text-sm text-muted">{message}</div>;
}
