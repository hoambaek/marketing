/**
 * 가격 전략 설정 관련 데이터베이스 함수
 */

import { supabase, isSupabaseConfigured } from '../client';
import { dbLogger } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════════════════
// 타입 정의
// ═══════════════════════════════════════════════════════════════════════════

export interface DBPricingTierSetting {
  id: string;
  year: number;
  tier_id: string;
  quantity: number;
  b2b_price: number;
  consumer_price: number;
  created_at: string;
  updated_at: string;
}

export interface PricingTierSetting {
  id: string;
  year: number;
  tierId: string;
  quantity: number;
  b2bPrice: number;
  consumerPrice: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// 가격 설정 조회
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchPricingSettings(year: number): Promise<PricingTierSetting[] | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase!
    .from('pricing_settings')
    .select('*')
    .eq('year', year);

  if (error) {
    // 테이블이 없으면 null 반환
    if (error.code === '42P01' || error.message.includes('does not exist')) {
      dbLogger.warn('pricing_settings table does not exist yet');
      return null;
    }
    dbLogger.error('Error fetching pricing settings:', error);
    return null;
  }

  return data?.map(mapDbToPricingSetting) || [];
}

// ═══════════════════════════════════════════════════════════════════════════
// 가격 설정 저장 (Upsert)
// ═══════════════════════════════════════════════════════════════════════════

export async function upsertPricingSetting(setting: Omit<PricingTierSetting, 'id'>): Promise<PricingTierSetting | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase!
    .from('pricing_settings')
    .upsert(
      {
        year: setting.year,
        tier_id: setting.tierId,
        quantity: setting.quantity,
        b2b_price: setting.b2bPrice,
        consumer_price: setting.consumerPrice,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'year,tier_id',
      }
    )
    .select()
    .single();

  if (error) {
    dbLogger.error('Error upserting pricing setting:', error);
    return null;
  }

  return mapDbToPricingSetting(data);
}

// 여러 개 한 번에 저장
export async function upsertPricingSettings(
  year: number,
  settings: Record<string, { quantity: number; b2bPrice: number; consumerPrice: number }>
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const records = Object.entries(settings).map(([tierId, values]) => ({
    year,
    tier_id: tierId,
    quantity: values.quantity,
    b2b_price: values.b2bPrice,
    consumer_price: values.consumerPrice,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase!
    .from('pricing_settings')
    .upsert(records, { onConflict: 'year,tier_id' });

  if (error) {
    dbLogger.error('Error upserting pricing settings:', error);
    return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// 가격 설정 삭제
// ═══════════════════════════════════════════════════════════════════════════

export async function deletePricingSetting(year: number, tierId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase!
    .from('pricing_settings')
    .delete()
    .eq('year', year)
    .eq('tier_id', tierId);

  if (error) {
    dbLogger.error('Error deleting pricing setting:', error);
    return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// 매핑 헬퍼
// ═══════════════════════════════════════════════════════════════════════════

function mapDbToPricingSetting(db: DBPricingTierSetting): PricingTierSetting {
  return {
    id: db.id,
    year: db.year,
    tierId: db.tier_id,
    quantity: db.quantity,
    b2bPrice: db.b2b_price,
    consumerPrice: db.consumer_price,
  };
}
