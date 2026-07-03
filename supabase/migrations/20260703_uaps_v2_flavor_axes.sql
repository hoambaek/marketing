-- ═══════════════════════════════════════════════════════════════════════════
-- UAPS v2: 카테고리별 풍미 6축 + wine_type 제약 완화
--
-- 근거 문서: docs/uaps/UAPS_MULTI_CATEGORY_EXPANSION_PLAN_v2.md
-- 실행: Supabase Dashboard SQL Editor에서 수동 실행 (프로젝트 규칙)
--
-- 변경:
--  1. aging_predictions / aging_products: wine_type NOT NULL 제거
--     (전통주·간장 등 wine_type 없는 카테고리 예측 저장 실패 해결)
--  2. category_flavor_axes 테이블 신설: 카테고리별 6축 라벨 재정의
--     (DB 컬럼명 fruity_score 등은 슬롯 유지, 라벨만 카테고리별)
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 1. wine_type NOT NULL 제거
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE aging_predictions ALTER COLUMN wine_type DROP NOT NULL;
ALTER TABLE aging_products    ALTER COLUMN wine_type DROP NOT NULL;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. category_flavor_axes 테이블 신설
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS category_flavor_axes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_category text     NOT NULL,               -- champagne, soy_sauce, ...
  axis_index       smallint NOT NULL CHECK (axis_index BETWEEN 1 AND 6),
  db_column        text     NOT NULL,               -- fruity_score 등 (예측 슬롯)
  label_ko         text     NOT NULL,               -- 레이더 차트 한글 라벨
  label_en         text,                            -- 영문 키 (umami_depth 등)
  definition       text,                            -- 축 정의
  is_negative      boolean  NOT NULL DEFAULT false, -- 이취·부정 축 여부(예측 편향 방지)
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_category, axis_index)
);

CREATE INDEX IF NOT EXISTS idx_category_flavor_axes_category
  ON category_flavor_axes (product_category);

-- RLS: 라벨 참조 데이터(읽기 전용). 기존 UAPS 테이블 정책과 맞춰 조정할 것.
ALTER TABLE category_flavor_axes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "category_flavor_axes_read" ON category_flavor_axes;
CREATE POLICY "category_flavor_axes_read" ON category_flavor_axes
  FOR SELECT USING (true);  -- 참조 라벨은 공개 읽기. 쓰기는 service_role만.

-- ───────────────────────────────────────────────────────────────────────────
-- 3. 6축 라벨 seed (재실행 안전: 카테고리 단위로 삭제 후 삽입)
-- ───────────────────────────────────────────────────────────────────────────
DELETE FROM category_flavor_axes
 WHERE product_category IN
   ('champagne','soy_sauce','vinegar','green_coffee_bean','spirits','sake','puer');

INSERT INTO category_flavor_axes
  (product_category, axis_index, db_column, label_ko, label_en, definition, is_negative)
