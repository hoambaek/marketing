'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil, AlertTriangle, AlertCircle, HelpCircle, Calendar, User, Tag, Link2, ChevronDown } from 'lucide-react';
import {
  IssueItem,
  IssueType,
  IssuePriority,
  IssueImpact,
  IssueStatus,
  TaskCategory,
  Task,
  ISSUE_TYPE_LABELS,
  ISSUE_TYPE_COLORS,
  ISSUE_PRIORITY_LABELS,
  ISSUE_PRIORITY_COLORS,
  ISSUE_IMPACT_LABELS,
  ISSUE_STATUS_LABELS,
  ISSUE_STATUS_COLORS,
  CATEGORY_LABELS,
  MONTHS_INFO,
} from '@/lib/types';

interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (issue: Omit<IssueItem, 'id' | 'createdAt' | 'updatedAt'>) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  issue?: IssueItem | null;
  defaultYear?: number;
  defaultMonth?: number;
  tasks?: Task[]; // 월별플랜 업무 목록
  initialMode?: 'view' | 'edit';
}

const TYPE_OPTIONS: IssueType[] = ['issue', 'risk', 'decision'];
const PRIORITY_OPTIONS: IssuePriority[] = ['low', 'medium', 'high', 'critical'];
const IMPACT_OPTIONS: IssueImpact[] = ['low', 'medium', 'high'];
const STATUS_OPTIONS: IssueStatus[] = ['open', 'in_progress', 'resolved', 'closed'];
const CATEGORY_OPTIONS: TaskCategory[] = ['operation', 'marketing', 'design', 'filming', 'pr', 'b2b'];

const TYPE_ICONS: Record<IssueType, React.ReactNode> = {
  issue: <AlertCircle className="w-5 h-5" />,
  risk: <AlertTriangle className="w-5 h-5" />,
  decision: <HelpCircle className="w-5 h-5" />,
};

