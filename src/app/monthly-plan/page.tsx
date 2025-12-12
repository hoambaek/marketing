'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { useMasterPlanStore } from '@/lib/store/masterplan-store';
import { MONTHS_INFO, PHASE_INFO, AVAILABLE_YEARS } from '@/lib/types';

// Stagger animation variants
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

const phaseColors = {
  1: { primary: '#3B82F6', gradient: 'from-blue-500/20 to-blue-600/5' },
  2: { primary: '#10B981', gradient: 'from-emerald-500/20 to-emerald-600/5' },
  3: { primary: '#F59E0B', gradient: 'from-amber-500/20 to-amber-600/5' },
  4: { primary: '#EC4899', gradient: 'from-rose-500/20 to-rose-600/5' },
  5: { primary: '#8B7355', gradient: 'from-amber-700/20 to-amber-800/5' },
};

export default function MonthlyPlanPage() {
  const { getProgressByMonth, tasks } = useMasterPlanStore();
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0d1525] to-[#0a0f1a]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59, 130, 246, 0.15), transparent),
                              radial-gradient(ellipse 60% 40% at 80% 60%, rgba(183, 145, 110, 0.08), transparent),
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
                Launch Roadmap
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
                  Monthly
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="block text-transparent bg-clip-text bg-gradient-to-r from-[#b7916e] via-[#d4c4a8] to-[#b7916e]"
                >
                  Master Plan
                </motion.span>
              </h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="text-white/40 text-lg max-w-md font-light leading-relaxed"
              >
                해저에서 숙성되는 시간의 여정,
                <br />
                12개월의 브랜드 완성 로드맵
              </motion.p>
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
            transition={{ duration: 0.8, delay: 0.85 }}
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

      {/* Phase Overview - Horizontal Scroll on Mobile */}
      <section className="relative py-4 sm:py-8 px-4 sm:px-6 lg:px-12 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="flex items-center gap-3 mb-4 sm:mb-8"
          >
            <div className="w-8 h-px bg-white/20" />
            <span className="text-white/30 text-xs tracking-[0.2em] uppercase">Phase Overview</span>
          </motion.div>

          {/* Mobile: Horizontal scroll, Desktop: Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:gap-3 scrollbar-hide"
          >
            {PHASE_INFO.map((phase, index) => {
              const phaseProgress = phase.months.reduce(
                (acc, monthId) => acc + getProgressByMonth(selectedYear, monthId),
                0
              ) / phase.months.length;
              const phaseTasks = tasks.filter(t => phase.months.includes(t.month));
              const completedTasks = phaseTasks.filter(t => t.status === 'done').length;
              const colors = phaseColors[phase.id as keyof typeof phaseColors];

              return (
                <motion.div
                  key={phase.id}
                  variants={itemVariants}
                  whileHover={{ y: -3, scale: 1.02, transition: { duration: 0.3 } }}
                  className={`relative group rounded-lg sm:rounded-xl p-2.5 sm:p-4 bg-gradient-to-br ${colors.gradient} border border-white/[0.06] backdrop-blur-sm overflow-hidden flex-shrink-0 w-[140px] sm:w-auto`}
                >
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle at 50% 100%, ${colors.primary}20, transparent 70%)`
                    }}
                  />

                  {/* Phase number & indicator */}
                  <div className="flex items-center justify-between mb-1.5 sm:mb-3">
                    <div
                      className="text-xl sm:text-3xl font-light opacity-20"
                      style={{
                        fontFamily: "var(--font-cormorant), serif",
                        color: colors.primary
                      }}
                    >
                      {String(phase.id).padStart(2, '0')}
                    </div>
                    <div
                      className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full"
                      style={{ backgroundColor: colors.primary }}
                    />
                  </div>

                  <h3
                    className="text-white/90 text-xs sm:text-base mb-0.5 sm:mb-1 leading-tight truncate"
                    style={{ fontFamily: "var(--font-cormorant), serif" }}
                  >
                    {phase.name}
                  </h3>

                  <p className="text-white/35 text-[9px] sm:text-[11px] mb-2 sm:mb-4 line-clamp-1 sm:line-clamp-2 font-light leading-relaxed">
                    {phase.description}
                  </p>

                  {/* Progress */}
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex justify-between text-[8px] sm:text-[10px]">
                      <span className="text-white/25">{completedTasks}/{phaseTasks.length}</span>
                      <span className="font-medium" style={{ color: colors.primary }}>{Math.round(phaseProgress)}%</span>
                    </div>
                    <div className="h-0.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${phaseProgress}%` }}
                        transition={{ duration: 1.2, delay: 0.5 + index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: colors.primary }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Monthly Cards Grid */}
      <section className="relative py-6 sm:py-12 px-4 sm:px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="flex items-center justify-between mb-4 sm:mb-12"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-px bg-white/20" />
              <span className="text-white/30 text-xs tracking-[0.2em] uppercase">Monthly Detail</span>
            </div>
            <span className="text-white/20 text-xs sm:text-sm">12 Months</span>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6"
          >
            {MONTHS_INFO.map((month, index) => {
              const progress = getProgressByMonth(selectedYear, month.id);
              const isCurrentMonth = month.id === 1;
              const phase = PHASE_INFO.find((p) => p.months.includes(month.id));
              const monthTasks = tasks.filter(t => t.month === month.id);
              const completedTasks = monthTasks.filter(t => t.status === 'done').length;
              const inProgressTasks = monthTasks.filter(t => t.status === 'in_progress').length;
              const phaseColor = phaseColors[phase?.id as keyof typeof phaseColors]?.primary || '#3B82F6';

              return (
                <motion.div
                  key={month.id}
                  variants={itemVariants}
                  className="group"
                >
                  <Link href={`/month/${month.id}`} className="block">
                    <motion.div
                      whileHover={{ y: -4, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }}
                      className={`relative h-full rounded-xl sm:rounded-2xl overflow-hidden ${
                        isCurrentMonth
                          ? 'ring-1 ring-[#b7916e]/50'
                          : ''
                      }`}
                    >
                      {/* Card Background */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
                      <div className="absolute inset-0 border border-white/[0.06] rounded-xl sm:rounded-2xl" />

                      {/* Hover Effect */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700"
                        style={{
                          background: `linear-gradient(to bottom, ${phaseColor}08, transparent 60%)`
                        }}
                      />

                      {/* Phase Indicator Bar */}
                      <div
                        className="absolute top-0 left-0 right-0 h-0.5"
                        style={{ backgroundColor: phaseColor }}
                      />

                      {/* Content */}
                      <div className="relative p-3 sm:p-6">
                        {/* Current Badge */}
                        {isCurrentMonth && (
                          <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
                            <span className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[#b7916e]/20 text-[#d4c4a8] text-[8px] sm:text-[10px] tracking-wider uppercase border border-[#b7916e]/30">
                              Now
                            </span>
                          </div>
                        )}

                        {/* Month Number - Hidden on mobile */}
                        <div
                          className="hidden sm:block text-7xl font-light text-white/[0.04] leading-none mb-2 -ml-1"
                          style={{ fontFamily: "var(--font-cormorant), serif" }}
                        >
                          {String(month.id).padStart(2, '0')}
                        </div>

                        {/* Month Name */}
                        <h3
                          className="text-base sm:text-2xl text-white/90 mb-0.5 sm:mb-1 sm:-mt-8"
                          style={{ fontFamily: "var(--font-cormorant), serif" }}
                        >
                          {month.name}
                        </h3>
                        <p className="text-white/30 text-[10px] sm:text-sm mb-2 sm:mb-6 font-light truncate">{month.title}</p>

                        {/* Stats Row - Compact on mobile */}
                        <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-6">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-emerald-400" />
                            <span className="text-white/50 text-[9px] sm:text-xs">{completedTasks}</span>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-amber-400" />
                            <span className="text-white/50 text-[9px] sm:text-xs">{inProgressTasks}</span>
                          </div>
                        </div>

                        {/* Progress Section */}
                        <div className="space-y-1 sm:space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-white/20 text-[9px] sm:text-xs">Progress</span>
                            <span
                              className="text-[10px] sm:text-sm font-light"
                              style={{ color: phaseColor }}
                            >
                              {progress}%
                            </span>
                          </div>
                          <div className="h-0.5 sm:h-1 rounded-full bg-white/[0.06] overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 1, delay: 0.8 + index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: phaseColor }}
                            />
                          </div>
                        </div>

                        {/* Footer - Hidden on mobile */}
                        <div className="hidden sm:flex mt-6 pt-4 border-t border-white/[0.04] items-center justify-between">
                          <span className="text-white/20 text-xs">Phase {phase?.id}</span>
                          <motion.span
                            className="text-white/30 text-xs flex items-center gap-1 group-hover:text-white/60 transition-colors"
                          >
                            View Details
                            <motion.svg
                              className="w-3 h-3 group-hover:translate-x-1 transition-transform"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </motion.svg>
                          </motion.span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
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
