import Link from "next/link";
import { ArchiveSignalDetail, ArchiveWatchlistRow } from "@/components/ArchiveWatchlist";
import { Watchlist, type WatchlistItem } from "@/components/Watchlist";
import { BUSINESS_TIME_ZONE } from "@/lib/business-time";
import { getArchiveSnapshotDetail, listArchiveDates, listCapturesForDate, selectCaptureFromHeaders } from "@/services/watchlist-archive-service";

/**
 * WATCHLIST ARCHIVE (Phase 7A) - "what did the Watchlist actually show on a
 * past capture/date?" This route reads ONLY persisted WatchlistSnapshot /
 * WatchlistSnapshotItem rows (watchlist-archive-service.ts). It never calls
 * getAttributeBundles or any live resolver, and never imports
 * attribute-bundle-service - a historical date is answered exclusively from
 * what was actually captured that day, never recalculated from today's
 * (mutable) EditorialPost/EditorialMention rows.
 *
 * Scope is fixed to the same (dataMode="real", gender="all") default the
 * scheduled capture itself always uses - the same scope Home's Watchlist
 * shows by default - so a planner comparing CURRENT vs ARCHIVE is comparing
 * like with like. A future pass could add gender/dataMode switches once more
 * than one scope is actually being captured.
 */

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const capturedAtFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23"
});

function formatCapturedAt(value: Date): string {
  return `${capturedAtFormatter.format(value)} KST`;
}

const triggeredByLabel: Record<string, string> = {
  scheduled: "예약 실행",
  manual: "수동 실행"
};

export default async function ArchivePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const dateSummaries = await listArchiveDates();

  let body: React.ReactNode = <EmptyArchiveState />;
  if (dateSummaries.length > 0) {
    const requestedDate = valueOf(params.date);
    // Invalid/nonexistent ?date= falls back to the newest available date -
    // never a server error, never a fabricated placeholder date.
    const selectedDateSummary = dateSummaries.find((summary) => summary.businessDate === requestedDate) ?? dateSummaries[0]!;

    const captures = await listCapturesForDate(selectedDateSummary.businessDate);
    const requestedCaptureId = valueOf(params.capture) ?? null;
    const selectedHeader = selectCaptureFromHeaders(captures, requestedCaptureId) ?? selectedDateSummary.latest;
    const detail = await getArchiveSnapshotDetail(selectedHeader.id);

    const watchlistItems: WatchlistItem[] = (detail?.items ?? []).map((item, index) => ({
      key: item.bundleKey,
      ariaLabel: `${index + 1}번째 캡처된 신호: ${item.signalName}`,
      row: <ArchiveWatchlistRow item={item} position={index + 1} />,
      detail: <ArchiveSignalDetail item={item} />
    }));
    const defaultWatchlistKey = watchlistItems[0]?.key ?? "";

    body = (
      <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Business Date</p>
          <nav className="mt-3 flex flex-col gap-1" aria-label="아카이브 날짜 선택">
            {dateSummaries.map((summary) => {
              const isSelected = summary.businessDate === selectedDateSummary.businessDate;
              return (
                <Link
                  key={summary.businessDate}
                  href={`/archive?date=${summary.businessDate}`}
                  className={`rounded px-2 py-2 text-sm font-semibold transition ${isSelected ? "bg-ink text-canvas" : "text-ink hover:bg-slate-100"}`}
                  aria-current={isSelected ? "date" : undefined}
                >
                  {summary.businessDate}
                  {summary.captureCount > 1 ? <span className={`ml-1.5 text-xs font-normal ${isSelected ? "text-canvas/70" : "text-muted"}`}>· {summary.captureCount}회 캡처</span> : null}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line pb-4 text-xs text-muted">
            <span className="text-sm font-semibold text-ink">{selectedDateSummary.businessDate}</span>
            <span>캡처 시각 {formatCapturedAt(selectedHeader.capturedAt)}</span>
            <span>{triggeredByLabel[selectedHeader.triggeredBy] ?? selectedHeader.triggeredBy}</span>
            <span>algorithm {selectedHeader.algorithmVersion}</span>
            <span>{selectedHeader.itemCount}개 신호</span>
          </div>

          {captures.length > 1 ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-muted">이 날짜의 캡처 {captures.length}건:</span>
              {captures.map((capture, index) => {
                const isSelected = capture.id === selectedHeader.id;
                return (
                  <Link
                    key={capture.id}
                    href={`/archive?date=${selectedDateSummary.businessDate}&capture=${capture.id}`}
                    className={`rounded-full border px-2.5 py-1 font-semibold ${isSelected ? "border-ink bg-ink text-canvas" : "border-line text-muted hover:text-ink"}`}
                  >
                    {index === 0 ? "최신" : `#${captures.length - index}`} · {formatCapturedAt(capture.capturedAt)}
                  </Link>
                );
              })}
            </div>
          ) : null}

          <div className="mt-8">
            {watchlistItems.length > 0 ? (
              <Watchlist items={watchlistItems} defaultSelectedKey={defaultWatchlistKey} />
            ) : (
              <p className="border-t border-line pt-4 text-sm font-semibold text-muted">이 캡처에는 저장된 신호가 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="border-b border-line pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-signal">Archive</p>
        <h1 className="mt-2 text-4xl font-semibold leading-tight text-ink md:text-5xl">워치리스트 아카이브</h1>
        <p className="mt-4 max-w-2xl text-sm text-muted">
          과거 특정 시점에 캡처되어 저장된 워치리스트 기록입니다. 지금 다시 계산한 값이 아니라, 그 시점에 실제로 화면에 보였던 값을 그대로 보여줍니다.
        </p>
        <p className="mt-2 text-xs font-semibold text-muted">스냅샷 기록은 캡처가 시작된 날짜부터 제공됩니다 · 과거 기록을 임의로 만들어 채우지 않습니다.</p>
      </section>

      {body}
    </div>
  );
}

function EmptyArchiveState() {
  return (
    <div className="mt-10 border-t border-line pt-10">
      <p className="text-sm font-semibold text-ink">아직 저장된 아카이브 기록이 없습니다.</p>
      <p className="mt-2 max-w-xl text-sm text-muted">
        스냅샷 캡처가 시작된 이후부터 기록이 쌓입니다. 과거 날짜의 기록을 추정해서 채우지 않습니다.
      </p>
    </div>
  );
}
