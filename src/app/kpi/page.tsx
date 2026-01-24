'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useMasterPlanStore } from '@/lib/store/masterplan-store';
import { KPICategory, KPIItem, MONTHS_INFO, AVAILABLE_YEARS } from '@/lib/types';
import { Footer } from '@/components/layout/Footer';
import {
  Instagram,
  Youtube,
  Mail,
  Globe,
  Newspaper,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  ArrowRight,
  Sparkles,
  Pencil,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  CalendarRange,
} from 'lucide-react';

const KPI_ICONS: Record<KPICategory, React.ReactNode> = {
  instagram: <Instagram className="w-5 h-5" />,
  youtube: <Youtube className="w-5 h-5" />,
  newsletter: <Mail className="w-5 h-5" />,
  website: <Globe className="w-5 h-5" />,
  press: <Newspaper className="w-5 h-5" />,
  b2b: <Briefcase className="w-5 h-5" />,
};

const KPI_COLORS: Record<KPICategory, { bg: string; text: string; accent: string; glow: string }> = {
  instagram: {
    bg: 'bg-pink-500/10',
    text: 'text-pink-400',
    accent: 'from-pink-500 to-pink-400',
    glow: 'rgba(236, 72, 153, 0.15)'
  },
  youtube: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    accent: 'from-red-500 to-red-400',
    glow: 'rgba(239, 68, 68, 0.15)'
  },
  newsletter: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    accent: 'from-emerald-500 to-emerald-400',
    glow: 'rgba(16, 185, 129, 0.15)'
  },
  website: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    accent: 'from-blue-500 to-blue-400',
    glow: 'rgba(59, 130, 246, 0.15)'
  },
  press: {
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    accent: 'from-violet-500 to-violet-400',
    glow: 'rgba(139, 92, 246, 0.15)'
  },
  b2b: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    accent: 'from-amber-500 to-amber-400',
    glow: 'rgba(245, 158, 11, 0.15)'
  },
};

const KPI_LABELS: Record<KPICategory, string> = {
  instagram: 'Instagram',
  youtube: 'YouTube',
  newsletter: '뉴스레터',
  website: '웹사이트',
  press: '보도자료',
  b2b: 'B2B',
};

