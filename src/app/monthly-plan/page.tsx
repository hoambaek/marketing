'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useMasterPlanStore } from '@/lib/store/masterplan-store';
import { MONTHS_INFO, PHASE_INFO, AVAILABLE_YEARS, Task, TaskStatus, MustDoItem, CATEGORY_LABELS, TaskCategory } from '@/lib/types';
import { Footer } from '@/components/layout/Footer';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  Pencil,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import TaskModal from '@/components/TaskModal';
import SortableTaskItem from '@/components/SortableTaskItem';

const phaseColors = {
  1: { primary: '#3B82F6', gradient: 'from-blue-500/20 to-blue-600/5', glow: 'rgba(59, 130, 246, 0.15)' },
  2: { primary: '#10B981', gradient: 'from-emerald-500/20 to-emerald-600/5', glow: 'rgba(16, 185, 129, 0.15)' },
  3: { primary: '#F59E0B', gradient: 'from-amber-500/20 to-amber-600/5', glow: 'rgba(245, 158, 11, 0.15)' },
  4: { primary: '#EC4899', gradient: 'from-rose-500/20 to-rose-600/5', glow: 'rgba(236, 72, 153, 0.15)' },
  5: { primary: '#8B7355', gradient: 'from-amber-700/20 to-amber-800/5', glow: 'rgba(139, 115, 85, 0.15)' },
};

const weekTitles: Record<number, { short: string; full: string }> = {
  1: { short: 'W1', full: '첫째 주' },
  2: { short: 'W2', full: '둘째 주' },
  3: { short: 'W3', full: '셋째 주' },
  4: { short: 'W4', full: '넷째 주' },
};

// Get current month and week based on today's date
const getCurrentMonthAndWeek = () => {
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentDay = today.getDate();

  // Calculate current week (1-4)
  let currentWeek = Math.ceil(currentDay / 7);
  if (currentWeek > 4) currentWeek = 4;

  // For 2026 project, default to month 1 if we're not in 2026
  const year = today.getFullYear();
  if (year !== 2026) {
    return { month: 1, week: 1 };
  }

  // Clamp month to 1-12
  const clampedMonth = Math.max(1, Math.min(12, currentMonth));

  return { month: clampedMonth, week: currentWeek };
};

