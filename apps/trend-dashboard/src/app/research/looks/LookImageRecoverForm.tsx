"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const field = "w-full border border-line bg-white px-3 py-2 text-sm";
const button = "bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";
const MAX_BYTES = 15 * 1024 * 1024;

function formatSize(bytes: number) { return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`; }

/** Uploads the image FILE (multipart) so the server never has to fetch an expiring Instagram CDN URL. */
export function LookImageRecoverForm({ observationId, handle, imageIndex, postUrl }: { observationId: string; handle: string; imageIndex: number; postUrl: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const tooBig = file ? file.size > MAX_BYTES : false;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || tooBig) return;
    setBusy(true); setMessage(null);
    try {
      const body = new FormData();
      body.set("observationId", observationId);
      body.set("file", file);
      const response = await fetch("/api/look-images/recover", { method: "POST", body });
      const result = await response.json().catch(() => null) as { ok?: boolean; message?: string } | null;
      setMessage(result?.message ?? (response.ok ? "복구했습니다." : "복구하지 못했습니다."));
      if (response.ok) router.refresh();
    } catch { setMessage("업로드하지 못했습니다. 네트워크를 확인하세요."); }
    finally { setBusy(false); }
  }

  return <form onSubmit={submit} className="grid gap-2 border border-line p-3 md:grid-cols-[1fr_2fr_auto]">
    <p className="min-w-0 break-all text-xs font-semibold">{handle} · #{imageIndex}<br /><a href={postUrl} target="_blank" rel="noreferrer" className="font-normal underline">원본 게시물 ↗</a><br /><span className="font-normal text-muted">{postUrl}</span></p>
    <div className="min-w-0">
      <input required type="file" accept="image/jpeg,image/png,image/webp" aria-label={`${handle} #${imageIndex} 이미지 파일`} className={field}
        onChange={(event) => { setFile(event.target.files?.[0] ?? null); setMessage(null); }} />
      <p className="mt-1 break-all text-xs text-muted">{file ? <>{file.name} · {formatSize(file.size)}{tooBig ? " · 15MB 초과" : ""}</> : "JPEG · PNG · WebP, 최대 15MB"}</p>
      {message ? <p role="status" className="mt-1 text-xs">{message}</p> : null}
    </div>
    <button disabled={!file || tooBig || busy} className={button}>{busy ? "업로드 중…" : "영구 이미지 복구"}</button>
  </form>;
}
