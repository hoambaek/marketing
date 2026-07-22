'use client';

import { create } from 'zustand';
import { storeLogger } from '@/lib/logger';
import {
  OceanDataDaily,
  OceanDataHourly,
  SalinityRecord,
  CurrentOceanConditions,
  OceanDataView,
  DEFAULT_AGING_DEPTH,
} from '@/lib/types';
import {
  calculateWaterPressure,
  calculateDailyAverages,
  calculateDominantDirection,
  getDateRange,
} from '@/lib/utils/ocean-calculations';
import { buildMonthlyOceanProfiles, buildAnnualOceanProfile, type MonthlyOceanProfile, type AnnualOceanProfile } from '@/lib/utils/uaps-ocean-profile';
import { estimateBottomTemperature } from '@/lib/utils/uaps-ocean-profile';
import {
  fetchOceanDataDaily,
  fetchSalinityRecords,
  createSalinityRecord,
} from '@/lib/supabase/database';

// 전체 수집 기간 해양 통계 (UAPS 예측용)
export interface HistoricalOceanStats {
  seaTemperature: number | null;
  currentVelocity: number | null;
  waveHeight: number | null;
  wavePeriod: number | null;
  waterPressure: number | null;
  salinity: number | null;
  tideLevel: number | null;
  tidalCurrentSpeed: number | null;
  dataPoints: number;
  periodStart: string | null;
  periodEnd: string | null;
}

// UAPS 실시간 보정 계수 (Task 3에서 계산 로직 구현 예정)
export interface UAPSLiveCoefficients {
  fri: number | null;
  bri: number | null;
  kTci: number | null;
  tsi: number | null;
  overallScore: number | null;
}

interface OceanDataState {
  // View State
  currentView: OceanDataView;
  selectedDate: string | null;
  agingDepth: number;
  useSupabase: boolean;

  // Data State
  hourlyData: OceanDataHourly[];
  dailyData: OceanDataDaily[];
  // 전체 히스토리(2025-01-01~, 30m 보정) — 뷰 창에 제한된 dailyData와 달리 침지 기간 전체 평균에 사용
  allDailyData: OceanDataDaily[];
  salinityRecords: SalinityRecord[];
  currentConditions: CurrentOceanConditions | null;
  historicalOceanStats: HistoricalOceanStats | null;
  monthlyOceanProfiles: MonthlyOceanProfile[] | null;
  annualOceanProfile: AnnualOceanProfile | null;
  uapsCoefficients: UAPSLiveCoefficients | null;

  // Loading State
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  setCurrentView: (view: OceanDataView) => void;
  setSelectedDate: (date: string | null) => void;
  setAgingDepth: (depth: number) => void;

  fetchOceanData: (
    view?: OceanDataView,
    range?: { startDate: string; endDate: string }
  ) => Promise<void>;
  fetchCurrentConditions: () => Promise<void>;
  loadSalinityRecords: () => Promise<void>;
  loadHistoricalOceanStats: () => Promise<void>;

  addSalinityRecord: (salinity: number, depth?: number, notes?: string) => Promise<void>;
  updateDailySalinity: (date: string, salinity: number) => Promise<void>;
  saveDataToSupabase: (rows: OceanDataDaily[]) => Promise<void>;

  clearError: () => void;
}

