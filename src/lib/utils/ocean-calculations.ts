import { DEFAULT_AGING_DEPTH } from '@/lib/types';

/**
 * Calculate water pressure at a given depth
 * Formula: P = P_atm + (ρ * g * h)
 * Simplified: approximately 1 atmosphere per 10 meters of depth
 *
 * @param depth - Depth in meters
 * @param surfacePressure - Surface atmospheric pressure in hPa (optional)
 * @returns Water pressure in atmospheres (atm)
 */
export function calculateWaterPressure(
  depth: number = DEFAULT_AGING_DEPTH,
  surfacePressure?: number
): number {
  // Sea water density: ~1025 kg/m³
  // Gravity: 9.81 m/s²
  // 1 atm = 101325 Pa

  // Surface pressure in atmospheres (1013.25 hPa = 1 atm)
  const surfacePressureAtm = surfacePressure
    ? surfacePressure / 1013.25
    : 1;

  // Pressure increase per meter: (1025 * 9.81) / 101325 ≈ 0.0993 atm/m
  // Simplified: ~0.1 atm per meter, or 1 atm per 10 meters
  const pressurePerMeter = 0.0993;

  const depthPressure = depth * pressurePerMeter;
  const totalPressure = surfacePressureAtm + depthPressure;

  return Math.round(totalPressure * 100) / 100;
}

/**
 * Calculate daily averages from hourly data
 */
export function calculateDailyAverages(hourlyData: (number | null)[]): {
  avg: number | null;
  min: number | null;
  max: number | null;
} {
  const validData = hourlyData.filter((v): v is number => v !== null && !isNaN(v));

  if (validData.length === 0) {
    return { avg: null, min: null, max: null };
  }

  const avg = validData.reduce((a, b) => a + b, 0) / validData.length;
  const min = Math.min(...validData);
  const max = Math.max(...validData);

  return {
    avg: Math.round(avg * 100) / 100,
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
  };
}

/**
 * Calculate dominant direction from hourly direction data
 * Uses circular mean for direction averaging
 */
export function calculateDominantDirection(directions: (number | null)[]): number | null {
  const validDirections = directions.filter((v): v is number => v !== null && !isNaN(v));

  if (validDirections.length === 0) return null;

  // Convert to radians and calculate circular mean
  let sinSum = 0;
  let cosSum = 0;

  for (const dir of validDirections) {
    const rad = (dir * Math.PI) / 180;
    sinSum += Math.sin(rad);
    cosSum += Math.cos(rad);
  }

  const avgRad = Math.atan2(sinSum / validDirections.length, cosSum / validDirections.length);
  let avgDeg = (avgRad * 180) / Math.PI;

  // Normalize to 0-360
  if (avgDeg < 0) avgDeg += 360;

  return Math.round(avgDeg);
}

/**
 * Get direction label in Korean
 */
export function getDirectionLabel(degrees: number | null): string {
  if (degrees === null) return '-';

  const directions = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'];
  const index = Math.round(((degrees % 360) / 45)) % 8;
  return directions[index];
}

/**
 * Format date to Korean locale string
 */
export function formatDateKR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format time to Korean locale string
 */
export function formatTimeKR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get date range for different view types
 */
export function getDateRange(view: 'daily' | 'monthly' | 'full_cycle'): {
  startDate: string;
  endDate: string;
} {
  const now = new Date();
  const endDate = now.toISOString().split('T')[0];

  let startDate: string;

  switch (view) {
    case 'daily':
      // Last 7 days
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      startDate = weekAgo.toISOString().split('T')[0];
      break;
    case 'monthly':
      // Last 30 days
      const monthAgo = new Date(now);
      monthAgo.setDate(monthAgo.getDate() - 30);
      startDate = monthAgo.toISOString().split('T')[0];
      break;
    case 'full_cycle':
      // Last 90 days (typical aging cycle)
      const cycleAgo = new Date(now);
      cycleAgo.setDate(cycleAgo.getDate() - 90);
      startDate = cycleAgo.toISOString().split('T')[0];
      break;
    default:
      startDate = endDate;
  }

  return { startDate, endDate };
}

/**
 * Group hourly data by date
 */
export function groupHourlyByDate<T extends { time: string }>(
  hourlyData: T[]
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  for (const item of hourlyData) {
    const date = item.time.split('T')[0];
    const existing = grouped.get(date) || [];
    existing.push(item);
    grouped.set(date, existing);
  }

  return grouped;
}

/**
 * Get aging status based on elapsed days
 */
export function getAgingStatus(startDate: Date, currentDate: Date = new Date()): {
  days: number;
  weeks: number;
  months: number;
  status: '초기' | '중기' | '후기' | '완료';
  progress: number;
} {
  const diffTime = Math.abs(currentDate.getTime() - startDate.getTime());
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  // Typical aging cycle: 90 days
  const cycleDays = 90;
  const progress = Math.min(100, Math.round((days / cycleDays) * 100));

  let status: '초기' | '중기' | '후기' | '완료';
  if (days < 30) {
    status = '초기';
  } else if (days < 60) {
    status = '중기';
  } else if (days < 90) {
    status = '후기';
  } else {
    status = '완료';
  }

  return { days, weeks, months, status, progress };
}
