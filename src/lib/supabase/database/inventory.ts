/**
 * Inventory 관련 데이터베이스 함수
 * - Numbered Bottles, Inventory Batches, Transactions, Custom Products
 */

import { supabase, isSupabaseConfigured } from '../client';
import { dbLogger } from '@/lib/logger';
import {
  ProductType, InventoryStatus, NumberedBottle, InventoryBatch, InventoryTransaction,
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
  created_at: string;
  updated_at: string;
}

export interface DBInventoryBatch {
  id: string;
  product_id: string;
  available: number;
  reserved: number;
  sold: number;
  gifted: number;
  damaged: number;
  last_updated: string;
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
  batch: Omit<DBInventoryBatch, 'created_at' | 'last_updated'>
): Promise<DBInventoryBatch | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase!
    .from('inventory_batches')
    .insert(batch)
    .select()
    .single();

  if (error) {
    dbLogger.error('Error creating inventory batch:', error);
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
  };
}

export function mapDbBatchToBatch(dbBatch: DBInventoryBatch): InventoryBatch {
  return {
    id: dbBatch.id,
    productId: dbBatch.product_id as ProductType,
    available: dbBatch.available,
    reserved: dbBatch.reserved,
    sold: dbBatch.sold,
    gifted: dbBatch.gifted,
    damaged: dbBatch.damaged,
    lastUpdated: dbBatch.last_updated,
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
