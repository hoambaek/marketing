import { supabase, isSupabaseConfigured } from './client';
import {
  Task, MustDoItem, KPIItem, ContentItem, TaskStatus,
  ProductType, InventoryStatus, NumberedBottle, InventoryBatch, InventoryTransaction
} from '@/lib/types';

// ═══════════════════════════════════════════════════════════════════════════
// Task 관련 함수들
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchTasks(year?: number): Promise<Task[] | null> {
  if (!isSupabaseConfigured()) return null;

  let query = supabase!
    .from('tasks')
    .select('*');

  if (year) {
    query = query.eq('year', year);
  }

  const { data, error } = await query
    .order('year', { ascending: true })
    .order('month', { ascending: true })
    .order('week', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching tasks:', error);
    return null;
  }

  return data?.map(mapDbTaskToTask) || [];
}

export async function createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task | null> {
  if (!isSupabaseConfigured()) return null;

  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const { data, error } = await supabase!
    .from('tasks')
    .insert({
      id,
      title: task.title,
      description: task.description,
      year: task.year,
      month: task.month,
      week: task.week,
      category: task.category,
      status: task.status,
      assignee: task.assignee,
      due_date: task.dueDate,
      deliverables: task.deliverables,
      notes: task.notes,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating task:', error);
    return null;
  }

  return mapDbTaskToTask(data);
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const dbUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.year !== undefined) dbUpdates.year = updates.year;
  if (updates.month !== undefined) dbUpdates.month = updates.month;
  if (updates.week !== undefined) dbUpdates.week = updates.week;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.assignee !== undefined) dbUpdates.assignee = updates.assignee;
  if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
  if (updates.deliverables !== undefined) dbUpdates.deliverables = updates.deliverables;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

  const { error } = await supabase!
    .from('tasks')
    .update(dbUpdates)
    .eq('id', id);

  if (error) {
    console.error('Error updating task:', error);
    return false;
  }

  return true;
}

export async function deleteTask(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase!
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting task:', error);
    return false;
  }

  return true;
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<boolean> {
  return updateTask(id, { status });
}

// ═══════════════════════════════════════════════════════════════════════════
// Must-Do 관련 함수들
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchMustDoItems(year?: number): Promise<MustDoItem[] | null> {
  if (!isSupabaseConfigured()) return null;

  let query = supabase!
    .from('must_do_items')
    .select('*');

  if (year) {
    query = query.eq('year', year);
  }

  const { data, error } = await query
    .order('year', { ascending: true })
    .order('month', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching must-do items:', error);
    return null;
  }

  return data?.map(mapDbMustDoToMustDo) || [];
}

export async function createMustDoItem(item: Omit<MustDoItem, 'id'>): Promise<MustDoItem | null> {
  if (!isSupabaseConfigured()) return null;

  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const { data, error } = await supabase!
    .from('must_do_items')
    .insert({
      id,
      year: item.year,
      month: item.month,
      title: item.title,
      done: item.done,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating must-do item:', error);
    return null;
  }

  return mapDbMustDoToMustDo(data);
}

export async function toggleMustDo(id: string, done: boolean): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase!
    .from('must_do_items')
    .update({ done })
    .eq('id', id);

  if (error) {
    console.error('Error toggling must-do:', error);
    return false;
  }

  return true;
}

export async function updateMustDoItem(id: string, updates: Partial<MustDoItem>): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const dbUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.year !== undefined) dbUpdates.year = updates.year;
  if (updates.month !== undefined) dbUpdates.month = updates.month;
  if (updates.done !== undefined) dbUpdates.done = updates.done;

  const { error } = await supabase!
    .from('must_do_items')
    .update(dbUpdates)
    .eq('id', id);

  if (error) {
    console.error('Error updating must-do item:', error);
    return false;
  }

  return true;
}

