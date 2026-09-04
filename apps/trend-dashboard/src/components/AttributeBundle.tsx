import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { attributeKoreanLabel, attributeTypeKoreanLabel, specificItemKoreanLabel } from "@/lib/korean-labels";
import { sourceLabel } from "@/lib/market-ui";
import { bundleEvidenceStrength, selectBundleHeroImage, type AttributeBundle, type BundleAttribute } from "@/services/attribute-bundle-service";

/**
 * Visual-first bundle card. Reading order is image -> composed name ->
 * attribute chips -> evidence strength -> counts, so a planner can scan it
 * without reading a table. Every element is backed by a direct attribute
 * relation; nothing here is inferred from the image itself.
 */
export function AttributeBundleCard({ bundle }: { bundle: AttributeBundle }) {
  const strength = bundleEvidenceStrength({ articlePresence: bundle.bundleArticlePresence, sourceSpread: bundle.bundleSourceSpread });
  const hero = selectBundleHeroImage(bundle.evidenceArticles);
  const itemLabel = specificItemKoreanLabel(bundle.specificItem) ?? bundle.specificItem.replaceAll("_", " ");

  return (
    <article className="flex flex-col overflow-hidden rounded border border-line bg-white shadow-subtle">
      <div className="flex items-center justify-center bg-slate-50 p-3">
        <BundleImage hero={hero} alt={bundle.displayName} attributes={bundle.directAttributes} size="lg" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <div className="text-lg font-semibold leading-tight text-ink">{bundle.displayName}</div>
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
 * Bundle hero image, with an honest caption: the picture is the article's
 * hero image, not a product cutout, and the same image may legitimately
 * repeat across bundles that share an evidence article (see
 * docs/ATTRIBUTE_BUNDLE_AUDIT.md). When no evidence article carries an
 * image, the fallback is attribute-chip-centric rather than an empty
 * "NO IMG" box - the chips are the actual evidence, so they replace the
 * picture instead of leaving a blank placeholder next to it.
 */
function BundleImage({ hero, alt, attributes, size }: { hero: string | null; alt: string; attributes: BundleAttribute[]; size: "md" | "lg" }) {
  if (hero) {
    return (
      <div className="flex flex-col items-center gap-1">
        <ProductImage src={hero} alt={alt} size={size} />
        <span className="text-[10px] text-muted" title="아이템 자체의 사진이 아니라 근거 기사의 대표 이미지입니다.">
          기사 대표 이미지
        </span>
      </div>
    );
  }
  const boxSize = size === "lg" ? "h-48 w-48" : "h-20 w-20";
  return (
    <div className={`flex ${boxSize} shrink-0 flex-col items-center justify-center gap-1.5 rounded border border-dashed border-line bg-slate-50 p-2 text-center`}>
      <div className="flex flex-wrap justify-center gap-1">
        {attributes.slice(0, 2).map((attribute) => (
          <span key={`${attribute.type}:${attribute.value}`} className="rounded-full border border-line bg-white px-1.5 py-0.5 text-[10px] text-muted">
            {attributeKoreanLabel(attribute.value)}
          </span>
        ))}
      </div>
      <span className="text-[10px] text-muted">이미지 없음</span>
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
  const hero = selectBundleHeroImage(bundle.evidenceArticles);

  return (
    <section className="flex flex-col gap-4 rounded border border-signal/30 bg-white p-5 shadow-subtle sm:flex-row sm:items-center">
      <div className="flex justify-center sm:justify-start">
        <BundleImage hero={hero} alt={bundle.displayName} attributes={bundle.directAttributes} size="lg" />
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
 * Attribute matrix: one bar per dimension, length driven strictly by article
 * presence (never an invented score). Exact counts stay visible next to it.
 */
export function AttributeMatrix({ attributes, totalArticlePresence }: { attributes: BundleAttribute[]; totalArticlePresence: number }) {
  if (attributes.length === 0) return null;
  const max = Math.max(totalArticlePresence, ...attributes.map((attribute) => attribute.articlePresence), 1);
  return (
    <div className="space-y-2">
      {attributes.map((attribute) => {
        const filled = Math.max(1, Math.round((attribute.articlePresence / max) * 3));
        return (
          <div key={`${attribute.type}:${attribute.value}`} className="flex items-center gap-3 text-sm">
            <span className="w-14 shrink-0 text-xs text-muted">{attributeTypeKoreanLabel(attribute.type)}</span>
            <span aria-hidden className="w-12 shrink-0 tracking-[0.1em] text-signal">
              {"■".repeat(filled)}
              <span className="text-line">{"□".repeat(Math.max(0, 3 - filled))}</span>
            </span>
            <span className="font-medium">{attributeKoreanLabel(attribute.value)}</span>
            <span className="ml-auto text-xs text-muted">
              {attribute.articlePresence}개 기사 · {attribute.sourceSpread}개 매체
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function BundleEmptyState({ message }: { message: string }) {
  return <div className="rounded border border-dashed border-line bg-white p-6 text-sm text-muted">{message}</div>;
}
