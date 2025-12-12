'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useMasterPlanStore } from '@/lib/store/masterplan-store';
import { MONTHS_INFO, CATEGORY_LABELS, STATUS_LABELS, TaskCategory, TaskStatus } from '@/lib/types';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Circle,
  ChevronDown,
  ChevronUp,
  FileText,
  Plus,
} from 'lucide-react';

export default function MonthDetailPage() {
  const params = useParams();
  const monthId = parseInt(params.id as string);
  const month = MONTHS_INFO.find((m) => m.id === monthId);

  const { getTasksByMonthAndWeek, getProgressByMonth, updateTaskStatus, tasks } = useMasterPlanStore();
  const progress = getProgressByMonth(monthId);

  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([1, 2, 3, 4]);

  const toggleWeek = (week: number) => {
    setExpandedWeeks((prev) =>
      prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week]
    );
  };

  const handleStatusToggle = (taskId: string, currentStatus: TaskStatus) => {
    const nextStatus: TaskStatus = currentStatus === 'done' ? 'pending' : 'done';
    updateTaskStatus(taskId, nextStatus);
  };

  if (!month) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">월을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const weekTitles: Record<number, string> = {
    1: '첫째 주',
    2: '둘째 주',
    3: '셋째 주',
    4: '넷째 주',
  };

  return (
    <div className="min-h-screen pb-12">
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
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">타임라인</span>
            </Link>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h1 className="font-display text-4xl sm:text-5xl text-foreground mb-2">
                  {month.name}
                </h1>
                <p className="text-xl text-muted-foreground">{month.title}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Phase {month.phase}</p>
                <p className="text-sm font-medium text-accent">{month.phaseName}</p>
              </div>
            </div>
            <p className="text-muted-foreground mb-6">{month.description}</p>
          </motion.div>

          {/* Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="card-luxury p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">월간 진행률</span>
              <span className="text-2xl font-display text-foreground">{progress}%</span>
            </div>
            <div className="progress-bar h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                className="progress-bar-fill"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Weeks */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-4">
          {[1, 2, 3, 4].map((week, weekIndex) => {
            const weekTasks = getTasksByMonthAndWeek(monthId, week);
            const completedCount = weekTasks.filter((t) => t.status === 'done').length;
            const isExpanded = expandedWeeks.includes(week);

            return (
              <motion.div
                key={week}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + weekIndex * 0.1 }}
                className="card-luxury overflow-hidden"
              >
                {/* Week Header */}
                <button
                  onClick={() => toggleWeek(week)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                    <h2 className="font-display text-lg text-foreground">{weekTitles[week]}</h2>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {completedCount}/{weekTasks.length} 완료
                  </span>
                </button>

                {/* Week Tasks */}
                <AnimatePresence>
                  {isExpanded && weekTasks.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-border/50"
                    >
                      <div className="p-5 space-y-3">
                        {weekTasks.map((task) => (
                          <motion.div
                            key={task.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`group p-4 rounded-xl transition-all ${
                              task.status === 'done'
                                ? 'bg-muted/30'
                                : 'bg-background hover:bg-muted/20'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Checkbox */}
                              <button
                                onClick={() => handleStatusToggle(task.id, task.status)}
                                className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110"
                              >
                                {task.status === 'done' ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                ) : task.status === 'in_progress' ? (
                                  <Clock className="w-5 h-5 text-amber-500" />
                                ) : (
                                  <Circle className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                                )}
                              </button>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`font-medium ${
                                    task.status === 'done'
                                      ? 'text-muted-foreground line-through'
                                      : 'text-foreground'
                                  }`}
                                >
                                  {task.title}
                                </p>

                                {task.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {task.description}
                                  </p>
                                )}

                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  {/* Category Badge */}
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium badge-${task.category}`}
                                  >
                                    {CATEGORY_LABELS[task.category as TaskCategory]}
                                  </span>

                                  {/* Deliverables */}
                                  {task.deliverables && task.deliverables.length > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-xs text-muted-foreground">
                                      <FileText className="w-3 h-3" />
                                      {task.deliverables[0]}
                                      {task.deliverables.length > 1 && (
                                        <span> +{task.deliverables.length - 1}</span>
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {isExpanded && weekTasks.length === 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border/50"
                    >
                      <div className="p-8 text-center text-muted-foreground">
                        <p className="text-sm">이번 주에 등록된 업무가 없습니다.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Navigation */}
      <section className="px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mx-auto max-w-4xl flex justify-between">
          {monthId > 1 ? (
            <Link
              href={`/month/${monthId - 1}`}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{MONTHS_INFO[monthId - 2]?.name}</span>
            </Link>
          ) : (
            <div />
          )}

          {monthId < 8 && (
            <Link
              href={`/month/${monthId + 1}`}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>{MONTHS_INFO[monthId]?.name}</span>
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
