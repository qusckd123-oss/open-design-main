import Link from "next/link";
import { ImportClient } from "@/components/ImportClient";
import { formatDateTime } from "@/lib/format";
import { getImportRuns } from "@/services/business-analytics-service";

export default async function ImportPage() {
  const runs = await getImportRuns();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-signal">DATA MANAGEMENT</p>
        <h1 className="mt-2 text-3xl font-semibold">데이터 관리</h1>
        <p className="mt-2 text-sm text-muted">CSV/XLSX 파일을 미리보기한 뒤 컬럼 매핑을 확인하고 DB에 저장합니다.</p>
      </div>
      <section className="rounded border border-line bg-white p-5 shadow-subtle">
        <div className="text-xs font-semibold text-muted">템플릿 (Market Manual Import)</div>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <Link className="rounded border border-line px-3 py-2 font-semibold" href="/templates/market-import-template.csv">Market CSV</Link>
          <Link className="rounded border border-line px-3 py-2 font-semibold" href="/templates/market-import-template.xlsx">Market XLSX</Link>
        </div>
        <details className="mt-4">
          <summary className="cursor-pointer text-xs font-semibold text-muted">향후 기능 · Sales Import 템플릿</summary>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link className="rounded border border-line px-3 py-2 font-semibold text-muted" href="/templates/sales-import-template.csv">Sales CSV</Link>
            <Link className="rounded border border-line px-3 py-2 font-semibold text-muted" href="/templates/sales-import-template.xlsx">Sales XLSX</Link>
          </div>
        </details>
      </section>
      <ImportClient />
      <section className="rounded border border-line bg-white p-5 shadow-subtle">
        <div className="text-xs font-semibold text-muted">최근 데이터 작업</div>
        <div className="mt-4 overflow-auto">
          <table className="w-full min-w-[840px] text-sm">
            <thead className="bg-slate-50 text-xs text-muted">
              <tr>{["유형", "소스", "파일", "상태", "전체", "성공", "실패", "스킵", "완료"].map((head) => <th key={head} className="border-b border-line px-3 py-2 text-left">{head}</th>)}</tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} className="border-b border-line last:border-b-0">
                  <td className="px-3 py-3 font-semibold">{run.type}</td>
                  <td className="px-3 py-3">{run.source}</td>
                  <td className="px-3 py-3 text-muted">{run.fileName ?? "-"}</td>
                  <td className="px-3 py-3 font-semibold">{run.status}</td>
                  <td className="px-3 py-3">{run.totalRows}</td>
                  <td className="px-3 py-3">{run.successRows}</td>
                  <td className="px-3 py-3">{run.failedRows}</td>
                  <td className="px-3 py-3">{run.skippedRows}</td>
                  <td className="px-3 py-3">{formatDateTime(run.completedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
