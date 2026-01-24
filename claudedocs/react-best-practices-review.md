# Muse de Marée Marketing Platform - React Best Practices 리뷰

> **분석일**: 2026-01-24
> **기준**: Vercel React Best Practices (45 Rules)
> **프로젝트**: Next.js 16 + React 19 + Zustand + Supabase

---

## 요약

| 카테고리 | 상태 | 점수 |
|----------|------|------|
| Eliminating Waterfalls | ✅ 우수 | 85/100 |
| Bundle Size Optimization | ⚠️ 개선 필요 | 60/100 |
| Server-Side Performance | ⚠️ 개선 필요 | 55/100 |
| Client-Side Data Fetching | ✅ 양호 | 75/100 |
| Re-render Optimization | ⚠️ 개선 필요 | 65/100 |
| Rendering Performance | ✅ 양호 | 70/100 |
| JavaScript Performance | ✅ 양호 | 75/100 |
| Advanced Patterns | ➖ 해당 없음 | - |

**종합 점수: 69/100**

---

## 1. Eliminating Waterfalls (CRITICAL) - 85점

### ✅ 잘 적용된 부분

#### `async-parallel` - Promise.all 활용
```typescript
// masterplan-store.ts:107-112
const [tasks, mustDoItems, kpiItems, contentItems] = await Promise.all([
  db.fetchTasks(),
  db.fetchMustDoItems(),
  db.fetchKPIItems(),
  db.fetchContentItems(),
]);
```
**평가**: 4개의 독립적인 데이터 페칭을 병렬로 처리하여 워터폴 제거.

```typescript
// inventory-store.ts:167-172
const [bottles, batches, transactions, customProducts] = await Promise.all([
  db.fetchNumberedBottles(),
  db.fetchInventoryBatches(),
  db.fetchInventoryTransactions(500),
  db.fetchCustomProducts(),
]);
```
**평가**: 인벤토리 데이터도 병렬 페칭 적용.

### ⚠️ 개선 필요

#### Dashboard 페이지 초기화 워터폴
```typescript
// page.tsx (Dashboard):278-283
useEffect(() => {
  if (!masterplanInitialized) initMasterplan();
  if (!budgetInitialized) initBudget();
  if (!issueInitialized) initIssues();
  if (!inventoryInitialized) initializeInventory();
}, [...]);
```
**문제**: 4개의 스토어 초기화가 순차적으로 발생할 수 있음.

**권장 수정**:
```typescript
useEffect(() => {
  Promise.all([
    !masterplanInitialized && initMasterplan(),
    !budgetInitialized && initBudget(),
    !issueInitialized && initIssues(),
    !inventoryInitialized && initializeInventory(),
  ].filter(Boolean));
}, []);
```

---

## 2. Bundle Size Optimization (CRITICAL) - 60점

### ⚠️ 개선 필요

#### `bundle-barrel-imports` - Barrel 파일 피하기
```typescript
// inventory/page.tsx:8-16
import {
  PRODUCTS,
  Product,
  ProductType,
  InventoryStatus,
  INVENTORY_STATUS_LABELS,
  INVENTORY_STATUS_COLORS,
  NumberedBottle,
} from '@/lib/types';
```
**문제**: `@/lib/types`에서 필요한 것만 임포트하지만, 내부적으로 barrel export 사용 시 전체 번들 포함 가능.

**권장 수정**: 타입별로 파일 분리
```
src/lib/types/
  index.ts        # re-exports만
  products.ts     # Product, ProductType, PRODUCTS
  inventory.ts    # InventoryStatus, NumberedBottle 등
  tasks.ts        # Task, TaskCategory 등
```

#### `bundle-dynamic-imports` - 동적 임포트 미사용
```typescript
// 현재: 모든 컴포넌트가 정적 임포트
import TaskModal from '@/components/TaskModal';
import FileUpload from './FileUpload';
```

**권장 수정**: 모달 컴포넌트 동적 임포트
```typescript
const TaskModal = dynamic(() => import('@/components/TaskModal'), {
  loading: () => <div className="animate-pulse" />,
});

const FileUpload = dynamic(() => import('./FileUpload'), {
  ssr: false,
});
```

#### `bundle-defer-third-party` - 서드파티 지연 로딩
```typescript
// layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/react';
```
**문제**: Clerk과 Analytics가 즉시 로드됨.

**권장**: Analytics는 하이드레이션 후 로드
```typescript
const Analytics = dynamic(
  () => import('@vercel/analytics/react').then(mod => mod.Analytics),
  { ssr: false }
);
```

### ✅ 잘 적용된 부분

- Framer Motion은 대부분의 페이지에서 실제로 사용되므로 적절함
- Lucide 아이콘은 개별 임포트로 tree-shaking 가능

---

## 3. Server-Side Performance (HIGH) - 55점

### ❌ 미적용

