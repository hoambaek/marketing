'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil, CheckCircle2, Circle, Calendar, Tag } from 'lucide-react';
import { MustDoItem, TaskCategory, MONTHS_INFO, CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/types';
import { toast } from '@/lib/store/toast-store';

const CATEGORY_OPTIONS: TaskCategory[] = ['operation', 'marketing', 'design', 'filming', 'pr', 'b2b'];

interface MustDoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<MustDoItem, 'id'>) => void | Promise<void>;
  item?: MustDoItem | null;
  defaultMonth?: number;
  defaultYear?: number;
}

export default function MustDoModal({
  isOpen,
  onClose,
  onSave,
  item,
  defaultMonth = 1,
  defaultYear = 2026,
}: MustDoModalProps) {
  const [formData, setFormData] = useState({
    year: defaultYear,
    title: '',
    month: defaultMonth,
    done: false,
    category: 'operation' as TaskCategory,
  });

  // Mobile: view mode first, then edit mode
  // Desktop: always edit mode
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

    if (item) {
      setFormData({
        year: item.year,
        title: item.title,
        month: item.month,
        done: item.done,
        category: item.category || 'operation',
      });
      // On mobile with existing item: show view mode first
      // On desktop or new item: show edit mode
      setIsEditing(!mobile || !item);
    } else {
      setFormData({
        year: defaultYear,
        title: '',
        month: defaultMonth,
        done: false,
        category: 'operation',
      });
      // New item: always edit mode
      setIsEditing(true);
    }
  }, [item, defaultMonth, defaultYear, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    await onSave({
      year: formData.year,
      title: formData.title.trim(),
      month: formData.month,
      done: formData.done,
      category: formData.category,
    });
    toast.success(item ? 'Must-Do가 수정되었습니다' : 'Must-Do가 추가되었습니다');
    onClose();
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  if (!isOpen) return null;

  const monthInfo = MONTHS_INFO.find(m => m.id === formData.month);

  // View Mode (Mobile only, when editing existing item)
  const ViewMode = () => (
    <div className="p-5 space-y-4">
      {/* Status */}
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-xl ${formData.done ? 'bg-emerald-500/20' : 'bg-white/[0.06]'}`}>
          {formData.done ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <Circle className="w-5 h-5 text-white/40" />
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">상태</p>
          <p className={`font-medium ${formData.done ? 'text-emerald-400' : 'text-white/60'}`}>
            {formData.done ? '완료됨' : '미완료'}
          </p>
        </div>
      </div>

      {/* Category */}
      <div className="p-4 bg-muted/30 rounded-xl">
        <div className="flex items-center gap-2 mb-1">
          <Tag className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">카테고리</p>
        </div>
        <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${CATEGORY_COLORS[formData.category]}`}>
          {CATEGORY_LABELS[formData.category]}
        </span>
      </div>

      {/* Title */}
      <div className="p-4 bg-muted/30 rounded-xl">
        <p className="text-xs text-muted-foreground mb-1">항목</p>
        <p className="text-foreground font-medium text-lg">{formData.title || '(내용 없음)'}</p>
      </div>

      {/* Month */}
      <div className="p-4 bg-muted/30 rounded-xl">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">월</p>
        </div>
        <p className="text-foreground font-medium">
          {monthInfo ? `${monthInfo.name} - ${monthInfo.title}` : '-'}
        </p>
      </div>

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
      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          카테고리 <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as TaskCategory })}
            className="w-full px-4 py-2.5 pr-10 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all appearance-none cursor-pointer"
          >
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          항목 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="반드시 해야 할 일을 입력하세요"
          className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
          autoFocus={!isMobile}
        />
      </div>

      {/* Month */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          월
        </label>
        <div className="relative">
          <select
            value={formData.month}
            onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
            className="w-full px-4 py-2.5 pr-10 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all appearance-none cursor-pointer"
          >
            {MONTHS_INFO.map((month) => (
              <option key={month.id} value={month.id}>
                {month.name} - {month.title}
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

      {/* Done Status (only for editing) */}
      {item && (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="done-checkbox"
            checked={formData.done}
            onChange={(e) => setFormData({ ...formData, done: e.target.checked })}
            className="w-5 h-5 rounded border-border text-accent focus:ring-accent/50"
          />
          <label htmlFor="done-checkbox" className="text-sm text-foreground">
            완료됨
          </label>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => {
            if (isMobile && item) {
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
          {item ? '저장' : '추가'}
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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag Handle for Mobile */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-display text-xl text-foreground">
              {item ? (isEditing ? 'Must-Do 수정' : 'Must-Do 상세') : '새 Must-Do 추가'}
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
