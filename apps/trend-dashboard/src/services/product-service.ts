import { getProductById } from "@/db/repositories";
import { classifyTrend, rankChange } from "@/lib/trend-signals";

export async function getProductDetail(id: string) {
  const product = await getProductById(id);
  if (!product) return null;

  const snapshotsAsc = product.rankingSnapshots;
  const snapshotsDesc = [...snapshotsAsc].reverse();
  const current = snapshotsDesc[0];
  if (!current) return null;

  return {
    product,
    current,
    rankChange1d: rankChange(current.rank, snapshotsDesc[1]?.rank),
    rankChange3d: rankChange(current.rank, snapshotsDesc[3]?.rank),
    rankChange7d: rankChange(current.rank, snapshotsDesc[7]?.rank),
    status: classifyTrend(snapshotsDesc.map((snapshot) => ({ rank: snapshot.rank, collectedAt: snapshot.collectedAt }))),
    history: snapshotsAsc.map((snapshot) => ({
      rank: snapshot.rank,
      collectedAt: snapshot.collectedAt
    }))
  };
}
