"use client";

import { useEffect, useRef, useState } from "react";
import { mutateLook } from "./actions";
import type { BulkReviewGender } from "@/lib/look-bulk-review";

export type ReviewGalleryRow = {
  id: string;
  imageUrl: string;
  imageIndex: number;
  postUrl: string;
  sourceHandle: string;
  platform: string;
  observationType: "REAL_WEAR" | "CURATED_LOOK" | "STYLE_MEDIA" | null;
  reviewStatus: "PENDING" | "APPROVED" | "REJECTED";
  genderCandidate: BulkReviewGender;
  publishedAt: string | null;
  observedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  tags: Array<{ dimension: string; value: string }>;
};

const typeLabels = { REAL_WEAR: "실착", CURATED_LOOK: "큐레이션", STYLE_MEDIA: "스타일 미디어" } as const;
const statuses = ["PENDING", "APPROVED", "REJECTED", "전체"] as const;
const types = ["전체", "REAL_WEAR", "CURATED_LOOK", "STYLE_MEDIA"] as const;
const genders = ["전체", "MEN", "WOMEN", "UNKNOWN"] as const;
const field = "min-h-11 rounded-sm border border-line bg-white px-3 py-2 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal";

function dateLabel(value: string | null): string {
  if (!value) return "미상";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeZone: "Asia/Seoul" }).format(new Date(value));
}

