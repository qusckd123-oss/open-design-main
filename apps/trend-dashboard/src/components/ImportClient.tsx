"use client";

import { useMemo, useState } from "react";
import { marketSources } from "@/config/market-sources";
import type { ImportType } from "@/config/import-mapping";

type Preview = {
  columns: string[];
  rows: Record<string, string>[];
  mapping: Record<string, string>;
  fields: Record<string, string>;
  totalRows: number;
  mappedFields: number;
  unmappedFields: string[];
  duplicateCandidates: number;
};

type ImportResult = {
  importRunId: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  skippedRows: number;
  errors: Array<{ rowNumber: number; reason: string }>;
};

export function ImportClient() {
  const [type, setType] = useState<ImportType>("MARKET");
  const [mode, setMode] = useState<"file" | "paste">("file");
  const [source, setSource] = useState("");
  const [dataDate, setDataDate] = useState(new Date().toISOString().slice(0, 10));
  const [file, setFile] = useState<File | null>(null);
  const [pasted, setPasted] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const requiredFields = useMemo(
    () => (type === "SALES" ? ["productCode", "productName", "periodDate"] : ["brand", "productName", "rank"]),
    [type]
  );

  async function requestPreview() {
    setBusy(true);
    setError(null);
    setResult(null);
    const formData = payloadFormData();
    const response = await fetch("/api/import/preview", { method: "POST", body: formData });
    const payload = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(payload.error ?? "Preview failed");
      return;
    }
    setPreview(payload);
    setMapping(payload.mapping);
  }

  async function commitImport() {
    if (!preview) return;
    setBusy(true);
    setError(null);
    const formData = payloadFormData();
    formData.set("mapping", JSON.stringify(mapping));
    const response = await fetch("/api/import/commit", { method: "POST", body: formData });
    const payload = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(payload.error ?? "Import failed");
      return;
    }
    setResult(payload);
  }

  function payloadFormData() {
    const formData = new FormData();
    formData.set("type", type);
    formData.set("source", source);
    formData.set("dataDate", dataDate);
    if (mode === "paste") formData.set("pasted", pasted);
    if (mode === "file" && file) formData.set("file", file);
    return formData;
  }

  const canPreview = Boolean(source) && (mode === "file" ? Boolean(file) : pasted.trim().length > 0);

  return (
    <div className="space-y-5">
      <ModeCard active={type === "MARKET"} title="Market Data" label="Primary" onClick={() => setType("MARKET")}>
        외부 플랫폼 랭킹 데이터를 업로드합니다. 파일에 날짜나 source가 없어도 아래 입력값으로 저장할 수 있습니다.
      </ModeCard>
      <details className="rounded border border-line bg-white" open={type === "SALES"}>
        <summary
          className="cursor-pointer px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted"
          onClick={(event) => {
            event.preventDefault();
            setType(type === "SALES" ? "MARKET" : "SALES");
          }}
        >
          향후 기능 · Sales Data (현재 메인 Dashboard 판단에서 제외)
        </summary>
        {type === "SALES" ? (
          <div className="border-t border-line p-5 text-sm text-muted">
            자사 판매 데이터 import는 유지하지만 현재 메인 Dashboard 판단에서는 제외됩니다.
          </div>
        ) : null}
      </details>

      <section className="rounded border border-line bg-white p-5 shadow-subtle">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setMode("file")} className={`rounded border px-3 py-2 text-sm font-semibold ${mode === "file" ? "border-ink bg-ink text-white" : "border-line"}`}>
            File Upload
          </button>
          <button type="button" onClick={() => setMode("paste")} className={`rounded border px-3 py-2 text-sm font-semibold ${mode === "paste" ? "border-ink bg-ink text-white" : "border-line"}`}>
            Paste Table
          </button>
        </div>
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Manual Import · 자동 collector가 아닌 수동 업로드입니다</div>
        <div className="grid gap-3 md:grid-cols-[180px_180px_1fr_140px]">
          <select className="rounded border border-line px-3 py-2 text-sm" value={source} onChange={(event) => setSource(event.target.value)}>
            <option value="" disabled>소스 선택</option>
            {marketSources.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <input className="rounded border border-line px-3 py-2 text-sm" type="date" value={dataDate} onChange={(event) => setDataDate(event.target.value)} />
          {mode === "file" ? (
            <input className="rounded border border-line px-3 py-2 text-sm" type="file" accept=".csv,.xlsx,.xls" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          ) : (
            <textarea className="min-h-28 rounded border border-line px-3 py-2 text-sm" value={pasted} onChange={(event) => setPasted(event.target.value)} placeholder={"rank\tbrand\tproductName\turl\n1\tBrand\tProduct\thttps://..."} />
          )}
          <button className="rounded bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-40" disabled={!canPreview || busy} type="button" onClick={requestPreview}>
            Preview
          </button>
        </div>
        <div className="mt-3 text-xs text-muted">Market 최소 컬럼: rank, brand, productName, url 또는 externalProductId. source/date는 화면 입력값으로 대체할 수 있습니다.</div>
        {error ? <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      </section>

      {preview ? (
        <section className="rounded border border-line bg-white p-5 shadow-subtle">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Import Preview</div>
              <h2 className="mt-1 text-xl font-semibold">{preview.totalRows.toLocaleString("ko-KR")} rows detected</h2>
            </div>
            <button className="rounded bg-signal px-4 py-2 text-sm font-semibold text-white disabled:opacity-40" disabled={busy} type="button" onClick={commitImport}>
              Import 실행
            </button>
          </div>
          <div className="mb-5 grid gap-3 md:grid-cols-5">
            <Stat label="Source" value={source} />
            <Stat label="Data Date" value={dataDate} />
            <Stat label="Columns" value={String(preview.columns.length)} />
            <Stat label="Mapped" value={String(preview.mappedFields)} />
            <Stat label="Duplicates" value={String(preview.duplicateCandidates)} />
          </div>
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
            {Object.entries(preview.fields).map(([field, label]) => (
              <label key={field} className="text-sm">
                <span className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                  {label}
                  {requiredFields.includes(field) ? <span className="text-red-600">Required</span> : null}
                </span>
                <select className="w-full rounded border border-line px-2 py-2" value={mapping[field] ?? ""} onChange={(event) => setMapping((current) => ({ ...current, [field]: event.target.value }))}>
                  <option value="">Not mapped</option>
                  {preview.columns.map((column) => <option key={column} value={column}>{column}</option>)}
                </select>
              </label>
            ))}
          </div>
          <div className="mt-5 overflow-auto rounded border border-line">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-muted">
                <tr>{preview.columns.map((column) => <th key={column} className="px-3 py-2 text-left">{column}</th>)}</tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 10).map((row, index) => (
                  <tr key={index} className="border-t border-line">
                    {preview.columns.map((column) => <td key={column} className="max-w-[220px] truncate px-3 py-2">{row[column]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {result ? (
        <section className="rounded border border-line bg-white p-5 shadow-subtle">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Import Result</div>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <Stat label="Success" value={result.successRows.toLocaleString("ko-KR")} />
            <Stat label="Failed" value={result.failedRows.toLocaleString("ko-KR")} />
            <Stat label="Skipped" value={result.skippedRows.toLocaleString("ko-KR")} />
            <Stat label="Rows" value={result.totalRows.toLocaleString("ko-KR")} />
          </div>
          {result.errors.length > 0 ? (
            <div className="mt-4 rounded border border-line bg-slate-50 p-3 text-sm">
              {result.errors.slice(0, 10).map((item) => <div key={`${item.rowNumber}-${item.reason}`}>Row {item.rowNumber}: {item.reason}</div>)}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function ModeCard({ active, title, label, children, onClick }: { active: boolean; title: string; label: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`rounded border p-5 text-left ${active ? "border-ink bg-white shadow-subtle" : "border-line bg-white"}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className="mt-2 text-xl font-semibold">{title}</div>
      <p className="mt-2 text-sm text-muted">{children}</p>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-line p-3">
      <div className="text-xs uppercase tracking-[0.12em] text-muted">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
