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
```

## 상세 문서 (필요 시 참조)

| 문서 | 내용 |
|------|------|
| [`docs/claude/architecture.md`](docs/claude/architecture.md) | Tech Stack, 페이지 목록, Store, API Routes, Data Flow |
| [`docs/claude/database.md`](docs/claude/database.md) | DB 테이블, 네이밍 컨벤션, 연동 규칙 |
| [`docs/claude/uaps.md`](docs/claude/uaps.md) | UAPS 시스템 — 파이프라인, 6축 풍미, 보정 계수, KHOA |
| [`docs/claude/design.md`](docs/claude/design.md) | Deep Sea 테마, 폰트, Hero/Modal 패턴 |
| [`docs/claude/types.md`](docs/claude/types.md) | 타입 시스템 — Core, UAPS, Ocean, Enums |
| [`docs/claude/scripts.md`](docs/claude/scripts.md) | 데이터 스크립트 — NLP, 백필, XGBoost |

## Quick Reference

**Auth**: Clerk middleware → `/sign-in`, `/api/public/*` 제외 모든 라우트 보호
**Data Flow**: Supabase → Zustand → UI → Zustand → Supabase (Optimistic update)
**DB Convention**: DB=snake_case, TS=camelCase, 매핑 함수로 변환

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
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
```
