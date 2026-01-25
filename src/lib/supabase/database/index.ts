/**
 * Database 함수 통합 Re-export
 *
 * 기존 코드와의 호환성을 위해 모든 함수를 여기서 re-export
 */

// Tasks, MustDo, KPI, Content
export {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  fetchMustDoItems,
  createMustDoItem,
  toggleMustDo,
  updateMustDoItem,
  deleteMustDoItem,
  fetchKPIItems,
  updateKPI,
  fetchContentItems,
  createContentItem,
  updateContentItem,
  deleteContentItem,
  seedInitialData,
  mapDbTaskToTask,
} from './tasks';

// Inventory
export {
  fetchNumberedBottles,
  updateNumberedBottle,
  fetchInventoryBatches,
  updateInventoryBatch,
  createInventoryBatch,
  deleteInventoryBatch,
  fetchInventoryTransactions,
  createInventoryTransaction,
  fetchCustomProducts,
  createCustomProduct,
  deleteCustomProduct,
  mapDbBottleToBottle,
  mapDbBatchToBatch,
  mapDbTransactionToTransaction,
  mapDbCustomProductToProduct,
} from './inventory';

export type {
  DBNumberedBottle,
  DBInventoryBatch,
  DBInventoryTransaction,
  DBCustomProduct,
} from './inventory';

// Budget
export {
  fetchBudgetItems,
  createBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  fetchExpenseItems,
  createExpenseItem,
  updateExpenseItem,
  deleteExpenseItem,
} from './budget';

export type {
  DBBudgetItem,
  DBExpenseItem,
} from './budget';

// Issues
export {
  fetchIssueItems,
  createIssueItem,
  updateIssueItem,
  deleteIssueItem,
} from './issues';

// Ocean Data
export {
  fetchOceanDataDaily,
  fetchOceanDataByDate,
  upsertOceanDataDaily,
  updateOceanDataSalinity,
  deleteOceanDataDaily,
  fetchSalinityRecords,
  createSalinityRecord,
  deleteSalinityRecord,
} from './ocean-data';

// Cost Calculator
export {
  fetchCostCalculatorSettings,
  fetchCostCalculatorSettingsByYear,
  upsertCostCalculatorSettings,
  deleteCostCalculatorSettings,
} from './cost-calculator';

// Structures
export {
  fetchStructuresByYear,
  createStructure,
  updateStructure,
  deleteStructure,
  createStructureItem,
  updateStructureItem,
  deleteStructureItem,
  saveStructuresForYear,
  mapDbStructureToStructure,
} from './structures';

export type {
  DBStructure,
  DBStructureItem,
  Structure as DBStructureApp,
  StructureItem as DBStructureItemApp,
} from './structures';
