/**
 * Open-Meteo API 공통 유틸리티
 *
 * Cron, 백필, 기존 API 라우트에서 공유하는 해양 데이터 fetch/집계 로직
 */

import {
  WANDO_COORDINATES,
  DEFAULT_AGING_DEPTH,
  OceanDataHourly,
  OceanDataDaily,
} from '@/lib/types';
import {
  calculateDailyAverages,
  calculateDominantDirection,
} from '@/lib/utils/ocean-calculations';
import {
  fetchKhoaRecentData,
  fetchKhoaBuoyData,
  aggregateKhoaDaily,
  getTodayTidalCurrentForecast,
  type KhoaObservationItem,
} from '@/lib/utils/khoa-api';

// Open-Meteo API 엔드포인트
const MARINE_API_URL = 'https://marine-api.open-meteo.com/v1/marine';
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

// Open-Meteo 과거 데이터 API (historical archive)
const WEATHER_HISTORICAL_API_URL = 'https://archive-api.open-meteo.com/v1/archive';

/**
 * Open-Meteo에서 결합된 해양+기상 원시 데이터 fetch
 */
export async function fetchOpenMeteoRawData(
  startDate: string,
  endDate: string,
  options?: { marineModel?: string }
): Promise<{ marine: Record<string, unknown>; weather: Record<string, unknown> }> {
  const { latitude, longitude } = WANDO_COORDINATES;

  // 과거 데이터 여부 판단 (7일 이전이면 archive API 사용)
  const now = new Date();
  const start = new Date(startDate);
  const daysDiff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const useArchiveWeather = daysDiff > 7;

  const marineParams = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    hourly: [
      'wave_height',
      'wave_direction',
      'wave_period',
      'ocean_current_velocity',
      'ocean_current_direction',
      'sea_surface_temperature',
    ].join(','),
    start_date: startDate,
    end_date: endDate,
    timezone: 'Asia/Seoul',
  });

  // ERA5-Ocean 모델은 1940~현재-5일 범위만 지원 → 백필 전용
  if (options?.marineModel) {
    marineParams.set('models', options.marineModel);
  }

  const weatherApiUrl = useArchiveWeather ? WEATHER_HISTORICAL_API_URL : WEATHER_API_URL;
  const weatherParams = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    hourly: [
      'surface_pressure',
      'temperature_2m',
      'relative_humidity_2m',
    ].join(','),
    start_date: startDate,
    end_date: endDate,
    timezone: 'Asia/Seoul',
  });

  const [marineResponse, weatherResponse] = await Promise.all([
    fetch(`${MARINE_API_URL}?${marineParams.toString()}`),
    fetch(`${weatherApiUrl}?${weatherParams.toString()}`),
  ]);

  if (!marineResponse.ok) {
    const errorText = await marineResponse.text();
    throw new Error(`Marine API 오류 (${marineResponse.status}): ${errorText}`);
  }

  if (!weatherResponse.ok) {
    const errorText = await weatherResponse.text();
    throw new Error(`Weather API 오류 (${weatherResponse.status}): ${errorText}`);
  }

  const [marineData, weatherData] = await Promise.all([
    marineResponse.json(),
    weatherResponse.json(),
  ]);

  return { marine: marineData, weather: weatherData };
}

/**
 * Open-Meteo 원시 데이터를 결합된 API 응답 형태로 변환 (기존 API와 호환)
 */
export function formatCombinedResponse(
  marine: Record<string, unknown>,
  weather: Record<string, unknown>
) {
  const marineHourly = (marine as { hourly?: Record<string, unknown[]> }).hourly;
  const weatherHourly = (weather as { hourly?: Record<string, unknown[]> }).hourly;

  return {
    location: WANDO_COORDINATES,
    timezone: 'Asia/Seoul',
    marine: {
      hourly: {
        time: marineHourly?.time || [],
        wave_height: marineHourly?.wave_height || [],
        wave_direction: marineHourly?.wave_direction || [],
        wave_period: marineHourly?.wave_period || [],
        ocean_current_velocity: marineHourly?.ocean_current_velocity || [],
        ocean_current_direction: marineHourly?.ocean_current_direction || [],
        sea_surface_temperature: marineHourly?.sea_surface_temperature || [],
      },
    },
    weather: {
      hourly: {
        time: weatherHourly?.time || [],
        surface_pressure: weatherHourly?.surface_pressure || [],
        temperature_2m: weatherHourly?.temperature_2m || [],
        relative_humidity_2m: weatherHourly?.relative_humidity_2m || [],
      },
    },
  };
}