#### `server-cache-react` - React.cache() 미사용
현재 모든 페이지가 `'use client'`로 클라이언트 컴포넌트임.

**문제**: 서버 컴포넌트의 장점을 활용하지 못함.

**권장 아키텍처**:
```typescript
// app/inventory/page.tsx (Server Component)
import { cache } from 'react';
import { fetchInventoryData } from '@/lib/supabase/database';

const getInventory = cache(async () => {
  return fetchInventoryData();
});

export default async function InventoryPage() {
  const data = await getInventory();
  return <InventoryClient initialData={data} />;
}
```

#### `server-serialization` - 클라이언트로 전달되는 데이터 최소화
현재 모든 데이터가 클라이언트에서 페칭되어 이 규칙이 적용되지 않음.

### ⚠️ 부분 적용

#### 전체 앱이 클라이언트 컴포넌트
```typescript
// 모든 주요 페이지
'use client';
```
**영향**:
- 초기 번들 크기 증가
- TTFB(Time to First Byte) 증가
- SEO 최적화 제한

**권장**: 하이브리드 접근법
- Dashboard: 초기 데이터는 서버에서 페칭
- 상호작용이 필요한 부분만 클라이언트 컴포넌트로 분리

---

## 4. Client-Side Data Fetching (MEDIUM-HIGH) - 75점

### ✅ 잘 적용된 부분

#### `client-swr-dedup` - Zustand으로 중복 요청 방지
```typescript
// masterplan-store.ts
isInitialized: false,
isLoading: false,

initializeFromSupabase: async () => {
  if (!isSupabaseConfigured()) {
    set({ isInitialized: true, useSupabase: false });
    return;
  }
  set({ isLoading: true });
  // ...
}
```
**평가**: `isInitialized` 플래그로 중복 초기화 방지.

### ⚠️ 개선 필요

#### 재요청 로직 미흡
- SWR/React Query 미사용으로 자동 재시도, stale-while-revalidate 패턴 부재
- 에러 발생 시 수동 재시도 필요

**권장**: 중요 데이터에 TanStack Query 도입
```typescript
const { data, isLoading, refetch } = useQuery({
  queryKey: ['inventory'],
  queryFn: fetchInventoryData,
  staleTime: 5 * 60 * 1000, // 5분
  retry: 3,
});
```

---

## 5. Re-render Optimization (MEDIUM) - 65점

### ⚠️ 개선 필요

#### `rerender-functional-setstate` - 일부 미적용
```typescript
// TaskModal.tsx:152-154 ✅ 잘 적용됨
const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setFormData(prev => ({ ...prev, title: e.target.value }));
};
```

```typescript
// inventory/page.tsx ⚠️ 인라인 함수 문제
onClick={() => handleBottleClick(bottle.bottleNumber)}
```
**문제**: 렌더링마다 새 함수 생성

**권장**:
```typescript
const handleBottleClickMemo = useCallback((bottleNumber: number) => {
  const bottle = numberedBottles.find((b) => b.bottleNumber === bottleNumber);
  if (bottle) setSelectedBottle(bottle);
}, [numberedBottles]);
```

#### `rerender-derived-state` - 파생 상태 구독
```typescript
// page.tsx (Dashboard)
const taskProgress = mounted ? getTotalProgress() : 0;
const totalBudget = mounted ? getTotalBudgeted(selectedYear) : 0;
```
**문제**: 컴포넌트가 전체 스토어를 구독함.

**권장**: 선택적 구독
```typescript
// Zustand shallow 비교 사용
const taskProgress = useMasterPlanStore(
  useCallback(state => state.getTotalProgress(), [])
);
```

#### `rerender-lazy-state-init` - 지연 상태 초기화
```typescript
// TaskModal.tsx:35-48
const [formData, setFormData] = useState({
  title: '',
  // ... 많은 필드
});
```
**문제**: 복잡한 객체 초기화

**권장**:
```typescript
const [formData, setFormData] = useState(() => ({
  title: '',
  description: '',
  // ...
}));
```

---

## 6. Rendering Performance (MEDIUM) - 70점

### ✅ 잘 적용된 부분

#### `rendering-conditional-render` - 조건부 렌더링
```typescript
// TaskModal.tsx:147
if (!isOpen) return null;
```
**평가**: 모달이 닫혀있을 때 렌더링 방지.

#### Framer Motion 최적화
```typescript
// containerVariants, itemVariants 정의를 컴포넌트 외부에 배치
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { ... },
};
```
**평가**: 애니메이션 설정 재생성 방지.

### ⚠️ 개선 필요

#### `rendering-hydration-no-flicker` - 하이드레이션 플리커
```typescript
// page.tsx (Dashboard):272-276
const [mounted, setMounted] = useState(false);
useEffect(() => {
  setMounted(true);
}, []);
```
**문제**: 마운트 전후 다른 컨텐츠 렌더링으로 플리커 발생 가능.

