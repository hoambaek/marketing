'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, MustDoItem, KPIItem, ContentItem, TaskStatus } from '@/lib/types';
import { INITIAL_TASKS, INITIAL_MUST_DO, INITIAL_KPI, INITIAL_CONTENT, STORAGE_KEYS } from '@/lib/data/initial-data';

// ═══════════════════════════════════════════════════════════════════════════
// 스토어 인터페이스
// ═══════════════════════════════════════════════════════════════════════════

interface MasterPlanState {
  // 데이터
  tasks: Task[];
  mustDoItems: MustDoItem[];
  kpiItems: KPIItem[];
  contentItems: ContentItem[];

  // 설정
  darkMode: boolean;

  // Task Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;

  // Must-Do Actions
  toggleMustDo: (id: string) => void;
  addMustDo: (item: Omit<MustDoItem, 'id'>) => void;
  deleteMustDo: (id: string) => void;

  // KPI Actions
  updateKPI: (id: string, current: number) => void;

  // Content Actions
  addContent: (item: Omit<ContentItem, 'id'>) => void;
  updateContent: (id: string, updates: Partial<ContentItem>) => void;
  deleteContent: (id: string) => void;

  // Settings
  toggleDarkMode: () => void;

  // Computed Helpers
  getTasksByMonth: (month: number) => Task[];
  getTasksByMonthAndWeek: (month: number, week: number) => Task[];
  getMustDoByMonth: (month: number) => MustDoItem[];
  getProgressByMonth: (month: number) => number;
  getTotalProgress: () => number;
  getContentByMonth: (month: number) => ContentItem[];

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
      darkMode: false,

      // ═══════════════════════════════════════════════════════════════════
      // Task Actions
      // ═══════════════════════════════════════════════════════════════════

      addTask: (task) => {
        const newTask: Task = {
          ...task,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ tasks: [...state.tasks, newTask] }));
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, ...updates, updatedAt: new Date().toISOString() }
              : task
          ),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
      },

      updateTaskStatus: (id, status) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, status, updatedAt: new Date().toISOString() }
              : task
          ),
        }));
      },

      // ═══════════════════════════════════════════════════════════════════
      // Must-Do Actions
      // ═══════════════════════════════════════════════════════════════════

      toggleMustDo: (id) => {
        set((state) => ({
          mustDoItems: state.mustDoItems.map((item) =>
            item.id === id ? { ...item, done: !item.done } : item
          ),
        }));
      },

      addMustDo: (item) => {
        const newItem: MustDoItem = {
          ...item,
          id: generateId(),
        };
        set((state) => ({ mustDoItems: [...state.mustDoItems, newItem] }));
      },

      deleteMustDo: (id) => {
        set((state) => ({
          mustDoItems: state.mustDoItems.filter((item) => item.id !== id),
        }));
      },

      // ═══════════════════════════════════════════════════════════════════
      // KPI Actions
      // ═══════════════════════════════════════════════════════════════════

      updateKPI: (id, current) => {
        set((state) => ({
          kpiItems: state.kpiItems.map((kpi) =>
            kpi.id === id ? { ...kpi, current } : kpi
          ),
        }));
      },

      // ═══════════════════════════════════════════════════════════════════
      // Content Actions
      // ═══════════════════════════════════════════════════════════════════

      addContent: (item) => {
        const newItem: ContentItem = {
          ...item,
          id: generateId(),
        };
        set((state) => ({ contentItems: [...state.contentItems, newItem] }));
      },

      updateContent: (id, updates) => {
        set((state) => ({
          contentItems: state.contentItems.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },

      deleteContent: (id) => {
        set((state) => ({
          contentItems: state.contentItems.filter((item) => item.id !== id),
        }));
      },

      // ═══════════════════════════════════════════════════════════════════
      // Settings
      // ═══════════════════════════════════════════════════════════════════

      toggleDarkMode: () => {
        set((state) => {
          const newDarkMode = !state.darkMode;
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', newDarkMode);
          }
          return { darkMode: newDarkMode };
        });
      },

      // ═══════════════════════════════════════════════════════════════════
      // Computed Helpers
      // ═══════════════════════════════════════════════════════════════════

      getTasksByMonth: (month) => {
        return get().tasks.filter((task) => task.month === month);
      },

      getTasksByMonthAndWeek: (month, week) => {
        return get().tasks.filter((task) => task.month === month && task.week === week);
      },

      getMustDoByMonth: (month) => {
        return get().mustDoItems.filter((item) => item.month === month);
      },

      getProgressByMonth: (month) => {
        const monthTasks = get().tasks.filter((task) => task.month === month);
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

      getContentByMonth: (month) => {
        return get().contentItems.filter((item) => {
          const itemMonth = new Date(item.date).getMonth() + 1;
          return itemMonth === month;
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
        darkMode: state.darkMode,
      }),
    }
  )
);
