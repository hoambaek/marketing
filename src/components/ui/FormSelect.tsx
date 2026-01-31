'use client';

import { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface FormSelectProps<T extends string> {
  label?: string;
  value: T;
  onChange: (value: T) => void;
  options: T[];
  labels: Record<T, string>;
  icon?: ReactNode;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

/**
 * 공통 Select 컴포넌트
 * 커스텀 스타일과 아이콘 지원
 */
export default function FormSelect<T extends string>({
  label,
  value,
  onChange,
  options,
  labels,
  icon,
  disabled = false,
  required = false,
  className = '',
}: FormSelectProps<T>) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
          {icon}
          {label}
          {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          disabled={disabled}
          className={`
            w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-10
            bg-background border border-border rounded-xl
            text-sm sm:text-base text-foreground
            focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent
            transition-colors appearance-none
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {labels[option]}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
