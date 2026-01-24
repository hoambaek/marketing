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
import {
  fetchOceanDataDaily,
  upsertOceanDataDaily,
  updateOceanDataSalinity,
  fetchSalinityRecords,
  createSalinityRecord,
} from '@/lib/supabase/database';

interface OceanDataState {
  // View State
  currentView: OceanDataView;
  selectedDate: string | null;
  agingDepth: number;
  useSupabase: boolean;

  // Data State
  hourlyData: OceanDataHourly[];
  dailyData: OceanDataDaily[];
  salinityRecords: SalinityRecord[];
  currentConditions: CurrentOceanConditions | null;

  // Loading State
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  setCurrentView: (view: OceanDataView) => void;
  setSelectedDate: (date: string | null) => void;
  setAgingDepth: (depth: number) => void;

  fetchOceanData: (view?: OceanDataView) => Promise<void>;
  fetchCurrentConditions: () => Promise<void>;
  loadSalinityRecords: () => Promise<void>;

  addSalinityRecord: (salinity: number, depth?: number, notes?: string) => Promise<void>;
  updateDailySalinity: (date: string, salinity: number) => Promise<void>;
  saveDataToSupabase: () => Promise<void>;

  clearError: () => void;
}

export const useOceanDataStore = create<OceanDataState>((set, get) => ({
  // Initial State
  currentView: 'daily',
  selectedDate: null,
  agingDepth: DEFAULT_AGING_DEPTH,
  useSupabase: true,

  hourlyData: [],
  dailyData: [],
  salinityRecords: [],
  currentConditions: null,

  isLoading: false,
  isSaving: false,
  error: null,

  // Actions
  setCurrentView: (view) => {
    set({ currentView: view });
    get().fetchOceanData(view);
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

  fetchOceanData: async (view) => {
    const currentView = view || get().currentView;
    set({ isLoading: true, error: null });

    try {
      const { startDate, endDate } = getDateRange(currentView);

      // Fetch from Open-Meteo API
      const response = await fetch(
        `/api/ocean-data?start_date=${startDate}&end_date=${endDate}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch ocean data');
      }

      const data = await response.json();

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

      // Load existing data from Supabase to preserve salinity values
      const { useSupabase } = get();
      let existingSalinityMap = new Map<string, number | null>();

      if (useSupabase) {
        const savedData = await fetchOceanDataDaily(startDate, endDate);
        if (savedData) {
          savedData.forEach((d) => {
            existingSalinityMap.set(d.date, d.salinity);
          });
        }
      }

      const dailyData: OceanDataDaily[] = [];
      const { agingDepth } = get();

      dailyMap.forEach((hours, date) => {
        const seaTemps = hours.map((h) => h.seaTemperature);
        const velocities = hours.map((h) => h.currentVelocity);
        const directions = hours.map((h) => h.currentDirection);
        const waveHeights = hours.map((h) => h.waveHeight);
        const pressures = hours.map((h) => h.surfacePressure);
        const airTemps = hours.map((h) => h.airTemperature);
        const humidities = hours.map((h) => h.humidity);

        const tempStats = calculateDailyAverages(seaTemps);
        const velocityStats = calculateDailyAverages(velocities);
        const waveStats = calculateDailyAverages(waveHeights);
        const pressureStats = calculateDailyAverages(pressures);
        const airTempStats = calculateDailyAverages(airTemps);
        const humidityStats = calculateDailyAverages(humidities);

        // Preserve existing salinity if available
        const existingSalinity = existingSalinityMap.get(date) ?? null;

        dailyData.push({
          id: `local-${date}`,
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
          salinity: existingSalinity,
          depth: agingDepth,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });

      // Sort by date descending
      dailyData.sort((a, b) => b.date.localeCompare(a.date));

      set({ hourlyData, dailyData, isLoading: false });

      // Auto-save to Supabase in background
      if (useSupabase && dailyData.length > 0) {
        get().saveDataToSupabase();
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

      // Get the most recent data point
      const lastIndex = marineHourly.time.length - 1;
      const surfacePressure = weatherHourly?.surface_pressure?.[lastIndex] ?? null;

      // Get latest salinity from records
      const latestSalinity = salinityRecords.length > 0 ? salinityRecords[0].salinity : null;

      const currentConditions: CurrentOceanConditions = {
        seaTemperature: marineHourly.sea_surface_temperature?.[lastIndex] ?? null,
        currentVelocity: marineHourly.ocean_current_velocity?.[lastIndex] ?? null,
        currentDirection: marineHourly.ocean_current_direction?.[lastIndex] ?? null,
        waveHeight: marineHourly.wave_height?.[lastIndex] ?? null,
        surfacePressure,
        waterPressure: calculateWaterPressure(agingDepth, surfacePressure || undefined),
        salinity: latestSalinity,
        lastUpdated: marineHourly.time[lastIndex],
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

    // Update in Supabase
    if (useSupabase) {
      try {
        await updateOceanDataSalinity(date, salinity);
      } catch (error) {
        storeLogger.error('Error updating salinity in database:', error);
      }
    }
  },

  saveDataToSupabase: async () => {
    const { dailyData, useSupabase } = get();
    if (!useSupabase || dailyData.length === 0) return;

    set({ isSaving: true });

    try {
      // Save each day's data (upsert to handle existing records)
      for (const day of dailyData) {
        await upsertOceanDataDaily({
          date: day.date,
          seaTemperatureAvg: day.seaTemperatureAvg,
          seaTemperatureMin: day.seaTemperatureMin,
          seaTemperatureMax: day.seaTemperatureMax,
          currentVelocityAvg: day.currentVelocityAvg,
          currentDirectionDominant: day.currentDirectionDominant,
          waveHeightAvg: day.waveHeightAvg,
          waveHeightMax: day.waveHeightMax,
          surfacePressureAvg: day.surfacePressureAvg,
          airTemperatureAvg: day.airTemperatureAvg,
          humidityAvg: day.humidityAvg,
          salinity: day.salinity,
          depth: day.depth,
        });
      }
    } catch (error) {
      storeLogger.error('Error saving data to Supabase:', error);
    } finally {
      set({ isSaving: false });
    }
  },

  clearError: () => set({ error: null }),
}));
