# Muse de Marée Marketing - Claude Code Instructions

## Project Overview
- Next.js 16 (App Router) + TypeScript
- Clerk 인증 (재고관리 페이지 보호)
- Supabase 데이터베이스
- Zustand 상태관리

## Database Integration Rules

**모든 새로운 기능은 반드시 Supabase와 연동되어야 합니다.**

### 필수 사항:
1. **새 기능 구현 시**: localStorage나 Zustand persist만 사용하지 말고, 반드시 Supabase 테이블에 저장
2. **데이터 흐름**:
   - 초기화: Supabase에서 데이터 로드 → Zustand 상태 업데이트
   - 변경: Zustand 상태 업데이트 + Supabase에 동기화
3. **타입 매핑**: DB 응답을 앱 타입으로 변환하는 매핑 함수 작성 (`src/lib/supabase/database.ts`)

### 구현 패턴:
```typescript
// Store action 예시
someAction: async (data) => {
  // 1. 로컬 상태 업데이트
  set((state) => ({ ... }));

  // 2. Supabase 동기화
  const { useSupabase } = get();
  if (useSupabase) {
    await db.createSomething(data);
  }
}
```

### 체크리스트:
- [ ] 필요한 Supabase 테이블 스키마 작성 (`supabase/` 폴더)
- [ ] `database.ts`에 CRUD 함수 추가
- [ ] `database.ts`에 DB → App 타입 매핑 함수 추가
- [ ] Store에서 Supabase 함수 호출
- [ ] RLS 정책 설정 (필요시)

## Existing Database Tables

### Masterplan (4 tables):
- `tasks` - 주간 업무
- `must_do_items` - Must Do 항목
- `kpi_items` - KPI 지표
- `content_items` - 콘텐츠 아이템

### Inventory (4 tables):
- `numbered_bottles` - 넘버링 병 재고 (2025 First Edition)
- `inventory_batches` - 일반 재고 수량
- `inventory_transactions` - 거래 기록
- `custom_products` - 커스텀 상품

## Key Files
- `/src/lib/supabase/client.ts` - Supabase 클라이언트
- `/src/lib/supabase/database.ts` - DB 함수 및 매핑
- `/src/lib/store/` - Zustand 스토어들
- `/src/lib/types/index.ts` - 타입 정의
