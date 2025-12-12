'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useMasterPlanStore } from '@/lib/store/masterplan-store';
import { MONTHS_INFO, PHASE_INFO, CATEGORY_LABELS, TaskCategory, AVAILABLE_YEARS } from '@/lib/types';
import { YearMonthSelectorCompact } from '@/components/ui/YearMonthSelector';
import { CheckCircle2, Clock, Circle, ArrowRight, Calendar, Target, TrendingUp, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
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

// 페이즈별 색상
const phaseColors = {
  1: { primary: '#3B82F6', gradient: 'from-blue-500/20 to-blue-600/5', bg: 'bg-blue-500' },
  2: { primary: '#10B981', gradient: 'from-emerald-500/20 to-emerald-600/5', bg: 'bg-emerald-500' },
  3: { primary: '#F59E0B', gradient: 'from-amber-500/20 to-amber-600/5', bg: 'bg-amber-500' },
  4: { primary: '#EC4899', gradient: 'from-rose-500/20 to-rose-600/5', bg: 'bg-rose-500' },
  5: { primary: '#8B7355', gradient: 'from-amber-700/20 to-amber-800/5', bg: 'bg-amber-700' },
};

export default function HomePage() {
  const { getTotalProgress, getProgressByMonth, tasks, mustDoItems } = useMasterPlanStore();
  const totalProgress = getTotalProgress();
  const timelineRef = useRef<HTMLDivElement>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(1);

  // 이번 주 할 일 (1월 기준)
  const thisWeekTasks = tasks.filter((t) => t.month === 1 && t.week === 1).slice(0, 5);

  // 상태별 카운트
  const statusCounts = {
    done: tasks.filter((t) => t.status === 'done').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    pending: tasks.filter((t) => t.status === 'pending').length,
  };

  // 타임라인 스크롤 핸들러
  const scrollTimeline = (direction: 'left' | 'right') => {
    if (timelineRef.current) {
      const scrollAmount = 400;
      timelineRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // 페이즈별 타임라인 바 데이터 계산
  const getPhaseBarPosition = (phase: typeof PHASE_INFO[0]) => {
    const startMonth = Math.min(...phase.months);
    const endMonth = Math.max(...phase.months);
    const startWeek = (startMonth - 1) * 4;
    const endWeek = endMonth * 4;
    return { startWeek, endWeek, width: endWeek - startWeek };
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0d1525] to-[#0a0f1a]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(183, 145, 110, 0.12), transparent),
                              radial-gradient(ellipse 60% 40% at 80% 60%, rgba(59, 130, 246, 0.08), transparent),
                              radial-gradient(ellipse 50% 30% at 20% 80%, rgba(16, 185, 129, 0.06), transparent)`
          }}
        />
        {/* Subtle grain texture */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative pt-16 pb-12 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
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
              className="absolute -left-6 top-1/2 w-16 h-px bg-gradient-to-r from-[#b7916e] to-transparent origin-left"
            />

            <div className="pl-14">
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-[#b7916e] text-sm tracking-[0.3em] uppercase mb-4 font-light"
              >
                Launch Masterplan
              </motion.p>

              <h1
                className="text-5xl sm:text-6xl lg:text-7xl text-white/95 mb-6 leading-[1.1] tracking-tight"
                style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
              >
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="block"
                >
                  Timeline
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="block text-transparent bg-clip-text bg-gradient-to-r from-[#b7916e] via-[#d4c4a8] to-[#b7916e]"
                >
                  Roadmap
                </motion.span>
              </h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="text-white/40 text-lg max-w-md font-light leading-relaxed"
              >
                해저에서 숙성되는 시간,
                <br />
                브랜드가 완성되는 여정
              </motion.p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Total Progress Section */}
      <section className="relative py-8 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="relative rounded-2xl overflow-hidden"
          >
            {/* Card Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
            <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />

            {/* Content */}
            <div className="relative p-4 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div>
                  <p className="text-white/40 text-xs sm:text-sm tracking-wider uppercase mb-1 sm:mb-2">전체 진행률</p>
                  <p
                    className="text-4xl sm:text-6xl text-white/90"
                    style={{ fontFamily: "var(--font-cormorant), serif" }}
                  >
                    {totalProgress}
                    <span className="text-xl sm:text-3xl text-[#b7916e]">%</span>
                  </p>
                </div>

                <div className="flex gap-5 sm:gap-8">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 1.1 }}
                    className="text-center"
                  >
                    <p className="text-xl sm:text-3xl font-light text-emerald-400" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                      {statusCounts.done}
                    </p>
                    <p className="text-[10px] sm:text-xs text-white/30 tracking-wider uppercase mt-0.5 sm:mt-1">완료</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 1.2 }}
                    className="text-center"
                  >
                    <p className="text-xl sm:text-3xl font-light text-amber-400" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                      {statusCounts.in_progress}
                    </p>
                    <p className="text-[10px] sm:text-xs text-white/30 tracking-wider uppercase mt-0.5 sm:mt-1">진행중</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 1.3 }}
                    className="text-center"
                  >
                    <p className="text-xl sm:text-3xl font-light text-white/30" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                      {statusCounts.pending}
                    </p>
                    <p className="text-[10px] sm:text-xs text-white/30 tracking-wider uppercase mt-0.5 sm:mt-1">대기</p>
                  </motion.div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${totalProgress}%` }}
                  transition={{ duration: 1.2, delay: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="h-full rounded-full bg-gradient-to-r from-[#b7916e] to-[#d4c4a8]"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Year Selection */}
      <section className="relative py-4 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="relative rounded-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
            <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />
            <div className="relative p-4">
              <div className="flex items-center gap-4">
                <span className="text-white/30 text-xs tracking-[0.2em] uppercase">연도 선택</span>
                <div className="flex items-center gap-2">
                  {AVAILABLE_YEARS.map((year) => (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedYear === year
                          ? 'bg-[#b7916e]/20 text-[#d4c4a8] border border-[#b7916e]/30'
                          : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
                      }`}
                      style={{ fontFamily: "var(--font-cormorant), serif" }}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Horizontal Timeline View (Gantt Style) */}
      <section className="relative py-8 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="w-8 h-px bg-white/20" />
            <span className="text-white/30 text-xs tracking-[0.2em] uppercase">{selectedYear} Roadmap</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="relative rounded-2xl overflow-hidden"
          >
            {/* Card Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
            <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />

            {/* Timeline Header with Controls */}
            <div className="relative flex items-center justify-between p-4 border-b border-white/[0.06]">
              <h2
                className="text-xl text-white/90"
                style={{ fontFamily: "var(--font-cormorant), serif" }}
              >
                Phase Overview
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => scrollTimeline('left')}
                  className="p-2.5 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/[0.04] transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => scrollTimeline('right')}
                  className="p-2.5 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/[0.04] transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Timeline Container - Scroll together on mobile */}
            <div
              ref={timelineRef}
              className="relative flex overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
            >
              {/* Left Column - Phase Color Indicators */}
              <div className="w-10 sm:w-12 flex-shrink-0 border-r border-white/[0.06] bg-[#0a0f1a]/80">
                {/* Empty header cell */}
                <div className="h-12 sm:h-16 border-b border-white/[0.06]" />

                {/* Phase Color Dots */}
                {PHASE_INFO.map((phase) => {
                  const colors = phaseColors[phase.id as keyof typeof phaseColors];
                  return (
                    <div
                      key={phase.id}
                      className="h-12 sm:h-16 flex items-center justify-center border-b border-white/[0.04]"
                    >
                      <div
                        className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full"
                        style={{ backgroundColor: colors.primary }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Timeline Area */}
              <div className="flex-1">
                {/* Month/Week Header */}
                <div className="flex h-12 sm:h-16 border-b border-white/[0.06] bg-white/[0.02]">
                  {MONTHS_INFO.map((month) => (
                    <div
                      key={month.id}
                      className="flex-shrink-0 w-[200px] sm:w-[320px]"
                    >
                      <Link href={`/month/${month.id}`}>
                        <div className="h-6 sm:h-8 flex items-center justify-center border-b border-white/[0.04] hover:bg-white/[0.04] transition-colors cursor-pointer">
                          <span className="text-xs sm:text-sm font-medium text-white/60">
                            {month.name}
                          </span>
                          {month.id === 1 && (
                            <span className="ml-1.5 sm:ml-2 w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-[#b7916e] animate-pulse" />
                          )}
                        </div>
                      </Link>
                      <div className="h-6 sm:h-8 flex">
                        {[1, 2, 3, 4].map((week) => (
                          <div
                            key={week}
                            className="flex-1 flex items-center justify-center text-[8px] sm:text-[10px] text-white/30 border-r border-white/[0.04]"
                          >
                            W{week}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Phase Bars (Gantt Chart) */}
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
                      className="h-12 sm:h-16 flex items-center border-b border-white/[0.04] relative"
                      style={{ width: '2400px' }}
                    >
                      {/* Grid lines */}
                      {Array.from({ length: 48 }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute top-0 bottom-0 border-r border-white/[0.03]"
                          style={{ left: `${(i + 1) * 50}px` }}
                        />
                      ))}

                      {/* Phase Bar */}
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: `${width * 50 - 12}px`, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 1.3 + phaseIndex * 0.1 }}
                        className={`absolute h-8 sm:h-10 rounded-lg sm:rounded-xl ${colors.bg} shadow-lg cursor-pointer group overflow-hidden`}
                        style={{ left: `${startWeek * 50 + 6}px` }}
                      >
                        <Link href={`/month/${phase.months[0]}`} className="block h-full relative">
                          {/* Progress overlay */}
                          <div
                            className="absolute inset-0 bg-white/20"
                            style={{ width: `${phaseProgress}%` }}
                          />
                          <div className="relative h-full px-2 sm:px-4 flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-medium text-white truncate">
                              {phase.description}
                            </span>
                            <span className="text-[10px] sm:text-xs text-white/80 ml-1 sm:ml-2 flex-shrink-0">
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
            <div className="relative p-3 sm:p-4 border-t border-white/[0.06] flex flex-wrap gap-3 sm:gap-6">
              {PHASE_INFO.map((phase) => {
                const colors = phaseColors[phase.id as keyof typeof phaseColors];
                return (
                  <div key={phase.id} className="flex items-center gap-1.5 sm:gap-2">
                    <div
                      className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded"
                      style={{ backgroundColor: colors.primary }}
                    />
                    <span className="text-[10px] sm:text-xs text-white/40">
                      P{phase.id}: {phase.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bottom Cards */}
      <section className="relative py-12 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 gap-6"
          >
            {/* This Week Tasks */}
            <motion.div variants={itemVariants} className="group">
              <div className="relative h-full rounded-2xl overflow-hidden">
                {/* Card Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
                <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />

                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(circle at 50% 100%, rgba(183, 145, 110, 0.08), transparent 70%)`
                  }}
                />

                {/* Content */}
                <div className="relative p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Calendar className="w-5 h-5 text-[#b7916e]" />
                    <h3
                      className="text-xl text-white/90"
                      style={{ fontFamily: "var(--font-cormorant), serif" }}
                    >
                      이번 주 할 일
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {thisWeekTasks.map((task) => (
                      <div key={task.id} className="flex items-start gap-3">
                        {task.status === 'done' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        ) : task.status === 'in_progress' ? (
                          <Clock className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-white/30 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm ${
                              task.status === 'done'
                                ? 'text-white/40 line-through'
                                : 'text-white/80'
                            }`}
                          >
                            {task.title}
                          </p>
                          <span
                            className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.06] text-white/50"
                          >
                            {CATEGORY_LABELS[task.category as TaskCategory]}
                          </span>
                        </div>
                      </div>
                    ))}
                    {thisWeekTasks.length === 0 && (
                      <p className="text-white/30 text-sm">이번 주 작업이 없습니다</p>
                    )}
                  </div>

                  <Link
                    href="/month/1"
                    className="mt-6 inline-flex items-center gap-2 text-sm text-[#b7916e] hover:text-[#d4c4a8] transition-colors group/link"
                  >
                    전체 보기
                    <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div variants={itemVariants} className="group">
              <div className="relative h-full rounded-2xl overflow-hidden">
                {/* Card Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
                <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />

                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(circle at 50% 100%, rgba(59, 130, 246, 0.08), transparent 70%)`
                  }}
                />

                {/* Content */}
                <div className="relative p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="w-5 h-5 text-[#b7916e]" />
                    <h3
                      className="text-xl text-white/90"
                      style={{ fontFamily: "var(--font-cormorant), serif" }}
                    >
                      진행 현황
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <Target className="w-5 h-5 text-emerald-400 mb-3" />
                      <p
                        className="text-2xl text-white/90"
                        style={{ fontFamily: "var(--font-cormorant), serif" }}
                      >
                        {mustDoItems.filter((m) => m.done).length}
                        <span className="text-sm text-white/40 ml-1">
                          /{mustDoItems.length}
                        </span>
                      </p>
                      <p className="text-xs text-white/40 mt-1">Must-Do 완료</p>
                    </div>

                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <Calendar className="w-5 h-5 text-blue-400 mb-3" />
                      <p
                        className="text-2xl text-white/90"
                        style={{ fontFamily: "var(--font-cormorant), serif" }}
                      >
                        D-{getDaysUntilLaunch()}
                      </p>
                      <p className="text-xs text-white/40 mt-1">런칭까지</p>
                    </div>

                    <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                      <Sparkles className="w-5 h-5 text-violet-400 mb-3" />
                      <p
                        className="text-2xl text-white/90"
                        style={{ fontFamily: "var(--font-cormorant), serif" }}
                      >
                        Phase 1
                      </p>
                      <p className="text-xs text-white/40 mt-1">현재 단계</p>
                    </div>

                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <Clock className="w-5 h-5 text-amber-400 mb-3" />
                      <p
                        className="text-2xl text-white/90"
                        style={{ fontFamily: "var(--font-cormorant), serif" }}
                      >
                        {tasks.filter((t) => t.month === 1).length}
                      </p>
                      <p className="text-xs text-white/40 mt-1">이번 달 업무</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Bottom Decoration */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 1.5 }}
        className="relative py-20 px-6"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <span
            className="text-white/10 text-sm tracking-[0.3em] uppercase"
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

// 런칭일(2026년 8월 1일)까지 남은 일수 계산
function getDaysUntilLaunch(): number {
  const launchDate = new Date('2026-08-01');
  const today = new Date();
  const diffTime = launchDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}
