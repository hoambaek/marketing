'use client';

import { create } from 'zustand';
import { handleStoreError } from '@/lib/utils/error-handler';
import { storeLogger } from '@/lib/logger';
import { persist } from 'zustand/middleware';
import { Task, MustDoItem, KPIItem, ContentItem, TaskStatus } from '@/lib/types';
import { INITIAL_TASKS, INITIAL_MUST_DO, INITIAL_KPI, INITIAL_CONTENT, STORAGE_KEYS } from '@/lib/data/initial-data';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import * as db from '@/lib/supabase/database';

// ═══════════════════════════════════════════════════════════════════════════
// 스토어 인터페이스
// ═══════════════════════════════════════════════════════════════════════════

interface MasterPlanState {
  // 데이터
  tasks: Task[];
  mustDoItems: MustDoItem[];
  kpiItems: KPIItem[];
  contentItems: ContentItem[];

  // Supabase 상태
  isLoading: boolean;
  isInitialized: boolean;
  useSupabase: boolean;

  // Initialization
  initializeFromSupabase: () => Promise<void>;

  // Task Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  reorderTasks: (year: number, month: number, week: number, activeId: string, overId: string) => void;

  // Must-Do Actions
  toggleMustDo: (id: string) => Promise<void>;
  addMustDo: (item: Omit<MustDoItem, 'id'>) => Promise<void>;
  updateMustDo: (id: string, updates: Partial<MustDoItem>) => Promise<void>;
  deleteMustDo: (id: string) => Promise<void>;

  // KPI Actions
  updateKPI: (id: string, current: number) => Promise<void>;

  // Content Actions
  addContent: (item: Omit<ContentItem, 'id'>) => Promise<void>;
  updateContent: (id: string, updates: Partial<ContentItem>) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;

  // Computed Helpers
  getTasksByYear: (year: number) => Task[];
  getTasksByMonth: (year: number, month: number) => Task[];
  getTasksByMonthAndWeek: (year: number, month: number, week: number) => Task[];
  getMustDoByYear: (year: number) => MustDoItem[];
  getMustDoByMonth: (year: number, month: number) => MustDoItem[];
  getKPIByYear: (year: number) => KPIItem[];
  getKPIByMonth: (year: number, month: number) => KPIItem[];
  getProgressByYear: (year: number) => number;
  getProgressByMonth: (year: number, month: number) => number;
  getTotalProgress: () => number;
  getContentByYear: (year: number) => ContentItem[];
  getContentByMonth: (year: number, month: number) => ContentItem[];

