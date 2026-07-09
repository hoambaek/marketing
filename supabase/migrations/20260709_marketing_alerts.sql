-- 이상탐지 경보 (Tier 3, 2026-07-09)
-- 원격 적용: apply_migration 'marketing_alerts'
-- 쓰기: 크론(service_role)만. RLS 활성화 + 정책 없음 = service_role 전용

CREATE TABLE IF NOT EXISTS marketing_alerts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metric_key TEXT NOT NULL,          -- 'landing|sessions', 'conversions|zero' 등
  label TEXT NOT NULL,               -- 사람이 읽는 지표명
  severity TEXT NOT NULL,            -- 'warning' | 'critical'
  direction TEXT NOT NULL,           -- 'drop' | 'spike' | 'zero'
  status TEXT NOT NULL DEFAULT 'open', -- 'open' | 'resolved'
  resolved_at TIMESTAMPTZ,
  current_value NUMERIC,
  baseline_value NUMERIC,
  consecutive_days INT,
  detail JSONB NOT NULL DEFAULT '{}',
  investigation_md TEXT,             -- Claude 미니 조사 가설
  notified_slack BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_ma_status ON marketing_alerts (status, detected_at DESC);

ALTER TABLE marketing_alerts ENABLE ROW LEVEL SECURITY;