export function LookReviewGallery({ observations }: { observations: ReviewGalleryRow[] }) {
  const [status, setStatus] = useState<(typeof statuses)[number]>("PENDING");
  const [type, setType] = useState<(typeof types)[number]>("전체");
  const [genderFilter, setGenderFilter] = useState<(typeof genders)[number]>("전체");
  const [selected, setSelected] = useState<string[]>([]);
  const [assignments, setAssignments] = useState<Record<string, BulkReviewGender>>({});
  const [preview, setPreview] = useState<ReviewGalleryRow | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!preview) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setPreview(null); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [preview]);

  const visible = observations.filter((row) =>
    (status === "전체" || row.reviewStatus === status) &&
    (type === "전체" || row.observationType === type) &&
    (genderFilter === "전체" || (assignments[row.id] ?? row.genderCandidate) === genderFilter)
  );
  const visiblePendingIds = visible.filter((row) => row.reviewStatus === "PENDING").map((row) => row.id);
  const selectedRows = observations.filter((row) => row.reviewStatus === "PENDING" && selected.includes(row.id));
  const unresolved = selectedRows.filter((row) => (assignments[row.id] ?? row.genderCandidate) === "UNKNOWN").length;
  const reviewRows = JSON.stringify(selectedRows.map((row) => ({ id: row.id, gender: assignments[row.id] ?? row.genderCandidate })));

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  function assign(gender: "MEN" | "WOMEN") {
    setAssignments((current) => Object.fromEntries(selectedRows.map((row) => [row.id, gender]).concat(
      Object.entries(current).filter(([id]) => !selected.includes(id))
    )) as Record<string, BulkReviewGender>);
  }

  return <section aria-labelledby="review-gallery-title" className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-ink pb-4">
      <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">VISUAL REVIEW / HUMAN DECISION</p><h2 id="review-gallery-title" className="mt-1 text-2xl font-semibold tracking-tight">1. 착장 검토 갤러리</h2><p className="mt-2 text-sm text-muted">이미지를 크게 확인하고, 선택한 관측만 한 번에 검토합니다. 승인해도 클러스터 승인 전에는 공개되지 않습니다.</p></div>
      <p className="text-sm font-semibold text-ink">검토 대기 {observations.filter((row) => row.reviewStatus === "PENDING").length}건</p>
    </div>

    <div className="grid gap-3 border border-line bg-[#f0f1ef] p-4 sm:grid-cols-3">
      <label className="grid gap-1 text-xs font-semibold">상태<select className={field} value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>{statuses.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <label className="grid gap-1 text-xs font-semibold">관측 유형<select className={field} value={type} onChange={(event) => setType(event.target.value as typeof type)}>{types.map((value) => <option key={value} value={value}>{value === "전체" ? value : typeLabels[value]}</option>)}</select></label>
      <label className="grid gap-1 text-xs font-semibold">성별<select className={field} value={genderFilter} onChange={(event) => setGenderFilter(event.target.value as typeof genderFilter)}>{genders.map((value) => <option key={value}>{value}</option>)}</select></label>
    </div>

    <form action={mutateLook} className="sticky top-[4.5rem] z-10 flex flex-wrap items-end gap-3 border border-ink bg-white/95 p-4 shadow-subtle backdrop-blur">
      <input type="hidden" name="operation" value="observation-review-bulk" />
      <input type="hidden" name="reviewRows" value={reviewRows} />
      <label className="grid min-w-44 flex-1 gap-1 text-xs font-semibold">검토자 이름<input name="reviewerName" required maxLength={80} className={field} placeholder="한 번만 입력" /></label>
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-20 text-sm font-semibold" aria-live="polite">선택 {selectedRows.length}건</span>
        <button type="button" className="min-h-11 border border-line px-3 text-sm" onClick={() => setSelected((current) => [...new Set([...current, ...visiblePendingIds])])}>전체 선택</button>
        <button type="button" className="min-h-11 border border-line px-3 text-sm" onClick={() => setSelected([])}>선택 해제</button>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={!selectedRows.length} className="min-h-11 border border-line px-3 text-sm disabled:opacity-40" onClick={() => assign("MEN")}>MEN 지정</button>
        <button type="button" disabled={!selectedRows.length} className="min-h-11 border border-line px-3 text-sm disabled:opacity-40" onClick={() => assign("WOMEN")}>WOMEN 지정</button>
        <button name="status" value="APPROVED" disabled={!selectedRows.length || unresolved > 0} className="min-h-11 bg-ink px-4 text-sm font-semibold text-white disabled:opacity-40">선택 승인</button>
        <button name="status" value="REJECTED" disabled={!selectedRows.length} onClick={(event) => { if (selectedRows.length > 1 && !window.confirm(`${selectedRows.length}건을 반려하시겠습니까?`)) event.preventDefault(); }} className="min-h-11 border border-ink px-4 text-sm font-semibold disabled:opacity-40">선택 반려</button>
      </div>
      {selectedRows.length > 0 && unresolved > 0 ? <p className="w-full text-xs text-muted">승인 전 성별 지정 필요: {unresolved}건 · 반려에는 성별 지정이 필요하지 않습니다.</p> : null}
    </form>

    {visible.length ? <div className="grid max-w-[1160px] gap-5 md:grid-cols-2 xl:grid-cols-3">{visible.map((row) => {
      const pending = row.reviewStatus === "PENDING";
      const currentGender = assignments[row.id] ?? row.genderCandidate;
      return <article key={row.id} className={`min-w-0 overflow-hidden border bg-white ${selected.includes(row.id) && pending ? "border-ink ring-2 ring-ink" : "border-line"}`}>
        <div className="relative">
          <button type="button" aria-label={`${row.sourceHandle} 이미지 크게 보기`} onClick={() => setPreview(row)} className="block aspect-[4/5] w-full bg-[#e7e6e1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-signal">
            {/* eslint-disable-next-line @next/next/no-img-element */}<img src={row.imageUrl} alt={`${row.sourceHandle} 착장 관측 이미지 #${row.imageIndex}`} loading="lazy" className="h-full w-full object-contain" />
          </button>
          {pending ? <label className="absolute left-3 top-3 flex min-h-11 cursor-pointer items-center gap-2 bg-white/95 px-3 text-sm font-semibold shadow-subtle"><input type="checkbox" checked={selected.includes(row.id)} onChange={() => toggle(row.id)} className="h-5 w-5 accent-ink" />선택</label> : null}
          <span className="absolute bottom-3 right-3 bg-ink/90 px-2 py-1 text-xs font-semibold text-white">#{row.imageIndex}</span>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold">{row.platform === "INSTAGRAM" ? "@" : ""}{row.sourceHandle}</span><span className="border border-line px-2 py-0.5 text-[11px] font-semibold">{row.observationType ? typeLabels[row.observationType] : "유형 미분류"}</span><span className={`px-2 py-0.5 text-[11px] font-semibold ${pending ? "bg-[#f0ebdc]" : row.reviewStatus === "APPROVED" ? "bg-[#e1ede8]" : "bg-[#eee6e6]"}`}>{row.reviewStatus}</span></div>
          <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs"><div><dt className="text-muted">발행</dt><dd>{dateLabel(row.publishedAt)}</dd></div><div><dt className="text-muted">관측</dt><dd>{dateLabel(row.observedAt)}</dd></div><div><dt className="text-muted">성별 {pending && assignments[row.id] ? "· 이번 검토 지정" : "· 현재"}</dt><dd className="font-semibold">{currentGender}</dd></div>{row.reviewedAt ? <div><dt className="text-muted">검토</dt><dd>{dateLabel(row.reviewedAt)}</dd></div> : null}</dl>
          {row.reviewedBy ? <p className="text-xs text-muted">검토자 · {row.reviewedBy}</p> : null}
          {row.tags.length ? <p className="text-xs text-muted">검토 태그 · {row.tags.map((tag) => `${tag.dimension} ${tag.value}`).join(" · ")}</p> : null}
          <a href={row.postUrl} target="_blank" rel="noreferrer" className="block break-all border-t border-line pt-3 text-xs font-semibold text-signal underline underline-offset-2">원본 게시물 ↗</a>
        </div>
      </article>;
    })}</div> : <p className="border border-line bg-white p-8 text-sm text-muted">선택한 조건에 해당하는 관측이 없습니다.</p>}

    {preview ? <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreview(null); }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 sm:p-8">
      <div role="dialog" aria-modal="true" aria-label={`${preview.sourceHandle} 이미지 미리보기`} className="flex max-h-full max-w-full flex-col gap-3">
        <div className="flex items-center justify-between gap-4 text-sm text-white"><span>{preview.sourceHandle} · #{preview.imageIndex}</span><button ref={closeRef} type="button" onClick={() => setPreview(null)} aria-label="미리보기 닫기" className="min-h-11 min-w-11 border border-white/50 text-2xl">×</button></div>
        {/* eslint-disable-next-line @next/next/no-img-element */}<img src={preview.imageUrl} alt={`${preview.sourceHandle} 확대 이미지`} className="max-h-[calc(100vh-10rem)] max-w-[calc(100vw-2rem)] object-contain" />
        <a href={preview.postUrl} target="_blank" rel="noreferrer" className="self-start text-sm font-semibold text-white underline underline-offset-4">원본 게시물 열기 ↗</a>
      </div>
    </div> : null}
  </section>;
}
