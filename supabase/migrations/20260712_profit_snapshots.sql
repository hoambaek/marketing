-- ════════════════════════════════════════════════════════════════════════
-- 월별 손익 스냅샷 (profit_snapshots)
-- ════════════════════════════════════════════════════════════════════════
-- budget 손익 대시보드의 실적 모드 수치를 월 단위로 적재한다.
-- 대시보드를 열 때마다 해당 월 행을 upsert하므로, 월이 끝나면 마지막
-- 기록이 곧 월말 스냅샷이 된다 (별도 크론 불필요).
-- 목적: Phase 3 손익 브리지(가격·수량·믹스 분해)의 기간 비교 데이터.
-- 최소 2개 분기가 쌓이면 브리지 섹션을 활성화할 수 있다 (2026-07-12 기획).
--
-- 보안: service_role 전용. RLS enable + force, anon/authenticated 정책 없음.
-- 모든 읽기/쓰기는 서버 API 라우트(supabaseAdmin)로만 수행한다.
-- ════════════════════════════════════════════════════════════════════════

create table if not exists public.profit_snapshots (
  -- 프로젝트 컨벤션: id는 text + gen_random_uuid()::text
  id             text primary key default gen_random_uuid()::text,

  year           integer not null,
  month          integer not null check (month between 1 and 12),
  snapshot_date  date not null default current_date, -- 마지막 upsert 날짜

  -- 실적 모드(판매분) 전사 손익 — B2B 공급가액 기준, 부가세 별도
  revenue        numeric not null default 0,
  variable_cost  numeric not null default 0,
  contribution   numeric not null default 0,
  fixed_cost     numeric not null default 0,
  net_profit     numeric not null default 0,

  -- 제품별 상세 (가격·수량·믹스 분해용)
  -- [{ id, nameKo, b2bPrice, varCost, sold, targetQty }]
  tiers          jsonb not null default '[]'::jsonb,

  updated_at     timestamptz not null default now(),
  created_at     timestamptz not null default now(),

  unique (year, month)
);

-- 기간 비교 조회 최적화
create index if not exists idx_profit_snapshots_period
  on public.profit_snapshots (year, month);

-- ── RLS: service_role 전용 격리 ──────────────────────────────────────────
alter table public.profit_snapshots enable row level security;
alter table public.profit_snapshots force row level security;
-- (정책을 만들지 않음 → anon/authenticated 전면 차단.
--  service_role은 BYPASSRLS 권한으로 우회하므로 서버 API에서만 접근 가능.)
