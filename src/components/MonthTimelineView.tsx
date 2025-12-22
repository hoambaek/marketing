'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTHS_INFO, PHASE_INFO, Task } from '@/lib/types';

interface MonthTimelineViewProps {
  selectedYear: number;
  selectedMonth: number;
  selectedWeek: number;
  onMonthChange: (month: number) => void;
  onWeekChange: (week: number) => void;
  tasks: Task[];
  colors: {
    primary: string;
    gradient: string;
    glow: string;
  };
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

// Get days in a month
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate();
};

// Get the day of week for the first day of month (0 = Sunday)
const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month - 1, 1).getDay();
};

// Get weeks array for a month
const getWeeksInMonth = (year: number, month: number) => {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const weeks: { weekNum: number; days: (number | null)[] }[] = [];

  let currentDay = 1;
  let weekNum = 1;

  // First week (may have empty days at the start)
  const firstWeek: (number | null)[] = [];
  for (let i = 0; i < 7; i++) {
    if (i < firstDay) {
      firstWeek.push(null);
    } else {
      firstWeek.push(currentDay++);
    }
  }
  weeks.push({ weekNum: weekNum++, days: firstWeek });

  // Remaining weeks
  while (currentDay <= daysInMonth) {
    const week: (number | null)[] = [];
    for (let i = 0; i < 7; i++) {
      if (currentDay <= daysInMonth) {
        week.push(currentDay++);
      } else {
        week.push(null);
      }
    }
    weeks.push({ weekNum: weekNum++, days: week });
  }

  return weeks;
};

// Check if a day is today
const isToday = (year: number, month: number, day: number) => {
  const today = new Date();
  return today.getFullYear() === year &&
         today.getMonth() + 1 === month &&
         today.getDate() === day;
};

