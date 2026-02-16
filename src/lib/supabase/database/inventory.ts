/**
 * Inventory 관련 데이터베이스 함수
 * - Numbered Bottles, Inventory Batches, Transactions, Custom Products
 */

import { supabase, isSupabaseConfigured } from '../client';
import { dbLogger } from '@/lib/logger';
import {
  ProductType, InventoryStatus, NumberedBottle, InventoryBatch, InventoryTransaction, BottleUnit,
} from '@/lib/types';

// ═══════════════════════════════════════════════════════════════════════════
// 재고관리 DB 타입 정의
// ═══════════════════════════════════════════════════════════════════════════

export interface DBNumberedBottle {
  id: string;
  product_id: string;
  bottle_number: number;
  status: 'available' | 'reserved' | 'sold' | 'gifted' | 'damaged';
  reserved_for: string | null;
  sold_to: string | null;
  sold_date: string | null;
  price: number | null;
  notes: string | null;
  nfc_code: string | null;
  nfc_registered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DBInventoryBatch {
  id: string;
  product_id: string;
  total_quantity: number;
  available: number;
  reserved: number;
  sold: number;
  gifted: number;
  damaged: number;
  last_updated: string;
  created_at: string;
  immersion_date: string | null;
  retrieval_date: string | null;
  aging_depth: number | null;
}

export interface DBBottleUnit {
  id: string;
  product_id: string;
  nfc_code: string;
  serial_number: number | null;
  status: 'sold' | 'gifted';
  customer_name: string | null;
  sold_date: string | null;
  price: number | null;
  notes: string | null;
  nfc_registered_at: string | null;
  created_at: string;
}

export interface DBInventoryTransaction {
  id: string;
  product_id: string;
  bottle_number: number | null;
  type: 'sale' | 'reservation' | 'gift' | 'damage' | 'return' | 'cancel_reservation';
  quantity: number;
  customer_name: string | null;
  price: number | null;
  notes: string | null;
  created_at: string;
}

export interface DBCustomProduct {
  id: string;
  name: string;
  name_ko: string;
  year: number;
  size: string;
  total_quantity: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Numbered Bottles 관련 함수들
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchNumberedBottles(): Promise<DBNumberedBottle[] | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase!
    .from('numbered_bottles')
    .select('*')
    .order('bottle_number', { ascending: true });

  if (error) {
    dbLogger.error('Error fetching numbered bottles:', error);
    return null;
  }

