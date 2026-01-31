'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IssueItem, IssueStatus } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import * as db from '@/lib/supabase/database';
import { handleStoreError } from '@/lib/utils/error-handler';

// Initial sample data
const INITIAL_ISSUES: IssueItem[] = [
  {
    id: 'issue-1',
    year: 2026,
    month: 1,
    title: '샴페인 운송 중 온도 관리 이슈',
    type: 'issue',
    priority: 'high',
    impact: 'high',
    status: 'resolved',
    category: 'operation',
    description: '프랑스에서 한국으로 운송 중 온도 변화 발생 가능성',
    owner: '물류팀',
    resolution: '항온 컨테이너 사용 및 온도 모니터링 장치 부착',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'issue-2',
    year: 2026,
    month: 2,
    title: '패키지 디자인 저작권 확인 필요',
    type: 'risk',
    priority: 'medium',
    impact: 'medium',
    status: 'open',
    category: 'design',
    description: '해저 이미지 사용에 대한 저작권 확인 필요',
    owner: '디자인팀',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'issue-3',
    year: 2026,
    month: 3,
    title: 'SNS 콘텐츠 전략 방향 결정',
    type: 'decision',
    priority: 'high',
    impact: 'high',
    status: 'resolved',
    category: 'marketing',
    description: '인스타그램 중심 vs 유튜브 중심 콘텐츠 전략',
    owner: '마케팅팀',
    resolution: '인스타그램 메인, 유튜브 브랜드 필름 위주로 결정',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'issue-4',
    year: 2026,
    month: 4,
    title: '인플루언서 계약 조건 협상 중',
    type: 'issue',
    priority: 'medium',
    impact: 'medium',
    status: 'in_progress',
    category: 'pr',
    description: '주요 인플루언서 3명과 계약 조건 협상 진행 중',
    owner: 'PR팀',
    dueDate: '2026-04-15',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'issue-5',
    year: 2026,
    month: 5,
    title: 'B2B 가격 정책 결정 필요',
    type: 'decision',
    priority: 'critical',
    impact: 'high',
    status: 'open',
    category: 'b2b',
    description: '호텔/레스토랑 납품 가격 및 최소 주문 수량 결정',
    owner: 'B2B팀',
    dueDate: '2026-05-10',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'issue-6',
    year: 2026,
    month: 6,
    title: '인양 일정 기상 리스크',
    type: 'risk',
    priority: 'critical',
    impact: 'high',
    status: 'open',
    category: 'operation',
    description: '6월 인양 예정일에 기상 악화 시 대응 방안 필요',
    owner: '운영팀',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

interface IssueState {
  issues: IssueItem[];
  isLoading: boolean;
  isInitialized: boolean;
  useSupabase: boolean;

  // Initialization
  initializeFromSupabase: () => Promise<void>;

  // CRUD Actions
  addIssue: (issue: Omit<IssueItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateIssue: (id: string, updates: Partial<IssueItem>) => Promise<void>;
  deleteIssue: (id: string) => Promise<void>;
  updateIssueStatus: (id: string, status: IssueStatus) => Promise<void>;

  // Computed Helpers
  getIssuesByYear: (year: number) => IssueItem[];
  getIssuesByMonth: (year: number, month: number) => IssueItem[];
  getOpenIssues: () => IssueItem[];
  getCriticalIssues: () => IssueItem[];

  // Reset
  resetToInitial: () => void;
}

const generateId = () => `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useIssueStore = create<IssueState>()(
  persist(
    (set, get) => ({
      issues: INITIAL_ISSUES,
      isLoading: false,
      isInitialized: false,
      useSupabase: isSupabaseConfigured(),

      initializeFromSupabase: async () => {
        // Prevent duplicate initialization
        if (get().isInitialized || get().isLoading) {
          return;
        }

        if (!isSupabaseConfigured()) {
          set({ isInitialized: true, useSupabase: false });
          return;
        }

        set({ isLoading: true });

        try {
          const issues = await db.fetchIssueItems();

          if (!issues || issues.length === 0) {
            // Seed initial data if empty
            for (const issue of INITIAL_ISSUES) {
              await db.createIssueItem({
                year: issue.year,
                month: issue.month,
                title: issue.title,
                type: issue.type,
                priority: issue.priority,
                impact: issue.impact,
                status: issue.status,
                category: issue.category,
                description: issue.description,
                owner: issue.owner,
                dueDate: issue.dueDate,
                resolution: issue.resolution,
              });
            }
            const seededIssues = await db.fetchIssueItems();
            set({
              issues: seededIssues || INITIAL_ISSUES,
              isLoading: false,
              isInitialized: true,
              useSupabase: true,
            });
          } else {
            set({
              issues,
              isLoading: false,
              isInitialized: true,
              useSupabase: true,
            });
          }
        } catch (error) {
          handleStoreError(error, 'IssueStore.initializeFromSupabase');
          set({ isLoading: false, isInitialized: true, useSupabase: false });
        }
      },

      addIssue: async (issue) => {
        const newIssue: IssueItem = {
          ...issue,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // 낙관적 업데이트
        set((state) => ({ issues: [...state.issues, newIssue] }));

        // Supabase에 저장
        if (get().useSupabase) {
          try {
            const created = await db.createIssueItem(issue);
            if (created) {
              set((state) => ({
                issues: state.issues.map((i) => (i.id === newIssue.id ? created : i)),
              }));
            }
          } catch (error) {
            // 롤백
            set((state) => ({
              issues: state.issues.filter((i) => i.id !== newIssue.id),
            }));
            handleStoreError(error, 'IssueStore.addIssue');
          }
        }
      },

      updateIssue: async (id, updates) => {
        // 원본 저장 (롤백용)
        const original = get().issues.find((issue) => issue.id === id);

        // 낙관적 업데이트
        set((state) => ({
          issues: state.issues.map((issue) =>
            issue.id === id
              ? { ...issue, ...updates, updatedAt: new Date().toISOString() }
              : issue
          ),
        }));

        // Supabase에 저장
        if (get().useSupabase) {
          try {
            await db.updateIssueItem(id, updates);
          } catch (error) {
            // 롤백
            if (original) {
              set((state) => ({
                issues: state.issues.map((issue) =>
                  issue.id === id ? original : issue
                ),
              }));
            }
            handleStoreError(error, 'IssueStore.updateIssue');
          }
        }
      },

      deleteIssue: async (id) => {
        // 원본 저장 (롤백용)
        const original = get().issues.find((issue) => issue.id === id);

        // 낙관적 업데이트
        set((state) => ({
          issues: state.issues.filter((issue) => issue.id !== id),
        }));

        // Supabase에서 삭제
        if (get().useSupabase) {
          try {
            await db.deleteIssueItem(id);
          } catch (error) {
            // 롤백
            if (original) {
              set((state) => ({ issues: [...state.issues, original] }));
            }
            handleStoreError(error, 'IssueStore.deleteIssue');
          }
        }
      },

      updateIssueStatus: async (id, status) => {
        // 원본 저장 (롤백용)
        const original = get().issues.find((issue) => issue.id === id);

        // 낙관적 업데이트
        set((state) => ({
          issues: state.issues.map((issue) =>
            issue.id === id
              ? { ...issue, status, updatedAt: new Date().toISOString() }
              : issue
          ),
        }));

        // Supabase에 저장
        if (get().useSupabase) {
          try {
            await db.updateIssueItem(id, { status });
          } catch (error) {
            // 롤백
            if (original) {
              set((state) => ({
                issues: state.issues.map((issue) =>
                  issue.id === id ? original : issue
                ),
              }));
            }
            handleStoreError(error, 'IssueStore.updateIssueStatus');
          }
        }
      },

      getIssuesByYear: (year) => {
        return get().issues.filter((issue) => issue.year === year);
      },

      getIssuesByMonth: (year, month) => {
        return get().issues.filter((issue) => issue.year === year && issue.month === month);
      },

      getOpenIssues: () => {
        return get().issues.filter((issue) => issue.status === 'open' || issue.status === 'in_progress');
      },

      getCriticalIssues: () => {
        return get().issues.filter((issue) => issue.priority === 'critical' && issue.status !== 'closed');
      },

      resetToInitial: () => {
        set({ issues: INITIAL_ISSUES });
      },
    }),
    {
      name: 'muse-issues',
      partialize: (state) => ({ issues: state.issues }),
    }
  )
);
