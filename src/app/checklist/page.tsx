'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useMasterPlanStore } from '@/lib/store/masterplan-store';
import { MONTHS_INFO } from '@/lib/types';
import { CheckCircle2, Circle, Filter } from 'lucide-react';

type FilterType = 'all' | 'pending' | 'done';

export default function ChecklistPage() {
  const { mustDoItems, toggleMustDo } = useMasterPlanStore();
  const [filter, setFilter] = useState<FilterType>('all');

  const totalItems = mustDoItems.length;
  const doneItems = mustDoItems.filter((item) => item.done).length;
  const progress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  const filteredByMonth = MONTHS_INFO.map((month) => {
    const monthItems = mustDoItems.filter((item) => item.month === month.id);
    const filtered =
      filter === 'all'
        ? monthItems
        : filter === 'done'
        ? monthItems.filter((item) => item.done)
        : monthItems.filter((item) => !item.done);

    return {
      ...month,
      items: filtered,
      totalCount: monthItems.length,
      doneCount: monthItems.filter((item) => item.done).length,
    };
  });

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <section className="px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display text-4xl sm:text-5xl text-foreground mb-2">
              Must-Do 체크리스트
            </h1>
            <p className="text-muted-foreground text-lg mb-6">
              런칭까지 반드시 완료해야 할 핵심 업무
            </p>
          </motion.div>

          {/* Progress Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="card-luxury p-6 mb-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">전체 완료율</p>
                <p className="text-3xl font-display text-foreground">
                  {doneItems}
                  <span className="text-xl text-muted-foreground">/{totalItems}</span>
                  <span className="text-lg text-accent ml-2">({progress}%)</span>
                </p>
              </div>

              {/* Filter Buttons */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                {(['all', 'pending', 'done'] as FilterType[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filter === f
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {f === 'all' ? '전체' : f === 'pending' ? '미완료' : '완료'}
                  </button>
                ))}
              </div>
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

      {/* Checklist by Month */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {filteredByMonth.map((month, monthIndex) => {
            if (month.items.length === 0 && filter !== 'all') return null;

            return (
              <motion.div
                key={month.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + monthIndex * 0.05 }}
                className="card-luxury overflow-hidden"
              >
                {/* Month Header */}
                <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-2xl text-foreground">{month.name}</span>
                    <span className="text-sm text-muted-foreground">{month.title}</span>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      month.doneCount === month.totalCount && month.totalCount > 0
                        ? 'text-emerald-500'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {month.doneCount}/{month.totalCount} 완료
                  </span>
                </div>

                {/* Items */}
                <div className="p-5 space-y-2">
                  {month.items.length > 0 ? (
                    month.items.map((item, itemIndex) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: itemIndex * 0.05 }}
                        className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                          item.done
                            ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => toggleMustDo(item.id)}
                      >
                        {/* Checkbox */}
                        <div className="flex-shrink-0 transition-transform group-hover:scale-110">
                          {item.done ? (
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                          ) : (
                            <Circle className="w-6 h-6 text-muted-foreground group-hover:text-accent transition-colors" />
                          )}
                        </div>

                        {/* Title */}
                        <span
                          className={`flex-1 ${
                            item.done
                              ? 'text-muted-foreground line-through'
                              : 'text-foreground'
                          }`}
                        >
                          {item.title}
                        </span>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      {filter === 'all'
                        ? '등록된 항목이 없습니다.'
                        : filter === 'pending'
                        ? '미완료 항목이 없습니다!'
                        : '완료된 항목이 없습니다.'}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
