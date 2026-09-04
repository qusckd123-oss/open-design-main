import Link from "next/link";
import { formatPercent } from "@/lib/search-trend-signals";
import type { KeywordTrendRow } from "@/types/search-trend";

export function SearchTrendTable({ rows, compact = false }: { rows: KeywordTrendRow[]; compact?: boolean }) {
  return (
    <div className="overflow-hidden rounded border border-line bg-white shadow-subtle">
      <table className="w-full min-w-[980px] border-collapse text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-muted">
          <tr>
            {["Keyword", "Category", "13-18 4W", "19-24 4W", "25-29 4W", "Teen Shopping", "20s Shopping", "Signal", "Target"].map((head) => (
              <th key={head} className="border-b border-line px-3 py-3 text-left font-semibold">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-line last:border-b-0 hover:bg-slate-50">
              <td className="px-3 py-3 font-semibold">
                <Link className="hover:text-signal" href={`/trends/${row.id}`}>
                  {row.name}
                </Link>
              </td>
              <td className="px-3 py-3 text-muted">{row.category}</td>
              <td className={changeClass(row.searchMomentumByAge["13-18"].change4w)}>{formatPercent(row.searchMomentumByAge["13-18"].change4w)}</td>
              <td className={changeClass(row.searchMomentumByAge["19-24"].change4w)}>{formatPercent(row.searchMomentumByAge["19-24"].change4w)}</td>
              <td className={changeClass(row.searchMomentumByAge["25-29"].change4w)}>{formatPercent(row.searchMomentumByAge["25-29"].change4w)}</td>
              <td className="px-3 py-3">{formatRatio(row.shoppingByAge["10-19"].current)}</td>
              <td className="px-3 py-3">{formatRatio(row.shoppingByAge["20-29"].current)}</td>
              <td className="px-3 py-3">
                <span className="inline-flex rounded border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700">
                  {row.signal}
                </span>
              </td>
              <td className="px-3 py-3 text-xs font-semibold">{row.targetAgeSignal}</td>
            </tr>
          ))}
          {!compact && rows.length === 0 ? (
            <tr>
              <td className="px-3 py-8 text-center text-muted" colSpan={9}>
                검색 트렌드 데이터가 없습니다.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function formatRatio(value: number | null) {
  return value == null ? "-" : value.toFixed(1);
}

function changeClass(value: number | null) {
  if (value == null) return "px-3 py-3 text-muted";
  return value >= 0 ? "px-3 py-3 font-semibold text-rise" : "px-3 py-3 font-semibold text-fall";
}
