/**
 * UAPS 월별/연간 해양 프로파일 집계 유틸리티
 *
 * ocean_data_daily 테이블의 일별 KHOA 실측 데이터를 월별(1~12)로 집계하고,
 * 연간 프로파일(TSI 포함)을 산출하는 순수 함수 모듈.
 *
 * - 14개월치 데이터에서 같은 월이 2회 나올 수 있음 -> 전체 합산 평균
 * - 데이터 없는 월: 인접 월 보간 -> 전체 평균 폴백
 * - null 필드는 해당 필드만 null로 유지 (수온은 보간)
 */

import type { OceanDataDaily } from '@/lib/types';
import { calculateLiveTSI } from '@/lib/utils/uaps-live-coefficients';

// ═══════════════════════════════════════════════════════════════════════════
// 인터페이스
// ═══════════════════════════════════════════════════════════════════════════

export interface MonthlyOceanProfile {
  month: number; // 1~12
  seaTemperatureAvg: number;
  seaTemperatureMin: number;
  seaTemperatureMax: number;
  seaTemperatureStdDev: number;
  salinityAvg: number | null;
  tidalCurrentSpeedAvg: number | null;
  waveHeightAvg: number | null;
  tideLevelRange: number | null; // max - min
  surfacePressureAvg: number | null;
  dataPoints: number;
}

