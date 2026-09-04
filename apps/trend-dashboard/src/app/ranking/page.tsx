import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { StatusBadge } from "@/components/StatusBadge";
import { formatChange, formatCurrency } from "@/lib/format";
import { getRankingData } from "@/services/trend-service";
import type { RankingSort } from "@/types/trend";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RankingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const data = await getRankingData({
    query: valueOf(params.q),
    category: valueOf(params.category),
    brand: valueOf(params.brand),
    status: valueOf(params.status),
    priceMin: valueOf(params.priceMin) ? Number(valueOf(params.priceMin)) : undefined,
    priceMax: valueOf(params.priceMax) ? Number(valueOf(params.priceMax)) : undefined,
    sort: (valueOf(params.sort) as RankingSort | undefined) ?? "rank"
  });

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">Legacy Ranking</p>
        <h1 className="mt-2 text-3xl font-semibold">상품 랭킹</h1>
        <p className="mt-2 text-sm text-muted">기존 Musinsa ranking 기반 화면입니다. 신규 상품기획 판단은 Sales/Market 화면을 우선 사용합니다.</p>
      </div>

      <form className="grid gap-3 rounded border border-line bg-white p-4 shadow-subtle lg:grid-cols-[1.4fr_1fr_1fr_1fr_0.8fr_0.8fr_0.8fr]">
        <input className="rounded border border-line px-3 py-2 text-sm" name="q" placeholder="브랜드, 상품 검색" defaultValue={valueOf(params.q)} />
        <select className="rounded border border-line px-3 py-2 text-sm" name="category" defaultValue={valueOf(params.category) ?? ""}>
          <option value="">카테고리 전체</option>
          {data.facets.categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
        <select className="rounded border border-line px-3 py-2 text-sm" name="brand" defaultValue={valueOf(params.brand) ?? ""}>
          <option value="">브랜드 전체</option>
          {data.facets.brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
        </select>
        <select className="rounded border border-line px-3 py-2 text-sm" name="status" defaultValue={valueOf(params.status) ?? ""}>
          <option value="">상태 전체</option>
          <option value="SURGING">급상승</option>
          <option value="NEW_ENTRY">신규진입</option>
          <option value="STEADY_RISING">지속상승</option>
          <option value="STABLE">유지</option>
          <option value="DECLINING">하락</option>
          <option value="INSUFFICIENT_DATA">데이터 부족</option>
        </select>
        <input className="rounded border border-line px-3 py-2 text-sm" name="priceMin" placeholder="최저가" defaultValue={valueOf(params.priceMin)} />
        <input className="rounded border border-line px-3 py-2 text-sm" name="priceMax" placeholder="최고가" defaultValue={valueOf(params.priceMax)} />
        <select className="rounded border border-line px-3 py-2 text-sm" name="sort" defaultValue={valueOf(params.sort) ?? "rank"}>
          <option value="rank">현재 랭킹</option>
          <option value="change1d">1D 상승</option>
          <option value="change3d">3D 상승</option>
          <option value="change7d">7D 상승</option>
          <option value="reviews">리뷰수</option>
          <option value="price">가격</option>
        </select>
        <button className="rounded bg-ink px-4 py-2 text-sm font-semibold text-white lg:col-start-7" type="submit">적용</button>
      </form>

      <div className="overflow-hidden rounded border border-line bg-white shadow-subtle">
        <table className="w-full min-w-[1120px] border-collapse text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-muted">
            <tr>{["현재순위", "변동", "이미지", "브랜드", "상품명", "카테고리", "판매가", "할인율", "리뷰", "1D", "3D", "7D", "상태"].map((head) => <th key={head} className="border-b border-line px-3 py-3 text-left font-semibold">{head}</th>)}</tr>
          </thead>
          <tbody>
            {data.products.map((product) => (
              <tr key={product.id} className="border-b border-line last:border-b-0 hover:bg-slate-50">
                <td className="px-3 py-3 font-semibold">{product.currentRank}</td>
                <td className="px-3 py-3 text-rise">{formatChange(product.rankChange1d)}</td>
                <td className="px-3 py-3"><ProductImage src={product.imageUrl} alt={product.name} size="sm" /></td>
                <td className="px-3 py-3 font-semibold">{product.brand}</td>
                <td className="px-3 py-3"><Link className="line-clamp-2 max-w-[260px] hover:text-signal" href={`/products/${product.id}`}>{product.name}</Link></td>
                <td className="px-3 py-3 text-muted">{product.category}</td>
                <td className="px-3 py-3">{formatCurrency(product.salePrice)}</td>
                <td className="px-3 py-3">{product.discountRate ?? 0}%</td>
                <td className="px-3 py-3">{product.reviewCount?.toLocaleString("ko-KR") ?? "-"}</td>
                <td className="px-3 py-3">{formatChange(product.rankChange1d)}</td>
                <td className="px-3 py-3">{formatChange(product.rankChange3d)}</td>
                <td className="px-3 py-3">{formatChange(product.rankChange7d)}</td>
                <td className="px-3 py-3"><StatusBadge status={product.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