VALUES
-- 샴페인 (기존 WSET/OIV 6축)
('champagne',1,'fruity_score','과실향','fruity','신선·숙성 과실향',false),
('champagne',2,'floral_mineral_score','플로럴·미네랄','floral_mineral','꽃향·미네랄리티',false),
('champagne',3,'yeasty_autolytic_score','효모·숙성향','yeasty_autolytic','효모 자가분해·브리오슈',false),
('champagne',4,'acidity_freshness_score','산도·상쾌함','acidity_freshness','산도·프레시니스',false),
('champagne',5,'body_texture_score','바디감·질감','body_texture','무게감·질감',false),
('champagne',6,'finish_complexity_score','여운·복합미','finish_complexity','여운의 길이·복합성',false),
-- 간장
('soy_sauce',1,'fruity_score','감칠맛 깊이','umami_depth','Glu·Asp·핵산 기반 감칠맛 강도',false),
('soy_sauce',2,'floral_mineral_score','향미 복합성','aroma_complexity','에스테르·피라진·푸라논 휘발성 합주',false),
('soy_sauce',3,'yeasty_autolytic_score','염분 통합','saltiness_integration','짠맛이 전체와 어우러지는 정도',false),
('soy_sauce',4,'acidity_freshness_score','산미 구조','acidity_structure','젖산·초산 균형',false),
('soy_sauce',5,'body_texture_score','농후감·koku','body_koku','마우스필 두께·입체감(독립 속성)',false),
('soy_sauce',6,'finish_complexity_score','kokumi 여운','kokumi_finish','γ-glutamyl 펩타이드 기반 여운',false),
-- 식초
('vinegar',1,'fruity_score','산미 원숙도','acidity_roundness','산 harshness 단일 스케일(날카로움↔원숙)',false),
('vinegar',2,'floral_mineral_score','자극성·코쏨','pungency','초산의 trigeminal 자극(가장 식초다운 감각)',false),
('vinegar',3,'yeasty_autolytic_score','향 복합성','aroma_complexity','과실·꽃 뉘앙스(중립 관측)',false),
('vinegar',4,'acidity_freshness_score','감칠맛 깊이','umami_savory_depth','아미노산 감칠맛(현미·과실초)',false),
('vinegar',5,'body_texture_score','단맛 균형','sweetness_balance','산미를 받치는 내재 단맛',false),
('vinegar',6,'finish_complexity_score','여운 청명함','finish_clean','후미 잔존·깔끔함',false),
-- 생두 (SCA 커핑 기반)
('green_coffee_bean',1,'fruity_score','향·풍미 복합성','aroma_flavor','로스팅 후 꽃·과실·허브 향·풍미 다양성',false),
('green_coffee_bean',2,'floral_mineral_score','산미','acidity','로스팅 후 산미의 밝기',false),
('green_coffee_bean',3,'yeasty_autolytic_score','바디·무게감','body','오일감·질감',false),
('green_coffee_bean',4,'acidity_freshness_score','단맛','sweetness','카라멜·초콜릿 내재 단맛',false),
('green_coffee_bean',5,'body_texture_score','여운','aftertaste','지속성·복합성',false),
('green_coffee_bean',6,'finish_complexity_score','클린컵·결점도','clean_cup','곰팡이취·페놀·baggy 결점 부재(최우선 KPI)',true),
-- 전통 증류주 (소주)
('spirits',1,'fruity_score','순도·퓨젤 통합','purity_fusel','퓨젤 잔존·열감의 날카로움↔순함',false),
('spirits',2,'floral_mineral_score','과실향 에스테르','fruity_ester','이소아밀아세테이트·에틸아세테이트 향',false),
('spirits',3,'yeasty_autolytic_score','곡물 단맛','grain_sweetness','쌀·보리·옥수수 기원 단맛',false),
('spirits',4,'acidity_freshness_score','바디·질감','body_texture','무게감·점도',false),
('spirits',5,'body_texture_score','이취·산화 리스크','oxidation_offnote','아세탈·마개 taint·용기 용출',true),
('spirits',6,'finish_complexity_score','여운 따뜻함','finish_warming','목 넘김 후 열감 지속',false),
-- 청주·약주
('sake',1,'fruity_score','농순감·濃淡','body_richness','濃醇↔淡麗 바디 농담(사케 2대축)',false),
('sake',2,'floral_mineral_score','쌀·누룩 향','rice_koji_aroma','누룩향·쌀향·화향(후각)',false),
('sake',3,'yeasty_autolytic_score','유산미 섬세함','lactic_finesse','날카로운 유산미→부드러운 입체 산미',false),
('sake',4,'acidity_freshness_score','감신 밸런스·甘辛','sweetness_dryness','단맛↔드라이 양극(사케 甘辛度)',false),
('sake',5,'body_texture_score','감칠맛','umami','아미노산 기반 깊은 맛(미각)',false),
('sake',6,'finish_complexity_score','여운 비단결','finish_silkiness','실크 감촉·지속',false),
-- 운남성 생차
('puer',1,'fruity_score','꽃·과실향 밝기','floral_fruity_brightness','청향·화향의 생동감',false),
('puer',2,'floral_mineral_score','수렴성 구조','astringency_structure','타닌 강도·정교함',false),
('puer',3,'yeasty_autolytic_score','단맛 복잡성','sweetness_complexity','꿀향·과당·목당 층위',false),
('puer',4,'acidity_freshness_score','미네랄·떼루아르','mineral_terroir','고산지 산지 개성',false),
('puer',5,'body_texture_score','차기 활력','cha_qi_vitality','체감 에너지(정성 지표)',false),
('puer',6,'finish_complexity_score','회감 속도·강도','hui_gan_tempo','쓴맛 후 단맛 귀환(GB/T 22111)',false);

-- 확인: SELECT product_category, count(*) FROM category_flavor_axes GROUP BY 1;
