/**
 * UAPS (Undersea Aging Predictive System) 데이터베이스 함수
 * - AgingProducts, AgingPredictions, WineTerrestrialData, TerrestrialModel
 * - FlavorDictionary, UAPSConfig
 */

import { supabase, isSupabaseConfigured } from '../client';
import { dbLogger } from '@/lib/logger';
import type {
  AgingProduct,
  AgingPrediction,
  WineTerrestrialData,
  TerrestrialModel,
  FlavorDictionary,
  UAPSConfig,
  TerrestrialDataFilters,
  ProductInput,
  WineType,
  AgingStage,
} from '@/lib/types/uaps';

// ═══════════════════════════════════════════════════════════════════════════
// DB 타입 정의 (snake_case)
// ═══════════════════════════════════════════════════════════════════════════

interface DBAgingProduct {
  id: string;
  product_name: string;
  wine_type: string;
  vintage: number | null;
  producer: string;
  ph: number | null;
  dosage: number | null;
  alcohol: number | null;
  acidity: number | null;
  reduction_potential: string;
  reduction_checks: Record<string, boolean> | null;
  immersion_date: string | null;
  planned_duration_months: number | null;
  aging_depth: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface DBAgingPrediction {
  id: string;
  product_id: string | null;
  wine_type: string;
  input_ph: number | null;
  input_dosage: number | null;
  input_reduction_potential: string | null;
  undersea_duration_months: number;
  aging_depth: number;
  immersion_date: string | null;
  predicted_fruity: number | null;
  predicted_floral_mineral: number | null;
  predicted_yeasty_autolytic: number | null;
  predicted_acidity_freshness: number | null;
  predicted_body_texture: number | null;
  predicted_finish_complexity: number | null;
  texture_maturity_score: number | null;
  aroma_freshness_score: number | null;
  off_flavor_risk_score: number | null;
  overall_quality_score: number | null;
  optimal_harvest_start_months: number | null;
  optimal_harvest_end_months: number | null;
  harvest_recommendation: string | null;
  ai_insight_text: string | null;
  ai_risk_warning: string | null;
  expert_profile_json: Record<string, number> | null;
  expert_sources: string[] | null;
  tci_applied: number;
  fri_applied: number;
  bri_applied: number;
  prediction_confidence: number;
  created_at: string;
}

interface DBWineTerrestrialData {
  id: string;
  wine_name: string;
  producer: string | null;
  vintage: number | null;
  wine_type: string;
  ph: number | null;
  dosage: number | null;
  alcohol: number | null;
  acidity: number | null;
  reduction_potential: string | null;
  fruity_score: number | null;
  floral_mineral_score: number | null;
  yeasty_autolytic_score: number | null;
  acidity_freshness_score: number | null;
  body_texture_score: number | null;
  finish_complexity_score: number | null;
  aging_years: number | null;
  aging_stage: string | null;
  drinking_window_start: number | null;
  drinking_window_end: number | null;
  data_source: string;
  review_text: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

interface DBTerrestrialModel {
  id: string;
  wine_type: string;
  aging_stage: string;
  sample_count: number;
  flavor_profile_json: Record<string, unknown>;
  physicochemical_stats_json: Record<string, unknown>;
  transition_curves_json: Record<string, unknown>;
  cluster_centroids_json: Record<string, unknown>;
  drinking_window_stats_json: Record<string, unknown>;
  confidence_score: number;
  computed_at: string;
  created_at: string;
  updated_at: string;
}

interface DBFlavorDictionary {
  id: string;
  expert_term: string;
  consumer_keywords: string[];
  associated_stage: string | null;
  flavor_category: string;
  tci_weight: number;
  fri_weight: number;
  created_at: string;
}

interface DBUAPSConfig {
  id: string;
  config_key: string;
  config_value: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Aging Products CRUD
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchAgingProducts(): Promise<AgingProduct[] | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase!
    .from('aging_products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    dbLogger.error('UAPS: 숙성 제품 조회 실패:', error);
    return null;
  }

  return data?.map(mapDbAgingProduct) || [];
}

export async function fetchAgingProductById(id: string): Promise<AgingProduct | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase!
    .from('aging_products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    dbLogger.error('UAPS: 제품 조회 실패:', error);
    return null;
  }

