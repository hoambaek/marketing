'use client';

import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { useMasterPlanStore } from '@/lib/store/masterplan-store';
import { ContentItem, CONTENT_TYPES, ContentType, AVAILABLE_YEARS } from '@/lib/types';
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
  CalendarDays,
} from 'lucide-react';
import ContentModal from '@/components/ContentModal';

const CONTENT_ICONS: Record<ContentType, React.ReactNode> = {
  instagram: <Instagram className="w-4 h-4" />,
  youtube: <Youtube className="w-4 h-4" />,
  blog: <FileText className="w-4 h-4" />,
  newsletter: <Mail className="w-4 h-4" />,
  press: <Megaphone className="w-4 h-4" />,
};

const CONTENT_COLORS: Record<ContentType, string> = {
  instagram: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  youtube: 'bg-red-500/20 text-red-400 border-red-500/30',
  blog: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  newsletter: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  press: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTH_NAMES = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월',
];

export default function CalendarPage() {
  const { contentItems, addContent, updateContent, deleteContent } = useMasterPlanStore();
  // Start with current year/month
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedType, setSelectedType] = useState<ContentType | 'all'>('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

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
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(null);
    }
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
  const goToPrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date()); // Go to actual today

  // Check if a day is today
  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  // CRUD handlers
  const handleAddContent = (day?: number) => {
    const dateStr = day
      ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      : `${year}-${String(month + 1).padStart(2, '0')}-01`;
    setSelectedDate(dateStr);
    setEditingContent(null);
    setIsModalOpen(true);
  };

  const handleEditContent = (content: ContentItem) => {
    setEditingContent(content);
    setSelectedDate(content.date);
    setIsModalOpen(true);
  };

  const handleSaveContent = async (contentData: Omit<ContentItem, 'id'>) => {
    if (editingContent) {
      await updateContent(editingContent.id, contentData);
    } else {
      await addContent(contentData);
    }
  };

  const handleDeleteContent = async (id: string) => {
    await deleteContent(id);
  };

  // Count by type for current month
  const typeCounts = useMemo(() => {
    const counts: Record<ContentType | 'all', number> = {
      all: 0, instagram: 0, youtube: 0, blog: 0, newsletter: 0, press: 0,
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0d1525] to-[#0a0f1a]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(236, 72, 153, 0.10), transparent),
                              radial-gradient(ellipse 60% 40% at 80% 60%, rgba(183, 145, 110, 0.08), transparent),
                              radial-gradient(ellipse 50% 30% at 20% 80%, rgba(139, 92, 246, 0.06), transparent)`
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
          }}
        />
      </div>

      {/* Hero Section - Compact on Mobile */}
      <section className="relative pt-8 sm:pt-16 pb-6 sm:pb-12 px-4 sm:px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.2, delay: 0.3 }}
              className="hidden sm:block absolute -left-6 top-1/2 w-16 h-px bg-gradient-to-r from-[#b7916e] to-transparent origin-left"
            />

            <div className="sm:pl-14">
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-[#b7916e] text-[10px] sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-2 sm:mb-4 font-light"
              >
                Publishing Schedule
              </motion.p>

              <h1
                className="text-3xl sm:text-5xl lg:text-6xl text-white/95 mb-2 sm:mb-6 leading-[1.1] tracking-tight"
                style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
              >
                <span className="sm:block inline">Content </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b7916e] via-[#d4c4a8] to-[#b7916e]">
                  Calendar
                </span>
              </h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="hidden sm:block text-white/40 text-lg max-w-md font-light leading-relaxed"
              >
                월별 콘텐츠 발행 계획 및 일정 관리
              </motion.p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Year Selection - Compact */}
      <section className="relative py-2 sm:py-4 px-4 sm:px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.85 }}
            className="flex items-center gap-2 sm:gap-4"
          >
            <span className="text-white/30 text-[10px] sm:text-xs tracking-[0.2em] uppercase">연도</span>
            <div className="flex items-center gap-1 sm:gap-2">
              {AVAILABLE_YEARS.map((y) => (
                <button
                  key={y}
                  onClick={() => setCurrentDate(new Date(y, month, 1))}
                  className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    year === y
                      ? 'bg-[#b7916e] text-white'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
                  }`}
                  style={{ fontFamily: "var(--font-cormorant), serif" }}
                >
                  {y}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Calendar Navigation */}
      <section className="relative py-8 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="relative rounded-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
            <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />

            <div className="relative p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                {/* Month Navigation - Compact on mobile */}
                <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={goToPrevMonth}
                      className="p-2 sm:p-2.5 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/[0.04] active:bg-white/[0.08] transition-all"
                    >
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <h2
                      className="text-lg sm:text-2xl text-white/90 min-w-[100px] sm:min-w-[160px] text-center"
                      style={{ fontFamily: "var(--font-cormorant), serif" }}
                    >
                      {year}년 {MONTH_NAMES[month]}
                    </h2>
                    <button
                      onClick={goToNextMonth}
                      className="p-2 sm:p-2.5 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/[0.04] active:bg-white/[0.08] transition-all"
                    >
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                  <button
                    onClick={goToToday}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-[#b7916e] bg-[#b7916e]/10 hover:bg-[#b7916e]/20 active:bg-[#b7916e]/30 rounded-lg sm:rounded-xl transition-all font-medium"
                  >
                    오늘
                  </button>
                </div>

                {/* Content Type Filter - scrollable on mobile */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
                  <button
                    onClick={() => setSelectedType('all')}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                      selectedType === 'all'
                        ? 'bg-[#b7916e] text-white'
                        : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] active:bg-white/[0.12]'
                    }`}
                  >
                    전체 ({typeCounts.all})
                  </button>
                  {(Object.keys(CONTENT_TYPES) as ContentType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-1.5 whitespace-nowrap flex-shrink-0 ${
                        selectedType === type
                          ? CONTENT_COLORS[type]
                          : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] active:bg-white/[0.12]'
                      }`}
                    >
                      {CONTENT_ICONS[type]}
                      <span className="hidden sm:inline">{CONTENT_TYPES[type]}</span>
                      <span>({typeCounts[type]})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Calendar Grid */}
      <section className="relative py-8 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="flex items-center justify-between gap-3 mb-8"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-px bg-white/20" />
              <span className="text-white/30 text-xs tracking-[0.2em] uppercase">Monthly View</span>
            </div>
            <button
              onClick={() => handleAddContent()}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-[#b7916e] bg-[#b7916e]/10 hover:bg-[#b7916e]/20 active:bg-[#b7916e]/30 rounded-lg sm:rounded-xl transition-all font-medium"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">일정 추가</span>
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="relative rounded-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
            <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />

            {/* Weekday Header */}
            <div className="relative grid grid-cols-7 border-b border-white/[0.06]">
              {WEEKDAYS.map((day, index) => (
                <div
                  key={day}
                  className={`py-2 sm:py-4 text-center text-xs sm:text-sm font-medium ${
                    index === 0
                      ? 'text-red-400/70'
                      : index === 6
                      ? 'text-blue-400/70'
                      : 'text-white/40'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="relative grid grid-cols-7">
              {calendarDays.map((day, index) => {
                const dayContent = day ? getContentForDay(day) : [];
                const weekday = index % 7;
                const isTodayCell = day ? isToday(day) : false;

                return (
                  <div
                    key={index}
                    onClick={() => day && handleAddContent(day)}
                    className={`min-h-[60px] sm:min-h-[100px] lg:min-h-[120px] border-b border-r border-white/[0.04] p-1 sm:p-2 group transition-colors cursor-pointer ${
                      day ? 'hover:bg-white/[0.02] active:bg-white/[0.04]' : 'bg-white/[0.01]'
                    } ${weekday === 6 ? 'border-r-0' : ''} ${isTodayCell ? 'bg-[#b7916e]/5' : ''}`}
                  >
                    {day && (
                      <>
                        <div className="mb-0.5 sm:mb-1">
                          <div
                            className={`text-xs sm:text-sm ${
                              isTodayCell
                                ? 'w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#b7916e] text-white flex items-center justify-center font-medium text-[10px] sm:text-sm'
                                : weekday === 0
                                ? 'text-red-400/70'
                                : weekday === 6
                                ? 'text-blue-400/70'
                                : 'text-white/40'
                            }`}
                          >
                            {day}
                          </div>
                        </div>

                        <div className="space-y-0.5 sm:space-y-1">
                          {/* Show 2 items on mobile, 3 on desktop */}
                          {dayContent.slice(0, 2).map((item) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              onClick={(e) => { e.stopPropagation(); handleEditContent(item); }}
                              className={`text-[9px] sm:text-[10px] lg:text-xs px-1 sm:px-1.5 py-0.5 rounded border truncate cursor-pointer hover:opacity-80 active:opacity-60 transition-opacity ${
                                CONTENT_COLORS[item.type]
                              }`}
                              title={item.title}
                            >
                              <span className="hidden lg:inline-flex items-center gap-1">
                                {CONTENT_ICONS[item.type]}
                                {item.title}
                              </span>
                              <span className="lg:hidden flex items-center gap-0.5">
                                {CONTENT_ICONS[item.type]}
                                <span className="hidden sm:inline truncate max-w-[60px]">{item.title}</span>
                              </span>
                            </motion.div>
                          ))}
                          {/* Third item only on larger screens */}
                          {dayContent[2] && (
                            <motion.div
                              key={dayContent[2].id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              onClick={(e) => { e.stopPropagation(); handleEditContent(dayContent[2]); }}
                              className={`hidden sm:block text-[10px] lg:text-xs px-1.5 py-0.5 rounded border truncate cursor-pointer hover:opacity-80 transition-opacity ${
                                CONTENT_COLORS[dayContent[2].type]
                              }`}
                              title={dayContent[2].title}
                            >
                              <span className="hidden lg:inline-flex items-center gap-1">
                                {CONTENT_ICONS[dayContent[2].type]}
                                {dayContent[2].title}
                              </span>
                              <span className="lg:hidden flex items-center gap-0.5">
                                {CONTENT_ICONS[dayContent[2].type]}
                                <span className="truncate max-w-[60px]">{dayContent[2].title}</span>
                              </span>
                            </motion.div>
                          )}
                          {dayContent.length > 2 && (
                            <div className="text-[8px] sm:text-[10px] text-white/30 pl-0.5 sm:pl-1">
                              <span className="sm:hidden">+{dayContent.length - 2}개</span>
                              <span className="hidden sm:inline">{dayContent.length > 3 ? `+${dayContent.length - 3}개` : ''}</span>
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
            transition={{ duration: 0.5, delay: 1.2 }}
            className="mt-8 relative rounded-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
            <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />

            <div className="relative p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#b7916e]" />
                  <h3
                    className="text-xl text-white/90"
                    style={{ fontFamily: "var(--font-cormorant), serif" }}
                  >
                    이번 달 콘텐츠 일정
                  </h3>
                </div>
                <button
                  onClick={() => handleAddContent()}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[#b7916e] hover:bg-[#b7916e]/10 rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  추가
                </button>
              </div>

              {filteredContent.length > 0 ? (
                <div className="space-y-3">
                  {filteredContent
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleEditContent(item)}
                        className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer"
                      >
                        <div className={`p-2.5 rounded-lg flex-shrink-0 ${CONTENT_COLORS[item.type]}`}>
                          {CONTENT_ICONS[item.type]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-white/80">{item.title}</p>
                              <p className="text-sm text-white/40">
                                {new Date(item.date).toLocaleDateString('ko-KR', {
                                  month: 'long',
                                  day: 'numeric',
                                  weekday: 'short',
                                })}
                              </p>
                              {item.description && (
                                <p className="text-sm text-white/50 mt-2 line-clamp-2">{item.description}</p>
                              )}
                            </div>
                            <span
                              className={`px-3 py-1 rounded-lg text-xs font-medium flex-shrink-0 ${
                                item.status === 'published'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : item.status === 'scheduled'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-white/[0.06] text-white/40'
                              }`}
                            >
                              {item.status === 'published'
                                ? '발행완료'
                                : item.status === 'scheduled'
                                ? '예약됨'
                                : '초안'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CalendarDays className="w-12 h-12 mx-auto mb-4 text-white/10" />
                  <p className="text-white/30 mb-6">이번 달에 예정된 콘텐츠가 없습니다.</p>
                  <button
                    onClick={() => handleAddContent()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#b7916e]/10 text-[#b7916e] hover:bg-[#b7916e]/20 transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    첫 콘텐츠 추가하기
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bottom Decoration */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 1.5 }}
        className="relative py-20 px-6"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <span
            className="text-white/10 text-sm tracking-[0.3em] uppercase"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          >
            Muse de Marée
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </motion.div>

      {/* Content Modal */}
      <ContentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveContent}
        onDelete={handleDeleteContent}
        content={editingContent}
        defaultDate={selectedDate}
      />
    </div>
  );
}
