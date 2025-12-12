'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { MustDoItem, MONTHS_INFO } from '@/lib/types';

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
  });

  useEffect(() => {
    if (item) {
      setFormData({
        year: item.year,
        title: item.title,
        month: item.month,
        done: item.done,
      });
    } else {
      setFormData({
        year: defaultYear,
        title: '',
        month: defaultMonth,
        done: false,
      });
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
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-display text-xl text-foreground">
              {item ? 'Must-Do 수정' : '새 Must-Do 추가'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
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
                autoFocus
              />
            </div>

            {/* Month */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                월
              </label>
              <select
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              >
                {MONTHS_INFO.map((month) => (
                  <option key={month.id} value={month.id}>
                    {month.name} - {month.title}
                  </option>
                ))}
              </select>
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
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-muted-foreground hover:bg-muted transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-accent text-white rounded-xl hover:bg-accent/90 transition-colors font-medium"
              >
                {item ? '수정' : '추가'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
