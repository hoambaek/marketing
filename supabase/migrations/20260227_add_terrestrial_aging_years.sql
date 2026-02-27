-- ═══════════════════════════════════════════════════════════════════════════
-- aging_products: terrestrial_aging_years 컬럼 추가 + wine_type 제약 완화
-- 2026-02-27
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. terrestrial_aging_years 컬럼 추가 (이미 있으면 무시)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'aging_products' AND column_name = 'terrestrial_aging_years'
  ) THEN
    ALTER TABLE aging_products ADD COLUMN terrestrial_aging_years NUMERIC;
  END IF;
END $$;

-- 2. wine_type NOT NULL 제거 → NULL 허용 (비샴페인 카테고리)
ALTER TABLE aging_products ALTER COLUMN wine_type DROP NOT NULL;

-- 3. wine_type CHECK 제약 제거 (이미 제거되었을 수 있음)
DO $$
BEGIN
  ALTER TABLE aging_products DROP CONSTRAINT IF EXISTS aging_products_wine_type_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;
