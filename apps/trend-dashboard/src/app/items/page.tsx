import Link from "next/link";
import { AttributeBundleCard, BundleEmptyState } from "@/components/AttributeBundle";
import { GlobalFilterBar } from "@/components/GlobalFilterBar";
import { categoryFilterOptions, categoryOfSpecificItem, matchesCategoryFilter, type BroadCategory } from "@/config/taxonomy";
import { formatNumber } from "@/lib/format";
import { evidenceStrengthLabel, formatRankChange, sourceLabel, trendValueLabel } from "@/lib/market-ui";
import { buildFilterHref, parseGenderParam, parseScopeParam, valueOf } from "@/lib/planning-filters";
import { getAttributeBundles } from "@/services/attribute-bundle-service";
import { getItemTrendRows } from "@/services/business-analytics-service";
import { getEditorialTrendRows, type EditorialTrendRow } from "@/services/editorial-analytics-service";
import type { ItemTrendRow } from "@/types/business";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ItemsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const gender = parseGenderParam(params.gender);
  const scope = parseScopeParam(params.scope);
  const category = (valueOf(params.category) as BroadCategory | "ALL" | undefined) ?? "ALL";
  const isOverseas = scope === "overseas";

  const [editorialRows, marketItems, bundles] = await Promise.all([getEditorialTrendRows("real"), getItemTrendRows("real"), getAttributeBundles("real")]);

  // Bundles follow the same broad-category filter chip as the item cards.
  // They are gender-agnostic: a direct attribute relation carries no gender
  // evidence of its own, so it is never filtered by the UNI/WOMEN filter
  // rather than being guessed into one.
  const visibleBundles = bundles.filter((bundle) => matchesCategoryFilter(categoryOfSpecificItem(bundle.specificItem), category));

  // Domestic (default) evidence: only SPECIFIC_ITEM (SUB_ITEM) editorial
  // mentions become their own trend card. A broad category such as HEADWEAR
  // is a filter chip only - it never becomes a card by itself.
  const specificEditorial = editorialRows
    .filter((row) => row.type === "SUB_ITEM")
    .map((row) => filterEditorialByGender(row, gender))
    .filter((row): row is EditorialTrendRow => Boolean(row))
    .map((row) => ({ row, category: categoryOfSpecificItem(row.value) }))
    .filter((entry) => matchesCategoryFilter(entry.category, category));

  const marketBySpecificItem = new Map<string, ItemTrendRow>();
  for (const item of marketItems) {
    if (!item.isSpecific || !item.subItemType) continue;
    marketBySpecificItem.set(item.subItemType.toUpperCase(), item);
  }

  const cards = specificEditorial.map(({ row, category: cardCategory }) => ({
    editorial: row,
    category: cardCategory,
    store: isOverseas ? marketBySpecificItem.get(row.value.toUpperCase()) ?? null : null
  }));

  // Specific items observed only in the overseas reference store data (no
  // domestic editorial evidence yet) - shown separately and only when the
  // user explicitly selects the overseas reference scope. ItemTrendRow has
  // no per-row gender evidence, so this reference list is only shown when no
  // gender filter is active (never guessed).
  const overseasOnlyItems = isOverseas && gender === "all"
    ? marketItems
        .filter((item) => item.isSpecific && item.subItemType)
        .filter((item) => !specificEditorial.some((entry) => entry.row.value.toUpperCase() === item.subItemType!.toUpperCase()))
        .map((item) => ({ item, category: categoryOfSpecificItem(item.subItemType, item.itemType) }))
        .filter((entry) => matchesCategoryFilter(entry.category, category))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold text-signal">SPECIFIC ITEM TREND</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">세부 아이템 트렌드</h1>
          <p className="mt-2 text-sm text-muted">
            &quot;헤드웨어가 많이 보이는가&quot;가 아니라 &quot;니트 비니 / 캠프캡 / 볼캡 중 무엇이 많이 보이는가&quot;를 봅니다. 대분류는 필터로만 사용합니다.
          </p>
        </div>
        <GlobalFilterBar pathname="/items" currentParams={params} gender={gender} scope={scope} />
      </div>

      <div className="flex flex-wrap gap-2">
        {categoryFilterOptions.map((option) => (
          <Link
            key={option.value}
            href={buildFilterHref("/items", params, { category: option.value === "ALL" ? undefined : option.value })}
            className={`rounded border px-3 py-2 text-sm font-semibold ${category === option.value ? "border-ink bg-ink text-white" : "border-line bg-white text-muted hover:text-ink"}`}
          >
            {option.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Summary label="관측 상품 유형 (국내)" value={`${formatNumber(cards.length)}개`} />
        <Summary label="해외 참고 매칭" value={`${formatNumber(cards.filter((card) => card.store).length)}개`} />
        <Summary label="복수 매체 공통" value={`${formatNumber(cards.filter((card) => card.editorial.sourceSpread >= 2).length)}개`} />
      </div>

      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold text-ink">요즘 보이는 상품 조합</h2>
          <p className="text-xs text-muted">기사에서 아이템을 직접 수식한 속성만 조합했습니다. 같은 기사에 함께 나온 것만으로는 조합하지 않습니다.</p>
        </div>
        {visibleBundles.length > 0 ? (
          <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleBundles.map((bundle) => <AttributeBundleCard key={bundle.key} bundle={bundle} />)}
          </div>
        ) : (
          <div className="mt-3">
            <BundleEmptyState message="직접 속성 근거가 아직 부족합니다. 현재 기사에서 아이템을 직접 수식하는 속성 표현이 확인된 조합이 없습니다." />
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => <SpecificItemCard key={`${card.editorial.type}:${card.editorial.value}`} card={card} />)}
        {cards.length === 0 ? <EmptyState title="현재 필터에서 실제 근거가 있는 세부 아이템이 없습니다." /> : null}
      </section>

      {isOverseas && overseasOnlyItems.length > 0 ? (
        <section>
          <h2 className="text-xl font-semibold text-ink">해외 참고 스토어에서만 관측된 상품 유형</h2>
          <p className="mt-1 text-sm text-muted">국내 매거진 근거는 아직 없지만 END/Rakuten 관측 랭킹에서 확인되는 세부 아이템입니다.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {overseasOnlyItems.map(({ item }) => <OverseasOnlyCard key={`${item.itemType}-${item.subItemType ?? ""}`} item={item} />)}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function filterEditorialByGender(row: EditorialTrendRow, gender: "all" | "uni" | "women") {
  if (gender === "all") return row;
  const target = gender === "uni" ? "UNISEX" : "WOMEN";
  if ((row.genderSplit[target] ?? 0) <= 0) return null;
  return row;
}

function SpecificItemCard({ card }: { card: { editorial: EditorialTrendRow; category: BroadCategory; store: ItemTrendRow | null } }) {
  const { editorial, store } = card;
  return (
    <article className="rounded border border-line bg-white p-5 shadow-subtle">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-muted">{categoryFilterOptions.find((option) => option.value === card.category)?.label ?? "기타"}</div>
          <Link className="text-xl font-semibold text-ink hover:text-signal" href={store ? `/items/${encodeURIComponent(store.subItemType ?? store.itemType)}` : "#"}>
            {trendValueLabel(editorial.value)}
          </Link>
        </div>
        <span className="whitespace-nowrap rounded border border-line bg-canvas px-2 py-1 text-xs font-semibold text-muted">
          {evidenceStrengthLabel(editorial)}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
        <Mini label="등장 기사" value={formatNumber(editorial.articlePresence)} />
        <Mini label="등장 매체" value={`${editorial.sourceSpread}개`} />
        <Mini label="최근 7일" value={formatRankChange(editorial.change7dArticlePresence)} />
      </div>

      <div className="mt-4 rounded bg-canvas px-3 py-3 text-sm">
        <div className="text-xs font-semibold text-muted">판매성 검증</div>
        {store ? (
          <div className="mt-1 font-semibold text-ink">해외 참고 TOP20 {store.top20Presence} · TOP50 {store.top50Presence}</div>
        ) : (
          <div className="mt-1 font-semibold text-ink">국내 스토어 데이터 없음</div>
        )}
      </div>

      <div className="mt-4 border-t border-line pt-3 text-xs text-muted">
        매거진: {editorial.sources.map(sourceLabel).join(" / ") || "-"}
        {store ? <div className="mt-1">해외 참고 스토어: {store.sources.map(sourceLabel).join(" / ")}</div> : null}
      </div>
    </article>
  );
}

function OverseasOnlyCard({ item }: { item: ItemTrendRow }) {
  return (
    <article className="rounded border border-dashed border-line bg-white p-5 shadow-subtle">
      <Link className="text-lg font-semibold text-ink hover:text-signal" href={`/items/${encodeURIComponent(item.subItemType ?? item.itemType)}`}>
        {trendValueLabel(item.label)}
      </Link>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <Mini label="TOP20" value={formatNumber(item.top20Presence)} />
        <Mini label="TOP50" value={formatNumber(item.top50Presence)} />
      </div>
      <div className="mt-3 text-xs text-muted">해외 참고 스토어: {item.sources.map(sourceLabel).join(" / ") || "-"}</div>
    </article>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 font-semibold text-ink">{value}</div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-line bg-white px-4 py-3 shadow-subtle">
      <div className="text-xs font-semibold text-muted">{label}</div>
      <div className="mt-1 text-xl font-semibold text-ink">{value}</div>
    </div>
  );
}

function EmptyState({ title }: { title: string }) {
  return <div className="rounded border border-dashed border-line bg-white px-4 py-10 text-center text-sm font-semibold text-muted">{title}</div>;
}