// 수동 입력이 필요한 카테고리
const MANUAL_INPUT_CATEGORIES: KPICategory[] = ['press', 'b2b'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

// KPI 편집 모달 컴포넌트
function KPIEditModal({
  kpi,
  isOpen,
  onClose,
  onSave,
}: {
  kpi: KPIItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, value: number) => void;
}) {
  const [value, setValue] = useState<string>('');

  // 모달이 열릴 때 현재 값으로 초기화
  const handleOpen = () => {
    if (kpi) {
      setValue(kpi.current.toString());
    }
  };

  if (!isOpen || !kpi) return null;

  const colors = KPI_COLORS[kpi.category];

  const handleSave = () => {
    const numValue = parseInt(value) || 0;
    onSave(kpi.id, numValue);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onAnimationStart={handleOpen}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="relative rounded-2xl overflow-hidden mx-4">
              {/* Background */}
              <div className="absolute inset-0 bg-[#0d1525]" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />
              <div className="absolute inset-0 border border-white/[0.1] rounded-2xl" />

              {/* Content */}
              <div className="relative">
                {/* Header */}
                <div className={`px-6 py-4 ${colors.bg} border-b border-white/[0.06]`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl bg-[#0a0f1a]/50 ${colors.text}`}>
                        {KPI_ICONS[kpi.category]}
                      </div>
                      <div>
                        <h3 className={`font-medium ${colors.text}`}>
                          {KPI_LABELS[kpi.category]} KPI 수정
                        </h3>
                        <p className="text-xs text-white/30">{kpi.metric}</p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 rounded-xl hover:bg-white/[0.06] transition-colors text-white/40 hover:text-white/60"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6">
                  <div className="mb-6">
                    <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
                      현재 값
                    </label>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/90 text-2xl focus:outline-none focus:border-[#b7916e]/50 transition-colors"
                      style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                      placeholder="0"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm text-white/40 mb-6">
                    <span>목표: {kpi.target.toLocaleString()}</span>
                    <span>
                      달성률: {Math.round(((parseInt(value) || 0) / kpi.target) * 100)}%
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/60 hover:bg-white/[0.08] transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex-1 px-4 py-3 rounded-xl bg-[#b7916e]/20 border border-[#b7916e]/30 text-[#d4c4a8] hover:bg-[#b7916e]/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      저장
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function KPIPage() {
  const { kpiItems, updateKPI, isLoading, isInitialized } = useMasterPlanStore();
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<KPICategory | 'all'>('all');
  const [editingKPI, setEditingKPI] = useState<KPIItem | null>(null);
  const [isAllSelected, setIsAllSelected] = useState<boolean>(false);

  // Navigation handlers - with year transition
  const minYear = Math.min(...AVAILABLE_YEARS);
  const maxYear = Math.max(...AVAILABLE_YEARS);

  const goToPrevMonth = () => {
    if (isAllSelected) {
      // When "전체" is selected, go to December of the selected year
      setIsAllSelected(false);
      setSelectedMonth(12);
    } else if (selectedMonth > 1) {
      setSelectedMonth(selectedMonth - 1);
    } else if (selectedYear > minYear) {
      // Go to December of previous year
      setSelectedYear(selectedYear - 1);
      setSelectedMonth(12);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth < 12 && !isAllSelected) {
      setSelectedMonth(selectedMonth + 1);
    } else if (selectedYear < maxYear && !isAllSelected) {
      // Go to January of next year
      setSelectedYear(selectedYear + 1);
      setSelectedMonth(1);
    } else if (isAllSelected && selectedYear < maxYear) {
      // When "전체" and at max, go to next year's January
      setSelectedYear(selectedYear + 1);
      setSelectedMonth(1);
      setIsAllSelected(false);
    }
  };

  const canGoPrev = !isAllSelected ? (selectedMonth > 1 || selectedYear > minYear) : true;
  const canGoNext = !isAllSelected ? (selectedMonth < 12 || selectedYear < maxYear) : selectedYear < maxYear;

  // Handle "전체" selection
  const handleAllSelect = () => {
    setIsAllSelected(true);
  };

  // Handle month selection
  const handleMonthChange = (month: number) => {
    setIsAllSelected(false);
    setSelectedMonth(month);
  };

  // Get current month info
  const currentMonthInfo = MONTHS_INFO.find(m => m.id === selectedMonth);

  // Get KPIs - either for selected month or aggregated for all months (yearly)
  const displayKPIs = isAllSelected
    ? // Aggregate all months by category and metric
      (Object.keys(KPI_LABELS) as KPICategory[]).map((category) => {
        const categoryKPIs = kpiItems.filter((kpi) => kpi.category === category);
        const totalCurrent = categoryKPIs.reduce((sum, kpi) => sum + kpi.current, 0);
        const totalTarget = categoryKPIs.reduce((sum, kpi) => sum + kpi.target, 0);
        const metric = categoryKPIs[0]?.metric || '';
        return {
          id: `yearly-${category}`,
          month: 0, // 0 indicates yearly
          category,
          metric: `${selectedYear}년 연간 ${metric}`,
          current: totalCurrent,
          target: totalTarget,
        } as KPIItem;
      })
    : kpiItems.filter((kpi) => kpi.month === selectedMonth);

  // Filter by category
  const filteredKPIs =
    selectedCategory === 'all'
      ? displayKPIs
      : displayKPIs.filter((kpi) => kpi.category === selectedCategory);

  // Calculate overall progress
  const overallProgress = displayKPIs.reduce(
    (acc, kpi) => {
      acc.current += kpi.current;
      acc.target += kpi.target;
      return acc;
    },
    { current: 0, target: 0 }
  );

  const overallPercent =
    overallProgress.target > 0
      ? Math.round((overallProgress.current / overallProgress.target) * 100)
      : 0;

  // Get trend indicator
  const getTrendIcon = (current: number, target: number) => {
    const percent = (current / target) * 100;
    if (percent >= 100) {
      return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    } else if (percent >= 70) {
      return <ArrowRight className="w-4 h-4 text-amber-400" />;
    } else {
      return <TrendingDown className="w-4 h-4 text-red-400" />;
    }
  };

  // 수동 입력이 필요한 카테고리인지 확인
  const isManualInput = (category: KPICategory) => {
    return MANUAL_INPUT_CATEGORIES.includes(category);
  };

  // KPI 저장
  const handleSaveKPI = async (id: string, value: number) => {
    await updateKPI(id, value);
  };

  // 로딩 상태 체크
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
    <div className="min-h-screen pb-20">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0d1525] to-[#0a0f1a]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(183, 145, 110, 0.15), transparent),
                              radial-gradient(ellipse 60% 40% at 20% 80%, rgba(245, 158, 11, 0.08), transparent),
                              radial-gradient(ellipse 50% 30% at 80% 50%, rgba(16, 185, 129, 0.06), transparent)`,
          }}
        />
        {/* Grain texture */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Hero Section - Compact on Mobile */}
      <section className="relative pt-8 sm:pt-16 pb-6 sm:pb-12 px-4 sm:px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative"
          >
            {/* Decorative Line - Hidden on Mobile */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="hidden sm:block absolute -left-6 top-1/2 w-16 h-px bg-gradient-to-r from-[#b7916e] to-transparent origin-left"
            />

            <div className="sm:pl-14 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-[#b7916e] text-[10px] sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-2 sm:mb-4 font-light"
                >
                  Performance Metrics
                </motion.p>

                <h1
                  className="text-3xl sm:text-5xl lg:text-6xl text-white/95 mb-2 sm:mb-6 leading-[1.1] tracking-tight"
                  style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                >
                  <span className="sm:block inline">KPI </span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b7916e] via-[#d4c4a8] to-[#b7916e]">
                    Dashboard
                  </span>
                </h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.8 }}
                  className="hidden sm:block text-white/40 text-lg max-w-md font-light leading-relaxed"
                >
                  핵심 성과 지표 모니터링 및 목표 달성 현황
                </motion.p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Unified Year/Month Navigator - Compact Inline Layout */}
      <section className="relative py-2 sm:py-4 px-4 sm:px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedYear}-${selectedMonth}-${isAllSelected}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-between gap-2"
              >
                {/* Left: Year/Month Navigation */}
                <div className="flex items-center gap-1 sm:gap-2">
                  {/* Prev Button */}
                  <motion.button
                    whileHover={{ scale: 1.1, x: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={goToPrevMonth}
                    disabled={!canGoPrev}
                    className={`p-1 sm:p-1.5 rounded-lg transition-all ${
                      !canGoPrev
                        ? 'opacity-20 cursor-not-allowed'
                        : 'hover:bg-white/[0.06] active:bg-white/[0.08]'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white/40" />
                  </motion.button>

                  {/* Year & Month Display */}
                  <div className="flex items-baseline gap-1 sm:gap-1.5">
                    {/* Year */}
                    <span
                      className="text-sm sm:text-base text-[#b7916e]/80"
                      style={{ fontFamily: "var(--font-cormorant), serif" }}
                    >
                      {selectedYear}
                    </span>

                    {/* Separator */}
                    <span className="text-white/20 text-xs">·</span>

                    {/* Month or "전체" */}
                    <h2
                      className="text-xl sm:text-2xl text-white/95"
                      style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                    >
                      {isAllSelected ? '전체' : `${selectedMonth}월`}
                    </h2>

                    {/* Month Subtitle - only when month is selected */}
                    {!isAllSelected && currentMonthInfo && (
                      <span className="text-white/30 text-[10px] sm:text-xs font-light hidden sm:inline ml-0.5">
                        {currentMonthInfo.title}
                      </span>
                    )}
                  </div>

                  {/* Next Button */}
                  <motion.button
                    whileHover={{ scale: 1.1, x: 2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={goToNextMonth}
                    disabled={!canGoNext}
                    className={`p-1 sm:p-1.5 rounded-lg transition-all ${
                      !canGoNext
                        ? 'opacity-20 cursor-not-allowed'
                        : 'hover:bg-white/[0.06] active:bg-white/[0.08]'
                    }`}
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white/40" />
                  </motion.button>
                </div>

                {/* Right: "전체" (All Year) Toggle - Compact */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAllSelect}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    isAllSelected
                      ? 'bg-[#b7916e]/20 text-[#d4c4a8] border border-[#b7916e]/30'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04] border border-white/[0.08]'
                  }`}
                >
                  <CalendarRange className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{selectedYear}년 전체</span>
                  <span className="sm:hidden">전체</span>
                </motion.button>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Controls Section - Compact Mobile */}
      <section className="px-4 sm:px-6 lg:px-8 mb-4 sm:mb-6">
        <div className="max-w-6xl mx-auto">
          {/* Category Filter - Compact Pills */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="relative rounded-xl sm:rounded-2xl overflow-hidden mb-4 sm:mb-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
            <div className="absolute inset-0 border border-white/[0.06] rounded-xl sm:rounded-2xl" />
            <div className="relative p-2 sm:p-4">
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                    selectedCategory === 'all'
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
                  }`}
                >
                  전체
                </button>
                {(Object.keys(KPI_LABELS) as KPICategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-medium whitespace-nowrap transition-all duration-300 flex items-center gap-1 sm:gap-2 ${
                      selectedCategory === cat
                        ? `${KPI_COLORS[cat].bg} ${KPI_COLORS[cat].text} border border-current/30`
                        : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="[&>svg]:w-3.5 [&>svg]:h-3.5 sm:[&>svg]:w-5 sm:[&>svg]:h-5">{KPI_ICONS[cat]}</span>
                    <span className="hidden sm:inline">{KPI_LABELS[cat]}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Overall Progress Card - Compact Mobile */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="relative rounded-xl sm:rounded-2xl overflow-hidden mb-6 sm:mb-10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#b7916e]/[0.08] to-white/[0.02] backdrop-blur-sm" />
            <div className="absolute inset-0 border border-[#b7916e]/20 rounded-xl sm:rounded-2xl" />
            {/* Glow effect */}
            <div
              className="absolute inset-0 opacity-40"
              style={{
                background: 'radial-gradient(circle at 50% 0%, rgba(183, 145, 110, 0.15), transparent 50%)',
              }}
            />
            <div className="relative p-4 sm:p-8">
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-6">
                <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[#b7916e]/20 border border-[#b7916e]/30">
                  <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-[#d4c4a8]" />
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <p className="text-white/40 text-[10px] sm:text-sm">
                      {isAllSelected
                        ? `${selectedYear}년 연간 목표`
                        : `${MONTHS_INFO.find((m) => m.id === selectedMonth)?.name} 목표`}
                    </p>
                    <p
                      className="text-2xl sm:text-4xl text-white/90"
                      style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                    >
                      {overallPercent}
                      <span className="text-base sm:text-xl text-white/40">%</span>
                    </p>
                  </div>
                  {/* Mobile: Show current/target inline */}
                  <div className="text-right sm:hidden">
                    <p className="text-[10px] text-white/30">달성/목표</p>
                    <p className="text-xs text-white/50">
                      {overallProgress.current.toLocaleString()}/{overallProgress.target.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="h-2 sm:h-3 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(overallPercent, 100)}%` }}
                  transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                  className="h-full rounded-full bg-gradient-to-r from-[#b7916e] to-[#d4c4a8]"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* KPI Cards Grid - Compact Mobile */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-5"
          >
            {filteredKPIs.map((kpi, index) => {
              const colors = KPI_COLORS[kpi.category];
              const percent = Math.round((kpi.current / kpi.target) * 100);
              const canEdit = isManualInput(kpi.category);

              const isAchieved = percent >= 100;

              return (
                <motion.div
                  key={kpi.id}
                  variants={itemVariants}
                  className="group relative rounded-xl sm:rounded-2xl overflow-hidden"
                >
                  {/* Background - Changes when achieved */}
                  <div className={`absolute inset-0 backdrop-blur-sm transition-colors duration-500 ${
                    isAchieved
                      ? 'bg-gradient-to-br from-emerald-500/[0.12] to-emerald-500/[0.04]'
                      : 'bg-gradient-to-br from-white/[0.04] to-white/[0.01]'
                  }`} />
                  <div className={`absolute inset-0 rounded-xl sm:rounded-2xl transition-colors duration-500 ${
                    isAchieved
                      ? 'border border-emerald-500/30'
                      : 'border border-white/[0.06]'
                  }`} />
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: isAchieved
                        ? 'radial-gradient(circle at 50% 100%, rgba(16, 185, 129, 0.2), transparent 70%)'
                        : `radial-gradient(circle at 50% 100%, ${colors.glow}, transparent 70%)`,
                    }}
                  />

                  {/* Card Header - Compact */}
                  <div className={`relative px-2.5 sm:px-5 py-2 sm:py-4 ${colors.bg} border-b border-white/[0.04]`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 sm:gap-3">
                        <div className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-[#0a0f1a]/50 ${colors.text} [&>svg]:w-3.5 [&>svg]:h-3.5 sm:[&>svg]:w-5 sm:[&>svg]:h-5`}>
                          {KPI_ICONS[kpi.category]}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <p className={`text-[11px] sm:text-sm font-medium ${colors.text} truncate`}>
                              {KPI_LABELS[kpi.category]}
                            </p>
                            {canEdit && (
                              <span className="hidden sm:inline text-[9px] px-1 py-0.5 rounded bg-white/10 text-white/40">
                                수동
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] sm:text-xs text-white/30 truncate hidden sm:block">{kpi.metric}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 sm:gap-2">
                        {canEdit && (
                          <button
                            onClick={() => setEditingKPI(kpi)}
                            className="p-1 sm:p-2 rounded-lg hover:bg-white/[0.1] transition-colors text-white/40 hover:text-white/70"
                            title="수정"
                          >
                            <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        )}
                        <span className="[&>svg]:w-3 [&>svg]:h-3 sm:[&>svg]:w-4 sm:[&>svg]:h-4">
                          {getTrendIcon(kpi.current, kpi.target)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body - Compact */}
                  <div className="relative p-2.5 sm:p-5">
                    {/* Main Metric - Compact Layout */}
                    <div className="flex items-end justify-between mb-2 sm:mb-5">
                      <div>
                        <p className="text-[9px] sm:text-xs text-white/40 mb-0.5 uppercase tracking-wider">현재</p>
                        <p
                          className="text-lg sm:text-3xl text-white/90"
                          style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                        >
                          {kpi.current.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] sm:text-xs text-white/40 mb-0.5 uppercase tracking-wider">목표</p>
                        <p className="text-sm sm:text-xl text-white/40">
                          {kpi.target.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar - Compact */}
                    <div>
                      <div className="flex justify-between text-[9px] sm:text-xs mb-1 sm:mb-2">
                        <span className="text-white/40 uppercase tracking-wider hidden sm:inline">달성률</span>
                        <span
                          className={`font-medium ${
                            percent >= 100
                              ? 'text-emerald-400'
                              : percent >= 70
                              ? 'text-amber-400'
                              : 'text-white/50'
                          }`}
                        >
                          {percent}%
                        </span>
                      </div>
                      <div className={`h-1.5 sm:h-2 rounded-full overflow-hidden ${
                        isAchieved ? 'bg-emerald-500/20' : 'bg-white/[0.06]'
                      }`}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(percent, 100)}%` }}
                          transition={{
                            duration: 0.8,
                            delay: 0.3 + index * 0.05,
                            ease: [0.25, 0.46, 0.45, 0.94] as const,
                          }}
                          className={`h-full rounded-full bg-gradient-to-r ${
                            isAchieved ? 'from-emerald-500 to-emerald-400' : colors.accent
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Empty State */}
          {filteredKPIs.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative rounded-2xl overflow-hidden p-16 text-center"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
              <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />
              <div className="relative">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-white/20" />
                <p className="text-white/40">
                  선택한 조건에 해당하는 KPI가 없습니다.
                </p>
              </div>
            </motion.div>
          )}

          {/* Summary Cards - Compact Mobile */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mt-6 sm:mt-10 grid grid-cols-3 gap-2 sm:gap-5"
          >
            {/* Achieved */}
            <motion.div variants={itemVariants} className="relative rounded-xl sm:rounded-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
              <div className="absolute inset-0 border border-white/[0.06] rounded-xl sm:rounded-2xl" />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(circle at 50% 100%, rgba(16, 185, 129, 0.08), transparent 70%)',
                }}
              />
              <div className="relative p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 mb-2 sm:mb-4">
                  <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-emerald-500/20 border border-emerald-500/20 w-fit">
                    <TrendingUp className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-emerald-400" />
                  </div>
                  <p className="text-[10px] sm:text-sm text-white/40">달성</p>
                </div>
                <p
                  className="text-xl sm:text-4xl text-white/90"
                  style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                >
                  {displayKPIs.filter((k) => k.current >= k.target).length}
                  <span className="text-xs sm:text-lg text-white/30">/{displayKPIs.length}</span>
                </p>
              </div>
            </motion.div>

            {/* On Track */}
            <motion.div variants={itemVariants} className="relative rounded-xl sm:rounded-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
              <div className="absolute inset-0 border border-white/[0.06] rounded-xl sm:rounded-2xl" />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(circle at 50% 100%, rgba(245, 158, 11, 0.08), transparent 70%)',
                }}
              />
              <div className="relative p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 mb-2 sm:mb-4">
                  <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-amber-500/20 border border-amber-500/20 w-fit">
                    <ArrowRight className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-400" />
                  </div>
                  <p className="text-[10px] sm:text-sm text-white/40">진행중</p>
                </div>
                <p
                  className="text-xl sm:text-4xl text-white/90"
                  style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                >
                  {
                    displayKPIs.filter((k) => {
                      const p = (k.current / k.target) * 100;
                      return p >= 70 && p < 100;
                    }).length
                  }
                  <span className="text-xs sm:text-lg text-white/30">개</span>
                </p>
              </div>
            </motion.div>

            {/* Need Attention */}
            <motion.div variants={itemVariants} className="relative rounded-xl sm:rounded-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
              <div className="absolute inset-0 border border-white/[0.06] rounded-xl sm:rounded-2xl" />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(circle at 50% 100%, rgba(239, 68, 68, 0.08), transparent 70%)',
                }}
              />
              <div className="relative p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 mb-2 sm:mb-4">
                  <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-red-500/20 border border-red-500/20 w-fit">
                    <TrendingDown className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-red-400" />
                  </div>
                  <p className="text-[10px] sm:text-sm text-white/40">주의</p>
                </div>
                <p
                  className="text-xl sm:text-4xl text-white/90"
                  style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                >
                  {
                    displayKPIs.filter((k) => {
                      const p = (k.current / k.target) * 100;
                      return p < 70;
                    }).length
                  }
                  <span className="text-xs sm:text-lg text-white/30">개</span>
                </p>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* Footer */}
      <Footer subtitle="Performance Metrics" />

      {/* KPI Edit Modal */}
      <KPIEditModal
        kpi={editingKPI}
        isOpen={!!editingKPI}
        onClose={() => setEditingKPI(null)}
        onSave={handleSaveKPI}
      />
    </div>
  );
}
