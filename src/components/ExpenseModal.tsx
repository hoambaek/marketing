'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil, Receipt, Calendar, Building2, AlignLeft } from 'lucide-react';
import {
  ExpenseItem,
  BudgetCategory,
  BUDGET_CATEGORY_LABELS,
  BUDGET_CATEGORY_COLORS,
  MONTHS_INFO,
  AVAILABLE_YEARS,
} from '@/lib/types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<ExpenseItem, 'id'>) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  expense?: ExpenseItem | null;
  defaultYear?: number;
  defaultMonth?: number;
  defaultCategory?: BudgetCategory;
}

const CATEGORY_OPTIONS = Object.keys(BUDGET_CATEGORY_LABELS) as BudgetCategory[];

export default function ExpenseModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  expense,
  defaultYear = 2026,
  defaultMonth = 1,
  defaultCategory = 'marketing',
}: ExpenseModalProps) {
  const [formData, setFormData] = useState({
    year: defaultYear,
    month: defaultMonth,
    category: defaultCategory,
    amount: 0,
    description: '',
    vendor: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

    if (expense) {
      setFormData({
        year: expense.year,
        month: expense.month,
        category: expense.category,
        amount: expense.amount,
        description: expense.description,
        vendor: expense.vendor || '',
        date: expense.date,
        notes: expense.notes || '',
      });
      setIsEditing(!mobile || !expense);
    } else {
      setFormData({
        year: defaultYear,
        month: defaultMonth,
        category: defaultCategory,
        amount: 0,
        description: '',
        vendor: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setIsEditing(true);
    }
  }, [expense, defaultYear, defaultMonth, defaultCategory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0 || !formData.description.trim()) return;

    await onSave({
      year: formData.year,
      month: formData.month,
      category: formData.category,
      amount: formData.amount,
      description: formData.description.trim(),
      vendor: formData.vendor.trim() || undefined,
      date: formData.date,
      notes: formData.notes.trim() || undefined,
    });
    onClose();
  };

  const handleDelete = async () => {
    if (expense && onDelete && window.confirm('이 지출 내역을 삭제하시겠습니까?')) {
      await onDelete();
      onClose();
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  // Individual change handlers to prevent re-render issues
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, category: e.target.value as BudgetCategory }));
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, description: e.target.value }));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-digit characters and parse
    const value = e.target.value.replace(/[^\d]/g, '');
    setFormData(prev => ({ ...prev, amount: parseInt(value) || 0 }));
  };

  // Format number with commas for display
  const formatNumberWithCommas = (num: number): string => {
    if (num === 0) return '';
    return num.toLocaleString('ko-KR');
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    setFormData(prev => ({
      ...prev,
      date: e.target.value,
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    }));
  };

  const handleVendorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, vendor: e.target.value }));
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, notes: e.target.value }));
  };

  if (!isOpen) return null;

  const colors = BUDGET_CATEGORY_COLORS[formData.category];

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
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
          </div>

          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-display text-xl text-foreground">
              {expense ? (isEditing ? '지출 수정' : '지출 상세') : '새 지출 추가'}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-muted active:bg-muted/50 transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {isEditing ? (
            /* Edit Mode */
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  카테고리 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.category}
                    onChange={handleCategoryChange}
                    className="w-full px-4 py-2.5 pr-10 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all appearance-none cursor-pointer"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>{BUDGET_CATEGORY_LABELS[cat]}</option>
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
                  지출 내용 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  placeholder="지출 내용을 입력하세요"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                  autoFocus={!isMobile}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  금액 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatNumberWithCommas(formData.amount)}
                    onChange={handleAmountChange}
                    placeholder="금액을 입력하세요"
                    className="w-full px-4 py-2.5 pr-8 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">원</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    날짜 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={handleDateChange}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">거래처</label>
                  <input
                    type="text"
                    value={formData.vendor}
                    onChange={handleVendorChange}
                    placeholder="거래처명"
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">메모</label>
                <textarea
                  value={formData.notes}
                  onChange={handleNotesChange}
                  placeholder="메모"
                  rows={2}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                {expense && onDelete && (
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
                    if (isMobile && expense) {
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
                  {expense ? '저장' : '추가'}
                </button>
              </div>
            </form>
          ) : (
            /* View Mode */
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${colors.bg} ${colors.border} border`}>
                  <Receipt className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">카테고리</p>
                  <p className={`font-medium ${colors.text}`}>{BUDGET_CATEGORY_LABELS[formData.category]}</p>
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">지출 내용</p>
                <p className="text-foreground font-medium text-lg">{formData.description || '(내용 없음)'}</p>
              </div>

              <div className="p-4 bg-muted/30 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">금액</p>
                <p className="text-foreground font-medium text-xl">{formData.amount.toLocaleString()}원</p>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">날짜</p>
                  </div>
                  <p className="text-foreground font-medium">
                    {new Date(formData.date).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                {formData.vendor && (
                  <div className="flex-1 p-4 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">거래처</p>
                    </div>
                    <p className="text-foreground font-medium">{formData.vendor}</p>
                  </div>
                )}
              </div>

              {formData.notes && (
                <div className="p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <AlignLeft className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">메모</p>
                  </div>
                  <p className="text-foreground/80 text-sm whitespace-pre-wrap">{formData.notes}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {expense && onDelete && (
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
