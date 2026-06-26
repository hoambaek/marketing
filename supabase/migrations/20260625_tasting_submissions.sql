-- ════════════════════════════════════════════════════════════════════════
-- 외부 기록자 비교 시음 제출함 (tasting_submissions)
-- ════════════════════════════════════════════════════════════════════════
-- 로그인 없는 공개 링크(/tasting/{predictionId})로 외부 기록자(소믈리에 등)가
-- 제출한 비교 시음 데이터를 "대기함"에 보관한다.
-- 정식 데이터(retrieval_results)에는 내부 검토·승인을 거쳐야만 복사된다.
--
-- 보안: 이 테이블은 service_role 전용. RLS를 켜고 force하되 anon/authenticated
-- 정책을 만들지 않아, 브라우저에 노출되는 anon 키로는 일절 접근할 수 없다.
-- 모든 읽기/쓰기는 서버 API 라우트에서 service_role 클라이언트로만 수행한다.
-- ════════════════════════════════════════════════════════════════════════

create table if not exists public.tasting_submissions (
  -- 프로젝트 컨벤션: id는 text + gen_random_uuid()::text
  id                            text primary key default gen_random_uuid()::text,

  -- 링크 토큰 = 예측 ID. 어떤 제품/예측에 대한 시음인지 식별.
  prediction_id                 text references public.aging_predictions(id) on delete set null,
  product_id                    text not null,

  -- 기록자 식별
  recorder_name                 text not null,
  recorder_affiliation          text,

  -- 시음 메타
  retrieval_date                date,
  actual_duration_months        integer,
  tasting_panel_size            integer not null default 1,
  tasting_notes                 text,

  -- 해저 숙성 시음 결과 (6축 + 종합) 0~100
  actual_fruity                 numeric,
  actual_floral_mineral         numeric,
  actual_yeasty_autolytic       numeric,
  actual_acidity_freshness      numeric,
  actual_body_texture           numeric,
  actual_finish_complexity      numeric,
  actual_overall_quality        numeric,

  -- 지상 보관(대조군) 시음 결과 (6축 + 종합) 0~100
  terrestrial_fruity            numeric,
  terrestrial_floral_mineral    numeric,
  terrestrial_yeasty_autolytic  numeric,
  terrestrial_acidity_freshness numeric,
  terrestrial_body_texture      numeric,
  terrestrial_finish_complexity numeric,
  terrestrial_overall_quality   numeric,

  -- 검토 상태
  status                        text not null default 'pending'
                                  check (status in ('pending', 'approved', 'rejected')),
  reviewed_at                   timestamptz,
  -- 승인 시 생성된 retrieval_results 행 id (추적용)
  approved_retrieval_id         text references public.retrieval_results(id) on delete set null,

  created_at                    timestamptz not null default now()
);

-- 대기 목록 조회 최적화 (pending만 자주 조회)
create index if not exists idx_tasting_submissions_pending
  on public.tasting_submissions (created_at desc)
  where status = 'pending';

-- 예측별 제출 조회
create index if not exists idx_tasting_submissions_prediction
  on public.tasting_submissions (prediction_id);

-- ── RLS: service_role 전용 격리 ──────────────────────────────────────────
alter table public.tasting_submissions enable row level security;
alter table public.tasting_submissions force row level security;
-- (정책을 만들지 않음 → anon/authenticated 전면 차단.
--  service_role은 BYPASSRLS 권한으로 우회하므로 서버 API에서만 접근 가능.)
