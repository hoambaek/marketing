'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useMasterPlanStore } from '@/lib/store/masterplan-store';
import { useShallow } from 'zustand/react/shallow';
import { MONTHS_INFO, PHASE_INFO, AVAILABLE_YEARS, Task, TaskStatus, TaskCategory } from '@/lib/types';
import { Footer } from '@/components/layout/Footer';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
} from 'lucide-react';
import SortableTaskItem from '@/components/SortableTaskItem';

// 동적 임포트 - 모달은 필요할 때만 로드
const TaskModal = dynamic(() => import('@/components/TaskModal'), {
  loading: () => <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="w-12 h-12 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
  </div>,
});

const phaseColors = {
  1: { primary: '#3B82F6', gradient: 'from-blue-500/20 to-blue-600/5', glow: 'rgba(59, 130, 246, 0.15)' },
  2: { primary: '#10B981', gradient: 'from-emerald-500/20 to-emerald-600/5', glow: 'rgba(16, 185, 129, 0.15)' },
  3: { primary: '#F59E0B', gradient: 'from-amber-500/20 to-amber-600/5', glow: 'rgba(245, 158, 11, 0.15)' },
  4: { primary: '#EC4899', gradient: 'from-rose-500/20 to-rose-600/5', glow: 'rgba(236, 72, 153, 0.15)' },
  5: { primary: '#8B7355', gradient: 'from-amber-700/20 to-amber-800/5', glow: 'rgba(139, 115, 85, 0.15)' },
};

// 카테고리 필터 옵션
const CATEGORY_FILTER_OPTIONS: { value: TaskCategory | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'operation', label: '운영' },
  { value: 'marketing', label: '마케팅' },
  { value: 'design', label: '디자인' },
  { value: 'filming', label: '촬영' },
  { value: 'pr', label: 'PR' },
  { value: 'b2b', label: 'B2B' },
];

