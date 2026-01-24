/**
 * Cost Calculator 관련 데이터베이스 함수
 */

import { supabase, isSupabaseConfigured } from '../client';
import { dbLogger } from '@/lib/logger';
import { CostCalculatorSettings, CostCalculatorChampagneType } from '@/lib/types';

// ═══════════════════════════════════════════════════════════════════════════
// Cost Calculator DB 타입
// ═══════════════════════════════════════════════════════════════════════════

interface DBCostCalculatorSettings {
  id: string;
  year: number;
  exchange_rate: number;
  champagne_types: CostCalculatorChampagneType[];
  shipping_cost: number;
  insurance_cost: number;
  tax_cost: number;
  customs_fee: number;
  structure_cost: number;
  sea_usage_fee: number;
  ai_monitoring_cost: number;
  certification_cost: number;
  packaging_cost: number;
  marketing_cost: number;
  sga_cost: number;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Cost Calculator 함수들
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchCostCalculatorSettings(
  year?: number
): Promise<CostCalculatorSettings[] | null> {
  if (!isSupabaseConfigured()) return null;

  let query = supabase!
    .from('cost_calculator_settings')
    .select('*');

  if (year) {
    query = query.eq('year', year);
  }

  const { data, error } = await query.order('year', { ascending: true });

  if (error) {
    dbLogger.error('Error fetching cost calculator settings:', error);
    return null;
  }

  return data?.map(mapDbCostSettingsToCostSettings) || [];
}

export async function fetchCostCalculatorSettingsByYear(
  year: number
): Promise<CostCalculatorSettings | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase!
    .from('cost_calculator_settings')
    .select('*')
    .eq('year', year)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    dbLogger.error('Error fetching cost calculator settings by year:', error);
    return null;
  }

  return mapDbCostSettingsToCostSettings(data);
}

export async function upsertCostCalculatorSettings(
  settings: Omit<CostCalculatorSettings, 'id' | 'createdAt' | 'updatedAt'>
): Promise<CostCalculatorSettings | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase!
    .from('cost_calculator_settings')
    .upsert({
      year: settings.year,
      exchange_rate: settings.exchangeRate,
      champagne_types: settings.champagneTypes,
      shipping_cost: settings.shippingCost,
      insurance_cost: settings.insuranceCost,
      tax_cost: settings.taxCost,
      customs_fee: settings.customsFee,
      structure_cost: settings.structureCost,
      sea_usage_fee: settings.seaUsageFee,
      ai_monitoring_cost: settings.aiMonitoringCost,
      certification_cost: settings.certificationCost,
      packaging_cost: settings.packagingCost,
      marketing_cost: settings.marketingCost,
      sga_cost: settings.sgaCost,
    }, {
      onConflict: 'year',
    })
    .select()
    .single();

  if (error) {
    dbLogger.error('Error upserting cost calculator settings:', error);
    return null;
  }

  return mapDbCostSettingsToCostSettings(data);
}

export async function deleteCostCalculatorSettings(year: number): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase!
    .from('cost_calculator_settings')
    .delete()
    .eq('year', year);

  if (error) {
    dbLogger.error('Error deleting cost calculator settings:', error);
    return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// 매핑 헬퍼
// ═══════════════════════════════════════════════════════════════════════════

function mapDbCostSettingsToCostSettings(db: DBCostCalculatorSettings): CostCalculatorSettings {
  return {
    id: db.id,
    year: db.year,
    exchangeRate: db.exchange_rate,
    champagneTypes: db.champagne_types || [],
    shippingCost: db.shipping_cost,
    insuranceCost: db.insurance_cost,
    taxCost: db.tax_cost,
    customsFee: db.customs_fee,
    structureCost: db.structure_cost,
    seaUsageFee: db.sea_usage_fee,
    aiMonitoringCost: db.ai_monitoring_cost,
    certificationCost: db.certification_cost,
    packagingCost: db.packaging_cost,
    marketingCost: db.marketing_cost,
    sgaCost: db.sga_cost,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}