/**
 * Open-Meteo 원시 데이터에서 시간별 OceanDataHourly 배열 추출
 */
export function extractHourlyData(
  marine: Record<string, unknown>,
  weather: Record<string, unknown>
): OceanDataHourly[] {
  const marineHourly = (marine as { hourly?: Record<string, (number | null)[] | string[]> }).hourly;
  const weatherHourly = (weather as { hourly?: Record<string, (number | null)[] | string[]> }).hourly;

  if (!marineHourly?.time) return [];

  const timeArray = marineHourly.time as string[];
  const hourlyData: OceanDataHourly[] = [];

  for (let i = 0; i < timeArray.length; i++) {
    hourlyData.push({
      time: timeArray[i],
      seaTemperature: (marineHourly.sea_surface_temperature as (number | null)[])?.[i] ?? null,
      currentVelocity: (marineHourly.ocean_current_velocity as (number | null)[])?.[i] ?? null,
      currentDirection: (marineHourly.ocean_current_direction as (number | null)[])?.[i] ?? null,
      waveHeight: (marineHourly.wave_height as (number | null)[])?.[i] ?? null,
      waveDirection: (marineHourly.wave_direction as (number | null)[])?.[i] ?? null,
      wavePeriod: (marineHourly.wave_period as (number | null)[])?.[i] ?? null,
      surfacePressure: (weatherHourly?.surface_pressure as (number | null)[])?.[i] ?? null,
      airTemperature: (weatherHourly?.temperature_2m as (number | null)[])?.[i] ?? null,
      humidity: (weatherHourly?.relative_humidity_2m as (number | null)[])?.[i] ?? null,
    });
  }

  return hourlyData;
}

/**
 * 시간별 데이터를 일별 OceanDataDaily 배열로 집계
 */
