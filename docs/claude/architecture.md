# Architecture

## Tech Stack
- **Framework**: Next.js 16 (App Router) + TypeScript + React 19
- **Database**: Supabase (PostgreSQL)
- **State**: Zustand 5 with Supabase sync
- **Auth**: Clerk (모든 라우트 보호, `/sign-in`과 public API 제외)
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
| `/monthly-plan` | 월간 계획 |
| `/month/[id]` | 월 상세 (drag-and-drop) |
| `/inventory` | 와인 병 인벤토리 |
| `/budget` | 예산/지출 |
| `/issues` | 이슈/리스크 |
| `/data-log` | Sea Lab (해양 데이터) |
| `/cost-calculator` | 원가 계산 |
| `/video-generator` | AI 비디오 생성 (Veo) |
| `/uaps` | UAPS 예측 대시보드 |
| `/uaps/[category]` | 카테고리별 UAPS |
| `/uaps/how-it-works` | 작동 원리 |
| `/cxp` | CXP 허브 |
| `/cxp/strategy` | 전략 기획서 |
| `/cxp/001~005` | 콘텐츠 플랜 |
| `/calendar`, `/checklist`, `/kpi`, `/settings` | 보조 페이지 |
| `/pricing` | 가격 페이지 |
| `/b/[code]` | 병 상세 (공개) |

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
| `/api/ocean-data` | KHOA+Open-Meteo 하이브리드 |
| `/api/ocean-data/khoa` | KHOA 전용 |
| `/api/uaps/predict` | UAPS AI 예측 |
| `/api/uaps/model/train` | Layer 1 학습 |
| `/api/uaps/product-info` | AI 제품 정보 (Google Search) |
| `/api/uaps/nlp/extract` | Gemini NLP 풍미 추출 |
| `/api/uaps/cellartracker/upload` | CellarTracker 업로드 |
| `/api/video-generator` | Google Veo |
| `/api/public/bottle` | 공개 병 정보 |
