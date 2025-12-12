'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useMasterPlanStore } from '@/lib/store/masterplan-store';
import { KPICategory, KPIItem, MONTHS_INFO, AVAILABLE_YEARS } from '@/lib/types';
import { YearMonthSelector } from '@/components/ui/YearMonthSelector';
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
  const { kpiItems, updateKPI } = useMasterPlanStore();
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<KPICategory | 'all'>('all');
  const [editingKPI, setEditingKPI] = useState<KPIItem | null>(null);
  const [isAllSelected, setIsAllSelected] = useState<boolean>(false);

  // Handle "전체" selection
  const handleAllSelect = () => {
    setIsAllSelected(true);
  };

  // Handle month selection
  const handleMonthChange = (month: number) => {
    setIsAllSelected(false);
    setSelectedMonth(month);
  };

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
                  Performance Metrics
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
                    KPI
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="block text-transparent bg-clip-text bg-gradient-to-r from-[#b7916e] via-[#d4c4a8] to-[#b7916e]"
                  >
                    Dashboard
                  </motion.span>
                </h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.8 }}
                  className="text-white/40 text-base sm:text-lg max-w-md font-light leading-relaxed"
                >
                  핵심 성과 지표 모니터링 및 목표 달성 현황
                </motion.p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Controls Section */}
      <section className="px-4 sm:px-6 lg:px-8 mb-6">
        <div className="max-w-6xl mx-auto">

          {/* Year & Month Selector */}
          <motion.div variants={itemVariants} initial="hidden" animate="visible">
            <YearMonthSelector
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onYearChange={(year) => {
                setSelectedYear(year);
                setIsAllSelected(false);
              }}
              onMonthChange={handleMonthChange}
              showAllOption={true}
              onAllSelect={handleAllSelect}
              isAllSelected={isAllSelected}
              className="mb-6"
            />
          </motion.div>

          {/* Category Filter */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="relative rounded-2xl overflow-hidden mb-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
            <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />
            <div className="relative p-4">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
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
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 flex items-center gap-2 ${
                      selectedCategory === cat
                        ? `${KPI_COLORS[cat].bg} ${KPI_COLORS[cat].text} border border-current/30`
                        : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
                    }`}
                  >
                    {KPI_ICONS[cat]}
                    <span>{KPI_LABELS[cat]}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Overall Progress Card */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="relative rounded-2xl overflow-hidden mb-10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#b7916e]/[0.08] to-white/[0.02] backdrop-blur-sm" />
            <div className="absolute inset-0 border border-[#b7916e]/20 rounded-2xl" />
            {/* Glow effect */}
            <div
              className="absolute inset-0 opacity-40"
              style={{
                background: 'radial-gradient(circle at 50% 0%, rgba(183, 145, 110, 0.15), transparent 50%)',
              }}
            />
            <div className="relative p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-[#b7916e]/20 border border-[#b7916e]/30">
                  <Sparkles className="w-6 h-6 text-[#d4c4a8]" />
                </div>
                <div>
                  <p className="text-white/40 text-sm">
                    {isAllSelected
                      ? `${selectedYear}년 연간 전체 목표 달성률`
                      : `${MONTHS_INFO.find((m) => m.id === selectedMonth)?.name} 전체 목표 달성률`}
                  </p>
                  <p
                    className="text-4xl text-white/90"
                    style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                  >
                    {overallPercent}
                    <span className="text-xl text-white/40">%</span>
                  </p>
                </div>
              </div>
              <div className="h-3 rounded-full bg-white/[0.06] overflow-hidden">
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

      {/* KPI Cards Grid */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filteredKPIs.map((kpi, index) => {
              const colors = KPI_COLORS[kpi.category];
              const percent = Math.round((kpi.current / kpi.target) * 100);
              const canEdit = isManualInput(kpi.category);

              return (
                <motion.div
                  key={kpi.id}
                  variants={itemVariants}
                  className="group relative rounded-2xl overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
                  <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle at 50% 100%, ${colors.glow}, transparent 70%)`,
                    }}
                  />

                  {/* Card Header */}
                  <div className={`relative px-5 py-4 ${colors.bg} border-b border-white/[0.04]`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl bg-[#0a0f1a]/50 ${colors.text}`}>
                          {KPI_ICONS[kpi.category]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={`font-medium ${colors.text}`}>
                              {KPI_LABELS[kpi.category]}
                            </p>
                            {canEdit && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/40">
                                수동입력
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/30">{kpi.metric}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {canEdit && (
                          <button
                            onClick={() => setEditingKPI(kpi)}
                            className="p-2 rounded-lg hover:bg-white/[0.1] transition-colors text-white/40 hover:text-white/70"
                            title="수정"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {getTrendIcon(kpi.current, kpi.target)}
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="relative p-5">
                    {/* Main Metric */}
                    <div className="flex items-end justify-between mb-5">
                      <div>
                        <p className="text-xs text-white/40 mb-1 uppercase tracking-wider">현재</p>
                        <p
                          className="text-3xl text-white/90"
                          style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                        >
                          {kpi.current.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/40 mb-1 uppercase tracking-wider">목표</p>
                        <p className="text-xl text-white/40">
                          {kpi.target.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-white/40 uppercase tracking-wider">달성률</span>
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
                      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(percent, 100)}%` }}
                          transition={{
                            duration: 0.8,
                            delay: 0.3 + index * 0.05,
                            ease: [0.25, 0.46, 0.45, 0.94] as const,
                          }}
                          className={`h-full rounded-full bg-gradient-to-r ${colors.accent}`}
                        />
                      </div>
                    </div>

                    {/* Achievement Badge */}
                    {percent >= 100 && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <Target className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-medium text-emerald-400">
                          목표 달성!
                        </span>
                      </div>
                    )}
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

          {/* Summary Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mt-10 grid md:grid-cols-3 gap-5"
          >
            {/* Achieved */}
            <motion.div variants={itemVariants} className="relative rounded-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
              <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(circle at 50% 100%, rgba(16, 185, 129, 0.08), transparent 70%)',
                }}
              />
              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/20">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-sm text-white/40">목표 달성</p>
                </div>
                <p
                  className="text-4xl text-white/90"
                  style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                >
                  {displayKPIs.filter((k) => k.current >= k.target).length}
                  <span className="text-lg text-white/30">/{displayKPIs.length}</span>
                </p>
              </div>
            </motion.div>

            {/* On Track */}
            <motion.div variants={itemVariants} className="relative rounded-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
              <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(circle at 50% 100%, rgba(245, 158, 11, 0.08), transparent 70%)',
                }}
              />
              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/20">
                    <ArrowRight className="w-5 h-5 text-amber-400" />
                  </div>
                  <p className="text-sm text-white/40">진행중 (70%+)</p>
                </div>
                <p
                  className="text-4xl text-white/90"
                  style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                >
                  {
                    displayKPIs.filter((k) => {
                      const p = (k.current / k.target) * 100;
                      return p >= 70 && p < 100;
                    }).length
                  }
                  <span className="text-lg text-white/30">개</span>
                </p>
              </div>
            </motion.div>

            {/* Need Attention */}
            <motion.div variants={itemVariants} className="relative rounded-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
              <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(circle at 50% 100%, rgba(239, 68, 68, 0.08), transparent 70%)',
                }}
              />
              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/20">
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  </div>
                  <p className="text-sm text-white/40">주의 필요</p>
                </div>
                <p
                  className="text-4xl text-white/90"
                  style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                >
                  {
                    displayKPIs.filter((k) => {
                      const p = (k.current / k.target) * 100;
                      return p < 70;
                    }).length
                  }
                  <span className="text-lg text-white/30">개</span>
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Bottom Decoration */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-20 text-center"
          >
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/20">
              Muse de Marée · Performance Metrics
            </p>
          </motion.div>
        </div>
      </section>

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
