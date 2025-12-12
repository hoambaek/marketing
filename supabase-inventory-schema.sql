-- ═══════════════════════════════════════════════════════════════════════════
-- Muse de Marée - 재고관리 Supabase 스키마
-- ═══════════════════════════════════════════════════════════════════════════

-- 개별 병 재고 테이블 (2025 First Edition - 넘버링)
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 일반 재고 테이블 (2026 제품 - 수량 기반)
CREATE TABLE IF NOT EXISTS inventory_batches (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL UNIQUE,
  available INTEGER NOT NULL DEFAULT 0,
  reserved INTEGER NOT NULL DEFAULT 0,
  sold INTEGER NOT NULL DEFAULT 0,
  gifted INTEGER NOT NULL DEFAULT 0,
  damaged INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 재고 거래 기록 테이블
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

-- 커스텀 상품 테이블 (사용자가 추가하는 상품)
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

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_numbered_bottles_product ON numbered_bottles(product_id);
CREATE INDEX IF NOT EXISTS idx_numbered_bottles_status ON numbered_bottles(status);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created ON inventory_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_products_year ON custom_products(year);

-- ═══════════════════════════════════════════════════════════════════════════
-- 초기 데이터 삽입
-- ═══════════════════════════════════════════════════════════════════════════

-- 2025 First Edition 넘버링 병 1-50 생성
INSERT INTO numbered_bottles (id, product_id, bottle_number, status)
SELECT
  'first-edition-' || n,
  'first_edition',
  n,
  'available'
FROM generate_series(1, 50) AS n
ON CONFLICT (id) DO NOTHING;

-- 2026 제품 재고 배치 생성
INSERT INTO inventory_batches (id, product_id, available, reserved, sold, gifted, damaged)
VALUES
  ('batch-en_lieu_sur_brut', 'en_lieu_sur_brut', 210, 0, 0, 0, 0),
  ('batch-en_lieu_sur_magnum', 'en_lieu_sur_magnum', 24, 0, 0, 0, 0),
  ('batch-element_de_surprise', 'element_de_surprise', 120, 0, 0, 0, 0),
  ('batch-atomes_crochus', 'atomes_crochus', 144, 0, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS 정책 (Row Level Security)
-- ═══════════════════════════════════════════════════════════════════════════

-- RLS 활성화
ALTER TABLE numbered_bottles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_products ENABLE ROW LEVEL SECURITY;

-- 모든 사용자에게 읽기/쓰기 허용 (anon key 사용 시)
CREATE POLICY "Allow all access to numbered_bottles" ON numbered_bottles
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to inventory_batches" ON inventory_batches
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to inventory_transactions" ON inventory_transactions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to custom_products" ON custom_products
  FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- 업데이트 트리거
-- ═══════════════════════════════════════════════════════════════════════════

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- numbered_bottles 트리거
DROP TRIGGER IF EXISTS update_numbered_bottles_updated_at ON numbered_bottles;
CREATE TRIGGER update_numbered_bottles_updated_at
  BEFORE UPDATE ON numbered_bottles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- inventory_batches last_updated 트리거
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_inventory_batches_last_updated ON inventory_batches;
CREATE TRIGGER update_inventory_batches_last_updated
  BEFORE UPDATE ON inventory_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_last_updated_column();

-- custom_products 트리거
DROP TRIGGER IF EXISTS update_custom_products_updated_at ON custom_products;
CREATE TRIGGER update_custom_products_updated_at
  BEFORE UPDATE ON custom_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