export default function MonthlyPlanPage() {
  // 선택적 구독 - 필요한 상태만 구독하여 불필요한 리렌더링 방지
  const {
    getProgressByMonth,
    getTasksByMonth,
    tasks,
    updateTaskStatus,
    addTask,
    updateTask,
    deleteTask,
  } = useMasterPlanStore(
    useShallow((state) => ({
      getProgressByMonth: state.getProgressByMonth,
      getTasksByMonth: state.getTasksByMonth,
      tasks: state.tasks,
      updateTaskStatus: state.updateTaskStatus,
      addTask: state.addTask,
      updateTask: state.updateTask,
      deleteTask: state.deleteTask,
    }))
  );

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'all'>('all');
  const [isMounted, setIsMounted] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Refs for swipe gestures
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentMonthInfo = MONTHS_INFO.find((m) => m.id === selectedMonth);
  const phase = PHASE_INFO.find((p) => p.months.includes(selectedMonth));
  const colors = phaseColors[phase?.id as keyof typeof phaseColors] || phaseColors[1];
  const progress = getProgressByMonth(selectedYear, selectedMonth);

  // 월별 태스크 가져오기 (카테고리 필터 적용 + 마감일 정렬)
  const monthTasks = getTasksByMonth(selectedYear, selectedMonth);
  const filteredTasks = (selectedCategory === 'all'
    ? monthTasks
    : monthTasks.filter(t => t.category === selectedCategory)
  ).sort((a, b) => {
    // 마감일이 없는 항목은 맨 뒤로
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    // 마감일이 가까운 순서로 정렬 (오름차순)
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  // Navigation handlers - with year transition
  const minYear = Math.min(...AVAILABLE_YEARS);
  const maxYear = Math.max(...AVAILABLE_YEARS);

  const goToPrevMonth = () => {
    if (selectedMonth > 1) {
      setSelectedMonth(selectedMonth - 1);
    } else if (selectedYear > minYear) {
      setSelectedYear(selectedYear - 1);
      setSelectedMonth(12);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth < 12) {
      setSelectedMonth(selectedMonth + 1);
    } else if (selectedYear < maxYear) {
      setSelectedYear(selectedYear + 1);
      setSelectedMonth(1);
    }
  };

  const canGoPrev = selectedMonth > 1 || selectedYear > minYear;
  const canGoNext = selectedMonth < 12 || selectedYear < maxYear;

  // Task handlers
  const handleStatusToggle = async (taskId: string, currentStatus: TaskStatus) => {
    const nextStatus: TaskStatus = currentStatus === 'done' ? 'pending' : 'done';
    await updateTaskStatus(taskId, nextStatus);
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('이 업무를 삭제하시겠습니까?')) {
      await deleteTask(taskId);
    }
  };

  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> | Partial<Task>) => {
    if (editingTask) {
      await updateTask(editingTask.id, taskData);
    } else {
      await addTask(taskData as Omit<Task, 'id' | 'createdAt' | 'updatedAt'>);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0d1525] to-[#0a0f1a]" />
        <motion.div
          key={selectedMonth}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, ${colors.glow}, transparent),
                              radial-gradient(ellipse 60% 40% at 80% 60%, rgba(183, 145, 110, 0.08), transparent),
                              radial-gradient(ellipse 50% 30% at 20% 80%, ${colors.glow}, transparent)`,
          }}
        />
        {/* Subtle grain texture */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Hero Section - Compact on Mobile */}
      <section className="relative pt-8 sm:pt-16 pb-6 sm:pb-8 px-4 sm:px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
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

            <div className="sm:pl-14">
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-[#b7916e] text-[10px] sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-2 sm:mb-4 font-light"
              >
                Launch Roadmap
              </motion.p>

              <h1
                className="text-3xl sm:text-5xl lg:text-6xl text-white/95 mb-2 sm:mb-6 leading-[1.1] tracking-tight"
                style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
              >
                <span className="sm:block inline">Monthly </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b7916e] via-[#d4c4a8] to-[#b7916e]">
                  Master Plan
                </span>
              </h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="hidden sm:block text-white/40 text-lg max-w-md font-light leading-relaxed"
              >
                해저에서 숙성되는 시간의 여정,
                <br />
                12개월의 브랜드 완성 로드맵
              </motion.p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Unified Year/Month Navigator */}
      <section className="relative py-3 sm:py-4 px-4 sm:px-6 lg:px-12" ref={containerRef}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.85 }}
            className="relative"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedYear}-${selectedMonth}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-between gap-4"
              >
                {/* Left: Year/Month Navigation */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Prev Button */}
                  <motion.button
                    whileHover={{ scale: 1.1, x: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={goToPrevMonth}
                    disabled={!canGoPrev}
                    className={`p-1.5 sm:p-2 rounded-lg transition-all ${
                      !canGoPrev
                        ? 'opacity-20 cursor-not-allowed'
                        : 'hover:bg-white/[0.06] active:bg-white/[0.08]'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white/40" />
                  </motion.button>

                  {/* Year & Month Display */}
                  <div className="flex items-baseline gap-1.5 sm:gap-2">
                    {/* Year */}
                    <span
                      className="text-base sm:text-lg text-[#b7916e]/80"
                      style={{ fontFamily: "var(--font-cormorant), serif" }}
                    >
                      {selectedYear}
                    </span>

                    {/* Separator */}
                    <span className="text-white/20 text-sm hidden sm:inline">·</span>

                    {/* Month */}
                    <h2
                      className="text-2xl sm:text-3xl text-white/95"
                      style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                    >
                      {currentMonthInfo?.name}
                    </h2>

                    {/* Month Subtitle */}
                    <span className="text-white/30 text-xs sm:text-sm font-light hidden sm:inline ml-1">
                      {currentMonthInfo?.title}
                    </span>
                  </div>

                  {/* Next Button */}
                  <motion.button
                    whileHover={{ scale: 1.1, x: 2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={goToNextMonth}
                    disabled={!canGoNext}
                    className={`p-1.5 sm:p-2 rounded-lg transition-all ${
                      !canGoNext
                        ? 'opacity-20 cursor-not-allowed'
                        : 'hover:bg-white/[0.06] active:bg-white/[0.08]'
                    }`}
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white/40" />
                  </motion.button>
                </div>

                {/* Right: Phase & Stats */}
                <div className="flex items-center gap-2 sm:gap-4">
                  {/* Phase Badge */}
                  <span
                    className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-[10px] tracking-wider uppercase"
                    style={{
                      backgroundColor: `${colors.primary}15`,
                      color: colors.primary,
                      border: `1px solid ${colors.primary}25`,
                    }}
                  >
                    Phase {phase?.id}
                  </span>

                  {/* Mini Stats */}
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-1" title="완료">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[10px] sm:text-xs text-white/60">
                        {isMounted ? tasks.filter(t => t.month === selectedMonth && t.year === selectedYear && t.status === 'done').length : '—'}
                      </span>
                    </div>
                    <div className="w-px h-3 bg-white/10" />
                    <div className="flex items-center gap-1" title="진행중">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="text-[10px] sm:text-xs text-white/60">
                        {isMounted ? tasks.filter(t => t.month === selectedMonth && t.year === selectedYear && t.status === 'in_progress').length : '—'}
                      </span>
                    </div>
                    <div className="w-px h-3 bg-white/10" />
                    <div className="flex items-center gap-1" title="대기">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                      <span className="text-[10px] sm:text-xs text-white/60">
                        {isMounted ? tasks.filter(t => t.month === selectedMonth && t.year === selectedYear && t.status === 'pending').length : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Category Filter & Tasks Section */}
      <section className="relative py-6 px-4 sm:px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {/* Category Filter Tabs */}
            <div className="relative mb-6">
              <div className="flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-x-auto">
                {CATEGORY_FILTER_OPTIONS.map((option) => {
                  const isSelected = selectedCategory === option.value;
                  const categoryCount = option.value === 'all'
                    ? monthTasks.length
                    : monthTasks.filter(t => t.category === option.value).length;

                  return (
                    <button
                      key={option.value}
                      onClick={() => setSelectedCategory(option.value)}
                      className={`relative flex-shrink-0 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg sm:rounded-xl transition-all ${
                        isSelected
                          ? 'text-white'
                          : 'text-white/40 hover:text-white/60'
                      }`}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="activeCategoryTab"
                          className="absolute inset-0 rounded-lg sm:rounded-xl"
                          style={{
                            background: `linear-gradient(135deg, ${colors.primary}20, ${colors.primary}10)`,
                            border: `1px solid ${colors.primary}30`,
                          }}
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2 text-xs sm:text-sm font-medium whitespace-nowrap">
                        {option.label}
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs ${
                            isSelected ? 'bg-white/10' : 'bg-white/[0.04]'
                          }`}
                        >
                          {isMounted ? categoryCount : '—'}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tasks List */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedMonth}-${selectedCategory}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="relative rounded-2xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
                <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />

                {/* Header */}
                <div className="relative flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div
                      className="p-1.5 sm:p-2 rounded-lg"
                      style={{ backgroundColor: `${colors.primary}15` }}
                    >
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: colors.primary }} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white/80 text-sm sm:text-base font-medium">
                        {currentMonthInfo?.name} 업무 목록
                      </span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddTask}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{
                      backgroundColor: `${colors.primary}15`,
                      color: colors.primary,
                      border: `1px solid ${colors.primary}30`,
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">업무 추가</span>
                  </motion.button>
                </div>

                {/* Tasks Content */}
                <div className="relative p-5 min-h-[300px]">
                  {!isMounted ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="p-4 rounded-xl bg-white/[0.02] animate-pulse"
                        >
                          <div className="h-5 bg-white/[0.06] rounded w-3/4 mb-2" />
                          <div className="h-3 bg-white/[0.04] rounded w-1/2" />
                        </div>
                      ))}
                    </div>
                  ) : filteredTasks.length > 0 ? (
                    <div className="space-y-3">
                      {filteredTasks.map((task) => (
                        <SortableTaskItem
                          key={task.id}
                          task={task}
                          onStatusToggle={handleStatusToggle}
                          onEdit={handleEditTask}
                          onDelete={handleDeleteTask}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                        style={{
                          background: `linear-gradient(135deg, ${colors.primary}10, ${colors.primary}05)`,
                          border: `1px solid ${colors.primary}20`,
                        }}
                      >
                        <Plus className="w-8 h-8" style={{ color: colors.primary, opacity: 0.5 }} />
                      </motion.div>
                      <p className="text-white/40 mb-2">
                        {selectedCategory === 'all'
                          ? '이번 달에 등록된 업무가 없습니다'
                          : `${CATEGORY_FILTER_OPTIONS.find(o => o.value === selectedCategory)?.label} 카테고리에 업무가 없습니다`}
                      </p>
                      <p className="text-white/20 text-sm mb-6">새로운 업무를 추가해보세요</p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAddTask}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all"
                        style={{
                          backgroundColor: `${colors.primary}15`,
                          color: colors.primary,
                          border: `1px solid ${colors.primary}30`,
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        업무 추가하기
                      </motion.button>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
        month={selectedMonth}
        week={1}
      />
    </div>
  );
}