  return data as DBNumberedBottle[];
}

export async function updateNumberedBottle(
  id: string,
  updates: Partial<Omit<DBNumberedBottle, 'id' | 'created_at' | 'updated_at'>>
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase!
    .from('numbered_bottles')
    .update(updates)
    .eq('id', id);

  if (error) {
    dbLogger.error('Error updating numbered bottle:', error);
    return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// Inventory Batches 관련 함수들
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchInventoryBatches(): Promise<DBInventoryBatch[] | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase!
    .from('inventory_batches')
    .select('*');

  if (error) {
    dbLogger.error('Error fetching inventory batches:', error);
    return null;
  }

  return data as DBInventoryBatch[];
}

export async function updateInventoryBatch(
  productId: string,
  updates: Partial<Omit<DBInventoryBatch, 'id' | 'product_id' | 'created_at' | 'last_updated'>>
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase!
    .from('inventory_batches')
    .update(updates)
    .eq('product_id', productId);

  if (error) {
    dbLogger.error('Error updating inventory batch:', error);
    return false;
  }

  return true;
}

export async function createInventoryBatch(
  batch: Omit<DBInventoryBatch, 'created_at' | 'last_updated' | 'immersion_date' | 'retrieval_date' | 'aging_depth'> & {
    immersion_date?: string | null;
    retrieval_date?: string | null;
    aging_depth?: number | null;
  }
): Promise<DBInventoryBatch | null> {
  if (!isSupabaseConfigured()) return null;

  // 먼저 존재 여부 확인
  const { data: existing } = await supabase!
    .from('inventory_batches')
    .select('id')
    .eq('product_id', batch.product_id)
    .single();

  // 이미 존재하면 업데이트
  if (existing) {
    const { data, error } = await supabase!
      .from('inventory_batches')
      .update({
        total_quantity: batch.total_quantity,
        available: batch.available,
        reserved: batch.reserved,
        sold: batch.sold,
        gifted: batch.gifted,
        damaged: batch.damaged,
      })
      .eq('product_id', batch.product_id)
      .select()
      .single();

    if (error) {
      dbLogger.error('Error updating inventory batch:', error.message);
      return null;
    }
    return data as DBInventoryBatch;
  }

  // 존재하지 않으면 생성
  const { data, error } = await supabase!
    .from('inventory_batches')
    .insert(batch)
    .select()
    .single();

  if (error) {
    dbLogger.error('Error creating inventory batch:', error.message);
    return null;
  }

  return data as DBInventoryBatch;
}

export async function deleteInventoryBatch(productId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase!
    .from('inventory_batches')
    .delete()
    .eq('product_id', productId);

  if (error) {
    dbLogger.error('Error deleting inventory batch:', error);
    return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// Inventory Transactions 관련 함수들
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchInventoryTransactions(limit?: number): Promise<DBInventoryTransaction[] | null> {
  if (!isSupabaseConfigured()) return null;

  let query = supabase!
    .from('inventory_transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    dbLogger.error('Error fetching inventory transactions:', error);
    return null;
  }

  return data as DBInventoryTransaction[];
}

export async function createInventoryTransaction(
  transaction: Omit<DBInventoryTransaction, 'created_at'>
): Promise<DBInventoryTransaction | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase!
    .from('inventory_transactions')
    .insert(transaction)
    .select()
    .single();

  if (error) {
    dbLogger.error('Error creating inventory transaction:', error);
    return null;
  }

  return data as DBInventoryTransaction;
}

// ═══════════════════════════════════════════════════════════════════════════
// Custom Products 관련 함수들
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchCustomProducts(): Promise<DBCustomProduct[] | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase!
    .from('custom_products')
    .select('*')
    .order('year', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    dbLogger.error('Error fetching custom products:', error);
    return null;
  }

  return data as DBCustomProduct[];
}

export async function createCustomProduct(
  product: Omit<DBCustomProduct, 'created_at' | 'updated_at'>
): Promise<DBCustomProduct | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase!
    .from('custom_products')
    .insert(product)
    .select()
    .single();

  if (error) {
    dbLogger.error('Error creating custom product:', error);
    return null;
  }

  return data as DBCustomProduct;
}

export async function deleteCustomProduct(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase!
    .from('custom_products')
    .delete()
    .eq('id', id);

  if (error) {
    dbLogger.error('Error deleting custom product:', error);
    return false;
  }

  return true;
}

export async function updateCustomProduct(
  id: string,
  updates: Partial<Omit<DBCustomProduct, 'id' | 'created_at' | 'updated_at'>>
): Promise<DBCustomProduct | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase!
    .from('custom_products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    dbLogger.error('Error updating custom product:', error);
    return null;
  }

  return data as DBCustomProduct;
}

// ═══════════════════════════════════════════════════════════════════════════
// Inventory Transaction 수정/삭제 함수
// ═══════════════════════════════════════════════════════════════════════════

export async function updateInventoryTransaction(
  id: string,
  updates: Partial<Omit<DBInventoryTransaction, 'id' | 'created_at'>>
): Promise<DBInventoryTransaction | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase!
    .from('inventory_transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    dbLogger.error('Error updating inventory transaction:', error);
    return null;
  }

  return data as DBInventoryTransaction;
}