export default function MonthTimelineView({
  selectedYear,
  selectedMonth,
  selectedWeek,
  onMonthChange,
  onWeekChange,
  tasks,
  colors,
}: MonthTimelineViewProps) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const weeks = useMemo(() => getWeeksInMonth(selectedYear, selectedMonth), [selectedYear, selectedMonth]);
  const currentMonthInfo = MONTHS_INFO.find((m) => m.id === selectedMonth);
  const phase = PHASE_INFO.find((p) => p.months.includes(selectedMonth));

  // Get tasks for a specific day
  const getTasksForDay = (day: number) => {
    return tasks.filter(t => {
      if (t.month !== selectedMonth || t.year !== selectedYear) return false;
      // Calculate which week this day falls into
      const weekForDay = Math.ceil((day + getFirstDayOfMonth(selectedYear, selectedMonth)) / 7);
      return t.week === weekForDay;
    });
  };

  // Get task count by status for a day
  const getDayTaskStats = (day: number | null) => {
    if (!day) return { total: 0, done: 0, inProgress: 0, pending: 0 };
    const dayTasks = tasks.filter(t => {
      if (t.month !== selectedMonth || t.year !== selectedYear) return false;
      if (t.dueDate) {
        const dueDate = new Date(t.dueDate);
        return dueDate.getDate() === day;
      }
      return false;
    });
    return {
      total: dayTasks.length,
      done: dayTasks.filter(t => t.status === 'done').length,
      inProgress: dayTasks.filter(t => t.status === 'in_progress').length,
      pending: dayTasks.filter(t => t.status === 'pending').length,
    };
  };

  const goToPrevMonth = () => {
    if (selectedMonth > 1) {
      onMonthChange(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth < 12) {
      onMonthChange(selectedMonth + 1);
    }
  };

  return (
    <div className="w-full">
      {/* Month Header Bar */}
      <div className="flex items-center justify-between mb-6">
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1, x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToPrevMonth}
            disabled={selectedMonth <= 1}
            className={`p-2 rounded-lg transition-all ${
              selectedMonth <= 1
                ? 'opacity-20 cursor-not-allowed'
                : 'hover:bg-white/[0.06] active:bg-white/[0.08]'
            }`}
          >
            <ChevronLeft className="w-5 h-5 text-white/50" />
          </motion.button>

          <div className="flex items-baseline gap-3 min-w-[140px] justify-center">
            <motion.h2
              key={selectedMonth}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-2xl sm:text-3xl text-white/95"
              style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
            >
              {currentMonthInfo?.name}
            </motion.h2>
          </div>

          <motion.button
            whileHover={{ scale: 1.1, x: 2 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToNextMonth}
            disabled={selectedMonth >= 12}
            className={`p-2 rounded-lg transition-all ${
              selectedMonth >= 12
                ? 'opacity-20 cursor-not-allowed'
                : 'hover:bg-white/[0.06] active:bg-white/[0.08]'
            }`}
          >
            <ChevronRight className="w-5 h-5 text-white/50" />
          </motion.button>
        </div>

        {/* Month Quick Select */}
        <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          {MONTHS_INFO.map((month) => {
            const isSelected = month.id === selectedMonth;
            const monthPhase = PHASE_INFO.find((p) => p.months.includes(month.id));

            return (
              <motion.button
                key={month.id}
                onClick={() => onMonthChange(month.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative px-2 py-1 rounded-lg text-xs transition-all ${
                  isSelected
                    ? 'text-white'
                    : 'text-white/30 hover:text-white/50'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="monthIndicator"
                    className="absolute inset-0 rounded-lg"
                    style={{
                      backgroundColor: `${colors.primary}20`,
                      border: `1px solid ${colors.primary}40`
                    }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                  {month.id}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Phase Badge */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{
            backgroundColor: `${colors.primary}10`,
            border: `1px solid ${colors.primary}20`,
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: colors.primary }}
          />
          <span
            className="text-xs tracking-wider uppercase"
            style={{ color: colors.primary }}
          >
            Phase {phase?.id}
          </span>
        </div>
      </div>

      {/* Timeline Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent"
      >
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(to right, white 1px, transparent 1px),
              linear-gradient(to bottom, white 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Day Headers */}
        <div className="relative grid grid-cols-8 border-b border-white/[0.06]">
          {/* Week label column */}
          <div className="p-3 sm:p-4 flex items-center justify-center border-r border-white/[0.06]">
            <span className="text-[10px] sm:text-xs text-white/30 uppercase tracking-widest">
              주차
            </span>
          </div>

          {/* Day name columns */}
          {DAY_NAMES.map((day, idx) => (
            <div
              key={day}
              className={`p-3 sm:p-4 flex flex-col items-center justify-center ${
                idx < 6 ? 'border-r border-white/[0.04]' : ''
              }`}
            >
              <span
                className={`text-xs sm:text-sm font-medium ${
                  idx === 0 ? 'text-rose-400/70' :
                  idx === 6 ? 'text-blue-400/70' :
                  'text-white/50'
                }`}
                style={{ fontFamily: "var(--font-cormorant), serif" }}
              >
                {day}
              </span>
            </div>
          ))}
        </div>

        {/* Week Rows */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedMonth}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {weeks.map((week, weekIdx) => {
              const isSelectedWeek = week.weekNum === selectedWeek;

              return (
                <motion.div
                  key={`week-${week.weekNum}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: weekIdx * 0.05 }}
                  onClick={() => onWeekChange(week.weekNum)}
                  className={`relative grid grid-cols-8 cursor-pointer transition-all duration-300 ${
                    weekIdx < weeks.length - 1 ? 'border-b border-white/[0.04]' : ''
                  } ${
                    isSelectedWeek
                      ? 'bg-gradient-to-r from-[#b7916e]/10 via-[#b7916e]/5 to-transparent'
                      : 'hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Selected week indicator */}
                  {isSelectedWeek && (
                    <motion.div
                      layoutId="weekSelector"
                      className="absolute left-0 top-0 bottom-0 w-1"
                      style={{ backgroundColor: colors.primary }}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}

                  {/* Week number column */}
                  <div className={`p-3 sm:p-4 flex items-center justify-center border-r border-white/[0.06] ${
                    isSelectedWeek ? 'bg-white/[0.02]' : ''
                  }`}>
                    <span
                      className={`text-sm sm:text-base transition-colors ${
                        isSelectedWeek ? 'text-[#d4c4a8]' : 'text-white/40'
                      }`}
                      style={{ fontFamily: "var(--font-cormorant), serif" }}
                    >
                      {week.weekNum}
                    </span>
                  </div>

                  {/* Day cells */}
                  {week.days.map((day, dayIdx) => {
                    const taskStats = getDayTaskStats(day);
                    const isTodayDate = day ? isToday(selectedYear, selectedMonth, day) : false;
                    const isHovered = hoveredDay === day && day !== null;

                    return (
                      <div
                        key={`day-${weekIdx}-${dayIdx}`}
                        className={`relative p-2 sm:p-3 min-h-[60px] sm:min-h-[72px] flex flex-col items-center transition-all duration-200 ${
                          dayIdx < 6 ? 'border-r border-white/[0.04]' : ''
                        } ${day === null ? 'bg-white/[0.01]' : ''}`}
                        onMouseEnter={() => day && setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                      >
                        {day !== null && (
                          <>
                            {/* Day number */}
                            <div className={`relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all duration-200 ${
                              isTodayDate
                                ? 'bg-[#b7916e] text-white shadow-lg shadow-[#b7916e]/30'
                                : isHovered
                                ? 'bg-white/10'
                                : ''
                            }`}>
                              <span
                                className={`text-sm sm:text-base ${
                                  isTodayDate
                                    ? 'text-white font-medium'
                                    : dayIdx === 0
                                    ? 'text-rose-400/60'
                                    : dayIdx === 6
                                    ? 'text-blue-400/60'
                                    : 'text-white/60'
                                }`}
                                style={{ fontFamily: "var(--font-cormorant), serif" }}
                              >
                                {day}
                              </span>

                              {/* Today indicator ring */}
                              {isTodayDate && (
                                <motion.div
                                  className="absolute inset-0 rounded-full border-2 border-[#b7916e]"
                                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                />
                              )}
                            </div>

                            {/* Task indicators */}
                            {taskStats.total > 0 && (
                              <div className="flex items-center gap-0.5 mt-1.5">
                                {taskStats.done > 0 && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                )}
                                {taskStats.inProgress > 0 && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                )}
                                {taskStats.pending > 0 && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                                )}
                              </div>
                            )}

                            {/* Hover tooltip */}
                            <AnimatePresence>
                              {isHovered && taskStats.total > 0 && (
                                <motion.div
                                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                  className="absolute z-20 top-full mt-1 px-2 py-1 rounded-lg bg-[#1a1a1a] border border-white/10 shadow-xl"
                                >
                                  <span className="text-[10px] text-white/70 whitespace-nowrap">
                                    {taskStats.total}개 업무
                                  </span>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Legend */}
        <div className="flex items-center justify-end gap-4 px-4 py-3 border-t border-white/[0.06] bg-white/[0.01]">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-white/40">완료</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-[10px] text-white/40">진행중</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-white/30" />
            <span className="text-[10px] text-white/40">대기</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
