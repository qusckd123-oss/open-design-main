"use client";

import { useState } from "react";
import { mutateLook } from "./actions";

type Account = { id: string; platform: string; handle: string; active: boolean };
const field = "w-full border border-line bg-white px-3 py-2 text-sm";
const button = "bg-ink px-4 py-2 text-sm font-semibold text-white";

export function LookPostForm({ accounts }: { accounts: Account[] }) {
  const [accountId, setAccountId] = useState("");
  const [rows, setRows] = useState([0]);
  const [nextRow, setNextRow] = useState(1);
  const platform = accounts.find((account) => account.id === accountId)?.platform;

  return <form action={mutateLook} className="grid gap-4 border border-line bg-white p-5">
    <input type="hidden" name="operation" value="observation-create" />
    <div className="grid gap-3 md:grid-cols-2">
      <label>1 · 소스 계정<select required name="accountId" value={accountId} onChange={(event) => setAccountId(event.target.value)} className={field}>
        <option value="">선택</option>{accounts.filter((account) => account.active).map((account) => <option key={account.id} value={account.id}>{account.platform} · {account.platform === "INSTAGRAM" ? "@" : ""}{account.handle}</option>)}
      </select></label>
      <label>2 · 관측 유형<select required name="observationType" className={field} key={platform ?? "none"} defaultValue="">
        <option value="">선택</option>
        {platform === "INSTAGRAM" ? <><option value="REAL_WEAR">실착 · 실제 사람이 입은 착장</option><option value="CURATED_LOOK">큐레이션 · 코디 모음/추천</option></> : null}
        {platform && platform !== "INSTAGRAM" ? <option value="STYLE_MEDIA">스타일 미디어 · 웹 코디 콘텐츠</option> : null}
      </select></label>
      <label className="md:col-span-2">3 · 정확한 게시물 URL<input required name="postUrl" type="url" placeholder={platform === "INSTAGRAM" ? "https://www.instagram.com/p/.../" : "https://www.musinsa.com/content/..."} className={field} /></label>
      <label>4 · 발행일 (알 때만)<input name="publishedAt" type="date" className={field} /></label>
      <label>5 · 직접 확인한 캡션 (선택)<input name="captionText" className={field} /></label>
    </div>
    <div className="border-t border-line pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">6 · 이 게시물의 이미지</p><span className="text-xs text-muted">등록 순서대로 #0, #1… 자동 지정 · 최대 10장</span></div>
      <div className="mt-3 space-y-2">{rows.map((key, index) => <div key={key} className="flex gap-2"><label className="min-w-0 flex-1"><span className="sr-only">이미지 #{index} URL</span><input required name="imageUrl" type="url" placeholder={`이미지 #${index} URL`} className={field} /></label>{rows.length > 1 ? <button type="button" onClick={() => setRows((current) => current.filter((row) => row !== key))} className="border border-line px-3 text-sm" aria-label={`이미지 #${index} 제거`}>제거</button> : null}</div>)}</div>
      <button type="button" disabled={rows.length >= 10} onClick={() => { setRows((current) => [...current, nextRow]); setNextRow((current) => current + 1); }} className="mt-3 border border-line px-4 py-2 text-sm disabled:opacity-50">+ 이미지 추가</button>
    </div>
    <p className="text-xs text-muted">한 게시물의 이미지가 하나의 작업으로 저장됩니다. 이미지 URL은 직접 확인한 공개 URL만 사용하며, 외부 CDN 주소는 만료될 수 있습니다.</p>
    <button className={`${button} justify-self-start`}>PENDING 관측 일괄 등록</button>
  </form>;
}
