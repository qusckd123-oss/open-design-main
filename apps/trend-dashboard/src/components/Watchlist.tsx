"use client";

import { Fragment, useState, type ReactNode } from "react";

export type WatchlistItem = {
  key: string;
  /** Human-readable label for the row's button (position + name) - Watchlist itself never sees raw bundle data, so this rides along as plain text. */
  ariaLabel: string;
  /** Pre-rendered compact row content (WatchlistRow, AttributeBundle.tsx) - a Server Component render, passed in as ready markup. */
  row: ReactNode;
  /** Pre-rendered selected-signal detail content (SelectedSignalDetail, AttributeBundle.tsx) - same idea. */
  detail: ReactNode;
};

const ROW_POSITION_CLASSES = ["lg:row-start-1", "lg:row-start-2", "lg:row-start-3", "lg:row-start-4", "lg:row-start-5"];

/**
 * PRESENTATION-ONLY interaction shell for the home "상품기획 워치리스트".
 *
 * Holds ONLY which item is currently selected. Every compact row and every
 * selected-signal detail is pre-rendered server-side (WatchlistRow /
 * SelectedSignalDetail in src/components/AttributeBundle.tsx) and handed in
 * here as ready ReactNode content - this file never imports bundle ranking,
 * the attribute-bundle service, or anything Prisma-adjacent, so it stays a
 * pure, small client bundle. Item order is exactly whatever order the caller
 * passed in (the existing frozen bundle sort in src/app/page.tsx) - this
 * component never reorders, filters, or re-fetches anything.
 *
 * Layout: on mobile (below the `lg` breakpoint) this renders as a plain
 * vertical accordion - a compact row followed immediately by its own detail
 * when selected, single-open only. On desktop (`lg:` and up) the SAME DOM
 * nodes are repositioned with CSS Grid explicit placement into a two-column
 * "row list (~44%) + selected detail pane (~56%)" layout, without rendering
 * anything twice: each row keeps an explicit `lg:row-start-N` so the list in
 * column 1 stays a clean stack regardless of where the (single, conditionally
 * rendered) detail node sits in DOM order, and the detail itself is pulled
 * into column 2 via `lg:col-start-2 lg:row-span-full`.
 */
export function Watchlist({ items, defaultSelectedKey }: { items: WatchlistItem[]; defaultSelectedKey: string }) {
  const [selectedKey, setSelectedKey] = useState(defaultSelectedKey);

  return (
    <div className="lg:grid lg:grid-cols-[minmax(240px,0.44fr)_minmax(0,0.56fr)] lg:items-start lg:gap-x-10">
      {items.map((item, index) => {
        const isSelected = item.key === selectedKey;
        const detailId = `watchlist-detail-${item.key}`;
        return (
          <Fragment key={item.key}>
            <div className={`border-t border-line first:border-t-0 lg:col-start-1 ${ROW_POSITION_CLASSES[index] ?? ""}`}>
              <button
                type="button"
                onClick={() => setSelectedKey(item.key)}
                aria-expanded={isSelected}
                aria-controls={detailId}
                aria-label={item.ariaLabel}
                className={`block w-full border-l-2 py-4 pl-3 text-left transition ${isSelected ? "border-signal" : "border-transparent hover:border-line"}`}
              >
                {item.row}
              </button>
            </div>

            {isSelected ? (
              <div
                id={detailId}
                role="region"
                aria-label="선택한 신호 상세"
                className="mb-6 border-t-2 border-ink pt-4 lg:col-start-2 lg:row-start-1 lg:row-span-full lg:mb-0 lg:border-t-0 lg:pt-0"
              >
                {item.detail}
              </div>
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}
