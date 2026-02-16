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
  updateInventoryTransaction,
  deleteInventoryTransaction,
  fetchCustomProducts,
  createCustomProduct,
  updateCustomProduct,
  deleteCustomProduct,
  mapDbBottleToBottle,
  mapDbBatchToBatch,
  mapDbTransactionToTransaction,
  mapDbCustomProductToProduct,
  // NFC + 숙성 데이터
  generateUniqueNfcCode,
  createBottleUnit,
  fetchBottleByNfcCode,
  updateBatchAgingDates,
  updateNumberedBottleNfc,
  mapDbBottleUnitToBottleUnit,
} from './inventory';

export type {
  DBNumberedBottle,
  DBInventoryBatch,
  DBInventoryTransaction,
  DBCustomProduct,
  DBBottleUnit,
} from './inventory';

// Budget (Income & Expense)
export {
  // Income functions
  fetchIncomeItems,
  createIncomeItem,
  updateIncomeItem,
  deleteIncomeItem,
  // Expense functions
  fetchExpenseItems,
  createExpenseItem,
  updateExpenseItem,
  deleteExpenseItem,
  // Legacy aliases
  fetchBudgetItems,
  createBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
} from './budget';

export type {
  DBIncomeItem,
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
  bulkUpsertOceanDataDaily,
  fetchExistingDates,
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

// Pricing
export {
  fetchPricingSettings,
  upsertPricingSetting,
  upsertPricingSettings,
  deletePricingSetting,
} from './pricing';

export type {
  DBPricingTierSetting,
  PricingTierSetting,
} from './pricing';

// UAPS (Undersea Aging Predictive System)
export {
  fetchAgingProducts,
  fetchAgingProductById,
  createAgingProduct,
  updateAgingProduct,
  deleteAgingProduct,
  fetchAgingPredictions,
  createAgingPrediction,
  fetchWineTerrestrialData,
  fetchWineTerrestrialDataCount,
  bulkInsertWineTerrestrialData,
  fetchTerrestrialModels,
  fetchTerrestrialModelByTypeStage,
  upsertTerrestrialModel,
  fetchFlavorDictionary,
  fetchUAPSConfig,
  updateUAPSConfigValue,
} from './uaps';
