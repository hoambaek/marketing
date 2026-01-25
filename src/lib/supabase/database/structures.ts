/**
 * Structures 관련 데이터베이스 함수
 * - 해저숙성 구조물 및 적재 아이템 관리
 */

import { supabase, isSupabaseConfigured } from '../client';
import { dbLogger } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════════════════
// 구조물 DB 타입 정의
// ═══════════════════════════════════════════════════════════════════════════

export interface DBStructure {
  id: string;
  year: number;
  name: string;
  capacity: number;
  max_weight: number;
  structure_weight: number;
  is_slot_only: boolean;
  slot_only_type: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DBStructureItem {
  id: string;
  structure_id: string;
  name: string;
  volume: string | null;
  weight: number;
  quantity: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// App 타입 정의
export interface Structure {
  id: string;
  year: number;
  name: string;
  capacity: number;
  maxWeight: number;
  structureWeight: number;
  isSlotOnly: boolean;
  slotOnlyType: string | null;
  items: StructureItem[];
}

export interface StructureItem {
  id: string;
  name: string;
  volume: string;
  weight: number;
  quantity: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// 매핑 함수
// ═══════════════════════════════════════════════════════════════════════════

export function mapDbStructureToStructure(dbStructure: DBStructure, items: DBStructureItem[]): Structure {
  return {
    id: dbStructure.id,
    year: dbStructure.year,
    name: dbStructure.name,
    capacity: dbStructure.capacity,
    maxWeight: dbStructure.max_weight,
    structureWeight: dbStructure.structure_weight,
    isSlotOnly: dbStructure.is_slot_only,
    slotOnlyType: dbStructure.slot_only_type,
    items: items
      .filter(item => item.structure_id === dbStructure.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(item => ({
        id: item.id,
        name: item.name,
        volume: item.volume || '',
        weight: item.weight,
        quantity: item.quantity,
      })),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Structures 관련 함수들
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchStructuresByYear(year: number): Promise<Structure[] | null> {
  if (!isSupabaseConfigured()) return null;

  // 구조물 가져오기
  const { data: structures, error: structuresError } = await supabase!
    .from('structures')
    .select('*')
    .eq('year', year)
    .order('sort_order', { ascending: true });

  if (structuresError) {
    dbLogger.error('Error fetching structures:', structuresError);
    return null;
  }

  if (!structures || structures.length === 0) {
    return [];
  }

  // 구조물 ID 목록
  const structureIds = structures.map(s => s.id);

  // 아이템 가져오기
  const { data: items, error: itemsError } = await supabase!
    .from('structure_items')
    .select('*')
    .in('structure_id', structureIds)
    .order('sort_order', { ascending: true });

  if (itemsError) {
    dbLogger.error('Error fetching structure items:', itemsError);
    return null;
  }

  // 매핑
  return structures.map(s => mapDbStructureToStructure(s, items || []));
}

export async function createStructure(
  year: number,
  name: string,
  capacity: number = 250,
  maxWeight: number = 500,
  structureWeight: number = 150
): Promise<DBStructure | null> {
  if (!isSupabaseConfigured()) return null;

  // 현재 최대 sort_order 가져오기
  const { data: existing } = await supabase!
    .from('structures')
    .select('sort_order')
    .eq('year', year)
    .order('sort_order', { ascending: false })
    .limit(1);

  const sortOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 1;

  const { data, error } = await supabase!
    .from('structures')
    .insert({
      year,
      name,
      capacity,
      max_weight: maxWeight,
      structure_weight: structureWeight,
      sort_order: sortOrder,
    })
    .select()
    .single();

  if (error) {
    dbLogger.error('Error creating structure:', error);
    return null;
  }

  return data;
}

export async function updateStructure(
  id: string,
  updates: {
    name?: string;
    capacity?: number;
    maxWeight?: number;
    structureWeight?: number;
    isSlotOnly?: boolean;
    slotOnlyType?: string | null;
  }
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const dbUpdates: Partial<DBStructure> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.capacity !== undefined) dbUpdates.capacity = updates.capacity;
  if (updates.maxWeight !== undefined) dbUpdates.max_weight = updates.maxWeight;
  if (updates.structureWeight !== undefined) dbUpdates.structure_weight = updates.structureWeight;
  if (updates.isSlotOnly !== undefined) dbUpdates.is_slot_only = updates.isSlotOnly;
  if (updates.slotOnlyType !== undefined) dbUpdates.slot_only_type = updates.slotOnlyType;

  const { error } = await supabase!
    .from('structures')
    .update(dbUpdates)
    .eq('id', id);

  if (error) {
    dbLogger.error('Error updating structure:', error);
    return false;
  }

  return true;
}

export async function deleteStructure(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase!
    .from('structures')
    .delete()
    .eq('id', id);

  if (error) {
    dbLogger.error('Error deleting structure:', error);
    return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// Structure Items 관련 함수들
// ═══════════════════════════════════════════════════════════════════════════

export async function createStructureItem(
  structureId: string,
  name: string,
  volume: string = '',
  weight: number = 0,
  quantity: number = 1
): Promise<DBStructureItem | null> {
  if (!isSupabaseConfigured()) return null;

  // 현재 최대 sort_order 가져오기
  const { data: existing } = await supabase!
    .from('structure_items')
    .select('sort_order')
    .eq('structure_id', structureId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const sortOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 1;

  const { data, error } = await supabase!
    .from('structure_items')
    .insert({
      structure_id: structureId,
      name,
      volume,
      weight,
      quantity,
      sort_order: sortOrder,
    })
    .select()
    .single();

  if (error) {
    dbLogger.error('Error creating structure item:', error);
    return null;
  }

  return data;
}

export async function updateStructureItem(
  id: string,
  updates: {
    name?: string;
    volume?: string;
    weight?: number;
    quantity?: number;
  }
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase!
    .from('structure_items')
    .update(updates)
    .eq('id', id);

  if (error) {
    dbLogger.error('Error updating structure item:', error);
    return false;
  }

  return true;
}

export async function deleteStructureItem(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase!
    .from('structure_items')
    .delete()
    .eq('id', id);

  if (error) {
    dbLogger.error('Error deleting structure item:', error);
    return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// 벌크 저장 함수 (전체 구조물 데이터 저장)
// ═══════════════════════════════════════════════════════════════════════════

export async function saveStructuresForYear(
  year: number,
  structures: Structure[]
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    dbLogger.warn('Supabase not configured, skipping save');
    return false;
  }

  dbLogger.log(`Saving ${structures.length} structures for year ${year}`);

  try {
    // 1. 기존 구조물 삭제 (cascade로 아이템도 삭제됨)
    const { error: deleteError } = await supabase!
      .from('structures')
      .delete()
      .eq('year', year);

    if (deleteError) {
      dbLogger.error('Error deleting existing structures:', JSON.stringify(deleteError, null, 2));
      dbLogger.error('Delete error details:', deleteError.message, deleteError.code, deleteError.details);
      return false;
    }

    dbLogger.log('Existing structures deleted successfully');

    if (structures.length === 0) {
      return true;
    }

    // 2. 새 구조물 삽입 (항상 새 UUID 생성)
    const structuresToInsert = structures.map((s, idx) => ({
      year,
      name: s.name,
      capacity: s.capacity,
      max_weight: s.maxWeight,
      structure_weight: s.structureWeight,
      is_slot_only: s.isSlotOnly || false,
      slot_only_type: s.slotOnlyType || null,
      sort_order: idx + 1,
    }));

    dbLogger.log('Inserting structures:', JSON.stringify(structuresToInsert, null, 2));

    const { data: insertedStructures, error: insertError } = await supabase!
      .from('structures')
      .insert(structuresToInsert)
      .select();

    if (insertError) {
      dbLogger.error('Error inserting structures:', JSON.stringify(insertError, null, 2));
      dbLogger.error('Insert error details:', insertError.message, insertError.code, insertError.details);
      return false;
    }

    // 3. 아이템 삽입
    const itemsToInsert: Array<{
      structure_id: string;
      name: string;
      volume: string;
      weight: number;
      quantity: number;
      sort_order: number;
    }> = [];

    structures.forEach((s, sIdx) => {
      const insertedStructure = insertedStructures?.find(
        (is) => is.name === s.name && is.sort_order === sIdx + 1
      );
      const structureId = insertedStructure?.id || s.id;

      s.items.forEach((item, iIdx) => {
        itemsToInsert.push({
          structure_id: structureId,
          name: item.name,
          volume: item.volume || '',
          weight: item.weight,
          quantity: item.quantity,
          sort_order: iIdx + 1,
        });
      });
    });

    if (itemsToInsert.length > 0) {
      const { error: itemsError } = await supabase!
        .from('structure_items')
        .insert(itemsToInsert);

      if (itemsError) {
        dbLogger.error('Error inserting structure items:', itemsError);
        return false;
      }
    }

    return true;
  } catch (error) {
    dbLogger.error('Error saving structures:', error);
    return false;
  }
}