  return mapDbAgingProduct(data);
}

export async function createAgingProduct(
  input: ProductInput
): Promise<AgingProduct | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase!
    .from('aging_products')
    .insert({
      product_name: input.productName,
      wine_type: input.wineType,
      vintage: input.vintage,
      producer: input.producer,
      ph: input.ph,
      dosage: input.dosage,
      alcohol: input.alcohol,
      acidity: input.acidity,
      reduction_potential: input.reductionPotential,
      reduction_checks: input.reductionChecks,
      immersion_date: input.immersionDate,
      planned_duration_months: input.plannedDurationMonths,
      aging_depth: input.agingDepth,
      notes: input.notes,
    })
    .select()
    .single();

  if (error) {
    dbLogger.error('UAPS: 제품 생성 실패:', error);
    return null;
  }

  return mapDbAgingProduct(data);
}

export async function updateAgingProduct(
  id: string,
  updates: Partial<ProductInput> & { status?: string }
): Promise<AgingProduct | null> {
  if (!isSupabaseConfigured()) return null;

  const dbUpdates: Record<string, unknown> = {};
  if (updates.productName !== undefined) dbUpdates.product_name = updates.productName;
  if (updates.wineType !== undefined) dbUpdates.wine_type = updates.wineType;
  if (updates.vintage !== undefined) dbUpdates.vintage = updates.vintage;
  if (updates.producer !== undefined) dbUpdates.producer = updates.producer;
  if (updates.ph !== undefined) dbUpdates.ph = updates.ph;
  if (updates.dosage !== undefined) dbUpdates.dosage = updates.dosage;
  if (updates.alcohol !== undefined) dbUpdates.alcohol = updates.alcohol;
  if (updates.acidity !== undefined) dbUpdates.acidity = updates.acidity;
  if (updates.reductionPotential !== undefined) dbUpdates.reduction_potential = updates.reductionPotential;
  if (updates.reductionChecks !== undefined) dbUpdates.reduction_checks = updates.reductionChecks;
  if (updates.immersionDate !== undefined) dbUpdates.immersion_date = updates.immersionDate;
  if (updates.plannedDurationMonths !== undefined) dbUpdates.planned_duration_months = updates.plannedDurationMonths;
  if (updates.agingDepth !== undefined) dbUpdates.aging_depth = updates.agingDepth;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
  if (updates.status !== undefined) dbUpdates.status = updates.status;

  const { data, error } = await supabase!
    .from('aging_products')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    dbLogger.error('UAPS: 제품 업데이트 실패:', error);
    return null;
  }

  return mapDbAgingProduct(data);
}

export async function deleteAgingProduct(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase!
    .from('aging_products')
    .delete()
    .eq('id', id);

  if (error) {
    dbLogger.error('UAPS: 제품 삭제 실패:', error);
    return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// Aging Predictions CRUD
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchAgingPredictions(
  productId?: string,
  limit: number = 20
): Promise<AgingPrediction[] | null> {
  if (!isSupabaseConfigured()) return null;

  let query = supabase!
    .from('aging_predictions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (productId) {
    query = query.eq('product_id', productId);
  }

  const { data, error } = await query;

  if (error) {
    dbLogger.error('UAPS: 예측 결과 조회 실패:', error);
    return null;
  }

  return data?.map(mapDbAgingPrediction) || [];
}

export async function createAgingPrediction(
  prediction: Omit<AgingPrediction, 'id' | 'createdAt'>
): Promise<AgingPrediction | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase!
    .from('aging_predictions')
    .insert({
      product_id: prediction.productId,
      wine_type: prediction.wineType,
      input_ph: prediction.inputPh,
      input_dosage: prediction.inputDosage,
      input_reduction_potential: prediction.inputReductionPotential,
      undersea_duration_months: prediction.underseaDurationMonths,
      aging_depth: prediction.agingDepth,
      immersion_date: prediction.immersionDate,
      predicted_fruity: prediction.predictedFruity,
      predicted_floral_mineral: prediction.predictedFloralMineral,
      predicted_yeasty_autolytic: prediction.predictedYeastyAutolytic,
      predicted_acidity_freshness: prediction.predictedAcidityFreshness,
      predicted_body_texture: prediction.predictedBodyTexture,
      predicted_finish_complexity: prediction.predictedFinishComplexity,
      texture_maturity_score: prediction.textureMaturityScore,
      aroma_freshness_score: prediction.aromaFreshnessScore,
      off_flavor_risk_score: prediction.offFlavorRiskScore,
      overall_quality_score: prediction.overallQualityScore,
      optimal_harvest_start_months: prediction.optimalHarvestStartMonths,
      optimal_harvest_end_months: prediction.optimalHarvestEndMonths,
      harvest_recommendation: prediction.harvestRecommendation,
      ai_insight_text: prediction.aiInsightText,
      ai_risk_warning: prediction.aiRiskWarning,
      expert_profile_json: prediction.expertProfileJson,
      expert_sources: prediction.expertSources,
      tci_applied: prediction.tciApplied,
      fri_applied: prediction.friApplied,
      bri_applied: prediction.briApplied,
      prediction_confidence: prediction.predictionConfidence,
    })
    .select()
    .single();

  if (error) {
    dbLogger.error('UAPS: 예측 결과 저장 실패:', error);
    return null;
  }

  return mapDbAgingPrediction(data);
}

// ═══════════════════════════════════════════════════════════════════════════
// Wine Terrestrial Data CRUD (학습 데이터)
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchWineTerrestrialData(
  filters?: TerrestrialDataFilters
): Promise<WineTerrestrialData[] | null> {
  if (!isSupabaseConfigured()) return null;

  let query = supabase!
    .from('wine_terrestrial_data')
    .select('*');

  if (filters?.wineType) {
    query = query.eq('wine_type', filters.wineType);
  }
  if (filters?.agingStage) {
    query = query.eq('aging_stage', filters.agingStage);
  }
  if (filters?.dataSource) {
    query = query.eq('data_source', filters.dataSource);
  }

  query = query.order('created_at', { ascending: false });

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1);
  }

  const { data, error } = await query;

  if (error) {
    dbLogger.error('UAPS: 지상 데이터 조회 실패:', error);
    return null;
  }

  return data?.map(mapDbWineTerrestrialData) || [];
}

