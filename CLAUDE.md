# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## TOP PRIORITY

**0. 세션 시작 시 메모리 문서 읽기**
- 세션 시작 시 반드시 아래 메모리 파일을 읽어 이전 작업 맥락을 파악할 것
- `/Users/hoambaek/.claude/projects/-Users-hoambaek-Documents-Cursor-musedemaree-marketing/memory/MEMORY.md`
- 진행 상황 문서: `docs/uaps/UAPS_DATA_COLLECTION_PROGRESS.md`

**1. 한국어로 답변하기**
- 모든 응답은 한국어로 작성
- 코드 주석과 커밋 메시지도 한국어 권장

**2. 커밋/배포 자동 금지**
- 명시적 요청 시에만 커밋: "커밋해줘", "commit", "커밋"
- 명시적 요청 시에만 배포: "배포해줘", "deploy", "배포"
- 변경 후에는 커밋 없이 변경 내용만 보고

## Development Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run lint     # Run ESLint
npm run start    # Start production server
```

## Architecture Overview

**Muse de Marée Marketing Platform** - A wine brand marketing/inventory management dashboard for a premium ocean-aged champagne brand launching in 2026.

### Tech Stack
- **Framework**: Next.js 16 (App Router) + TypeScript + React 19
- **Database**: Supabase (PostgreSQL)
- **State**: Zustand with Supabase sync
- **Auth**: Clerk (protects all routes except `/sign-in` and public APIs)
- **Styling**: Tailwind CSS 4 + Framer Motion
- **AI**: Google Gemini (gemini-3-flash-preview) for AI assistant

### Core Data Flow

All state follows: **Supabase → Zustand → UI → Zustand → Supabase**

```typescript
// Optimistic update pattern in all store actions
someAction: async (data) => {
  set((state) => ({ ... }));  // 1. Update local state immediately

  const { useSupabase } = get();
  if (useSupabase) {
    await db.createSomething(data);  // 2. Sync to Supabase
  }
}
```

### Application Structure

**Pages** (`src/app/`):
- `/` - Dashboard home
- `/monthly-plan` - Monthly plan overview with phases
- `/month/[id]` - Month detail with weekly tasks (drag-and-drop)
- `/inventory` - Wine bottle inventory management
- `/budget` - Budget and expense tracking
- `/issues` - Issue/risk management
- `/data-log` - Ocean aging data visualization
- `/cost-calculator` - Product cost calculation
- `/video-generator` - AI video generation (Google Veo)
- `/uaps` - UAPS 해저 숙성 예측 대시보드
- `/uaps/how-it-works` - UAPS 작동 원리 인포그래픽
- `/calendar`, `/checklist`, `/kpi`, `/settings` - Supporting pages

**State Management** (`src/lib/store/`):
- `masterplan-store.ts` - Tasks, must-do items, KPIs, content items
- `inventory-store.ts` - Numbered bottles, batches, transactions
- `budget-store.ts` - Budget items, expenses
- `issue-store.ts` - Issues/risks management
- `ocean-data-store.ts` - Ocean aging data
- `uaps-store.ts` - UAPS 예측 시스템 (제품, 예측, 모델, 설정)
- `toast-store.ts` - UI notifications

**Database Layer** (`src/lib/supabase/`):
- `client.ts` - Supabase client with `isSupabaseConfigured()` check
- `database.ts` - All CRUD functions + DB↔App type mapping
- `database/uaps.ts` - UAPS 전용 CRUD (제품, 예측, 모델, 설정, 지상 데이터)

**API Routes** (`src/app/api/`):
- `/api/ai-assistant` - Gemini AI with function calling (authenticated)
- `/api/upload` - S3 presigned URL file uploads (up to 50MB)
- `/api/ocean-data` - Ocean data fetching from Open-Meteo
- `/api/video-generator` - Google Veo video generation
- `/api/video-generator/download` - Video file download proxy
- `/api/uaps/predict` - UAPS AI 예측 (Gemini Layer 2)
- `/api/uaps/model/train` - Layer 1 모델 학습
- `/api/uaps/nlp/extract` - Gemini NLP 풍미 6축 추출
- `/api/uaps/cellartracker/upload` - CellarTracker 데이터 업로드

### Type System

All types defined in `src/lib/types/index.ts`:
- `Task`, `MustDoItem`, `KPIItem`, `ContentItem` - Masterplan types
- `NumberedBottle`, `InventoryBatch`, `InventoryTransaction` - Inventory types
- `BudgetItem`, `ExpenseItem` - Budget types
- `IssueItem` - Issue management types
- `OceanDataDaily`, `SalinityRecord` - Ocean data types
- `CostCalculatorSettings` - Cost calculation types

UAPS types defined in `src/lib/types/uaps.ts`:
- `AgingProduct`, `AgingPrediction`, `WineTerrestrialData`, `TerrestrialModel`
- `UAPSConfig`, `FlavorDictionary`, `ProductInput`
- 6축 풍미: `fruity`, `floralMineral`, `yeastyAutolytic`, `acidityFreshness`, `bodyTexture`, `finishComplexity`

### Authentication

Clerk middleware (`src/middleware.ts`) protects **all routes** except:
- `/sign-in/*`, `/sign-up/*` - Auth pages
- `/api/health/*`, `/api/public/*` - Public APIs

When Clerk env vars are missing, middleware passes through (useful for local dev).

## Database Integration Rules

**All new features must integrate with Supabase.** No localStorage-only storage.

**필수: DB 관련 작업 시 항상 `supabase-postgres-best-practices` 스킬을 사용할 것.**
- 스키마 설계, 쿼리 작성, 인덱스, RLS 정책, 마이그레이션 등 모든 DB 작업에 적용
- 작업 시작 전 `/supabase-postgres-best-practices` 스킬을 호출하여 베스트 프랙티스 확인

### Implementation Checklist:
1. Create/update table schema in `supabase/schema.sql`
2. Add CRUD functions to `src/lib/supabase/database.ts`
3. Add DB↔App type mapping function (e.g., `mapDbTaskToTask`)
4. Call Supabase functions from Zustand store actions
5. Configure RLS policies if needed

### Existing Tables

**Masterplan**: `tasks`, `must_do_items`, `kpi_items`, `content_items`
**Inventory**: `numbered_bottles`, `inventory_batches`, `inventory_transactions`, `custom_products`
**Budget**: `budget_items`, `expense_items`
**Issues**: `issues`
**Ocean Data**: `ocean_data_daily`, `salinity_records`
**Cost Calculator**: `cost_calculator_settings`
**UAPS**: `wine_terrestrial_data`, `terrestrial_model`, `aging_products`, `aging_predictions`, `uaps_config`, `flavor_dictionary`

### Field Naming Convention
- **Database**: snake_case (e.g., `due_date`, `created_at`)
- **TypeScript**: camelCase (e.g., `dueDate`, `createdAt`)
- Use mapping functions to convert between them

## Design System

This project uses a **Deep Sea** theme:
- **Background**: `#0a0b0d` (Deep Sea Black)
- **Cards**: `bg-white/[0.02]` to `bg-white/[0.04]`
- **Borders**: `border-white/[0.06]` to `border-white/[0.08]`
- **Accents**: Rose Gold (`#B76E79`), Champagne Gold (`#C4A052`)
- **Fonts**: Cormorant Garamond (English), Pretendard (Korean)

## UAPS (Undersea Aging Predictive System)

해저 숙성 풍미 예측 시스템. 2-Layer Hybrid AI 아키텍처.

### 핵심 파일
- `src/lib/utils/uaps-engine.ts` - Layer 1 통계 엔진 (질감/향/기포/환원취 계산, 복합 품질, 골든 윈도우)
- `src/lib/utils/uaps-ai-predictor.ts` - Layer 2 Gemini AI 추론 (전문가 프로파일, TCI/FRI/BRI 보정)
- `src/lib/store/uaps-store.ts` - Zustand 상태 관리
- `src/lib/supabase/database/uaps.ts` - DB CRUD
- `src/lib/types/uaps.ts` - 타입 + 상수 (FLAVOR_AXES, WINE_TYPE_LABELS 등)
- `docs/uaps/UAPS_MASTER_PLAN.md` - 마스터 플랜

### 풍미 6축 (WSET/OIV 기준)
DB 컬럼: `fruity_score`, `floral_mineral_score`, `yeasty_autolytic_score`, `acidity_freshness_score`, `body_texture_score`, `finish_complexity_score`
TS 키: `fruity`, `floralMineral`, `yeastyAutolytic`, `acidityFreshness`, `bodyTexture`, `finishComplexity`

### 예측 파이프라인
1. 지상 데이터 수집 → `wine_terrestrial_data` (현재 **112,316건**, 8개 카테고리)
2. NLP 6축 풍미 추출 → Ollama 로컬 LLM 배치 처리 (`data/scripts/nlp_extract_ollama.mjs`)
3. Layer 1: 와인 타입 × 숙성 단계 클러스터링 → `terrestrial_model` (19개 그룹)
4. Layer 2: Gemini AI 전문가 프로파일 생성
5. 해저 환경 보정: TCI(질감) · FRI(향) · BRI(기포)
6. 타임라인 1~36개월 + 골든 윈도우 + 품질 점수(0~100)

### 8개 카테고리 데이터 현황
| 카테고리 | DB 건수 | 주요 소스 |
|---------|--------|---------|
| 샴페인/와인 | ~76,335 | WineMag 130K + Decanter + Parker + Gambero Rosso |
| 콜드브루 커피 | ~19,056 | CoffeeReview + CoE + SCAJ + Sweet Maria's |
| 사케 | ~5,067 | 全国新酒鑑評会 + 広島 + Kura Master + SAKEDOO |
| 생차/보이차 | ~3,185 | YunnanSourcing + 号级茶 + TeaDB + Reddit |
| 한국 전통주 | ~2,379 | 더술닷컴 + 전통주갤러리 + 우리술닷컴 |
| 간장 | ~1,263 | 職人醤油 + 全国品評会 + 식품안전나라 |
| 식초 | ~702 | Amazon US 발사믹 + 일본 黒酢 + 예천 감식초 |
| 위스키 | ~435 | WhiskyBase + WhiskyAdvocate |

### 보정 계수
- **TCI** (Temperature-Pressure Coefficient): 기본값 0.40, 가설적 추정
- **FRI** (Flavor Retention Index): 기본값 0.56, 아레니우스 방정식 기반
- **BRI** (Bubble Retention Index): 기본값 0.72, Henry의 법칙 기반

### 데이터 수집 도구
- `data/scripts/nlp_extract_ollama.mjs` - Ollama LLM 6축 NLP 추출 (현재 진행 중)
- `docs/uaps/NLP_EXTRACTION_GUIDE.md` - NLP 추출 원격 실행 가이드
- `data/cellartracker/upload_csv.mjs` - CSV → Supabase 업로드
- `data/cellartracker/upload_notes.mjs` - JSON → Supabase 업로드

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Google AI
GEMINI_API_KEY=

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=
```