export const useOceanDataStore = create<OceanDataState>((set, get) => ({
  // Initial State
  currentView: 'full_cycle',
  selectedDate: null,
  agingDepth: DEFAULT_AGING_DEPTH,
  useSupabase: true,

  hourlyData: [],
  dailyData: [],
  allDailyData: [],
  salinityRecords: [],
  currentConditions: null,
  historicalOceanStats: null,
  monthlyOceanProfiles: null,
  annualOceanProfile: null,
  uapsCoefficients: null,

  isLoading: false,
  isSaving: false,
  error: null,

  // Actions
  setCurrentView: (view) => {
    // fetch는 페이지의 useEffect가 기간(range)과 함께 트리거한다
    set({ currentView: view });
  },

  setSelectedDate: (date) => set({ selectedDate: date }),

  setAgingDepth: (depth) => {
    set({ agingDepth: depth });
    // Recalculate water pressure for current conditions
    const { currentConditions } = get();
    if (currentConditions) {
      set({
        currentConditions: {
          ...currentConditions,
          waterPressure: calculateWaterPressure(depth, currentConditions.surfacePressure || undefined),
        },
      });
    }
  },

  fetchOceanData: async (view, range) => {
    const currentView = view || get().currentView;
    set({ isLoading: true, error: null });

    try {
      const { startDate, endDate } = range ?? getDateRange(currentView);

      // Open-Meteo forecast 엔드포인트는 최근 ~92일까지만 응답하므로 API 요청 구간을
      // 최근 90일로 클램프하고, 그 밖의 과거 구간은 Supabase 백필 데이터(2025-01-01~)로 채운다
      const todayStr = new Date().toISOString().split('T')[0];
      const apiLimitDate = new Date();
      apiLimitDate.setDate(apiLimitDate.getDate() - 90);
      const apiEarliest = apiLimitDate.toISOString().split('T')[0];
      const apiStart = startDate > apiEarliest ? startDate : apiEarliest;
      const apiEnd = endDate < todayStr ? endDate : todayStr;
      const useApi = apiStart <= apiEnd;

      // Supabase 저장 데이터: KHOA 필드(염분·조위·조류) 보존 + API 미지원 과거 구간의 소스
      const { useSupabase, agingDepth } = get();
      let savedRows: OceanDataDaily[] = [];
      if (useSupabase) {
        savedRows = (await fetchOceanDataDaily(startDate, endDate)) ?? [];
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any = {};
      if (useApi) {
        const response = await fetch(
          `/api/ocean-data?start_date=${apiStart}&end_date=${apiEnd}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch ocean data');
        }

        data = await response.json();
      }

      // Process hourly data
      const hourlyData: OceanDataHourly[] = [];
      const timeArray = data.marine?.hourly?.time || [];

      for (let i = 0; i < timeArray.length; i++) {
        hourlyData.push({
          time: timeArray[i],
          seaTemperature: data.marine?.hourly?.sea_surface_temperature?.[i] ?? null,
          currentVelocity: data.marine?.hourly?.ocean_current_velocity?.[i] ?? null,
          currentDirection: data.marine?.hourly?.ocean_current_direction?.[i] ?? null,
          waveHeight: data.marine?.hourly?.wave_height?.[i] ?? null,
          waveDirection: data.marine?.hourly?.wave_direction?.[i] ?? null,
          wavePeriod: data.marine?.hourly?.wave_period?.[i] ?? null,
          surfacePressure: data.weather?.hourly?.surface_pressure?.[i] ?? null,
          airTemperature: data.weather?.hourly?.temperature_2m?.[i] ?? null,
          humidity: data.weather?.hourly?.relative_humidity_2m?.[i] ?? null,
        });
      }

      // Calculate daily aggregates
      const dailyMap = new Map<string, OceanDataHourly[]>();
      for (const item of hourlyData) {
        const date = item.time.split('T')[0];
        const existing = dailyMap.get(date) || [];
        existing.push(item);
        dailyMap.set(date, existing);
      }

      // Supabase 기존 데이터 맵 (KHOA 필드 폴백용)
      const existingDataMap = new Map<string, OceanDataDaily>();
      savedRows.forEach((d) => {
        existingDataMap.set(d.date, d);
      });

      // KHOA 데이터 일별 집계 준비
      interface KhoaItem {
        obsrvnDt: string;
        wtem: number | null;
        slntQty: number | null;
        atmpr: number | null;
        bscTdlvHgt: number | null;
        crsp: number | null;
        crdir: number | null;
      }
      const khoaItems: KhoaItem[] = data.khoa?.items ?? [];
      const khoaDailyMap = new Map<string, KhoaItem[]>();
      for (const item of khoaItems) {
        const date = item.obsrvnDt?.split(' ')[0];
        if (!date) continue;
        const existing = khoaDailyMap.get(date) || [];
        existing.push(item);
        khoaDailyMap.set(date, existing);
      }

      // KHOA 조류예보 + 부이 실측 유속
      const khoaTidalCurrent = data.khoa?.tidalCurrent as {
        speed: number; direction: number; type: string; time: string;
      } | null;
      const buoyCurrent = data.khoa?.buoyCurrent as {
        speed: number; direction: number;
      } | null;

      // 데이터 소스 정보
      const sources = data.sources as {
        temperature?: string;
        salinity?: string | null;
        pressure?: string;
        tideLevel?: string | null;
        tidalCurrent?: string | null;
      } | null;

      const hasKhoa = khoaItems.length > 0;

      const dailyData: OceanDataDaily[] = [];
      // DB 저장용 (수온은 표층값 유지 — 저장은 표층, 30m 보정은 읽는 쪽 규약)
      const persistRows: OceanDataDaily[] = [];

      dailyMap.forEach((hours, date) => {
        const seaTemps = hours.map((h) => h.seaTemperature);
        const velocities = hours.map((h) => h.currentVelocity);
        const directions = hours.map((h) => h.currentDirection);
        const waveHeights = hours.map((h) => h.waveHeight);
        const wavePeriods = hours.map((h) => h.wavePeriod);
        const pressures = hours.map((h) => h.surfacePressure);
        const airTemps = hours.map((h) => h.airTemperature);
        const humidities = hours.map((h) => h.humidity);

        const tempStats = calculateDailyAverages(seaTemps);
        const velocityStats = calculateDailyAverages(velocities);
        const waveStats = calculateDailyAverages(waveHeights);
        const wavePeriodStats = calculateDailyAverages(wavePeriods);
        const pressureStats = calculateDailyAverages(pressures);
        const airTempStats = calculateDailyAverages(airTemps);
        const humidityStats = calculateDailyAverages(humidities);

        // KHOA 일별 데이터 집계 (해당 날짜)
        const khoaDayItems = khoaDailyMap.get(date) || [];
        const khoaTemps = khoaDayItems.map(i => i.wtem).filter((v): v is number => v !== null);
        const khoaSalinities = khoaDayItems.map(i => i.slntQty).filter((v): v is number => v !== null);
        const khoaPressures = khoaDayItems.map(i => i.atmpr).filter((v): v is number => v !== null);
        const khoaTides = khoaDayItems.map(i => i.bscTdlvHgt).filter((v): v is number => v !== null);

        // KHOA 수온 우선 → Open-Meteo 폴백 + 30m 깊이 보정
        const month = parseInt(date.split('-')[1], 10) || 1;
        const surfaceTempAvg = khoaTemps.length > 0
          ? khoaTemps.reduce((s, v) => s + v, 0) / khoaTemps.length
          : tempStats.avg;
        const surfaceTempMin = khoaTemps.length > 0
          ? Math.min(...khoaTemps)
          : tempStats.min;
        const surfaceTempMax = khoaTemps.length > 0
          ? Math.max(...khoaTemps)
          : tempStats.max;

        const finalTempAvg = surfaceTempAvg !== null ? estimateBottomTemperature(surfaceTempAvg, 30, month) : null;
        const finalTempMin = surfaceTempMin !== null ? estimateBottomTemperature(surfaceTempMin, 30, month) : null;
        const finalTempMax = surfaceTempMax !== null ? estimateBottomTemperature(surfaceTempMax, 30, month) : null;

        // KHOA 기압 우선 → Open-Meteo 폴백
        const finalPressureAvg = khoaPressures.length > 0
          ? khoaPressures.reduce((s, v) => s + v, 0) / khoaPressures.length
          : pressureStats.avg;

        // 염분: KHOA 실측 우선 → 기존 Supabase 저장값 → null
        const khoaSalinityAvg = khoaSalinities.length > 0
          ? khoaSalinities.reduce((s, v) => s + v, 0) / khoaSalinities.length
          : null;
        const existingDay = existingDataMap.get(date);
        const finalSalinity = khoaSalinityAvg ?? existingDay?.salinity ?? null;

        // 조위 집계: KHOA 실측 우선 → Supabase 저장값 폴백
        const tideLevelAvg = khoaTides.length > 0
          ? khoaTides.reduce((s, v) => s + v, 0) / khoaTides.length
          : existingDay?.tideLevelAvg ?? null;
        const tideLevelMin = khoaTides.length > 0
          ? Math.min(...khoaTides)
          : existingDay?.tideLevelMin ?? null;
        const tideLevelMax = khoaTides.length > 0
          ? Math.max(...khoaTides)
          : existingDay?.tideLevelMax ?? null;

        // 조류: 조류예보(외해, 당일) → 부이 실측(당일) → KHOA 관측 → Supabase 폴백
        const today = new Date().toISOString().split('T')[0];
        let tidalCurrentSpeed: number | null = null;
        let tidalCurrentDirection: number | null = null;

        if (date === today && khoaTidalCurrent) {
          tidalCurrentSpeed = khoaTidalCurrent.speed;
          tidalCurrentDirection = khoaTidalCurrent.direction;
        } else if (date === today && buoyCurrent) {
          tidalCurrentSpeed = buoyCurrent.speed;
          tidalCurrentDirection = buoyCurrent.direction;
        } else {
          const khoaSpeeds = khoaDayItems.map(i => i.crsp).filter((v): v is number => v !== null);
          const khoaDirs = khoaDayItems.map(i => i.crdir).filter((v): v is number => v !== null);
          tidalCurrentSpeed = khoaSpeeds.length > 0
            ? khoaSpeeds.reduce((s, v) => s + v, 0) / khoaSpeeds.length
            : existingDay?.tidalCurrentSpeed ?? null;
          tidalCurrentDirection = khoaDirs.length > 0
            ? calculateDominantDirection(khoaDirs.map(d => d as number | null))
            : existingDay?.tidalCurrentDirection ?? null;
        }

        // 데이터 소스 결정
        let dataSource: string = 'open-meteo';
        if (hasKhoa && khoaDayItems.length > 0) {
          dataSource = tempStats.avg !== null ? 'hybrid' : 'khoa';
        }

        const displayRow: OceanDataDaily = {
          id: `local-${date}`,
          date,
          seaTemperatureAvg: finalTempAvg,
          seaTemperatureMin: finalTempMin,
          seaTemperatureMax: finalTempMax,
          currentVelocityAvg: velocityStats.avg,
          currentDirectionDominant: calculateDominantDirection(directions),
          waveHeightAvg: waveStats.avg,
          waveHeightMax: waveStats.max,
          wavePeriodAvg: wavePeriodStats.avg,
          surfacePressureAvg: finalPressureAvg,
          airTemperatureAvg: airTempStats.avg,
          humidityAvg: humidityStats.avg,
          salinity: finalSalinity,
          tideLevelAvg,
          tideLevelMin,
          tideLevelMax,
          tidalCurrentSpeed,
          tidalCurrentDirection,
          dataSource,
          depth: agingDepth,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        dailyData.push(displayRow);
        persistRows.push({
          ...displayRow,
          seaTemperatureAvg: surfaceTempAvg,
          seaTemperatureMin: surfaceTempMin,
          seaTemperatureMax: surfaceTempMax,
        });
      });

      // API가 못 채운 과거 날짜는 Supabase 백필 행으로 채움
      // (DB에는 표층 수온이 저장돼 있으므로 표시 시 30m 보정 적용)
      const apiDates = new Set(dailyData.map((d) => d.date));
      for (const row of savedRows) {
        if (apiDates.has(row.date)) continue;
        const month = parseInt(row.date.split('-')[1], 10) || 1;
        dailyData.push({
          ...row,
          seaTemperatureAvg:
            row.seaTemperatureAvg !== null
              ? estimateBottomTemperature(row.seaTemperatureAvg, 30, month)
              : null,
          seaTemperatureMin:
            row.seaTemperatureMin !== null
              ? estimateBottomTemperature(row.seaTemperatureMin, 30, month)
              : null,
          seaTemperatureMax:
            row.seaTemperatureMax !== null
              ? estimateBottomTemperature(row.seaTemperatureMax, 30, month)
              : null,
        });
      }

      // Sort by date descending
      dailyData.sort((a, b) => b.date.localeCompare(a.date));

      set({ hourlyData, dailyData, isLoading: false });

      // 새로 수집한 API 구간만 백그라운드 저장 (과거 구간 재저장 방지)
      if (useSupabase && persistRows.length > 0) {
        get().saveDataToSupabase(persistRows);
      }
    } catch (error) {
      storeLogger.error('Error fetching ocean data:', error);
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  },

  fetchCurrentConditions: async () => {
    set({ isLoading: true, error: null });

    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `/api/ocean-data?start_date=${today}&end_date=${today}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch current conditions');
      }

      const data = await response.json();
      const { agingDepth, salinityRecords } = get();

      // Get latest hourly data
      const marineHourly = data.marine?.hourly;
      const weatherHourly = data.weather?.hourly;

      if (!marineHourly?.time?.length) {
        set({ isLoading: false });
        return;
      }

      // Get the most recent data point (Open-Meteo)
      const lastIndex = marineHourly.time.length - 1;
      const omSurfacePressure = weatherHourly?.surface_pressure?.[lastIndex] ?? null;
      const omSeaTemp = marineHourly.sea_surface_temperature?.[lastIndex] ?? null;

      // KHOA 데이터에서 최신값 추출
      const khoaItems: Array<{
        obsrvnDt: string;
        wtem: number | null;
        slntQty: number | null;
        atmpr: number | null;
        bscTdlvHgt: number | null;
        crsp: number | null;
        crdir: number | null;
      }> = data.khoa?.items ?? [];
      const khoaTidalCurrent = data.khoa?.tidalCurrent as {
        speed: number; direction: number; type: string; time: string;
      } | null;

      // KHOA 최신 관측 항목 — 응답이 관측시각 내림차순이라 마지막을 집으면
      // 당일 가장 오래된 값이 잡힌다. 순서에 기대지 않고 시각으로 직접 고른다.
      const latestKhoa = khoaItems.length > 0
        ? khoaItems.reduce((a, b) => (b.obsrvnDt > a.obsrvnDt ? b : a))
        : null;

      // 수온: KHOA 우선 + 30m 깊이 보정
      const surfaceTemp = latestKhoa?.wtem ?? omSeaTemp;
      const currentMonth = new Date().getMonth() + 1;
      const seaTemperature = surfaceTemp !== null
        ? estimateBottomTemperature(surfaceTemp, 30, currentMonth)
        : null;

      // 기압: KHOA 우선
      const surfacePressure = latestKhoa?.atmpr ?? omSurfacePressure;

      // 염분: KHOA 실측 우선 → salinity_records → null
      const latestSalinity = salinityRecords.length > 0 ? salinityRecords[0].salinity : null;
      const salinity = latestKhoa?.slntQty ?? latestSalinity;

      // 조위: KHOA
      const tideLevel = latestKhoa?.bscTdlvHgt ?? null;

      // 조류: 조류예보(외해) 우선 → 부이 실측(항내) → KHOA 관측 → null
      // 조류예보가 외해 기준이라 숙성 환경에 더 적합
      const buoyCurrent = data.khoa?.buoyCurrent as { speed: number; direction: number } | null;
      let tidalCurrentSpeed: number | null = null;
      let tidalCurrentDirection: number | null = null;
      if (khoaTidalCurrent) {
        tidalCurrentSpeed = khoaTidalCurrent.speed;
        tidalCurrentDirection = khoaTidalCurrent.direction;
      } else if (buoyCurrent) {
        tidalCurrentSpeed = buoyCurrent.speed;
        tidalCurrentDirection = buoyCurrent.direction;
      } else if (latestKhoa) {
        tidalCurrentSpeed = latestKhoa.crsp;
        tidalCurrentDirection = latestKhoa.crdir;
      }

      const currentConditions: CurrentOceanConditions = {
        seaTemperature,
        currentVelocity: marineHourly.ocean_current_velocity?.[lastIndex] ?? null,
        currentDirection: marineHourly.ocean_current_direction?.[lastIndex] ?? null,
        waveHeight: marineHourly.wave_height?.[lastIndex] ?? null,
        wavePeriod: marineHourly.wave_period?.[lastIndex] ?? null,
        surfacePressure,
        waterPressure: calculateWaterPressure(agingDepth, surfacePressure || undefined),
        salinity,
        tideLevel,
        tidalCurrentSpeed,
        tidalCurrentDirection,
        lastUpdated: latestKhoa?.obsrvnDt ?? marineHourly.time[lastIndex],
      };

      set({ currentConditions, isLoading: false });
    } catch (error) {
      storeLogger.error('Error fetching current conditions:', error);
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  },

  loadSalinityRecords: async () => {
    const { useSupabase } = get();
    if (!useSupabase) return;

    try {
      const records = await fetchSalinityRecords(50);
      if (records) {
        set({ salinityRecords: records });
      }
    } catch (error) {
      storeLogger.error('Error loading salinity records:', error);
    }
  },

  addSalinityRecord: async (salinity, depth, notes) => {
    const { useSupabase, agingDepth } = get();
    const measuredAt = new Date().toISOString();
    const recordDepth = depth || agingDepth;

    // Create local record first
    const localRecord: SalinityRecord = {
      id: `local-${Date.now()}`,
      measuredAt,
      salinity,
      depth: recordDepth,
      notes: notes || null,
      createdAt: measuredAt,
    };

    set((state) => ({
      salinityRecords: [localRecord, ...state.salinityRecords],
      currentConditions: state.currentConditions
        ? { ...state.currentConditions, salinity }
        : null,
    }));

    // Save to Supabase
    if (useSupabase) {
      try {
        const savedRecord = await createSalinityRecord({
          measuredAt,
          salinity,
          depth: recordDepth,
          notes: notes || null,
        });

        if (savedRecord) {
          // Replace local record with saved record
          set((state) => ({
            salinityRecords: state.salinityRecords.map((r) =>
              r.id === localRecord.id ? savedRecord : r
            ),
          }));
        }
      } catch (error) {
        storeLogger.error('Error saving salinity record:', error);
      }
    }
  },

  updateDailySalinity: async (date, salinity) => {
    const { useSupabase } = get();

    // Update local state
    set((state) => ({
      dailyData: state.dailyData.map((d) =>
        d.date === date ? { ...d, salinity, updatedAt: new Date().toISOString() } : d
      ),
    }));

    // Update in Supabase (anon write 정책 제거 → 인증 라우트 경유, 2026-07-22)
    if (useSupabase) {
      try {
        await fetch('/api/ocean-data', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, salinity }),
        });
      } catch (error) {
        storeLogger.error('Error updating salinity in database:', error);
      }
    }
  },

  saveDataToSupabase: async (rows) => {
    const { useSupabase } = get();
    // 주의: rows의 수온은 표층값이어야 한다 (DB 규약 — 30m 보정값 저장 금지)
    if (!useSupabase || rows.length === 0) return;

    set({ isSaving: true });

    try {
      // ocean_data_daily는 anon write 정책을 제거했으므로(2026-07-22) 인증 라우트 경유로 벌크 저장
      const payload = rows.map((day) => ({
        date: day.date,
        seaTemperatureAvg: day.seaTemperatureAvg,
        seaTemperatureMin: day.seaTemperatureMin,
        seaTemperatureMax: day.seaTemperatureMax,
        currentVelocityAvg: day.currentVelocityAvg,
        currentDirectionDominant: day.currentDirectionDominant,
        waveHeightAvg: day.waveHeightAvg,
        waveHeightMax: day.waveHeightMax,
        wavePeriodAvg: day.wavePeriodAvg,
        surfacePressureAvg: day.surfacePressureAvg,
        airTemperatureAvg: day.airTemperatureAvg,
        humidityAvg: day.humidityAvg,
        salinity: day.salinity,
        tideLevelAvg: day.tideLevelAvg,
        tideLevelMin: day.tideLevelMin,
        tideLevelMax: day.tideLevelMax,
        tidalCurrentSpeed: day.tidalCurrentSpeed,
        tidalCurrentDirection: day.tidalCurrentDirection,
        dataSource: day.dataSource,
        depth: day.depth,
      }));
      await fetch('/api/ocean-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: payload }),
      });
    } catch (error) {
      storeLogger.error('Error saving data to Supabase:', error);
    } finally {
      set({ isSaving: false });
    }
  },

  loadHistoricalOceanStats: async () => {
    const { useSupabase, agingDepth } = get();
    if (!useSupabase) return;

    try {
      // DB에서 전체 기간 일별 데이터 로드
      const allData = await fetchOceanDataDaily();
      if (!allData || allData.length === 0) return;

      // 유효값만 추출하여 평균 계산 (수온은 30m 깊이 보정 적용)
      const validTemps = allData
        .map(d => {
          if (d.seaTemperatureAvg === null) return null;
          const month = parseInt(d.date.split('-')[1], 10) || 1;
          return estimateBottomTemperature(d.seaTemperatureAvg, 30, month);
        })
        .filter((v): v is number => v !== null);
      const validVelocities = allData.map(d => d.currentVelocityAvg).filter((v): v is number => v !== null);
      const validWaveHeights = allData.map(d => d.waveHeightAvg).filter((v): v is number => v !== null);
      const validWavePeriods = allData.map(d => d.wavePeriodAvg).filter((v): v is number => v !== null);
      const validSalinities = allData.map(d => d.salinity).filter((v): v is number => v !== null);
      const validTideLevels = allData.map(d => d.tideLevelAvg).filter((v): v is number => v !== null);
      const validTidalSpeeds = allData.map(d => d.tidalCurrentSpeed).filter((v): v is number => v !== null);

      const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : null;

      const avgTemp = avg(validTemps);
      const avgPressure = calculateWaterPressure(agingDepth);

      const dates = allData.map(d => d.date).sort();

      // 월별/연간 해양 프로파일 구축
      const monthlyProfiles = buildMonthlyOceanProfiles(allData);
      const annualProfile = buildAnnualOceanProfile(monthlyProfiles, agingDepth);

      // 전체 히스토리를 30m 보정한 배열 (침지 기간 전체 평균용 — dailyData와 동일한 보정 규약)
      const allDailyData = allData.map((d) => {
        const month = parseInt(d.date.split('-')[1], 10) || 1;
        return {
          ...d,
          seaTemperatureAvg: d.seaTemperatureAvg !== null ? estimateBottomTemperature(d.seaTemperatureAvg, 30, month) : null,
          seaTemperatureMin: d.seaTemperatureMin !== null ? estimateBottomTemperature(d.seaTemperatureMin, 30, month) : null,
          seaTemperatureMax: d.seaTemperatureMax !== null ? estimateBottomTemperature(d.seaTemperatureMax, 30, month) : null,
        };
      });

      set({
        allDailyData,
        historicalOceanStats: {
          seaTemperature: avgTemp !== null ? Math.round(avgTemp * 100) / 100 : null,
          currentVelocity: avg(validVelocities) !== null ? Math.round(avg(validVelocities)! * 1000) / 1000 : null,
          waveHeight: avg(validWaveHeights) !== null ? Math.round(avg(validWaveHeights)! * 100) / 100 : null,
          wavePeriod: avg(validWavePeriods) !== null ? Math.round(avg(validWavePeriods)! * 100) / 100 : null,
          waterPressure: avgPressure,
          salinity: avg(validSalinities) !== null ? Math.round(avg(validSalinities)! * 10) / 10 : null,
          tideLevel: avg(validTideLevels) !== null ? Math.round(avg(validTideLevels)! * 10) / 10 : null,
          tidalCurrentSpeed: avg(validTidalSpeeds) !== null ? Math.round(avg(validTidalSpeeds)! * 1000) / 1000 : null,
          dataPoints: allData.length,
          periodStart: dates[0] || null,
          periodEnd: dates[dates.length - 1] || null,
        },
        monthlyOceanProfiles: monthlyProfiles,
        annualOceanProfile: annualProfile,
      });

      storeLogger.log(`Historical ocean stats loaded: ${allData.length} days (${dates[0]} ~ ${dates[dates.length - 1]})`);
    } catch (error) {
      storeLogger.error('Error loading historical ocean stats:', error);
    }
  },

  clearError: () => set({ error: null }),
}));
