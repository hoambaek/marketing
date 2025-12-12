# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ 최우선 사항 (TOP PRIORITY)

**커밋/배포 규칙:**
- 사용자가 명시적으로 요청할 때만 커밋/배포 수행
- "커밋해줘", "commit", "배포해줘", "deploy" 등의 명확한 지시가 있을 때만 실행
- 변경 작업 완료 후 자동으로 커밋하지 말 것
- 작업 완료 시 변경사항만 보고하고 커밋/배포는 사용자 지시 대기

## Development Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run lint     # Run ESLint
```

## Architecture Overview

**Muse de Marée Masterplan Management System** - A wine brand marketing/inventory management dashboard.

### Tech Stack
- Next.js 16 (App Router) + TypeScript + React 19
- Supabase (PostgreSQL database)
- Zustand (state management with Supabase sync)
- Clerk (authentication - protects `/inventory` routes)
- Tailwind CSS 4 + Framer Motion

### Application Structure

**Pages** (`src/app/`):
- `/` - Dashboard home
- `/monthly-plan` - Monthly plan overview
- `/month/[id]` - Month detail with weekly tasks
- `/inventory` - Protected inventory management (requires Clerk auth)
- `/calendar`, `/checklist`, `/kpi`, `/settings` - Supporting pages
- `/sign-in` - Clerk sign-in (login only, no signup)

**State Management** (`src/lib/store/`):
- `masterplan-store.ts` - Tasks, must-do items, KPIs, content items
- `inventory-store.ts` - Numbered bottles, batches, transactions, custom products

**Database Layer** (`src/lib/supabase/`):
- `client.ts` - Supabase client with `isSupabaseConfigured()` check
- `database.ts` - All CRUD functions + DB-to-App type mapping functions

### Data Flow Pattern

All state follows: **Supabase → Zustand → UI → Zustand → Supabase**

```typescript
// Store action pattern
someAction: async (data) => {
  set((state) => ({ ... }));  // 1. Update local state

  const { useSupabase } = get();
  if (useSupabase) {
    await db.createSomething(data);  // 2. Sync to Supabase
  }
}
```

## Database Integration Rules

**All new features must integrate with Supabase.** Do not use localStorage-only or Zustand persist-only storage.

### Implementation Checklist:
1. Create table schema in `supabase/` folder
2. Add CRUD functions to `database.ts`
3. Add DB → App type mapping function to `database.ts`
4. Call Supabase functions from store actions
5. Configure RLS policies if needed

### Existing Tables

**Masterplan**: `tasks`, `must_do_items`, `kpi_items`, `content_items`

**Inventory**: `numbered_bottles`, `inventory_batches`, `inventory_transactions`, `custom_products`

## Authentication

Clerk middleware protects `/inventory/*` routes. When Clerk is not configured (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` missing), middleware passes through and inventory shows a setup prompt.

## Git & Deployment Rules

**IMPORTANT:** Do NOT commit or deploy automatically.

- Only commit when the user explicitly says: "커밋해줘", "commit", "커밋"
- Only deploy when the user explicitly says: "배포해줘", "deploy", "배포"
- Always wait for user instruction before running `git commit` or `git push`
- After making changes, just report what was changed without committing
