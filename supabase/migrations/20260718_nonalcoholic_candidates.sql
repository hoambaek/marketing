-- 무알콜 후보 테이블 (영업관리 /prospects 무알콜 탭)
-- ⚠️ 실 DDL은 Supabase Dashboard/MCP로 이미 적용됨. 이 파일은 기록용.
-- Clerk 인증이라 RLS 정책 미작성 → service_role 전용 격리.

create table if not exists public.nonalcoholic_candidates (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  category text,                 -- 스타일(티 스파클링·디알콜 스파클링 와인·콤부차·보태니컬 아페리티프·해양심층수 워터·한국 전통 발효 등)
  origin text,                   -- 원산지
  sourcing_tier text,            -- 국내 1순위 / 미수입 해외 2순위 / 이미 수입(제외)
  domestic_available boolean default false,
  aging_applicable text,         -- 해저숙성 실험 후보 / 그대로 취급 / 해당 없음
  pick_grade text check (pick_grade in ('상','중','하','참조')),
  pick_reason text,
  evidence_urls text[] default '{}',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.nonalcoholic_candidates enable row level security;
alter table public.nonalcoholic_candidates force row level security;
create index if not exists idx_nonalc_grade on public.nonalcoholic_candidates (pick_grade);
