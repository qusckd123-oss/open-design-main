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
          <header className="sticky top-0 z-20 border-b border-line bg-canvas/95 backdrop-blur">
            <div className="mx-auto flex min-h-[4.5rem] max-w-[1440px] flex-col gap-3 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-sm font-semibold uppercase tracking-[0.18em] text-ink">상품기획 트렌드</span>
                <span className="text-xs text-muted">Trend · Store · Assortment</span>
              </Link>
              <nav className="flex flex-wrap items-center gap-6 text-sm font-medium text-muted">
                {primaryNav.map((item) => (
                  <Link key={item.href} className="hover:text-ink" href={item.href}>
                    {item.label}
                  </Link>
                ))}
                {featureFlags.enableInternalSales ? (
                  <Link className="hover:text-ink" href="/sales">
                    내부 판매
                  </Link>
                ) : null}
                {featureFlags.enableNaverTrends ? (
                  <>
                    <Link className="hover:text-ink" href="/trends">
                      검색 트렌드
                    </Link>
                    <Link className="hover:text-ink" href="/settings/keywords">
                      키워드
                    </Link>
                  </>
                ) : null}
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-[1440px] px-6 py-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
