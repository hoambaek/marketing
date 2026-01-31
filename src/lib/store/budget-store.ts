'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IncomeItem, ExpenseItem, BudgetCategory } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import * as db from '@/lib/supabase/database';
import { handleStoreError } from '@/lib/utils/error-handler';

// ═══════════════════════════════════════════════════════════════════════════
// 스토어 인터페이스
// ═══════════════════════════════════════════════════════════════════════════

interface BudgetState {
  // 데이터
  incomeItems: IncomeItem[];
  expenseItems: ExpenseItem[];

  // Supabase 상태
  isLoading: boolean;
  isInitialized: boolean;
  useSupabase: boolean;

  // Initialization
  initializeFromSupabase: () => Promise<void>;

  // Income Actions
  addIncome: (item: Omit<IncomeItem, 'id'>) => Promise<void>;
  updateIncome: (id: string, updates: Partial<IncomeItem>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;

  // Expense Actions
  addExpense: (item: Omit<ExpenseItem, 'id'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<ExpenseItem>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Computed Helpers
  getIncomeByYear: (year: number) => IncomeItem[];
  getIncomeByMonth: (year: number, month: number) => IncomeItem[];
  getExpensesByYear: (year: number) => ExpenseItem[];
  getExpensesByMonth: (year: number, month: number) => ExpenseItem[];
  getTotalIncome: (year: number) => number;
  getTotalExpense: (year: number) => number;
  getIncomeByCategory: (year: number, category: BudgetCategory) => number;
  getExpenseByCategory: (year: number, category: BudgetCategory) => number;

  // Legacy aliases (하위 호환성)
  budgetItems: IncomeItem[];
  addBudget: (item: Omit<IncomeItem, 'id'>) => Promise<void>;
  updateBudget: (id: string, updates: Partial<IncomeItem>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  getBudgetByYear: (year: number) => IncomeItem[];
  getBudgetByMonth: (year: number, month: number) => IncomeItem[];
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
      incomeItems: [],
      expenseItems: [],

      // Legacy alias
      get budgetItems() {
        return get().incomeItems;
      },

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
          const [incomeItems, expenseItems] = await Promise.all([
            db.fetchIncomeItems(),
            db.fetchExpenseItems(),
          ]);

          set({
            incomeItems: incomeItems || [],
            expenseItems: expenseItems || [],
            isLoading: false,
            isInitialized: true,
            useSupabase: true,
          });
        } catch (error) {
          handleStoreError(error, 'BudgetStore.initializeFromSupabase');
          set({ isLoading: false, isInitialized: true, useSupabase: false });
        }
      },

      // ═══════════════════════════════════════════════════════════════════
      // Income Actions
      // ═══════════════════════════════════════════════════════════════════

      addIncome: async (item) => {
        const newItem: IncomeItem = {
          ...item,
          id: generateId(),
        };

        // 낙관적 업데이트
        set((state) => ({ incomeItems: [...state.incomeItems, newItem] }));

        // Supabase에 저장
        if (get().useSupabase) {
          try {
            const created = await db.createIncomeItem(item);
            if (created) {
              set((state) => ({
                incomeItems: state.incomeItems.map((i) =>
                  i.id === newItem.id ? created : i
                ),
              }));
            }
          } catch (error) {
            // 롤백
            set((state) => ({
              incomeItems: state.incomeItems.filter((i) => i.id !== newItem.id),
            }));
            handleStoreError(error, 'BudgetStore.addIncome');
          }
        }
      },

      updateIncome: async (id, updates) => {
        // 원본 저장 (롤백용)
        const original = get().incomeItems.find((item) => item.id === id);

        // 낙관적 업데이트
        set((state) => ({
          incomeItems: state.incomeItems.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));

        // Supabase에 저장
        if (get().useSupabase) {
          try {
            await db.updateIncomeItem(id, updates);
          } catch (error) {
            // 롤백
            if (original) {
              set((state) => ({
                incomeItems: state.incomeItems.map((item) =>
                  item.id === id ? original : item
                ),
              }));
            }
            handleStoreError(error, 'BudgetStore.updateIncome');
          }
        }
      },

      deleteIncome: async (id) => {
        // 원본 저장 (롤백용)
        const original = get().incomeItems.find((item) => item.id === id);

        // 낙관적 업데이트
        set((state) => ({
          incomeItems: state.incomeItems.filter((item) => item.id !== id),
        }));

        // Supabase에서 삭제
        if (get().useSupabase) {
          try {
            await db.deleteIncomeItem(id);
          } catch (error) {
            // 롤백
            if (original) {
              set((state) => ({ incomeItems: [...state.incomeItems, original] }));
            }
            handleStoreError(error, 'BudgetStore.deleteIncome');
          }
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
          try {
            const created = await db.createExpenseItem(item);
            if (created) {
              set((state) => ({
                expenseItems: state.expenseItems.map((i) =>
                  i.id === newItem.id ? created : i
                ),
              }));
            }
          } catch (error) {
            // 롤백
            set((state) => ({
              expenseItems: state.expenseItems.filter((i) => i.id !== newItem.id),
            }));
            handleStoreError(error, 'BudgetStore.addExpense');
          }
        }
      },

      updateExpense: async (id, updates) => {
        // 원본 저장 (롤백용)
        const original = get().expenseItems.find((item) => item.id === id);

        // 낙관적 업데이트
        set((state) => ({
          expenseItems: state.expenseItems.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));

        // Supabase에 저장
        if (get().useSupabase) {
          try {
            await db.updateExpenseItem(id, updates);
          } catch (error) {
            // 롤백
            if (original) {
              set((state) => ({
                expenseItems: state.expenseItems.map((item) =>
                  item.id === id ? original : item
                ),
              }));
            }
            handleStoreError(error, 'BudgetStore.updateExpense');
          }
        }
      },

      deleteExpense: async (id) => {
        // 원본 저장 (롤백용)
        const original = get().expenseItems.find((item) => item.id === id);

        // 낙관적 업데이트
        set((state) => ({
          expenseItems: state.expenseItems.filter((item) => item.id !== id),
        }));

        // Supabase에서 삭제
        if (get().useSupabase) {
          try {
            await db.deleteExpenseItem(id);
          } catch (error) {
            // 롤백
            if (original) {
              set((state) => ({ expenseItems: [...state.expenseItems, original] }));
            }
            handleStoreError(error, 'BudgetStore.deleteExpense');
          }
        }
      },

      // ═══════════════════════════════════════════════════════════════════
      // Computed Helpers
      // ═══════════════════════════════════════════════════════════════════

      getIncomeByYear: (year) => {
        return get().incomeItems.filter((item) => item.year === year);
      },

      getIncomeByMonth: (year, month) => {
        return get().incomeItems.filter((item) => item.year === year && item.month === month);
      },

      getExpensesByYear: (year) => {
        return get().expenseItems.filter((item) => item.year === year);
      },

      getExpensesByMonth: (year, month) => {
        return get().expenseItems.filter((item) => item.year === year && item.month === month);
      },

      getTotalIncome: (year) => {
        return get().incomeItems
          .filter((item) => item.year === year)
          .reduce((sum, item) => sum + item.amount, 0);
      },

      getTotalExpense: (year) => {
        return get().expenseItems
          .filter((item) => item.year === year)
          .reduce((sum, item) => sum + item.amount, 0);
      },

      getIncomeByCategory: (year, category) => {
        return get().incomeItems
          .filter((item) => item.year === year && item.category === category)
          .reduce((sum, item) => sum + item.amount, 0);
      },

      getExpenseByCategory: (year, category) => {
        return get().expenseItems
          .filter((item) => item.year === year && item.category === category)
          .reduce((sum, item) => sum + item.amount, 0);
      },

      // ═══════════════════════════════════════════════════════════════════
      // Legacy Aliases (하위 호환성)
      // ═══════════════════════════════════════════════════════════════════

      addBudget: async (item) => get().addIncome(item),
      updateBudget: async (id, updates) => get().updateIncome(id, updates),
      deleteBudget: async (id) => get().deleteIncome(id),
      getBudgetByYear: (year) => get().getIncomeByYear(year),
      getBudgetByMonth: (year, month) => get().getIncomeByMonth(year, month),
      getTotalBudgeted: (year) => get().getTotalIncome(year),
      getTotalSpent: (year) => get().getTotalExpense(year),
      getBudgetByCategory: (year, category) => get().getIncomeByCategory(year, category),
      getSpentByCategory: (year, category) => get().getExpenseByCategory(year, category),
    }),
    {
      name: 'muse-budget-storage',
      partialize: (state) => ({
        incomeItems: state.incomeItems,
        expenseItems: state.expenseItems,
      }),
    }
  )
);
