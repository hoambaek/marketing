'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import { useMasterPlanStore } from '@/lib/store/masterplan-store';
import { useBudgetStore } from '@/lib/store/budget-store';
import { useIssueStore } from '@/lib/store/issue-store';
import { useInventoryStore } from '@/lib/store/inventory-store';
import {
  MONTHS_INFO,
  PHASE_INFO,
  CATEGORY_LABELS,
  TaskCategory,
  AVAILABLE_YEARS,
  ISSUE_PRIORITY_LABELS,
  ISSUE_PRIORITY_COLORS,
} from '@/lib/types';
import {
  CheckCircle2,
  Clock,
  Circle,
  ArrowRight,
  Calendar,
  Target,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Wallet,
  Wine,
  BarChart3,
  AlertCircle,
  Activity,
  Layers,
  Package,
  Zap,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// Animation Variants
// ═══════════════════════════════════════════════════════════════════════════

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

const cardHover = {
  rest: { scale: 1 },
  hover: { scale: 1.02, transition: { duration: 0.3 } },
};

// ═══════════════════════════════════════════════════════════════════════════
// Phase Colors
// ═══════════════════════════════════════════════════════════════════════════

const phaseColors = {
  1: { primary: '#3B82F6', gradient: 'from-blue-500/20 to-blue-600/5', bg: 'bg-blue-500' },
  2: { primary: '#10B981', gradient: 'from-emerald-500/20 to-emerald-600/5', bg: 'bg-emerald-500' },
  3: { primary: '#F59E0B', gradient: 'from-amber-500/20 to-amber-600/5', bg: 'bg-amber-500' },
  4: { primary: '#EC4899', gradient: 'from-rose-500/20 to-rose-600/5', bg: 'bg-rose-500' },
  5: { primary: '#8B7355', gradient: 'from-amber-700/20 to-amber-800/5', bg: 'bg-amber-700' },
};

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

function getDaysUntilLaunch(): number {
  const launchDate = new Date('2026-08-01');
  const today = new Date();
  const diffTime = launchDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

function getCurrentPhase(): number {
  const today = new Date();
  const targetYear = 2026;

  if (today.getFullYear() < targetYear) return 1;
  if (today.getFullYear() > targetYear) return 5;

  const month = today.getMonth() + 1;
  for (const phase of PHASE_INFO) {
    if (phase.months.includes(month)) return phase.id;
  }
  return 1;
}

function formatCurrency(amount: number): string {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억`;
  } else if (amount >= 10000) {
    return `${(amount / 10000).toFixed(0)}만`;
  }
  return amount.toLocaleString();
}

// ═══════════════════════════════════════════════════════════════════════════
// Circular Progress Component
// ═══════════════════════════════════════════════════════════════════════════

function CircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
  children
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            strokeDasharray: circumference,
          }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#b7916e" />
            <stop offset="100%" stopColor="#d4c4a8" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function DashboardPage() {
  const {
    getTotalProgress,
    getProgressByMonth,
    tasks,
    mustDoItems,
    isInitialized: masterplanInitialized,
    initializeFromSupabase: initMasterplan
  } = useMasterPlanStore();

  const {
    budgetItems,
    expenseItems,
    getTotalBudgeted,
    getTotalSpent,
    isInitialized: budgetInitialized,
    initializeFromSupabase: initBudget
  } = useBudgetStore();

  const {
    issues,
    getOpenIssues,
    getCriticalIssues,
    isInitialized: issueInitialized,
    initializeFromSupabase: initIssues
  } = useIssueStore();

  const {
    getTotalInventoryValue,
    isInitialized: inventoryInitialized,
    initializeInventory
  } = useInventoryStore();

  const timelineRef = useRef<HTMLDivElement>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Initialize stores
  useEffect(() => {
    if (!masterplanInitialized) initMasterplan();
    if (!budgetInitialized) initBudget();
    if (!issueInitialized) initIssues();
    if (!inventoryInitialized) initializeInventory();
  }, [masterplanInitialized, budgetInitialized, issueInitialized, inventoryInitialized, initMasterplan, initBudget, initIssues, initializeInventory]);

  // Computed values
  const totalProgress = getTotalProgress();
  const daysUntilLaunch = getDaysUntilLaunch();
  const currentPhase = getCurrentPhase();
  const currentPhaseInfo = PHASE_INFO.find(p => p.id === currentPhase);

  const statusCounts = {
    done: tasks.filter((t) => t.status === 'done').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    pending: tasks.filter((t) => t.status === 'pending').length,
  };

  const totalBudget = getTotalBudgeted(selectedYear);
  const totalSpent = getTotalSpent(selectedYear);
  const budgetUsagePercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const openIssues = getOpenIssues();
  const criticalIssues = getCriticalIssues();

  const inventory = getTotalInventoryValue();
  const soldPercent = inventory.totalBottles > 0
    ? Math.round((inventory.sold / inventory.totalBottles) * 100)
    : 0;

  const mustDoCompleted = mustDoItems.filter(m => m.done).length;
  const mustDoTotal = mustDoItems.length;
  const mustDoPercent = mustDoTotal > 0 ? Math.round((mustDoCompleted / mustDoTotal) * 100) : 0;

  // This month's tasks
  const currentMonth = new Date().getMonth() + 1;
  const thisMonthTasks = tasks.filter((t) => t.year === selectedYear && t.month === currentMonth);
  const thisWeekTasks = tasks.filter((t) => t.year === selectedYear && t.month === 1 && t.week === 1).slice(0, 4);

  // Timeline scroll
  const scrollTimeline = (direction: 'left' | 'right') => {
    if (timelineRef.current) {
      const scrollAmount = 400;
      timelineRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const getPhaseBarPosition = (phase: typeof PHASE_INFO[0]) => {
    const startMonth = Math.min(...phase.months);
    const endMonth = Math.max(...phase.months);
    const startWeek = (startMonth - 1) * 4;
    const endWeek = endMonth * 4;
    return { startWeek, endWeek, width: endWeek - startWeek };
  };

  return (
    <div className="min-h-screen relative overflow-hidden pb-20">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#070b12] via-[#0a1018] to-[#0d1525]" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#b7916e]/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/[0.02] rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Hero Section - Compact on Mobile */}
      <section className="px-4 sm:px-6 lg:px-8 pt-8 sm:pt-20 pb-4 sm:pb-6">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4"
          >
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3"
              >
                <div className="hidden sm:block h-px w-8 bg-gradient-to-r from-[#b7916e] to-transparent" />
                <span className="text-[#b7916e] text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.25em] uppercase font-light">
                  Launch Masterplan
                </span>
              </motion.div>
              <h1
                className="text-3xl sm:text-5xl lg:text-6xl text-white/95 tracking-tight"
                style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
              >
                Dashboard
              </h1>
            </div>

            {/* Year Selector */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center gap-1 sm:gap-2"
            >
              {AVAILABLE_YEARS.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    selectedYear === year
                      ? 'bg-[#b7916e]/20 text-[#d4c4a8] border border-[#b7916e]/30'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
                  }`}
                  style={{ fontFamily: "var(--font-cormorant), serif" }}
                >
                  {year}
                </button>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Main Dashboard Grid */}
      <section className="px-4 sm:px-6 lg:px-8 py-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-7xl"
        >
          {/* Top Row - Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
            {/* Launch Countdown */}
            <motion.div variants={itemVariants} className="col-span-2 lg:col-span-1">
              <div className="relative h-full rounded-2xl sm:rounded-3xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#b7916e]/10 to-[#b7916e]/[0.02]" />
                <div className="absolute inset-0 border border-[#b7916e]/20 rounded-2xl sm:rounded-3xl" />

                <div className="relative p-4 sm:p-5 flex items-center gap-4">
                  <CircularProgress value={Math.min(100, 100 - (daysUntilLaunch / 600 * 100))} size={80} strokeWidth={6}>
                    <div className="text-center">
                      <p className="text-xl sm:text-2xl font-light text-[#d4c4a8]" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                        {daysUntilLaunch}
                      </p>
                      <p className="text-[8px] text-white/40 uppercase tracking-wider">days</p>
                    </div>
                  </CircularProgress>
                  <div>
                    <p className="text-xs text-white/40 mb-1">런칭까지</p>
                    <p className="text-lg sm:text-xl text-white/90 font-light" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                      D-{daysUntilLaunch}
                    </p>
                    <p className="text-[10px] text-[#b7916e]/60 mt-1">2026년 8월 1일</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Overall Progress */}
            <motion.div variants={itemVariants} className="col-span-2 lg:col-span-1">
              <div className="relative h-full rounded-2xl sm:rounded-3xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01]" />
                <div className="absolute inset-0 border border-white/[0.08] rounded-2xl sm:rounded-3xl" />

                <div className="relative p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-white/40">전체 진행률</span>
                    </div>
                    <span className="text-2xl sm:text-3xl text-white/90 font-light" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                      {totalProgress}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${totalProgress}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-white/30">
                    <span>{statusCounts.done} 완료</span>
                    <span>{statusCounts.in_progress} 진행중</span>
                    <span>{statusCounts.pending} 대기</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Budget Overview */}
            <motion.div variants={itemVariants}>
              <div className="relative h-full rounded-2xl sm:rounded-3xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01]" />
                <div className="absolute inset-0 border border-white/[0.08] rounded-2xl sm:rounded-3xl" />

                <div className="relative p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-white/40">예산</span>
                  </div>
                  <p className="text-xl sm:text-2xl text-white/90 font-light mb-1" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                    {formatCurrency(totalSpent)}
                  </p>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-1">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
                      transition={{ duration: 1, delay: 0.6 }}
                      className={`h-full rounded-full ${budgetUsagePercent > 80 ? 'bg-rose-500' : 'bg-blue-500'}`}
                    />
                  </div>
                  <p className="text-[10px] text-white/30">
                    {formatCurrency(totalBudget)} 중 {budgetUsagePercent}%
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Inventory */}
            <motion.div variants={itemVariants}>
              <div className="relative h-full rounded-2xl sm:rounded-3xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01]" />
                <div className="absolute inset-0 border border-white/[0.08] rounded-2xl sm:rounded-3xl" />

                <div className="relative p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Wine className="w-4 h-4 text-violet-400" />
                    <span className="text-xs text-white/40">재고</span>
                  </div>
                  <p className="text-xl sm:text-2xl text-white/90 font-light mb-1" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                    {inventory.available}<span className="text-sm text-white/40">병</span>
                  </p>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-emerald-400">{inventory.sold} 판매</span>
                    <span className="text-white/20">|</span>
                    <span className="text-amber-400">{inventory.reserved} 예약</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Second Row - Status Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
            {/* Current Phase */}
            <motion.div variants={itemVariants}>
              <div className="relative h-full rounded-2xl sm:rounded-3xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-violet-500/[0.02]" />
                <div className="absolute inset-0 border border-violet-500/20 rounded-2xl sm:rounded-3xl" />

                <div className="relative p-5 sm:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Layers className="w-4 h-4 text-violet-400" />
                        <span className="text-xs text-white/40">현재 단계</span>
                      </div>
                      <p className="text-2xl sm:text-3xl text-white/90 font-light" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                        Phase {currentPhase}
                      </p>
                      <p className="text-sm text-violet-400 mt-1">{currentPhaseInfo?.name}</p>
                    </div>
                    <div className="flex gap-1">
                      {PHASE_INFO.map((phase) => (
                        <div
                          key={phase.id}
                          className={`w-2 h-8 rounded-full ${
                            phase.id <= currentPhase
                              ? 'bg-violet-500'
                              : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">{currentPhaseInfo?.description}</p>
                </div>
              </div>
            </motion.div>

            {/* Critical Issues */}
            <motion.div variants={itemVariants}>
              <div className="relative h-full rounded-2xl sm:rounded-3xl overflow-hidden">
                <div className={`absolute inset-0 ${criticalIssues.length > 0 ? 'bg-gradient-to-br from-rose-500/10 to-rose-500/[0.02]' : 'bg-gradient-to-br from-white/[0.04] to-white/[0.01]'}`} />
                <div className={`absolute inset-0 border ${criticalIssues.length > 0 ? 'border-rose-500/20' : 'border-white/[0.08]'} rounded-2xl sm:rounded-3xl`} />

                <div className="relative p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`w-4 h-4 ${criticalIssues.length > 0 ? 'text-rose-400' : 'text-white/40'}`} />
                      <span className="text-xs text-white/40">이슈 현황</span>
                    </div>
                    <Link href="/issues" className="text-xs text-[#b7916e] hover:text-[#d4c4a8] transition-colors">
                      전체 보기 →
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-white/[0.04]">
                      <p className="text-2xl text-white/90 font-light" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                        {openIssues.length}
                      </p>
                      <p className="text-[10px] text-white/40">미해결</p>
                    </div>
                    <div className={`p-3 rounded-xl ${criticalIssues.length > 0 ? 'bg-rose-500/20' : 'bg-white/[0.04]'}`}>
                      <p className={`text-2xl font-light ${criticalIssues.length > 0 ? 'text-rose-400' : 'text-white/90'}`} style={{ fontFamily: "var(--font-cormorant), serif" }}>
                        {criticalIssues.length}
                      </p>
                      <p className="text-[10px] text-white/40">긴급</p>
                    </div>
                  </div>

                  {criticalIssues.length > 0 && (
                    <div className="mt-3 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                      <p className="text-xs text-rose-300 truncate">
                        ⚠️ {criticalIssues[0].title}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Must-Do Progress */}
            <motion.div variants={itemVariants}>
              <div className="relative h-full rounded-2xl sm:rounded-3xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-amber-500/[0.02]" />
                <div className="absolute inset-0 border border-amber-500/20 rounded-2xl sm:rounded-3xl" />

                <div className="relative p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-amber-400" />
                      <span className="text-xs text-white/40">Must-Do</span>
                    </div>
                    <Link href="/checklist" className="text-xs text-[#b7916e] hover:text-[#d4c4a8] transition-colors">
                      전체 보기 →
                    </Link>
                  </div>

                  <div className="flex items-end justify-between mb-3">
                    <p className="text-3xl text-white/90 font-light" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                      {mustDoCompleted}<span className="text-lg text-white/40">/{mustDoTotal}</span>
                    </p>
                    <p className="text-sm text-amber-400">{mustDoPercent}%</p>
                  </div>

                  <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${mustDoPercent}%` }}
                      transition={{ duration: 1, delay: 0.7 }}
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Third Row - Tasks & Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-6">
            {/* This Week Tasks */}
            <motion.div variants={itemVariants}>
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01]" />
                <div className="absolute inset-0 border border-white/[0.08] rounded-2xl sm:rounded-3xl" />

                <div className="relative p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#b7916e]" />
                      <span className="text-sm text-white/60">이번 주 업무</span>
                    </div>
                    <Link href="/month/1" className="text-xs text-[#b7916e] hover:text-[#d4c4a8] transition-colors">
                      전체 보기 →
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {thisWeekTasks.length > 0 ? thisWeekTasks.map((task) => (
                      <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                        {task.status === 'done' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        ) : task.status === 'in_progress' ? (
                          <Clock className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-white/30 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${task.status === 'done' ? 'text-white/40 line-through' : 'text-white/80'}`}>
                            {task.title}
                          </p>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] bg-white/[0.06] text-white/50">
                            {CATEGORY_LABELS[task.category as TaskCategory]}
                          </span>
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-white/30 text-center py-4">이번 주 업무가 없습니다</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Task Statistics */}
            <motion.div variants={itemVariants}>
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01]" />
                <div className="absolute inset-0 border border-white/[0.08] rounded-2xl sm:rounded-3xl" />

                <div className="relative p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <BarChart3 className="w-4 h-4 text-[#b7916e]" />
                    <span className="text-sm text-white/60">업무 현황</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                      <p className="text-2xl text-white/90 font-light" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                        {statusCounts.done}
                      </p>
                      <p className="text-[10px] text-white/40">완료</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <Clock className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                      <p className="text-2xl text-white/90 font-light" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                        {statusCounts.in_progress}
                      </p>
                      <p className="text-[10px] text-white/40">진행중</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                      <Circle className="w-5 h-5 text-white/40 mx-auto mb-2" />
                      <p className="text-2xl text-white/90 font-light" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                        {statusCounts.pending}
                      </p>
                      <p className="text-[10px] text-white/40">대기</p>
                    </div>
                  </div>

                  {/* Monthly Progress Bar */}
                  <div className="mt-5 pt-4 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/40">월별 진행률</span>
                      <span className="text-xs text-white/60">{selectedYear}</span>
                    </div>
                    <div className="flex gap-1">
                      {MONTHS_INFO.slice(0, 8).map((month) => {
                        const progress = getProgressByMonth(selectedYear, month.id);
                        return (
                          <div key={month.id} className="flex-1">
                            <div className="h-12 rounded bg-white/[0.04] relative overflow-hidden">
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${progress}%` }}
                                transition={{ duration: 0.8, delay: 0.8 + month.id * 0.05 }}
                                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#b7916e] to-[#d4c4a8]"
                              />
                            </div>
                            <p className="text-[8px] text-white/30 text-center mt-1">{month.id}월</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Phase Overview (Bottom) */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-px bg-white/20" />
              <span className="text-white/30 text-xs tracking-[0.2em] uppercase">Phase Overview</span>
            </div>

            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01]" />
              <div className="absolute inset-0 border border-white/[0.08] rounded-2xl sm:rounded-3xl" />

              {/* Timeline Header */}
              <div className="relative flex items-center justify-between p-4 border-b border-white/[0.06]">
                <h2 className="text-lg text-white/90" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                  {selectedYear} Roadmap
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => scrollTimeline('left')}
                    className="p-2 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/[0.04] transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scrollTimeline('right')}
                    className="p-2 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/[0.04] transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Timeline Container */}
              <div
                ref={timelineRef}
                className="relative flex overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
              >
                {/* Phase Color Indicators */}
                <div className="w-8 sm:w-10 flex-shrink-0 border-r border-white/[0.06] bg-[#0a0f1a]/80">
                  <div className="h-10 sm:h-12 border-b border-white/[0.06]" />
                  {PHASE_INFO.map((phase) => {
                    const colors = phaseColors[phase.id as keyof typeof phaseColors];
                    return (
                      <div
                        key={phase.id}
                        className="h-10 sm:h-12 flex items-center justify-center border-b border-white/[0.04]"
                      >
                        <div
                          className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full"
                          style={{ backgroundColor: colors.primary }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Timeline Area */}
                <div className="flex-1">
                  {/* Month Header */}
                  <div className="flex h-10 sm:h-12 border-b border-white/[0.06] bg-white/[0.02]">
                    {MONTHS_INFO.map((month) => (
                      <div key={month.id} className="flex-shrink-0 w-[160px] sm:w-[240px]">
                        <Link href={`/month/${month.id}`}>
                          <div className="h-5 sm:h-6 flex items-center justify-center border-b border-white/[0.04] hover:bg-white/[0.04] transition-colors cursor-pointer">
                            <span className="text-[10px] sm:text-xs font-medium text-white/60">
                              {month.name}
                            </span>
                            {month.id === 1 && (
                              <span className="ml-1 w-1.5 h-1.5 rounded-full bg-[#b7916e] animate-pulse" />
                            )}
                          </div>
                        </Link>
                        <div className="h-5 sm:h-6 flex">
                          {[1, 2, 3, 4].map((week) => (
                            <div
                              key={week}
                              className="flex-1 flex items-center justify-center text-[7px] sm:text-[9px] text-white/20 border-r border-white/[0.04]"
                            >
                              W{week}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Phase Bars */}
                  {PHASE_INFO.map((phase, phaseIndex) => {
                    const { startWeek, width } = getPhaseBarPosition(phase);
                    const phaseProgress = phase.months.reduce(
                      (acc, monthId) => acc + getProgressByMonth(selectedYear, monthId),
                      0
                    ) / phase.months.length;
                    const colors = phaseColors[phase.id as keyof typeof phaseColors];

                    return (
                      <div
                        key={phase.id}
                        className="h-10 sm:h-12 flex items-center border-b border-white/[0.04] relative"
                        style={{ width: '1920px' }}
                      >
                        {/* Grid lines */}
                        {Array.from({ length: 48 }).map((_, i) => (
                          <div
                            key={i}
                            className="absolute top-0 bottom-0 border-r border-white/[0.03]"
                            style={{ left: `${(i + 1) * 40}px` }}
                          />
                        ))}

                        {/* Phase Bar */}
                        <motion.div
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: `${width * 40 - 8}px`, opacity: 1 }}
                          transition={{ duration: 0.8, delay: 0.8 + phaseIndex * 0.1 }}
                          className={`absolute h-7 sm:h-8 rounded-lg ${colors.bg} shadow-lg cursor-pointer overflow-hidden`}
                          style={{ left: `${startWeek * 40 + 4}px` }}
                        >
                          <Link href={`/month/${phase.months[0]}`} className="block h-full relative">
                            <div
                              className="absolute inset-0 bg-white/20"
                              style={{ width: `${phaseProgress}%` }}
                            />
                            <div className="relative h-full px-2 sm:px-3 flex items-center justify-between">
                              <span className="text-[10px] sm:text-xs font-medium text-white truncate">
                                {phase.description}
                              </span>
                              <span className="text-[9px] sm:text-[10px] text-white/80 ml-1 flex-shrink-0">
                                {Math.round(phaseProgress)}%
                              </span>
                            </div>
                          </Link>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="relative p-3 border-t border-white/[0.06] flex flex-wrap gap-4">
                {PHASE_INFO.map((phase) => {
                  const colors = phaseColors[phase.id as keyof typeof phaseColors];
                  return (
                    <div key={phase.id} className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded"
                        style={{ backgroundColor: colors.primary }}
                      />
                      <span className="text-[9px] sm:text-[10px] text-white/40">
                        P{phase.id}: {phase.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Bottom Decoration */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 1.5 }}
        className="relative py-12 px-6"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <span
            className="text-white/10 text-xs tracking-[0.3em] uppercase"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          >
            Muse de Marée
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </motion.div>
    </div>
  );
}
