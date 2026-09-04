import Link from "next/link";
import { formatChange, formatCurrency } from "@/lib/format";
import type { TrendProduct } from "@/types/trend";
import { ProductImage } from "./ProductImage";
import { StatusBadge } from "./StatusBadge";

export function RisingProductCard({ product }: { product: TrendProduct }) {
  return (
    <Link href={`/products/${product.id}`} className="rounded border border-line bg-white p-4 shadow-subtle hover:border-signal">
      <div className="flex gap-4">
        <ProductImage src={product.imageUrl} alt={product.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{product.brand}</div>
              <div className="mt-1 line-clamp-2 text-sm font-semibold text-ink">{product.name}</div>
            </div>
            <StatusBadge status={product.status} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <div>
              <div className="text-xs text-muted">현재</div>
              <div className="font-semibold">{product.currentRank}위</div>
            </div>
            <div>
              <div className="text-xs text-muted">1D</div>
              <div className={product.rankChange1d && product.rankChange1d > 0 ? "font-semibold text-rise" : "font-semibold"}>
                {formatChange(product.rankChange1d)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted">3D</div>
              <div className={product.rankChange3d && product.rankChange3d > 0 ? "font-semibold text-rise" : "font-semibold"}>
                {formatChange(product.rankChange3d)}
              </div>
            </div>
          </div>
          <div className="mt-3 text-sm font-semibold">{formatCurrency(product.salePrice)}</div>
        </div>
      </div>
    </Link>
  );
}
