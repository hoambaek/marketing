-- v3.0: 마개 타입 컬럼 추가
-- closure_type: 마개 종류 (OTR 기반 FRI 보정에 사용)
ALTER TABLE aging_products
  ADD COLUMN IF NOT EXISTS closure_type TEXT DEFAULT 'cork_natural';

-- 기존 제품에 카테고리 기본 마개 적용
UPDATE aging_products SET closure_type = 'crown_cap' WHERE product_category = 'champagne' AND closure_type = 'cork_natural';
UPDATE aging_products SET closure_type = 'screw_cap' WHERE product_category IN ('white_wine', 'sake', 'coldbrew') AND closure_type = 'cork_natural';
UPDATE aging_products SET closure_type = 'none' WHERE product_category = 'puer' AND closure_type = 'cork_natural';
UPDATE aging_products SET closure_type = 'ceramic_cap' WHERE product_category = 'soy_sauce' AND closure_type = 'cork_natural';
UPDATE aging_products SET closure_type = 'glass_stopper' WHERE product_category = 'vinegar' AND closure_type = 'cork_natural';
