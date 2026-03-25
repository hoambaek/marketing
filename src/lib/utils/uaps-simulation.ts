/**
 * UAPS v5.0 — 가상 인양 데이터 생성기
 *
 * 예측값에 정규분포 노이즈를 추가하여 가상 인양 데이터를 생성.
 * 베이지안 업데이트 엔진과 연동하여 모델 검증 시뮬레이션에 사용.
 */

import type { AgingPrediction, RetrievalResult } from '@/lib/types/uaps';

/**
 * Box-Muller 변환으로 정규분포 난수 생성
 */
function gaussianRandom(mean: number = 0, stdDev: number = 1): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

/**
 * 값에 정규분포 노이즈를 추가하고 범위를 클램핑
 */
function addNoise(value: number | null, noiseLevel: number): number | null {
  if (value === null) return null;
  const noise = gaussianRandom(0, value * noiseLevel);
  return Math.round(Math.min(100, Math.max(0, value + noise)) * 10) / 10;
}

/**
 * 예측 결과에 노이즈를 추가하여 가상 인양 데이터를 생성
 *
 * @param prediction - 기존 예측 결과
 * @param noiseLevel - 노이즈 수준 (0.1 = 10% 랜덤 편차)
 * @returns 가상 인양 결과 (id, createdAt 제외)
 */
export function generateSimulatedRetrieval(
  prediction: AgingPrediction,
  noiseLevel: number = 0.1
): Omit<RetrievalResult, 'id' | 'createdAt'> {
  const today = new Date().toISOString().split('T')[0];

  return {
    productId: prediction.productId || '',
    retrievalDate: today,
    actualDurationMonths: prediction.underseaDurationMonths,
    actualFruity: addNoise(prediction.predictedFruity, noiseLevel),
    actualFloralMineral: addNoise(prediction.predictedFloralMineral, noiseLevel),
    actualYeastyAutolytic: addNoise(prediction.predictedYeastyAutolytic, noiseLevel),
    actualAcidityFreshness: addNoise(prediction.predictedAcidityFreshness, noiseLevel),
    actualBodyTexture: addNoise(prediction.predictedBodyTexture, noiseLevel),
    actualFinishComplexity: addNoise(prediction.predictedFinishComplexity, noiseLevel),
    actualOverallQuality: addNoise(prediction.overallQualityScore, noiseLevel),
    terrestrialFruity: null,
    terrestrialFloralMineral: null,
    terrestrialYeastyAutolytic: null,
    terrestrialAcidityFreshness: null,
    terrestrialBodyTexture: null,
    terrestrialFinishComplexity: null,
    terrestrialOverallQuality: null,
    tastingPanelSize: 1,
    tastingNotes: `시뮬레이션 생성 (노이즈 수준: ${(noiseLevel * 100).toFixed(0)}%)`,
    isSimulated: true,
    predictionId: prediction.id,
  };
}

/**
 * 여러 노이즈 수준으로 N개의 가상 인양 데이터를 배치 생성
 */
export function generateSimulatedRetrievalBatch(
  prediction: AgingPrediction,
  count: number = 5,
  noiseLevel: number = 0.1
): Omit<RetrievalResult, 'id' | 'createdAt'>[] {
  return Array.from({ length: count }, () =>
    generateSimulatedRetrieval(prediction, noiseLevel)
  );
}

/**
 * 예측 vs 실측 오차 계산 (RMSE, MAE)
 */
export function calculatePredictionError(
  prediction: AgingPrediction,
  retrieval: RetrievalResult
): {
  rmse: number;
  mae: number;
  axisErrors: Record<string, { predicted: number; actual: number; error: number }>;
} {
  const axes = [
    { key: 'fruity', predicted: prediction.predictedFruity, actual: retrieval.actualFruity },
    { key: 'floralMineral', predicted: prediction.predictedFloralMineral, actual: retrieval.actualFloralMineral },
    { key: 'yeastyAutolytic', predicted: prediction.predictedYeastyAutolytic, actual: retrieval.actualYeastyAutolytic },
    { key: 'acidityFreshness', predicted: prediction.predictedAcidityFreshness, actual: retrieval.actualAcidityFreshness },
    { key: 'bodyTexture', predicted: prediction.predictedBodyTexture, actual: retrieval.actualBodyTexture },
    { key: 'finishComplexity', predicted: prediction.predictedFinishComplexity, actual: retrieval.actualFinishComplexity },
  ];

  const errors: number[] = [];
  const axisErrors: Record<string, { predicted: number; actual: number; error: number }> = {};

  for (const { key, predicted, actual } of axes) {
    if (predicted !== null && actual !== null) {
      const err = predicted - actual;
      errors.push(err);
      axisErrors[key] = {
        predicted,
        actual,
        error: Math.round(err * 10) / 10,
      };
    }
  }

  const n = errors.length || 1;
  const rmse = Math.sqrt(errors.reduce((sum, e) => sum + e * e, 0) / n);
  const mae = errors.reduce((sum, e) => sum + Math.abs(e), 0) / n;

  return {
    rmse: Math.round(rmse * 100) / 100,
    mae: Math.round(mae * 100) / 100,
    axisErrors,
  };
}
