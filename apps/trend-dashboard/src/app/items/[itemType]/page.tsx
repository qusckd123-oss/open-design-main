import Link from "next/link";
import { AttributeChip, AttributeMatrix, BundleHighlight } from "@/components/AttributeBundle";
import { ProductImage } from "@/components/ProductImage";
import { ProductLinkButton } from "@/components/ProductLinkButton";
import { attributeKoreanLabel, specificItemKoreanLabel } from "@/lib/korean-labels";
import { getPrimaryBundleForItem, getSpecificItemDirectAttributes, type BundleAttribute } from "@/services/attribute-bundle-service";
import { formatCurrency, formatNumber } from "@/lib/format";
import { editorialWhyThisItemLines, evidenceStrengthLabel, hasVerifiedMarketEvidence, mentionGenderKoreanLabel, sourceLabel } from "@/lib/market-ui";
import { getItemTrendDetail } from "@/services/business-analytics-service";
import type { EditorialCoOccurrence, EditorialTrendRow, SpecificItemEditorialDetail } from "@/services/editorial-analytics-service";
import { getSpecificItemEditorialDetail, partitionCoOccurrence } from "@/services/editorial-analytics-service";

type PageProps = { params: Promise<{ itemType: string }> };

export default async function ItemDetailPage({ params }: PageProps) {
  const { itemType } = await params;
  const [detail, editorialDetail, directAttributes, primaryBundle] = await Promise.all([
    getItemTrendDetail(itemType),
    getSpecificItemEditorialDetail(itemType.toUpperCase()),
    getSpecificItemDirectAttributes(itemType.toUpperCase()),
    getPrimaryBundleForItem(itemType.toUpperCase())
  ]);
  const editorialMatch = editorialDetail.trend;
  // Editorial evidence is the primary axis: a specific item can exist purely
  // from magazine coverage with no overseas market row at all (TOTE_BAG is
  // exactly that today). Only 404 when there is no evidence of any kind -
  // otherwise the one item with a real attribute bundle would be unreachable
  // from its own "근거 보기" link.
  const hasEditorialEvidence = Boolean(editorialMatch) || directAttributes.length > 0;
  if (!detail && !hasEditorialEvidence) {
    return (
      <div className="rounded border border-line bg-white p-6">
        <h1 className="text-2xl font-semibold">해당 아이템 근거를 찾을 수 없습니다</h1>
        <Link className="mt-4 inline-block text-sm font-semibold text-signal" href="/items">← 세부 아이템 트렌드</Link>
      </div>
    );
  }
  const specificItem = itemType.toUpperCase();
  const koreanTitle = specificItemKoreanLabel(detail?.item.subItemType ?? specificItem);
  const rawLabel = detail?.item.label ?? specificItem.replaceAll("_", " ");
  const showLegacyMarketBlock = detail ? hasVerifiedMarketEvidence(detail.products) : false;

  return (
    <div className="space-y-6">
      <div>
        <Link className="text-xs font-semibold text-signal" href="/items">← 세부 아이템 트렌드</Link>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-signal">세부 아이템 근거</p>
        <h1 className="mt-2 text-3xl font-semibold">{koreanTitle ?? rawLabel}</h1>
        {koreanTitle ? <p className="mt-1 text-xs uppercase tracking-[0.1em] text-muted">{rawLabel}</p> : null}
        <p className="mt-2 text-sm text-muted">매거진 근거를 우선으로 보여주고, 실제 검증된 해외 참고 랭킹 데이터가 있을 때만 별도로 표시합니다.</p>
      </div>

      {primaryBundle ? <BundleHighlight bundle={primaryBundle} /> : null}

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

      <DirectAttributeSection
        directAttributes={directAttributes}
        specificItem={specificItem}
        totalArticlePresence={editorialMatch?.articlePresence ?? 0}
      />

      {editorialMatch ? <EditorialEvidenceSection item={editorialMatch} cooccurrence={editorialDetail.cooccurrence} /> : null}

      {detail && showLegacyMarketBlock ? (
        <section className="space-y-4">
          <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            아래는 <strong>해외 참고</strong> 데이터입니다 (END/Rakuten 등 검증된 해외 랭킹 소스 기준). 국내 판매/재고 데이터가 아니며, 위 &quot;스토어 반응 (국내)&quot;와는 별개 축입니다.
          </div>
          <div className="grid gap-4 md:grid-cols-5">
            <Metric label="Ranking Signal (해외 참고)" value={detail.item.rankingSignal} />
            <Metric label="Assortment Signal (해외 참고)" value={detail.item.assortmentSignal} />
            <Metric label="TOP10 Presence" value={formatNumber(detail.item.top10Presence)} />
            <Metric label="TOP20 Presence" value={formatNumber(detail.item.top20Presence)} />
            <Metric label="TOP50 Presence" value={formatNumber(detail.item.top50Presence)} />
          </div>
          <div className="grid gap-6 xl:grid-cols-3">
            <Summary title="Sources" rows={detail.sourceSummary} />
            <Summary title="Brands" rows={detail.brandSummary} />
            <Summary title="Colors" rows={detail.colorSummary} />
            <Summary title="Fits" rows={detail.fitSummary} />
            <Summary title="Graphics" rows={detail.graphicSummary} />
            <Summary title="Details" rows={detail.detailSummary} />
          </div>
          <div className="rounded border border-line bg-white p-5 shadow-subtle">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Product Presence (해외 참고)</div>
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
          </div>
        </section>
      ) : null}
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

/**
 * [직접 속성 근거] - attributes that actually modified this item inside an
 * article ("카본 블랙 ELVO 백팩"). This is the planning-relevant surface and
 * intentionally sits ABOVE the weaker article co-occurrence block below it.
 */
function DirectAttributeSection({
  directAttributes,
  specificItem,
  totalArticlePresence
}: {
  directAttributes: BundleAttribute[];
  specificItem: string;
  totalArticlePresence: number;
}) {
  const itemLabel = specificItemKoreanLabel(specificItem) ?? specificItem.replaceAll("_", " ");
  return (
    <section className="rounded border border-signal/30 bg-white p-5 shadow-subtle">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-signal">직접 속성 근거</div>
        <div className="text-xs text-muted">기사 문장에서 {itemLabel}을(를) 직접 수식한 표현만 사용합니다.</div>
      </div>
      {directAttributes.length > 0 ? (
        <>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {directAttributes.map((attribute) => (
              <AttributeChip key={`${attribute.type}:${attribute.value}`} attribute={attribute} />
            ))}
          </div>
          <div className="mt-4">
            <AttributeMatrix attributes={directAttributes} totalArticlePresence={totalArticlePresence} />
          </div>
        </>
      ) : (
        <div className="mt-3 text-sm text-muted">
          이 아이템을 직접 수식한 속성 표현이 아직 확인되지 않았습니다. 아래 &quot;함께 언급된 요소&quot;는 같은 기사에 등장했을 뿐이며, 이 아이템의 속성으로 해석하면 안 됩니다.
        </div>
      )}
    </section>
  );
}

const COOCCURRENCE_DIMENSIONS = [
  { key: "details", title: "디테일" },
  { key: "materials", title: "소재" },
  { key: "colors", title: "컬러" },
  { key: "styles", title: "스타일" },
  { key: "brands", title: "브랜드" }
] as const;

function EditorialEvidenceSection({ item, cooccurrence }: { item: EditorialTrendRow; cooccurrence: SpecificItemEditorialDetail["cooccurrence"] }) {
  const genderEntries = Object.entries(item.genderSplit).filter(([, count]) => count > 0);
  const whyLines = editorialWhyThisItemLines(item);

  const repeatedByDimension = COOCCURRENCE_DIMENSIONS.map((dimension) => ({
    dimension,
    rows: partitionCoOccurrence(cooccurrence[dimension.key]).repeated
  })).filter((entry) => entry.rows.length > 0);
  const oneOffEntries = COOCCURRENCE_DIMENSIONS.flatMap((dimension) =>
    partitionCoOccurrence(cooccurrence[dimension.key]).oneOff.map((row) => ({ ...row, dimensionTitle: dimension.title }))
  );
  const hasAnyCoOccurrence = repeatedByDimension.length > 0 || oneOffEntries.length > 0;
  const repeatedCoOccurrenceCount = repeatedByDimension.reduce((sum, entry) => sum + entry.rows.length, 0);

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
            기사 성별 근거: {genderEntries.map(([gender, count]) => `${mentionGenderKoreanLabel(gender)} ${count}`).join(" · ")}
            <div className="mt-0.5">상품 자체의 성별이 아니라 기사 문맥의 명시 근거 기준입니다.</div>
          </div>
        ) : null}
      </div>

      {/*
        직접 속성 근거 -> 근거 기사 -> 기사 동반 요소 순서 (co-occurrence는
        가장 약한 근거이므로 항상 마지막에 둔다).
      */}
      <div className="rounded border border-line bg-white p-5 shadow-subtle">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">근거 기사</div>
        <div className="space-y-3">
          {item.evidenceArticles.map((article) => (
            <div key={`${article.source}:${article.url || article.title}`} className="flex items-start gap-3 border-b border-line pb-3 last:border-b-0 last:pb-0">
              <ProductImage src={article.imageUrl} alt={article.title || sourceLabel(article.source)} size="sm" />
              <div className="min-w-0 flex-1">
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

      {hasAnyCoOccurrence ? (
        <details className="rounded border border-line bg-white p-5 shadow-subtle">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            기사 동반 요소 보기 · 반복 {repeatedCoOccurrenceCount}개 · 1회 {oneOffEntries.length}개
          </summary>
          <p className="mt-2 text-xs text-muted">같은 기사에서 함께 언급된 요소입니다. 해당 아이템의 직접 속성을 의미하지 않을 수 있습니다.</p>

          {repeatedByDimension.length > 0 ? (
            <div className="mt-4">
              <div className="text-xs font-semibold text-ink">반복 동반 요소</div>
              <div className="mt-2 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {repeatedByDimension.map(({ dimension, rows }) => (
                  <CoOccurrenceCard key={dimension.key} title={dimension.title} rows={rows} totalArticlePresence={item.articlePresence} sourceContextNote={item.sourceSpread === 1} />
                ))}
              </div>
            </div>
          ) : null}

          {oneOffEntries.length > 0 ? (
            <div className="mt-4">
              <div className="text-xs font-semibold text-muted">1회 동반 언급</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {oneOffEntries.map((row) => (
                  <span key={`${row.dimensionTitle}:${row.value}`} className="rounded-full border border-line bg-slate-50 px-2.5 py-1 text-xs text-muted">
                    {attributeKoreanLabel(row.value)} <span className="text-[10px] text-muted/80">· {row.dimensionTitle}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </details>
      ) : null}
    </section>
  );
}

function CoOccurrenceCard({ title, rows, totalArticlePresence, sourceContextNote }: { title: string; rows: EditorialCoOccurrence[]; totalArticlePresence: number; sourceContextNote: boolean }) {
  return (
    <div className="rounded border border-line bg-white p-4 shadow-subtle">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{title}</div>
      <div className="mt-2 space-y-2">
        {rows.slice(0, 5).map((row) => (
          <div key={row.value} className="text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{attributeKoreanLabel(row.value)}</span>
              <span className="text-xs text-muted">
                {row.articlePresence}/{totalArticlePresence}개 기사{row.sourceSpread > 0 ? ` · ${row.sourceSpread}개 매체` : ""}
              </span>
            </div>
            {sourceContextNote && row.sourceSpread <= 1 ? <div className="text-[11px] text-muted">특정 매체 집중 - 다수 매체 공통 아님</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function scopeRankLabel(row: { source: string; rankingScope: string; rankingCategory: string | null; rank: number | null }) {
  if (row.rank == null) return "-";
  if (row.source === "RAKUTEN_FASHION" && row.rankingScope === "SITEWIDE") return `Sitewide Rank #${row.rank}`;
  if (row.source === "END" && row.rankingScope === "DEPARTMENT") return `Clothing Bestseller #${row.rank}`;
  return `${row.rankingCategory ?? row.rankingScope} #${row.rank}`;
}
