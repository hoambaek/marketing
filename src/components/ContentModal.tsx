'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil, Instagram, Youtube, FileText, Mail, Megaphone, Calendar, AlignLeft } from 'lucide-react';
import { ContentItem, ContentType, ContentStatus, CONTENT_TYPES } from '@/lib/types';
import { toast } from '@/lib/store/toast-store';

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

const CONTENT_ICONS: Record<ContentType, React.ReactNode> = {
  instagram: <Instagram className="w-5 h-5" />,
  youtube: <Youtube className="w-5 h-5" />,
  blog: <FileText className="w-5 h-5" />,
  newsletter: <Mail className="w-5 h-5" />,
  press: <Megaphone className="w-5 h-5" />,
};

const CONTENT_COLORS: Record<ContentType, string> = {
  instagram: 'bg-pink-500/20 text-pink-400',
  youtube: 'bg-red-500/20 text-red-400',
  blog: 'bg-blue-500/20 text-blue-400',
  newsletter: 'bg-emerald-500/20 text-emerald-400',
  press: 'bg-violet-500/20 text-violet-400',
};

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

    if (content) {
      setFormData({
        year: content.year,
        type: content.type,
        title: content.title,
        description: content.description || '',
        date: content.date,
        status: content.status,
      });
      // On mobile with existing content: show view mode first
      // On desktop or new content: show edit mode
      setIsEditing(!mobile || !content);
    } else {
      setFormData({
        year: defaultYear,
        type: 'instagram',
        title: '',
        description: '',
        date: defaultDate || new Date().toISOString().split('T')[0],
        status: 'draft',
      });
      // New content: always edit mode
      setIsEditing(true);
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
    toast.success(content ? '콘텐츠가 수정되었습니다' : '콘텐츠가 추가되었습니다');
    onClose();
  };

  const handleDelete = async () => {
    if (content && onDelete && window.confirm('이 콘텐츠를 삭제하시겠습니까?')) {
      await onDelete(content.id);
      toast.success('콘텐츠가 삭제되었습니다');
      onClose();
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  // Individual change handlers to prevent re-render issues
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, type: e.target.value as ContentType }));
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, title: e.target.value }));
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, description: e.target.value }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, date: e.target.value }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, status: e.target.value as ContentStatus }));
  };

  if (!isOpen) return null;

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
              {content ? (isEditing ? '콘텐츠 수정' : '콘텐츠 상세') : '새 콘텐츠 추가'}
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
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  콘텐츠 유형 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.type}
                    onChange={handleTypeChange}
                    className="w-full px-4 py-2.5 pr-10 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all appearance-none cursor-pointer"
                  >
                    {CONTENT_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {CONTENT_TYPES[type]}
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

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={handleTitleChange}
                  placeholder="콘텐츠 제목을 입력하세요"
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
                  placeholder="콘텐츠에 대한 상세 설명"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none"
                />
              </div>

              {/* Date & Status Row */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Date */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    발행일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={handleDateChange}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                  />
                </div>

                {/* Status */}
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
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
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
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                {content && onDelete && (
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
                    if (isMobile && content) {
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
                  {content ? '저장' : '추가'}
                </button>
              </div>
            </form>
          ) : (
            /* View Mode */
            <div className="p-5 space-y-4">
              {/* Content Type */}
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${CONTENT_COLORS[formData.type]}`}>
                  {CONTENT_ICONS[formData.type]}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">콘텐츠 유형</p>
                  <p className="text-foreground font-medium">{CONTENT_TYPES[formData.type]}</p>
                </div>
              </div>

              {/* Title */}
              <div className="p-4 bg-muted/30 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">제목</p>
                <p className="text-foreground font-medium text-lg">{formData.title || '(제목 없음)'}</p>
              </div>

              {/* Description */}
              {formData.description && (
                <div className="p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <AlignLeft className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">설명</p>
                  </div>
                  <p className="text-foreground/80 text-sm whitespace-pre-wrap">{formData.description}</p>
                </div>
              )}

              {/* Date & Status */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">발행일</p>
                  </div>
                  <p className="text-foreground font-medium">
                    {formData.date ? new Date(formData.date).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }) : '-'}
                  </p>
                </div>
                <div className="flex-1 p-4 bg-muted/30 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">상태</p>
                  <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${
                    formData.status === 'published'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : formData.status === 'scheduled'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-white/[0.06] text-white/60'
                  }`}>
                    {STATUS_OPTIONS.find(s => s.value === formData.status)?.label}
                  </span>
                </div>
              </div>

              {/* Edit Button */}
              <div className="flex gap-3 pt-2">
                {content && onDelete && (
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
