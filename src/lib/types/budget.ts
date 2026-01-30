/**
 * 수입/지출 관리 타입 정의
 */

// 카테고리 (수입/지출 공통)
export type BudgetCategory = 'marketing' | 'operation' | 'design' | 'filming' | 'pr' | 'b2b' | 'packaging' | 'event' | 'sales' | 'other';

// 카테고리 라벨
export const BUDGET_CATEGORY_LABELS: Record<BudgetCategory, string> = {
  marketing: '마케팅',
  operation: '운영',
  design: '디자인',
  filming: '촬영',
  pr: 'PR',
  b2b: 'B2B',
  packaging: '패키징',
  event: '이벤트',
  sales: '판매',
  other: '기타',
};

// 카테고리 색상
export const BUDGET_CATEGORY_COLORS: Record<BudgetCategory, { bg: string; text: string; border: string }> = {
  marketing: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
  operation: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  design: { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30' },
  filming: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  pr: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  b2b: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  packaging: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  event: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
  sales: { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/30' },
  other: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
};

// 수입 항목
export interface IncomeItem {
  id: string;
  year: number;
  month: number;
  category: BudgetCategory;
  amount: number; // 수입 금액
  description?: string;
  date: string;
  source?: string; // 수입처
  notes?: string;
}

// 지출 내역
export interface ExpenseItem {
  id: string;
  year: number;
  month: number;
  category: BudgetCategory;
  amount: number;
  description: string;
  vendor?: string; // 거래처
  date: string;
  receipt?: string; // 영수증 URL
  notes?: string;
}

// Legacy alias (하위 호환성)
export type BudgetItem = IncomeItem;
