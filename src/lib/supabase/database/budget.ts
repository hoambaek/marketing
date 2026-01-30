/**
 * 수입/지출 관련 데이터베이스 함수
 * - Income Items (수입), Expense Items (지출)
 */

import { supabase, isSupabaseConfigured } from '../client';
import { dbLogger } from '@/lib/logger';
import { IncomeItem, ExpenseItem, BudgetCategory } from '@/lib/types';

// ═══════════════════════════════════════════════════════════════════════════
// 수입/지출 DB 타입
// ═══════════════════════════════════════════════════════════════════════════

export interface DBIncomeItem {
  id: string;
  year: number;
  month: number;
  category: string;
  amount: number;
  description: string | null;
  income_date: string;
  source: string | null;
  notes: string | null;
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

// Legacy DB 타입 (마이그레이션용)
interface DBBudgetItemLegacy {
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

// ═══════════════════════════════════════════════════════════════════════════
// Income Items 관련 함수들
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchIncomeItems(year?: number): Promise<IncomeItem[] | null> {
  if (!isSupabaseConfigured()) return null;

  // 먼저 income_items 테이블 시도
  let query = supabase!
    .from('income_items')
    .select('*');

  if (year) {
    query = query.eq('year', year);
  }

  const { data, error } = await query
    .order('income_date', { ascending: false });

  if (error) {
    // income_items 테이블이 없으면 budget_items에서 마이그레이션 시도
    const errorMsg = String(error.message || error.details || JSON.stringify(error) || '');
    const errorCode = String(error.code || error.hint || '');
    const isTableNotFound = errorCode === '42P01' || errorCode === 'PGRST116' ||
        errorMsg.includes('does not exist') || errorMsg.includes('relation') ||
        errorMsg.includes('income_items') || errorMsg.includes('undefined');

    if (isTableNotFound) {
      // 테이블이 없으면 조용히 legacy 테이블로 폴백
      return fetchFromLegacyBudgetItems(year);
    }
    dbLogger.error('Error fetching income items:', error);
    return null;
  }

  return data?.map(mapDbIncomeToIncome) || [];
}

// Legacy budget_items에서 데이터 가져오기 (마이그레이션)
async function fetchFromLegacyBudgetItems(year?: number): Promise<IncomeItem[] | null> {
  let query = supabase!
    .from('budget_items')
    .select('*');

  if (year) {
    query = query.eq('year', year);
  }

  const { data, error } = await query
    .order('year', { ascending: true })
    .order('month', { ascending: true });

  if (error) {
    dbLogger.error('Error fetching legacy budget items:', error);
    return null;
  }

  return data?.map(mapLegacyBudgetToIncome) || [];
}

export async function createIncomeItem(item: Omit<IncomeItem, 'id'>): Promise<IncomeItem | null> {
  if (!isSupabaseConfigured()) return null;

  const id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

  // 먼저 income_items 테이블 시도
  const { data, error } = await supabase!
    .from('income_items')
    .insert({
      id,
      year: item.year,
      month: item.month,
      category: item.category,
      amount: item.amount,
      description: item.description,
      income_date: item.date,
      source: item.source,
      notes: item.notes,
    })
    .select()
    .single();

  if (error) {
    // income_items가 없으면 budget_items에 저장 (하위 호환)
    const errorMsg = String(error.message || error.details || '');
    const errorCode = String(error.code || '');
    if (errorCode === '42P01' || errorMsg.includes('does not exist') || errorMsg.includes('income_items')) {
      return createInLegacyBudgetItems(id, item);
    }
    dbLogger.error('Error creating income item:', error);
    return null;
  }

  return mapDbIncomeToIncome(data);
}

// Legacy budget_items에 저장 (하위 호환)
async function createInLegacyBudgetItems(id: string, item: Omit<IncomeItem, 'id'>): Promise<IncomeItem | null> {
  const { data, error } = await supabase!
    .from('budget_items')
    .insert({
      id,
      year: item.year,
      month: item.month,
      category: item.category,
      budgeted: item.amount,
      spent: 0,
      description: item.description,
    })
    .select()
    .single();

  if (error) {
    dbLogger.error('Error creating in legacy budget_items:', error);
    return null;
  }

  return mapLegacyBudgetToIncome(data);
}

export async function updateIncomeItem(id: string, updates: Partial<IncomeItem>): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const dbUpdates: Record<string, unknown> = {};
  if (updates.year !== undefined) dbUpdates.year = updates.year;
  if (updates.month !== undefined) dbUpdates.month = updates.month;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.date !== undefined) dbUpdates.income_date = updates.date;
  if (updates.source !== undefined) dbUpdates.source = updates.source;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

