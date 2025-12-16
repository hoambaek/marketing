import { supabase, isSupabaseConfigured } from './client';
import {
  Task, MustDoItem, KPIItem, ContentItem, TaskStatus,
  ProductType, InventoryStatus, NumberedBottle, InventoryBatch, InventoryTransaction,
  BudgetItem, ExpenseItem, BudgetCategory,
  IssueItem, IssueType, IssuePriority, IssueImpact, IssueStatus,
  OceanDataDaily, SalinityRecord,
  CostCalculatorSettings, CostCalculatorChampagneType
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
      category: item.category,
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
  if (updates.category !== undefined) dbUpdates.category = updates.category;

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
    category: (dbMustDo.category as MustDoItem['category']) || 'operation',
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

// ═══════════════════════════════════════════════════════════════════════════
// 예산관리 DB 타입
// ═══════════════════════════════════════════════════════════════════════════

export interface DBBudgetItem {
  id: string;
  year: number;
  month: number;
  category: string;
  budgeted: number;
  spent: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface DBExpenseItem {
  id: string;
  year: number;
  month: number;
  category: string;
  amount: number;
  description: string;
  vendor: string | null;
  expense_date: string;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Budget Items 관련 함수들
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchBudgetItems(year?: number): Promise<BudgetItem[] | null> {
  if (!isSupabaseConfigured()) return null;

  let query = supabase!
    .from('budget_items')
    .select('*');

  if (year) {
    query = query.eq('year', year);
  }

  const { data, error } = await query
    .order('year', { ascending: true })
    .order('month', { ascending: true })
    .order('category', { ascending: true });

  if (error) {
    console.error('Error fetching budget items:', error);
    return null;
  }

  return data?.map(mapDbBudgetToBudget) || [];
}

export async function createBudgetItem(item: Omit<BudgetItem, 'id'>): Promise<BudgetItem | null> {
  if (!isSupabaseConfigured()) return null;

  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const { data, error } = await supabase!
    .from('budget_items')
    .insert({
      id,
      year: item.year,
      month: item.month,
      category: item.category,
      budgeted: item.budgeted,
      spent: item.spent,
      description: item.description,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating budget item:', error);
    return null;
  }

  return mapDbBudgetToBudget(data);
}

export async function updateBudgetItem(id: string, updates: Partial<BudgetItem>): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const dbUpdates: Record<string, unknown> = {};
  if (updates.year !== undefined) dbUpdates.year = updates.year;
  if (updates.month !== undefined) dbUpdates.month = updates.month;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.budgeted !== undefined) dbUpdates.budgeted = updates.budgeted;
  if (updates.spent !== undefined) dbUpdates.spent = updates.spent;
  if (updates.description !== undefined) dbUpdates.description = updates.description;

  const { error } = await supabase!
    .from('budget_items')
    .update(dbUpdates)
    .eq('id', id);

  if (error) {
    console.error('Error updating budget item:', error);
    return false;
  }

  return true;
}

export async function deleteBudgetItem(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase!
    .from('budget_items')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting budget item:', error);
    return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// Expense Items 관련 함수들
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchExpenseItems(year?: number, month?: number): Promise<ExpenseItem[] | null> {
  if (!isSupabaseConfigured()) return null;

  let query = supabase!
    .from('expense_items')
    .select('*');

  if (year) {
    query = query.eq('year', year);
  }
  if (month) {
    query = query.eq('month', month);
  }

  const { data, error } = await query
    .order('expense_date', { ascending: false });

  if (error) {
    console.error('Error fetching expense items:', error);
    return null;
  }

  return data?.map(mapDbExpenseToExpense) || [];
}

export async function createExpenseItem(item: Omit<ExpenseItem, 'id'>): Promise<ExpenseItem | null> {
  if (!isSupabaseConfigured()) return null;

  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const { data, error } = await supabase!
    .from('expense_items')
    .insert({
      id,
      year: item.year,
      month: item.month,
      category: item.category,
      amount: item.amount,
      description: item.description,
      vendor: item.vendor,
      expense_date: item.date,
      receipt_url: item.receipt,
      notes: item.notes,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating expense item:', error);
    return null;
  }

  return mapDbExpenseToExpense(data);
}

export async function updateExpenseItem(id: string, updates: Partial<ExpenseItem>): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const dbUpdates: Record<string, unknown> = {};
  if (updates.year !== undefined) dbUpdates.year = updates.year;
  if (updates.month !== undefined) dbUpdates.month = updates.month;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.vendor !== undefined) dbUpdates.vendor = updates.vendor;
  if (updates.date !== undefined) dbUpdates.expense_date = updates.date;
  if (updates.receipt !== undefined) dbUpdates.receipt_url = updates.receipt;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

  const { error } = await supabase!
    .from('expense_items')
    .update(dbUpdates)
    .eq('id', id);

  if (error) {
    console.error('Error updating expense item:', error);
    return false;
  }

  return true;
}

export async function deleteExpenseItem(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase!
    .from('expense_items')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting expense item:', error);
    return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// 예산 데이터 매핑 헬퍼
// ═══════════════════════════════════════════════════════════════════════════

function mapDbBudgetToBudget(dbBudget: DBBudgetItem): BudgetItem {
  return {
    id: dbBudget.id,
    year: dbBudget.year,
    month: dbBudget.month,
    category: dbBudget.category as BudgetCategory,
    budgeted: Number(dbBudget.budgeted),
    spent: Number(dbBudget.spent),
    description: dbBudget.description || undefined,
  };
}

function mapDbExpenseToExpense(dbExpense: DBExpenseItem): ExpenseItem {
  return {
    id: dbExpense.id,
    year: dbExpense.year,
    month: dbExpense.month,
    category: dbExpense.category as BudgetCategory,
    amount: Number(dbExpense.amount),
    description: dbExpense.description,
    vendor: dbExpense.vendor || undefined,
    date: dbExpense.expense_date,
    receipt: dbExpense.receipt_url || undefined,
    notes: dbExpense.notes || undefined,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Issue 관련 함수들
// ═══════════════════════════════════════════════════════════════════════════

interface DBIssueItem {
  id: string;
  year: number;
  month: number;
  title: string;
  type: string;
  priority: string;
  impact: string;
  status: string;
  category: string;
  description: string | null;
  owner: string | null;
  due_date: string | null;
  resolution: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchIssueItems(year?: number): Promise<IssueItem[] | null> {
  if (!isSupabaseConfigured()) return null;

  let query = supabase!
    .from('issues')
    .select('*');

  if (year) {
    query = query.eq('year', year);
  }

  const { data, error } = await query
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching issue items:', error);
    return null;
  }

  return data?.map(mapDbIssueToIssue) || [];
}

export async function createIssueItem(
  item: Omit<IssueItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<IssueItem | null> {
  if (!isSupabaseConfigured()) return null;

  const now = new Date().toISOString();

  const { data, error } = await supabase!
    .from('issues')
    .insert({
      year: item.year,
      month: item.month,
      title: item.title,
      type: item.type,
      priority: item.priority,
      impact: item.impact,
      status: item.status,
      category: item.category,
      description: item.description || null,
      owner: item.owner || null,
      due_date: item.dueDate || null,
      resolution: item.resolution || null,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating issue item:', error.message, error.code, error.details, error.hint);
    return null;
  }

  return mapDbIssueToIssue(data);
}

export async function updateIssueItem(
  id: string,
  updates: Partial<IssueItem>
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const dbUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.year !== undefined) dbUpdates.year = updates.year;
  if (updates.month !== undefined) dbUpdates.month = updates.month;
  if (updates.type !== undefined) dbUpdates.type = updates.type;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.impact !== undefined) dbUpdates.impact = updates.impact;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.description !== undefined) dbUpdates.description = updates.description || null;
  if (updates.owner !== undefined) dbUpdates.owner = updates.owner || null;
  if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate || null;
  if (updates.resolution !== undefined) dbUpdates.resolution = updates.resolution || null;

  const { error } = await supabase!
    .from('issues')
    .update(dbUpdates)
    .eq('id', id);

  if (error) {
    console.error('Error updating issue item:', error);
    return false;
  }

  return true;
}

export async function deleteIssueItem(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase!
    .from('issues')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting issue item:', error);
    return false;
  }

  return true;
}

function mapDbIssueToIssue(dbIssue: DBIssueItem): IssueItem {
  return {
    id: dbIssue.id,
    year: dbIssue.year,
    month: dbIssue.month,
    title: dbIssue.title,
    type: dbIssue.type as IssueType,
    priority: dbIssue.priority as IssuePriority,
    impact: dbIssue.impact as IssueImpact,
    status: dbIssue.status as IssueStatus,
    category: dbIssue.category as IssueItem['category'],
    description: dbIssue.description || undefined,
    owner: dbIssue.owner || undefined,
    dueDate: dbIssue.due_date || undefined,
    resolution: dbIssue.resolution || undefined,
    createdAt: dbIssue.created_at,
    updatedAt: dbIssue.updated_at,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Ocean Data 관련 함수들 (해저숙성 데이터로그)
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

// Ocean Data Daily CRUD

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
    console.error('Error fetching ocean data:', error);
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
    console.error('Error fetching ocean data by date:', error);
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
    console.error('Error upserting ocean data:', JSON.stringify(error, null, 2), 'Code:', error.code, 'Message:', error.message);
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
    console.error('Error updating ocean data salinity:', error);
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
    console.error('Error deleting ocean data:', error);
    return false;
  }

  return true;
}

// Salinity Records CRUD

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
    console.error('Error fetching salinity records:', error);
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
    console.error('Error creating salinity record:', error);
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
    console.error('Error deleting salinity record:', error);
    return false;
  }

  return true;
}

// Mapping functions

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

// ═══════════════════════════════════════════════════════════════════════════
// 원가계산기 관련 함수들
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
    console.error('Error fetching cost calculator settings:', error);
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
    console.error('Error fetching cost calculator settings by year:', error);
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
    console.error('Error upserting cost calculator settings:', error);
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
    console.error('Error deleting cost calculator settings:', error);
    return false;
  }

  return true;
}

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
