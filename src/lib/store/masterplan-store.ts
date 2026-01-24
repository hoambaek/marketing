'use client';

import { create } from 'zustand';
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
            storeLogger.log('No data in Supabase, seeding initial data...');
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
          storeLogger.error('Failed to initialize from Supabase:', error);
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

        // 먼저 로컬 상태 업데이트 (낙관적 업데이트)
        set((state) => ({ tasks: [...state.tasks, newTask] }));

        // Supabase에 저장
        if (get().useSupabase) {
          const created = await db.createTask(task);
          if (created) {
            // Supabase에서 생성된 ID로 업데이트
            set((state) => ({
              tasks: state.tasks.map((t) =>
                t.id === newTask.id ? created : t
              ),
            }));
          }
        }
      },

      updateTask: async (id, updates) => {
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
          await db.updateTask(id, updates);
        }
      },

      deleteTask: async (id) => {
        // 먼저 로컬 상태 업데이트
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));

        // Supabase에서 삭제
        if (get().useSupabase) {
          await db.deleteTask(id);
        }
      },

      updateTaskStatus: async (id, status) => {
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
          await db.updateTaskStatus(id, status);
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

        // 먼저 로컬 상태 업데이트
        set((state) => ({
          mustDoItems: state.mustDoItems.map((item) =>
            item.id === id ? { ...item, done: newDone } : item
          ),
        }));

        // Supabase에 저장
        if (get().useSupabase) {
          await db.toggleMustDo(id, newDone);
        }
      },

      addMustDo: async (item) => {
        const newItem: MustDoItem = {
          ...item,
          id: generateId(),
        };

        // 먼저 로컬 상태 업데이트
        set((state) => ({ mustDoItems: [...state.mustDoItems, newItem] }));

        // Supabase에 저장
        if (get().useSupabase) {
          const created = await db.createMustDoItem(item);
          if (created) {
            set((state) => ({
              mustDoItems: state.mustDoItems.map((i) =>
                i.id === newItem.id ? created : i
              ),
            }));
          }
        }
      },

      updateMustDo: async (id, updates) => {
        // 먼저 로컬 상태 업데이트
        set((state) => ({
          mustDoItems: state.mustDoItems.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));

        // Supabase에 저장
        if (get().useSupabase) {
          await db.updateMustDoItem(id, updates);
        }
      },

      deleteMustDo: async (id) => {
        // 먼저 로컬 상태 업데이트
        set((state) => ({
          mustDoItems: state.mustDoItems.filter((item) => item.id !== id),
        }));

        // Supabase에서 삭제
        if (get().useSupabase) {
          await db.deleteMustDoItem(id);
        }
      },

      // ═══════════════════════════════════════════════════════════════════
      // KPI Actions
      // ═══════════════════════════════════════════════════════════════════

      updateKPI: async (id, current) => {
        // 먼저 로컬 상태 업데이트
        set((state) => ({
          kpiItems: state.kpiItems.map((kpi) =>
            kpi.id === id ? { ...kpi, current } : kpi
          ),
        }));

        // Supabase에 저장
        if (get().useSupabase) {
          await db.updateKPI(id, current);
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

        // 먼저 로컬 상태 업데이트
        set((state) => ({ contentItems: [...state.contentItems, newItem] }));

        // Supabase에 저장
        if (get().useSupabase) {
          const created = await db.createContentItem(item);
          if (created) {
            set((state) => ({
              contentItems: state.contentItems.map((i) =>
                i.id === newItem.id ? created : i
              ),
            }));
          }
        }
      },

      updateContent: async (id, updates) => {
        // 먼저 로컬 상태 업데이트
        set((state) => ({
          contentItems: state.contentItems.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));

        // Supabase에 저장
        if (get().useSupabase) {
          await db.updateContentItem(id, updates);
        }
      },

      deleteContent: async (id) => {
        // 먼저 로컬 상태 업데이트
        set((state) => ({
          contentItems: state.contentItems.filter((item) => item.id !== id),
        }));

        // Supabase에서 삭제
        if (get().useSupabase) {
          await db.deleteContentItem(id);
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
