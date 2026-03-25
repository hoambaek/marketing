-- UAPS v5.0 마이그레이션: reasoning 필드 + retrieval_results 테이블
-- Supabase Dashboard SQL Editor에서 수동 실행

-- 1. aging_predictions에 reasoning 컬럼 추가
ALTER TABLE aging_predictions
ADD COLUMN IF NOT EXISTS ai_reasoning_text TEXT;

COMMENT ON COLUMN aging_predictions.ai_reasoning_text IS 'AI 예측 시 Chain-of-Thought 분석 과정 (v5.0)';

-- 2. 인양 실측 데이터 테이블
-- aging_products.id, aging_predictions.id가 TEXT 타입이므로 FK도 TEXT
CREATE TABLE IF NOT EXISTS retrieval_results (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id TEXT REFERENCES aging_products(id) ON DELETE CASCADE,
  retrieval_date DATE NOT NULL,
  actual_duration_months INTEGER NOT NULL,
  -- 실측 풍미 6축 (블라인드 시음)
  actual_fruity NUMERIC,
  actual_floral_mineral NUMERIC,
  actual_yeasty_autolytic NUMERIC,
  actual_acidity_freshness NUMERIC,
  actual_body_texture NUMERIC,
  actual_finish_complexity NUMERIC,
  -- 실측 품질 점수
  actual_overall_quality NUMERIC,
  -- 시음 메타데이터
  tasting_panel_size INTEGER DEFAULT 1,
  tasting_notes TEXT,
  is_simulated BOOLEAN DEFAULT false,
  -- 예측 vs 실측 비교
  prediction_id TEXT REFERENCES aging_predictions(id),
  -- 메타
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE retrieval_results IS '인양 실측 데이터 — 예측 vs 실측 비교 및 베이지안 업데이트용 (v5.0)';

-- 3. 인덱스
CREATE INDEX IF NOT EXISTS idx_retrieval_results_product_id ON retrieval_results(product_id);
CREATE INDEX IF NOT EXISTS idx_retrieval_results_prediction_id ON retrieval_results(prediction_id);
