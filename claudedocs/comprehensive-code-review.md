# 뮤즈드마레 마케팅 플랫폼 - 종합 코드 리뷰

> **분석일**: 2026-01-24
> **버전**: Post React Best Practices 적용
> **범위**: 코드 품질, 보안, 성능, 접근성, 유지보수성

---

## 요약

| 분야 | 상태 | 우선순위 |
|------|------|----------|
| 보안 (Security) | ✅ 양호 | - |
| 에러 핸들링 (Error Handling) | ⚠️ 개선 필요 | 🔴 높음 |
| 코드 구조 (Code Structure) | ⚠️ 개선 필요 | 🟡 중간 |
| TypeScript 품질 | ✅ 양호 | - |
| 프로덕션 준비 (Production Ready) | ⚠️ 개선 필요 | 🔴 높음 |
| 접근성 (Accessibility) | ⚠️ 개선 필요 | 🟡 중간 |
| 번들 최적화 (추가) | ⚠️ 개선 필요 | 🟡 중간 |

---

## 1. 보안 (Security) ✅

### 잘 적용된 부분

#### 1.1 인증 미들웨어
```typescript
// src/middleware.ts - 모든 라우트 보호
const clerkAuthMiddleware = clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req) || isPublicApiRoute(req)) return;
  await auth.protect();
});
```
**평가**: 공개 라우트를 제외한 모든 API와 페이지가 Clerk로 보호됨.

#### 1.2 API 인증 검증
```typescript
// 모든 API 라우트에서 인증 확인
const { userId } = await auth();
if (!userId) {
  return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
}
```

#### 1.3 AI 함수 호출 제한
```typescript
// src/app/api/ai-assistant/route.ts
const ALLOWED_FUNCTIONS = ['get_tasks', 'get_kpi_items', ...];
const WRITE_FUNCTIONS = ['create_task', 'update_task', ...];

// 허용되지 않은 함수 차단
if (!isAllowed && !isWriteFunction) {
  console.warn(`Blocked unauthorized function call: ${call.name}`);
}
```

#### 1.4 파일 업로드 검증
```typescript
// MIME 타입 검증 + 파일 크기 제한 (50MB)
if (!allowedMimeTypes.includes(fileType)) {
  return NextResponse.json({ error: `허용되지 않은 파일 형식` }, { status: 400 });
}
```

---

## 2. 에러 핸들링 (Error Handling) ⚠️

### 🔴 Critical: Error Boundary 미적용

현재 프로젝트에 React Error Boundary가 없음. 컴포넌트 에러 시 전체 앱이 크래시될 수 있음.

**권장 구현**:

```typescript
// src/components/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 에러 로깅 서비스로 전송 (Sentry, LogRocket 등)
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0b0d]">
          <div className="text-center p-8">
            <h2 className="text-xl text-white/80 mb-4">문제가 발생했습니다</h2>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-[#b7916e]/20 text-[#b7916e] rounded-lg"
            >
              다시 시도
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**적용 위치** (`layout.tsx`):
```typescript
<ErrorBoundary>
  <SupabaseInitializer>
    <main>{children}</main>
  </SupabaseInitializer>
</ErrorBoundary>
```

### 🟡 Supabase 에러 복구

현재 Supabase 실패 시 로컬 폴백만 있고, 재시도 로직 없음.

```typescript
// 현재 (masterplan-store.ts:153)
} catch (error) {
  console.error('Failed to initialize from Supabase:', error);
  set({ isLoading: false, isInitialized: true, useSupabase: false });
}
```

**권장: 재시도 로직 추가**
```typescript
const retryWithBackoff = async (fn: () => Promise<void>, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await fn();
      return;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
};
```

---

## 3. 코드 구조 (Code Structure) ⚠️

### 🔴 database.ts 파일 분리 필요

`src/lib/supabase/database.ts`가 **1,600줄 이상**으로 너무 큼.

**권장 분리**:
```
src/lib/supabase/
├── client.ts           # Supabase 클라이언트 (현재 유지)
├── database/
│   ├── index.ts        # Re-exports
│   ├── tasks.ts        # Task CRUD
│   ├── inventory.ts    # Inventory CRUD
│   ├── budget.ts       # Budget CRUD
│   ├── issues.ts       # Issues CRUD
│   ├── ocean-data.ts   # Ocean Data CRUD
│   └── cost-calculator.ts
```

### 🔴 프로덕션 console 문 제거

**총 70개 이상의 console.log/error/warn 발견**

| 파일 | 개수 |
|------|------|
| database.ts | 50+ |
| API routes | 15+ |
| Components | 5+ |

**권장 해결책**:

1. **환경별 로거 도입**:
```typescript
// src/lib/logger.ts
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: unknown[]) => isDev && console.log(...args),
  error: (...args: unknown[]) => console.error(...args), // 에러는 항상 로깅
  warn: (...args: unknown[]) => isDev && console.warn(...args),
};
```

2. **ESLint 규칙 추가** (`.eslintrc.json`):
```json
{
  "rules": {
    "no-console": ["warn", { "allow": ["error"] }]
  }
}
```

### 🟡 deprecated `.substr()` 사용

```typescript
// database.ts, upload/route.ts 등
Math.random().toString(36).substr(2, 9)
```

**권장**: `.substring()` 또는 `.slice()` 사용
```typescript
Math.random().toString(36).substring(2, 11)
```

---

## 4. 프로덕션 준비 (Production Ready) ⚠️

### 🔴 환경 변수 검증 강화

API 키가 없을 때 더 명확한 처리 필요.

```typescript
// 현재 (ai-assistant/route.ts:10)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
```

**권장**:
```typescript
// src/lib/config.ts
const requiredEnvVars = ['GEMINI_API_KEY', 'NEXT_PUBLIC_SUPABASE_URL'] as const;

