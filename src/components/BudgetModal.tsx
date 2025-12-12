'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil, Wallet } from 'lucide-react';
import {
  BudgetItem,
  BudgetCategory,
  BUDGET_CATEGORY_LABELS,
  BUDGET_CATEGORY_COLORS,
  MONTHS_INFO,
  AVAILABLE_YEARS,
} from '@/lib/types';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (budget: Omit<BudgetItem, 'id'>) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  budget?: BudgetItem | null;
  defaultYear?: number;
  defaultMonth?: number;
  defaultCategory?: BudgetCategory;
}

const CATEGORY_OPTIONS = Object.keys(BUDGET_CATEGORY_LABELS) as BudgetCategory[];

export default function BudgetModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  budget,
  defaultYear = 2026,
  defaultMonth = 1,
  defaultCategory = 'marketing',
}: BudgetModalProps) {
  const [formData, setFormData] = useState({
    year: defaultYear,
    month: defaultMonth,
    category: defaultCategory,
    budgeted: 0,
    spent: 0,
    description: '',
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

    if (budget) {
      setFormData({
        year: budget.year,
        month: budget.month,
        category: budget.category,
        budgeted: budget.budgeted,
        spent: budget.spent,
        description: budget.description || '',
      });
      setIsEditing(!mobile || !budget);
    } else {
      setFormData({
        year: defaultYear,
        month: defaultMonth,
        category: defaultCategory,
        budgeted: 0,
        spent: 0,
        description: '',
      });
      setIsEditing(true);
    }
  }, [budget, defaultYear, defaultMonth, defaultCategory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.budgeted <= 0) return;

    await onSave({
      year: formData.year,
      month: formData.month,
      category: formData.category,
      budgeted: formData.budgeted,
      spent: formData.spent,
      description: formData.description || undefined,
    });
    onClose();
  };

  const handleDelete = async () => {
    if (budget && onDelete && window.confirm('이 예산 항목을 삭제하시겠습니까?')) {
      await onDelete();
      onClose();
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  // Individual change handlers to prevent re-render issues
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, month: parseInt(e.target.value) }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, category: e.target.value as BudgetCategory }));
  };

  const handleBudgetedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-digit characters and parse
    const value = e.target.value.replace(/[^\d]/g, '');
    setFormData(prev => ({ ...prev, budgeted: parseInt(value) || 0 }));
  };

  // Format number with commas for display
  const formatNumberWithCommas = (num: number): string => {
    if (num === 0) return '';
    return num.toLocaleString('ko-KR');
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, description: e.target.value }));
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
              {budget ? (isEditing ? '예산 수정' : '예산 상세') : '새 예산 추가'}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">연도</label>
                  <div className="relative">
                    <select
                      value={formData.year}
                      onChange={handleYearChange}
                      className="w-full px-4 py-2.5 pr-10 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all appearance-none cursor-pointer"
                    >
                      {AVAILABLE_YEARS.map((year) => (
                        <option key={year} value={year}>{year}년</option>
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
                  <label className="block text-sm font-medium text-foreground mb-1.5">월</label>
                  <div className="relative">
                    <select
                      value={formData.month}
                      onChange={handleMonthChange}
                      className="w-full px-4 py-2.5 pr-10 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all appearance-none cursor-pointer"
                    >
                      {MONTHS_INFO.map((month) => (
                        <option key={month.id} value={month.id}>{month.name}</option>
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
                  예산 금액 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatNumberWithCommas(formData.budgeted)}
                    onChange={handleBudgetedChange}
                    placeholder="예산 금액을 입력하세요"
                    className="w-full px-4 py-2.5 pr-8 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">원</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">설명</label>
                <textarea
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  placeholder="예산에 대한 설명"
                  rows={2}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                {budget && onDelete && (
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
                    if (isMobile && budget) {
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
                  {budget ? '저장' : '추가'}
                </button>
              </div>
            </form>
          ) : (
            /* View Mode */
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${colors.bg} ${colors.border} border`}>
                  <Wallet className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">카테고리</p>
                  <p className={`font-medium ${colors.text}`}>{BUDGET_CATEGORY_LABELS[formData.category]}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">예산</p>
                  <p className="text-foreground font-medium text-lg">
                    {formData.budgeted.toLocaleString()}원
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">지출</p>
                  <p className="text-foreground font-medium text-lg">
                    {formData.spent.toLocaleString()}원
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 p-4 bg-muted/30 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">연도</p>
                  <p className="text-foreground font-medium">{formData.year}년</p>
                </div>
                <div className="flex-1 p-4 bg-muted/30 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">월</p>
                  <p className="text-foreground font-medium">{formData.month}월</p>
                </div>
              </div>

              {formData.description && (
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">설명</p>
                  <p className="text-foreground/80 text-sm">{formData.description}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {budget && onDelete && (
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
