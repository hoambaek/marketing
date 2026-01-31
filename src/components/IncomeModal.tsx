'use client';

import { useState, useEffect } from 'react';
import { Pencil, Wallet } from 'lucide-react';
import {
  IncomeItem,
  BudgetCategory,
  BUDGET_CATEGORY_LABELS,
  BUDGET_CATEGORY_COLORS,
  MONTHS_INFO,
  AVAILABLE_YEARS,
} from '@/lib/types';
import { toast } from '@/lib/store/toast-store';
import { BaseModal } from '@/components/ui';
import { useIsMobile } from '@/hooks/useIsMobile';

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (income: Omit<IncomeItem, 'id'>) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  income?: IncomeItem | null;
  defaultYear?: number;
  defaultMonth?: number;
  defaultCategory?: BudgetCategory;
}

const CATEGORY_OPTIONS = Object.keys(BUDGET_CATEGORY_LABELS) as BudgetCategory[];

export default function IncomeModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  income,
  defaultYear = 2026,
  defaultMonth = 1,
  defaultCategory = 'marketing',
}: IncomeModalProps) {
  const isMobile = useIsMobile();

  const [formData, setFormData] = useState({
    year: defaultYear,
    month: defaultMonth,
    category: defaultCategory,
    amount: 0,
    description: '',
    source: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (income) {
      setFormData({
        year: income.year,
        month: income.month,
        category: income.category,
        amount: income.amount,
        description: income.description || '',
        source: income.source || '',
        date: income.date || new Date().toISOString().split('T')[0],
      });
      setIsEditing(!isMobile || !income);
    } else {
      setFormData({
        year: defaultYear,
        month: defaultMonth,
        category: defaultCategory,
        amount: 0,
        description: '',
        source: '',
        date: new Date().toISOString().split('T')[0],
      });
      setIsEditing(true);
    }
  }, [income, defaultYear, defaultMonth, defaultCategory, isOpen, isMobile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) return;

    await onSave({
      year: formData.year,
      month: formData.month,
      category: formData.category,
      amount: formData.amount,
      description: formData.description || undefined,
      source: formData.source || undefined,
      date: formData.date,
    });
    toast.success(income ? '수입이 수정되었습니다' : '수입이 추가되었습니다');
    onClose();
  };

  const handleDelete = async () => {
    if (income && onDelete && window.confirm('이 수입 항목을 삭제하시겠습니까?')) {
      await onDelete();
      toast.success('수입이 삭제되었습니다');
      onClose();
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  // Individual change handlers
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, month: parseInt(e.target.value) }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, category: e.target.value as BudgetCategory }));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setFormData(prev => ({ ...prev, amount: parseInt(value) || 0 }));
  };

  const formatNumberWithCommas = (num: number): string => {
    if (num === 0) return '';
    return num.toLocaleString('ko-KR');
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, description: e.target.value }));
  };

  const handleSourceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, source: e.target.value }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, date: e.target.value }));
  };

  const colors = BUDGET_CATEGORY_COLORS[formData.category];
  const modalTitle = income ? (isEditing ? '수입 수정' : '수입 상세') : '새 수입 추가';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      maxWidth="md"
    >
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
              수입 금액 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={formatNumberWithCommas(formData.amount)}
                onChange={handleAmountChange}
                placeholder="수입 금액을 입력하세요"
                className="w-full px-4 py-2.5 pr-8 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">원</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">수입 날짜</label>
              <input
                type="date"
                value={formData.date}
                onChange={handleDateChange}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">수입처</label>
              <input
                type="text"
                value={formData.source}
                onChange={handleSourceChange}
                placeholder="수입처 (선택)"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">설명</label>
            <textarea
              value={formData.description}
              onChange={handleDescriptionChange}
              placeholder="수입에 대한 설명"
              rows={2}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            {income && onDelete && (
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
                if (isMobile && income) {
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
              {income ? '저장' : '추가'}
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

          <div className="p-4 bg-muted/30 rounded-xl">
            <p className="text-xs text-muted-foreground mb-1">수입 금액</p>
            <p className="text-foreground font-medium text-lg">
              {formData.amount.toLocaleString()}원
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-muted/30 rounded-xl">
              <p className="text-xs text-muted-foreground mb-1">연도</p>
              <p className="text-foreground font-medium">{formData.year}년</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-xl">
              <p className="text-xs text-muted-foreground mb-1">월</p>
              <p className="text-foreground font-medium">{formData.month}월</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-muted/30 rounded-xl">
              <p className="text-xs text-muted-foreground mb-1">날짜</p>
              <p className="text-foreground font-medium">{formData.date}</p>
            </div>
            {formData.source && (
              <div className="p-4 bg-muted/30 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">수입처</p>
                <p className="text-foreground font-medium">{formData.source}</p>
              </div>
            )}
          </div>

          {formData.description && (
            <div className="p-4 bg-muted/30 rounded-xl">
              <p className="text-xs text-muted-foreground mb-1">설명</p>
              <p className="text-foreground/80 text-sm">{formData.description}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {income && onDelete && (
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
    </BaseModal>
  );
}
