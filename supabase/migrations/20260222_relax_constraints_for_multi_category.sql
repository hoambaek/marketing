-- UAPS 멀티 카테고리 확장: wine_type 및 data_source 제약 완화
-- 샴페인 전용 CHECK 제약을 제거하여 사케/보이차/간장/콜드브루 등 지원

-- wine_type 제약 제거 (샴페인 타입만 허용 → 자유 텍스트)
ALTER TABLE wine_terrestrial_data
  DROP CONSTRAINT IF EXISTS wine_terrestrial_data_wine_type_check;

-- data_source 제약 완화 (csv_import 등 신규 소스 허용)
ALTER TABLE wine_terrestrial_data
  DROP CONSTRAINT IF EXISTS wine_terrestrial_data_data_source_check;

-- 새로운 data_source 제약 (멀티 카테고리 소스 포함)
ALTER TABLE wine_terrestrial_data
  ADD CONSTRAINT wine_terrestrial_data_data_source_check
  CHECK (data_source IN (
    'vivino', 'cellartracker', 'decanter',
    'internal_tasting', 'manual_entry',
    'csv_import', 'huggingface',
    'saketime', 'yunnansourcing', 'white2tea',
    's-shoyu', 'coffeereview', 'web_scraping'
  ));
