'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useIssueStore } from '@/lib/store/issue-store';
import { useMasterPlanStore } from '@/lib/store/masterplan-store';
import {
  IssueItem,
  IssueType,
  IssueStatus,
  IssuePriority,
  MONTHS_INFO,
  AVAILABLE_YEARS,
  ISSUE_TYPE_LABELS,
  ISSUE_STATUS_LABELS,
  ISSUE_PRIORITY_LABELS,
  ISSUE_TYPE_COLORS,
  ISSUE_STATUS_COLORS,
  ISSUE_PRIORITY_COLORS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
} from '@/lib/types';
import {
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  Eye,
  Pencil,
  Trash2,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import IssueModal from '@/components/IssueModal';

type TypeFilter = 'all' | IssueType;
type StatusFilter = 'all' | IssueStatus;
type PriorityFilter = 'all' | IssuePriority;

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

// Type icons
const getTypeIcon = (type: IssueType) => {
  switch (type) {
    case 'issue':
      return <AlertCircle className="w-4 h-4" />;
    case 'risk':
      return <AlertTriangle className="w-4 h-4" />;
    case 'decision':
      return <HelpCircle className="w-4 h-4" />;
  }
};

// Priority indicator
const getPriorityIndicator = (priority: IssuePriority) => {
  const colors = {
    low: 'bg-slate-400',
    medium: 'bg-yellow-400',
    high: 'bg-orange-500',
    critical: 'bg-red-500',
  };
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4].map((level) => (
        <div
          key={level}
          className={`w-1 h-3 rounded-full ${
            (priority === 'low' && level <= 1) ||
            (priority === 'medium' && level <= 2) ||
            (priority === 'high' && level <= 3) ||
            (priority === 'critical' && level <= 4)
              ? colors[priority]
              : 'bg-white/10'
          }`}
        />
      ))}
    </div>
  );
};

