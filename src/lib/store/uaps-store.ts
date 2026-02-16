'use client';

import { create } from 'zustand';
import { storeLogger } from '@/lib/logger';
import type {
  AgingProduct,
  AgingPrediction,
  UAPSConfig,
  ProductInput,
  ModelStatus,
  ParsedUAPSConfig,
} from '@/lib/types/uaps';
import { DEFAULT_COEFFICIENTS } from '@/lib/types/uaps';
import {
  fetchAgingProducts,
  createAgingProduct,
  updateAgingProduct,
  deleteAgingProduct,
  fetchAgingPredictions,
  fetchTerrestrialModels,
  fetchUAPSConfig,
  updateUAPSConfigValue,
  fetchWineTerrestrialDataCount,
} from '@/lib/supabase/database/uaps';
import { parseUAPSConfig, getTCIPrior, calculateArrheniusFRI, calculateHenryBRI } from '@/lib/utils/uaps-engine';

interface UAPSState {
  // 제품
  agingProducts: AgingProduct[];
  selectedProductId: string | null;

  // 예측
  predictions: AgingPrediction[];
  latestPrediction: AgingPrediction | null;

  // 모델 상태
  modelStatus: ModelStatus;
  modelLastTrained: string | null;
  modelDataCount: number;
  modelGroupCount: number;

  // 설정
  config: ParsedUAPSConfig;
  rawConfig: UAPSConfig[];

  // UI 상태
  isLoading: boolean;
  isTraining: boolean;
  isPredicting: boolean;
  error: string | null;

  // 제품 액션
  loadAgingProducts: () => Promise<void>;
  addAgingProduct: (input: ProductInput) => Promise<AgingProduct | null>;
  editAgingProduct: (id: string, updates: Partial<ProductInput> & { status?: string }) => Promise<void>;
  removeAgingProduct: (id: string) => Promise<void>;
  selectProduct: (id: string | null) => void;

  // 예측 액션
  loadPredictions: (productId?: string) => Promise<void>;
  runPrediction: (productId: string, months: number, depth?: number) => Promise<AgingPrediction | null>;

  // 모델 액션
  loadModelStatus: () => Promise<void>;
  trainModel: () => Promise<void>;

  // 설정 액션
  loadConfig: () => Promise<void>;
  updateCoefficient: (key: string, value: number) => Promise<void>;

  // 유틸
  clearError: () => void;
}

