import type { Metadata } from "next";
import Link from "next/link";
import { featureFlags } from "@/config/feature-flags";
import "./globals.css";

export const metadata: Metadata = {
  title: "상품기획 트렌드 대시보드",
  description: "매거진 노출 트렌드와 실제 스토어 반응을 함께 확인하는 상품기획 대시보드"
};

// Primary navigation is intentionally simplified to the domestic-first flow.
// "브랜드 어소트" (SLAM_JAM/STUSSY assortment) is hidden here but the route
// and existing data are preserved at /market?view=assortment - reactivate as
// "브랜드 출시 동향" once a domestic assortment source exists.
// "수요 검증" (NAVER Shopping Insight demand signal) is hidden here too -
// NAVER Shopping Insight is not in use for now. The /demand route, its
// service/schema/collector/tests are intentionally preserved unchanged for
// future reactivation; only this nav link is removed.
const primaryNav = [
  { href: "/", label: "대시보드" },
  { href: "/editorial", label: "트렌드 검증" },
  { href: "/market", label: "스토어 반응" },
  { href: "/items", label: "세부 아이템" },
  { href: "/import", label: "데이터 관리" }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen bg-canvas">
          <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
            <div className="mx-auto flex min-h-16 max-w-[1440px] flex-col gap-3 px-6 py-3 lg:flex-row lg:items-center lg:justify-between">
              <Link href="/" className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded bg-ink text-sm font-semibold text-white">TS</span>
                <div>
                  <div className="text-sm font-semibold text-ink">상품기획 트렌드</div>
                  <div className="text-xs text-muted">Trend · Store · Assortment</div>
                </div>
              </Link>
              <nav className="flex flex-wrap items-center gap-1 text-sm text-muted">
                {primaryNav.map((item) => (
                  <Link key={item.href} className="rounded px-3 py-2 hover:bg-canvas hover:text-ink" href={item.href}>
                    {item.label}
                  </Link>
                ))}
                {featureFlags.enableInternalSales ? (
                  <Link className="rounded px-3 py-2 hover:bg-canvas hover:text-ink" href="/sales">
                    내부 판매
                  </Link>
                ) : null}
                {featureFlags.enableNaverTrends ? (
                  <>
                    <Link className="rounded px-3 py-2 hover:bg-canvas hover:text-ink" href="/trends">
                      검색 트렌드
                    </Link>
                    <Link className="rounded px-3 py-2 hover:bg-canvas hover:text-ink" href="/settings/keywords">
                      키워드
                    </Link>
                  </>
                ) : null}
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-[1440px] px-6 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