export async function fetchWineTerrestrialDataCount(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;

  const { count, error } = await supabase!
    .from('wine_terrestrial_data')
    .select('*', { count: 'exact', head: true });

  if (error) {
    dbLogger.error('UAPS: 지상 데이터 카운트 실패:', error);
    return 0;
  }

  return count || 0;
}

export async function bulkInsertWineTerrestrialData(
  records: Omit<WineTerrestrialData, 'id' | 'createdAt' | 'updatedAt'>[]
): Promise<number> {
  if (!isSupabaseConfigured() || records.length === 0) return 0;

  const dbRecords = records.map((r) => ({
    wine_name: r.wineName,
    producer: r.producer,
    vintage: r.vintage,
    wine_type: r.wineType,
    ph: r.ph,
    dosage: r.dosage,
    alcohol: r.alcohol,
    acidity: r.acidity,
    reduction_potential: r.reductionPotential,
    fruity_score: r.fruityScore,
    floral_mineral_score: r.floralMineralScore,
    yeasty_autolytic_score: r.yeastyAutolyticScore,
    acidity_freshness_score: r.acidityFreshnessScore,
    body_texture_score: r.bodyTextureScore,
    finish_complexity_score: r.finishComplexityScore,
    aging_years: r.agingYears,
    aging_stage: r.agingStage,
    drinking_window_start: r.drinkingWindowStart,
    drinking_window_end: r.drinkingWindowEnd,
    data_source: r.dataSource,
    review_text: r.reviewText,
    rating: r.rating,
  }));

  let totalInserted = 0;
  const BATCH_SIZE = 500;

  for (let i = 0; i < dbRecords.length; i += BATCH_SIZE) {
    const batch = dbRecords.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase!
      .from('wine_terrestrial_data')
      .insert(batch)
      .select('id');

    if (error) {
      dbLogger.error(`UAPS: 배치 insert 실패 (${i}-${i + batch.length}):`, error.message);
      continue;
    }

    totalInserted += data?.length ?? batch.length;
  }

  return totalInserted;
}

// ═══════════════════════════════════════════════════════════════════════════
// Terrestrial Model CRUD (학습 결과)
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchTerrestrialModels(): Promise<TerrestrialModel[] | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase!
    .from('terrestrial_model')
    .select('*')
    .order('wine_type');

  if (error) {
    dbLogger.error('UAPS: 모델 조회 실패:', error);
    return null;
  }

  return data?.map(mapDbTerrestrialModel) || [];
}

