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
  endDate: string
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
    const pressures: (number | null)[] = [];
    const airTemps: (number | null)[] = [];
    const humidities: (number | null)[] = [];

    for (const h of hours) {
      seaTemps.push(h.seaTemperature);
      velocities.push(h.currentVelocity);
      directions.push(h.currentDirection);
      waveHeights.push(h.waveHeight);
      pressures.push(h.surfacePressure);
      airTemps.push(h.airTemperature);
      humidities.push(h.humidity);
    }

    const tempStats = calculateDailyAverages(seaTemps);
    const velocityStats = calculateDailyAverages(velocities);
    const waveStats = calculateDailyAverages(waveHeights);
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
      surfacePressureAvg: pressureStats.avg,
      airTemperatureAvg: airTempStats.avg,
      humidityAvg: humidityStats.avg,
      depth: agingDepth,
    });
  });

  return dailyData.sort((a, b) => a.date.localeCompare(b.date));
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
