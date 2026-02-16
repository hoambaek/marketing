-- ═══════════════════════════════════════════════════════════════════════════
-- 뮤즈드마레 마케팅 플랫폼 - Supabase Database Schema (통합)
-- 최종 업데이트: 2026-02-16
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 공통 함수
-- ═══════════════════════════════════════════════════════════════════════════

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- last_updated 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. 마스터플랜 테이블
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  year INTEGER NOT NULL DEFAULT 2026,
  month INTEGER NOT NULL,
  week INTEGER NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('operation', 'marketing', 'design', 'filming', 'pr', 'b2b')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
  assignee TEXT,
  due_date TIMESTAMPTZ,
  deliverables TEXT[],
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS must_do_items (
  id TEXT PRIMARY KEY,
  year INTEGER NOT NULL DEFAULT 2026,
  month INTEGER NOT NULL,
  title TEXT NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kpi_items (
  id TEXT PRIMARY KEY,
  year INTEGER NOT NULL DEFAULT 2026,
  month INTEGER NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('instagram', 'youtube', 'newsletter', 'website', 'press', 'b2b')),
  metric TEXT NOT NULL,
  current_value NUMERIC DEFAULT 0,
  target_value NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_items (
  id TEXT PRIMARY KEY,
  year INTEGER NOT NULL DEFAULT 2026,
  type TEXT NOT NULL CHECK (type IN ('instagram', 'youtube', 'blog', 'newsletter', 'press')),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. 예산 테이블
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS income_items (
  id TEXT PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('marketing', 'operation', 'design', 'filming', 'pr', 'b2b', 'packaging', 'event', 'sales', 'other')),
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  income_date DATE NOT NULL,
  source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expense_items (
  id TEXT PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('marketing', 'operation', 'design', 'filming', 'pr', 'b2b', 'packaging', 'event', 'sales', 'other')),
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  vendor TEXT,
  expense_date DATE NOT NULL,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. 비용 계산 + 가격 설정
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cost_calculator_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL UNIQUE,
  exchange_rate NUMERIC NOT NULL DEFAULT 1500,
  champagne_types JSONB DEFAULT '[]'::jsonb,
  shipping_cost NUMERIC DEFAULT 0,
  insurance_cost NUMERIC DEFAULT 0,
  tax_cost NUMERIC DEFAULT 0,
  customs_fee NUMERIC DEFAULT 0,
  structure_cost NUMERIC DEFAULT 0,
  sea_usage_fee NUMERIC DEFAULT 0,
  ai_monitoring_cost NUMERIC DEFAULT 0,
  certification_cost NUMERIC DEFAULT 0,
  packaging_cost NUMERIC DEFAULT 0,
  marketing_cost NUMERIC DEFAULT 0,
  sga_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pricing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  tier_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  b2b_price NUMERIC NOT NULL DEFAULT 0,
  consumer_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(year, tier_id)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. 재고 관리
-- ═══════════════════════════════════════════════════════════════════════════

-- 개별 병 (2025 First Edition 넘버링)
CREATE TABLE IF NOT EXISTS numbered_bottles (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL DEFAULT 'first_edition',
  bottle_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'gifted', 'damaged')),
  reserved_for TEXT,
  sold_to TEXT,
  sold_date TIMESTAMPTZ,
  price INTEGER,
  notes TEXT,
  nfc_code VARCHAR(12) UNIQUE,
  nfc_registered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 배치 재고 (2026 제품 수량 기반)
CREATE TABLE IF NOT EXISTS inventory_batches (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL UNIQUE,
  total_quantity INTEGER NOT NULL DEFAULT 0,
  available INTEGER NOT NULL DEFAULT 0,
  reserved INTEGER NOT NULL DEFAULT 0,
  sold INTEGER NOT NULL DEFAULT 0,
  gifted INTEGER NOT NULL DEFAULT 0,
  damaged INTEGER NOT NULL DEFAULT 0,
  immersion_date DATE,
  retrieval_date DATE,
  aging_depth INTEGER DEFAULT 30,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 재고 거래 기록
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  bottle_number INTEGER,
  type TEXT NOT NULL CHECK (type IN ('sale', 'reservation', 'gift', 'damage', 'return', 'cancel_reservation')),
  quantity INTEGER NOT NULL DEFAULT 1,
  customer_name TEXT,
  price INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 배치 제품 개별 병 추적 (NFC용)
CREATE TABLE IF NOT EXISTS bottle_units (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  nfc_code VARCHAR(12) UNIQUE NOT NULL,
  serial_number INTEGER,
  status TEXT NOT NULL DEFAULT 'sold' CHECK (status IN ('sold', 'gifted')),
  customer_name TEXT,
  sold_date DATE,
  price INTEGER,
  notes TEXT,
  nfc_registered_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 커스텀 상품
CREATE TABLE IF NOT EXISTS custom_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_ko TEXT NOT NULL,
  year INTEGER NOT NULL,
  size TEXT NOT NULL DEFAULT '750ml',
  total_quantity INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. 이슈/리스크 관리
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS issues (
  id TEXT PRIMARY KEY,
  year INTEGER NOT NULL DEFAULT 2026,
  month INTEGER NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('risk', 'issue', 'opportunity')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  impact TEXT NOT NULL CHECK (impact IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  category TEXT NOT NULL,
  description TEXT,
  owner TEXT,
  due_date DATE,
  resolution TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. 해양 데이터
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ocean_data_daily (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  sea_temperature_avg NUMERIC,
  sea_temperature_min NUMERIC,
  sea_temperature_max NUMERIC,
  current_velocity_avg NUMERIC,
  current_direction_dominant NUMERIC,
  wave_height_avg NUMERIC,
  wave_height_max NUMERIC,
  wave_period_avg NUMERIC,
  surface_pressure_avg NUMERIC,
  air_temperature_avg NUMERIC,
  humidity_avg NUMERIC,
  salinity NUMERIC,
  depth INTEGER NOT NULL DEFAULT 30,
  location_name TEXT NOT NULL DEFAULT '완도',
  latitude NUMERIC NOT NULL DEFAULT 34.3,
  longitude NUMERIC NOT NULL DEFAULT 126.7,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS salinity_records (
  id TEXT PRIMARY KEY,
  measured_at TIMESTAMPTZ NOT NULL,
  salinity NUMERIC NOT NULL,
  depth NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. 해저숙성 구조물
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS structures (
  id TEXT PRIMARY KEY,
  year INTEGER NOT NULL DEFAULT 2026,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 0,
  max_weight NUMERIC NOT NULL DEFAULT 0,
  structure_weight NUMERIC NOT NULL DEFAULT 0,
  is_slot_only BOOLEAN DEFAULT FALSE,
  slot_only_type TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS structure_items (
  id TEXT PRIMARY KEY,
  structure_id TEXT NOT NULL REFERENCES structures(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  volume TEXT,
  weight NUMERIC NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 인덱스
-- ═══════════════════════════════════════════════════════════════════════════

-- 마스터플랜
CREATE INDEX IF NOT EXISTS idx_tasks_year_month_week ON tasks(year, month, week);
CREATE INDEX IF NOT EXISTS idx_must_do_year_month ON must_do_items(year, month);
CREATE INDEX IF NOT EXISTS idx_kpi_year_month ON kpi_items(year, month);
CREATE INDEX IF NOT EXISTS idx_content_year_date ON content_items(year, scheduled_date);

-- 예산
CREATE INDEX IF NOT EXISTS idx_income_items_year_month ON income_items(year, month);
CREATE INDEX IF NOT EXISTS idx_expense_items_year_month ON expense_items(year, month);

-- 비용/가격
CREATE INDEX IF NOT EXISTS idx_cost_calculator_year ON cost_calculator_settings(year);
CREATE INDEX IF NOT EXISTS idx_pricing_year ON pricing_settings(year);

-- 재고 (복합 인덱스)
CREATE INDEX IF NOT EXISTS idx_numbered_bottles_product_status ON numbered_bottles(product_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_product_id ON inventory_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_product_created ON inventory_transactions(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bottle_units_nfc ON bottle_units(nfc_code);
CREATE INDEX IF NOT EXISTS idx_bottle_units_product_status ON bottle_units(product_id, status);
CREATE INDEX IF NOT EXISTS idx_custom_products_year ON custom_products(year);

-- 이슈
CREATE INDEX IF NOT EXISTS idx_issues_year_month ON issues(year, month);

-- 해양 데이터
CREATE INDEX IF NOT EXISTS idx_ocean_data_daily_date ON ocean_data_daily(date);

-- 구조물
CREATE INDEX IF NOT EXISTS idx_structures_year ON structures(year);
CREATE INDEX IF NOT EXISTS idx_structure_items_structure_id ON structure_items(structure_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 트리거 (updated_at / last_updated 자동 업데이트)
-- ═══════════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kpi_items_updated_at ON kpi_items;
CREATE TRIGGER update_kpi_items_updated_at
  BEFORE UPDATE ON kpi_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_items_updated_at ON content_items;
CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON content_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_income_items_updated_at ON income_items;
CREATE TRIGGER update_income_items_updated_at
  BEFORE UPDATE ON income_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expense_items_updated_at ON expense_items;
CREATE TRIGGER update_expense_items_updated_at
  BEFORE UPDATE ON expense_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cost_calculator_settings_updated_at ON cost_calculator_settings;
CREATE TRIGGER update_cost_calculator_settings_updated_at
  BEFORE UPDATE ON cost_calculator_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pricing_settings_updated_at ON pricing_settings;
CREATE TRIGGER update_pricing_settings_updated_at
  BEFORE UPDATE ON pricing_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_numbered_bottles_updated_at ON numbered_bottles;
CREATE TRIGGER update_numbered_bottles_updated_at
  BEFORE UPDATE ON numbered_bottles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_batches_last_updated ON inventory_batches;
CREATE TRIGGER update_inventory_batches_last_updated
  BEFORE UPDATE ON inventory_batches FOR EACH ROW EXECUTE FUNCTION update_last_updated_column();

DROP TRIGGER IF EXISTS update_custom_products_updated_at ON custom_products;
CREATE TRIGGER update_custom_products_updated_at
  BEFORE UPDATE ON custom_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_issues_updated_at ON issues;
CREATE TRIGGER update_issues_updated_at
  BEFORE UPDATE ON issues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ocean_data_daily_updated_at ON ocean_data_daily;
CREATE TRIGGER update_ocean_data_daily_updated_at
  BEFORE UPDATE ON ocean_data_daily FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_structures_updated_at ON structures;
CREATE TRIGGER update_structures_updated_at
  BEFORE UPDATE ON structures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_structure_items_updated_at ON structure_items;
CREATE TRIGGER update_structure_items_updated_at
  BEFORE UPDATE ON structure_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS (Row Level Security)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE must_do_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_calculator_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE numbered_bottles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bottle_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocean_data_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE salinity_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE structure_items ENABLE ROW LEVEL SECURITY;

-- RLS 정책: Clerk 인증 환경에서 anon key 사용하므로 anon + authenticated 모두 허용
-- 참고: 실제 인증은 Clerk 미들웨어가 Next.js 레벨에서 처리

DROP POLICY IF EXISTS "Authenticated users can access tasks" ON tasks;
CREATE POLICY "Allow access to tasks" ON tasks
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can access must_do_items" ON must_do_items;
CREATE POLICY "Allow access to must_do_items" ON must_do_items
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can access kpi_items" ON kpi_items;
CREATE POLICY "Allow access to kpi_items" ON kpi_items
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can access content_items" ON content_items;
CREATE POLICY "Allow access to content_items" ON content_items
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can access income_items" ON income_items;
CREATE POLICY "Allow access to income_items" ON income_items
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can access expense_items" ON expense_items;
CREATE POLICY "Allow access to expense_items" ON expense_items
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can access cost_calculator_settings" ON cost_calculator_settings;
CREATE POLICY "Allow access to cost_calculator_settings" ON cost_calculator_settings
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can access pricing_settings" ON pricing_settings;
CREATE POLICY "Allow access to pricing_settings" ON pricing_settings
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to numbered_bottles" ON numbered_bottles;
CREATE POLICY "Allow access to numbered_bottles" ON numbered_bottles
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to inventory_batches" ON inventory_batches;
CREATE POLICY "Allow access to inventory_batches" ON inventory_batches
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to inventory_transactions" ON inventory_transactions;
CREATE POLICY "Allow access to inventory_transactions" ON inventory_transactions
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to bottle_units" ON bottle_units;
CREATE POLICY "Allow access to bottle_units" ON bottle_units
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to custom_products" ON custom_products;
CREATE POLICY "Allow access to custom_products" ON custom_products
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can access issues" ON issues;
DROP POLICY IF EXISTS "Anon can access issues" ON issues;
CREATE POLICY "Allow access to issues" ON issues
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can access ocean_data_daily" ON ocean_data_daily;
DROP POLICY IF EXISTS "Anon can access ocean_data_daily" ON ocean_data_daily;
CREATE POLICY "Allow access to ocean_data_daily" ON ocean_data_daily
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can access salinity_records" ON salinity_records;
DROP POLICY IF EXISTS "Anon can access salinity_records" ON salinity_records;
CREATE POLICY "Allow access to salinity_records" ON salinity_records
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can access structures" ON structures;
DROP POLICY IF EXISTS "Anon can access structures" ON structures;
CREATE POLICY "Allow access to structures" ON structures
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can access structure_items" ON structure_items;
DROP POLICY IF EXISTS "Anon can access structure_items" ON structure_items;
CREATE POLICY "Allow access to structure_items" ON structure_items
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- 초기 데이터
-- ═══════════════════════════════════════════════════════════════════════════

-- 2025 First Edition 넘버링 병 1-50
INSERT INTO numbered_bottles (id, product_id, bottle_number, status)
SELECT
  'first-edition-' || n,
  'first_edition',
  n,
  'available'
FROM generate_series(1, 50) AS n
ON CONFLICT (id) DO NOTHING;

-- 2026 제품 재고 배치
INSERT INTO inventory_batches (id, product_id, available, reserved, sold, gifted, damaged)
VALUES
  ('batch-en_lieu_sur_brut', 'en_lieu_sur_brut', 210, 0, 0, 0, 0),
  ('batch-en_lieu_sur_magnum', 'en_lieu_sur_magnum', 24, 0, 0, 0, 0),
  ('batch-element_de_surprise', 'element_de_surprise', 120, 0, 0, 0, 0),
  ('batch-atomes_crochus', 'atomes_crochus', 144, 0, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. UAPS (Undersea Aging Predictive System)
-- ═══════════════════════════════════════════════════════════════════════════

-- 지상 숙성 기초 데이터 (AI 학습용, 100K건 목표)
CREATE TABLE IF NOT EXISTS wine_terrestrial_data (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  wine_name TEXT NOT NULL,
  producer TEXT,
  vintage INTEGER,
  wine_type TEXT NOT NULL CHECK (wine_type IN ('blanc_de_blancs', 'blanc_de_noirs', 'rose', 'blend', 'vintage')),
  ph NUMERIC,
  dosage NUMERIC,
  alcohol NUMERIC,
  acidity NUMERIC,
  reduction_potential TEXT CHECK (reduction_potential IN ('low', 'medium', 'high')),
  citrus_score NUMERIC,
  green_apple_score NUMERIC,
  brioche_score NUMERIC,
  yeast_score NUMERIC,
  honey_score NUMERIC,
  nutty_score NUMERIC,
  toast_score NUMERIC,
  oxidation_score NUMERIC,
  aging_years NUMERIC,
  aging_stage TEXT CHECK (aging_stage IN ('youthful', 'developing', 'mature', 'aged')),
  drinking_window_start INTEGER,
  drinking_window_end INTEGER,
  data_source TEXT NOT NULL CHECK (data_source IN ('vivino', 'cellartracker', 'decanter', 'internal_tasting', 'manual_entry', 'csv_import', 'huggingface')),
  review_text TEXT,
  rating NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI 학습 결과 저장
CREATE TABLE IF NOT EXISTS terrestrial_model (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  wine_type TEXT NOT NULL,
  aging_stage TEXT NOT NULL,
  sample_count INTEGER NOT NULL DEFAULT 0,
  flavor_profile_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  physicochemical_stats_json JSONB DEFAULT '{}'::jsonb,
  transition_curves_json JSONB DEFAULT '{}'::jsonb,
  cluster_centroids_json JSONB DEFAULT '{}'::jsonb,
  drinking_window_stats_json JSONB DEFAULT '{}'::jsonb,
  confidence_score NUMERIC DEFAULT 0,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wine_type, aging_stage)
);

-- 숙성 제품 등록
CREATE TABLE IF NOT EXISTS aging_products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_name TEXT NOT NULL,
  wine_type TEXT NOT NULL CHECK (wine_type IN ('blanc_de_blancs', 'blanc_de_noirs', 'rose', 'blend', 'vintage')),
  vintage INTEGER,
  producer TEXT DEFAULT 'Muse de Marée',
  ph NUMERIC,
  dosage NUMERIC,
  alcohol NUMERIC,
  acidity NUMERIC,
  reduction_potential TEXT CHECK (reduction_potential IN ('low', 'medium', 'high')) DEFAULT 'low',
  reduction_checks JSONB,
  immersion_date DATE,
  planned_duration_months INTEGER,
  aging_depth INTEGER DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'immersed', 'harvested')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI 예측 결과
CREATE TABLE IF NOT EXISTS aging_predictions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id TEXT REFERENCES aging_products(id) ON DELETE CASCADE,
  wine_type TEXT NOT NULL,
  input_ph NUMERIC,
  input_dosage NUMERIC,
  input_reduction_potential TEXT,
  undersea_duration_months INTEGER NOT NULL,
  aging_depth INTEGER DEFAULT 30,
  immersion_date DATE,
  predicted_citrus NUMERIC,
  predicted_brioche NUMERIC,
  predicted_honey NUMERIC,
  predicted_nutty NUMERIC,
  predicted_toast NUMERIC,
  predicted_oxidation NUMERIC,
  texture_maturity_score NUMERIC,
  aroma_freshness_score NUMERIC,
  off_flavor_risk_score NUMERIC,
  overall_quality_score NUMERIC,
  optimal_harvest_start_months INTEGER,
  optimal_harvest_end_months INTEGER,
  harvest_recommendation TEXT,
  ai_insight_text TEXT,
  ai_risk_warning TEXT,
  tci_applied NUMERIC DEFAULT 0.3,
  fri_applied NUMERIC DEFAULT 0.5,
  bri_applied NUMERIC DEFAULT 1.2,
  prediction_confidence NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 풍미 용어 매핑
CREATE TABLE IF NOT EXISTS flavor_dictionary (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  expert_term TEXT NOT NULL UNIQUE,
  consumer_keywords TEXT[] DEFAULT '{}',
  associated_stage TEXT CHECK (associated_stage IN ('youthful', 'developing', 'mature', 'aged')),
  flavor_category TEXT NOT NULL CHECK (flavor_category IN ('fruit', 'floral', 'yeast', 'nutty', 'spice', 'mineral', 'oxidative', 'off_flavor')),
  tci_weight NUMERIC DEFAULT 1.0,
  fri_weight NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 시스템 설정
CREATE TABLE IF NOT EXISTS uaps_config (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  config_key TEXT NOT NULL UNIQUE,
  config_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- UAPS 인덱스
CREATE INDEX IF NOT EXISTS idx_wine_terrestrial_wine_type ON wine_terrestrial_data(wine_type);
CREATE INDEX IF NOT EXISTS idx_wine_terrestrial_aging_years ON wine_terrestrial_data(aging_years);
CREATE INDEX IF NOT EXISTS idx_wine_terrestrial_aging_stage ON wine_terrestrial_data(aging_stage);
CREATE INDEX IF NOT EXISTS idx_wine_terrestrial_data_source ON wine_terrestrial_data(data_source);
CREATE INDEX IF NOT EXISTS idx_wine_terrestrial_type_stage ON wine_terrestrial_data(wine_type, aging_stage);
CREATE INDEX IF NOT EXISTS idx_terrestrial_model_type_stage ON terrestrial_model(wine_type, aging_stage);
CREATE INDEX IF NOT EXISTS idx_aging_products_wine_type ON aging_products(wine_type);
CREATE INDEX IF NOT EXISTS idx_aging_products_status ON aging_products(status);
CREATE INDEX IF NOT EXISTS idx_aging_products_immersion ON aging_products(immersion_date);
CREATE INDEX IF NOT EXISTS idx_aging_predictions_product ON aging_predictions(product_id);
CREATE INDEX IF NOT EXISTS idx_aging_predictions_created ON aging_predictions(created_at DESC);

-- UAPS 트리거
DROP TRIGGER IF EXISTS update_wine_terrestrial_data_updated_at ON wine_terrestrial_data;
CREATE TRIGGER update_wine_terrestrial_data_updated_at
  BEFORE UPDATE ON wine_terrestrial_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_terrestrial_model_updated_at ON terrestrial_model;
CREATE TRIGGER update_terrestrial_model_updated_at
  BEFORE UPDATE ON terrestrial_model FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_aging_products_updated_at ON aging_products;
CREATE TRIGGER update_aging_products_updated_at
  BEFORE UPDATE ON aging_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_uaps_config_updated_at ON uaps_config;
CREATE TRIGGER update_uaps_config_updated_at
  BEFORE UPDATE ON uaps_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- UAPS RLS
ALTER TABLE wine_terrestrial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE terrestrial_model ENABLE ROW LEVEL SECURITY;
ALTER TABLE aging_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE aging_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flavor_dictionary ENABLE ROW LEVEL SECURITY;
ALTER TABLE uaps_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow access to wine_terrestrial_data" ON wine_terrestrial_data
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow access to terrestrial_model" ON terrestrial_model
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow access to aging_products" ON aging_products
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow access to aging_predictions" ON aging_predictions
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow access to flavor_dictionary" ON flavor_dictionary
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow access to uaps_config" ON uaps_config
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- UAPS 기본 설정 데이터
INSERT INTO uaps_config (id, config_key, config_value, description) VALUES
  ('uaps-cfg-tci', 'tci_coefficient', '0.3', 'TCI: 문헌 기반 가설 (95% CI: 0.06-0.54, 실험 검증 필요)'),
  ('uaps-cfg-fri', 'fri_coefficient', '0.56', 'FRI: 아레니우스 방정식 기반 (Ea=47kJ/mol, 4°C/12°C, PMC11202423)'),
  ('uaps-cfg-bri', 'bri_coefficient', '1.6', 'BRI: 헨리의 법칙 기반 (수심 30m CO2 압력 구배 + 용해도 보정)'),
  ('uaps-cfg-stage-youthful', 'stage_threshold_youthful', '3', '숙성 단계: youthful 임계값 (년)'),
  ('uaps-cfg-stage-developing', 'stage_threshold_developing', '7', '숙성 단계: developing 임계값 (년)'),
  ('uaps-cfg-stage-mature', 'stage_threshold_mature', '15', '숙성 단계: mature 임계값 (년)'),
  ('uaps-cfg-risk-off-flavor', 'risk_threshold_off_flavor', '70', 'Off-flavor 리스크 임계값'),
  ('uaps-cfg-quality-optimal', 'quality_threshold_optimal', '80', '최적 품질 임계값')
ON CONFLICT (config_key) DO NOTHING;

-- 풍미 사전 기본 데이터
INSERT INTO flavor_dictionary (id, expert_term, consumer_keywords, associated_stage, flavor_category, tci_weight, fri_weight) VALUES
  ('fd-citrus', 'Citrus', ARRAY['레몬', '라임', '자몽', '시트러스', '유자', 'lemon', 'lime', 'grapefruit'], 'youthful', 'fruit', 0.8, 1.3),
  ('fd-green-apple', 'Green Apple', ARRAY['청사과', '풋사과', '배', 'green apple', 'pear'], 'youthful', 'fruit', 0.9, 1.2),
  ('fd-brioche', 'Brioche', ARRAY['브리오슈', '빵', '크루아상', '이스트', 'bread', 'croissant'], 'developing', 'yeast', 1.4, 0.9),
  ('fd-yeast', 'Yeast Autolysis', ARRAY['효모', '자가분해', '비스킷', 'biscuit', 'dough'], 'developing', 'yeast', 1.3, 0.8),
  ('fd-honey', 'Honey', ARRAY['꿀', '밀랍', '아카시아', 'honey', 'beeswax', 'acacia'], 'mature', 'fruit', 1.2, 0.7),
  ('fd-nutty', 'Nutty', ARRAY['견과류', '아몬드', '헤이즐넛', '호두', 'almond', 'hazelnut', 'walnut'], 'mature', 'nutty', 1.5, 0.6),
  ('fd-toast', 'Toast', ARRAY['토스트', '구운빵', '커피', '카라멜', 'toast', 'coffee', 'caramel'], 'mature', 'nutty', 1.4, 0.5),
  ('fd-oxidation', 'Oxidation', ARRAY['산화', '셰리', '마데이라', '호두껍질', 'sherry', 'madeira'], 'aged', 'oxidative', 1.0, 0.3)
ON CONFLICT (expert_term) DO NOTHING;