export async function fetchTerrestrialModelByTypeStage(
  wineType: WineType,
  agingStage: AgingStage
): Promise<TerrestrialModel | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase!
    .from('terrestrial_model')
    .select('*')
    .eq('wine_type', wineType)
    .eq('aging_stage', agingStage)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    dbLogger.error('UAPS: 모델 조회 실패:', error);
    return null;
  }

  return mapDbTerrestrialModel(data);
}

export async function upsertTerrestrialModel(
  model: Omit<TerrestrialModel, 'id' | 'createdAt' | 'updatedAt'>
): Promise<TerrestrialModel | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase!
    .from('terrestrial_model')
    .upsert({
      wine_type: model.wineType,
      aging_stage: model.agingStage,
      sample_count: model.sampleCount,
      flavor_profile_json: model.flavorProfileJson,
      physicochemical_stats_json: model.physicochemicalStatsJson,
      transition_curves_json: model.transitionCurvesJson,
      cluster_centroids_json: model.clusterCentroidsJson,
      drinking_window_stats_json: model.drinkingWindowStatsJson,
      confidence_score: model.confidenceScore,
      computed_at: model.computedAt,
    }, {
      onConflict: 'wine_type,aging_stage',
    })
    .select()
    .single();

  if (error) {
    dbLogger.error('UAPS: 모델 upsert 실패:', error);
    return null;
  }

  return mapDbTerrestrialModel(data);
}

// ═══════════════════════════════════════════════════════════════════════════
// Flavor Dictionary CRUD
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchFlavorDictionary(): Promise<FlavorDictionary[] | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase!
    .from('flavor_dictionary')
    .select('*')
    .order('expert_term');

  if (error) {
    dbLogger.error('UAPS: 풍미 사전 조회 실패:', error);
    return null;
  }

  return data?.map(mapDbFlavorDictionary) || [];
}

// ═══════════════════════════════════════════════════════════════════════════
// UAPS Config CRUD
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchUAPSConfig(): Promise<UAPSConfig[] | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase!
    .from('uaps_config')
    .select('*')
    .order('config_key');

  if (error) {
    dbLogger.error('UAPS: 설정 조회 실패:', error);
    return null;
  }

  return data?.map(mapDbUAPSConfig) || [];
}

