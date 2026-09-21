import { AttributeChip, EvidenceDots } from "@/components/AttributeBundle";
import type { ArchiveSnapshotItem } from "@/services/watchlist-archive-service";

/**
 * ARCHIVE watchlist row/detail (Phase 7A). Deliberately separate from
 * WatchlistRow/SelectedSignalDetail in AttributeBundle.tsx: those render a
 * LIVE AttributeBundle; these render only already-persisted
 * WatchlistSnapshotItem fields. No evidence article images are persisted on
 * a snapshot row, so - unlike the live components - there is no thumbnail
 * here; that is an honest limitation of the append-only capture, not an
 * oversight.
 */

function formatDate(value: Date | null): string {
  return value ? value.toISOString().slice(0, 10) : "확인 불가";
}

export function ArchiveWatchlistRow({ item, position }: { item: ArchiveSnapshotItem; position: number }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-6 shrink-0 pt-0.5 text-xs font-semibold tabular-nums text-muted" aria-hidden>
        {String(position).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-base font-semibold leading-snug text-ink">{item.signalName}</div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {item.directAttributes.slice(0, 2).map((attribute) => (
            <AttributeChip key={`${attribute.type}:${attribute.value}`} attribute={attribute} />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <EvidenceDots sourceSpread={item.bundleSourceSpread} articlePresence={item.bundleArticlePresence} label={item.evidenceStrength} />
          <span>{item.bundleArticlePresence}개 기사 · {item.bundleSourceSpread}개 매체</span>
          <span>최신 {formatDate(item.latestObservedAt)}</span>
        </div>
      </div>
    </div>
  );
}

export function ArchiveSignalDetail({ item }: { item: ArchiveSnapshotItem }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold tracking-[0.12em] text-signal">캡처된 신호</p>
      <h2 className="mt-2 text-3xl font-bold leading-[1.08] text-ink md:text-4xl">{item.signalName}</h2>

      <section aria-label="캡처 당시 지표" className="mt-6 grid grid-cols-3 divide-x divide-line border-y border-line">
        <div className="min-w-0 py-3 pr-3">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-muted">관측 강도</p>
          <div className="mt-1"><EvidenceDots sourceSpread={item.bundleSourceSpread} articlePresence={item.bundleArticlePresence} label={item.evidenceStrength} /></div>
        </div>
        <div className="min-w-0 px-3 py-3">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-muted">최근 방향</p>
          <p className="mt-1 text-sm font-semibold text-ink">판단 불가</p>
          <p className="mt-0.5 text-[10px] leading-snug text-muted">조합 단위 비교값 없음</p>
        </div>
        <div className="min-w-0 py-3 pl-3">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-muted">최신 관측</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-ink">{formatDate(item.latestObservedAt)}</p>
        </div>
      </section>

      <section aria-label="캡처 당시 해석" className="mt-4 border-t border-line">
        <dl className="divide-y divide-line">
          <div className="py-3">
            <dt className="text-[11px] font-semibold tracking-[0.08em] text-signal">관측된 사실</dt>
            <dd className="mt-1 text-sm leading-relaxed text-ink">{item.observedFact}</dd>
          </div>
          <div className="py-3">
            <dt className="text-[11px] font-semibold tracking-[0.08em] text-muted">아직 확인되지 않음</dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted">{item.unknowns.join(" · ")}</dd>
          </div>
          <div className="border-l-2 border-signal py-3 pl-3">
            <dt className="text-[11px] font-semibold tracking-[0.08em] text-signal">기획 검토 질문</dt>
            <dd className="mt-1 text-sm font-semibold leading-relaxed text-ink">{item.planningQuestion}</dd>
          </div>
        </dl>
      </section>

      <p className="mt-6 text-[11px] leading-relaxed text-muted">
        이 화면은 캡처 시점에 저장된 값만 표시합니다 · 현재 매거진 데이터로 다시 계산하지 않음
      </p>
    </div>
  );
}
