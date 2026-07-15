# Architecture

## Tech Stack
- **Framework**: Next.js 16 (App Router) + TypeScript + React 19
- **Database**: Supabase (PostgreSQL)
- **State**: Zustand 5 with Supabase sync
- **Auth**: Clerk — `/sign-in`, `/tasting/*`, `/b/*`, `/api/{public,cron,external}/*` 제외 전 라우트 보호 (로컬은 보호 라우트가 404로 뜸)
- **Styling**: Tailwind CSS 4 + Framer Motion
- **AI**: Google Gemini (`@google/genai`, gemini-3-flash-preview)
- **Charts**: Recharts 3

## Data Flow
All state: **Supabase → Zustand → UI → Zustand → Supabase**
```typescript
// Optimistic update pattern
someAction: async (data) => {
  set((state) => ({ ... }));           // 1. 로컬 즉시 반영
  if (useSupabase) await db.create();  // 2. Supabase 동기화
}
```

## Pages
| 경로 | 기능 |
|------|------|
| `/` | Dashboard home |
| `/monthly-plan`, `/month/[id]` | 월간 계획 (drag-and-drop) |
| `/inventory` | 와인 병 인벤토리 |
| `/budget` | 예산/지출 |
| `/data-log` | Data Log (해양 데이터, 메뉴명 'Data Log') |
| `/cost-calculator` | 원가 계산 |
| `/video-generator` | AI 비디오 생성 (Veo/Seedance) |
| `/uaps` | UAPS 메인 = **샴페인 전용** 대시보드 |
| `/uaps/[category]` | 카테고리별 UAPS (slug: red-wine, whisky, yakju, soju, green-bean, puerh 등) |
| `/uaps/how-it-works` | 작동 원리 |
| `/uaps/marine-elevage` | 마린 엘레바주 소개 |
| `/uaps/tasting-review` | 외부 시음 제출 승인/거부 |
| `/tasting/[predictionId]` | **공개** 비교 시음 입력 (외부 기록자용, 로그인 불필요) |
| `/admin` | Members — 신청·구독자 관리 (brandbook_requests, invitations, partner_inquiries, subscribers) |
| `/cxp`, `/cxp/strategy`, `/cxp/001~005`, `/cxp/ideas` | CXP 허브·콘텐츠 플랜 |
| `/b/[code]`, `/b/preview/[productId]` | 병 상세 (공개) |
| `/calendar`, `/checklist`, `/kpi`, `/settings`, `/pricing` | 보조 페이지 |

## Stores (`src/lib/store/`)
| Store | 역할 |
|-------|------|
| `masterplan-store` | Tasks, must-do, KPIs, content items |
| `inventory-store` | Bottles, batches, transactions |
| `budget-store` | Budget items, expenses |
| `issue-store` | Issues/risks |
| `ocean-data-store` | KHOA + Open-Meteo 해양 데이터 |
| `uaps-store` | UAPS 제품, 예측, 모델 |
| `toast-store` | UI 알림 |

## API Routes (`src/app/api/`)
| 경로 | 기능 |
|------|------|
| `/api/ai-assistant` | Gemini AI + function calling |
| `/api/upload` | S3 presigned URL (50MB) |
| `/api/ocean-data`, `/api/ocean-data/khoa` | KHOA+Open-Meteo 하이브리드 / KHOA 전용 |
| `/api/cron/ocean-data` | **일일 크론** — Open-Meteo + KHOA(염분·조위·조류) + 부이 TW_0078 저장 |
| `/api/cron/ocean-data/backfill` | 과거 데이터 백필 |
| `/api/uaps/predict` | UAPS AI 예측 (Layer 2) |
| `/api/uaps/model/train` | Layer 1 통계 모델 학습 (전체 재집계) |
| `/api/uaps/product-info` | AI 제품 정보 (Google Search grounding) |
| `/api/uaps/nlp/extract` | Gemini NLP 풍미 추출 |
| `/api/uaps/tasting-submissions` | 시음 제출 목록/승인/거부 (보호) |
| `/api/uaps/cellartracker/upload` | CellarTracker 업로드 |
| `/api/public/tasting-submit` | **공개** 시음 제출 (predictionId 검증) |
| `/api/public/bottle` | 공개 병 정보 |
| `/api/external/db` | 외부 API (EXTERNAL_API_KEY 인증) |
| `/api/video-generator`, `.../download`, `.../seedance` | 비디오 생성 |
