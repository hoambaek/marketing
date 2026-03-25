/**
 * UAPS v5.0 — 베이지안 업데이트 엔진
 *
 * Conjugate Normal-Normal 사후분포 업데이트.
 * 인양 실측 데이터(또는 시뮬레이션)로 TCI/FRI/BRI 계수를 베이지안 업데이트.
 * MCMC 불필요 — 해석적 닫힌 형태 업데이트.
 */

import type { AgingPrediction, RetrievalResult } from '@/lib/types/uaps';

// ═══════════════════════════════════════════════════════════════════════════
// 타입
// ═══════════════════════════════════════════════════════════════════════════

export interface PosteriorEstimate {
  mean: number;
  variance: number;
  n: number;             // 관측 데이터 수
  convergenceRate: number; // 분산 축소율 (0~1, 높을수록 수렴)
}

export interface CoefficientUpdate {
  prior: number;
  posterior: number;
  ci95: [number, number];   // 95% 신뢰구간
  varianceReduction: number; // 분산 축소 비율 (%)
}

export interface BayesianUpdateResult {
  tci: CoefficientUpdate;
  fri: CoefficientUpdate;
  bri: CoefficientUpdate;
  overallRMSE: number;
  overallMAE: number;
  sampleCount: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// 기본 사전분포 (정보적 사전분포 — 현재 config 기반)
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_PRIORS = {
  tci: { mean: 0.40, variance: 0.04 },  // σ² = 0.04 → σ = 0.2
  fri: { mean: 0.56, variance: 0.02 },  // σ² = 0.02 → σ = 0.14
  bri: { mean: 0.72, variance: 0.02 },  // σ² = 0.02 → σ = 0.14
} as const;

// 관측 노이즈 (시음 평가의 고유 불확실성)
const OBSERVATION_VARIANCE = 0.05; // σ²_obs = 0.05

// ═══════════════════════════════════════════════════════════════════════════
// 핵심 함수
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Conjugate Normal-Normal 사후분포 업데이트
 *
 * Prior: N(μ₀, σ₀²)
 * Likelihood: N(x | μ, σ_obs²)
 * Posterior: N(μ₁, σ₁²) where:
 *   σ₁² = 1 / (1/σ₀² + n/σ_obs²)
 *   μ₁ = σ₁² × (μ₀/σ₀² + n×x̄/σ_obs²)
 */
function updateNormalPosterior(
  prior: { mean: number; variance: number },
  observations: number[],
  obsVariance: number = OBSERVATION_VARIANCE
): PosteriorEstimate {
  const n = observations.length;
  if (n === 0) {
    return {
      mean: prior.mean,
      variance: prior.variance,
      n: 0,
      convergenceRate: 0,
    };
  }

  const xBar = observations.reduce((sum, x) => sum + x, 0) / n;

  // Precision (정밀도) 기반 업데이트
  const priorPrecision = 1 / prior.variance;
  const likelihoodPrecision = n / obsVariance;
  const posteriorPrecision = priorPrecision + likelihoodPrecision;

  const posteriorVariance = 1 / posteriorPrecision;
  const posteriorMean = posteriorVariance * (
    priorPrecision * prior.mean + likelihoodPrecision * xBar
  );

  const convergenceRate = 1 - posteriorVariance / prior.variance;

  return {
    mean: Math.round(posteriorMean * 1000) / 1000,
    variance: Math.round(posteriorVariance * 10000) / 10000,
    n,
    convergenceRate: Math.round(convergenceRate * 1000) / 1000,
  };
}

/**
 * 인양 데이터에서 보정 계수별 관측값 추출
 *
 * 각 계수의 "implied value"를 역산:
 * - TCI: 질감 변화량에서 역산 (bodyTexture 변화 / 기대 변화)
 * - FRI: 향 보존률에서 역산 (fruity 잔존률 / 기대 잔존률)
 * - BRI: 품질 변화에서 역산 (overallQuality 비율)
 */
function extractCoefficientObservations(
  retrievals: RetrievalResult[],
  predictions: AgingPrediction[]
): { tci: number[]; fri: number[]; bri: number[] } {
  const tciObs: number[] = [];
  const friObs: number[] = [];
  const briObs: number[] = [];

  const predMap = new Map(predictions.map(p => [p.id, p]));

  for (const r of retrievals) {
    if (!r.predictionId) continue;
    const pred = predMap.get(r.predictionId);
    if (!pred) continue;

    const months = r.actualDurationMonths;
    if (months <= 0) continue;

    // TCI 역산: 실측 질감 / 예측 질감 × 기존 TCI
    if (r.actualBodyTexture !== null && pred.predictedBodyTexture !== null && pred.predictedBodyTexture > 0) {
      const textureRatio = r.actualBodyTexture / pred.predictedBodyTexture;
      const impliedTci = (pred.tciApplied || 0.4) * textureRatio;
      if (impliedTci > 0.05 && impliedTci < 2.0) {
        tciObs.push(impliedTci);
      }
    }

    // FRI 역산: 실측 과실향 / 예측 과실향 × 기존 FRI
    if (r.actualFruity !== null && pred.predictedFruity !== null && pred.predictedFruity > 0) {
      const fruitRatio = r.actualFruity / pred.predictedFruity;
      const impliedFri = (pred.friApplied || 0.56) * fruitRatio;
      if (impliedFri > 0.1 && impliedFri < 1.5) {
        friObs.push(impliedFri);
      }
    }

    // BRI 역산: 종합 품질 비율에서 간접 추정
    if (r.actualOverallQuality !== null && pred.overallQualityScore !== null && pred.overallQualityScore > 0) {
      const qualityRatio = r.actualOverallQuality / pred.overallQualityScore;
      const impliedBri = (pred.briApplied || 0.72) * qualityRatio;
      if (impliedBri > 0.1 && impliedBri < 2.0) {
        briObs.push(impliedBri);
      }
    }
  }

  return { tci: tciObs, fri: friObs, bri: briObs };
}

/**
 * TCI 단일 계수 사후분포 업데이트
 */
export function updateTCIPosterior(
  prior: { mean: number; variance: number },
  retrievals: RetrievalResult[],
  predictions: AgingPrediction[]
): PosteriorEstimate {
  const { tci } = extractCoefficientObservations(retrievals, predictions);
  return updateNormalPosterior(prior, tci);
}

/**
 * 모든 계수 동시 업데이트
 */
export function updateAllCoefficients(
  retrievals: RetrievalResult[],
  predictions: AgingPrediction[],
  priors?: {
    tci?: { mean: number; variance: number };
    fri?: { mean: number; variance: number };
    bri?: { mean: number; variance: number };
  }
): BayesianUpdateResult {
  const obs = extractCoefficientObservations(retrievals, predictions);

  const tciPrior = priors?.tci || DEFAULT_PRIORS.tci;
  const friPrior = priors?.fri || DEFAULT_PRIORS.fri;
  const briPrior = priors?.bri || DEFAULT_PRIORS.bri;

  const tciPost = updateNormalPosterior(tciPrior, obs.tci);
  const friPost = updateNormalPosterior(friPrior, obs.fri);
  const briPost = updateNormalPosterior(briPrior, obs.bri);

  // 95% CI = mean ± 1.96 × σ
  const ci95 = (post: PosteriorEstimate): [number, number] => {
    const margin = 1.96 * Math.sqrt(post.variance);
    return [
      Math.round((post.mean - margin) * 1000) / 1000,
      Math.round((post.mean + margin) * 1000) / 1000,
    ];
  };

  // RMSE/MAE 계산 (전체 풍미 6축)
  const predMap = new Map(predictions.map(p => [p.id, p]));
  const allErrors: number[] = [];

  for (const r of retrievals) {
    if (!r.predictionId) continue;
    const pred = predMap.get(r.predictionId);
    if (!pred) continue;

    const pairs = [
      [pred.predictedFruity, r.actualFruity],
      [pred.predictedFloralMineral, r.actualFloralMineral],
      [pred.predictedYeastyAutolytic, r.actualYeastyAutolytic],
      [pred.predictedAcidityFreshness, r.actualAcidityFreshness],
      [pred.predictedBodyTexture, r.actualBodyTexture],
      [pred.predictedFinishComplexity, r.actualFinishComplexity],
    ];

    for (const [predicted, actual] of pairs) {
      if (predicted !== null && actual !== null) {
        allErrors.push(predicted - actual);
      }
    }
  }

  const n = allErrors.length || 1;
  const rmse = Math.sqrt(allErrors.reduce((s, e) => s + e * e, 0) / n);
  const mae = allErrors.reduce((s, e) => s + Math.abs(e), 0) / n;

  return {
    tci: {
      prior: tciPrior.mean,
      posterior: tciPost.mean,
      ci95: ci95(tciPost),
      varianceReduction: Math.round(tciPost.convergenceRate * 100),
    },
    fri: {
      prior: friPrior.mean,
      posterior: friPost.mean,
      ci95: ci95(friPost),
      varianceReduction: Math.round(friPost.convergenceRate * 100),
    },
    bri: {
      prior: briPrior.mean,
      posterior: briPost.mean,
      ci95: ci95(briPost),
      varianceReduction: Math.round(briPost.convergenceRate * 100),
    },
    overallRMSE: Math.round(rmse * 100) / 100,
    overallMAE: Math.round(mae * 100) / 100,
    sampleCount: retrievals.length,
  };
}
