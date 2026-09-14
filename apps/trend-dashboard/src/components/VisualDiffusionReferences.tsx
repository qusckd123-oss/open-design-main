import type { VisualDiffusionReference } from "@/config/visual-diffusion-references";
import type { VisualDiffusionSourceConfig } from "@/config/visual-diffusion-sources";

/**
 * VISUAL DIFFUSION REFERENCES ("반복 노출된 스타일링 레퍼런스") - 2026-09-14
 *
 * A distinct, visibly separated lane from EditorialVisualContextStrip -
 * different heading, different disclaimer, never intermixed with that
 * strip's grid (see docs/TREND_RESEARCH_SOURCE_REGISTRY.md Section 7, item
 * 6). Renders ONLY human-curated visual-diffusion-references.ts entries
 * whose itemContext matches this bundle's specificItem, resolved via
 * visualDiffusionReferencesForItem (already filters to status: "APPROVED").
 *
 * No image is fetched, hotlinked, or displayed here - permalink (outbound
 * link) only, per Section 6's constraint that no image binary may be
 * cached or transformed without a separate rights review. This is a
 * deliberately more conservative treatment than EditorialVisualContextStrip
 * (which links this repo's own already-approved article-hero image usage) -
 * Instagram media is a different platform with its own terms, so this lane
 * shows attribution + permalink + human-curated mood tags, never a picture.
 *
 * Renders nothing at all when there are no approved references for this
 * item - a quiet no-op today (curation has not started yet - see
 * visual-diffusion-references.ts), never a "coming soon" placeholder box.
 */
export function VisualDiffusionReferenceStrip({
  items
}: {
  items: Array<{ reference: VisualDiffusionReference; source: VisualDiffusionSourceConfig | null }>;
}) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="visual-diffusion-title" data-testid="visual-diffusion-references" className="mt-6 border-l-2 border-line pl-4">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-line pb-3">
        <div>
          <p id="visual-diffusion-title" className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">Visual Diffusion References</p>
          <h3 className="mt-1 text-lg font-semibold text-ink">반복 노출된 스타일링 레퍼런스</h3>
        </div>
        <p className="max-w-md text-right text-[11px] leading-relaxed text-muted">
          사람이 직접 선별한 스타일링 참고 자료 · 아이템/속성/무드의 직접 증거 아님, 판매량 아님
        </p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map(({ reference, source }) => (
          <a
            key={reference.permalink}
            href={reference.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="block border-t border-line pt-3 transition hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
            aria-label={`${source?.handle ?? "외부 게시물"} 원본 게시물 열기`}
          >
            <div className="text-sm font-semibold text-ink">{source?.handle ?? "외부 게시물"}</div>
            <div className="text-[11px] text-muted">{source?.platform ?? "INSTAGRAM"} · {reference.capturedAt}</div>

            {reference.moodLabels.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {reference.moodLabels.map((label) => (
                  <span key={label} className="rounded-full border border-line px-2 py-0.5 text-[10px] text-muted">
                    {label}
                  </span>
                ))}
              </div>
            ) : null}

            {reference.reviewerNote ? <p className="mt-2 text-xs leading-relaxed text-muted">{reference.reviewerNote}</p> : null}

            <div className="mt-2 text-[10px] text-muted">검토: {reference.reviewedBy}</div>
          </a>
        ))}
      </div>
    </section>
  );
}
