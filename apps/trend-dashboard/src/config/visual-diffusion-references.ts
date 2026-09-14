import { visualDiffusionSourceById, type VisualDiffusionSourceConfig } from "@/config/visual-diffusion-sources";

/**
 * VISUAL DIFFUSION REFERENCES (2026-09-14)
 *
 * One human-curated observation of one specific Instagram post - never
 * auto-generated, never scraped, never derived from an image by any code
 * path. Design origin: docs/TREND_RESEARCH_SOURCE_REGISTRY.md Section 6/7.
 *
 * Empty by default. A reviewer (currently the user, manually - see that
 * doc's Section 10, "human reviewer workflow still undecided") adds an
 * entry here only after actually looking at a specific post and deciding it
 * belongs to a specific bundle/specificItem. This file feeds NO automated
 * collector, NO EditorialMention, NO attribute-bundle-service.ts, NO
 * MarketRankingSnapshot, and NO ranking input anywhere - `itemContext` is a
 * human's own judgment call, never inferred from an image or caption.
 *
 * `status` stays "PENDING" until a reviewer sets it to "APPROVED" - only
 * "APPROVED" entries are ever shown in the UI (see
 * visualDiffusionReferencesForItem below / VisualDiffusionReferenceStrip).
 * This lets a reviewer note a candidate without it appearing to a planner
 * before it has actually been vetted.
 */

export type VisualDiffusionReferenceStatus = "PENDING" | "APPROVED" | "REJECTED";

export type VisualDiffusionReference = {
  /** -> VisualDiffusionSourceConfig.id, or "AD_HOC" for a one-off permalink not tied to a registered account. */
  sourceId: string;
  permalink: string;
  /** ISO date string (YYYY-MM-DD) - when a human noted this, not necessarily when the post itself was published. */
  capturedAt: string;
  /** The exact specificItem taxonomy value this reference is attached to (e.g. "SHIRT") - human-assigned, never auto-inferred. Null until a reviewer attaches it to a specific item. */
  itemContext: string | null;
  /** Small human-curated vocabulary, e.g. ["빈티지", "워크웨어"] - never generated from the image/caption by any code path. */
  moodLabels: string[];
  reviewerNote: string | null;
  reviewedBy: string;
  status: VisualDiffusionReferenceStatus;
};

// No entries yet - curation has not started (see docs/TREND_RESEARCH_SOURCE_REGISTRY.md
// Section 10). Add entries here, with status: "APPROVED", once a reviewer
// has actually looked at a specific post from one of the accounts in
// visual-diffusion-sources.ts and decided which bundle/specificItem it
// belongs to. The UI (VisualDiffusionReferenceStrip) renders nothing at all
// while this list is empty - it is a quiet no-op, not a placeholder.
export const visualDiffusionReferences: VisualDiffusionReference[] = [];

/**
 * Only APPROVED references for the exact specificItem are ever returned.
 * Resolves each reference's source config defensively - an unregistered
 * sourceId (should never happen for reviewer-entered data, but a typo must
 * not crash rendering) resolves to `source: null` rather than throwing.
 */
export function visualDiffusionReferencesForItem(
  specificItem: string
): Array<{ reference: VisualDiffusionReference; source: VisualDiffusionSourceConfig | null }> {
  return visualDiffusionReferences
    .filter((reference) => reference.status === "APPROVED" && reference.itemContext === specificItem)
    .map((reference) => ({
      reference,
      source: reference.sourceId === "AD_HOC" ? null : visualDiffusionSourceById(reference.sourceId) ?? null
    }));
}
