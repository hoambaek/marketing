'use client';

import { ReactNode, TextareaHTMLAttributes } from 'react';

interface FormTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label?: string;
  icon?: ReactNode;
  error?: string;
  onChange: (value: string) => void;
}

/**
 * 공통 Textarea 컴포넌트
 * 레이블, 아이콘, 에러 메시지 지원
 */
export default function FormTextarea({
  label,
  icon,
  error,
  onChange,
  className = '',
  rows = 3,
  ...props
}: FormTextareaProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
          {icon}
          {label}
          {props.required && <span className="text-red-400">*</span>}
        </label>
      )}
      <textarea
        {...props}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full px-3 sm:px-4 py-2 sm:py-2.5
          bg-background border border-border rounded-xl
          text-sm sm:text-base text-foreground
          placeholder:text-muted-foreground/50
          focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent
          transition-colors resize-none
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:ring-red-500/50' : ''}
        `}
      />
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
