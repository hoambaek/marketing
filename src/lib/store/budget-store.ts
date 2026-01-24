'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BudgetItem, ExpenseItem, BudgetCategory } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import * as db from '@/lib/supabase/database';
import { storeLogger } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════════════════
// 스토어 인터페이스
// ═══════════════════════════════════════════════════════════════════════════

interface BudgetState {
  // 데이터
  budgetItems: BudgetItem[];
  expenseItems: ExpenseItem[];

  // Supabase 상태
  isLoading: boolean;
  isInitialized: boolean;
  useSupabase: boolean;

  // Initialization
  initializeFromSupabase: () => Promise<void>;

  // Budget Actions
  addBudget: (item: Omit<BudgetItem, 'id'>) => Promise<void>;
  updateBudget: (id: string, updates: Partial<BudgetItem>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  // Expense Actions
  addExpense: (item: Omit<ExpenseItem, 'id'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<ExpenseItem>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Computed Helpers
  getBudgetByYear: (year: number) => BudgetItem[];
  getBudgetByMonth: (year: number, month: number) => BudgetItem[];
  getExpensesByYear: (year: number) => ExpenseItem[];
  getExpensesByMonth: (year: number, month: number) => ExpenseItem[];
  getTotalBudgeted: (year: number) => number;
  getTotalSpent: (year: number) => number;
  getBudgetByCategory: (year: number, category: BudgetCategory) => number;
  getSpentByCategory: (year: number, category: BudgetCategory) => number;
}

// ═══════════════════════════════════════════════════════════════════════════
// ID 생성 유틸리티
// ═══════════════════════════════════════════════════════════════════════════

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ═══════════════════════════════════════════════════════════════════════════
// Zustand 스토어
// ═══════════════════════════════════════════════════════════════════════════

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      // 초기 데이터
      budgetItems: [],
      expenseItems: [],

      // Supabase 상태
      isLoading: false,
      isInitialized: false,
      useSupabase: isSupabaseConfigured(),

      // ═══════════════════════════════════════════════════════════════════
      // Supabase 초기화
      // ═══════════════════════════════════════════════════════════════════

      initializeFromSupabase: async () => {
        if (!isSupabaseConfigured()) {
          set({ isInitialized: true, useSupabase: false });
          return;
        }

        set({ isLoading: true });

        try {
          const [budgetItems, expenseItems] = await Promise.all([
            db.fetchBudgetItems(),
            db.fetchExpenseItems(),
          ]);

          set({
            budgetItems: budgetItems || [],
            expenseItems: expenseItems || [],
            isLoading: false,
            isInitialized: true,
            useSupabase: true,
          });
        } catch (error) {
          storeLogger.error('Failed to initialize budget from Supabase:', error);
          set({ isLoading: false, isInitialized: true, useSupabase: false });
        }
      },

      // ═══════════════════════════════════════════════════════════════════
      // Budget Actions
      // ═══════════════════════════════════════════════════════════════════

      addBudget: async (item) => {
        const newItem: BudgetItem = {
          ...item,
          id: generateId(),
        };

        // 낙관적 업데이트
        set((state) => ({ budgetItems: [...state.budgetItems, newItem] }));

        // Supabase에 저장
        if (get().useSupabase) {
          const created = await db.createBudgetItem(item);
          if (created) {
            set((state) => ({
              budgetItems: state.budgetItems.map((i) =>
                i.id === newItem.id ? created : i
              ),
            }));
          }
        }
      },

      updateBudget: async (id, updates) => {
        // 낙관적 업데이트
        set((state) => ({
          budgetItems: state.budgetItems.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));

        // Supabase에 저장
        if (get().useSupabase) {
          await db.updateBudgetItem(id, updates);
        }
      },

      deleteBudget: async (id) => {
        // 낙관적 업데이트
        set((state) => ({
          budgetItems: state.budgetItems.filter((item) => item.id !== id),
        }));

        // Supabase에서 삭제
        if (get().useSupabase) {
          await db.deleteBudgetItem(id);
        }
      },

      // ═══════════════════════════════════════════════════════════════════
      // Expense Actions
      // ═══════════════════════════════════════════════════════════════════

      addExpense: async (item) => {
        const newItem: ExpenseItem = {
          ...item,
          id: generateId(),
        };

        // 낙관적 업데이트
        set((state) => ({ expenseItems: [...state.expenseItems, newItem] }));

        // Supabase에 저장
        if (get().useSupabase) {
          const created = await db.createExpenseItem(item);
          if (created) {
            set((state) => ({
              expenseItems: state.expenseItems.map((i) =>
                i.id === newItem.id ? created : i
              ),
            }));
          }
        }

        // Budget의 spent 업데이트
        const { budgetItems } = get();
        const budgetItem = budgetItems.find(
          (b) => b.year === item.year && b.month === item.month && b.category === item.category
        );
        if (budgetItem) {
          await get().updateBudget(budgetItem.id, {
            spent: budgetItem.spent + item.amount,
          });
        }
      },

      updateExpense: async (id, updates) => {
        const oldExpense = get().expenseItems.find((e) => e.id === id);

        // 낙관적 업데이트
        set((state) => ({
          expenseItems: state.expenseItems.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));

        // Supabase에 저장
        if (get().useSupabase) {
          await db.updateExpenseItem(id, updates);
        }

        // Budget의 spent 업데이트 (금액이 변경된 경우)
        if (oldExpense && updates.amount !== undefined && updates.amount !== oldExpense.amount) {
          const diff = updates.amount - oldExpense.amount;
          const { budgetItems } = get();
          const budgetItem = budgetItems.find(
            (b) => b.year === oldExpense.year && b.month === oldExpense.month && b.category === oldExpense.category
          );
          if (budgetItem) {
            await get().updateBudget(budgetItem.id, {
              spent: budgetItem.spent + diff,
            });
          }
        }
      },

      deleteExpense: async (id) => {
        const expense = get().expenseItems.find((e) => e.id === id);

        // 낙관적 업데이트
        set((state) => ({
          expenseItems: state.expenseItems.filter((item) => item.id !== id),
        }));

        // Supabase에서 삭제
        if (get().useSupabase) {
          await db.deleteExpenseItem(id);
        }

        // Budget의 spent 업데이트
        if (expense) {
          const { budgetItems } = get();
          const budgetItem = budgetItems.find(
            (b) => b.year === expense.year && b.month === expense.month && b.category === expense.category
          );
          if (budgetItem) {
            await get().updateBudget(budgetItem.id, {
              spent: Math.max(0, budgetItem.spent - expense.amount),
            });
          }
        }
      },

      // ═══════════════════════════════════════════════════════════════════
      // Computed Helpers
      // ═══════════════════════════════════════════════════════════════════

      getBudgetByYear: (year) => {
        return get().budgetItems.filter((item) => item.year === year);
      },

      getBudgetByMonth: (year, month) => {
        return get().budgetItems.filter((item) => item.year === year && item.month === month);
      },

      getExpensesByYear: (year) => {
        return get().expenseItems.filter((item) => item.year === year);
      },

      getExpensesByMonth: (year, month) => {
        return get().expenseItems.filter((item) => item.year === year && item.month === month);
      },

      getTotalBudgeted: (year) => {
        return get().budgetItems
          .filter((item) => item.year === year)
          .reduce((sum, item) => sum + item.budgeted, 0);
      },

      getTotalSpent: (year) => {
        return get().expenseItems
          .filter((item) => item.year === year)
          .reduce((sum, item) => sum + item.amount, 0);
      },

      getBudgetByCategory: (year, category) => {
        return get().budgetItems
          .filter((item) => item.year === year && item.category === category)
          .reduce((sum, item) => sum + item.budgeted, 0);
      },

      getSpentByCategory: (year, category) => {
        return get().expenseItems
          .filter((item) => item.year === year && item.category === category)
          .reduce((sum, item) => sum + item.amount, 0);
      },
    }),
    {
      name: 'muse-budget-storage',
      partialize: (state) => ({
        budgetItems: state.budgetItems,
        expenseItems: state.expenseItems,
      }),
    }
  )
);
