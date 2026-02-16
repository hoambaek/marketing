/**
 * 뮤즈드마레 마스터플랜 - 타입 정의
 *
 * 이 파일은 기존 코드와의 호환성을 위해 유지됩니다.
 * 실제 구현은 도메인별로 분리되어 있습니다.
 *
 * 구조:
 * - common.ts      : 공통 타입 (TaskCategory, TaskStatus 등)
 * - attachments.ts : 첨부파일 관련
 * - tasks.ts       : Task, MustDo, KPI, Content 관련
 * - issues.ts      : 이슈/리스크 관리
 * - inventory.ts   : 재고관리
 * - budget.ts      : 예산관리
 * - ocean-data.ts  : 해저숙성 데이터로그
 * - cost-calculator.ts : 원가계산기
 */

// Common
export {
  type TaskCategory,
  type TaskStatus,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  STATUS_LABELS,
  PHASE_INFO,
  AVAILABLE_YEARS,
} from './common';

// Attachments
export {
  type AttachmentType,
  type Attachment,
  ATTACHMENT_TYPE_LABELS,
  ALLOWED_FILE_EXTENSIONS,
  MAX_FILE_SIZE,
} from './attachments';

// Tasks
export {
  type ContentType,
  type ContentStatus,
  type KPICategory,
  CONTENT_TYPES,
  type Task,
  type MustDoItem,
  type WeekData,
  type MonthData,
  type ContentItem,
  type KPIItem,
  MONTHS_INFO,
} from './tasks';

// Issues
export {
  type IssueType,
  type IssuePriority,
  type IssueImpact,
  type IssueStatus,
  type IssueItem,
  ISSUE_TYPE_LABELS,
  ISSUE_TYPE_COLORS,
  ISSUE_PRIORITY_LABELS,
  ISSUE_PRIORITY_COLORS,
  ISSUE_IMPACT_LABELS,
  ISSUE_STATUS_LABELS,
  ISSUE_STATUS_COLORS,
} from './issues';

// Inventory
export {
  type ProductType,
  type BottleSize,
  type InventoryStatus,
  type Product,
  type NumberedBottle,
  type InventoryBatch,
  type InventoryTransaction,
  type BottleUnit,
  PRODUCTS,
  INVENTORY_STATUS_LABELS,
  INVENTORY_STATUS_COLORS,
} from './inventory';

// Budget (수입/지출)
export {
  type BudgetCategory,
  BUDGET_CATEGORY_LABELS,
  BUDGET_CATEGORY_COLORS,
  type IncomeItem,
  type BudgetItem, // Legacy alias
  type ExpenseItem,
} from './budget';

// Ocean Data
export {
  WANDO_COORDINATES,
  DEFAULT_AGING_DEPTH,
  type OceanDataView,
  type OceanDataHourly,
  type OceanDataDaily,
  type SalinityRecord,
  type CurrentOceanConditions,
  type OpenMeteoMarineResponse,
  type OpenMeteoWeatherResponse,
  type OceanChartDataPoint,
  OCEAN_DATA_LABELS,
} from './ocean-data';

// Cost Calculator
export {
  type CostCalculatorChampagneType,
  type CostCalculatorSettings,
} from './cost-calculator';
