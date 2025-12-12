'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useMasterPlanStore } from '@/lib/store/masterplan-store';
import { MONTHS_INFO, PHASE_INFO, CATEGORY_LABELS, TaskCategory } from '@/lib/types';
import { CheckCircle2, Clock, Circle, ArrowRight, Calendar, Target, TrendingUp } from 'lucide-react';

export default function HomePage() {
  const { getTotalProgress, getProgressByMonth, tasks, mustDoItems } = useMasterPlanStore();
  const totalProgress = getTotalProgress();

  // 이번 주 할 일 (1월 기준 샘플)
  const thisWeekTasks = tasks.filter((t) => t.month === 1 && t.week === 1).slice(0, 5);

  // 상태별 카운트
  const statusCounts = {
    done: tasks.filter((t) => t.status === 'done').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    pending: tasks.filter((t) => t.status === 'pending').length,
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-foreground mb-4">
              2026 런칭 마스터플랜
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              해저에서 숙성되는 시간, 브랜드가 완성되는 여정
            </p>
          </motion.div>

          {/* Total Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="card-luxury p-6 sm:p-8 mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">전체 진행률</p>
                <p className="text-4xl font-display text-foreground">
                  {totalProgress}
                  <span className="text-2xl text-muted-foreground">%</span>
                </p>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-emerald-500">{statusCounts.done}</p>
                  <p className="text-xs text-muted-foreground">완료</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-amber-500">{statusCounts.in_progress}</p>
                  <p className="text-xs text-muted-foreground">진행중</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-muted-foreground">{statusCounts.pending}</p>
                  <p className="text-xs text-muted-foreground">대기</p>
                </div>
              </div>
            </div>
            <div className="progress-bar h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${totalProgress}%` }}
                transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                className="progress-bar-fill"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Phase Timeline */}
      <section className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="mx-auto max-w-7xl">
          {PHASE_INFO.map((phase, phaseIndex) => (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + phaseIndex * 0.1 }}
              className="mb-8"
            >
              {/* Phase Header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: phase.color }}
                />
                <h2 className="font-display text-xl text-foreground">
                  Phase {phase.id}: {phase.name}
                </h2>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  {phase.description}
                </p>
              </div>

              {/* Month Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {phase.months.map((monthId) => {
                  const month = MONTHS_INFO.find((m) => m.id === monthId)!;
                  const progress = getProgressByMonth(monthId);
                  const isCurrentMonth = monthId === 1; // 현재 1월 가정

                  return (
                    <Link key={monthId} href={`/month/${monthId}`}>
                      <motion.div
                        whileHover={{ y: -4 }}
                        className={`card-luxury p-5 cursor-pointer group relative overflow-hidden ${
                          isCurrentMonth ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : ''
                        }`}
                      >
                        {/* Current Month Indicator */}
                        {isCurrentMonth && (
                          <div className="absolute top-3 right-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                              현재
                            </span>
                          </div>
                        )}

                        {/* Month Name */}
                        <p className="font-display text-3xl text-foreground mb-1">
                          {month.name}
                        </p>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-1">
                          {month.title}
                        </p>

                        {/* Progress */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">진행률</span>
                            <span className="text-sm font-medium text-foreground">
                              {progress}%
                            </span>
                          </div>
                          <div className="progress-bar h-1.5">
                            <div
                              className="progress-bar-fill"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Hover Arrow */}
                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowRight className="w-5 h-5 text-accent" />
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bottom Cards */}
      <section className="px-4 sm:px-6 lg:px-8 pb-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-6">
            {/* This Week Tasks */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="card-luxury p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-accent" />
                <h3 className="font-display text-xl text-foreground">이번 주 할 일</h3>
              </div>
              <div className="space-y-3">
                {thisWeekTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3">
                    {task.status === 'done' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    ) : task.status === 'in_progress' ? (
                      <Clock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${
                          task.status === 'done'
                            ? 'text-muted-foreground line-through'
                            : 'text-foreground'
                        }`}
                      >
                        {task.title}
                      </p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium badge-${task.category}`}
                      >
                        {CATEGORY_LABELS[task.category as TaskCategory]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/month/1"
                className="mt-4 inline-flex items-center gap-1 text-sm text-accent hover:text-accent/80 transition-colors"
              >
                전체 보기
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="card-luxury p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-accent" />
                <h3 className="font-display text-xl text-foreground">진행 현황</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-emerald-500/10">
                  <Target className="w-5 h-5 text-emerald-500 mb-2" />
                  <p className="text-2xl font-semibold text-foreground">
                    {mustDoItems.filter((m) => m.done).length}
                    <span className="text-sm text-muted-foreground">
                      /{mustDoItems.length}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">Must-Do 완료</p>
                </div>

                <div className="p-4 rounded-xl bg-blue-500/10">
                  <Calendar className="w-5 h-5 text-blue-500 mb-2" />
                  <p className="text-2xl font-semibold text-foreground">
                    D-{getDaysUntilLaunch()}
                  </p>
                  <p className="text-xs text-muted-foreground">런칭까지</p>
                </div>

                <div className="p-4 rounded-xl bg-violet-500/10">
                  <p className="text-2xl font-semibold text-foreground">Phase 1</p>
                  <p className="text-xs text-muted-foreground">현재 단계</p>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10">
                  <p className="text-2xl font-semibold text-foreground">
                    {tasks.filter((t) => t.month === 1).length}
                  </p>
                  <p className="text-xs text-muted-foreground">이번 달 업무</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
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
