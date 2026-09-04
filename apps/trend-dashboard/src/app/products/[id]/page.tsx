import { notFound } from "next/navigation";
import { ProductImage } from "@/components/ProductImage";
import { RankingHistoryChart } from "@/components/RankingHistoryChart";
import { StatusBadge } from "@/components/StatusBadge";
import { formatChange, formatCurrency } from "@/lib/format";
import { getProductDetail } from "@/services/product-service";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const detail = await getProductDetail(id);
  if (!detail) notFound();

  return (
    <div className="space-y-6">
      <section className="rounded border border-line bg-white p-6 shadow-subtle">
        <div className="flex flex-col gap-6 lg:flex-row">
          <ProductImage src={detail.product.imageUrl} alt={detail.product.name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={detail.status} />
              <span className="text-sm text-muted">{detail.product.category}</span>
            </div>
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.12em] text-muted">{detail.product.brand}</p>
            <h1 className="mt-2 max-w-3xl text-3xl font-semibold">{detail.product.name}</h1>
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div>
                <div className="text-xs text-muted">현재 순위</div>
                <div className="mt-1 text-2xl font-semibold">{detail.current.rank}위</div>
              </div>
              <div>
                <div className="text-xs text-muted">1D</div>
                <div className="mt-1 text-2xl font-semibold text-rise">{formatChange(detail.rankChange1d)}</div>
              </div>
              <div>
                <div className="text-xs text-muted">3D</div>
                <div className="mt-1 text-2xl font-semibold text-rise">{formatChange(detail.rankChange3d)}</div>
              </div>
              <div>
                <div className="text-xs text-muted">판매가</div>
                <div className="mt-1 text-2xl font-semibold">{formatCurrency(detail.current.salePrice)}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <RankingHistoryChart data={detail.history} />

      {detail.product.tag ? (
        <section className="rounded border border-line bg-white p-5 shadow-subtle">
          <h2 className="text-base font-semibold">AI Tagging Preview</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {[
              ["Item", detail.product.tag.itemType],
              ["Fit", detail.product.tag.fit],
              ["Color", detail.product.tag.mainColor],
              ["Graphic", detail.product.tag.graphicType],
              ["Detail", detail.product.tag.detail],
              ["Style", detail.product.tag.style],
              ["Gender", detail.product.tag.gender],
              ["Material", detail.product.tag.material]
            ].map(([label, value]) => (
              <div key={label} className="rounded border border-line bg-slate-50 p-3">
                <div className="text-xs text-muted">{label}</div>
                <div className="mt-1 text-sm font-semibold">{value ?? "-"}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