  // 먼저 income_items 시도
  const { error } = await supabase!
    .from('income_items')
    .update(dbUpdates)
    .eq('id', id);

  if (error) {
    // income_items가 없으면 budget_items 업데이트
    const errorMsg = String(error.message || error.details || '');
    const errorCode = String(error.code || '');
    if (errorCode === '42P01' || errorMsg.includes('does not exist') || errorMsg.includes('income_items')) {
      return updateInLegacyBudgetItems(id, updates);
    }
    dbLogger.error('Error updating income item:', error);
    return false;
  }

  return true;
}

// Legacy budget_items 업데이트
async function updateInLegacyBudgetItems(id: string, updates: Partial<IncomeItem>): Promise<boolean> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.year !== undefined) dbUpdates.year = updates.year;
  if (updates.month !== undefined) dbUpdates.month = updates.month;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.amount !== undefined) dbUpdates.budgeted = updates.amount;
  if (updates.description !== undefined) dbUpdates.description = updates.description;

  const { error } = await supabase!
    .from('budget_items')
    .update(dbUpdates)
    .eq('id', id);

  if (error) {
    dbLogger.error('Error updating legacy budget item:', error);
    return false;
  }

  return true;
}

export async function deleteIncomeItem(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  // 먼저 income_items 시도
  const { error } = await supabase!
    .from('income_items')
    .delete()
    .eq('id', id);

  if (error) {
    // income_items가 없으면 budget_items에서 삭제
    const errorMsg = String(error.message || error.details || '');
    const errorCode = String(error.code || '');
    if (errorCode === '42P01' || errorMsg.includes('does not exist') || errorMsg.includes('income_items')) {
      return deleteFromLegacyBudgetItems(id);
    }
    dbLogger.error('Error deleting income item:', error);
    return false;
  }

  return true;
}

// Legacy budget_items에서 삭제
async function deleteFromLegacyBudgetItems(id: string): Promise<boolean> {
  const { error } = await supabase!
    .from('budget_items')
    .delete()
    .eq('id', id);

  if (error) {
    dbLogger.error('Error deleting from legacy budget_items:', error);
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
    dbLogger.error('Error fetching expense items:', error);
    return null;
  }

  return data?.map(mapDbExpenseToExpense) || [];
}

export async function createExpenseItem(item: Omit<ExpenseItem, 'id'>): Promise<ExpenseItem | null> {
  if (!isSupabaseConfigured()) return null;

  const id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
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
    dbLogger.error('Error creating expense item:', error);
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
    dbLogger.error('Error updating expense item:', error);
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
    dbLogger.error('Error deleting expense item:', error);
    return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// 데이터 매핑 헬퍼
// ═══════════════════════════════════════════════════════════════════════════

function mapDbIncomeToIncome(dbIncome: DBIncomeItem): IncomeItem {
  return {
    id: dbIncome.id,
    year: dbIncome.year,
    month: dbIncome.month,
    category: dbIncome.category as BudgetCategory,
    amount: Number(dbIncome.amount),
    description: dbIncome.description || undefined,
    date: dbIncome.income_date,
    source: dbIncome.source || undefined,
    notes: dbIncome.notes || undefined,
  };
}

// Legacy budget_items → IncomeItem 매핑
function mapLegacyBudgetToIncome(dbBudget: DBBudgetItemLegacy): IncomeItem {
  return {
    id: dbBudget.id,
    year: dbBudget.year,
    month: dbBudget.month,
    category: dbBudget.category as BudgetCategory,
    amount: Number(dbBudget.budgeted),
    description: dbBudget.description || undefined,
    date: `${dbBudget.year}-${String(dbBudget.month).padStart(2, '0')}-01`,
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
// Legacy exports (하위 호환성)
// ═══════════════════════════════════════════════════════════════════════════

export const fetchBudgetItems = fetchIncomeItems;
export const createBudgetItem = createIncomeItem;
export const updateBudgetItem = updateIncomeItem;
export const deleteBudgetItem = deleteIncomeItem;
