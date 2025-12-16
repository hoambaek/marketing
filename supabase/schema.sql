-- ═══════════════════════════════════════════════════════════════════════════
-- 뮤즈드마레 마스터플랜 - Supabase Database Schema
-- ═══════════════════════════════════════════════════════════════════════════

-- Tasks 테이블
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

-- Must-Do Items 테이블
CREATE TABLE IF NOT EXISTS must_do_items (
  id TEXT PRIMARY KEY,
  year INTEGER NOT NULL DEFAULT 2026,
  month INTEGER NOT NULL,
  title TEXT NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- KPI Items 테이블
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

-- Content Items 테이블
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

-- Cost Calculator Settings 테이블
CREATE TABLE IF NOT EXISTS cost_calculator_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL UNIQUE,
  exchange_rate NUMERIC NOT NULL DEFAULT 1500,
  champagne_types JSONB DEFAULT '[]'::jsonb,
  -- 수입 비용 (KRW)
  shipping_cost NUMERIC DEFAULT 0,
  insurance_cost NUMERIC DEFAULT 0,
  tax_cost NUMERIC DEFAULT 0,
  customs_fee NUMERIC DEFAULT 0,
  -- 가공 원가 (KRW)
  structure_cost NUMERIC DEFAULT 0,
  sea_usage_fee NUMERIC DEFAULT 0,
  ai_monitoring_cost NUMERIC DEFAULT 0,
  certification_cost NUMERIC DEFAULT 0,
  -- 판매 원가 (KRW)
  packaging_cost NUMERIC DEFAULT 0,
  marketing_cost NUMERIC DEFAULT 0,
  sga_cost NUMERIC DEFAULT 0,
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_tasks_year_month_week ON tasks(year, month, week);
CREATE INDEX IF NOT EXISTS idx_must_do_year_month ON must_do_items(year, month);
CREATE INDEX IF NOT EXISTS idx_kpi_year_month ON kpi_items(year, month);
CREATE INDEX IF NOT EXISTS idx_content_year_date ON content_items(year, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_cost_calculator_year ON cost_calculator_settings(year);

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tasks 테이블 트리거
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- KPI Items 테이블 트리거
DROP TRIGGER IF EXISTS update_kpi_items_updated_at ON kpi_items;
CREATE TRIGGER update_kpi_items_updated_at
  BEFORE UPDATE ON kpi_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Content Items 테이블 트리거
DROP TRIGGER IF EXISTS update_content_items_updated_at ON content_items;
CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Cost Calculator Settings 테이블 트리거
DROP TRIGGER IF EXISTS update_cost_calculator_settings_updated_at ON cost_calculator_settings;
CREATE TRIGGER update_cost_calculator_settings_updated_at
  BEFORE UPDATE ON cost_calculator_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) 활성화
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE must_do_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_calculator_settings ENABLE ROW LEVEL SECURITY;

-- 모든 사용자에게 읽기/쓰기 권한 부여 (인증 없이 사용할 경우)
-- 실제 운영 환경에서는 인증된 사용자만 접근하도록 수정 필요
CREATE POLICY "Allow all access to tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to must_do_items" ON must_do_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to kpi_items" ON kpi_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to content_items" ON content_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to cost_calculator_settings" ON cost_calculator_settings FOR ALL USING (true) WITH CHECK (true);
