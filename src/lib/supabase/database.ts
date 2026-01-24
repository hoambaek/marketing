/**
 * Database 함수 통합 모듈
 *
 * 이 파일은 기존 코드와의 호환성을 위해 유지됩니다.
 * 실제 구현은 database/ 폴더에 도메인별로 분리되어 있습니다.
 *
 * 구조:
 * - database/tasks.ts      : Task, MustDo, KPI, Content 관련
 * - database/inventory.ts  : Inventory 관련
 * - database/budget.ts     : Budget, Expense 관련
 * - database/issues.ts     : Issue 관련
 * - database/ocean-data.ts : Ocean Data, Salinity 관련
 * - database/cost-calculator.ts : Cost Calculator 관련
 */

export * from './database/index';
