import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { ProductLinkButton } from "@/components/ProductLinkButton";
import { formatCurrency, formatNumber } from "@/lib/format";
import { editorialWhyThisItemLines, evidenceStrengthLabel, planningGenderLabel, sourceLabel, trendValueLabel } from "@/lib/market-ui";
import { getItemTrendDetail } from "@/services/business-analytics-service";
import type { EditorialCoOccurrence, EditorialTrendRow, SpecificItemEditorialDetail } from "@/services/editorial-analytics-service";
import { getSpecificItemEditorialDetail } from "@/services/editorial-analytics-service";

type PageProps = { params: Promise<{ itemType: string }> };

export default async function ItemDetailPage({ params }: PageProps) {
  const { itemType } = await params;
  const [detail, editorialDetail] = await Promise.all([getItemTrendDetail(itemType), getSpecificItemEditorialDetail(itemType.toUpperCase())]);
  if (!detail) {
    return (
      <div className="rounded border border-line bg-white p-6">
        <h1 className="text-2xl font-semibold">Item not found</h1>
        <Link className="mt-4 inline-block text-sm font-semibold text-signal" href="/items">Back to Items</Link>
      </div>
    );
  }
  const editorialMatch = editorialDetail.trend;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">세부 아이템 근거</p>
        <h1 className="mt-2 text-3xl font-semibold">{detail.item.label}</h1>
        <p className="mt-2 text-sm text-muted">랭킹 신호와 어소트먼트 노출, 매거진 근거를 구분해서 보여줍니다.</p>
      </div>

      {/*
        수요 검증 (NAVER Demand) block intentionally removed here - NAVER
        Shopping Insight is not in use for now. demand-signal-service.ts and
        its schema/tests are preserved unchanged for future reactivation.
      */}
      <section className="grid gap-4 md:grid-cols-2">
        <DetailBlock title="트렌드 검증 (매거진 근거)">
          {editorialMatch ? (
            <>
              <div className="text-lg font-semibold text-ink">{evidenceStrengthLabel(editorialMatch)}</div>
              <div className="mt-1 text-xs text-muted">등장 기사 {editorialMatch.articlePresence}개 · 등장 매체 {editorialMatch.sourceSpread}개</div>
              <div className="mt-1 text-xs text-muted">등장 매체 수를 함께 고려해 해석합니다.</div>
            </>
          ) : (
            <div className="text-sm text-muted">국내 매거진 근거 없음</div>
          )}
        </DetailBlock>
        <DetailBlock title="스토어 반응 (국내)">
          <div className="text-sm text-muted">현재 연결된 국내 스토어 랭킹 데이터가 없습니다. 국내 데이터 소스를 준비 중입니다.</div>
        </DetailBlock>
      </section>

      {editorialMatch ? <EditorialEvidenceSection item={editorialMatch} cooccurrence={editorialDetail.cooccurrence} /> : null}

      <section className="grid gap-4 md:grid-cols-5">
        <Metric label="Ranking Signal" value={detail.item.rankingSignal} />
        <Metric label="Assortment Signal" value={detail.item.assortmentSignal} />
        <Metric label="TOP10 Presence" value={formatNumber(detail.item.top10Presence)} />
        <Metric label="TOP20 Presence" value={formatNumber(detail.item.top20Presence)} />
        <Metric label="TOP50 Presence" value={formatNumber(detail.item.top50Presence)} />
      </section>
      <section className="grid gap-6 xl:grid-cols-3">
        <Summary title="Sources" rows={detail.sourceSummary} />
        <Summary title="Brands" rows={detail.brandSummary} />
        <Summary title="Colors" rows={detail.colorSummary} />
        <Summary title="Fits" rows={detail.fitSummary} />
        <Summary title="Graphics" rows={detail.graphicSummary} />
        <Summary title="Details" rows={detail.detailSummary} />
      </section>
      <section className="rounded border border-line bg-white p-5 shadow-subtle">
        <div className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Product Presence</div>
        <div className="overflow-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-muted">
              <tr>{["Product", "Source", "Metric", "Scope Rank", "Category", "Presence", "Price", "Signal"].map((head) => <th key={head} className="border-b border-line px-3 py-2 text-left">{head}</th>)}</tr>
            </thead>
            <tbody>
              {detail.products.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-b-0">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <ProductImage src={row.imageUrl} alt={row.name} size="sm" />
                      <div>
                        <div className="text-xs font-semibold text-muted">{row.brand}</div>
                        <div className="font-semibold">{row.name}</div>
                        <div className="mt-1"><ProductLinkButton url={row.url} /></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">{row.source}</td>
                  <td className="px-3 py-3">{row.metricType}</td>
                  <td className="px-3 py-3">{row.rankingVerified ? scopeRankLabel(row) : row.sourcePosition ?? "-"}</td>
                  <td className="px-3 py-3">{row.observedCategory ?? row.category ?? "-"}</td>
                  <td className="px-3 py-3">{row.presenceStatus}</td>
                  <td className="px-3 py-3">{formatCurrency(row.salePrice)}</td>
                  <td className="px-3 py-3 font-semibold">{row.signal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function DetailBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-line bg-white p-4 shadow-subtle">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{title}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded border border-line bg-white p-4 shadow-subtle"><div className="text-xs uppercase tracking-[0.12em] text-muted">{label}</div><div className="mt-2 text-xl font-semibold">{value}</div></div>;
}

function Summary({ title, rows }: { title: string; rows: Array<{ name: string; count: number; averageRank: number | null }> }) {
  return (
    <section className="rounded border border-line bg-white p-4 shadow-subtle">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{title}</div>
      <div className="mt-3 space-y-2">
        {rows.map((row) => <div key={row.name} className="flex justify-between text-sm"><span className="font-medium">{row.name}</span><span className="text-muted">{row.count} presence{row.averageRank ? ` / Avg Rank ${Math.round(row.averageRank)}` : ""}</span></div>)}
      </div>
    </section>
  );
}

function EditorialEvidenceSection({ item, cooccurrence }: { item: EditorialTrendRow; cooccurrence: SpecificItemEditorialDetail["cooccurrence"] }) {
  const genderEntries = Object.entries(item.genderSplit).filter(([, count]) => count > 0);
  const whyLines = editorialWhyThisItemLines(item);
  return (
    <section className="space-y-4">
      <div className="rounded border border-line bg-white p-5 shadow-subtle">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">왜 이 아이템인가</div>
        <ul className="space-y-1 text-sm text-ink">
          {whyLines.map((line) => (
            <li key={line}>· {line}</li>
          ))}
        </ul>
        {genderEntries.length > 0 ? (
          <div className="mt-3 text-xs text-muted">
            성별 근거(명시적 evidence 기준): {genderEntries.map(([gender, count]) => `${planningGenderLabel(gender)} ${count}`).join(" · ")}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CoOccurrenceCard title="같이 등장한 디테일" rows={cooccurrence.details} />
        <CoOccurrenceCard title="같이 등장한 소재" rows={cooccurrence.materials} />
        <CoOccurrenceCard title="같이 등장한 컬러" rows={cooccurrence.colors} />
        <CoOccurrenceCard title="같이 등장한 스타일" rows={cooccurrence.styles} />
      </div>
      {cooccurrence.brands.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CoOccurrenceCard title="언급된 브랜드" rows={cooccurrence.brands} />
        </div>
      ) : null}

      <div className="rounded border border-line bg-white p-5 shadow-subtle">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">근거 기사</div>
        <div className="space-y-3">
          {item.evidenceArticles.map((article) => (
            <div key={`${article.source}:${article.url || article.title}`} className="flex items-start justify-between gap-3 border-b border-line pb-3 last:border-b-0 last:pb-0">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                  {sourceLabel(article.source)} · {article.publishedAt ? new Date(article.publishedAt).toISOString().slice(0, 10) : "-"}
                </div>
                <div className="mt-1 text-sm font-medium text-ink">{article.title}</div>
              </div>
              {article.url ? (
                <a className="shrink-0 text-xs font-semibold text-signal" href={article.url} target="_blank" rel="noopener noreferrer">
                  기사 보기 ↗
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CoOccurrenceCard({ title, rows }: { title: string; rows: EditorialCoOccurrence[] }) {
  return (
    <div className="rounded border border-line bg-white p-4 shadow-subtle">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{title}</div>
      {rows.length === 0 ? (
        <div className="mt-2 text-xs text-muted">같이 등장한 근거 없음</div>
      ) : (
        <div className="mt-2 space-y-1.5">
          {rows.slice(0, 5).map((row) => (
            <div key={row.value} className="flex items-center justify-between text-sm">
              <span className="font-medium">{trendValueLabel(row.value)}</span>
              <span className="text-xs text-muted">{row.articlePresence}개 기사</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function scopeRankLabel(row: { source: string; rankingScope: string; rankingCategory: string | null; rank: number | null }) {
  if (row.rank == null) return "-";
  if (row.source === "RAKUTEN_FASHION" && row.rankingScope === "SITEWIDE") return `Sitewide Rank #${row.rank}`;
  if (row.source === "END" && row.rankingScope === "DEPARTMENT") return `Clothing Bestseller #${row.rank}`;
  return `${row.rankingCategory ?? row.rankingScope} #${row.rank}`;
}
