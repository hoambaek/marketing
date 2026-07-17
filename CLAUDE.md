# CLAUDE.md

**Muse de Marée** — 프리미엄 해저 숙성 샴페인 브랜드의 마케팅/인벤토리/UAPS 예측 대시보드 (2026 런칭)

## 규칙

1. **한국어로 답변** — 코드 주석, 커밋 메시지도 한국어 권장
2. **커밋/배포 자동 금지** — 명시적 요청 시에만 ("커밋해줘", "배포해줘")
3. **DB 작업 시 `supabase-postgres-best-practices` 스킬 사용**
4. **DDL은 Supabase Dashboard SQL Editor에서 수동 실행** (CLI push 사용 안 함)
5. **개발 서버 포트 3003** (`npm run dev` → localhost:3003)

## Commands

```bash
npm run dev      # 개발 서버 (http://localhost:3003)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint
npx tsc --noEmit # 타입 체크 (수정 후 항상 실행)
```

## 실전 작업 규칙 (반복 실수 방지)

- **Supabase 접근**: MCP Supabase는 계정 권한 부족으로 실패함(`execute_sql` 등).
  → `.env.local`의 `SUPABASE_SERVICE_ROLE_KEY`로 REST 직접 호출:
  ```bash
  curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/<table>?..." -H "apikey: $SRK" -H "Authorization: Bearer $SRK"
  ```
  카운트는 `-I` + `Prefer: count=exact` 후 `content-range` 파싱. PostgREST는 **행 500개 제한** — 전량 필요 시 offset 배치.
- **로컬 브라우저 검증**: Clerk가 보호 라우트를 **404**로 막음(로컬 로그인 불가).
  → `src/middleware.ts`의 `isPublicRoute`에 `'/uaps(.*)'`를 임시 추가 → 검증 → **반드시 원복** (`git diff src/middleware.ts` 비어야 함). 커밋에 절대 포함 금지.
- **`docs/uaps/`는 gitignore 대상** — 이 안의 계획 문서는 로컬 전용. force-add 금지.
- **쉘에서 `[category]` 경로는 반드시 따옴표**: `"src/app/uaps/[category]/page.tsx"` (zsh glob 오류).
- **커밋 시 스테이징 파일을 명시적으로 지정** — stray 파일(png, tmp/, outputs/, .serena)과 middleware를 포함하지 않음.
- **풍미 6축은 이중 관리**: 코드 상수(`CATEGORY_FLAVOR_LABELS/_DEFINITIONS` in `src/lib/types/uaps.ts`)가 SSOT, DB `category_flavor_axes`는 동기 사본 → 라벨 변경 시 **둘 다 수정**.
- **`/uaps`(샴페인 메인)와 `/uaps/[category]`는 별도 구현** — 예측·타임라인 로직 수정 시 두 페이지 모두 반영됐는지 확인 (과거 AI 계수 미전달 버그 원인).

## 상세 문서 (필요 시 참조)

| 문서 | 내용 |
|------|------|
| [`docs/claude/architecture.md`](docs/claude/architecture.md) | Tech Stack, 페이지 목록, Store, API Routes, Data Flow |
| [`docs/claude/database.md`](docs/claude/database.md) | DB 테이블, 네이밍 컨벤션, 연동 규칙, REST 접근 |
| [`docs/claude/uaps.md`](docs/claude/uaps.md) | UAPS 시스템 — 파이프라인, 카테고리별 6축, 보정 계수, 시음 |
| [`docs/claude/types.md`](docs/claude/types.md) | 타입 시스템 — Core, UAPS, Ocean, Enums |
| [`docs/claude/scripts.md`](docs/claude/scripts.md) | 데이터 스크립트 — NLP, 백필, XGBoost |

## Quick Reference

**Auth**: Clerk middleware → `/sign-in`, `/tasting/*`, `/b/*`, `/api/{public,cron,external}/*` 제외 모든 라우트 보호
**Data Flow**: Supabase → Zustand → UI → Zustand → Supabase (Optimistic update)
**DB Convention**: DB=snake_case, TS=camelCase, 매핑 함수로 변환
**UAPS 카테고리 (11)**: champagne / red_wine / white_wine / whisky / sake / **yakju_cheongju**(전통주 약주·청주) / **spirits**(증류주 소주) / puer / soy_sauce / vinegar / **green_coffee_bean**(생두, 구 coldbrew)

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
GEMINI_API_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=
KHOA_API_KEY=
KHOA_OBS_CODE=DT_0027
KHOA_TIDAL_OBS_CODE=20LTC03
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
```

## 디자인 규칙 (필수)

새 페이지·컴포넌트를 만들 때는 **반드시 `docs/DESIGN_SYSTEM.md`(Luxury Editorial Dark Theme)와 기존 페이지(예: `src/app/kpi/page.tsx`)의 디자인 언어를 따른다.** 기본 밝은 Tailwind 디자인(흰 카드·회색 보더)은 반려된다 (2026-07-08 대표 확정).

핵심: 배경 `#0a0f1a`→`#0d1525` + 브론즈(#b7916e) 글로우 + 그레인 / 제목·숫자 Cormorant 세리프 / 글래스 카드(`from-white/[0.04] to-white/[0.01]`, `border-white/[0.06]`, 호버 글로우) / framer-motion 스태거 / 강조 카드는 브론즈 보더. 적용 예: `src/app/channels/ChannelsDashboard.tsx`