export interface AnnualOceanProfile {
  monthlyProfiles: MonthlyOceanProfile[];
  annualAvgTemp: number;
  annualTempRange: number; // 최고월 평균 - 최저월 평균
  annualAvgCurrentSpeed: number | null;
  tsiScore: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// 내부 헬퍼
// ═══════════════════════════════════════════════════════════════════════════

/** 유효한 숫자인지 검증 */
function isValidNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/** 유효 숫자만 필터 */
function filterValid(arr: (number | null | undefined)[]): number[] {
  return arr.filter((v): v is number => isValidNumber(v));
}

/** 평균 (빈 배열 -> NaN) */
function mean(arr: number[]): number {
  if (arr.length === 0) return NaN;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/** 표준편차 (모집단, N) */
function stddev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

/** 평균 또는 null (유효 값 없으면 null) */
function meanOrNull(values: (number | null | undefined)[]): number | null {
  const valid = filterValid(values);
  if (valid.length === 0) return null;
  return mean(valid);
}

/** date 문자열(yyyy-mm-dd 등)에서 월(1~12) 추출 */
function extractMonth(dateStr: string): number {
  const d = new Date(dateStr);
  return d.getMonth() + 1; // 0-based -> 1-based
}

/** 월 번호 정규화 (1~12 범위) */
function normalizeMonth(month: number): number {
  return ((((month - 1) % 12) + 12) % 12) + 1;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. 월별 해양 프로파일 집계
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 일별 해양 데이터를 월별(1~12)로 그룹핑하여 집계.
 *
 * - 14개월 데이터에서 같은 월이 2회 나올 경우 전체 합산 평균
 * - 데이터 없는 월: 인접 월(앞뒤) 평균으로 보간, 양쪽 다 없으면 전체 평균
 * - 항상 12개 프로파일 반환 (month 1~12)
 */
export function buildMonthlyOceanProfiles(
  dailyData: OceanDataDaily[]
): MonthlyOceanProfile[] {
  // 월별 그룹핑
  const grouped = new Map<number, OceanDataDaily[]>();
  for (let m = 1; m <= 12; m++) {
    grouped.set(m, []);
  }

  for (const day of dailyData) {
    if (!day.date) continue;
    const month = extractMonth(day.date);
    if (month < 1 || month > 12) continue;
    grouped.get(month)!.push(day);
  }

  // 1차: 데이터가 있는 월 집계
  const rawProfiles = new Map<number, MonthlyOceanProfile>();

  for (let m = 1; m <= 12; m++) {
    const days = grouped.get(m)!;
    if (days.length === 0) continue;

    // 수온: 40m 깊이 보정 적용 (DB에는 표층 수온이 저장됨)
    const temps = filterValid(days.map((d) => {
      if (d.seaTemperatureAvg === null) return null;
      return estimateBottomTemperature(d.seaTemperatureAvg, 40, m);
    }));
    const tempMins = filterValid(days.map((d) => {
      if (d.seaTemperatureMin === null) return null;
      return estimateBottomTemperature(d.seaTemperatureMin, 40, m);
    }));
    const tempMaxs = filterValid(days.map((d) => {
      if (d.seaTemperatureMax === null) return null;
      return estimateBottomTemperature(d.seaTemperatureMax, 40, m);
    }));
    const salinities = filterValid(days.map((d) => d.salinity));
    const currents = filterValid(days.map((d) => d.tidalCurrentSpeed));
    const waves = filterValid(days.map((d) => d.waveHeightAvg));
    const pressures = filterValid(days.map((d) => d.surfacePressureAvg));
    const tideMins = filterValid(days.map((d) => d.tideLevelMin));
    const tideMaxs = filterValid(days.map((d) => d.tideLevelMax));

    // 수온: temps가 비어 있으면 min/max에서 시도
    const allTemps = temps.length > 0 ? temps : [...tempMins, ...tempMaxs];

    if (allTemps.length === 0) continue; // 수온 데이터 없으면 스킵 (보간 대상)

    const tideLevelRange =
      tideMins.length > 0 && tideMaxs.length > 0
        ? Math.max(...tideMaxs) - Math.min(...tideMins)
        : null;

    rawProfiles.set(m, {
      month: m,
      seaTemperatureAvg: mean(allTemps),
      seaTemperatureMin: tempMins.length > 0 ? Math.min(...tempMins) : mean(allTemps),
      seaTemperatureMax: tempMaxs.length > 0 ? Math.max(...tempMaxs) : mean(allTemps),
      seaTemperatureStdDev: stddev(allTemps),
      salinityAvg: meanOrNull(salinities),
      tidalCurrentSpeedAvg: meanOrNull(currents),
      waveHeightAvg: meanOrNull(waves),
      tideLevelRange,
      surfacePressureAvg: meanOrNull(pressures),
      dataPoints: days.length,
    });
  }

  // 2차: 전체 평균 (보간 폴백용)
  const allProfiles = Array.from(rawProfiles.values());
  const globalAvgTemp =
    allProfiles.length > 0
      ? mean(allProfiles.map((p) => p.seaTemperatureAvg))
      : 14; // 극단 폴백: 한국 남해 연평균

  const globalProfile: MonthlyOceanProfile = {
    month: 0,
    seaTemperatureAvg: globalAvgTemp,
    seaTemperatureMin: allProfiles.length > 0 ? mean(allProfiles.map((p) => p.seaTemperatureMin)) : globalAvgTemp,
    seaTemperatureMax: allProfiles.length > 0 ? mean(allProfiles.map((p) => p.seaTemperatureMax)) : globalAvgTemp,
    seaTemperatureStdDev: allProfiles.length > 0 ? mean(allProfiles.map((p) => p.seaTemperatureStdDev)) : 0,
    salinityAvg: meanOrNull(allProfiles.map((p) => p.salinityAvg)),
    tidalCurrentSpeedAvg: meanOrNull(allProfiles.map((p) => p.tidalCurrentSpeedAvg)),
    waveHeightAvg: meanOrNull(allProfiles.map((p) => p.waveHeightAvg)),
    tideLevelRange: meanOrNull(allProfiles.map((p) => p.tideLevelRange)),
    surfacePressureAvg: meanOrNull(allProfiles.map((p) => p.surfacePressureAvg)),
    dataPoints: 0,
  };

  // 3차: 빈 월 보간
  const result: MonthlyOceanProfile[] = [];

  for (let m = 1; m <= 12; m++) {
    if (rawProfiles.has(m)) {
      result.push(rawProfiles.get(m)!);
      continue;
    }

    // 인접 월 탐색 (앞뒤)
    const prev = rawProfiles.get(normalizeMonth(m - 1));
    const next = rawProfiles.get(normalizeMonth(m + 1));

    if (prev && next) {
      // 양쪽 평균 보간
      result.push(interpolateProfiles(m, prev, next));
    } else if (prev || next) {
      // 한쪽만 있으면 그 값 복사
      const source = (prev || next)!;
      result.push({ ...source, month: m, dataPoints: 0 });
    } else {
      // 양쪽 다 없으면 전체 평균
      result.push({ ...globalProfile, month: m, dataPoints: 0 });
    }
  }

  return result;
}

/**
 * 두 인접 월 프로파일의 평균으로 보간 프로파일 생성
 */
function interpolateProfiles(
  month: number,
  a: MonthlyOceanProfile,
  b: MonthlyOceanProfile
): MonthlyOceanProfile {
  return {
    month,
    seaTemperatureAvg: (a.seaTemperatureAvg + b.seaTemperatureAvg) / 2,
    seaTemperatureMin: (a.seaTemperatureMin + b.seaTemperatureMin) / 2,
    seaTemperatureMax: (a.seaTemperatureMax + b.seaTemperatureMax) / 2,
    seaTemperatureStdDev: (a.seaTemperatureStdDev + b.seaTemperatureStdDev) / 2,
    salinityAvg: interpolateNullable(a.salinityAvg, b.salinityAvg),
    tidalCurrentSpeedAvg: interpolateNullable(a.tidalCurrentSpeedAvg, b.tidalCurrentSpeedAvg),
    waveHeightAvg: interpolateNullable(a.waveHeightAvg, b.waveHeightAvg),
    tideLevelRange: interpolateNullable(a.tideLevelRange, b.tideLevelRange),
    surfacePressureAvg: interpolateNullable(a.surfacePressureAvg, b.surfacePressureAvg),
    dataPoints: 0,
  };
}

/** nullable 숫자 두 개의 평균 (둘 다 null이면 null) */
function interpolateNullable(a: number | null, b: number | null): number | null {
  if (a !== null && b !== null) return (a + b) / 2;
  return a ?? b;
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. 연간 해양 프로파일
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 12개 월별 프로파일에서 연간 종합 프로파일 산출.
 *
 * - annualAvgTemp: 12개월 seaTemperatureAvg의 평균
 * - annualTempRange: max(monthlyAvg) - min(monthlyAvg)
 * - annualAvgCurrentSpeed: null 제외 평균
 * - tsiScore: calculateLiveTSI(12개월 수온 배열, depth)
 */
export function buildAnnualOceanProfile(
  monthlyProfiles: MonthlyOceanProfile[],
  depth: number = 50
): AnnualOceanProfile {
  if (monthlyProfiles.length === 0) {
    return {
      monthlyProfiles: [],
      annualAvgTemp: 0,
      annualTempRange: 0,
      annualAvgCurrentSpeed: null,
      tsiScore: 0.5,
    };
  }

  const temps = monthlyProfiles.map((p) => p.seaTemperatureAvg);
  const validTemps = filterValid(temps);

  const annualAvgTemp = validTemps.length > 0 ? mean(validTemps) : 0;
  const annualTempRange =
    validTemps.length > 0
      ? Math.max(...validTemps) - Math.min(...validTemps)
      : 0;

  // 조류 유속: null 제외 평균
  const currentSpeeds = filterValid(
    monthlyProfiles.map((p) => p.tidalCurrentSpeedAvg)
  );
  const annualAvgCurrentSpeed =
    currentSpeeds.length > 0 ? mean(currentSpeeds) : null;

  // TSI: 월별 평균이 아닌 "해저 수온의 안정성"을 평가
  // 해저는 표층 대비 변동폭이 작으므로, 40m 보정 후 연간 범위를 표층 연간 범위와 비교
  // TSI = 1 - (보정 후 연간 범위 / 표층 연간 범위)
  // 표층 연간 범위: 약 17°C (7~24°C), 40m: 약 8.5°C → TSI ≈ 0.50
  const surfaceTempRange = 17; // 한국 남해 표층 연간 변동 기준
  const tsiScore = annualTempRange > 0
    ? Math.max(0, Math.min(1, 1 - annualTempRange / surfaceTempRange))
    : 0.5;

  return {
    monthlyProfiles,
    annualAvgTemp,
    annualTempRange,
    annualAvgCurrentSpeed,
    tsiScore,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. 수심별 수온 보정 (SST → 해저 수온)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 월별 40m 수온 보정 비율 (blending ratio).
 *
 * 모델: bottomTemp = SST × ratio + DEEP_BASE × (1 - ratio)
 * - ratio = 1.0: 표층과 동일
 * - ratio = 0.0: 심층 기저 수온과 동일
 *
 * 이 방식은 결과 수온이 연중 단조(monotonic)하게 변화하도록 보장.
 * (기존 MLD + lapse rate 모델은 월별 불연속으로 5월>7월 역전 발생)
 *
 * 한국 남해 완도 해역, KODC/NIFS 관측 기반 추정.
 */
const MONTHLY_DEPTH_RATIO_40M: Record<number, number> = {
  1: 0.92,   // 겨울: 수직 혼합
  2: 0.92,
  3: 0.88,
  4: 0.80,   // 봄: 성층화 시작
  5: 0.70,
  6: 0.58,   // 여름: 열성층 발달
  7: 0.50,
  8: 0.50,   // 최강 열성층 (SST 최고이므로 ratio 동일해도 결과 상승)
  9: 0.50,   // 가을: 위상 지연으로 아직 열성층
  10: 0.55,  // 열성층 약화 중이지만 저층은 아직 따뜻
  11: 0.72,  // 혼합 회복
  12: 0.85,
};

/** 한국 남해 심층 기저 수온 (°C) — 40m 이하에서 연중 안정적 */
const DEEP_BASE_TEMP = 8.0;

/**
 * 수심별 ratio 스케일: 40m 기준에서 깊이에 따라 비율 조정
 */
function adjustRatioForDepth(ratio40m: number, depth: number): number {
  if (depth <= 5) return 1.0;    // 표층: 보정 없음
  if (depth <= 40) {
    // 0~40m: 선형 보간 (1.0 → ratio40m)
    return 1.0 + (ratio40m - 1.0) * (depth / 40);
  }
  // 40~60m: ratio40m에서 추가 감소 (최소 0.3)
  const extraDepth = depth - 40;
  return Math.max(0.3, ratio40m - extraDepth * 0.005);
}

/**
 * 표층 수온(SST)을 해저 수온으로 보정.
 * 한국 남해 완도 해역 기준 (보고서 H03).
 *
 * 모델: bottomTemp = SST × ratio + DEEP_BASE × (1 - ratio)
 * - 겨울(ratio ≈ 0.95): 거의 SST 그대로
 * - 여름(ratio ≈ 0.50): SST와 기저 수온의 중간
 * - 결과: 연중 수온이 자연스럽게 단조 변화 (역전 없음)
 *
 * @param sst    표층 수온 (°C)
 * @param depth  숙성 수심 (m), 양수
 * @param month  달력 월 (1~12)
 * @returns      추정 해저 수온 (°C)
 */
export function estimateBottomTemperature(
  sst: number,
  depth: number,
  month: number,
): number {
  const m = normalizeMonth(month);
  const baseRatio = MONTHLY_DEPTH_RATIO_40M[m] ?? 0.75;
  const ratio = adjustRatioForDepth(baseRatio, depth);

  const bottomTemp = sst * ratio + DEEP_BASE_TEMP * (1 - ratio);
  return Math.round(Math.max(bottomTemp, 3.0) * 100) / 100;
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. 제품 투입일 기반 환경 데이터 필터링 + 수심 보정
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 제품별 환경 통계 산출 결과.
 * seaTemperature는 수심 보정된 값이며, depthCorrected 플래그로 표시.
 */
export interface ProductOceanStats {
  seaTemperature: number | null;     // 수심 보정된 평균 수온
  currentVelocity: number | null;
  waveHeight: number | null;
  wavePeriod: number | null;
  waterPressure: number | null;
  salinity: number | null;
  tidalCurrentSpeed: number | null;
  dataPoints: number;
  periodStart: string;
  periodEnd: string;
  depthCorrected: boolean;           // 수심 보정 적용 여부
  correctionDepth: number;           // 보정 기준 수심
}

/**
 * 제품 투입일부터 현재까지의 해양 데이터를 기반으로 환경 통계 산출.
 *
 * 1. dailyData에서 immersionDate 이후만 필터
 * 2. 각 일의 수온을 estimateBottomTemperature(sst, depth, month)로 보정
 * 3. 보정된 수온 및 기타 필드의 평균 산출
 *
 * @param dailyData      일별 해양 데이터 배열
 * @param immersionDate  제품 투입일 (YYYY-MM-DD)
 * @param depth          숙성 수심 (m)
 * @returns              제품별 환경 통계 (수심 보정 수온 포함)
 */
export function calculateProductOceanStats(
  dailyData: OceanDataDaily[],
  immersionDate: string,
  depth: number,
): ProductOceanStats {
  // immersionDate 이후 데이터만 필터
  const filtered = dailyData.filter((d) => d.date >= immersionDate);

  if (filtered.length === 0) {
    return {
      seaTemperature: null,
      currentVelocity: null,
      waveHeight: null,
      wavePeriod: null,
      waterPressure: null,
      salinity: null,
      tidalCurrentSpeed: null,
      dataPoints: 0,
      periodStart: immersionDate,
      periodEnd: immersionDate,
      depthCorrected: depth > 0,
      correctionDepth: depth,
    };
  }

  // 수심 보정 수온 계산
  const correctedTemps: number[] = [];
  for (const day of filtered) {
    const sst = day.seaTemperatureAvg;
    if (!isValidNumber(sst)) continue;
    const month = extractMonth(day.date);
    const bottomTemp = estimateBottomTemperature(sst, depth, month);
    correctedTemps.push(bottomTemp);
  }

  // 기타 필드 수집
  const velocities = filterValid(filtered.map((d) => d.currentVelocityAvg));
  const waveHeights = filterValid(filtered.map((d) => d.waveHeightAvg));
  const wavePeriods = filterValid(filtered.map((d) => d.wavePeriodAvg));
  const pressures = filterValid(filtered.map((d) => d.surfacePressureAvg));
  const salinities = filterValid(filtered.map((d) => d.salinity));
  const tidalSpeeds = filterValid(filtered.map((d) => d.tidalCurrentSpeed));

  // 수압: 수심 기반 계산 (1 atm + depth/10.3)
  const waterPressure = depth > 0 ? Math.round((1 + depth / 10.3) * 100) / 100 : null;

  // 날짜 범위
  const dates = filtered.map((d) => d.date).sort();

  return {
    seaTemperature: correctedTemps.length > 0
      ? Math.round(mean(correctedTemps) * 100) / 100
      : null,
    currentVelocity: velocities.length > 0
      ? Math.round(mean(velocities) * 1000) / 1000
      : null,
    waveHeight: waveHeights.length > 0
      ? Math.round(mean(waveHeights) * 100) / 100
      : null,
    wavePeriod: wavePeriods.length > 0
      ? Math.round(mean(wavePeriods) * 100) / 100
      : null,
    waterPressure,
    salinity: salinities.length > 0
      ? Math.round(mean(salinities) * 100) / 100
      : null,
    tidalCurrentSpeed: tidalSpeeds.length > 0
      ? Math.round(mean(tidalSpeeds) * 100) / 100
      : null,
    dataPoints: filtered.length,
    periodStart: dates[0],
    periodEnd: dates[dates.length - 1],
    depthCorrected: depth > 0,
    correctionDepth: depth,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. 헬퍼
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 특정 월의 프로파일 반환.
 *
 * month가 1~12 범위가 아니면 정규화하여 탐색.
 * 프로파일이 비어 있거나 해당 월이 없으면 undefined 대신 기본값 반환.
 */
export function getMonthlyProfile(
  profiles: MonthlyOceanProfile[],
  month: number
): MonthlyOceanProfile {
  const normalized = normalizeMonth(month);
  const found = profiles.find((p) => p.month === normalized);

  if (found) return found;

  // 폴백: 빈 프로파일
  return {
    month: normalized,
    seaTemperatureAvg: 14, // 한국 남해 연평균
    seaTemperatureMin: 14,
    seaTemperatureMax: 14,
    seaTemperatureStdDev: 0,
    salinityAvg: null,
    tidalCurrentSpeedAvg: null,
    waveHeightAvg: null,
    tideLevelRange: null,
    surfacePressureAvg: null,
    dataPoints: 0,
  };
}
