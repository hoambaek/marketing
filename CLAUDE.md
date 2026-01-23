# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## TOP PRIORITY

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
- `/calendar`, `/checklist`, `/kpi`, `/settings` - Supporting pages

**State Management** (`src/lib/store/`):
- `masterplan-store.ts` - Tasks, must-do items, KPIs, content items
- `inventory-store.ts` - Numbered bottles, batches, transactions
- `budget-store.ts` - Budget items, expenses
- `issue-store.ts` - Issues/risks management
- `ocean-data-store.ts` - Ocean aging data
- `toast-store.ts` - UI notifications

**Database Layer** (`src/lib/supabase/`):
- `client.ts` - Supabase client with `isSupabaseConfigured()` check
- `database.ts` - All CRUD functions + DB↔App type mapping

**API Routes** (`src/app/api/`):
- `/api/ai-assistant` - Gemini AI with function calling (authenticated)
- `/api/upload` - S3 presigned URL file uploads (up to 50MB)
- `/api/ocean-data` - Ocean data fetching from Open-Meteo
- `/api/video-generator` - Google Veo video generation
- `/api/video-generator/download` - Video file download proxy

### Type System

All types defined in `src/lib/types/index.ts`:
- `Task`, `MustDoItem`, `KPIItem`, `ContentItem` - Masterplan types
- `NumberedBottle`, `InventoryBatch`, `InventoryTransaction` - Inventory types
- `BudgetItem`, `ExpenseItem` - Budget types
- `IssueItem` - Issue management types
- `OceanDataDaily`, `SalinityRecord` - Ocean data types
- `CostCalculatorSettings` - Cost calculation types

### Authentication

Clerk middleware (`src/middleware.ts`) protects **all routes** except:
- `/sign-in/*`, `/sign-up/*` - Auth pages
- `/api/health/*`, `/api/public/*` - Public APIs

When Clerk env vars are missing, middleware passes through (useful for local dev).

## Database Integration Rules

**All new features must integrate with Supabase.** No localStorage-only storage.

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
