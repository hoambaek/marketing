-- KHOA 실측 데이터 필드 추가 (조위, 조류, 데이터 소스)
-- 기존 데이터에 영향 없도록 모두 NULL 허용 + 기본값

ALTER TABLE ocean_data_daily
  ADD COLUMN IF NOT EXISTS tide_level_avg NUMERIC,
  ADD COLUMN IF NOT EXISTS tide_level_min NUMERIC,
  ADD COLUMN IF NOT EXISTS tide_level_max NUMERIC,
  ADD COLUMN IF NOT EXISTS tidal_current_speed NUMERIC,
  ADD COLUMN IF NOT EXISTS tidal_current_direction NUMERIC,
  ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'open-meteo';
