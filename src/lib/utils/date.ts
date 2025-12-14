// ═══════════════════════════════════════════════════════════════════════════
// 날짜 관련 유틸리티 함수
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 특정 년/월의 주차별 날짜 범위를 계산
 * @param year 년도
 * @param month 월 (1-12)
 * @param week 주차 (1-4)
 * @returns { startDate: Date, endDate: Date, startDay: number, endDay: number }
 */
export function getWeekDateRange(year: number, month: number, week: number): {
  startDate: Date;
  endDate: Date;
  startDay: number;
  endDay: number;
} {
  // 해당 월의 첫째 날과 마지막 날
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);
  const totalDays = lastDayOfMonth.getDate();

  // 주차별 날짜 범위 계산 (대략 7일씩)
  let startDay: number;
  let endDay: number;

  switch (week) {
    case 1:
      startDay = 1;
      endDay = 7;
      break;
    case 2:
      startDay = 8;
      endDay = 14;
      break;
    case 3:
      startDay = 15;
      endDay = 21;
      break;
    case 4:
      startDay = 22;
      endDay = totalDays; // 마지막 주는 월말까지
      break;
    default:
      startDay = 1;
      endDay = 7;
  }

  const startDate = new Date(year, month - 1, startDay);
  const endDate = new Date(year, month - 1, endDay);

  return { startDate, endDate, startDay, endDay };
}

/**
 * 날짜 범위를 포맷팅된 문자열로 반환
 * @param year 년도
 * @param month 월 (1-12)
 * @param week 주차 (1-4)
 * @returns "1일 - 7일" 형식의 문자열
 */
export function formatWeekDateRange(year: number, month: number, week: number): string {
  const { startDay, endDay } = getWeekDateRange(year, month, week);
  return `${startDay}일 - ${endDay}일`;
}

/**
 * 날짜 범위를 상세 포맷으로 반환
 * @param year 년도
 * @param month 월 (1-12)
 * @param week 주차 (1-4)
 * @returns "1월 1일 - 1월 7일" 형식의 문자열
 */
export function formatWeekDateRangeFull(year: number, month: number, week: number): string {
  const { startDay, endDay } = getWeekDateRange(year, month, week);
  return `${month}월 ${startDay}일 - ${month}월 ${endDay}일`;
}

/**
 * Date 객체를 "M월 D일" 형식으로 포맷
 */
export function formatDateKorean(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}월 ${day}일`;
}

/**
 * Date 객체를 "YYYY.MM.DD" 형식으로 포맷
 */
export function formatDateDot(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

/**
 * Date 객체를 "M/D" 형식으로 포맷
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}/${day}`;
}

/**
 * 오늘 날짜가 특정 주차에 속하는지 확인
 */
export function isCurrentWeek(year: number, month: number, week: number): boolean {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  if (currentYear !== year || currentMonth !== month) return false;

  const { startDay, endDay } = getWeekDateRange(year, month, week);
  const currentDay = today.getDate();

  return currentDay >= startDay && currentDay <= endDay;
}

/**
 * D-Day 계산 (마감일까지 남은 일수)
 * @param dueDate 마감일
 * @returns 남은 일수 (음수면 지남, 0이면 오늘)
 */
export function getDaysUntil(dueDate: Date | string): number {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const today = new Date();

  // 시간 제거하고 날짜만 비교
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * D-Day 포맷팅
 * @param dueDate 마감일
 * @returns "D-3", "D-Day", "D+2" 형식
 */
export function formatDDay(dueDate: Date | string): string {
  const days = getDaysUntil(dueDate);

  if (days === 0) return 'D-Day';
  if (days > 0) return `D-${days}`;
  return `D+${Math.abs(days)}`;
}

/**
 * D-Day에 따른 색상 클래스 반환
 */
export function getDDayColorClass(dueDate: Date | string): {
  bg: string;
  text: string;
  border: string;
} {
  const days = getDaysUntil(dueDate);

  if (days < 0) {
    // 지남 - 빨간색
    return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' };
  }
  if (days === 0) {
    // 오늘 - 주황색
    return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' };
  }
  if (days <= 3) {
    // 3일 이내 - 노란색
    return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' };
  }
  if (days <= 7) {
    // 1주일 이내 - 파란색
    return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' };
  }
  // 여유 - 회색
  return { bg: 'bg-white/5', text: 'text-white/40', border: 'border-white/10' };
}

/**
 * 특정 날짜가 어느 주차에 속하는지 계산
 */
export function getWeekOfMonth(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDate();

  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}
