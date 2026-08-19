import type { ReactNode } from "react";

export const metadata = {
  title: "와키윌리 상품기획 대시보드",
  description: "와키윌리 주간 상품 성과, 리오더 의사결정, 신상품 런칭 반응 대시보드"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
