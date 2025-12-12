'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
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
    <div className={`relative rounded-2xl overflow-hidden ${className}`}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
      <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />

      <div className="relative p-6">
        {/* Year Selector */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              년도 선택
            </p>

            {/* Year Navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevYear}
                disabled={currentYearIndex === 0}
                className={`p-1.5 rounded-lg transition-all duration-300 ${
                  currentYearIndex === 0
                    ? 'text-white/10 cursor-not-allowed'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.06]'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextYear}
                disabled={currentYearIndex === AVAILABLE_YEARS.length - 1}
                className={`p-1.5 rounded-lg transition-all duration-300 ${
                  currentYearIndex === AVAILABLE_YEARS.length - 1
                    ? 'text-white/10 cursor-not-allowed'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.06]'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Year Buttons */}
          <div className="flex items-center gap-2">
            {AVAILABLE_YEARS.map((year) => (
              <button
                key={year}
                onClick={() => onYearChange(year)}
                className="relative group"
              >
                <span
                  className={`block px-5 py-2.5 rounded-xl text-base transition-all duration-300 ${
                    selectedYear === year && !isAllSelected
                      ? 'text-[#d4c4a8]'
                      : 'text-white/30 hover:text-white/60'
                  }`}
                  style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                >
                  {year}
                </span>

                {/* Active Background */}
                {selectedYear === year && !isAllSelected && (
                  <motion.div
                    layoutId="yearSelector"
                    className="absolute inset-0 rounded-xl bg-[#b7916e]/15 border border-[#b7916e]/25"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent mb-6" />

        {/* Month Selector */}
        <div>
          <p className="text-xs text-white/30 uppercase tracking-[0.2em] mb-4">월 선택</p>

          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-2">
            {/* All Option */}
            {showAllOption && (
              <button
                onClick={onAllSelect}
                className="relative flex flex-col items-center min-w-[52px] py-2 group"
              >
                <span
                  className={`text-sm font-medium whitespace-nowrap transition-colors duration-300 ${
                    isAllSelected
                      ? 'text-[#d4c4a8]'
                      : 'text-white/30 group-hover:text-white/60'
                  }`}
                >
                  전체
                </span>
                {isAllSelected && (
                  <motion.div
                    layoutId="monthIndicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-gradient-to-r from-[#b7916e] to-[#d4c4a8]"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
              </button>
            )}

            {/* Month Buttons */}
            {MONTHS_INFO.map((month) => (
              <button
                key={month.id}
                onClick={() => onMonthChange(month.id)}
                className="relative flex flex-col items-center min-w-[52px] py-2 group"
              >
                <span
                  className={`text-sm font-medium whitespace-nowrap transition-colors duration-300 ${
                    selectedMonth === month.id && !isAllSelected
                      ? 'text-[#d4c4a8]'
                      : 'text-white/30 group-hover:text-white/60'
                  }`}
                >
                  {month.name}
                </span>

                {/* Active Indicator */}
                {selectedMonth === month.id && !isAllSelected && (
                  <motion.div
                    layoutId="monthIndicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-gradient-to-r from-[#b7916e] to-[#d4c4a8]"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact Version for headers
export function YearMonthSelectorCompact({
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  className = '',
}: Omit<YearMonthSelectorProps, 'showAllOption' | 'onAllSelect' | 'isAllSelected'>) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Year Dropdown Style */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            const idx = AVAILABLE_YEARS.indexOf(selectedYear);
            if (idx > 0) onYearChange(AVAILABLE_YEARS[idx - 1]);
          }}
          className="p-1 text-white/30 hover:text-white/60 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span
          className="text-lg text-[#d4c4a8] min-w-[60px] text-center"
          style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
        >
          {selectedYear}
        </span>
        <button
          onClick={() => {
            const idx = AVAILABLE_YEARS.indexOf(selectedYear);
            if (idx < AVAILABLE_YEARS.length - 1) onYearChange(AVAILABLE_YEARS[idx + 1]);
          }}
          className="p-1 text-white/30 hover:text-white/60 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-white/10" />

      {/* Month Pills */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {MONTHS_INFO.map((month) => (
          <button
            key={month.id}
            onClick={() => onMonthChange(month.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-300 ${
              selectedMonth === month.id
                ? 'bg-[#b7916e]/20 text-[#d4c4a8] border border-[#b7916e]/30'
                : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
            }`}
          >
            {month.id}월
          </button>
        ))}
      </div>
    </div>
  );
}
