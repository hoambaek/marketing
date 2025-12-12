'use client';

import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { useMasterPlanStore } from '@/lib/store/masterplan-store';
import { CONTENT_TYPES, ContentType } from '@/lib/types';
import {
  ChevronLeft,
  ChevronRight,
  Instagram,
  Youtube,
  FileText,
  Mail,
  Megaphone,
  Calendar,
  Plus,
} from 'lucide-react';

const CONTENT_ICONS: Record<ContentType, React.ReactNode> = {
  instagram: <Instagram className="w-4 h-4" />,
  youtube: <Youtube className="w-4 h-4" />,
  blog: <FileText className="w-4 h-4" />,
  newsletter: <Mail className="w-4 h-4" />,
  press: <Megaphone className="w-4 h-4" />,
};

const CONTENT_COLORS: Record<ContentType, string> = {
  instagram: 'bg-pink-500/20 text-pink-500 border-pink-500/30',
  youtube: 'bg-red-500/20 text-red-500 border-red-500/30',
  blog: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  newsletter: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
  press: 'bg-violet-500/20 text-violet-500 border-violet-500/30',
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTH_NAMES = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월',
];

export default function CalendarPage() {
  const { contentItems } = useMasterPlanStore();
  const [currentDate, setCurrentDate] = useState(new Date(2025, 0, 1)); // Start at Jan 2025
  const [selectedType, setSelectedType] = useState<ContentType | 'all'>('all');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and total days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const totalDays = lastDayOfMonth.getDate();

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];

    // Empty cells before first day
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(null);
    }

    // Days of the month
    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }

    return days;
  }, [firstDayWeekday, totalDays]);

  // Filter content by month and type
  const filteredContent = useMemo(() => {
    return contentItems.filter((item) => {
      const itemDate = new Date(item.date);
      const monthMatch =
        itemDate.getFullYear() === year && itemDate.getMonth() === month;
      const typeMatch = selectedType === 'all' || item.type === selectedType;
      return monthMatch && typeMatch;
    });
  }, [contentItems, year, month, selectedType]);

  // Get content for a specific day
  const getContentForDay = (day: number) => {
    return filteredContent.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate.getDate() === day;
    });
  };

  // Navigation
  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date(2025, 0, 1)); // Reset to Jan 2025 for demo
  };

  // Count by type for current month
  const typeCounts = useMemo(() => {
    const counts: Record<ContentType | 'all', number> = {
      all: 0,
      instagram: 0,
      youtube: 0,
      blog: 0,
      newsletter: 0,
      press: 0,
    };

    contentItems.forEach((item) => {
      const itemDate = new Date(item.date);
      if (itemDate.getFullYear() === year && itemDate.getMonth() === month) {
        counts.all++;
        counts[item.type]++;
      }
    });

    return counts;
  }, [contentItems, year, month]);

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <section className="px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display text-4xl sm:text-5xl text-foreground mb-2">
              콘텐츠 캘린더
            </h1>
            <p className="text-muted-foreground text-lg mb-6">
              월별 콘텐츠 발행 계획 및 일정 관리
            </p>
          </motion.div>

          {/* Calendar Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="card-luxury p-4 mb-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Month Navigation */}
              <div className="flex items-center gap-4">
                <button
                  onClick={goToPrevMonth}
                  className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                </button>
                <h2 className="font-display text-2xl text-foreground min-w-[140px] text-center">
                  {year}년 {MONTH_NAMES[month]}
                </h2>
                <button
                  onClick={goToNextMonth}
                  className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
                <button
                  onClick={goToToday}
                  className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                >
                  오늘
                </button>
              </div>

              {/* Content Type Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedType('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedType === 'all'
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  전체 ({typeCounts.all})
                </button>
                {(Object.keys(CONTENT_TYPES) as ContentType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                      selectedType === type
                        ? CONTENT_COLORS[type]
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {CONTENT_ICONS[type]}
                    <span className="hidden sm:inline">{CONTENT_TYPES[type]}</span>
                    <span>({typeCounts[type]})</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Calendar Grid */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="card-luxury overflow-hidden"
          >
            {/* Weekday Header */}
            <div className="grid grid-cols-7 border-b border-border/50">
              {WEEKDAYS.map((day, index) => (
                <div
                  key={day}
                  className={`py-3 text-center text-sm font-medium ${
                    index === 0
                      ? 'text-red-400'
                      : index === 6
                      ? 'text-blue-400'
                      : 'text-muted-foreground'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                const dayContent = day ? getContentForDay(day) : [];
                const weekday = index % 7;
                const isToday = day === 1 && month === 0 && year === 2025; // Demo today

                return (
                  <div
                    key={index}
                    className={`min-h-[100px] sm:min-h-[120px] border-b border-r border-border/30 p-2 ${
                      day ? 'bg-background/50' : 'bg-muted/20'
                    } ${weekday === 6 ? 'border-r-0' : ''}`}
                  >
                    {day && (
                      <>
                        {/* Day Number */}
                        <div
                          className={`text-sm mb-1 ${
                            isToday
                              ? 'w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-medium'
                              : weekday === 0
                              ? 'text-red-400'
                              : weekday === 6
                              ? 'text-blue-400'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {day}
                        </div>

                        {/* Content Items */}
                        <div className="space-y-1">
                          {dayContent.slice(0, 3).map((item) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded border truncate cursor-pointer hover:opacity-80 transition-opacity ${
                                CONTENT_COLORS[item.type]
                              }`}
                              title={item.title}
                            >
                              <span className="hidden sm:inline-flex items-center gap-1">
                                {CONTENT_ICONS[item.type]}
                                {item.title}
                              </span>
                              <span className="sm:hidden flex items-center gap-0.5">
                                {CONTENT_ICONS[item.type]}
                              </span>
                            </motion.div>
                          ))}
                          {dayContent.length > 3 && (
                            <div className="text-[10px] text-muted-foreground pl-1">
                              +{dayContent.length - 3}개 더
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Content Summary for Month */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 card-luxury p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-accent" />
              <h3 className="font-display text-xl text-foreground">
                이번 달 콘텐츠 일정
              </h3>
            </div>

            {filteredContent.length > 0 ? (
              <div className="space-y-3">
                {filteredContent
                  .sort(
                    (a, b) =>
                      new Date(a.date).getTime() - new Date(b.date).getTime()
                  )
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className={`p-2 rounded-lg ${CONTENT_COLORS[item.type]}`}
                      >
                        {CONTENT_ICONS[item.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {item.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(item.date).toLocaleDateString('ko-KR', {
                            month: 'long',
                            day: 'numeric',
                            weekday: 'short',
                          })}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          item.status === 'published'
                            ? 'bg-emerald-500/20 text-emerald-500'
                            : item.status === 'scheduled'
                            ? 'bg-blue-500/20 text-blue-500'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {item.status === 'published'
                          ? '발행완료'
                          : item.status === 'scheduled'
                          ? '예약됨'
                          : '초안'}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>이번 달에 예정된 콘텐츠가 없습니다.</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
