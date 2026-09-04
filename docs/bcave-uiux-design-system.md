# B.CAVE (비케이브) UI/UX Design System & Tone and Manner Guide

본 문서는 B.CAVE의 사내 시스템, 대시보드, 웹페이지 등을 디자인하고 개발할 때 AI(CODEX, Copilot, Cursor 등)가 준수해야 할 디자인 시스템 및 코딩 가이드라인입니다.

## 1. Brand Identity

- **Company:** B.CAVE (비케이브 - 대한민국 대표 패션 리테일 기업)
- **Tone & Manner:** 현대적(Modern), 직관적(Intuitive), 데이터 기반의 신뢰감(Trustworthy)
- **Logo URL:** [https://www.bcave.co.kr/img/bcave_logo.png](https://www.bcave.co.kr/img/bcave_logo.png)

## 2. Color Palette

B.CAVE의 공식 브랜드 컬러 3종입니다. UI 컴포넌트(버튼, 배경, 텍스트 등) 생성 시 아래 색상 코드를 최우선으로 사용하세요.

| Color Name | HEX Code | Usage |
| :--- | :--- | :--- |
| **Primary (Dark)** | `#264148` | 메인 헤딩(h1, h2), 메인 버튼, 네비게이션 바, 주요 강조 포인트 |
| **Secondary (Medium)** | `#718790` | 서브 텍스트(설명글), 보조 버튼, 테두리(Border), 차트 보조 지표 |
| **Background (Light)** | `#DEE2E3` | 카드 배경, 호버(Hover) 효과, 섹션 분리 영역, 비활성화(Disabled) 상태 |

## 3. Typography

전사 표준 폰트는 **Pretendard(프리텐다드)**를 사용합니다.

- **Primary Font:** `Pretendard`, `sans-serif`
- **Font Weights:**
  - `Thin (100)` ~ `Light (300)`: 장식용 텍스트 또는 매우 큰 배경 타이틀
  - `Regular (400)`: 기본 본문 텍스트 (Body)
  - `Medium (500)`: 서브 텍스트, 인풋 라벨
  - `SemiBold (600)`: 카드 타이틀, 네비게이션 메뉴
  - `Bold (700)`: 서브 타이틀(h3, h4), 버튼 텍스트
  - `ExtraBold (800)` ~ `Black (900)`: 메인 타이틀(h1, h2), 핵심 데이터 수치(KPI) 강조

## 4. Developer Guide (Code Snippets)

### 4.1. Tailwind CSS Configuration (`tailwind.config.js`)

Tailwind 기반 프로젝트 시 아래와 같이 B.CAVE 컬러를 확장(extend)하여 사용합니다.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bcave: {
          dark: '#264148',
          medium: '#718790',
          light: '#DEE2E3',
        }
      },
      fontFamily: {
        sans: ['Pretendard', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
```
