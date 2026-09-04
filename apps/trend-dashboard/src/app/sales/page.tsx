import { ProductImage } from "@/components/ProductImage";
import { formatCurrency, formatNumber, formatPercentChange, formatPercentValue } from "@/lib/format";
import { getSalesRows } from "@/services/business-analytics-service";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SalesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const data = await getSalesRows({
    q: valueOf(params.q),
    category: valueOf(params.category),
    season: valueOf(params.season),
    signal: valueOf(params.signal),
    sort: valueOf(params.sort)
  });

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">Sales</p>
        <h1 className="mt-2 text-3xl font-semibold">자사 판매 상품</h1>
        <p className="mt-2 text-sm text-muted">주차별 판매량, 판매율, 재고 수준으로 자사 상품의 현재 반응을 확인합니다.</p>
      </div>

      <form className="grid gap-3 rounded border border-line bg-white p-4 shadow-subtle lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_120px]">
        <input className="rounded border border-line px-3 py-2 text-sm" name="q" placeholder="품번, 상품명, 브랜드 검색" defaultValue={valueOf(params.q)} />
        <select className="rounded border border-line px-3 py-2 text-sm" name="category" defaultValue={valueOf(params.category) ?? ""}>
          <option value="">Category 전체</option>
          {data.facets.categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
        <select className="rounded border border-line px-3 py-2 text-sm" name="season" defaultValue={valueOf(params.season) ?? ""}>
          <option value="">Season 전체</option>
          {data.facets.seasons.map((season) => <option key={season} value={season}>{season}</option>)}
        </select>
        <select className="rounded border border-line px-3 py-2 text-sm" name="signal" defaultValue={valueOf(params.signal) ?? ""}>
          <option value="">Signal 전체</option>
          {data.facets.signals.map((signal) => <option key={signal} value={signal}>{signal}</option>)}
        </select>
        <select className="rounded border border-line px-3 py-2 text-sm" name="sort" defaultValue={valueOf(params.sort) ?? "salesQty"}>
          <option value="salesQty">판매수량</option>
          <option value="change1w">1W 상승률</option>
          <option value="change4w">4W 상승률</option>
          <option value="sellThrough">판매율</option>
          <option value="stock">재고</option>
        </select>
        <button className="rounded bg-ink px-4 py-2 text-sm font-semibold text-white" type="submit">적용</button>
      </form>

      <div className="overflow-hidden rounded border border-line bg-white shadow-subtle">
        <table className="w-full min-w-[1180px] border-collapse text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-muted">
            <tr>{["Image", "Product", "Category", "Item", "Sales Qty", "Amount", "Stock", "Sell Through", "1W", "4W", "Signal", "Mode"].map((head) => <th key={head} className="border-b border-line px-3 py-3 text-left font-semibold">{head}</th>)}</tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.id} className="border-b border-line last:border-b-0 hover:bg-slate-50">
                <td className="px-3 py-3"><ProductImage src={row.imageUrl} alt={row.productName} size="sm" /></td>
                <td className="px-3 py-3"><div className="font-semibold">{row.productName}</div><div className="text-xs text-muted">{row.productCode} · {row.brand ?? "-"}</div></td>
                <td className="px-3 py-3 text-muted">{row.category ?? "-"}</td>
                <td className="px-3 py-3">{row.itemType ?? "-"}</td>
                <td className="px-3 py-3 font-semibold">{formatNumber(row.salesQty)}</td>
                <td className="px-3 py-3">{formatCurrency(row.salesAmount)}</td>
                <td className="px-3 py-3">{formatNumber(row.stockQty)}</td>
                <td className="px-3 py-3">{formatPercentValue(row.sellThroughRate)}</td>
                <td className="px-3 py-3">{formatPercentChange(row.change1w)}</td>
                <td className="px-3 py-3">{formatPercentChange(row.change4w)}</td>
                <td className="px-3 py-3 font-semibold">{row.signal}</td>
                <td className="px-3 py-3 text-muted">{row.dataMode.toUpperCase()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