export function processHourlyToDailyData(
  hourlyData: OceanDataHourly[],
  agingDepth: number = DEFAULT_AGING_DEPTH
): Omit<OceanDataDaily, 'id' | 'createdAt' | 'updatedAt' | 'salinity'>[] {
  const dailyMap = new Map<string, OceanDataHourly[]>();

  for (const item of hourlyData) {
    const date = item.time.split('T')[0];
    const existing = dailyMap.get(date) || [];
    existing.push(item);
    dailyMap.set(date, existing);
  }

  const dailyData: Omit<OceanDataDaily, 'id' | 'createdAt' | 'updatedAt' | 'salinity'>[] = [];

  dailyMap.forEach((hours, date) => {
    // 단일 루프로 7개 필드 동시 추출 (js-combine-iterations)
    const seaTemps: (number | null)[] = [];
    const velocities: (number | null)[] = [];
    const directions: (number | null)[] = [];
    const waveHeights: (number | null)[] = [];
    const wavePeriods: (number | null)[] = [];
    const pressures: (number | null)[] = [];
    const airTemps: (number | null)[] = [];
    const humidities: (number | null)[] = [];

    for (const h of hours) {
      seaTemps.push(h.seaTemperature);
      velocities.push(h.currentVelocity);
      directions.push(h.currentDirection);
      waveHeights.push(h.waveHeight);
      wavePeriods.push(h.wavePeriod);
      pressures.push(h.surfacePressure);
      airTemps.push(h.airTemperature);
      humidities.push(h.humidity);
    }

    const tempStats = calculateDailyAverages(seaTemps);
    const velocityStats = calculateDailyAverages(velocities);
    const waveStats = calculateDailyAverages(waveHeights);
    const wavePeriodStats = calculateDailyAverages(wavePeriods);
    const pressureStats = calculateDailyAverages(pressures);
    const airTempStats = calculateDailyAverages(airTemps);
    const humidityStats = calculateDailyAverages(humidities);

    dailyData.push({
      date,
      seaTemperatureAvg: tempStats.avg,
      seaTemperatureMin: tempStats.min,
      seaTemperatureMax: tempStats.max,
      currentVelocityAvg: velocityStats.avg,
      currentDirectionDominant: calculateDominantDirection(directions),
      waveHeightAvg: waveStats.avg,
      waveHeightMax: waveStats.max,
      wavePeriodAvg: wavePeriodStats.avg,
      surfacePressureAvg: pressureStats.avg,
      airTemperatureAvg: airTempStats.avg,
      humidityAvg: humidityStats.avg,
      tideLevelAvg: null,
      tideLevelMin: null,
      tideLevelMax: null,
      tidalCurrentSpeed: null,
      tidalCurrentDirection: null,
      dataSource: 'open-meteo',
      depth: agingDepth,
    });
  });

  return dailyData.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * KHOA 실측 데이터로 일별 데이터 보강 (염분, 수온, 조위, 조류 보정)
 * Open-Meteo 데이터에 KHOA 실측값을 병합
 */
export async function enrichWithKhoaData(
  dailyData: Omit<OceanDataDaily, 'id' | 'createdAt' | 'updatedAt'>[],
  reqDate?: string
): Promise<Omit<OceanDataDaily, 'id' | 'createdAt' | 'updatedAt'>[]> {
  try {
    // KHOA 최신관측 + 조류예보 동시 호출
    const [items, tidalForecast] = await Promise.all([
      fetchKhoaRecentData({ reqDate, min: 60 }),
      getTodayTidalCurrentForecast().catch(() => null),
    ]);

    if (items.length === 0 && !tidalForecast) return dailyData;

    const khoaDaily = items.length > 0 ? aggregateKhoaDaily(items) : [];
    const khoaMap = new Map(khoaDaily.map(d => [d.date, d]));

    // 오늘 날짜 (KST) — 조류예보 매칭용
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const todayStr = kst.toISOString().split('T')[0];

    return dailyData.map(day => {
      const khoa = khoaMap.get(day.date);
      const isToday = day.date === todayStr;

      // 조류예보는 오늘 데이터만 적용
      const tidalSpeed = (isToday && tidalForecast) ? tidalForecast.speed : null;
      const tidalDir = (isToday && tidalForecast) ? tidalForecast.direction : null;

      if (!khoa && !isToday) return day;

      return {
        ...day,
        // KHOA 실측 염분 (Open-Meteo에 없는 데이터)
        salinity: khoa?.salinity ?? day.salinity,
        // KHOA 실측 수온이 있으면 우선 사용 (실측 > 모델 추정)
        seaTemperatureAvg: khoa?.seaTemperatureAvg ?? day.seaTemperatureAvg,
        seaTemperatureMin: khoa?.seaTemperatureMin ?? day.seaTemperatureMin,
        seaTemperatureMax: khoa?.seaTemperatureMax ?? day.seaTemperatureMax,
        // KHOA 실측 기압
        surfacePressureAvg: khoa?.surfacePressureAvg ?? day.surfacePressureAvg,
        // KHOA 실측 조위
        tideLevelAvg: khoa?.tideLevelAvg ?? day.tideLevelAvg,
        tideLevelMin: khoa?.tideLevelMin ?? day.tideLevelMin,
        tideLevelMax: khoa?.tideLevelMax ?? day.tideLevelMax,
        // 조류: 관측소 실측(있으면) > 조류예보(오늘만)
        tidalCurrentSpeed: khoa?.currentVelocityAvg ?? tidalSpeed ?? day.tidalCurrentSpeed,
        tidalCurrentDirection: khoa?.currentDirectionDominant ?? tidalDir ?? day.tidalCurrentDirection,
        // 데이터 소스 표기
        dataSource: khoa ? 'hybrid' : (isToday && tidalForecast ? 'hybrid' : day.dataSource),
      };
    });
  } catch {
    // KHOA API 실패 시 원본 데이터 반환 (graceful degradation)
    return dailyData;
  }
}

// ─── 하이브리드 API 응답 구성 ───

/** KHOA 데이터 소스 추적 */
export interface DataSources {
  temperature: 'khoa' | 'open-meteo';
  salinity: 'khoa' | 'manual' | null;
  pressure: 'khoa' | 'open-meteo';
  tideLevel: 'khoa' | null;
  tidalCurrent: 'khoa' | 'khoa-forecast' | null;
  waveHeight: 'open-meteo';
  wavePeriod: 'open-meteo';
}

/** KHOA 하이브리드 응답 부분 */
export interface KhoaResponseData {
  station: string;
  items: KhoaObservationItem[];
  tidalCurrent: { speed: number; direction: number; type: string; time: string } | null;
  buoyCurrent: { speed: number; direction: number } | null; // TW_0078 완도항 부이 실측 유속
}

/**
 * KHOA 최신관측 + 조류예보를 동시에 조회
 * 실패 시 null 반환 (graceful degradation)
 */
export async function fetchKhoaHybridData(): Promise<{
  khoaData: KhoaResponseData;
  sources: DataSources;
} | null> {
  try {
    // DT_0027(조위관측소) + TW_0078(완도항 부이, 유속) + 조류예보 동시 호출
    const [items, buoyItems, tidalForecast] = await Promise.all([
      fetchKhoaRecentData({ min: 60 }),
      fetchKhoaBuoyData({ min: 60 }).catch(() => []),
      getTodayTidalCurrentForecast().catch(() => null),
    ]);

    const hasKhoaItems = items.length > 0;
    const hasTemp = hasKhoaItems && items.some(i => i.wtem !== null);
    const hasSalinity = hasKhoaItems && items.some(i => i.slntQty !== null);
    const hasPressure = hasKhoaItems && items.some(i => i.atmpr !== null);
    const hasTide = hasKhoaItems && items.some(i => i.bscTdlvHgt !== null);

    // 완도항 부이에서 최신 유속 추출
    const buoySpeeds = buoyItems.map(i => i.crsp).filter((v): v is number => v !== null);
    const buoyDirs = buoyItems.map(i => i.crdir).filter((v): v is number => v !== null);
    const buoyCurrent = buoySpeeds.length > 0 ? {
      speed: buoySpeeds[buoySpeeds.length - 1],
      direction: buoyDirs.length > 0 ? buoyDirs[buoyDirs.length - 1] : 0,
    } : null;

    const khoaData: KhoaResponseData = {
      station: items[0]?.obsvtrNm || '완도',
      items,
      tidalCurrent: tidalForecast,
      buoyCurrent,
    };

    const hasCurrent = buoyCurrent !== null || tidalForecast !== null;
    const sources: DataSources = {
      temperature: hasTemp ? 'khoa' : 'open-meteo',
      salinity: hasSalinity ? 'khoa' : null,
      pressure: hasPressure ? 'khoa' : 'open-meteo',
      tideLevel: hasTide ? 'khoa' : null,
      tidalCurrent: buoyCurrent ? 'khoa' : (tidalForecast ? 'khoa-forecast' : null),
      waveHeight: 'open-meteo',
      wavePeriod: 'open-meteo',
    };

    return { khoaData, sources };
  } catch {
    return null;
  }
}

/**
 * Open-Meteo + KHOA 하이브리드 응답 포맷
 */
export function formatHybridResponse(
  marine: Record<string, unknown>,
  weather: Record<string, unknown>,
  khoaResult: { khoaData: KhoaResponseData; sources: DataSources } | null
) {
  const base = formatCombinedResponse(marine, weather);

  return {
    ...base,
    khoa: khoaResult?.khoaData ?? null,
    sources: khoaResult?.sources ?? {
      temperature: 'open-meteo' as const,
      salinity: null,
      pressure: 'open-meteo' as const,
      tideLevel: null,
      tidalCurrent: null,
      waveHeight: 'open-meteo' as const,
      wavePeriod: 'open-meteo' as const,
    },
  };
}

/**
 * 날짜 문자열을 YYYY-MM-DD 형식으로 반환
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * 어제 날짜 반환 (KST 기준)
 */
export function getYesterdayKST(): string {
  const now = new Date();
  // KST = UTC + 9
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kst.setDate(kst.getDate() - 1);
  return kst.toISOString().split('T')[0];
}

/**
 * 날짜 범위를 지정된 청크 크기로 분할
 */
export function splitDateRange(
  startDate: string,
  endDate: string,
  chunkDays: number = 30
): { start: string; end: string }[] {
  const chunks: { start: string; end: string }[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  let current = new Date(start);

  while (current <= end) {
    const chunkEnd = new Date(current);
    chunkEnd.setDate(chunkEnd.getDate() + chunkDays - 1);

    if (chunkEnd > end) {
      chunks.push({ start: formatDate(current), end: formatDate(end) });
    } else {
      chunks.push({ start: formatDate(current), end: formatDate(chunkEnd) });
    }

    current = new Date(chunkEnd);
    current.setDate(current.getDate() + 1);
  }

  return chunks;
}
