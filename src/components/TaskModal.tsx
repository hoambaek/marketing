'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Task, TaskCategory, TaskStatus, CATEGORY_LABELS } from '@/lib/types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> | Partial<Task>) => void | Promise<void>;
  task?: Task | null;
  month: number;
  week: number;
}

const CATEGORIES: TaskCategory[] = ['operation', 'marketing', 'design', 'filming', 'pr', 'b2b'];

export default function TaskModal({ isOpen, onClose, onSave, task, month, week }: TaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'operation' as TaskCategory,
    status: 'pending' as TaskStatus,
    assignee: '',
    deliverables: '',
    notes: '',
  });

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
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'operation',
        status: 'pending',
        assignee: '',
        deliverables: '',
        notes: '',
      });
    }
  }, [task, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      month,
      week,
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
              {task ? '업무 수정' : '새 업무 추가'}
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
                업무명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="업무명을 입력하세요"
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
                placeholder="업무에 대한 상세 설명"
                rows={3}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none"
              />
            </div>

            {/* Category & Status Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div>
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

              {/* Status */}
              <div>
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
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-muted-foreground hover:bg-muted transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-accent text-white rounded-xl hover:bg-accent/90 transition-colors font-medium"
              >
                {task ? '수정' : '추가'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