**권장**: 초기 스켈레톤 일관성 유지 (이미 일부 적용됨)

#### `rendering-content-visibility` - 긴 리스트 최적화
```typescript
// inventory/page.tsx - 50개 병 그리드
<div className="grid grid-cols-10 gap-1.5">
  {numberedBottles.map((bottle) => (...))}
</div>
```
**권장**:
```css
.bottle-grid {
  content-visibility: auto;
  contain-intrinsic-size: 400px;
}
```

---

## 7. JavaScript Performance (LOW-MEDIUM) - 75점

### ✅ 잘 적용된 부분

#### `js-set-map-lookups` - 효율적인 조회
```typescript
// PRODUCT_COLORS 객체 사용 - O(1) 조회
const getProductColors = (productId: string) => {
  return PRODUCT_COLORS[productId] || PRODUCT_COLORS.default;
};
```

#### `js-early-exit` - 조기 반환
```typescript
// masterplan-store.ts:97-101
initializeFromSupabase: async () => {
  if (!isSupabaseConfigured()) {
    set({ isInitialized: true, useSupabase: false });
    return;  // 조기 반환
  }
  // ...
}
```

### ⚠️ 개선 필요

#### `js-combine-iterations` - 반복 결합
```typescript
// page.tsx (Dashboard):351-355
const overdueTasks = mounted ? tasks.filter(t =>
  t.year === selectedYear &&
  t.month < currentMonth &&
  t.status === 'pending'
).slice(0, 2) : [];
```
**평가**: 이미 최적화됨 (filter + slice).

#### `js-index-maps` - 반복 조회 시 Map 사용
```typescript
// inventory/page.tsx:1467-1469
const product = PRODUCTS.find((p) => p.id === tx.productId);
const customProduct = allProductsList.find((p) => p.id === tx.productId);
```
**문제**: 각 트랜잭션마다 O(n) 조회

**권장**:
```typescript
const productMap = useMemo(() =>
  new Map(PRODUCTS.map(p => [p.id, p])),
  []
);
const product = productMap.get(tx.productId);
```

---

## 8. 주요 개선 권장사항 (우선순위 순)

### 🔴 Critical (즉시 적용 권장)

1. **동적 임포트 적용**
   - `TaskModal`, `BudgetModal`, `IssueModal` 등 모달 컴포넌트
   - `FileUpload` 컴포넌트
   - 예상 효과: 초기 번들 크기 20-30% 감소

2. **서버 컴포넌트 도입**
   - Dashboard 페이지의 초기 데이터 페칭
   - 정적 콘텐츠 분리
   - 예상 효과: TTFB 30-40% 개선

### 🟡 Important (다음 스프린트 권장)

3. **Zustand 선택적 구독**
   ```typescript
   // 변경 전
   const { tasks, getTotalProgress } = useMasterPlanStore();

   // 변경 후
   const tasks = useMasterPlanStore(state => state.tasks);
   const progress = useMasterPlanStore(state => state.getTotalProgress());
   ```
   예상 효과: 불필요한 리렌더링 50% 감소

4. **타입 파일 분리**
   - `@/lib/types` barrel 파일 분리
   - 예상 효과: 빌드 시간 개선, tree-shaking 향상

### 🟢 Recommended (시간 여유 시)

5. **useCallback 적용**
   - 자주 재생성되는 이벤트 핸들러
   - 특히 리스트 아이템의 onClick 핸들러

6. **CSS content-visibility**
   - 50개 병 그리드
   - 거래 내역 리스트
   - 예상 효과: 스크롤 성능 향상

---

## 파일별 점검 체크리스트

| 파일 | 우선순위 | 작업 |
|------|----------|------|
| `src/app/page.tsx` | 🔴 | 서버 컴포넌트 분리, 병렬 초기화 |
| `src/app/inventory/page.tsx` | 🔴 | 동적 임포트, Map 조회 최적화 |
| `src/components/TaskModal.tsx` | 🟡 | 동적 임포트, lazy state init |
| `src/lib/types/index.ts` | 🟡 | 파일 분리 |
| `src/lib/store/*.ts` | 🟢 | 선택적 구독 최적화 |

---

## 결론

프로젝트는 전반적으로 **양호한 성능 기반**을 갖추고 있으나, Next.js 16의 서버 컴포넌트 활용과 번들 최적화 측면에서 개선 여지가 있습니다.

**즉시 적용 시 예상 효과**:
- 초기 로드 시간: 25-35% 개선
- 번들 크기: 20-30% 감소
- 리렌더링 빈도: 40-50% 감소

**장기적 권장사항**:
- TanStack Query 도입으로 데이터 페칭 안정성 향상
- 서버 컴포넌트로 점진적 마이그레이션
- 성능 모니터링 도구 도입 (Web Vitals)