export default function IssueModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  issue,
  defaultYear = 2026,
  defaultMonth = 1,
  tasks = [],
  initialMode = 'edit',
}: IssueModalProps) {
  const [formData, setFormData] = useState({
    year: defaultYear,
    month: defaultMonth,
    title: '',
    type: 'issue' as IssueType,
    priority: 'medium' as IssuePriority,
    impact: 'medium' as IssueImpact,
    status: 'open' as IssueStatus,
    category: 'operation' as TaskCategory,
    description: '',
    owner: '',
    dueDate: '',
    resolution: '',
    relatedTaskId: '',
    relatedTaskTitle: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showTaskSelector, setShowTaskSelector] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const mobile = window.innerWidth < 640;
    setIsMobile(mobile);

    if (issue) {
      setFormData({
        year: issue.year,
        month: issue.month,
        title: issue.title,
        type: issue.type,
        priority: issue.priority,
        impact: issue.impact,
        status: issue.status,
        category: issue.category,
        description: issue.description || '',
        owner: issue.owner || '',
        dueDate: issue.dueDate || '',
        resolution: issue.resolution || '',
        relatedTaskId: issue.relatedTaskId || '',
        relatedTaskTitle: issue.relatedTaskTitle || '',
      });
      setIsEditing(initialMode === 'edit' || (!mobile && !issue));
    } else {
      setFormData({
        year: defaultYear,
        month: defaultMonth,
        title: '',
        type: 'issue',
        priority: 'medium',
        impact: 'medium',
        status: 'open',
        category: 'operation',
        description: '',
        owner: '',
        dueDate: '',
        resolution: '',
        relatedTaskId: '',
        relatedTaskTitle: '',
      });
      setIsEditing(true);
    }
  }, [issue, defaultYear, defaultMonth, isOpen, initialMode]);

  // 선택한 월에 해당하는 업무만 필터링
  const filteredTasks = tasks.filter((t) => t.month === formData.month);

  const handleTaskSelect = (task: Task) => {
    setFormData(prev => ({
      ...prev,
      relatedTaskId: task.id,
      relatedTaskTitle: task.title,
      title: prev.title || `[${task.title}] 관련 이슈`,
      category: task.category,
    }));
    setShowTaskSelector(false);
  };

  const clearTaskSelection = () => {
    setFormData(prev => ({
      ...prev,
      relatedTaskId: '',
      relatedTaskTitle: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    await onSave({
      year: formData.year,
      month: formData.month,
      title: formData.title.trim(),
      type: formData.type,
      priority: formData.priority,
      impact: formData.impact,
      status: formData.status,
      category: formData.category,
      description: formData.description.trim() || undefined,
      owner: formData.owner.trim() || undefined,
      dueDate: formData.dueDate || undefined,
      resolution: formData.resolution.trim() || undefined,
      relatedTaskId: formData.relatedTaskId || undefined,
      relatedTaskTitle: formData.relatedTaskTitle || undefined,
    });
    onClose();
  };

  const handleDelete = async () => {
    if (issue && onDelete && window.confirm('이 항목을 삭제하시겠습니까?')) {
      await onDelete();
      onClose();
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setShowTaskSelector(false);
    onClose();
  };

  // Individual change handlers to prevent re-render issues
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, title: e.target.value }));
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, description: e.target.value }));
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, type: e.target.value as IssueType }));
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, priority: e.target.value as IssuePriority }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, status: e.target.value as IssueStatus }));
  };

  const handleImpactChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, impact: e.target.value as IssueImpact }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, category: e.target.value as TaskCategory }));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value);
    setFormData(prev => ({
      ...prev,
      month: newMonth,
      relatedTaskId: '',
      relatedTaskTitle: '',
    }));
  };

  const handleOwnerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, owner: e.target.value }));
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, dueDate: e.target.value }));
  };

  const handleResolutionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, resolution: e.target.value }));
  };

  if (!isOpen) return null;

  const typeColors = ISSUE_TYPE_COLORS[formData.type];
  const priorityColors = ISSUE_PRIORITY_COLORS[formData.priority];
  const statusColors = ISSUE_STATUS_COLORS[formData.status];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag Handle for Mobile */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-display text-xl text-foreground">
              {issue ? (isEditing ? '이슈 수정' : '이슈 상세') : '새 이슈 추가'}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-muted active:bg-muted/50 transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content - Inline JSX to prevent re-render issues */}
          {isEditing ? (
            /* Edit Mode */
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Related Task Selector */}
              {!issue && filteredTasks.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    <div className="flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-blue-400" />
                      연관 업무 선택
                    </div>
                  </label>
                  {formData.relatedTaskId ? (
                    <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{formData.relatedTaskTitle}</p>
                        <p className="text-xs text-blue-400">연관 업무가 선택되었습니다</p>
                      </div>
                      <button
                        type="button"
                        onClick={clearTaskSelection}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowTaskSelector(!showTaskSelector)}
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-left text-muted-foreground hover:border-accent/50 transition-all flex items-center justify-between"
                      >
                        <span>월별플랜 업무에서 선택...</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showTaskSelector ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {showTaskSelector && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-10 w-full mt-2 bg-[#1a1f2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto"
                          >
                            {filteredTasks.length > 0 ? (
                              filteredTasks.map((task) => (
                                <button
                                  key={task.id}
                                  type="button"
                                  onClick={() => handleTaskSelect(task)}
                                  className="w-full px-4 py-3 text-left hover:bg-white/10 active:bg-white/15 transition-colors border-b border-white/5 last:border-0"
                                >
                                  <p className="text-sm font-medium text-white/90 truncate">{task.title}</p>
                                  <p className="text-xs text-white/50 mt-0.5">
                                    {CATEGORY_LABELS[task.category]} · {task.week}주차
                                  </p>
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-sm text-white/40">
                                이 달에 등록된 업무가 없습니다
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1.5">
                    선택하면 제목과 카테고리가 자동으로 채워집니다
                  </p>
                </div>
              )}

              {/* Type & Priority Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    유형 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.type}
                      onChange={handleTypeChange}
                      className="w-full px-4 py-2.5 pr-10 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all appearance-none cursor-pointer"
                    >
                      {TYPE_OPTIONS.map((t) => (
                        <option key={t} value={t}>{ISSUE_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    우선순위 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.priority}
                      onChange={handlePriorityChange}
                      className="w-full px-4 py-2.5 pr-10 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all appearance-none cursor-pointer"
                    >
                      {PRIORITY_OPTIONS.map((p) => (
                        <option key={p} value={p}>{ISSUE_PRIORITY_LABELS[p]}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={handleTitleChange}
                  placeholder="이슈/리스크 제목을 입력하세요"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                  autoFocus={!isMobile}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">상세 설명</label>
                <textarea
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  placeholder="상세 설명을 입력하세요"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none"
                />
              </div>

              {/* Status & Impact Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">상태</label>
                  <div className="relative">
                    <select
                      value={formData.status}
                      onChange={handleStatusChange}
                      className="w-full px-4 py-2.5 pr-10 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all appearance-none cursor-pointer"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{ISSUE_STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">영향도</label>
                  <div className="relative">
                    <select
                      value={formData.impact}
                      onChange={handleImpactChange}
                      className="w-full px-4 py-2.5 pr-10 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all appearance-none cursor-pointer"
                    >
                      {IMPACT_OPTIONS.map((i) => (
                        <option key={i} value={i}>{ISSUE_IMPACT_LABELS[i]}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category & Month Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">카테고리</label>
                  <div className="relative">
                    <select
                      value={formData.category}
                      onChange={handleCategoryChange}
                      className="w-full px-4 py-2.5 pr-10 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all appearance-none cursor-pointer"
                    >
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">발생 월</label>
                  <div className="relative">
                    <select
                      value={formData.month}
                      onChange={handleMonthChange}
                      className="w-full px-4 py-2.5 pr-10 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all appearance-none cursor-pointer"
                    >
                      {MONTHS_INFO.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Owner & Due Date Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">담당자</label>
                  <input
                    type="text"
                    value={formData.owner}
                    onChange={handleOwnerChange}
                    placeholder="담당자명"
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">해결 기한</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={handleDueDateChange}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                  />
                </div>
              </div>

              {/* Resolution */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">해결 방안</label>
                <textarea
                  value={formData.resolution}
                  onChange={handleResolutionChange}
                  placeholder="해결 방안을 입력하세요"
                  rows={2}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                {issue && onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2.5 border border-red-500/30 text-red-500 rounded-xl hover:bg-red-500/10 active:bg-red-500/20 transition-colors"
                  >
                    삭제
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (isMobile && issue) {
                      setIsEditing(false);
                    } else {
                      handleClose();
                    }
                  }}
                  className="flex-1 px-4 py-2.5 border border-border rounded-xl text-muted-foreground hover:bg-muted active:bg-muted/50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-accent text-white rounded-xl hover:bg-accent/90 active:bg-accent/80 transition-colors font-medium"
                >
                  {issue ? '저장' : '추가'}
                </button>
              </div>
            </form>
          ) : (
            /* View Mode */
            <div className="p-5 space-y-4">
              {/* Type & Priority Row */}
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${typeColors.bg} ${typeColors.border} border`}>
                  {TYPE_ICONS[formData.type]}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">유형</p>
                  <p className={`font-medium ${typeColors.text}`}>{ISSUE_TYPE_LABELS[formData.type]}</p>
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium ${priorityColors.bg} ${priorityColors.text} ${priorityColors.border} border`}>
                    {ISSUE_PRIORITY_LABELS[formData.priority]}
                  </span>
                </div>
              </div>

              {/* Related Task */}
              {formData.relatedTaskTitle && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Link2 className="w-3.5 h-3.5 text-blue-400" />
                    <p className="text-xs text-blue-400">연관 업무</p>
                  </div>
                  <p className="text-foreground font-medium">{formData.relatedTaskTitle}</p>
                </div>
              )}

              {/* Title */}
              <div className="p-4 bg-muted/30 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">제목</p>
                <p className="text-foreground font-medium text-lg">{formData.title || '(제목 없음)'}</p>
              </div>

              {/* Description */}
              {formData.description && (
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">상세 설명</p>
                  <p className="text-foreground/80 text-sm whitespace-pre-wrap">{formData.description}</p>
                </div>
              )}

              {/* Status & Category */}
              <div className="flex gap-3">
                <div className="flex-1 p-4 bg-muted/30 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">상태</p>
                  <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${statusColors.bg} ${statusColors.text}`}>
                    {ISSUE_STATUS_LABELS[formData.status]}
                  </span>
                </div>
                <div className="flex-1 p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">카테고리</p>
                  </div>
                  <p className="text-foreground font-medium">{CATEGORY_LABELS[formData.category]}</p>
                </div>
              </div>

              {/* Owner & Due Date */}
              <div className="flex gap-3">
                {formData.owner && (
                  <div className="flex-1 p-4 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">담당자</p>
                    </div>
                    <p className="text-foreground font-medium">{formData.owner}</p>
                  </div>
                )}
                {formData.dueDate && (
                  <div className="flex-1 p-4 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">해결 기한</p>
                    </div>
                    <p className="text-foreground font-medium">
                      {new Date(formData.dueDate).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                )}
              </div>

              {/* Resolution */}
              {formData.resolution && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                  <p className="text-xs text-emerald-400 mb-1">해결 방안</p>
                  <p className="text-foreground/80 text-sm whitespace-pre-wrap">{formData.resolution}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                {issue && onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2.5 border border-red-500/30 text-red-500 rounded-xl hover:bg-red-500/10 active:bg-red-500/20 transition-colors"
                  >
                    삭제
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 border border-border rounded-xl text-muted-foreground hover:bg-muted active:bg-muted/50 transition-colors"
                >
                  닫기
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 px-4 py-2.5 bg-accent text-white rounded-xl hover:bg-accent/90 active:bg-accent/80 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  수정
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
