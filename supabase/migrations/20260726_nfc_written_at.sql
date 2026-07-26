-- NFC 태그 "실물 쓰기 완료" 시각 분리
--
-- 기존 nfc_registered_at은 코드를 발급한 시각이다(bottle_units는 DEFAULT NOW()).
-- 즉 코드만 뽑고 태그에 쓰지 못한 병과, 실제로 태그에 기록한 병이 구분되지 않았다.
-- nfc_written_at은 NfcWriteModal에서 쓰기가 성공한 순간에만 채운다.
ALTER TABLE bottle_units ADD COLUMN IF NOT EXISTS nfc_written_at TIMESTAMPTZ;
ALTER TABLE numbered_bottles ADD COLUMN IF NOT EXISTS nfc_written_at TIMESTAMPTZ;

-- 배치 병 일련번호 백필
--
-- bottle_units.serial_number는 컬럼만 있고 아무도 채우지 않아 전부 NULL이었다.
-- "어떤 병의 몇 번 병인지" 표시하려면 제품별 순번이 필요하다. 생성 순서대로 매긴다.
WITH ranked AS (
  SELECT
    b1.id,
    (SELECT COALESCE(MAX(b2.serial_number), 0)
       FROM bottle_units b2
      WHERE b2.product_id = b1.product_id)
    + ROW_NUMBER() OVER (PARTITION BY b1.product_id ORDER BY b1.created_at) AS sn
  FROM bottle_units b1
  WHERE b1.serial_number IS NULL
)
UPDATE bottle_units bu
   SET serial_number = ranked.sn
  FROM ranked
 WHERE bu.id = ranked.id;

-- 거래 ↔ 발급 병 연결
--
-- 거래 내역과 NFC 발급 병을 한 표에서 보려면 어느 거래가 어느 병인지 알아야 한다.
-- 제품명·날짜·고객명으로 짐작하는 대신 발급 시점에 거래 id를 박는다.
-- 기존 행은 NULL로 남고, 화면에서는 "거래에 안 붙은 NFC 병"으로 따로 보인다.
ALTER TABLE bottle_units ADD COLUMN IF NOT EXISTS transaction_id TEXT;
CREATE INDEX IF NOT EXISTS idx_bottle_units_transaction_id ON bottle_units(transaction_id);

-- 병 단위 추적으로 확장 (2026 라인업도 한정번호 부여)
--
-- 모든 병에 NFC를 붙이므로 수량 단위 입출고가 맞지 않는다. 판매·예약·증정·손상을
-- 전부 병 하나씩 처리하고, 그 병의 한정번호를 여기 남긴다.
-- 예약·손상 병은 아직 코드를 받지 않으므로 nfc_code가 비어 있을 수 있다.
ALTER TABLE bottle_units ALTER COLUMN nfc_code DROP NOT NULL;

ALTER TABLE bottle_units DROP CONSTRAINT IF EXISTS bottle_units_status_check;
ALTER TABLE bottle_units ADD CONSTRAINT bottle_units_status_check
  CHECK (status IN ('reserved', 'sold', 'gifted', 'damaged'));

-- 한정번호는 제품 안에서 유일해야 한다 — 같은 번호 병이 둘일 수 없다
CREATE UNIQUE INDEX IF NOT EXISTS bottle_units_product_serial_uniq
  ON bottle_units(product_id, serial_number) WHERE serial_number IS NOT NULL;
