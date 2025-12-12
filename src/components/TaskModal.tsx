'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil, Calendar, User, FileText, Tag, Clock } from 'lucide-react';
import { Task, TaskCategory, TaskStatus, CATEGORY_LABELS, MONTHS_INFO } from '@/lib/types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> | Partial<Task>) => void | Promise<void>;
  task?: Task | null;
  month: number;
  week: number;
}

const CATEGORIES: TaskCategory[] = ['operation', 'marketing', 'design', 'filming', 'pr', 'b2b'];
const WEEKS = [1, 2, 3, 4];
const WEEK_LABELS: Record<number, string> = {
  1: '첫째 주',
  2: '둘째 주',
  3: '셋째 주',
  4: '넷째 주',
};

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
  });

  // Mobile: view mode first, then edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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
      });
      setIsEditing(!isMobile || !task);
    } else {
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
      });
      setIsEditing(true);
    }
  }, [task, isOpen, month, week, isMobile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      month: formData.month,
      week: formData.week,
      category: formData.category,
      status: formData.status,
      assignee: formData.assignee.trim() || undefined,
      deliverables: formData.deliverables
        ? formData.deliverables.split(',').map((d) => d.trim()).filter(Boolean)
        : undefined,
      notes: formData.notes.trim() || undefined,
    };

    await onSave(taskData);
    onClose();
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  if (!isOpen) return null;

  const monthInfo = MONTHS_INFO.find(m => m.id === formData.month);

  // View Mode
  const ViewMode = () => (
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

      {/* Month & Week */}
      <div className="flex gap-3">
        <div className="flex-1 p-4 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">월</p>
          </div>
          <p className="text-foreground font-medium">
            {monthInfo ? monthInfo.name : '-'}
          </p>
        </div>
        <div className="flex-1 p-4 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">주차</p>
          </div>
          <p className="text-foreground font-medium">{WEEK_LABELS[formData.week]}</p>
        </div>
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
  );

  // Edit Mode
  const EditMode = () => (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          업무명 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as TaskCategory })}
            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            상태
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
          >
            <option value="pending">대기</option>
            <option value="in_progress">진행중</option>
            <option value="done">완료</option>
          </select>
        </div>
      </div>

      {/* Month & Week Row */}
      {task && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground mb-1.5">
              월
            </label>
            <select
              value={formData.month}
              onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            >
              {MONTHS_INFO.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} - {m.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground mb-1.5">
              주차
            </label>
            <select
              value={formData.week}
              onChange={(e) => setFormData({ ...formData, week: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            >
              {WEEKS.map((w) => (
                <option key={w} value={w}>
                  {WEEK_LABELS[w]}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Assignee */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          담당자
        </label>
        <input
          type="text"
          value={formData.assignee}
          onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
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
          onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
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
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="추가 메모"
          rows={2}
          className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none"
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
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, y: isMobile ? 100 : 20, scale: isMobile ? 1 : 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: isMobile ? 100 : 20, scale: isMobile ? 1 : 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-y-auto"
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

          {/* Content */}
          {isEditing ? <EditMode /> : <ViewMode />}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