export async function updateUAPSConfigValue(
  configKey: string,
  configValue: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase!
    .from('uaps_config')
    .update({ config_value: configValue })
    .eq('config_key', configKey);

  if (error) {
    dbLogger.error('UAPS: 설정 업데이트 실패:', error);
    return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// 매핑 헬퍼 (snake_case → camelCase)
// ═══════════════════════════════════════════════════════════════════════════

function mapDbAgingProduct(db: DBAgingProduct): AgingProduct {
  return {
    id: db.id,
    productName: db.product_name,
    wineType: db.wine_type as AgingProduct['wineType'],
    vintage: db.vintage,
    producer: db.producer,
    ph: db.ph,
    dosage: db.dosage,
    alcohol: db.alcohol,
    acidity: db.acidity,
    reductionPotential: db.reduction_potential as AgingProduct['reductionPotential'],
    reductionChecks: db.reduction_checks,
    immersionDate: db.immersion_date,
    plannedDurationMonths: db.planned_duration_months,
    agingDepth: db.aging_depth,
    status: db.status as AgingProduct['status'],
    notes: db.notes,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function mapDbAgingPrediction(db: DBAgingPrediction): AgingPrediction {
  return {
    id: db.id,
    productId: db.product_id,
    wineType: db.wine_type as AgingPrediction['wineType'],
    inputPh: db.input_ph,
    inputDosage: db.input_dosage,
    inputReductionPotential: db.input_reduction_potential,
    underseaDurationMonths: db.undersea_duration_months,
    agingDepth: db.aging_depth,
    immersionDate: db.immersion_date,
    predictedFruity: db.predicted_fruity,
    predictedFloralMineral: db.predicted_floral_mineral,
    predictedYeastyAutolytic: db.predicted_yeasty_autolytic,
    predictedAcidityFreshness: db.predicted_acidity_freshness,
    predictedBodyTexture: db.predicted_body_texture,
    predictedFinishComplexity: db.predicted_finish_complexity,
    textureMaturityScore: db.texture_maturity_score,
    aromaFreshnessScore: db.aroma_freshness_score,
    offFlavorRiskScore: db.off_flavor_risk_score,
    overallQualityScore: db.overall_quality_score,
    optimalHarvestStartMonths: db.optimal_harvest_start_months,
    optimalHarvestEndMonths: db.optimal_harvest_end_months,
    harvestRecommendation: db.harvest_recommendation,
    aiInsightText: db.ai_insight_text,
    aiRiskWarning: db.ai_risk_warning,
    expertProfileJson: db.expert_profile_json,
    expertSources: db.expert_sources,
    tciApplied: db.tci_applied,
    friApplied: db.fri_applied,
    briApplied: db.bri_applied,
    predictionConfidence: db.prediction_confidence,
    createdAt: db.created_at,
  };
}

function mapDbWineTerrestrialData(db: DBWineTerrestrialData): WineTerrestrialData {
  return {
    id: db.id,
    wineName: db.wine_name,
    producer: db.producer,
    vintage: db.vintage,
    wineType: db.wine_type as WineTerrestrialData['wineType'],
    ph: db.ph,
    dosage: db.dosage,
    alcohol: db.alcohol,
    acidity: db.acidity,
    reductionPotential: db.reduction_potential as WineTerrestrialData['reductionPotential'],
    fruityScore: db.fruity_score,
    floralMineralScore: db.floral_mineral_score,
    yeastyAutolyticScore: db.yeasty_autolytic_score,
    acidityFreshnessScore: db.acidity_freshness_score,
    bodyTextureScore: db.body_texture_score,
    finishComplexityScore: db.finish_complexity_score,
    agingYears: db.aging_years,
    agingStage: db.aging_stage as WineTerrestrialData['agingStage'],
    drinkingWindowStart: db.drinking_window_start,
    drinkingWindowEnd: db.drinking_window_end,
    dataSource: db.data_source as WineTerrestrialData['dataSource'],
    reviewText: db.review_text,
    rating: db.rating,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function mapDbTerrestrialModel(db: DBTerrestrialModel): TerrestrialModel {
  return {
    id: db.id,
    wineType: db.wine_type as TerrestrialModel['wineType'],
    agingStage: db.aging_stage as TerrestrialModel['agingStage'],
    sampleCount: db.sample_count,
    flavorProfileJson: db.flavor_profile_json,
    physicochemicalStatsJson: db.physicochemical_stats_json,
    transitionCurvesJson: db.transition_curves_json,
    clusterCentroidsJson: db.cluster_centroids_json,
    drinkingWindowStatsJson: db.drinking_window_stats_json,
    confidenceScore: db.confidence_score,
    computedAt: db.computed_at,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function mapDbFlavorDictionary(db: DBFlavorDictionary): FlavorDictionary {
  return {
    id: db.id,
    expertTerm: db.expert_term,
    consumerKeywords: db.consumer_keywords,
    associatedStage: db.associated_stage as FlavorDictionary['associatedStage'],
    flavorCategory: db.flavor_category as FlavorDictionary['flavorCategory'],
    tciWeight: db.tci_weight,
    friWeight: db.fri_weight,
    createdAt: db.created_at,
  };
}

function mapDbUAPSConfig(db: DBUAPSConfig): UAPSConfig {
  return {
    id: db.id,
    configKey: db.config_key,
    configValue: db.config_value,
    description: db.description,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 벌크 인서트 (CellarTracker 데이터 수집용)
// ═══════════════════════════════════════════════════════════════════════════

export async function bulkInsertTerrestrialData(
  records: Omit<DBWineTerrestrialData, 'id' | 'created_at' | 'updated_at'>[]
): Promise<{ inserted: number; errors: number }> {
  if (!isSupabaseConfigured()) return { inserted: 0, errors: 0 };

  let totalInserted = 0;
  let totalErrors = 0;
  const BATCH_SIZE = 500;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);

    const { data, error } = await supabase!
      .from('wine_terrestrial_data')
      .insert(batch)
      .select('id');

    if (error) {
      dbLogger.error(`UAPS: 벌크 인서트 배치 ${i / BATCH_SIZE + 1} 실패:`, error);
      totalErrors += batch.length;
    } else {
      totalInserted += data?.length || 0;
    }
  }

  dbLogger.info(`UAPS: 벌크 인서트 완료 - 삽입: ${totalInserted}, 에러: ${totalErrors}`);
  return { inserted: totalInserted, errors: totalErrors };
}
