import type { Metadata } from "next";
import Link from "next/link";
import { formatDateKo, sourceLabel, trendValueLabel } from "@/lib/market-ui";
import { specificItemKoreanLabel } from "@/lib/korean-labels";
import { getCurrentMagazineIssue } from "@/services/magazine-service";

export const metadata: Metadata = {
  title: "매거진 | 상품기획 트렌드",
  description: "이번 주 패션·컬처 매거진에서 발행된 실제 기사와 이미지를 모아봅니다."
};

export default async function MagazinePage() {
  const issue = await getCurrentMagazineIssue();
  const weekEnd = new Date(issue.end.getTime() - 1);

  return (
    <div>
      <header className="border-b border-line pb-7 md:pb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-signal">Weekly Hype · Magazine</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-4xl font-semibold leading-tight text-ink md:text-5xl">매거진</h1>
            <p className="mt-3 text-sm text-muted">이번 주 패션·컬처에서 무엇이 다뤄졌는지, 기사 이미지와 함께 훑어봅니다.</p>
          </div>
          <div className="text-right text-xs text-muted">이번 주 · {formatDateKo(issue.start)} – {formatDateKo(weekEnd)}<br />{issue.total}개 기사 · {issue.sourceCount}개 매체</div>
        </div>
      </header>

      {issue.articles.length > 0 ? (
        <section className="mt-7 grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3" aria-label="이번 주 매거진 기사">
          {issue.articles.map((article, index) => (
            <article key={article.id} className={`min-w-0 ${index === 0 ? "sm:col-span-2" : ""}`}>
              <a href={article.url} target="_blank" rel="noreferrer" className="group block">
                <div className={`relative overflow-hidden bg-[#e9e7e1] ${index === 0 ? "aspect-[16/10]" : "aspect-[4/3]"}`}>
                  {article.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={article.imageUrl} alt={`${article.title} 기사 이미지`} loading={index === 0 ? "eager" : "lazy"} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]" />
                  ) : <div className="grid h-full place-items-center text-xs text-muted">원문에 연결된 이미지 없음</div>}
                  {index === 0 ? <span className="absolute left-3 top-3 bg-ink px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white">This Week</span> : null}
                </div>
                <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-muted">
                  <span>{sourceLabel(article.source)}</span><span aria-hidden>·</span><time dateTime={article.publishedAt?.toISOString()}>{formatDateKo(article.publishedAt)}</time>
                </div>
                <h2 className="mt-1 line-clamp-2 text-lg font-semibold leading-snug text-ink group-hover:text-signal">{article.title}</h2>
              </a>
              {article.topics.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {article.topics.map((topic) => {
                    const label = topic.type === "SUB_ITEM" ? specificItemKoreanLabel(topic.value) ?? trendValueLabel(topic.value) : trendValueLabel(topic.value);
                    return <span key={`${topic.type}:${topic.value}`} className="border border-line px-2 py-1 text-[10px] text-muted">{label}</span>;
                  })}
                </div>
              ) : null}
            </article>
          ))}
        </section>
      ) : (
        <div className="mt-7 border border-dashed border-line bg-white px-6 py-16 text-center">
          <p className="text-lg font-semibold text-ink">이번 주 등록된 패션 매거진 기사가 없습니다.</p>
          <p className="mt-2 text-sm text-muted">지난주 기사를 섞어 채우지 않았습니다. 기존 기사 분석은 <Link href="/editorial" className="font-semibold text-signal underline">트렌드 검증</Link>에서 확인할 수 있습니다.</p>
        </div>
      )}
    </div>
  );
}
