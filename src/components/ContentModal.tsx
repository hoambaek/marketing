'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ContentItem, ContentType, ContentStatus, CONTENT_TYPES } from '@/lib/types';

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: Omit<ContentItem, 'id'>) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
  content?: ContentItem | null;
  defaultDate?: string;
  defaultYear?: number;
}

const CONTENT_TYPE_OPTIONS: ContentType[] = ['instagram', 'youtube', 'blog', 'newsletter', 'press'];
const STATUS_OPTIONS: { value: ContentStatus; label: string }[] = [
  { value: 'draft', label: '초안' },
  { value: 'scheduled', label: '예약됨' },
  { value: 'published', label: '발행완료' },
];

export default function ContentModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  content,
  defaultDate,
  defaultYear = 2026,
}: ContentModalProps) {
  const [formData, setFormData] = useState({
    year: defaultYear,
    type: 'instagram' as ContentType,
    title: '',
    description: '',
    date: '',
    status: 'draft' as ContentStatus,
  });

  useEffect(() => {
    if (content) {
      setFormData({
        year: content.year,
        type: content.type,
        title: content.title,
        description: content.description || '',
        date: content.date,
        status: content.status,
      });
    } else {
      setFormData({
        year: defaultYear,
        type: 'instagram',
        title: '',
        description: '',
        date: defaultDate || new Date().toISOString().split('T')[0],
        status: 'draft',
      });
    }
  }, [content, defaultDate, defaultYear, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date) return;

    const contentData: Omit<ContentItem, 'id'> = {
      year: formData.year,
      type: formData.type,
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      date: formData.date,
      status: formData.status,
    };

    await onSave(contentData);
    onClose();
  };

  const handleDelete = async () => {
    if (content && onDelete && window.confirm('이 콘텐츠를 삭제하시겠습니까?')) {
      await onDelete(content.id);
      onClose();
    }
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
          className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-display text-xl text-foreground">
              {content ? '콘텐츠 수정' : '새 콘텐츠 추가'}
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
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                콘텐츠 유형 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ContentType })}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              >
                {CONTENT_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {CONTENT_TYPES[type]}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="콘텐츠 제목을 입력하세요"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                autoFocus
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
                placeholder="콘텐츠에 대한 상세 설명"
                rows={3}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none"
              />
            </div>

            {/* Date & Status Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  발행일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  상태
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ContentStatus })}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              {content && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2.5 border border-red-500/30 text-red-500 rounded-xl hover:bg-red-500/10 transition-colors"
                >
                  삭제
                </button>
              )}
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
                {content ? '수정' : '추가'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
