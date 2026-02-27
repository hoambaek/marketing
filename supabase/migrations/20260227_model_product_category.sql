-- ═══════════════════════════════════════════════════════════════════════════
-- UAPS: product_category 기반 그룹핑 전환 + AI 보정 계수 저장
--
-- 변경 사항:
-- 1. terrestrial_model: product_category 컬럼 추가, 유니크 키 변경
-- 2. aging_predictions: product_category, aging_factors_json, quality_weights_json 추가
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- terrestrial_model: product_category 컬럼 추가
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE terrestrial_model
  ADD COLUMN IF NOT EXISTS product_category TEXT;

-- 기존 데이터: wine_type → 'champagne/wine' 카테고리로 매핑
UPDATE terrestrial_model
  SET product_category = 'champagne/wine'
  WHERE product_category IS NULL;

-- NOT NULL 제약 추가
ALTER TABLE terrestrial_model
  ALTER COLUMN product_category SET NOT NULL;

-- 기존 유니크 제약 제거 (존재하면)
ALTER TABLE terrestrial_model
  DROP CONSTRAINT IF EXISTS terrestrial_model_wine_type_aging_stage_key;

-- 새 유니크 제약: product_category × aging_stage
ALTER TABLE terrestrial_model
  ADD CONSTRAINT terrestrial_model_product_category_aging_stage_key
  UNIQUE (product_category, aging_stage);

-- 인덱스 갱신
DROP INDEX IF EXISTS idx_terrestrial_model_wine_type;
CREATE INDEX IF NOT EXISTS idx_terrestrial_model_product_category
  ON terrestrial_model (product_category);

-- ───────────────────────────────────────────────────────────────────────────
-- aging_predictions: 카테고리 + AI 추론 보정 계수 저장
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE aging_predictions
  ADD COLUMN IF NOT EXISTS product_category TEXT,
  ADD COLUMN IF NOT EXISTS aging_factors_json JSONB,
  ADD COLUMN IF NOT EXISTS quality_weights_json JSONB;

-- 기존 데이터: champagne/wine으로 매핑
UPDATE aging_predictions
  SET product_category = 'champagne/wine'
  WHERE product_category IS NULL;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_aging_predictions_product_category
  ON aging_predictions (product_category);
