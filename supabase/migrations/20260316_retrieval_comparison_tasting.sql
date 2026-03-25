-- 비교 시음: 지상 보관 대조군 컬럼 추가
-- Supabase Dashboard SQL Editor에서 수동 실행

ALTER TABLE retrieval_results
ADD COLUMN IF NOT EXISTS terrestrial_fruity NUMERIC,
ADD COLUMN IF NOT EXISTS terrestrial_floral_mineral NUMERIC,
ADD COLUMN IF NOT EXISTS terrestrial_yeasty_autolytic NUMERIC,
ADD COLUMN IF NOT EXISTS terrestrial_acidity_freshness NUMERIC,
ADD COLUMN IF NOT EXISTS terrestrial_body_texture NUMERIC,
ADD COLUMN IF NOT EXISTS terrestrial_finish_complexity NUMERIC,
ADD COLUMN IF NOT EXISTS terrestrial_overall_quality NUMERIC;

COMMENT ON COLUMN retrieval_results.terrestrial_fruity IS '지상 보관 대조군 — 과실향 (비교 시음)';
