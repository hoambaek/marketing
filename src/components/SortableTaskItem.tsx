'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Circle, GripVertical, Pencil, Trash2, FileText, Calendar } from 'lucide-react';
import { Task, CATEGORY_LABELS, TaskCategory, TaskStatus } from '@/lib/types';
import { formatDateKorean, formatDDay, getDDayColorClass } from '@/lib/utils/date';

interface SortableTaskItemProps {
  task: Task;
  onStatusToggle: (taskId: string, status: TaskStatus) => void | Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void | Promise<void>;
}

export default function SortableTaskItem({
  task,
  onStatusToggle,
  onEdit,
  onDelete,
}: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group p-3 sm:p-4 rounded-xl transition-all ${
        isDragging
          ? 'bg-accent/10 shadow-lg ring-2 ring-accent/30 z-50'
          : task.status === 'done'
          ? 'bg-muted/30'
          : 'bg-background hover:bg-muted/20'
      }`}
    >
      {/* Header Row: Drag + Checkbox + Title + Actions */}
      <div className="flex items-start gap-2 sm:gap-3">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none p-1 -ml-1 rounded hover:bg-muted transition-colors"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Checkbox */}
        <button
          onClick={() => onStatusToggle(task.id, task.status)}
          className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110"
        >
          {task.status === 'done' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : task.status === 'in_progress' ? (
            <Clock className="w-5 h-5 text-amber-500" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
          )}
        </button>

        {/* Title */}
        <p
          className={`flex-1 min-w-0 text-sm sm:text-base font-medium break-words ${
            task.status === 'done'
              ? 'text-muted-foreground line-through'
              : 'text-foreground'
          }`}
        >
          {task.title}
        </p>

        {/* Actions - always visible on mobile */}
        <div className="flex items-center gap-0.5 flex-shrink-0 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 rounded-lg hover:bg-muted active:bg-muted/50 transition-colors"
            title="수정"
          >
            <Pencil className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 rounded-lg hover:bg-red-500/10 active:bg-red-500/20 transition-colors"
            title="삭제"
          >
            <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
          </button>
        </div>
      </div>

      {/* Description - Full width, below the title row */}
      {task.description && (
        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 ml-[52px] sm:ml-[60px] break-words">
          {task.description}
        </p>
      )}

      {/* Badges Row - Full width */}
      <div className="flex items-center gap-1.5 sm:gap-2 mt-2 ml-[52px] sm:ml-[60px] flex-wrap">
        {/* Category Badge */}
        <span
          className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium badge-${task.category}`}
        >
          {CATEGORY_LABELS[task.category as TaskCategory]}
        </span>

        {/* Due Date with D-Day - Only show if not done */}
        {task.dueDate && task.status !== 'done' && (
          <>
            <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-white/[0.04] text-[10px] sm:text-xs text-white/50">
              <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {formatDateKorean(task.dueDate)}
            </span>
            <span
              className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-medium ${getDDayColorClass(task.dueDate).bg} ${getDDayColorClass(task.dueDate).text}`}
            >
              {formatDDay(task.dueDate)}
            </span>
          </>
        )}

        {/* Due Date for completed tasks - muted style */}
        {task.dueDate && task.status === 'done' && (
          <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-white/[0.02] text-[10px] sm:text-xs text-white/30">
            <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            {formatDateKorean(task.dueDate)}
          </span>
        )}

        {/* Assignee */}
        {task.assignee && (
          <span className="px-1.5 sm:px-2 py-0.5 rounded bg-muted text-[10px] sm:text-xs text-muted-foreground">
            {task.assignee}
          </span>
        )}

        {/* Deliverables */}
        {task.deliverables && task.deliverables.length > 0 && (
          <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-muted text-[10px] sm:text-xs text-muted-foreground">
            <FileText className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            {task.deliverables[0]}
            {task.deliverables.length > 1 && (
              <span> +{task.deliverables.length - 1}</span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
