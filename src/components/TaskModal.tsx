'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil, Calendar, User, FileText, Tag, Clock, CalendarDays, Paperclip, ExternalLink, Youtube, Image as ImageIcon } from 'lucide-react';
import { Task, TaskCategory, TaskStatus, CATEGORY_LABELS, MONTHS_INFO, Attachment } from '@/lib/types';
import { toast } from '@/lib/store/toast-store';
import { formatWeekDateRange, getWeekDateRange, formatDateKorean, formatDDay, getDDayColorClass, getWeekOfMonth } from '@/lib/utils/date';
import FileUpload from './FileUpload';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> | Partial<Task>) => void | Promise<void>;
  task?: Task | null;
  month: number;
  week: number;
}

const CATEGORIES: TaskCategory[] = ['operation', 'marketing', 'design', 'filming', 'pr', 'b2b'];

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: '대기',
  in_progress: '진행중',
  done: '완료',
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'bg-white/[0.06] text-white/60',
  in_progress: 'bg-amber-500/20 text-amber-400',
  done: 'bg-emerald-500/20 text-emerald-400',
};

export default function TaskModal({ isOpen, onClose, onSave, task, month, week }: TaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'operation' as TaskCategory,
    status: 'pending' as TaskStatus,
    assignee: '',
    deliverables: '',
    notes: '',
    month: month,
    week: week,
    dueDate: '',
    year: 2026,
    attachments: [] as Attachment[],
  });

  // Mobile: view mode first, then edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Only check mobile on initial mount
    setIsMobile(window.innerWidth < 640);
  }, []);

  // Prevent body scroll when modal is open
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

    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        category: task.category,
        status: task.status,
        assignee: task.assignee || '',
        deliverables: task.deliverables?.join(', ') || '',
        notes: task.notes || '',
        month: task.month,
        week: task.week,
        dueDate: task.dueDate || '',
        year: task.year || 2026,
        attachments: task.attachments || [],
      });
      setIsEditing(!mobile || !task);
    } else {
      // Calculate default due date based on week
      const { endDate } = getWeekDateRange(2026, month, week);
      const defaultDueDate = endDate.toISOString().split('T')[0];

      setFormData({
        title: '',
        description: '',
        category: 'operation',
        status: 'pending',
        assignee: '',
        deliverables: '',
        notes: '',
        month: month,
        week: week,
        dueDate: defaultDueDate,
        year: 2026,
        attachments: [],
      });
      setIsEditing(true);
    }
  }, [task, isOpen, month, week]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      month: formData.month,
      week: formData.week,
      year: formData.year,
      category: formData.category,
      status: formData.status,
      assignee: formData.assignee.trim() || undefined,
      dueDate: formData.dueDate || undefined,
      deliverables: formData.deliverables
        ? formData.deliverables.split(',').map((d) => d.trim()).filter(Boolean)
        : undefined,
      notes: formData.notes.trim() || undefined,
      attachments: formData.attachments.length > 0 ? formData.attachments : undefined,
    };

    await onSave(taskData);
    toast.success(task ? '업무가 수정되었습니다' : '업무가 추가되었습니다');
    onClose();
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  if (!isOpen) return null;

  const monthInfo = MONTHS_INFO.find(m => m.id === formData.month);

  // Input change handlers to prevent re-renders from recreating components
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, title: e.target.value }));
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, description: e.target.value }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, category: e.target.value as TaskCategory }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, status: e.target.value as TaskStatus }));
  };


  const handleAssigneeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, assignee: e.target.value }));
  };

  const handleDeliverablesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, deliverables: e.target.value }));
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, notes: e.target.value }));
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDueDate = e.target.value;
    if (newDueDate) {
      const date = new Date(newDueDate);
      const newMonth = date.getMonth() + 1;
      const newWeek = getWeekOfMonth(date);
      setFormData(prev => ({
        ...prev,
        dueDate: newDueDate,
        month: newMonth,
        week: newWeek,
      }));
    } else {
      setFormData(prev => ({ ...prev, dueDate: newDueDate }));
    }
  };

  const handleAttachmentsChange = (attachments: Attachment[]) => {
    setFormData(prev => ({ ...prev, attachments }));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-[#0a0f1a] border border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag Handle for Mobile */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-display text-xl text-foreground">
              {task ? (isEditing ? '업무 수정' : '업무 상세') : '새 업무 추가'}
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
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  업무명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={handleTitleChange}
                  placeholder="업무명을 입력하세요"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                  autoFocus={!isMobile}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  placeholder="업무에 대한 상세 설명"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none"
                />
              </div>

              {/* Category & Status Row */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    카테고리
                  </label>
                  <div className="relative">
                    <select
                      value={formData.category}
                      onChange={handleCategoryChange}
                      className="w-full px-4 py-2.5 pr-10 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all appearance-none cursor-pointer"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {CATEGORY_LABELS[cat]}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    상태
                  </label>
                  <div className="relative">
                    <select
                      value={formData.status}
                      onChange={handleStatusChange}
                      className="w-full px-4 py-2.5 pr-10 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all appearance-none cursor-pointer"
                    >
                      <option value="pending">대기</option>
                      <option value="in_progress">진행중</option>
                      <option value="done">완료</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>


              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-muted-foreground" />
                    마감일
                  </span>
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={handleDueDateChange}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all cursor-pointer"
                    />
                  </div>
                  {/* D-Day Preview */}
                  {formData.dueDate && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/30">
                      <span className="text-sm text-muted-foreground">
                        {formatDateKorean(formData.dueDate)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${getDDayColorClass(formData.dueDate).bg} ${getDDayColorClass(formData.dueDate).text}`}
                      >
                        {formatDDay(formData.dueDate)}
                      </span>
                    </div>
                  )}
                </div>
                {/* Auto-calculated placement info */}
                {formData.dueDate && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    → {formData.month}월 {formData.week}주차에 자동 배치됩니다
                  </p>
                )}
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  담당자
                </label>
                <input
                  type="text"
                  value={formData.assignee}
                  onChange={handleAssigneeChange}
                  placeholder="담당자 이름"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                />
              </div>

              {/* Deliverables */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  산출물
                </label>
                <input
                  type="text"
                  value={formData.deliverables}
                  onChange={handleDeliverablesChange}
                  placeholder="쉼표로 구분하여 입력 (예: 기획서, PPT)"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  메모
                </label>
                <textarea
                  value={formData.notes}
                  onChange={handleNotesChange}
                  placeholder="추가 메모"
                  rows={2}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none"
                />
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  <span className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                    첨부파일
                  </span>
                </label>
                <FileUpload
                  attachments={formData.attachments}
                  onChange={handleAttachmentsChange}
                  maxFiles={10}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isMobile && task) {
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
                  {task ? '저장' : '추가'}
                </button>
              </div>
            </form>
          ) : (
            /* View Mode */
            <div className="p-5 space-y-4">
              {/* Status & Category */}
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${STATUS_COLORS[formData.status]}`}>
                  {STATUS_LABELS[formData.status]}
                </span>
                <span className={`px-3 py-1.5 rounded-lg text-sm font-medium badge-${formData.category}`}>
                  {CATEGORY_LABELS[formData.category]}
                </span>
              </div>

              {/* Title */}
              <div className="p-4 bg-muted/30 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">업무명</p>
                <p className="text-foreground font-medium text-lg">{formData.title || '(제목 없음)'}</p>
              </div>

              {/* Description */}
              {formData.description && (
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">설명</p>
                  <p className="text-foreground/80 text-sm whitespace-pre-wrap">{formData.description}</p>
                </div>
              )}

              {/* Due Date & Schedule */}
              <div className="flex gap-3">
                {formData.dueDate && (
                  <div className="flex-1 p-4 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">마감일</p>
                    </div>
                    <p className="text-foreground font-medium">{formatDateKorean(formData.dueDate)}</p>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${getDDayColorClass(formData.dueDate).bg} ${getDDayColorClass(formData.dueDate).text}`}
                    >
                      {formatDDay(formData.dueDate)}
                    </span>
                  </div>
                )}
              </div>

              {/* Assignee & Deliverables */}
              {(formData.assignee || formData.deliverables) && (
                <div className="flex gap-3">
                  {formData.assignee && (
                    <div className="flex-1 p-4 bg-muted/30 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">담당자</p>
                      </div>
                      <p className="text-foreground font-medium">{formData.assignee}</p>
                    </div>
                  )}
                  {formData.deliverables && (
                    <div className="flex-1 p-4 bg-muted/30 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">산출물</p>
                      </div>
                      <p className="text-foreground font-medium text-sm">{formData.deliverables}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {formData.notes && (
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">메모</p>
                  <p className="text-foreground/80 text-sm whitespace-pre-wrap">{formData.notes}</p>
                </div>
              )}

              {/* Attachments View */}
              {formData.attachments && formData.attachments.length > 0 && (
                <div className="p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">첨부파일 ({formData.attachments.length})</p>
                  </div>
                  <div className="space-y-2">
                    {formData.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        {/* Thumbnail or Icon */}
                        <div className="relative w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                          {attachment.type === 'image' ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={attachment.url}
                              alt={attachment.name}
                              className="w-full h-full object-cover"
                            />
                          ) : attachment.type === 'youtube' && attachment.thumbnailUrl ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={attachment.thumbnailUrl}
                                alt={attachment.name}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Youtube className="w-4 h-4 text-red-500" />
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{attachment.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {attachment.type === 'youtube' ? '유튜브 영상' : attachment.type === 'image' ? '이미지' : '문서'}
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
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