export default function IssuesPage() {
  const {
    issues,
    isLoading,
    initializeFromSupabase,
    addIssue,
    updateIssue,
    deleteIssue,
    getOpenIssues,
    getCriticalIssues,
  } = useIssueStore();

  const { tasks } = useMasterPlanStore();

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IssueItem | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('edit');
  const [isMounted, setIsMounted] = useState(false);

  // Initialize from Supabase
  useEffect(() => {
    initializeFromSupabase();
    setIsMounted(true);
  }, [initializeFromSupabase]);

  // Stats
  const totalIssues = issues.length;
  const openIssues = getOpenIssues().length;
  const criticalIssues = getCriticalIssues().length;
  const resolvedIssues = issues.filter(
    (i) => i.status === 'resolved' || i.status === 'closed'
  ).length;

  // Filter issues
  const filteredIssues = issues.filter((issue) => {
    if (issue.year !== selectedYear) return false;
    if (typeFilter !== 'all' && issue.type !== typeFilter) return false;
    if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && issue.priority !== priorityFilter) return false;
    return true;
  });

  // Group by month
  const issuesByMonth = MONTHS_INFO.map((month) => {
    const monthIssues = filteredIssues.filter((issue) => issue.month === month.id);
    return {
      ...month,
      issues: monthIssues,
      openCount: monthIssues.filter((i) => i.status === 'open' || i.status === 'in_progress').length,
      criticalCount: monthIssues.filter((i) => i.priority === 'critical' && i.status !== 'closed').length,
    };
  });

  // CRUD handlers
  const handleAddItem = (month: number) => {
    setSelectedMonth(month);
    setEditingItem(null);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleViewItem = (item: IssueItem) => {
    setEditingItem(item);
    setSelectedMonth(item.month);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleEditItem = (item: IssueItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setSelectedMonth(item.month);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('이 항목을 삭제하시겠습니까?')) {
      await deleteIssue(id);
    }
  };

  const handleSaveItem = async (
    itemData: Omit<IssueItem, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (editingItem) {
      await updateIssue(editingItem.id, itemData);
    } else {
      await addIssue(itemData);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0d1525] to-[#0a0f1a]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(239, 68, 68, 0.12), transparent),
                              radial-gradient(ellipse 60% 40% at 80% 60%, rgba(183, 145, 110, 0.08), transparent),
                              radial-gradient(ellipse 50% 30% at 20% 80%, rgba(251, 191, 36, 0.06), transparent)`,
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

      {/* Hero Section */}
      <section className="relative pt-16 pb-12 px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
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

            <div className="pl-14 flex items-start justify-between gap-4">
              <div>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-[#b7916e] text-sm tracking-[0.3em] uppercase mb-4 font-light"
                >
                  Project Monitoring
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
                    Issue &amp;
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="block text-transparent bg-clip-text bg-gradient-to-r from-[#b7916e] via-[#d4c4a8] to-[#b7916e]"
                  >
                    Risk Tracker
                  </motion.span>
                </h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.8 }}
                  className="text-white/40 text-lg max-w-md font-light leading-relaxed"
                >
                  <span className="md:whitespace-nowrap">프로젝트의 이슈, 리스크,</span>
                  <br className="md:hidden" />
                  <span className="hidden md:inline">&nbsp;</span>
                  <span className="md:whitespace-nowrap">주요 결정사항 추적</span>
                </motion.p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Year Selection */}
      <section className="relative py-4 px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
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

      {/* Stats Cards */}
      <section className="relative py-4 sm:py-8 px-4 sm:px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            {/* Total */}
            <div className="relative rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
              <div className="absolute inset-0 border border-white/[0.06] rounded-xl" />
              <div className="relative p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-white/40" />
                  <span className="text-white/40 text-xs">전체</span>
                </div>
                <p
                  className="text-3xl text-white/90"
                  style={{ fontFamily: "var(--font-cormorant), serif" }}
                >
                  {isMounted ? totalIssues : '—'}
                </p>
              </div>
            </div>

            {/* Open */}
            <div className="relative rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/[0.08] to-white/[0.01] backdrop-blur-sm" />
              <div className="absolute inset-0 border border-yellow-500/[0.15] rounded-xl" />
              <div className="relative p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400/60" />
                  <span className="text-yellow-400/60 text-xs">진행중</span>
                </div>
                <p
                  className="text-3xl text-yellow-400"
                  style={{ fontFamily: "var(--font-cormorant), serif" }}
                >
                  {isMounted ? openIssues : '—'}
                </p>
              </div>
            </div>

            {/* Critical */}
            <div className="relative rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.08] to-white/[0.01] backdrop-blur-sm" />
              <div className="absolute inset-0 border border-red-500/[0.15] rounded-xl" />
              <div className="relative p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400/60" />
                  <span className="text-red-400/60 text-xs">긴급</span>
                </div>
                <p
                  className="text-3xl text-red-400"
                  style={{ fontFamily: "var(--font-cormorant), serif" }}
                >
                  {isMounted ? criticalIssues : '—'}
                </p>
              </div>
            </div>

            {/* Resolved */}
            <div className="relative rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.08] to-white/[0.01] backdrop-blur-sm" />
              <div className="absolute inset-0 border border-emerald-500/[0.15] rounded-xl" />
              <div className="relative p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400/60" />
                  <span className="text-emerald-400/60 text-xs">해결됨</span>
                </div>
                <p
                  className="text-3xl text-emerald-400"
                  style={{ fontFamily: "var(--font-cormorant), serif" }}
                >
                  {isMounted ? resolvedIssues : '—'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="relative py-4 px-4 sm:px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="relative rounded-xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
            <div className="absolute inset-0 border border-white/[0.06] rounded-xl" />
            <div className="relative p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Type Filter */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                  <span className="text-white/30 text-xs">유형:</span>
                  {(['all', 'issue', 'risk', 'decision'] as TypeFilter[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        typeFilter === t
                          ? 'bg-[#b7916e] text-white'
                          : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08]'
                      }`}
                    >
                      {t === 'all' ? '전체' : ISSUE_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white/30 text-xs">상태:</span>
                  {(['all', 'open', 'in_progress', 'resolved', 'closed'] as StatusFilter[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        statusFilter === s
                          ? 'bg-[#b7916e] text-white'
                          : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08]'
                      }`}
                    >
                      {s === 'all' ? '전체' : ISSUE_STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>

                {/* Priority Filter */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white/30 text-xs">우선순위:</span>
                  {(['all', 'critical', 'high', 'medium', 'low'] as PriorityFilter[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriorityFilter(p)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        priorityFilter === p
                          ? 'bg-[#b7916e] text-white'
                          : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08]'
                      }`}
                    >
                      {p === 'all' ? '전체' : ISSUE_PRIORITY_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Issues by Month */}
      <section className="relative py-8 px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="w-8 h-px bg-white/20" />
            <span className="text-white/30 text-xs tracking-[0.2em] uppercase">Monthly Issues</span>
          </motion.div>

          {isLoading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-2 border-[#b7916e] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-white/40 mt-4">로딩 중...</p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {issuesByMonth.map((month) => {
                if (month.issues.length === 0 && (typeFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all'))
                  return null;

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
                        background: `radial-gradient(circle at 50% 100%, rgba(183, 145, 110, 0.05), transparent 70%)`,
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
                        {month.openCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
                            {month.openCount} 진행중
                          </span>
                        )}
                        {month.criticalCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs">
                            {month.criticalCount} 긴급
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddItem(month.id)}
                        className="p-2 rounded-xl hover:bg-white/[0.04] transition-colors"
                        title="이슈 추가"
                      >
                        <Plus className="w-4 h-4 text-[#b7916e]" />
                      </button>
                    </div>

                    {/* Items */}
                    <div className="relative p-6 space-y-2">
                      {month.issues.length > 0 ? (
                        month.issues.map((item, itemIndex) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: itemIndex * 0.05 }}
                            className="group/item flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl cursor-pointer transition-all hover:bg-white/[0.04] active:bg-white/[0.06]"
                            onClick={() => handleViewItem(item)}
                          >
                            {/* Type Icon */}
                            <div
                              className={`flex-shrink-0 p-2 rounded-lg ${
                                item.type === 'issue'
                                  ? 'bg-blue-500/10 text-blue-400'
                                  : item.type === 'risk'
                                  ? 'bg-orange-500/10 text-orange-400'
                                  : 'bg-purple-500/10 text-purple-400'
                              }`}
                            >
                              {getTypeIcon(item.type)}
                            </div>

                            {/* Priority */}
                            <div className="flex-shrink-0">
                              {getPriorityIndicator(item.priority)}
                            </div>

                            {/* Status Badge */}
                            <span
                              className={`flex-shrink-0 px-2 py-0.5 rounded-md text-xs font-medium ${ISSUE_STATUS_COLORS[item.status]}`}
                            >
                              {ISSUE_STATUS_LABELS[item.status]}
                            </span>

                            {/* Category Tag */}
                            <span
                              className={`flex-shrink-0 px-2 py-0.5 rounded-md text-xs font-medium ${CATEGORY_COLORS[item.category]}`}
                            >
                              {CATEGORY_LABELS[item.category]}
                            </span>

                            {/* Title */}
                            <span
                              className={`flex-1 min-w-0 break-words text-sm sm:text-base ${
                                item.status === 'closed'
                                  ? 'text-white/40 line-through'
                                  : 'text-white/80'
                              }`}
                            >
                              {item.title}
                            </span>

                            {/* Owner */}
                            {item.owner && (
                              <span className="hidden sm:block flex-shrink-0 text-xs text-white/30">
                                {item.owner}
                              </span>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 opacity-60 sm:opacity-0 sm:group-hover/item:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewItem(item);
                                }}
                                className="p-1.5 sm:p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
                                title="상세보기"
                              >
                                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/40 hover:text-white/80" />
                              </button>
                              <button
                                onClick={(e) => handleEditItem(item, e)}
                                className="p-1.5 sm:p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
                                title="수정"
                              >
                                <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/40 hover:text-white/80" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteItem(item.id, e)}
                                className="p-1.5 sm:p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                title="삭제"
                              >
                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/40 hover:text-red-400" />
                              </button>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <div className="space-y-4">
                            <AlertCircle className="w-10 h-10 text-white/10 mx-auto" />
                            <p className="text-white/30 text-sm">등록된 이슈가 없습니다.</p>
                            <button
                              onClick={() => handleAddItem(month.id)}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#b7916e]/10 text-[#b7916e] hover:bg-[#b7916e]/20 transition-colors text-sm font-medium"
                            >
                              <Plus className="w-4 h-4" />
                              이슈 추가
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
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

      {/* Issue Modal */}
      <IssueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveItem}
        issue={editingItem}
        defaultMonth={selectedMonth}
        initialMode={modalMode}
        tasks={tasks}
      />
    </div>
  );
}