export function validateEnv() {
  const missing = requiredEnvVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing env vars: ${missing.join(', ')}`);
  }
}
```

### 🟡 로딩 스켈레톤 일관성

일부 페이지에만 스켈레톤 적용됨.

**누락된 페이지**:
- `/kpi`
- `/calendar`
- `/checklist`

---

## 5. 번들 최적화 (추가) ⚠️

### 🟡 Layout.tsx 동적 임포트

```typescript
// 현재 (layout.tsx)
import AiChat from '@/components/AiChat';  // 정적 임포트
```

AiChat은 사용자 상호작용 후에만 필요하므로 지연 로딩 가능.

**권장**:
```typescript
import dynamic from 'next/dynamic';

const AiChat = dynamic(() => import('@/components/AiChat'), {
  ssr: false,
  loading: () => null,
});
```

### 🟡 타입 파일 분리

`src/lib/types/index.ts`가 500줄 이상. Barrel export 사용 시 tree-shaking 영향.

**권장 분리**:
```
src/lib/types/
├── index.ts          # Re-exports만
├── task.ts           # Task 관련 타입
├── inventory.ts      # Inventory 관련 타입
├── budget.ts         # Budget 관련 타입
├── issue.ts          # Issue 관련 타입
├── ocean-data.ts     # Ocean Data 관련 타입
└── constants.ts      # 상수들 (PRODUCTS, MONTHS_INFO 등)
```

---

## 6. 접근성 (Accessibility) ⚠️

### 🟡 버튼 aria-label 누락

```typescript
// AiChat.tsx - 닫기 버튼
<button onClick={() => setIsOpen(false)} className="...">
  <svg>...</svg>  // aria-label 없음
</button>
```

**권장**:
```typescript
<button
  onClick={() => setIsOpen(false)}
  aria-label="채팅창 닫기"
  className="..."
>
```

### 🟡 폼 라벨 연결

```typescript
// TaskModal 등에서 label과 input 연결 확인 필요
<input id="title" ... />
<label htmlFor="title">...</label>  // htmlFor 확인
```

---

## 7. 추가 개선 권장사항

### 7.1 useCallback 추가 적용

인벤토리 페이지의 이벤트 핸들러:

```typescript
// 현재
onClick={() => handleBottleClick(bottle.bottleNumber)}

// 권장
const handleBottleClickMemo = useCallback((bottleNumber: number) => {
  // ...
}, [deps]);
```

### 7.2 React.memo 적용

자주 리렌더링되는 리스트 아이템 컴포넌트:

```typescript
// SortableTaskItem을 memo로 감싸기
export const SortableTaskItem = memo(function SortableTaskItem({ ... }) {
  // ...
});
```

### 7.3 API 응답 타입 강화

```typescript
// 현재 (ai-assistant)
const data = await response.json();

// 권장
interface AIResponse {
  response: string;
  executedFunctions?: Array<{ name: string; result: unknown }>;
  error?: string;
}
const data: AIResponse = await response.json();
```

---

## 우선순위별 작업 목록

### 🔴 즉시 적용 권장

| # | 작업 | 예상 효과 |
|---|------|----------|
| 1 | Error Boundary 추가 | 앱 안정성 향상, 사용자 경험 개선 |
| 2 | 프로덕션 console 제거/로거 도입 | 성능 향상, 보안 강화 |
| 3 | 환경 변수 검증 강화 | 배포 안정성 |

### 🟡 다음 스프린트 권장

| # | 작업 | 예상 효과 |
|---|------|----------|
| 4 | database.ts 파일 분리 | 유지보수성 향상 |
| 5 | AiChat 동적 임포트 | 초기 번들 5-10% 감소 |
| 6 | 타입 파일 분리 | 빌드 시간 개선 |
| 7 | 접근성 개선 | WCAG 준수 |

### 🟢 시간 여유 시

| # | 작업 | 예상 효과 |
|---|------|----------|
| 8 | useCallback/memo 추가 적용 | 리렌더링 최적화 |
| 9 | .substr() → .substring() | 경고 제거 |
| 10 | 스켈레톤 일관성 | UX 개선 |

---

## 결론

이전 React Best Practices 리뷰 후 주요 성능 최적화가 적용되었습니다. 
현재 우선적으로 필요한 것은:

1. **안정성**: Error Boundary 도입
2. **프로덕션 준비**: console 문 정리 및 로거 도입
3. **유지보수성**: 대형 파일 분리

이 작업들을 완료하면 프로덕션 배포에 적합한 상태가 됩니다.
