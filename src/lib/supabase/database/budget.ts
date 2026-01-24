/**
 * Budget 관련 데이터베이스 함수
 * - Budget Items, Expense Items
 */

import { supabase, isSupabaseConfigured } from '../client';
import { dbLogger } from '@/lib/logger';
import { BudgetItem, ExpenseItem, BudgetCategory } from '@/lib/types';

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
    dbLogger.error('Error fetching budget items:', error);
    return null;
  }

  return data?.map(mapDbBudgetToBudget) || [];
}

export async function createBudgetItem(item: Omit<BudgetItem, 'id'>): Promise<BudgetItem | null> {
  if (!isSupabaseConfigured()) return null;

  const id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
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
    dbLogger.error('Error creating budget item:', error);
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
    dbLogger.error('Error updating budget item:', error);
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
    dbLogger.error('Error deleting budget item:', error);
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
