'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { useBudgetStore } from '@/lib/store/budget-store';
import { toast } from '@/lib/store/toast-store';
import {
  BudgetItem,
  ExpenseItem,
  BudgetCategory,
  BUDGET_CATEGORY_LABELS,
  BUDGET_CATEGORY_COLORS,
  MONTHS_INFO,
  AVAILABLE_YEARS,
} from '@/lib/types';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Receipt,
  Plus,
  Filter,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Calendar,
  Building2,
} from 'lucide-react';
import BudgetModal from '@/components/BudgetModal';
import ExpenseModal from '@/components/ExpenseModal';
import ExpenseLineChart from '@/components/ExpenseLineChart';

// ═══════════════════════════════════════════════════════════════════════════
// 애니메이션 변형
// ═══════════════════════════════════════════════════════════════════════════

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// 금액 포맷터
// ═══════════════════════════════════════════════════════════════════════════

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatCompact = (amount: number) => {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억`;
  }
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(0)}만`;
  }
  return amount.toLocaleString();
};

// ═══════════════════════════════════════════════════════════════════════════
// 메인 컴포넌트
// ═══════════════════════════════════════════════════════════════════════════

export default function BudgetPage() {
  const {
    budgetItems,
    expenseItems,
    isLoading,
    isInitialized,
    initializeFromSupabase,
    addBudget,
    updateBudget,
    deleteBudget,
    addExpense,
    updateExpense,
    deleteExpense,
    getBudgetByYear,
    getExpensesByYear,
    getTotalBudgeted,
    getTotalSpent,
  } = useBudgetStore();

  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'monthly' | 'expenses'>('overview');

  // Modal states
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetItem | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [defaultCategory, setDefaultCategory] = useState<BudgetCategory>('marketing');

  // Initialize from Supabase
  useEffect(() => {
    if (!isInitialized) {
      initializeFromSupabase();
    }
  }, [isInitialized, initializeFromSupabase]);

  // Computed values
  const yearBudgets = useMemo(() => getBudgetByYear(selectedYear), [budgetItems, selectedYear, getBudgetByYear]);
  const yearExpenses = useMemo(() => getExpensesByYear(selectedYear), [expenseItems, selectedYear, getExpensesByYear]);
  const totalBudgeted = useMemo(() => getTotalBudgeted(selectedYear), [budgetItems, selectedYear, getTotalBudgeted]);
  const totalSpent = useMemo(() => getTotalSpent(selectedYear), [expenseItems, selectedYear, getTotalSpent]);
  const remaining = totalBudgeted - totalSpent;
  const utilizationRate = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const categories = Object.keys(BUDGET_CATEGORY_LABELS) as BudgetCategory[];
    return categories.map((category) => {
      const budgeted = yearBudgets
        .filter((b) => b.category === category)
        .reduce((sum, b) => sum + b.budgeted, 0);
      const spent = yearExpenses
        .filter((e) => e.category === category)
        .reduce((sum, e) => sum + e.amount, 0);
      return {
        category,
        budgeted,
        spent,
        remaining: budgeted - spent,
        percentage: budgeted > 0 ? (spent / budgeted) * 100 : 0,
      };
    }).filter((c) => c.budgeted > 0 || c.spent > 0);
  }, [yearBudgets, yearExpenses]);

  // Monthly breakdown
  const monthlyBreakdown = useMemo(() => {
    return MONTHS_INFO.map((month) => {
      const monthBudgets = yearBudgets.filter((b) => b.month === month.id);
      const monthExpenses = yearExpenses.filter((e) => e.month === month.id);
      const budgeted = monthBudgets.reduce((sum, b) => sum + b.budgeted, 0);
      const spent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      return {
        ...month,
        budgeted,
        spent,
        remaining: budgeted - spent,
        percentage: budgeted > 0 ? (spent / budgeted) * 100 : 0,
        expenseCount: monthExpenses.length,
      };
    });
  }, [yearBudgets, yearExpenses]);

  // Handlers
  const handleAddBudget = (category?: BudgetCategory, month?: number) => {
    setEditingBudget(null);
    if (category) setDefaultCategory(category);
    if (month) setSelectedMonth(month);
    setIsBudgetModalOpen(true);
  };

  const handleEditBudget = (budget: BudgetItem) => {
    setEditingBudget(budget);
    setIsBudgetModalOpen(true);
  };

  const handleDeleteBudget = async (id: string) => {
    if (window.confirm('이 예산 항목을 삭제하시겠습니까?')) {
      await deleteBudget(id);
      toast.success('예산이 삭제되었습니다');
    }
  };

  const handleSaveBudget = async (data: Omit<BudgetItem, 'id'>) => {
    if (editingBudget) {
      await updateBudget(editingBudget.id, data);
      toast.success('예산이 수정되었습니다');
    } else {
      await addBudget(data);
      toast.success('예산이 추가되었습니다');
    }
    setIsBudgetModalOpen(false);
  };

  const handleAddExpense = (category?: BudgetCategory, month?: number) => {
    setEditingExpense(null);
    if (category) setDefaultCategory(category);
    if (month) setSelectedMonth(month);
    setIsExpenseModalOpen(true);
  };

  const handleEditExpense = (expense: ExpenseItem) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const handleDeleteExpense = async (id: string) => {
    if (window.confirm('이 지출 내역을 삭제하시겠습니까?')) {
      await deleteExpense(id);
      toast.success('지출이 삭제되었습니다');
    }
  };

  const handleSaveExpense = async (data: Omit<ExpenseItem, 'id'>) => {
    if (editingExpense) {
      await updateExpense(editingExpense.id, data);
      toast.success('지출이 수정되었습니다');
    } else {
      await addExpense(data);
      toast.success('지출이 추가되었습니다');
    }
    setIsExpenseModalOpen(false);
  };

  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white/60"
        >
          로딩 중...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0d1525] to-[#0a0f1a]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(183, 145, 110, 0.15), transparent),
                              radial-gradient(ellipse 60% 40% at 80% 60%, rgba(59, 130, 246, 0.08), transparent),
                              radial-gradient(ellipse 50% 30% at 20% 80%, rgba(16, 185, 129, 0.06), transparent)`
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative pt-16 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative"
          >
            {/* Decorative Line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="absolute -left-4 sm:-left-6 top-1/2 w-12 sm:w-16 h-px bg-gradient-to-r from-[#b7916e] to-transparent origin-left"
            />

            <div className="pl-10 sm:pl-14 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-[#b7916e] text-xs sm:text-sm tracking-[0.3em] uppercase mb-3 sm:mb-4 font-light"
                >
                  Financial Management
                </motion.p>

                <h1
                  className="text-4xl sm:text-5xl lg:text-6xl text-white/95 mb-4 sm:mb-6 leading-[1.1] tracking-tight"
                  style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                >
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="block"
                  >
                    Budget
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="block text-transparent bg-clip-text bg-gradient-to-r from-[#b7916e] via-[#d4c4a8] to-[#b7916e]"
                  >
                    Management
                  </motion.span>
                </h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.8 }}
                  className="text-white/40 text-base sm:text-lg max-w-md font-light leading-relaxed"
                >
                  마케팅 예산 및 지출 관리
                </motion.p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Year Selector & Actions */}
      <section className="px-4 sm:px-6 lg:px-8 mb-6 sm:mb-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-between gap-3 sm:gap-4"
          >
            {/* Year Selector */}
            <div className="flex items-center gap-2">
              {AVAILABLE_YEARS.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl transition-all ${
                    selectedYear === year
                      ? 'bg-[#b7916e]/20 text-[#d4c4a8] border border-[#b7916e]/30'
                      : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAddBudget()}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-[#b7916e] bg-[#b7916e]/10 hover:bg-[#b7916e]/20 active:bg-[#b7916e]/30 rounded-lg sm:rounded-xl transition-all font-medium"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">예산 추가</span>
              </button>
              <button
                onClick={() => handleAddExpense()}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/30 rounded-lg sm:rounded-xl transition-all font-medium"
              >
                <Receipt className="w-4 h-4" />
                <span className="hidden sm:inline">지출 추가</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="px-4 sm:px-6 lg:px-8 mb-6 sm:mb-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-5"
          >
            {/* Total Budget */}
            <motion.div variants={itemVariants} className="relative rounded-xl sm:rounded-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
              <div className="absolute inset-0 border border-white/[0.06] rounded-xl sm:rounded-2xl" />
              <div className="relative p-3 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                  <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-[#b7916e]/20 border border-[#b7916e]/20">
                    <Wallet className="w-3.5 sm:w-5 h-3.5 sm:h-5 text-[#d4c4a8]" />
                  </div>
                  <p className="text-[10px] sm:text-sm text-white/40">총 예산</p>
                </div>
                <p
                  className="text-xl sm:text-3xl text-white/90"
                  style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                >
                  {formatCompact(totalBudgeted)}
                  <span className="text-xs sm:text-base text-white/30"> 원</span>
                </p>
              </div>
            </motion.div>

            {/* Total Spent */}
            <motion.div variants={itemVariants} className="relative rounded-xl sm:rounded-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
              <div className="absolute inset-0 border border-white/[0.06] rounded-xl sm:rounded-2xl" />
              <div className="relative p-3 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                  <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-rose-500/20 border border-rose-500/20">
                    <TrendingDown className="w-3.5 sm:w-5 h-3.5 sm:h-5 text-rose-400" />
                  </div>
                  <p className="text-[10px] sm:text-sm text-white/40">총 지출</p>
                </div>
                <p
                  className="text-xl sm:text-3xl text-rose-400"
                  style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                >
                  {formatCompact(totalSpent)}
                  <span className="text-xs sm:text-base text-rose-400/50"> 원</span>
                </p>
              </div>
            </motion.div>

            {/* Remaining */}
            <motion.div variants={itemVariants} className="relative rounded-xl sm:rounded-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
              <div className="absolute inset-0 border border-white/[0.06] rounded-xl sm:rounded-2xl" />
              <div className="relative p-3 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                  <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-emerald-500/20 border border-emerald-500/20">
                    <PiggyBank className="w-3.5 sm:w-5 h-3.5 sm:h-5 text-emerald-400" />
                  </div>
                  <p className="text-[10px] sm:text-sm text-white/40">잔여 예산</p>
                </div>
                <p
                  className={`text-xl sm:text-3xl ${remaining >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                  style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                >
                  {formatCompact(Math.abs(remaining))}
                  <span className={`text-xs sm:text-base ${remaining >= 0 ? 'text-emerald-400/50' : 'text-red-400/50'}`}> 원</span>
                </p>
              </div>
            </motion.div>

            {/* Utilization Rate */}
            <motion.div variants={itemVariants} className="relative rounded-xl sm:rounded-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
              <div className="absolute inset-0 border border-white/[0.06] rounded-xl sm:rounded-2xl" />
              <div className="relative p-3 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                  <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-blue-500/20 border border-blue-500/20">
                    <TrendingUp className="w-3.5 sm:w-5 h-3.5 sm:h-5 text-blue-400" />
                  </div>
                  <p className="text-[10px] sm:text-sm text-white/40">집행률</p>
                </div>
                <p
                  className={`text-xl sm:text-3xl ${utilizationRate > 100 ? 'text-red-400' : utilizationRate > 80 ? 'text-amber-400' : 'text-blue-400'}`}
                  style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                >
                  {utilizationRate.toFixed(1)}
                  <span className={`text-xs sm:text-base ${utilizationRate > 100 ? 'text-red-400/50' : utilizationRate > 80 ? 'text-amber-400/50' : 'text-blue-400/50'}`}> %</span>
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* View Mode Tabs */}
      <section className="px-4 sm:px-6 lg:px-8 mb-4 sm:mb-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-1 p-1 bg-white/[0.02] rounded-xl border border-white/[0.06]">
            {[
              { id: 'overview', label: '카테고리별', icon: Filter },
              { id: 'monthly', label: '월별', icon: Calendar },
              { id: 'expenses', label: '지출내역', icon: Receipt },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id as typeof viewMode)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                  viewMode === tab.id
                    ? 'bg-white/[0.08] text-white'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                <tab.icon className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content Area */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Category View */}
            {viewMode === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-3 sm:space-y-4"
              >
                {categoryBreakdown.length === 0 ? (
                  <div className="text-center py-12 sm:py-20">
                    <Wallet className="w-12 sm:w-16 h-12 sm:h-16 mx-auto text-white/20 mb-4" />
                    <p className="text-white/40 text-sm sm:text-base mb-4">등록된 예산이 없습니다</p>
                    <button
                      onClick={() => handleAddBudget()}
                      className="px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm bg-[#b7916e]/20 text-[#d4c4a8] rounded-xl hover:bg-[#b7916e]/30 transition-all"
                    >
                      첫 예산 추가하기
                    </button>
                  </div>
                ) : (
                  categoryBreakdown.map((cat) => (
                    <motion.div
                      key={cat.category}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative rounded-xl sm:rounded-2xl overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
                      <div className="absolute inset-0 border border-white/[0.06] rounded-xl sm:rounded-2xl" />
                      <div className="relative p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className={`p-1.5 sm:p-2 rounded-lg ${BUDGET_CATEGORY_COLORS[cat.category].bg}`}>
                              <div className={`w-3 sm:w-4 h-3 sm:h-4 rounded-full ${BUDGET_CATEGORY_COLORS[cat.category].bg}`} />
                            </div>
                            <div>
                              <p className={`font-medium text-sm sm:text-base ${BUDGET_CATEGORY_COLORS[cat.category].text}`}>
                                {BUDGET_CATEGORY_LABELS[cat.category]}
                              </p>
                              <p className="text-[10px] sm:text-xs text-white/40">
                                {formatCurrency(cat.spent)} / {formatCurrency(cat.budgeted)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg sm:text-2xl font-medium ${cat.percentage > 100 ? 'text-red-400' : 'text-white/90'}`}
                              style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                            >
                              {cat.percentage.toFixed(1)}%
                            </p>
                            <p className={`text-[10px] sm:text-xs ${cat.remaining >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              잔여 {formatCompact(Math.abs(cat.remaining))}원
                            </p>
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-2 sm:h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(cat.percentage, 100)}%` }}
                            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className={`h-full rounded-full ${cat.percentage > 100 ? 'bg-red-500' : cat.percentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          />
                        </div>
                        {/* Actions */}
                        <div className="flex justify-end gap-2 mt-3">
                          <button
                            onClick={() => handleAddExpense(cat.category)}
                            className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs text-white/60 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all"
                          >
                            + 지출 추가
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}

            {/* Monthly View - Expense Line Chart */}
            {viewMode === 'monthly' && (
              <motion.div
                key="monthly"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <ExpenseLineChart expenses={yearExpenses} year={selectedYear} />

                {/* Monthly Summary Grid (Below Chart) */}
                <div className="mt-6 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                  {monthlyBreakdown.map((month) => (
                    <motion.div
                      key={month.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative rounded-xl overflow-hidden cursor-pointer group"
                      onClick={() => setSelectedMonth(month.id)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-white/[0.01] group-hover:from-white/[0.05] transition-all" />
                      <div className="absolute inset-0 border border-white/[0.06] rounded-xl group-hover:border-white/[0.1] transition-all" />
                      <div className="relative p-2.5 sm:p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs font-medium text-white/60">{month.shortName}</p>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            month.percentage > 100 ? 'bg-red-500' :
                            month.percentage > 80 ? 'bg-amber-500' :
                            month.percentage > 0 ? 'bg-emerald-500' :
                            'bg-white/20'
                          }`} />
                        </div>
                        <p
                          className="text-sm sm:text-base text-white/90"
                          style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                        >
                          {formatCompact(month.spent)}
                        </p>
                        <p className="text-[9px] text-white/30 mt-1">
                          {month.expenseCount}건
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Expenses View */}
            {viewMode === 'expenses' && (
              <motion.div
                key="expenses"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-2 sm:space-y-3"
              >
                {yearExpenses.length === 0 ? (
                  <div className="text-center py-12 sm:py-20">
                    <Receipt className="w-12 sm:w-16 h-12 sm:h-16 mx-auto text-white/20 mb-4" />
                    <p className="text-white/40 text-sm sm:text-base mb-4">등록된 지출이 없습니다</p>
                    <button
                      onClick={() => handleAddExpense()}
                      className="px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-all"
                    >
                      첫 지출 추가하기
                    </button>
                  </div>
                ) : (
                  yearExpenses.map((expense) => (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative rounded-xl overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-sm" />
                      <div className="absolute inset-0 border border-white/[0.06] rounded-xl" />
                      <div className="relative p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                        <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl ${BUDGET_CATEGORY_COLORS[expense.category].bg} ${BUDGET_CATEGORY_COLORS[expense.category].border} border`}>
                          <Receipt className={`w-4 sm:w-5 h-4 sm:h-5 ${BUDGET_CATEGORY_COLORS[expense.category].text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-medium text-white/90 truncate">{expense.description}</p>
                          <div className="flex items-center gap-2 text-[10px] sm:text-xs text-white/40">
                            <span className={BUDGET_CATEGORY_COLORS[expense.category].text}>
                              {BUDGET_CATEGORY_LABELS[expense.category]}
                            </span>
                            <span>•</span>
                            <span>{new Date(expense.date).toLocaleDateString('ko-KR')}</span>
                            {expense.vendor && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {expense.vendor}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className="text-base sm:text-lg font-medium text-white/90"
                            style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                          >
                            {formatCurrency(expense.amount)}
                          </p>
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditExpense(expense)}
                            className="p-1.5 sm:p-2 text-white/40 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all"
                          >
                            <Pencil className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="p-1.5 sm:p-2 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Modals */}
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        onSave={handleSaveBudget}
        onDelete={editingBudget ? () => handleDeleteBudget(editingBudget.id) : undefined}
        budget={editingBudget}
        defaultYear={selectedYear}
        defaultMonth={selectedMonth || 1}
        defaultCategory={defaultCategory}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpense}
        onDelete={editingExpense ? () => handleDeleteExpense(editingExpense.id) : undefined}
        expense={editingExpense}
        defaultYear={selectedYear}
        defaultMonth={selectedMonth || new Date().getMonth() + 1}
        defaultCategory={defaultCategory}
      />
    </div>
  );
}
