/**
 * ocean_data_daily 쓰기 — service_role 전용 (서버에서만 import).
 *
 * ocean_data_daily는 anon write 정책을 제거했으므로(2026-07-22) 쓰기는 이 모듈로만.
 * 읽기(공개 수온 표시)는 기존 database/ocean-data.ts(anon SELECT)를 계속 쓴다.
 * - 클라이언트(데이터로그 자동저장): /api/ocean-data 인증 라우트 경유
 * - cron(수집·백필): 이 모듈을 직접 import
 */

import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { dbLogger } from '@/lib/logger';
import { OceanDataDaily } from '@/lib/types';

type OceanDataInput = Omit<OceanDataDaily, 'id' | 'createdAt' | 'updatedAt'>;

function toDbRecord(r: OceanDataInput) {
  return {
    date: r.date,
    sea_temperature_avg: r.seaTemperatureAvg,
    sea_temperature_min: r.seaTemperatureMin,
    sea_temperature_max: r.seaTemperatureMax,
    current_velocity_avg: r.currentVelocityAvg,
    current_direction_dominant: r.currentDirectionDominant,
    wave_height_avg: r.waveHeightAvg,
    wave_height_max: r.waveHeightMax,
    wave_period_avg: r.wavePeriodAvg,
    surface_pressure_avg: r.surfacePressureAvg,
    air_temperature_avg: r.airTemperatureAvg,
    humidity_avg: r.humidityAvg,
    salinity: r.salinity,
    tide_level_avg: r.tideLevelAvg,
    tide_level_min: r.tideLevelMin,
    tide_level_max: r.tideLevelMax,
    tidal_current_speed: r.tidalCurrentSpeed,
    tidal_current_direction: r.tidalCurrentDirection,
    data_source: r.dataSource,
    depth: r.depth,
  };
}

export async function bulkUpsertOceanDataDaily(
  records: OceanDataInput[]
): Promise<number> {
  if (!supabaseAdmin || records.length === 0) return 0;

  const dbRecords = records.map(toDbRecord);
  let totalUpserted = 0;
  const BATCH_SIZE = 500;

  for (let i = 0; i < dbRecords.length; i += BATCH_SIZE) {
    const batch = dbRecords.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabaseAdmin
      .from('ocean_data_daily')
      .upsert(batch, { onConflict: 'date', ignoreDuplicates: false })
      .select('id');

    if (error) {
      dbLogger.error('Error bulk upserting ocean data (admin):', error.message);
      continue;
    }
    totalUpserted += data?.length ?? batch.length;
  }

  return totalUpserted;
}

export async function updateOceanDataSalinity(
  date: string,
  salinity: number
): Promise<boolean> {
  if (!supabaseAdmin) return false;

  const { error } = await supabaseAdmin
    .from('ocean_data_daily')
    .update({ salinity })
    .eq('date', date);

  if (error) {
    dbLogger.error('Error updating ocean data salinity (admin):', error);
    return false;
  }
  return true;
}
