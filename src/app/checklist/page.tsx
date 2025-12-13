'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useMasterPlanStore } from '@/lib/store/masterplan-store';
import { MustDoItem, MONTHS_INFO, AVAILABLE_YEARS, CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/types';
import { CheckCircle2, Circle, Filter, Plus, Pencil, Trash2, ListChecks } from 'lucide-react';
import MustDoModal from '@/components/MustDoModal';
import { Footer } from '@/components/layout/Footer';

type FilterType = 'all' | 'pending' | 'done';

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
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

export default function ChecklistPage() {
  const { mustDoItems, toggleMustDo, addMustDo, updateMustDo, deleteMustDo } = useMasterPlanStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MustDoItem | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(1);

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

  // CRUD handlers
  const handleAddItem = (month: number) => {
    setSelectedMonth(month);
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: MustDoItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setSelectedMonth(item.month);
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('이 항목을 삭제하시겠습니까?')) {
      await deleteMustDo(id);
    }
  };

  const handleSaveItem = async (itemData: Omit<MustDoItem, 'id'>) => {
    if (editingItem) {
      await updateMustDo(editingItem.id, {
        title: itemData.title,
        month: itemData.month,
        done: itemData.done,
        category: itemData.category,
      });
    } else {
      await addMustDo(itemData);
    }
  };

  const handleToggle = async (id: string) => {
    await toggleMustDo(id);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0d1525] to-[#0a0f1a]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16, 185, 129, 0.12), transparent),
                              radial-gradient(ellipse 60% 40% at 80% 60%, rgba(183, 145, 110, 0.08), transparent),
                              radial-gradient(ellipse 50% 30% at 20% 80%, rgba(59, 130, 246, 0.06), transparent)`
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

      {/* Hero Section - Compact on Mobile */}
      <section className="relative pt-8 sm:pt-16 pb-6 sm:pb-12 px-4 sm:px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Decorative Line - Hidden on Mobile */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.2, delay: 0.3 }}
              className="hidden sm:block absolute -left-6 top-1/2 w-16 h-px bg-gradient-to-r from-[#b7916e] to-transparent origin-left"
            />

            <div className="sm:pl-14">
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-[#b7916e] text-[10px] sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-2 sm:mb-4 font-light"
              >
                Essential Tasks
              </motion.p>

              <h1
                className="text-3xl sm:text-5xl lg:text-6xl text-white/95 mb-2 sm:mb-6 leading-[1.1] tracking-tight"
                style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
              >
                <span className="sm:block inline">Must-Do </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b7916e] via-[#d4c4a8] to-[#b7916e]">
                  Checklist
                </span>
              </h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="hidden sm:block text-white/40 text-lg max-w-md font-light leading-relaxed"
              >
                런칭까지 반드시 완료해야 할 핵심 업무 목록
              </motion.p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Year Selection - Compact */}
      <section className="relative py-2 sm:py-4 px-4 sm:px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.85 }}
            className="flex items-center gap-2 sm:gap-4"
          >
            <span className="text-white/30 text-[10px] sm:text-xs tracking-[0.2em] uppercase">연도</span>
            <div className="flex items-center gap-1 sm:gap-2">
              {AVAILABLE_YEARS.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    selectedYear === year
                      ? 'bg-[#b7916e] text-white'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
                  }`}
                  style={{ fontFamily: "var(--font-cormorant), serif" }}
                >
                  {year}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Progress Section */}
      <section className="relative py-4 sm:py-8 px-4 sm:px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="relative rounded-xl sm:rounded-2xl overflow-hidden"
          >
            {/* Card Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
            <div className="absolute inset-0 border border-white/[0.06] rounded-xl sm:rounded-2xl" />

            {/* Content */}
            <div className="relative p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6 mb-3 sm:mb-6">
                <div>
                  <p className="text-white/40 text-xs sm:text-sm tracking-wider uppercase mb-1 sm:mb-2">전체 완료율</p>
                  <p
                    className="text-3xl sm:text-5xl text-white/90"
                    style={{ fontFamily: "var(--font-cormorant), serif" }}
                  >
                    {doneItems}
                    <span className="text-lg sm:text-2xl text-white/40 ml-1">/{totalItems}</span>
                    <span className="text-lg sm:text-2xl text-[#b7916e] ml-2 sm:ml-3">({progress}%)</span>
                  </p>
                </div>

                {/* Filter Buttons */}
                <div className="flex items-center gap-1.5 sm:gap-3">
                  <Filter className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-white/30" />
                  {(['all', 'pending', 'done'] as FilterType[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all ${
                        filter === f
                          ? 'bg-[#b7916e] text-white'
                          : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white/80'
                      }`}
                    >
                      {f === 'all' ? '전체' : f === 'pending' ? '미완료' : '완료'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-1 sm:h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.2, delay: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Checklist by Month */}
      <section className="relative py-8 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="w-8 h-px bg-white/20" />
            <span className="text-white/30 text-xs tracking-[0.2em] uppercase">Monthly Tasks</span>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {filteredByMonth.map((month) => {
              if (month.items.length === 0 && filter !== 'all') return null;

              return (
                <motion.div
                  key={month.id}
                  variants={itemVariants}
                  className="relative rounded-2xl overflow-hidden group"
                >
                  {/* Card Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
                  <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />

                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle at 50% 100%, rgba(16, 185, 129, 0.05), transparent 70%)`
                    }}
                  />

                  {/* Month Header */}
                  <div className="relative px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span
                        className="text-2xl text-white/90"
                        style={{ fontFamily: "var(--font-cormorant), serif" }}
                      >
                        {month.name}
                      </span>
                      <span className="text-sm text-white/40">{month.title}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`text-sm font-medium ${
                          month.doneCount === month.totalCount && month.totalCount > 0
                            ? 'text-emerald-400'
                            : 'text-white/40'
                        }`}
                      >
                        {month.doneCount}/{month.totalCount} 완료
                      </span>
                      <button
                        onClick={() => handleAddItem(month.id)}
                        className="p-2 rounded-xl hover:bg-white/[0.04] transition-colors"
                        title="항목 추가"
                      >
                        <Plus className="w-4 h-4 text-[#b7916e]" />
                      </button>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="relative p-6 space-y-2">
                    {month.items.length > 0 ? (
                      month.items.map((item, itemIndex) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: itemIndex * 0.05 }}
                          className={`group/item flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl cursor-pointer transition-all ${
                            item.done
                              ? 'bg-emerald-500/[0.06] hover:bg-emerald-500/10'
                              : 'hover:bg-white/[0.04] active:bg-white/[0.06]'
                          }`}
                          onClick={() => handleToggle(item.id)}
                        >
                          {/* Checkbox */}
                          <div className="flex-shrink-0 transition-transform group-hover/item:scale-110">
                            {item.done ? (
                              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                            ) : (
                              <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-white/30 group-hover/item:text-[#b7916e] transition-colors" />
                            )}
                          </div>

                          {/* Category Tag */}
                          <span className={`flex-shrink-0 px-2 py-0.5 rounded-md text-xs font-medium ${CATEGORY_COLORS[item.category || 'operation']}`}>
                            {CATEGORY_LABELS[item.category || 'operation']}
                          </span>

                          {/* Title - full width with proper text wrapping */}
                          <span
                            className={`flex-1 min-w-0 break-words text-sm sm:text-base ${
                              item.done
                                ? 'text-white/40 line-through'
                                : 'text-white/80'
                            }`}
                          >
                            {item.title}
                          </span>

                          {/* Actions - always visible on mobile, hover on desktop */}
                          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 opacity-60 sm:opacity-0 sm:group-hover/item:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => handleEditItem(item, e)}
                              className="p-1.5 sm:p-2 rounded-lg hover:bg-white/[0.06] active:bg-white/[0.08] transition-colors"
                              title="수정"
                            >
                              <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/40 hover:text-white/80" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteItem(item.id, e)}
                              className="p-1.5 sm:p-2 rounded-lg hover:bg-red-500/10 active:bg-red-500/20 transition-colors"
                              title="삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/40 hover:text-red-400" />
                            </button>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        {filter === 'all' ? (
                          <div className="space-y-4">
                            <ListChecks className="w-10 h-10 text-white/10 mx-auto" />
                            <p className="text-white/30 text-sm">등록된 항목이 없습니다.</p>
                            <button
                              onClick={() => handleAddItem(month.id)}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#b7916e]/10 text-[#b7916e] hover:bg-[#b7916e]/20 transition-colors text-sm font-medium"
                            >
                              <Plus className="w-4 h-4" />
                              항목 추가
                            </button>
                          </div>
                        ) : filter === 'pending' ? (
                          <p className="text-emerald-400/60 text-sm">미완료 항목이 없습니다!</p>
                        ) : (
                          <p className="text-white/30 text-sm">완료된 항목이 없습니다.</p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Must-Do Modal */}
      <MustDoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveItem}
        item={editingItem}
        defaultMonth={selectedMonth}
      />
    </div>
  );
}