export const useUAPSStore = create<UAPSState>((set, get) => ({
  // 초기 상태
  agingProducts: [],
  selectedProductId: null,
  predictions: [],
  latestPrediction: null,
  modelStatus: 'untrained',
  modelLastTrained: null,
  modelDataCount: 0,
  modelGroupCount: 0,
  config: {
    tci: DEFAULT_COEFFICIENTS.tci,
    fri: DEFAULT_COEFFICIENTS.fri,
    bri: DEFAULT_COEFFICIENTS.bri,
    tciMeta: getTCIPrior(),
    friMeta: calculateArrheniusFRI(),
    briMeta: calculateHenryBRI(),
    stageThresholds: { youthful: 3, developing: 7, mature: 15 },
    riskThresholds: { offFlavor: 70, optimalQuality: 80 },
  },
  rawConfig: [],
  isLoading: false,
  isTraining: false,
  isPredicting: false,
  error: null,

  // ═══════════════════════════════════════════════════════════════════
  // 제품 관리
  // ═══════════════════════════════════════════════════════════════════

  loadAgingProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const products = await fetchAgingProducts();
      set({ agingProducts: products || [], isLoading: false });
    } catch (error) {
      storeLogger.error('UAPS: 제품 로드 실패:', error);
      set({ error: '제품 목록을 불러오는데 실패했습니다.', isLoading: false });
    }
  },

  addAgingProduct: async (input) => {
    set({ error: null });
    try {
      const created = await createAgingProduct(input);
      if (created) {
        set((state) => ({
          agingProducts: [created, ...state.agingProducts],
        }));
        return created;
      }
      set({ error: '제품 등록에 실패했습니다.' });
      return null;
    } catch (error) {
      storeLogger.error('UAPS: 제품 추가 실패:', error);
      set({ error: '제품 등록 중 오류가 발생했습니다.' });
      return null;
    }
  },

  editAgingProduct: async (id, updates) => {
    set({ error: null });
    try {
      const updated = await updateAgingProduct(id, updates);
      if (updated) {
        set((state) => ({
          agingProducts: state.agingProducts.map((p) =>
            p.id === id ? updated : p
          ),
        }));
      }
    } catch (error) {
      storeLogger.error('UAPS: 제품 수정 실패:', error);
      set({ error: '제품 수정에 실패했습니다.' });
    }
  },

  removeAgingProduct: async (id) => {
    set({ error: null });
    try {
      const success = await deleteAgingProduct(id);
      if (success) {
        set((state) => ({
          agingProducts: state.agingProducts.filter((p) => p.id !== id),
          selectedProductId: state.selectedProductId === id ? null : state.selectedProductId,
        }));
      }
    } catch (error) {
      storeLogger.error('UAPS: 제품 삭제 실패:', error);
      set({ error: '제품 삭제에 실패했습니다.' });
    }
  },

  selectProduct: (id) => {
    set({ selectedProductId: id, latestPrediction: null });
    if (id) {
      get().loadPredictions(id);
    }
  },

  // ═══════════════════════════════════════════════════════════════════
  // 예측
  // ═══════════════════════════════════════════════════════════════════

  loadPredictions: async (productId?) => {
    set({ isLoading: true, error: null });
    try {
      const predictions = await fetchAgingPredictions(productId, 20);
      set({
        predictions: predictions || [],
        latestPrediction: predictions?.[0] || null,
        isLoading: false,
      });
    } catch (error) {
      storeLogger.error('UAPS: 예측 결과 로드 실패:', error);
      set({ error: '예측 결과를 불러오는데 실패했습니다.', isLoading: false });
    }
  },

  runPrediction: async (productId, months, depth) => {
    set({ isPredicting: true, error: null });
    try {
      const response = await fetch('/api/uaps/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          underseaDurationMonths: months,
          agingDepth: depth,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '예측 실행 실패');
      }

      const data = await response.json();
      const prediction = data.prediction as AgingPrediction;

      set((state) => ({
        predictions: [prediction, ...state.predictions],
        latestPrediction: prediction,
        isPredicting: false,
      }));

      return prediction;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI 예측 중 오류가 발생했습니다.';
      storeLogger.error('UAPS: 예측 실행 실패:', error);
      set({ error: message, isPredicting: false });
      return null;
    }
  },

  // ═══════════════════════════════════════════════════════════════════
  // 모델 학습
  // ═══════════════════════════════════════════════════════════════════

  loadModelStatus: async () => {
    try {
      const [models, dataCount] = await Promise.all([
        fetchTerrestrialModels(),
        fetchWineTerrestrialDataCount(),
      ]);

      const modelList = models || [];
      const hasModels = modelList.length > 0;
      const lastTrained = hasModels
        ? modelList.reduce((latest, m) =>
            m.computedAt > latest ? m.computedAt : latest, ''
          )
        : null;

      set({
        modelStatus: hasModels ? 'trained' : 'untrained',
        modelLastTrained: lastTrained,
        modelDataCount: dataCount,
        modelGroupCount: modelList.length,
      });
    } catch (error) {
      storeLogger.error('UAPS: 모델 상태 조회 실패:', error);
    }
  },

  trainModel: async () => {
    set({ isTraining: true, error: null, modelStatus: 'training' });
    try {
      const response = await fetch('/api/uaps/model/train', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '모델 학습 실패');
      }

      const data = await response.json();

      set({
        isTraining: false,
        modelStatus: 'trained',
        modelLastTrained: data.timestamp,
        modelDataCount: data.totalData,
        modelGroupCount: data.modelsCreated,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '모델 학습 중 오류가 발생했습니다.';
      storeLogger.error('UAPS: 모델 학습 실패:', error);
      set({ error: message, isTraining: false, modelStatus: 'untrained' });
    }
  },

  // ═══════════════════════════════════════════════════════════════════
  // 설정
  // ═══════════════════════════════════════════════════════════════════

  loadConfig: async () => {
    try {
      const configs = await fetchUAPSConfig();
      if (configs) {
        const parsed = parseUAPSConfig(configs);
        set({ config: parsed, rawConfig: configs });
      }
    } catch (error) {
      storeLogger.error('UAPS: 설정 로드 실패:', error);
    }
  },

  updateCoefficient: async (key, value) => {
    set({ error: null });
    try {
      const success = await updateUAPSConfigValue(key, String(value));
      if (success) {
        // 설정 다시 로드
        await get().loadConfig();
      }
    } catch (error) {
      storeLogger.error('UAPS: 설정 업데이트 실패:', error);
      set({ error: '설정 저장에 실패했습니다.' });
    }
  },

  // ═══════════════════════════════════════════════════════════════════
  // 유틸
  // ═══════════════════════════════════════════════════════════════════

  clearError: () => set({ error: null }),
}));
