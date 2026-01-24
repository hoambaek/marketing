/**
 * Ocean Data 관련 데이터베이스 함수
 * - Ocean Data Daily, Salinity Records
 */

import { supabase, isSupabaseConfigured } from '../client';
import { dbLogger } from '@/lib/logger';
import { OceanDataDaily, SalinityRecord } from '@/lib/types';

// ═══════════════════════════════════════════════════════════════════════════
// Ocean Data DB 타입
// ═══════════════════════════════════════════════════════════════════════════

interface DBOceanDataDaily {
  id: string;
  date: string;
  sea_temperature_avg: number | null;
  sea_temperature_min: number | null;
  sea_temperature_max: number | null;
  current_velocity_avg: number | null;
  current_direction_dominant: number | null;
  wave_height_avg: number | null;
  wave_height_max: number | null;
  wave_period_avg: number | null;
  surface_pressure_avg: number | null;
  air_temperature_avg: number | null;
  humidity_avg: number | null;
  salinity: number | null;
  depth: number;
  location_name: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
}

interface DBSalinityRecord {
  id: string;
  measured_at: string;
  salinity: number;
  depth: number | null;
  notes: string | null;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Ocean Data Daily CRUD
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchOceanDataDaily(
  startDate?: string,
  endDate?: string
): Promise<OceanDataDaily[] | null> {
  if (!isSupabaseConfigured()) return null;

  let query = supabase!
    .from('ocean_data_daily')
    .select('*');

  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data, error } = await query.order('date', { ascending: false });

  if (error) {
    dbLogger.error('Error fetching ocean data:', error);
    return null;
  }

  return data?.map(mapDbOceanDataToOceanData) || [];
}

export async function fetchOceanDataByDate(date: string): Promise<OceanDataDaily | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase!
    .from('ocean_data_daily')
    .select('*')
    .eq('date', date)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    dbLogger.error('Error fetching ocean data by date:', error);
    return null;
  }

  return mapDbOceanDataToOceanData(data);
}

export async function upsertOceanDataDaily(
  oceanData: Omit<OceanDataDaily, 'id' | 'createdAt' | 'updatedAt'>
): Promise<OceanDataDaily | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase!
    .from('ocean_data_daily')
    .upsert({
      date: oceanData.date,
      sea_temperature_avg: oceanData.seaTemperatureAvg,
      sea_temperature_min: oceanData.seaTemperatureMin,
      sea_temperature_max: oceanData.seaTemperatureMax,
      current_velocity_avg: oceanData.currentVelocityAvg,
      current_direction_dominant: oceanData.currentDirectionDominant,
      wave_height_avg: oceanData.waveHeightAvg,
      wave_height_max: oceanData.waveHeightMax,
      surface_pressure_avg: oceanData.surfacePressureAvg,
      air_temperature_avg: oceanData.airTemperatureAvg,
      humidity_avg: oceanData.humidityAvg,
      salinity: oceanData.salinity,
      depth: oceanData.depth,
    }, {
      onConflict: 'date',
    })
    .select()
    .single();

  if (error) {
    dbLogger.error('Error upserting ocean data:', JSON.stringify(error, null, 2), 'Code:', error.code, 'Message:', error.message);
    return null;
  }

  return mapDbOceanDataToOceanData(data);
}

export async function updateOceanDataSalinity(
  date: string,
  salinity: number
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase!
    .from('ocean_data_daily')
    .update({ salinity })
    .eq('date', date);

  if (error) {
    dbLogger.error('Error updating ocean data salinity:', error);
    return false;
  }

  return true;
}

export async function deleteOceanDataDaily(date: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase!
    .from('ocean_data_daily')
    .delete()
    .eq('date', date);

  if (error) {
    dbLogger.error('Error deleting ocean data:', error);
    return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// Salinity Records CRUD
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchSalinityRecords(
  limit: number = 50
): Promise<SalinityRecord[] | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase!
    .from('salinity_records')
    .select('*')
    .order('measured_at', { ascending: false })
    .limit(limit);

  if (error) {
    dbLogger.error('Error fetching salinity records:', error);
    return null;
  }

  return data?.map(mapDbSalinityToSalinity) || [];
}

export async function createSalinityRecord(
  record: Omit<SalinityRecord, 'id' | 'createdAt'>
): Promise<SalinityRecord | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase!
    .from('salinity_records')
    .insert({
      measured_at: record.measuredAt,
      salinity: record.salinity,
      depth: record.depth,
      notes: record.notes,
    })
    .select()
    .single();

  if (error) {
    dbLogger.error('Error creating salinity record:', error);
    return null;
  }

  return mapDbSalinityToSalinity(data);
}

export async function deleteSalinityRecord(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase!
    .from('salinity_records')
    .delete()
    .eq('id', id);

  if (error) {
    dbLogger.error('Error deleting salinity record:', error);
    return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// 매핑 헬퍼
// ═══════════════════════════════════════════════════════════════════════════

function mapDbOceanDataToOceanData(db: DBOceanDataDaily): OceanDataDaily {
  return {
    id: db.id,
    date: db.date,
    seaTemperatureAvg: db.sea_temperature_avg,
    seaTemperatureMin: db.sea_temperature_min,
    seaTemperatureMax: db.sea_temperature_max,
    currentVelocityAvg: db.current_velocity_avg,
    currentDirectionDominant: db.current_direction_dominant,
    waveHeightAvg: db.wave_height_avg,
    waveHeightMax: db.wave_height_max,
    surfacePressureAvg: db.surface_pressure_avg,
    airTemperatureAvg: db.air_temperature_avg,
    humidityAvg: db.humidity_avg,
    salinity: db.salinity,
    depth: db.depth,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function mapDbSalinityToSalinity(db: DBSalinityRecord): SalinityRecord {
  return {
    id: db.id,
    measuredAt: db.measured_at,
    salinity: db.salinity,
    depth: db.depth,
    notes: db.notes,
    createdAt: db.created_at,
  };
}
