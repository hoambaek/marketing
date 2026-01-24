/**
 * 해저숙성 데이터로그 타입 정의
 */

// 완도 해역 좌표
export const WANDO_COORDINATES = {
  latitude: 34.31,
  longitude: 126.76,
  name: '완도 해역',
} as const;

// 기본 숙성 깊이 (미터)
export const DEFAULT_AGING_DEPTH = 30;

// 시간 뷰 타입
export type OceanDataView = 'daily' | 'monthly' | 'full_cycle';

// 해양 데이터 (시간별)
export interface OceanDataHourly {
  time: string;
  seaTemperature: number | null;
  currentVelocity: number | null;
  currentDirection: number | null;
  waveHeight: number | null;
  waveDirection: number | null;
  wavePeriod: number | null;
  surfacePressure: number | null;
  airTemperature: number | null;
  humidity: number | null;
}

// 해양 데이터 (일별 집계)
export interface OceanDataDaily {
  id: string;
  date: string;
  // 수온
  seaTemperatureAvg: number | null;
  seaTemperatureMin: number | null;
  seaTemperatureMax: number | null;
  // 해류
  currentVelocityAvg: number | null;
  currentDirectionDominant: number | null;
  // 파고
  waveHeightAvg: number | null;
  waveHeightMax: number | null;
  // 기상
  surfacePressureAvg: number | null;
  airTemperatureAvg: number | null;
  humidityAvg: number | null;
  // 수동 입력
  salinity: number | null;
  // 메타데이터
  depth: number;
  createdAt: string;
  updatedAt: string;
}

// 염도 기록
export interface SalinityRecord {
  id: string;
  measuredAt: string;
  salinity: number;
  depth: number | null;
  notes: string | null;
  createdAt: string;
}

// 현재 상태 데이터
export interface CurrentOceanConditions {
  seaTemperature: number | null;
  currentVelocity: number | null;
  currentDirection: number | null;
  waveHeight: number | null;
  surfacePressure: number | null;
  waterPressure: number | null; // 계산값
  salinity: number | null; // 최근 수동 입력값
  lastUpdated: string;
}

// Open-Meteo API 응답 타입
export interface OpenMeteoMarineResponse {
  latitude: number;
  longitude: number;
  hourly: {
    time: string[];
    sea_surface_temperature?: (number | null)[];
    ocean_current_velocity?: (number | null)[];
    ocean_current_direction?: (number | null)[];
    wave_height?: (number | null)[];
    wave_direction?: (number | null)[];
    wave_period?: (number | null)[];
  };
  daily?: {
    time: string[];
    sea_surface_temperature_max?: (number | null)[];
    wave_height_max?: (number | null)[];
  };
}

export interface OpenMeteoWeatherResponse {
  latitude: number;
  longitude: number;
  hourly: {
    time: string[];
    surface_pressure?: (number | null)[];
    temperature_2m?: (number | null)[];
    relative_humidity_2m?: (number | null)[];
  };
}

// 차트 데이터 포인트
export interface OceanChartDataPoint {
  date: string;
  label: string;
  seaTemperature?: number | null;
  seaTemperatureMin?: number | null;
  seaTemperatureMax?: number | null;
  currentVelocity?: number | null;
  waveHeight?: number | null;
  waveHeightMax?: number | null;
  surfacePressure?: number | null;
  waterPressure?: number | null;
  salinity?: number | null;
}

// 데이터 상태 라벨
export const OCEAN_DATA_LABELS: Record<string, { name: string; unit: string; color: string }> = {
  seaTemperature: { name: '수온', unit: '°C', color: '#22d3ee' },
  currentVelocity: { name: '해류 속도', unit: 'm/s', color: '#a78bfa' },
  waveHeight: { name: '파고', unit: 'm', color: '#60a5fa' },
  surfacePressure: { name: '기압', unit: 'hPa', color: '#f472b6' },
  waterPressure: { name: '수압', unit: '기압', color: '#fb923c' },
  salinity: { name: '염도', unit: '‰', color: '#34d399' },
};