export async function deleteMustDoItem(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase!
    .from('must_do_items')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting must-do item:', error);
    return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// KPI 관련 함수들
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchKPIItems(year?: number): Promise<KPIItem[] | null> {
  if (!isSupabaseConfigured()) return null;

  let query = supabase!
    .from('kpi_items')
    .select('*');

  if (year) {
    query = query.eq('year', year);
  }

  const { data, error } = await query
    .order('year', { ascending: true })
    .order('month', { ascending: true });

  if (error) {
    console.error('Error fetching KPI items:', error);
    return null;
  }

  return data?.map(mapDbKPIToKPI) || [];
}

export async function updateKPI(id: string, current: number): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase!
    .from('kpi_items')
    .update({ current_value: current })
    .eq('id', id);

  if (error) {
    console.error('Error updating KPI:', error);
    return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// Content 관련 함수들
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchContentItems(year?: number): Promise<ContentItem[] | null> {
  if (!isSupabaseConfigured()) return null;

  let query = supabase!
    .from('content_items')
    .select('*');

  if (year) {
    query = query.eq('year', year);
  }

  const { data, error } = await query
    .order('year', { ascending: true })
    .order('scheduled_date', { ascending: true });

  if (error) {
    console.error('Error fetching content items:', error);
    return null;
  }

  return data?.map(mapDbContentToContent) || [];
}

export async function createContentItem(item: Omit<ContentItem, 'id'>): Promise<ContentItem | null> {
  if (!isSupabaseConfigured()) return null;

  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const { data, error } = await supabase!
    .from('content_items')
    .insert({
      id,
      year: item.year,
      type: item.type,
      title: item.title,
      description: item.description,
      scheduled_date: item.date,
      status: item.status,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating content item:', error);
    return null;
  }

  return mapDbContentToContent(data);
}

export async function updateContentItem(id: string, updates: Partial<ContentItem>): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const dbUpdates: Record<string, unknown> = {};
  if (updates.year !== undefined) dbUpdates.year = updates.year;
  if (updates.type !== undefined) dbUpdates.type = updates.type;
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.date !== undefined) dbUpdates.scheduled_date = updates.date;
  if (updates.status !== undefined) dbUpdates.status = updates.status;

  const { error } = await supabase!
    .from('content_items')
    .update(dbUpdates)
    .eq('id', id);

  if (error) {
    console.error('Error updating content item:', error);
    return false;
  }

  return true;
}

export async function deleteContentItem(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase!
    .from('content_items')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting content item:', error);
    return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// 초기 데이터 시드
// ═══════════════════════════════════════════════════════════════════════════

export async function seedInitialData(
  tasks: Task[],
  mustDoItems: MustDoItem[],
  kpiItems: KPIItem[],
  contentItems: ContentItem[]
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    // 기존 데이터 확인
    const { count: taskCount } = await supabase!
      .from('tasks')
      .select('*', { count: 'exact', head: true });

    // 데이터가 이미 있으면 시드하지 않음
    if (taskCount && taskCount > 0) {
      console.log('Data already exists, skipping seed');
      return true;
    }

    // Tasks 시드
    const tasksToInsert = tasks.map((task, index) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      year: task.year,
      month: task.month,
      week: task.week,
      category: task.category,
      status: task.status,
      assignee: task.assignee,
      due_date: task.dueDate,
      deliverables: task.deliverables,
      notes: task.notes,
      sort_order: index,
    }));

    await supabase!.from('tasks').insert(tasksToInsert);

    // Must-Do Items 시드
    const mustDoToInsert = mustDoItems.map((item, index) => ({
      id: item.id,
      year: item.year,
      month: item.month,
      title: item.title,
      done: item.done,
      sort_order: index,
    }));

    await supabase!.from('must_do_items').insert(mustDoToInsert);

    // KPI Items 시드
    const kpiToInsert = kpiItems.map((item) => ({
      id: item.id,
      year: item.year,
      month: item.month,
      category: item.category,
      metric: item.metric,
      current_value: item.current,
      target_value: item.target,
    }));

    await supabase!.from('kpi_items').insert(kpiToInsert);

    // Content Items 시드
    const contentToInsert = contentItems.map((item, index) => ({
      id: item.id,
      year: item.year,
      type: item.type,
      title: item.title,
      description: item.description,
      scheduled_date: item.date,
      status: item.status,
      sort_order: index,
    }));

    await supabase!.from('content_items').insert(contentToInsert);

    console.log('Initial data seeded successfully');
    return true;
  } catch (error) {
    console.error('Error seeding initial data:', error);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 헬퍼 함수들 (DB 필드명 ↔ 앱 필드명 변환)
// ═══════════════════════════════════════════════════════════════════════════

function mapDbTaskToTask(dbTask: Record<string, unknown>): Task {
  return {
    id: dbTask.id as string,
    title: dbTask.title as string,
    description: dbTask.description as string | undefined,
    year: dbTask.year as number,
    month: dbTask.month as number,
    week: dbTask.week as number,
    category: dbTask.category as Task['category'],
    status: dbTask.status as Task['status'],
    assignee: dbTask.assignee as string | undefined,
    dueDate: dbTask.due_date as string | undefined,
    deliverables: dbTask.deliverables as string[] | undefined,
    notes: dbTask.notes as string | undefined,
    createdAt: dbTask.created_at as string,
    updatedAt: dbTask.updated_at as string,
  };
}

function mapDbMustDoToMustDo(dbMustDo: Record<string, unknown>): MustDoItem {
  return {
    id: dbMustDo.id as string,
    year: dbMustDo.year as number,
    month: dbMustDo.month as number,
    title: dbMustDo.title as string,
    done: dbMustDo.done as boolean,
  };
}

function mapDbKPIToKPI(dbKPI: Record<string, unknown>): KPIItem {
  return {
    id: dbKPI.id as string,
    year: dbKPI.year as number,
    month: dbKPI.month as number,
    category: dbKPI.category as KPIItem['category'],
    metric: dbKPI.metric as string,
    current: Number(dbKPI.current_value),
    target: Number(dbKPI.target_value),
  };
}

function mapDbContentToContent(dbContent: Record<string, unknown>): ContentItem {
  return {
    id: dbContent.id as string,
    year: dbContent.year as number,
    type: dbContent.type as ContentItem['type'],
    title: dbContent.title as string,
    description: dbContent.description as string | undefined,
    date: dbContent.scheduled_date as string,
    status: dbContent.status as ContentItem['status'],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 재고관리 타입 정의
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
    console.error('Error fetching numbered bottles:', error);
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
    console.error('Error updating numbered bottle:', error);
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
    console.error('Error fetching inventory batches:', error);
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
    console.error('Error updating inventory batch:', error);
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
    console.error('Error creating inventory batch:', error);
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
    console.error('Error deleting inventory batch:', error);
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
    console.error('Error fetching inventory transactions:', error);
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
    console.error('Error creating inventory transaction:', error);
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
    console.error('Error fetching custom products:', error);
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
    console.error('Error creating custom product:', error);
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
    console.error('Error deleting custom product:', error);
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
