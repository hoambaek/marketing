'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AVAILABLE_YEARS, MONTHS_INFO } from '@/lib/types';

interface YearMonthSelectorProps {
  selectedYear: number;
  selectedMonth: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  showAllOption?: boolean;
  onAllSelect?: () => void;
  isAllSelected?: boolean;
  className?: string;
}

export function YearMonthSelector({
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  showAllOption = false,
  onAllSelect,
  isAllSelected = false,
  className = '',
}: YearMonthSelectorProps) {
  const currentYearIndex = AVAILABLE_YEARS.indexOf(selectedYear);

  const handlePrevYear = () => {
    if (currentYearIndex > 0) {
      onYearChange(AVAILABLE_YEARS[currentYearIndex - 1]);
    }
  };

  const handleNextYear = () => {
    if (currentYearIndex < AVAILABLE_YEARS.length - 1) {
      onYearChange(AVAILABLE_YEARS[currentYearIndex + 1]);
    }
  };

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      {/* Subtle glass background */}
      <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-sm" />
      <div className="absolute inset-0 border border-white/[0.05] rounded-xl" />

      <div className="relative flex items-center justify-between px-4 py-2.5 gap-4">
        {/* Year Selector - Compact inline */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handlePrevYear}
            disabled={currentYearIndex === 0}
            className={`p-1 rounded-md transition-all ${
              currentYearIndex === 0
                ? 'text-white/10 cursor-not-allowed'
                : 'text-white/30 hover:text-white/60 hover:bg-white/[0.04]'
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center">
            {AVAILABLE_YEARS.map((year) => (
              <button
                key={year}
                onClick={() => onYearChange(year)}
                className={`relative px-2.5 py-1 rounded-md text-sm transition-all ${
                  selectedYear === year && !isAllSelected
                    ? 'text-[#d4c4a8]'
                    : 'text-white/25 hover:text-white/50'
                }`}
                style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
              >
                {year}
                {selectedYear === year && !isAllSelected && (
                  <motion.div
                    layoutId="yearPill"
                    className="absolute inset-0 rounded-md bg-[#b7916e]/10 border border-[#b7916e]/20"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                  />
                )}
              </button>
            ))}
          </div>

          <button
            onClick={handleNextYear}
            disabled={currentYearIndex === AVAILABLE_YEARS.length - 1}
            className={`p-1 rounded-md transition-all ${
              currentYearIndex === AVAILABLE_YEARS.length - 1
                ? 'text-white/10 cursor-not-allowed'
                : 'text-white/30 hover:text-white/60 hover:bg-white/[0.04]'
            }`}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Vertical divider */}
        <div className="w-px h-5 bg-white/[0.06] shrink-0" />

        {/* Month Selector - Scrollable inline */}
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide flex-1 min-w-0">
          {showAllOption && (
            <button
              onClick={onAllSelect}
              className={`relative px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                isAllSelected
                  ? 'text-[#d4c4a8]'
                  : 'text-white/25 hover:text-white/50'
              }`}
            >
              전체
              {isAllSelected && (
                <motion.div
                  layoutId="monthPill"
                  className="absolute inset-0 rounded-md bg-[#b7916e]/10 border border-[#b7916e]/20"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                />
              )}
            </button>
          )}

          {MONTHS_INFO.map((month) => (
            <button
              key={month.id}
              onClick={() => onMonthChange(month.id)}
              className={`relative px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                selectedMonth === month.id && !isAllSelected
                  ? 'text-[#d4c4a8]'
                  : 'text-white/25 hover:text-white/50'
              }`}
            >
              {month.id}월
              {selectedMonth === month.id && !isAllSelected && (
                <motion.div
                  layoutId="monthPill"
                  className="absolute inset-0 rounded-md bg-[#b7916e]/10 border border-[#b7916e]/20"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Ultra compact version for inline use
export function YearMonthSelectorCompact({
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  className = '',
}: Omit<YearMonthSelectorProps, 'showAllOption' | 'onAllSelect' | 'isAllSelected'>) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Year */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => {
            const idx = AVAILABLE_YEARS.indexOf(selectedYear);
            if (idx > 0) onYearChange(AVAILABLE_YEARS[idx - 1]);
          }}
          className="p-0.5 text-white/25 hover:text-white/50 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span
          className="text-sm text-[#d4c4a8] min-w-[40px] text-center"
          style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
        >
          {selectedYear}
        </span>
        <button
          onClick={() => {
            const idx = AVAILABLE_YEARS.indexOf(selectedYear);
            if (idx < AVAILABLE_YEARS.length - 1) onYearChange(AVAILABLE_YEARS[idx + 1]);
          }}
          className="p-0.5 text-white/25 hover:text-white/50 transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-white/[0.06]" />

      {/* Month Pills */}
      <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
        {MONTHS_INFO.map((month) => (
          <button
            key={month.id}
            onClick={() => onMonthChange(month.id)}
            className={`px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-all ${
              selectedMonth === month.id
                ? 'bg-[#b7916e]/15 text-[#d4c4a8] border border-[#b7916e]/25'
                : 'text-white/30 hover:text-white/50 hover:bg-white/[0.03]'
            }`}
          >
            {month.id}월
          </button>
        ))}
      </div>
    </div>
  );
}
