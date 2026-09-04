import { GlobalFilterBar } from "@/components/GlobalFilterBar";
import { formatNumber } from "@/lib/format";
import { formatDateKo, planningGenderLabel } from "@/lib/market-ui";
import { parseGenderParam, parseScopeParam } from "@/lib/planning-filters";
import { getDemandDataQuality, getDemandSignalRows, type DemandAgeGroup, type DemandItemRow } from "@/services/demand-signal-service";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const AGE_LABELS: Record<DemandAgeGroup, string> = {
  "10-19": "10대",
  "20-29": "20대"
};

export default async function DemandPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const gender = parseGenderParam(params.gender);
  const scope = parseScopeParam(params.scope);
  const [rows, quality] = await Promise.all([getDemandSignalRows(gender), getDemandDataQuality()]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold text-signal">DEMAND SIGNAL</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">수요 검증</h1>
          <p className="mt-2 text-sm text-muted">
            NAVER 통합검색 쇼핑 영역 + 네이버쇼핑에서 발생한 검색·클릭 관심 추이입니다. 판매량·매출과는 다른 신호입니다.
          </p>
        </div>
        <GlobalFilterBar pathname="/demand" currentParams={params} gender={gender} scope={scope} />
      </div>

      <div className="rounded border border-line bg-canvas px-4 py-3 text-xs text-muted">
        네이버 쇼핑인사이트의 상대 관심도 지수입니다. 절대 검색량이나 판매량을 의미하지 않습니다. 10대/20대는 동일 요청(같은 정규화 기준)에서 함께 반환된 값이라 서로 비교할 수 있지만, 다른 키워드/다른 API 요청 간 비교에는 사용하지 않습니다.
      </div>

      {quality.credentialStatus === "MISSING" ? (
        <CredentialMissingState quality={quality} />
      ) : (
        <>
          <section className="grid gap-3 md:grid-cols-4">
            <Summary label="API 상태" value="연결됨" />
            <Summary label="REAL 수요 스냅샷" value={`${formatNumber(quality.realSnapshotCount)}개`} />
            <Summary label="상품 유형 키워드" value={`${formatNumber(quality.specificItemKeywords)}개`} />
            <Summary label="데이터 기간" value={quality.dateRange.start ? `${formatDateKo(quality.dateRange.start)} ~ ${formatDateKo(quality.dateRange.end)}` : "-"} />
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => <DemandCard key={row.specificItem} row={row} />)}
            {rows.length === 0 ? (
              <div className="col-span-full rounded border border-dashed border-line bg-white px-4 py-10 text-center text-sm font-semibold text-muted">
                API는 연결되어 있지만 아직 수집된 REAL 수요 데이터가 없습니다. 백필/수집을 실행해 주세요.
              </div>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}

function CredentialMissingState({ quality }: { quality: Awaited<ReturnType<typeof getDemandDataQuality>> }) {
  return (
    <div className="rounded border border-dashed border-line bg-white px-6 py-12 text-center">
      <p className="text-base font-semibold text-ink">네이버 API 연결 필요</p>
      <p className="mt-2 text-sm text-muted">
        NAVER Shopping Insight 공식 API 인증 정보가 설정되지 않았습니다. 실제 데이터가 없는 상태에서는 화면을 채우지 않습니다.
      </p>
      <p className="mt-4 text-xs text-muted">
        <code className="rounded bg-canvas px-1.5 py-0.5">.env</code>에 <code className="rounded bg-canvas px-1.5 py-0.5">NAVER_API_HUB_CLIENT_ID</code> /{" "}
        <code className="rounded bg-canvas px-1.5 py-0.5">NAVER_API_HUB_CLIENT_SECRET</code> (또는{" "}
        <code className="rounded bg-canvas px-1.5 py-0.5">NAVER_API_KEY_ID</code> / <code className="rounded bg-canvas px-1.5 py-0.5">NAVER_API_KEY</code>)를 설정한 뒤{" "}
        <code className="rounded bg-canvas px-1.5 py-0.5">npm run test:naver-real</code>로 연결을 확인하세요. 발급 방법은 README의 NAVER Demand Signal 섹션을 참고하세요.
      </p>
      {quality.mockSnapshotCount > 0 ? (
        <p className="mt-4 text-xs text-muted">참고: 데모/샘플용 MOCK 스냅샷 {quality.mockSnapshotCount.toLocaleString("ko-KR")}건이 별도로 저장되어 있으나, 이 화면과 국내 Dashboard에는 REAL 데이터만 사용합니다.</p>
      ) : null}
    </div>
  );
}

function DemandCard({ row }: { row: DemandItemRow }) {
  return (
    <article className="rounded border border-line bg-white p-5 shadow-subtle">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-muted">{row.planningGender ? planningGenderLabel(row.planningGender) : "성별 미지정"}</div>
          <div className="text-xl font-semibold text-ink">{row.specificItem.replaceAll("_", " ")}</div>
          <div className="mt-1 text-xs text-muted">키워드: {row.keywordName}</div>
        </div>
        <span className="whitespace-nowrap rounded border border-line bg-canvas px-2 py-1 text-xs font-semibold text-muted">{row.observation}</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {(Object.keys(AGE_LABELS) as DemandAgeGroup[]).map((ageGroup) => (
          <AgePanel key={ageGroup} label={AGE_LABELS[ageGroup]} point={row.byAge[ageGroup]} />
        ))}
      </div>
    </article>
  );
}

function AgePanel({ label, point }: { label: string; point: DemandItemRow["byAge"][DemandAgeGroup] }) {
  return (
    <div className="rounded bg-canvas px-3 py-3">
      <div className="text-xs font-semibold text-muted">{label} 관심도</div>
      <div className="mt-1 text-2xl font-semibold text-ink">{point.current == null ? "-" : point.current.toFixed(1)}</div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <PointChange label="최근 7일" value={point.change7d} />
        <PointChange label="최근 14일" value={point.change14d} />
      </div>
    </div>
  );
}

function PointChange({ label, value }: { label: string; value: number | null }) {
  const text = value == null ? "-" : `${value > 0 ? "+" : ""}${value}pt`;
  const color = value == null ? "text-muted" : value > 0 ? "text-rise" : value < 0 ? "text-fall" : "text-muted";
  return (
    <div>
      <div className="text-muted">{label}</div>
      <div className={`font-semibold ${color}`}>{text}</div>
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
