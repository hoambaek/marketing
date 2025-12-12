'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { AVAILABLE_YEARS } from '@/lib/types';
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
import { useMasterPlanStore } from '@/lib/store/masterplan-store';
import { toast } from '@/lib/store/toast-store';
import { MONTHS_INFO, Task, TaskStatus } from '@/lib/types';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  Calendar,
  Waves,
} from 'lucide-react';
import TaskModal from '@/components/TaskModal';
import SortableTaskItem from '@/components/SortableTaskItem';

const PHASE_COLORS: Record<number, { accent: string; glow: string }> = {
  1: { accent: 'from-blue-500 to-blue-400', glow: 'rgba(59, 130, 246, 0.15)' },
  2: { accent: 'from-emerald-500 to-emerald-400', glow: 'rgba(16, 185, 129, 0.15)' },
  3: { accent: 'from-amber-500 to-amber-400', glow: 'rgba(245, 158, 11, 0.15)' },
  4: { accent: 'from-rose-500 to-rose-400', glow: 'rgba(236, 72, 153, 0.15)' },
};

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

export default function MonthDetailPage() {
  const params = useParams();
  const monthId = parseInt(params.id as string);
  const month = MONTHS_INFO.find((m) => m.id === monthId);

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([1, 2, 3, 4]);

  const {
    getTasksByMonthAndWeek,
    getProgressByMonth,
    updateTaskStatus,
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
  } = useMasterPlanStore();
  const progress = getProgressByMonth(selectedYear, monthId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch by only rendering DnD after mount
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

  const toggleWeek = (week: number) => {
    setExpandedWeeks((prev) =>
      prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week]
    );
  };

  const handleStatusToggle = async (taskId: string, currentStatus: TaskStatus) => {
    const nextStatus: TaskStatus = currentStatus === 'done' ? 'pending' : 'done';
    await updateTaskStatus(taskId, nextStatus);
  };

  const handleAddTask = (week: number) => {
    setSelectedWeek(week);
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedWeek(task.week);
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('이 업무를 삭제하시겠습니까?')) {
      await deleteTask(taskId);
      toast.success('업무가 삭제되었습니다');
    }
  };

  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> | Partial<Task>) => {
    if (editingTask) {
      await updateTask(editingTask.id, taskData);
      toast.success('업무가 수정되었습니다');
    } else {
      await addTask(taskData as Omit<Task, 'id' | 'createdAt' | 'updatedAt'>);
      toast.success('업무가 추가되었습니다');
    }
  };

  const handleDragEnd = (event: DragEndEvent, week: number) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderTasks(selectedYear, monthId, week, active.id as string, over.id as string);
    }
  };

  if (!month) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0d1525] to-[#0a0f1a]" />
        </div>
        <p className="text-white/40">월을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const weekTitles: Record<number, string> = {
    1: '첫째 주',
    2: '둘째 주',
    3: '셋째 주',
    4: '넷째 주',
  };

  const phaseColors = PHASE_COLORS[month.phase] || PHASE_COLORS[1];

  return (
    <div className="min-h-screen pb-20">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0d1525] to-[#0a0f1a]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(183, 145, 110, 0.12), transparent),
                              radial-gradient(ellipse 60% 40% at 20% 60%, ${phaseColors.glow}, transparent)`,
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

      {/* Header */}
      <section className="px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div className="mx-auto max-w-4xl">
          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">대시보드</span>
            </Link>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Decorative Line */}
            <motion.div variants={itemVariants} className="flex items-center gap-4 mb-6">
              <motion.div
                className="h-px flex-1 bg-gradient-to-r from-transparent to-[#b7916e]/30"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
              />
              <Calendar className="w-5 h-5 text-[#b7916e]" />
              <motion.div
                className="h-px flex-1 bg-gradient-to-l from-transparent to-[#b7916e]/30"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </motion.div>

            {/* Title & Phase */}
            <motion.div variants={itemVariants} className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1
                  className="text-4xl sm:text-5xl lg:text-6xl text-white/90 mb-2 tracking-tight"
                  style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                >
                  {month.name}
                </h1>
                <p
                  className="text-xl text-[#d4c4a8]"
                  style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                >
                  {month.title}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/30 uppercase tracking-wider">Phase {month.phase}</p>
                <p className="text-sm font-medium text-[#b7916e]">{month.phaseName}</p>
              </div>
            </motion.div>

            <motion.p variants={itemVariants} className="text-white/40 mb-8">
              {month.description}
            </motion.p>

            {/* Progress Card */}
            <motion.div
              variants={itemVariants}
              className="relative rounded-2xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#b7916e]/[0.08] to-white/[0.02] backdrop-blur-sm" />
              <div className="absolute inset-0 border border-[#b7916e]/20 rounded-2xl" />
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  background: 'radial-gradient(circle at 50% 0%, rgba(183, 145, 110, 0.1), transparent 50%)',
                }}
              />
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-white/40 uppercase tracking-wider">월간 진행률</span>
                  <span
                    className="text-3xl text-white/90"
                    style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                  >
                    {progress}
                    <span className="text-lg text-white/40">%</span>
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                    className={`h-full rounded-full bg-gradient-to-r ${phaseColors.accent}`}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Weeks */}
      <section className="px-4 sm:px-6 lg:px-8 mt-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-4xl space-y-4"
        >
          {[1, 2, 3, 4].map((week) => {
            const weekTasks = getTasksByMonthAndWeek(selectedYear, monthId, week);
            const completedCount = weekTasks.filter((t) => t.status === 'done').length;
            const isExpanded = expandedWeeks.includes(week);

            return (
              <motion.div
                key={week}
                variants={itemVariants}
                className="relative rounded-2xl overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
                <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />
                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(circle at 50% 100%, ${phaseColors.glow}, transparent 70%)`,
                  }}
                />

                {/* Week Header */}
                <div className="relative flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors">
                  <button
                    onClick={() => toggleWeek(week)}
                    className="flex items-center gap-3 flex-1"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-white/40" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/40" />
                    )}
                    <h2
                      className="text-lg text-white/80"
                      style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                    >
                      {weekTitles[week]}
                    </h2>
                    <span className="text-sm text-white/30">
                      {completedCount}/{weekTasks.length} 완료
                    </span>
                  </button>
                  <button
                    onClick={() => handleAddTask(week)}
                    className="p-2.5 rounded-xl hover:bg-[#b7916e]/10 transition-colors text-[#b7916e]"
                    title="업무 추가"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Week Tasks */}
                <AnimatePresence>
                  {isExpanded && weekTasks.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="relative border-t border-white/[0.06]"
                    >
                      <div className="p-5 space-y-3">
                        {isMounted ? (
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(e) => handleDragEnd(e, week)}
                          >
                            <SortableContext
                              items={weekTasks.map((t) => t.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              {weekTasks.map((task) => (
                                <SortableTaskItem
                                  key={task.id}
                                  task={task}
                                  onStatusToggle={handleStatusToggle}
                                  onEdit={handleEditTask}
                                  onDelete={handleDeleteTask}
                                />
                              ))}
                            </SortableContext>
                          </DndContext>
                        ) : (
                          // SSR placeholder to prevent hydration mismatch
                          weekTasks.map((task) => (
                            <div
                              key={task.id}
                              className="p-4 rounded-xl bg-white/[0.02] animate-pulse"
                            >
                              <div className="h-5 bg-white/[0.06] rounded w-3/4 mb-2" />
                              <div className="h-3 bg-white/[0.04] rounded w-1/2" />
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}

                  {isExpanded && weekTasks.length === 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="relative border-t border-white/[0.06]"
                    >
                      <div className="p-10 text-center">
                        <p className="text-sm text-white/30 mb-4">
                          이번 주에 등록된 업무가 없습니다.
                        </p>
                        <button
                          onClick={() => handleAddTask(week)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#b7916e]/10 border border-[#b7916e]/20 text-[#d4c4a8] hover:bg-[#b7916e]/20 transition-colors text-sm font-medium"
                        >
                          <Plus className="w-4 h-4" />
                          업무 추가
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Navigation */}
      <section className="px-4 sm:px-6 lg:px-8 pt-12">
        <div className="mx-auto max-w-4xl">
          <div className="flex justify-between items-center">
            {monthId > 1 ? (
              <Link
                href={`/month/${monthId - 1}`}
                className="group inline-flex items-center gap-3 text-white/40 hover:text-white/70 transition-colors"
              >
                <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] group-hover:bg-white/[0.08] transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                <span className="text-sm">{MONTHS_INFO[monthId - 2]?.name}</span>
              </Link>
            ) : (
              <div />
            )}

            {monthId < 8 && (
              <Link
                href={`/month/${monthId + 1}`}
                className="group inline-flex items-center gap-3 text-white/40 hover:text-white/70 transition-colors"
              >
                <span className="text-sm">{MONTHS_INFO[monthId]?.name}</span>
                <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] group-hover:bg-white/[0.08] transition-colors">
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </div>
              </Link>
            )}
          </div>

          {/* Bottom Decoration */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-16 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Waves className="w-4 h-4 text-[#b7916e]/50" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/20">
              Muse de Marée · {month.name}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
        month={monthId}
        week={selectedWeek}
      />
    </div>
  );
}
