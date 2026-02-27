-- UAPS 멀티 카테고리 확장 마이그레이션
-- wine_terrestrial_data에 카테고리 관련 컬럼 추가

ALTER TABLE wine_terrestrial_data
  ADD COLUMN IF NOT EXISTS product_category TEXT DEFAULT 'champagne',
  ADD COLUMN IF NOT EXISTS source_site TEXT,
  ADD COLUMN IF NOT EXISTS source_language TEXT DEFAULT 'en';

-- 기존 데이터 champagne으로 설정
UPDATE wine_terrestrial_data
SET product_category = 'champagne'
WHERE product_category IS NULL;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_wtd_product_category
  ON wine_terrestrial_data(product_category);
