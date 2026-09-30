import type { Metadata } from "next";
import { getPublicLooks } from "@/services/look-service";

export const metadata: Metadata = {
  title: "착장 | 상품기획 트렌드",
  description: "실제 승인된 착장 관측을 반복되는 룩 조합으로 확인합니다."
};

const lookGroups = [
  { key: "MEN", title: "MEN", subtitle: "남성 착장" },
  { key: "WOMEN", title: "WOMEN", subtitle: "여성 착장" }
] as const;

export default async function LooksPage() {
  const clusters = await getPublicLooks();
  return (
    <div>
      <header className="border-b border-line pb-7 md:pb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-signal">Look Observation</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-4xl font-semibold leading-tight text-ink md:text-5xl">착장</h1>
            <p className="mt-3 text-sm text-muted">요즘 실제로 어떤 착장이 반복해서 보이는지 살펴봅니다.</p>
          </div>
          <span className="text-xs text-muted">실제 검토된 관측만 표시</span>
        </div>
      </header>

      <section className="mt-7 grid gap-5 lg:grid-cols-2" aria-label="성별별 착장 관측">
        {lookGroups.map((group) => (
          <article key={group.key} className="overflow-hidden border border-line bg-white">
            <div className="flex items-end justify-between border-b border-line px-5 py-4 md:px-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{group.title}</p>
                <h2 className="mt-1 text-2xl font-semibold text-ink">{group.subtitle}</h2>
              </div>
              <span className="border border-line px-2.5 py-1 text-[10px] font-semibold text-muted">{clusters.filter((cluster) => cluster.gender === group.key).length}개 검토 착장</span>
            </div>
            {clusters.filter((cluster) => cluster.gender === group.key).length ? (
              <div className="space-y-8 p-5 md:p-6">
                {clusters.filter((cluster) => cluster.gender === group.key).map((cluster) => (
                  <section key={cluster.id}>
                    <h3 className="text-xl font-semibold text-ink">{cluster.title}</h3>
                    <p className="mt-1 text-sm text-muted">{cluster.summary}</p>
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {cluster.images.map((image) => (
                        <a key={image.id} href={image.postUrl} target="_blank" rel="noreferrer" aria-label={`${cluster.title} 원본 게시물`} className="relative block aspect-[4/5] overflow-hidden bg-[#f1f0ec]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={image.imageUrl} alt={`${cluster.title} 실제 관측 이미지`} loading="lazy" className="h-full w-full object-cover" />
                          <span className="absolute bottom-1 left-1 bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-ink">{image.observationType === "REAL_WEAR" ? "실착" : image.observationType === "CURATED_LOOK" ? "큐레이션" : image.observationType === "STYLE_MEDIA" ? "스타일 미디어" : "유형 미분류"}</span>
                        </a>
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-3 border-y border-line py-3 text-xs">
                      <div><p className="font-semibold text-ink">실착</p><p className="mt-1 text-muted">{cluster.realWear.observations}건 · Instagram {cluster.realWear.instagramAccounts}계정</p><p className="text-muted">{cluster.realWear.posts}개 게시물</p></div>
                      <div className="border-l border-line pl-3"><p className="font-semibold text-ink">큐레이션</p><p className="mt-1 text-muted">{cluster.curatedLook.observations}건 · {cluster.curatedLook.posts}개 게시물</p></div>
                      <div className="border-l border-line pl-3"><p className="font-semibold text-ink">스타일 미디어</p><p className="mt-1 text-muted">{cluster.styleMedia.observations}건 · {cluster.styleMedia.posts}개 게시물</p></div>
                    </div>
                    <p className="mt-3 text-xs text-muted">승인 관측 총 {cluster.observationCount}건 · 최근 {new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "medium" }).format(cluster.latestObservedAt)}{cluster.unclassified ? ` · 유형 미분류 ${cluster.unclassified}건` : ""} · 판매·인기도 순위 아님</p>
                    {cluster.tags.length > 0 ? <div className="mt-2 flex flex-wrap gap-2">{cluster.tags.map((tag) => <span key={`${tag.dimension}:${tag.value}`} className="border border-line px-2 py-1 text-[11px] text-muted">{tag.dimension} · {tag.value}</span>)}</div> : null}
                  </section>
                ))}
              </div>
            ) : (
              <>
                <div className="grid min-h-64 grid-cols-3 gap-px bg-line p-px md:min-h-80">
                  {[0, 1, 2].map((tile) => <div key={tile} className={`flex items-center justify-center bg-[#f1f0ec] p-3 text-center ${tile === 1 ? "translate-y-5" : "-translate-y-1"}`}><span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#aaa8a1]">Look image pending</span></div>)}
                </div>
                <div className="px-5 py-5 md:px-6 md:py-6">
                  <p className="text-base font-semibold text-ink">아직 승인된 착장 관측이 없습니다.</p>
                  <p className="mt-1 max-w-md text-sm leading-relaxed text-muted">수집된 착장이 쌓이면 비슷한 룩끼리 묶어 이미지 모자이크와 반복 스타일 요소를 보여줍니다.</p>
                  <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-3 text-[11px] text-muted"><span>룩 이미지 · 검토 후 표시</span><span>관측 수 · 계정 수</span><span>최근 관측일 · 검토 태그</span></div>
                </div>
              </>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
