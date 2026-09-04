import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { formatCurrency } from "@/lib/format";
import { getCategoryAnalysis } from "@/services/trend-service";

export default async function CategoriesPage() {
  const categories = await getCategoryAnalysis();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">Category Analysis</p>
        <h1 className="mt-2 text-3xl font-semibold">카테고리별 트렌드</h1>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {categories.map((category) => (
          <section key={category.category} className="rounded border border-line bg-white p-5 shadow-subtle">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">{category.category}</h2>
                <p className="mt-1 text-sm text-muted">상품 {category.total}개 · 급상승 {category.risingCount}개</p>
              </div>
              <div className="text-right text-sm">
                <div>평균가 {formatCurrency(category.avgPrice)}</div>
                <div className="text-muted">평균 할인 {category.avgDiscount}%</div>
              </div>
            </div>
            {category.topProduct ? (
              <Link className="mt-5 flex gap-4 rounded border border-line p-3 hover:border-signal" href={`/products/${category.topProduct.id}`}>
                <ProductImage src={category.topProduct.imageUrl} alt={category.topProduct.name} />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{category.topProduct.brand}</div>
                  <div className="mt-1 font-semibold">{category.topProduct.name}</div>
                  <div className="mt-3 text-sm text-muted">TOP 상품 · 현재 {category.topProduct.currentRank}위</div>
                </div>
              </Link>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}