export async function deleteInventoryTransaction(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase!
    .from('inventory_transactions')
    .delete()
    .eq('id', id);

  if (error) {
    dbLogger.error('Error deleting inventory transaction:', error);
    return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// 재고 데이터 매핑 헬퍼
// ═══════════════════════════════════════════════════════════════════════════

export function mapDbBottleToBottle(dbBottle: DBNumberedBottle): NumberedBottle {
  // gifted 상태일 때는 sold_to 필드를 giftedTo로 매핑
  const isGifted = dbBottle.status === 'gifted';

  return {
    id: dbBottle.id,
    productId: dbBottle.product_id as ProductType,
    bottleNumber: dbBottle.bottle_number,
    status: dbBottle.status as InventoryStatus,
    reservedFor: dbBottle.reserved_for || undefined,
    soldTo: isGifted ? undefined : (dbBottle.sold_to || undefined),
    giftedTo: isGifted ? (dbBottle.sold_to || undefined) : undefined,
    soldDate: dbBottle.sold_date || undefined,
    price: dbBottle.price || undefined,
    notes: dbBottle.notes || undefined,
    nfcCode: dbBottle.nfc_code || undefined,
    nfcRegisteredAt: dbBottle.nfc_registered_at || undefined,
  };
}

export function mapDbBatchToBatch(dbBatch: DBInventoryBatch): InventoryBatch {
  return {
    id: dbBatch.id,
    productId: dbBatch.product_id as ProductType,
    totalQuantity: dbBatch.total_quantity,
    available: dbBatch.available,
    reserved: dbBatch.reserved,
    sold: dbBatch.sold,
    gifted: dbBatch.gifted,
    damaged: dbBatch.damaged,
    lastUpdated: dbBatch.last_updated,
    immersionDate: dbBatch.immersion_date || undefined,
    retrievalDate: dbBatch.retrieval_date || undefined,
    agingDepth: dbBatch.aging_depth || undefined,
  };
}

export function mapDbBottleUnitToBottleUnit(dbUnit: DBBottleUnit): BottleUnit {
  return {
    id: dbUnit.id,
    productId: dbUnit.product_id,
    nfcCode: dbUnit.nfc_code,
    serialNumber: dbUnit.serial_number || undefined,
    status: dbUnit.status,
    customerName: dbUnit.customer_name || undefined,
    soldDate: dbUnit.sold_date || undefined,
    price: dbUnit.price || undefined,
    notes: dbUnit.notes || undefined,
    nfcRegisteredAt: dbUnit.nfc_registered_at || undefined,
    createdAt: dbUnit.created_at,
  };
}

export function mapDbTransactionToTransaction(dbTx: DBInventoryTransaction): InventoryTransaction {
  return {
    id: dbTx.id,
    productId: dbTx.product_id as ProductType,
    bottleNumber: dbTx.bottle_number || undefined,
    type: dbTx.type as InventoryTransaction['type'],
    quantity: dbTx.quantity,
    customerName: dbTx.customer_name || undefined,
    price: dbTx.price || undefined,
    notes: dbTx.notes || undefined,
    createdAt: dbTx.created_at,
  };
}

export function mapDbCustomProductToProduct(dbProduct: DBCustomProduct) {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    nameKo: dbProduct.name_ko,
    year: dbProduct.year,
    size: dbProduct.size,
    totalQuantity: dbProduct.total_quantity,
    description: dbProduct.description || undefined,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// NFC 코드 생성 + Bottle Unit CRUD
// ═══════════════════════════════════════════════════════════════════════════

const NFC_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

function generateRandomNfcCode(): string {
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += NFC_CODE_CHARS[Math.floor(Math.random() * NFC_CODE_CHARS.length)];
  }
  return code;
}

export async function generateUniqueNfcCode(): Promise<string | null> {
  if (!isSupabaseConfigured()) return generateRandomNfcCode();

  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateRandomNfcCode();

    // numbered_bottles와 bottle_units 양쪽에서 중복 확인
    const [{ data: nb }, { data: bu }] = await Promise.all([
      supabase!.from('numbered_bottles').select('id').eq('nfc_code', code).maybeSingle(),
      supabase!.from('bottle_units').select('id').eq('nfc_code', code).maybeSingle(),
    ]);

    if (!nb && !bu) return code;
  }

  dbLogger.error('NFC 코드 생성 실패: 10회 시도 후 유니크 코드 확보 불가');
  return null;
}

export async function createBottleUnit(
  unit: Omit<DBBottleUnit, 'nfc_registered_at' | 'created_at'>
): Promise<DBBottleUnit | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase!
    .from('bottle_units')
    .insert(unit)
    .select()
    .single();

  if (error) {
    dbLogger.error('Error creating bottle unit:', error);
    return null;
  }

  return data as DBBottleUnit;
}

export async function fetchBottleByNfcCode(
  code: string
): Promise<{ type: 'numbered' | 'unit'; data: DBNumberedBottle | DBBottleUnit } | null> {
  if (!isSupabaseConfigured()) return null;

  // numbered_bottles에서 먼저 조회
  const { data: nb } = await supabase!
    .from('numbered_bottles')
    .select('*')
    .eq('nfc_code', code)
    .maybeSingle();

  if (nb) return { type: 'numbered', data: nb as DBNumberedBottle };

  // bottle_units에서 조회
  const { data: bu } = await supabase!
    .from('bottle_units')
    .select('*')
    .eq('nfc_code', code)
    .maybeSingle();

  if (bu) return { type: 'unit', data: bu as DBBottleUnit };

  return null;
}

export async function updateBatchAgingDates(
  productId: string,
  immersionDate: string | null,
  retrievalDate: string | null,
  agingDepth?: number
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const updates: Record<string, unknown> = {
    immersion_date: immersionDate,
    retrieval_date: retrievalDate,
  };
  if (agingDepth !== undefined) {
    updates.aging_depth = agingDepth;
  }

  const { error } = await supabase!
    .from('inventory_batches')
    .update(updates)
    .eq('product_id', productId);

  if (error) {
    dbLogger.error('Error updating batch aging dates:', error.message, error.code, error.details, error.hint);
    return false;
  }

  return true;
}

export async function updateNumberedBottleNfc(
  bottleId: string,
  nfcCode: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase!
    .from('numbered_bottles')
    .update({ nfc_code: nfcCode, nfc_registered_at: new Date().toISOString() })
    .eq('id', bottleId);

  if (error) {
    dbLogger.error('Error updating numbered bottle NFC:', error);
    return false;
  }

  return true;
}