export default function MonthlyPlanPage() {
  const {
    getProgressByMonth,
    getTasksByMonthAndWeek,
    tasks,
    updateTaskStatus,
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
    getMustDoByMonth,
    toggleMustDo,
    addMustDo,
    updateMustDo,
    deleteMustDo,
  } = useMasterPlanStore();

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const { month: initialMonth, week: initialWeek } = getCurrentMonthAndWeek();
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth);
  const [selectedWeek, setSelectedWeek] = useState<number>(initialWeek);
  const [isMounted, setIsMounted] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Must-Do state
  const [showMustDoForm, setShowMustDoForm] = useState(false);
  const [editingMustDoId, setEditingMustDoId] = useState<string | null>(null);
  const [mustDoFormData, setMustDoFormData] = useState({ title: '', category: 'operation' as TaskCategory });

  // Refs for swipe gestures
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const currentMonthInfo = MONTHS_INFO.find((m) => m.id === selectedMonth);
  const phase = PHASE_INFO.find((p) => p.months.includes(selectedMonth));
  const colors = phaseColors[phase?.id as keyof typeof phaseColors] || phaseColors[1];
  const progress = getProgressByMonth(selectedYear, selectedMonth);
  const weekTasks = getTasksByMonthAndWeek(selectedYear, selectedMonth, selectedWeek);
  const mustDoItems = getMustDoByMonth(selectedYear, selectedMonth);

  // Navigation handlers
  const goToPrevMonth = () => {
    if (selectedMonth > 1) {
      setSelectedMonth(selectedMonth - 1);
      setSelectedWeek(1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth < 12) {
      setSelectedMonth(selectedMonth + 1);
      setSelectedWeek(1);
    }
  };

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

  // Must-Do handlers
  const handleAddMustDo = () => {
    setEditingMustDoId(null);
    setMustDoFormData({ title: '', category: 'operation' });
    setShowMustDoForm(true);
  };

  const handleEditMustDo = (item: MustDoItem) => {
    setEditingMustDoId(item.id);
    setMustDoFormData({ title: item.title, category: item.category });
    setShowMustDoForm(true);
  };

  const handleDeleteMustDo = async (id: string) => {
    await deleteMustDo(id);
  };

  const handleSaveMustDo = async () => {
    if (!mustDoFormData.title.trim()) return;

    if (editingMustDoId) {
      await updateMustDo(editingMustDoId, {
        title: mustDoFormData.title,
        category: mustDoFormData.category,
      });
    } else {
      await addMustDo({
        year: selectedYear,
        month: selectedMonth,
        title: mustDoFormData.title,
        done: false,
        category: mustDoFormData.category,
      });
    }
    setShowMustDoForm(false);
    setEditingMustDoId(null);
    setMustDoFormData({ title: '', category: 'operation' });
  };

  const handleCancelMustDo = () => {
    setShowMustDoForm(false);
    setEditingMustDoId(null);
    setMustDoFormData({ title: '', category: 'operation' });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderTasks(selectedYear, selectedMonth, selectedWeek, active.id as string, over.id as string);
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

      {/* Year Selection - Minimal Inline */}
      <section className="relative py-2 px-4 sm:px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.85 }}
            className="flex items-center justify-center gap-1"
          >
            {AVAILABLE_YEARS.map((year, index) => {
              const isSelected = selectedYear === year;
              return (
                <motion.button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className="relative group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Connector line between years */}
                  {index > 0 && (
                    <div className="absolute right-full top-1/2 w-3 h-px bg-white/10 -translate-y-1/2" />
                  )}

                  <motion.div
                    className="relative px-4 py-1.5 rounded-full transition-all duration-300"
                    animate={{
                      backgroundColor: isSelected ? 'rgba(183, 145, 110, 0.15)' : 'transparent',
                    }}
                    style={{
                      border: isSelected ? '1px solid rgba(183, 145, 110, 0.3)' : '1px solid transparent',
                    }}
                  >
                    <span
                      className={`text-lg transition-all duration-300 ${
                        isSelected ? 'text-[#d4c4a8]' : 'text-white/30 group-hover:text-white/50'
                      }`}
                      style={{ fontFamily: "var(--font-cormorant), serif" }}
                    >
                      {year}
                    </span>

                    {/* Active indicator dot */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#b7916e]"
                      />
                    )}
                  </motion.div>
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Month Timeline Navigator */}
      <section className="relative py-4 px-4 sm:px-6 lg:px-12" ref={containerRef}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="relative"
          >
            {/* 12-Month Timeline Strip */}
            <div className="relative">
              {/* Background Track */}
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/[0.06] -translate-y-1/2" />

              {/* Progress Track */}
              <motion.div
                className="absolute top-1/2 left-0 h-px -translate-y-1/2 origin-left"
                style={{ backgroundColor: colors.primary }}
                initial={{ width: 0 }}
                animate={{ width: `${((selectedMonth - 1) / 11) * 100}%` }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              />

              {/* Month Nodes */}
              <div className="relative flex items-center justify-between py-3">
                {MONTHS_INFO.map((month) => {
                  const monthPhase = PHASE_INFO.find((p) => p.months.includes(month.id));
                  const monthColor = phaseColors[monthPhase?.id as keyof typeof phaseColors]?.primary || '#3B82F6';
                  const isSelected = month.id === selectedMonth;
                  const isPast = month.id < selectedMonth;
                  const monthProgress = getProgressByMonth(selectedYear, month.id);

                  return (
                    <motion.button
                      key={month.id}
                      onClick={() => {
                        setSelectedMonth(month.id);
                        setSelectedWeek(1);
                      }}
                      className="relative group flex flex-col items-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Node */}
                      <motion.div
                        className="relative flex items-center justify-center transition-all duration-300"
                        animate={{
                          width: isSelected ? 44 : 28,
                          height: isSelected ? 44 : 28,
                        }}
                      >
                        {/* Outer ring for selected */}
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute inset-0 rounded-full"
                            style={{
                              background: `linear-gradient(135deg, ${monthColor}30, ${monthColor}10)`,
                              border: `1px solid ${monthColor}40`,
                            }}
                          />
                        )}

                        {/* Inner node */}
                        <motion.div
                          className="relative rounded-full flex items-center justify-center transition-all duration-300"
                          animate={{
                            width: isSelected ? 32 : isPast ? 20 : 18,
                            height: isSelected ? 32 : isPast ? 20 : 18,
                            backgroundColor: isSelected ? monthColor : isPast ? `${monthColor}60` : 'rgba(255,255,255,0.08)',
                          }}
                        >
                          {/* Month number or progress */}
                          <span
                            className={`transition-all ${
                              isSelected ? 'text-[10px] sm:text-xs text-white font-medium' : isPast ? 'text-[8px] sm:text-[10px] text-white/60' : 'text-[8px] sm:text-[10px] text-white/25'
                            }`}
                            style={{
                              fontFamily: isSelected
                                ? "var(--font-cormorant), serif"
                                : "var(--font-lora), Georgia, serif",
                            }}
                          >
                            {isSelected ? (isMounted ? `${monthProgress}%` : '—') : month.id}
                          </span>
                        </motion.div>
                      </motion.div>

                      {/* Month label - only visible on hover or selected */}
                      <motion.div
                        className={`absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap transition-all duration-200 ${
                          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'
                        }`}
                      >
                        <span
                          className="text-[10px] sm:text-xs"
                          style={{
                            color: isSelected ? monthColor : 'rgba(255,255,255,0.5)',
                            fontFamily: "var(--font-cormorant), serif"
                          }}
                        >
                          {month.name.slice(0, 3)}
                        </span>
                      </motion.div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Selected Month Info Bar */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedMonth}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mt-8 flex items-center justify-between gap-4"
              >
                {/* Left: Navigation + Month Name */}
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.1, x: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={goToPrevMonth}
                    disabled={selectedMonth <= 1}
                    className={`p-1.5 rounded-lg transition-all ${
                      selectedMonth <= 1
                        ? 'opacity-20 cursor-not-allowed'
                        : 'hover:bg-white/[0.06]'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4 text-white/40" />
                  </motion.button>

                  <div className="flex items-baseline gap-3">
                    <h2
                      className="text-2xl sm:text-3xl text-white/95"
                      style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                    >
                      {currentMonthInfo?.name}
                    </h2>
                    <span className="text-white/30 text-sm font-light hidden sm:inline">
                      {currentMonthInfo?.title}
                    </span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.1, x: 2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={goToNextMonth}
                    disabled={selectedMonth >= 12}
                    className={`p-1.5 rounded-lg transition-all ${
                      selectedMonth >= 12
                        ? 'opacity-20 cursor-not-allowed'
                        : 'hover:bg-white/[0.06]'
                    }`}
                  >
                    <ChevronRight className="w-4 h-4 text-white/40" />
                  </motion.button>
                </div>

                {/* Right: Stats */}
                <div className="flex items-center gap-4">
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
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-1" title="완료">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[10px] sm:text-xs text-white/60">
                        {isMounted ? tasks.filter(t => t.month === selectedMonth && t.status === 'done').length : '—'}
                      </span>
                    </div>
                    <div className="w-px h-3 bg-white/10" />
                    <div className="flex items-center gap-1" title="진행중">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="text-[10px] sm:text-xs text-white/60">
                        {isMounted ? tasks.filter(t => t.month === selectedMonth && t.status === 'in_progress').length : '—'}
                      </span>
                    </div>
                    <div className="w-px h-3 bg-white/10" />
                    <div className="flex items-center gap-1" title="대기">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                      <span className="text-[10px] sm:text-xs text-white/60">
                        {isMounted ? tasks.filter(t => t.month === selectedMonth && t.status === 'pending').length : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Must-Do Checklist Section - Compact */}
      <section className="relative py-3 sm:py-4 px-4 sm:px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.06]"
          >
            {/* Compact Header */}
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex items-center gap-2">
                <div className="w-0.5 h-4 rounded-full" style={{ backgroundColor: colors.primary }} />
                <span className="text-xs sm:text-sm font-medium text-white/70">필수 체크</span>
                {mustDoItems.length > 0 && (
                  <>
                    <div className="h-3 w-px bg-white/10" />
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-12 sm:w-16 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(mustDoItems.filter(i => i.done).length / mustDoItems.length) * 100}%`,
                            backgroundColor: colors.primary
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-white/40">
                        {mustDoItems.filter(i => i.done).length}/{mustDoItems.length}
                      </span>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={handleAddMustDo}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] sm:text-xs text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-all"
              >
                <Plus className="w-3 h-3" />
                <span className="hidden sm:inline">추가</span>
              </button>
            </div>

            {/* Add/Edit Form */}
            <AnimatePresence>
              {showMustDoForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-2 sm:mb-3 overflow-hidden"
                >
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                    <input
                      type="text"
                      value={mustDoFormData.title}
                      onChange={(e) => setMustDoFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="체크리스트 항목 입력..."
                      className="flex-1 bg-transparent text-xs sm:text-sm text-white/80 placeholder:text-white/30 focus:outline-none"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveMustDo()}
                    />
                    <select
                      value={mustDoFormData.category}
                      onChange={(e) => setMustDoFormData(prev => ({ ...prev, category: e.target.value as TaskCategory }))}
                      className="px-2 py-1 bg-white/[0.04] border border-white/[0.08] rounded text-[10px] sm:text-xs text-white/60 focus:outline-none cursor-pointer"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                        <option key={value} value={value} className="bg-[#0d1525]">{label}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleSaveMustDo}
                      className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors"
                      style={{ color: colors.primary }}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleCancelMustDo}
                      className="p-1.5 rounded-md text-white/40 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Compact Checklist */}
            {mustDoItems.length > 0 ? (
              <div className="space-y-1">
                {mustDoItems.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center gap-2 py-1.5 px-2 -mx-2 rounded-lg hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleMustDo(item.id)}
                      className={`flex-shrink-0 w-4 h-4 rounded border transition-all flex items-center justify-center ${
                        item.done
                          ? 'border-transparent'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                      style={{ backgroundColor: item.done ? colors.primary : 'transparent' }}
                    >
                      {item.done && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    {/* Title */}
                    <span className={`flex-1 text-xs sm:text-sm truncate transition-all ${
                      item.done ? 'text-white/30 line-through' : 'text-white/70'
                    }`}>
                      {item.title}
                    </span>

                    {/* Category Badge */}
                    <span
                      className={`hidden sm:inline text-[9px] px-1.5 py-0.5 rounded transition-all ${
                        item.done ? 'opacity-30' : 'opacity-60'
                      }`}
                      style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}
                    >
                      {CATEGORY_LABELS[item.category]}
                    </span>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditMustDo(item); }}
                        className="p-1 rounded text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteMustDo(item.id); }}
                        className="p-1 rounded text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/30 text-center py-2">
                이번 달 필수 체크 항목이 없습니다
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Week Tabs & Tasks Section */}
      <section className="relative py-6 px-4 sm:px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            {/* Week Tabs */}
            <div className="relative mb-6">
              <div className="flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                {[1, 2, 3, 4].map((week) => {
                  const weekTasksCount = getTasksByMonthAndWeek(selectedYear, selectedMonth, week);
                  const completedCount = weekTasksCount.filter((t) => t.status === 'done').length;
                  const isSelected = week === selectedWeek;

                  return (
                    <button
                      key={week}
                      onClick={() => setSelectedWeek(week)}
                      className={`relative flex-1 py-2.5 sm:py-3 px-1 sm:px-4 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all ${
                        isSelected
                          ? 'text-white'
                          : 'text-white/40 hover:text-white/60'
                      }`}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="activeWeekTab"
                          className="absolute inset-0 rounded-lg sm:rounded-xl"
                          style={{
                            background: `linear-gradient(135deg, ${colors.primary}20, ${colors.primary}10)`,
                            border: `1px solid ${colors.primary}30`,
                          }}
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center justify-center gap-1 sm:gap-2">
                        <span className="hidden sm:inline">{weekTitles[week].full}</span>
                        <span className="sm:hidden">{weekTitles[week].short}</span>
                        <span
                          className={`px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-xs ${
                            isSelected
                              ? 'bg-white/10'
                              : 'bg-white/[0.04]'
                          }`}
                        >
                          {isMounted ? `${completedCount}/${weekTasksCount.length}` : '—'}
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
                key={`${selectedMonth}-${selectedWeek}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="relative rounded-2xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
                <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />

                {/* Header */}
                <div className="relative flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4" style={{ color: colors.primary }} />
                    <span className="text-white/60 text-sm">
                      {currentMonthInfo?.name} · {weekTitles[selectedWeek].full}
                    </span>
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
                  {weekTasks.length > 0 ? (
                    isMounted ? (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={weekTasks.map((t) => t.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-3">
                            {weekTasks.map((task) => (
                              <SortableTaskItem
                                key={task.id}
                                task={task}
                                onStatusToggle={handleStatusToggle}
                                onEdit={handleEditTask}
                                onDelete={handleDeleteTask}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    ) : (
                      <div className="space-y-3">
                        {weekTasks.map((task) => (
                          <div
                            key={task.id}
                            className="p-4 rounded-xl bg-white/[0.02] animate-pulse"
                          >
                            <div className="h-5 bg-white/[0.06] rounded w-3/4 mb-2" />
                            <div className="h-3 bg-white/[0.04] rounded w-1/2" />
                          </div>
                        ))}
                      </div>
                    )
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
                      <p className="text-white/40 mb-2">이번 주에 등록된 업무가 없습니다</p>
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
        week={selectedWeek}
      />
    </div>
  );
}
