# Muse de Marée - Marketing Platform

해저숙성 샴페인 브랜드 **Muse de Marée**의 마케팅 전략 및 운영 관리 플랫폼입니다.

## 프로젝트 개요

2026년 7-8월 런칭을 목표로 하는 프리미엄 해저숙성 샴페인 브랜드의 마케팅 활동을 체계적으로 관리하고 추적하기 위한 웹 애플리케이션입니다.

### 핵심 기능

- **타임라인** - 런칭까지의 마케팅 마일스톤 시각화
- **월간 계획** - 월별 마케팅 활동 및 필수 체크리스트 관리
- **이슈 관리** - 마케팅 관련 이슈 추적 및 해결
- **예산 관리** - 마케팅 예산 배분 및 지출 추적
- **캘린더** - 마케팅 일정 관리
- **KPI 대시보드** - 핵심 성과 지표 모니터링
- **설정** - 앱 환경설정 및 사용자 관리

## 기술 스택

### Frontend
- **Next.js 16** - React 기반 풀스택 프레임워크
- **React 19** - UI 라이브러리
- **TypeScript** - 타입 안전성
- **Tailwind CSS 4** - 유틸리티 기반 스타일링
- **Framer Motion** - 애니메이션 라이브러리

### Backend & Services
- **Supabase** - PostgreSQL 데이터베이스 및 인증
- **Clerk** - 사용자 인증 및 세션 관리

### State Management
- **Zustand** - 경량 상태 관리

### UI Components
- **Lucide React** - 아이콘 라이브러리
- **@dnd-kit** - 드래그 앤 드롭 기능
- **date-fns** - 날짜 처리

## 시작하기

### 사전 요구사항

- Node.js 18.17 이상
- npm 또는 yarn

### 설치

```bash
# 저장소 클론
git clone https://github.com/your-repo/musedemaree-marketing.git

# 디렉토리 이동
cd marketing

# 의존성 설치
npm install
```

### 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수를 설정하세요:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 빌드

```bash
npm run build
```

### 프로덕션 실행

```bash
npm run start
```

## 프로젝트 구조

```
marketing/
├── src/
│   ├── app/                    # Next.js App Router 페이지
│   │   ├── budget/            # 예산 관리
│   │   ├── calendar/          # 캘린더
│   │   ├── issues/            # 이슈 관리
│   │   ├── kpi/               # KPI 대시보드
│   │   ├── month/             # 월별 상세
│   │   ├── monthly-plan/      # 월간 계획
│   │   ├── settings/          # 설정
│   │   ├── sign-in/           # 로그인
│   │   ├── timeline/          # 타임라인
│   │   └── layout.tsx         # 루트 레이아웃
│   ├── components/            # 재사용 컴포넌트
│   │   ├── layout/            # 레이아웃 컴포넌트
│   │   └── ui/                # UI 컴포넌트
│   ├── lib/                   # 유틸리티 및 설정
│   │   ├── supabase/          # Supabase 클라이언트
│   │   └── utils.ts           # 헬퍼 함수
│   └── store/                 # Zustand 스토어
├── docs/                      # 프로젝트 문서
│   └── DESIGN_SYSTEM.md       # 디자인 시스템 가이드
├── public/                    # 정적 파일
└── PRD.md                     # 제품 요구사항 문서
```

## 디자인 시스템

이 프로젝트는 **Deep Sea** 테마를 기반으로 한 독특한 디자인 시스템을 사용합니다.

### 핵심 컬러

- **배경**: `#0a0b0d` (Deep Sea Black)
- **카드 배경**: `bg-white/[0.02]` ~ `bg-white/[0.04]`
- **테두리**: `border-white/[0.06]` ~ `border-white/[0.08]`
- **액센트**: Rose Gold (`#B76E79`), Champagne Gold (`#C4A052`)

### 타이포그래피

- **영문**: Cormorant Garamond (세리프)
- **한글**: Pretendard (산세리프)

### 주요 패턴

- Glass Morphism 효과
- Framer Motion 애니메이션
- 반응형 디자인

자세한 내용은 [디자인 시스템 문서](/docs/DESIGN_SYSTEM.md)를 참조하세요.

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 검사 |

## 라이선스

Private - All Rights Reserved

## 문의

프로젝트 관련 문의사항은 프로젝트 관리자에게 연락하세요.
