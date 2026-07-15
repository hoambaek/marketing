# Database

## Convention
- **DB**: snake_case (`due_date`, `created_at`)
- **TypeScript**: camelCase (`dueDate`, `createdAt`)
- 매핑 함수로 변환 (예: `mapDbTaskToTask`)

## Tables
**Masterplan**: `tasks`, `must_do_items`, `kpi_items`, `content_items`
**Inventory**: `numbered_bottles`, `inventory_batches`, `inventory_transactions`, `custom_products`
**Budget**: `budget_items`, `expense_items`
**Issues**: `issues`
**Ocean**: `ocean_data_daily`, `salinity_records`
**Cost/Pricing**: `cost_calculator_settings`, `pricing_settings`, `structures`, `structure_items`
**UAPS**: `wine_terrestrial_data`(학습 원천 112K), `terrestrial_model`(집계), `aging_products`, `aging_predictions`, `uaps_config`, `flavor_dictionary`, `retrieval_results`(비교시음), `tasting_submissions`(외부 제출), `category_flavor_axes`(카테고리별 6축 라벨·정의 — 코드 상수와 동기)
**Members(/admin)**: `brandbook_requests`, `invitations`, `partner_inquiries`, `subscribers`

## DB Files (`src/lib/supabase/database/`)
| 파일 | 테이블 |
|------|--------|
| `tasks.ts` | tasks, must_do_items, kpi_items, content_items |
| `inventory.ts` | bottles, batches, transactions |
| `budget.ts` | budget_items, expenses |
| `issues.ts` | issues |
| `ocean-data.ts` | ocean_data_daily, salinity_records |
| `cost-calculator.ts` | cost_calculator_settings |
| `pricing.ts` | pricing_settings |
| `structures.ts` | structures, structure_items |
| `uaps.ts` | UAPS 전체 (products, predictions, models, retrieval_results 등) |
| `tasting-submissions.ts` | tasting_submissions (+예측 카테고리 조인, aging_products 실존 확인 → productLinked, 승인 시 제품 재지정 지원) |

## Integration Rules
- 새 기능은 반드시 Supabase 연동 (localStorage 금지)
- DDL은 **Dashboard SQL Editor에서 수동 실행** (CLI push 사용 안 함)
- PostgREST **행 500개 제한** — 전량 로드 시 `range(offset, offset+999)` 배치
- `aging_predictions.wine_type`은 **nullable** (비와인 카테고리 대응, NOT NULL 제약 해제됨)
- `terrestrial_model`은 `(product_category, aging_stage)` 유니크 — 카테고리 rename 시 충돌 주의

## 서버리스/스크립트에서 직접 접근 (MCP 권한 없음)
```bash
SRK=$SUPABASE_SERVICE_ROLE_KEY
# 조회
curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/aging_products?select=*" -H "apikey: $SRK" -H "Authorization: Bearer $SRK"
# 카운트: -I + Prefer: count=exact → content-range 헤더 파싱
# 수정: PATCH + {"col":"val"}, 삭제: DELETE — 반드시 필터 붙일 것
```
