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
**Cost**: `cost_calculator_settings`
**UAPS**: `wine_terrestrial_data`, `terrestrial_model`, `aging_products`, `aging_predictions`, `uaps_config`, `flavor_dictionary`, `retrieval_results`

## DB Files (`src/lib/supabase/database/`)
| 파일 | 테이블 |
|------|--------|
| `tasks.ts` | tasks, must_do_items, kpi_items, content_items |
| `inventory.ts` | bottles, batches, transactions |
| `budget.ts` | budget_items, expenses |
| `issues.ts` | issues |
| `ocean-data.ts` | ocean_data_daily, salinity_records |
| `cost-calculator.ts` | cost_calculator_settings |
| `uaps.ts` | UAPS 전체 (products, predictions, models, retrieval_results) |

## Integration Rules
- 새 기능은 반드시 Supabase 연동 (localStorage 금지)
- DDL은 **Dashboard SQL Editor에서 수동 실행** (CLI push 사용 안 함)
- row limit 1000 주의: 배치 로드 시 `range(offset, offset+999)` 사용