  // Reset
  resetToInitial: () => void;
  resetToDefaults: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// ID 생성 유틸리티
// ═══════════════════════════════════════════════════════════════════════════

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ═══════════════════════════════════════════════════════════════════════════
// Zustand 스토어
// ═══════════════════════════════════════════════════════════════════════════

export const useMasterPlanStore = create<MasterPlanState>()(
  persist(
    (set, get) => ({
      // 초기 데이터
      tasks: INITIAL_TASKS,
      mustDoItems: INITIAL_MUST_DO,
      kpiItems: INITIAL_KPI,
      contentItems: INITIAL_CONTENT,

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
          // Supabase에서 데이터 가져오기
          const [tasks, mustDoItems, kpiItems, contentItems] = await Promise.all([
            db.fetchTasks(),
            db.fetchMustDoItems(),
            db.fetchKPIItems(),
            db.fetchContentItems(),
          ]);

          // 데이터가 없으면 초기 데이터로 시드
          if (!tasks || tasks.length === 0) {
            storeLogger.log('masterplan-store: No data in Supabase, seeding initial data...');
            await db.seedInitialData(
              INITIAL_TASKS,
              INITIAL_MUST_DO,
              INITIAL_KPI,
              INITIAL_CONTENT
            );

            // 시드 후 다시 가져오기
            const [seededTasks, seededMustDo, seededKpi, seededContent] = await Promise.all([
              db.fetchTasks(),
              db.fetchMustDoItems(),
              db.fetchKPIItems(),
              db.fetchContentItems(),
            ]);

            set({
              tasks: seededTasks || INITIAL_TASKS,
              mustDoItems: seededMustDo || INITIAL_MUST_DO,
              kpiItems: seededKpi || INITIAL_KPI,
              contentItems: seededContent || INITIAL_CONTENT,
              isLoading: false,
              isInitialized: true,
              useSupabase: true,
            });
          } else {
            set({
              tasks: tasks || [],
              mustDoItems: mustDoItems || [],
              kpiItems: kpiItems || [],
              contentItems: contentItems || [],
              isLoading: false,
              isInitialized: true,
              useSupabase: true,
            });
          }
        } catch (error) {
          handleStoreError(error, 'masterplan-store:initializeFromSupabase');
          // Supabase 실패 시 로컬 데이터 유지
          set({ isLoading: false, isInitialized: true, useSupabase: false });
        }
      },

      // ═══════════════════════════════════════════════════════════════════
      // Task Actions
      // ═══════════════════════════════════════════════════════════════════

      addTask: async (task) => {
        const newTask: Task = {
          ...task,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const previousTasks = get().tasks;

        // 먼저 로컬 상태 업데이트 (낙관적 업데이트)
        set((state) => ({ tasks: [...state.tasks, newTask] }));

        // Supabase에 저장
        if (get().useSupabase) {
          try {
            const created = await db.createTask(task);
            if (created) {
              // Supabase에서 생성된 ID로 업데이트
              set((state) => ({
                tasks: state.tasks.map((t) =>
                  t.id === newTask.id ? created : t
                ),
              }));
            }
          } catch (error) {
            set({ tasks: previousTasks });
            handleStoreError(error, 'masterplan-store:addTask');
          }
        }
      },

      updateTask: async (id, updates) => {
        const previousTasks = get().tasks;

        // 먼저 로컬 상태 업데이트
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, ...updates, updatedAt: new Date().toISOString() }
              : task
          ),
        }));

        // Supabase에 저장
        if (get().useSupabase) {
          try {
            await db.updateTask(id, updates);
          } catch (error) {
            set({ tasks: previousTasks });
            handleStoreError(error, 'masterplan-store:updateTask');
          }
        }
      },

      deleteTask: async (id) => {
        const previousTasks = get().tasks;

        // 먼저 로컬 상태 업데이트
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));

        // Supabase에서 삭제
        if (get().useSupabase) {
          try {
            await db.deleteTask(id);
          } catch (error) {
            set({ tasks: previousTasks });
            handleStoreError(error, 'masterplan-store:deleteTask');
          }
        }
      },

      updateTaskStatus: async (id, status) => {
        const previousTasks = get().tasks;

        // 먼저 로컬 상태 업데이트
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, status, updatedAt: new Date().toISOString() }
              : task
          ),
        }));

        // Supabase에 저장
        if (get().useSupabase) {
          try {
            await db.updateTaskStatus(id, status);
          } catch (error) {
            set({ tasks: previousTasks });
            handleStoreError(error, 'masterplan-store:updateTaskStatus');
          }
        }
      },

      reorderTasks: (year, month, week, activeId, overId) => {
        set((state) => {
          const tasks = [...state.tasks];
          const weekTasks = tasks.filter((t) => t.year === year && t.month === month && t.week === week);
          const otherTasks = tasks.filter((t) => t.year !== year || t.month !== month || t.week !== week);

          const activeIndex = weekTasks.findIndex((t) => t.id === activeId);
          const overIndex = weekTasks.findIndex((t) => t.id === overId);

          if (activeIndex === -1 || overIndex === -1) return state;

          const [movedTask] = weekTasks.splice(activeIndex, 1);
          weekTasks.splice(overIndex, 0, movedTask);

          return { tasks: [...otherTasks, ...weekTasks] };
        });
        // Note: 순서 변경은 로컬에서만 처리 (sort_order 업데이트는 추후 구현 가능)
      },

      // ═══════════════════════════════════════════════════════════════════
      // Must-Do Actions
      // ═══════════════════════════════════════════════════════════════════

      toggleMustDo: async (id) => {
        const item = get().mustDoItems.find((i) => i.id === id);
        if (!item) return;

        const newDone = !item.done;
        const previousMustDoItems = get().mustDoItems;

        // 먼저 로컬 상태 업데이트
        set((state) => ({
          mustDoItems: state.mustDoItems.map((item) =>
            item.id === id ? { ...item, done: newDone } : item
          ),
        }));

        // Supabase에 저장
        if (get().useSupabase) {
          try {
            await db.toggleMustDo(id, newDone);
          } catch (error) {
            set({ mustDoItems: previousMustDoItems });
            handleStoreError(error, 'masterplan-store:toggleMustDo');
          }
        }
      },

      addMustDo: async (item) => {
        const newItem: MustDoItem = {
          ...item,
          id: generateId(),
        };

        const previousMustDoItems = get().mustDoItems;

        // 먼저 로컬 상태 업데이트
        set((state) => ({ mustDoItems: [...state.mustDoItems, newItem] }));

        // Supabase에 저장
        if (get().useSupabase) {
          try {
            const created = await db.createMustDoItem(item);
            if (created) {
              set((state) => ({
                mustDoItems: state.mustDoItems.map((i) =>
                  i.id === newItem.id ? created : i
                ),
              }));
            }
          } catch (error) {
            set({ mustDoItems: previousMustDoItems });
            handleStoreError(error, 'masterplan-store:addMustDo');
          }
        }
      },

      updateMustDo: async (id, updates) => {
        const previousMustDoItems = get().mustDoItems;

        // 먼저 로컬 상태 업데이트
        set((state) => ({
          mustDoItems: state.mustDoItems.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));

        // Supabase에 저장
        if (get().useSupabase) {
          try {
            await db.updateMustDoItem(id, updates);
          } catch (error) {
            set({ mustDoItems: previousMustDoItems });
            handleStoreError(error, 'masterplan-store:updateMustDo');
          }
        }
      },

      deleteMustDo: async (id) => {
        const previousMustDoItems = get().mustDoItems;

        // 먼저 로컬 상태 업데이트
        set((state) => ({
          mustDoItems: state.mustDoItems.filter((item) => item.id !== id),
        }));

        // Supabase에서 삭제
        if (get().useSupabase) {
          try {
            await db.deleteMustDoItem(id);
          } catch (error) {
            set({ mustDoItems: previousMustDoItems });
            handleStoreError(error, 'masterplan-store:deleteMustDo');
          }
        }
      },

      // ═══════════════════════════════════════════════════════════════════
      // KPI Actions
      // ═══════════════════════════════════════════════════════════════════

      updateKPI: async (id, current) => {
        const previousKpiItems = get().kpiItems;

        // 먼저 로컬 상태 업데이트
        set((state) => ({
          kpiItems: state.kpiItems.map((kpi) =>
            kpi.id === id ? { ...kpi, current } : kpi
          ),
        }));

        // Supabase에 저장
        if (get().useSupabase) {
          try {
            await db.updateKPI(id, current);
          } catch (error) {
            set({ kpiItems: previousKpiItems });
            handleStoreError(error, 'masterplan-store:updateKPI');
          }
        }
      },

      // ═══════════════════════════════════════════════════════════════════
      // Content Actions
      // ═══════════════════════════════════════════════════════════════════

      addContent: async (item) => {
        const newItem: ContentItem = {
          ...item,
          id: generateId(),
        };

        const previousContentItems = get().contentItems;

        // 먼저 로컬 상태 업데이트
        set((state) => ({ contentItems: [...state.contentItems, newItem] }));

        // Supabase에 저장
        if (get().useSupabase) {
          try {
            const created = await db.createContentItem(item);
            if (created) {
              set((state) => ({
                contentItems: state.contentItems.map((i) =>
                  i.id === newItem.id ? created : i
                ),
              }));
            }
          } catch (error) {
            set({ contentItems: previousContentItems });
            handleStoreError(error, 'masterplan-store:addContent');
          }
        }
      },

      updateContent: async (id, updates) => {
        const previousContentItems = get().contentItems;

        // 먼저 로컬 상태 업데이트
        set((state) => ({
          contentItems: state.contentItems.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));

        // Supabase에 저장
        if (get().useSupabase) {
          try {
            await db.updateContentItem(id, updates);
          } catch (error) {
            set({ contentItems: previousContentItems });
            handleStoreError(error, 'masterplan-store:updateContent');
          }
        }
      },

      deleteContent: async (id) => {
        const previousContentItems = get().contentItems;

        // 먼저 로컬 상태 업데이트
        set((state) => ({
          contentItems: state.contentItems.filter((item) => item.id !== id),
        }));

        // Supabase에서 삭제
        if (get().useSupabase) {
          try {
            await db.deleteContentItem(id);
          } catch (error) {
            set({ contentItems: previousContentItems });
            handleStoreError(error, 'masterplan-store:deleteContent');
          }
        }
      },

      // ═══════════════════════════════════════════════════════════════════
      // Computed Helpers
      // ═══════════════════════════════════════════════════════════════════

      getTasksByYear: (year) => {
        return get().tasks.filter((task) => task.year === year);
      },

      getTasksByMonth: (year, month) => {
        return get().tasks.filter((task) => task.year === year && task.month === month);
      },

      getTasksByMonthAndWeek: (year, month, week) => {
        return get().tasks.filter((task) => task.year === year && task.month === month && task.week === week);
      },

      getMustDoByYear: (year) => {
        return get().mustDoItems.filter((item) => item.year === year);
      },

      getMustDoByMonth: (year, month) => {
        return get().mustDoItems.filter((item) => item.year === year && item.month === month);
      },

      getKPIByYear: (year) => {
        return get().kpiItems.filter((item) => item.year === year);
      },

      getKPIByMonth: (year, month) => {
        return get().kpiItems.filter((item) => item.year === year && item.month === month);
      },

      getProgressByYear: (year) => {
        const yearTasks = get().tasks.filter((task) => task.year === year);
        if (yearTasks.length === 0) return 0;
        const doneTasks = yearTasks.filter((task) => task.status === 'done').length;
        return Math.round((doneTasks / yearTasks.length) * 100);
      },

      getProgressByMonth: (year, month) => {
        const monthTasks = get().tasks.filter((task) => task.year === year && task.month === month);
        if (monthTasks.length === 0) return 0;
        const doneTasks = monthTasks.filter((task) => task.status === 'done').length;
        return Math.round((doneTasks / monthTasks.length) * 100);
      },

      getTotalProgress: () => {
        const { tasks } = get();
        if (tasks.length === 0) return 0;
        const doneTasks = tasks.filter((task) => task.status === 'done').length;
        return Math.round((doneTasks / tasks.length) * 100);
      },

      getContentByYear: (year) => {
        return get().contentItems.filter((item) => item.year === year);
      },

      getContentByMonth: (year, month) => {
        return get().contentItems.filter((item) => {
          const itemMonth = new Date(item.date).getMonth() + 1;
          return item.year === year && itemMonth === month;
        });
      },

      // ═══════════════════════════════════════════════════════════════════
      // Reset
      // ═══════════════════════════════════════════════════════════════════

      resetToInitial: () => {
        set({
          tasks: INITIAL_TASKS,
          mustDoItems: INITIAL_MUST_DO,
          kpiItems: INITIAL_KPI,
          contentItems: INITIAL_CONTENT,
        });
      },

      resetToDefaults: () => {
        set({
          tasks: INITIAL_TASKS,
          mustDoItems: INITIAL_MUST_DO,
          kpiItems: INITIAL_KPI,
          contentItems: INITIAL_CONTENT,
        });
      },
    }),
    {
      name: STORAGE_KEYS.TASKS,
      partialize: (state) => ({
        tasks: state.tasks,
        mustDoItems: state.mustDoItems,
        kpiItems: state.kpiItems,
        contentItems: state.contentItems,
      }),
    }
  )
);
