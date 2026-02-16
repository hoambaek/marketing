/**
 * UAPS 예측 엔진 — Layer 1: 통계 학습
 *
 * 100K건 지상 숙성 데이터를 분석하여 AI가 참조할 기반 지식을 생성.
 * - 풍미 전이 곡선 (시그모이드 비선형 회귀)
 * - 클러스터 프로파일 (wine_type × aging_stage)
 * - TCI/FRI/BRI 보정 계산
 * - Golden Window (Pareto 최적화)
 */

import type {
  WineTerrestrialData,
  TerrestrialModel,
  AgingProduct,
  WineType,
  AgingStage,
  ReductionPotential,
  TimelineDataPoint,
  ParsedUAPSConfig,
  CoefficientMeta,
} from '@/lib/types/uaps';
import { DEFAULT_COEFFICIENTS } from '@/lib/types/uaps';

// ═══════════════════════════════════════════════════════════════════════════
// 과학적 계수 계산
// ═══════════════════════════════════════════════════════════════════════════

const R = 8.314; // 기체 상수 J/(mol·K)

/**
 * 아레니우스 방정식 기반 FRI 계산
 *
 * k(T) = A × exp(-Ea / RT)
 * FRI = k(T_ocean) / k(T_cellar) = exp[(-Ea/R) × (1/T_ocean - 1/T_cellar)]
 *
 * @param oceanTempC 해저 온도 (°C), 기본 4°C
 * @param cellarTempC 지상 셀러 온도 (°C), 기본 12°C
 * @param activationEnergy 활성화 에너지 (J/mol), 기본 47,000 (안토시아닌 분해)
 */
export function calculateArrheniusFRI(
  oceanTempC: number = 4,
  cellarTempC: number = 12,
  activationEnergy: number = 47000
): CoefficientMeta {
  const tOcean = oceanTempC + 273.15; // K
  const tCellar = cellarTempC + 273.15; // K

  const exponent = (-activationEnergy / R) * (1 / tOcean - 1 / tCellar);
  const fri = Math.exp(exponent);

  // 95% CI: Ea 불확실성 ±5 kJ/mol (문헌 범위 42-52 kJ/mol)
  const eaLow = activationEnergy - 5000;
  const eaHigh = activationEnergy + 5000;
  const friLow = Math.exp((-eaHigh / R) * (1 / tOcean - 1 / tCellar));
  const friHigh = Math.exp((-eaLow / R) * (1 / tOcean - 1 / tCellar));

  return {
    value: Math.round(fri * 1000) / 1000,
    lower95: Math.round(friLow * 1000) / 1000,
    upper95: Math.round(friHigh * 1000) / 1000,
    source: 'arrhenius',
    sourceDescription: `아레니우스 방정식 (Ea=${activationEnergy / 1000}kJ/mol, ${oceanTempC}°C/${cellarTempC}°C)`,
    references: [
      'Arrhenius, S. (1889). On the reaction velocity of the inversion of cane sugar by acids.',
      'PMC11202423 — Anthocyanin degradation kinetics in wine (Ea=42-52 kJ/mol)',
    ],
  };
}

/**
 * 헨리의 법칙 기반 BRI 계산
 *
 * CO2 손실 구동력 = P_bottle - P_external
 * 지상: 6 bar - 1 bar = 5 bar (구동력)
 * 해저: 6 bar - (1 + depth/10) bar (수압 보정)
 *
 * CO2 용해도 보정: kH(4°C) / kH(12°C) ≈ 1.25
 *
 * BRI = 지상 CO2 보존율 / 해저 CO2 보존율 > 1 (해저가 유리)
 *
 * @param depthM 수심 (m), 기본 30m
 * @param oceanTempC 해저 온도, 기본 4°C
 * @param cellarTempC 지상 온도, 기본 12°C
 */
export function calculateHenryBRI(
  depthM: number = 30,
  oceanTempC: number = 4,
  cellarTempC: number = 12
): CoefficientMeta {
  const pBottle = 6; // bar (샴페인 내부 압력)

  // 지상 CO2 구동력
  const pExtLand = 1; // bar (대기압)
  const drivingForceLand = pBottle - pExtLand; // 5 bar

  // 해저 CO2 구동력 (수압 = 1 + depth/10 bar)
  const pExtOcean = 1 + depthM / 10;
  const drivingForceOcean = Math.max(0.1, pBottle - pExtOcean);

  // 압력 기반 보존비
  const pressureRatio = drivingForceLand / drivingForceOcean;

  // CO2 용해도 온도 보정 (헨리 상수 비율)
  // kH는 온도가 낮을수록 증가 → 저온에서 CO2가 더 잘 녹아 손실 감소
  // 경험적 근사: kH(T) 비율 ≈ 1 + 0.03 × (cellarT - oceanT)
  const solubilityCorrection = 1 + 0.03 * (cellarTempC - oceanTempC);

  const bri = pressureRatio * solubilityCorrection;

  // 95% CI: 수심 ±5m, 온도 ±2°C 불확실성
  const briLow = calculateHenryBRIRaw(depthM - 5, oceanTempC + 2, cellarTempC - 2);
  const briHigh = calculateHenryBRIRaw(depthM + 5, oceanTempC - 2, cellarTempC + 2);

  return {
    value: Math.round(bri * 100) / 100,
    lower95: Math.round(Math.min(briLow, briHigh) * 100) / 100,
    upper95: Math.round(Math.max(briLow, briHigh) * 100) / 100,
    source: 'henrys_law',
    sourceDescription: `헨리의 법칙 (수심 ${depthM}m, CO2 압력 구배 + 용해도 보정)`,
    references: [
      "Henry, W. (1803). Experiments on the quantity of gases absorbed by water.",
      'Liger-Belair, G. (2005). The physics and chemistry behind the bubbling properties of champagne.',
    ],
  };
}

/** BRI 원시 계산 (CI 계산용 내부 함수) */
function calculateHenryBRIRaw(depthM: number, oceanTempC: number, cellarTempC: number): number {
  const pBottle = 6;
  const drivingForceLand = pBottle - 1;
  const drivingForceOcean = Math.max(0.1, pBottle - (1 + depthM / 10));
  const pressureRatio = drivingForceLand / drivingForceOcean;
  const solubilityCorrection = 1 + 0.03 * (cellarTempC - oceanTempC);
  return pressureRatio * solubilityCorrection;
}

/**
 * TCI 문헌 기반 사전 분포
 * 자체 실험 데이터가 없으므로 넓은 불확실성으로 표시
 */
export function getTCIPrior(): CoefficientMeta {
  return {
    value: 0.3,
    lower95: 0.06,
    upper95: 0.54,
    source: 'hypothesis',
    sourceDescription: '문헌 기반 가설적 추정 (실험 검증 필요)',
    references: [
      '해저 숙성 질감 가속에 대한 직접적 선행 연구 없음',
      '유사 연구: 온도/압력에 따른 효모 자가분해 속도 변화 (간접 추론)',
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 통계 학습 (trainTerrestrialModel)
// ═══════════════════════════════════════════════════════════════════════════

interface FlavorStats {
  mean: number;
  median: number;
  stdDev: number;
  p25: number;
  p75: number;
  count: number;
}

interface GroupStats {
  wineType: WineType;
  agingStage: AgingStage;
  sampleCount: number;
  flavorProfile: Record<string, FlavorStats>;
  physicochemicalStats: {
    ph: FlavorStats;
    dosage: FlavorStats;
    alcohol: FlavorStats;
  };
  transitionCurves: Record<string, { year: number; value: number }[]>;
  clusterCentroids: { ph: number; dosage: number; reduction: string; count: number }[];
  drinkingWindowStats: { start: FlavorStats; end: FlavorStats };
  confidenceScore: number;
}

const FLAVOR_KEYS = [
  'citrusScore', 'greenAppleScore', 'briocheScore', 'yeastScore',
  'honeyScore', 'nuttyScore', 'toastScore', 'oxidationScore',
] as const;

type FlavorKey = typeof FLAVOR_KEYS[number];

/**
 * 지상 데이터 전체를 wine_type × aging_stage 그룹별로 집계
 */
export function trainTerrestrialModel(
  data: WineTerrestrialData[]
): Omit<TerrestrialModel, 'id' | 'createdAt' | 'updatedAt'>[] {
  const groups = groupByTypeAndStage(data);
  const results: Omit<TerrestrialModel, 'id' | 'createdAt' | 'updatedAt'>[] = [];

  for (const [key, records] of Object.entries(groups)) {
    const [wineType, agingStage] = key.split('::') as [WineType, AgingStage];
    if (records.length < 5) continue; // 최소 5건 이상

    const stats = computeGroupStats(wineType, agingStage, records, data);

    results.push({
      wineType: stats.wineType,
      agingStage: stats.agingStage,
      sampleCount: stats.sampleCount,
      flavorProfileJson: stats.flavorProfile,
      physicochemicalStatsJson: stats.physicochemicalStats,
      transitionCurvesJson: stats.transitionCurves,
      clusterCentroidsJson: stats.clusterCentroids,
      drinkingWindowStatsJson: stats.drinkingWindowStats,
      confidenceScore: stats.confidenceScore,
      computedAt: new Date().toISOString(),
    });
  }

  return results;
}

function groupByTypeAndStage(
  data: WineTerrestrialData[]
): Record<string, WineTerrestrialData[]> {
  const groups: Record<string, WineTerrestrialData[]> = {};
  for (const d of data) {
    const stage = d.agingStage || inferAgingStage(d.agingYears);
    const key = `${d.wineType}::${stage}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(d);
  }
  return groups;
}

function inferAgingStage(agingYears: number | null): AgingStage {
  if (agingYears === null) return 'developing';
  if (agingYears <= 3) return 'youthful';
  if (agingYears <= 7) return 'developing';
  if (agingYears <= 15) return 'mature';
  return 'aged';
}

function computeGroupStats(
  wineType: WineType,
  agingStage: AgingStage,
  records: WineTerrestrialData[],
  allData: WineTerrestrialData[]
): GroupStats {
  // 풍미 프로파일 통계
  const flavorProfile: Record<string, FlavorStats> = {};
  for (const key of FLAVOR_KEYS) {
    const values = records
      .map((r) => r[key] as number | null)
      .filter((v): v is number => v !== null);
    flavorProfile[key] = computeStats(values);
  }

  // 물리화학 통계
  const phValues = records.map((r) => r.ph).filter((v): v is number => v !== null);
  const dosageValues = records.map((r) => r.dosage).filter((v): v is number => v !== null);
  const alcoholValues = records.map((r) => r.alcohol).filter((v): v is number => v !== null);

  // 풍미 전이 곡선 (해당 wine_type의 전체 데이터에서 연수별 추이 계산)
  const typeData = allData.filter((d) => d.wineType === wineType);
  const transitionCurves = computeTransitionCurves(typeData);

  // 클러스터 중심점 (pH × dosage × reduction 조합)
  const clusterCentroids = computeClusterCentroids(records);

  // 음용 적기 분포
  const dwStart = records.map((r) => r.drinkingWindowStart).filter((v): v is number => v !== null);
  const dwEnd = records.map((r) => r.drinkingWindowEnd).filter((v): v is number => v !== null);

  // 신뢰도 = min(sampleCount / 100, 1.0)
  const confidenceScore = Math.min(records.length / 100, 1.0);

  return {
    wineType,
    agingStage,
    sampleCount: records.length,
    flavorProfile,
    physicochemicalStats: {
      ph: computeStats(phValues),
      dosage: computeStats(dosageValues),
      alcohol: computeStats(alcoholValues),
    },
    transitionCurves,
    clusterCentroids,
    drinkingWindowStats: {
      start: computeStats(dwStart),
      end: computeStats(dwEnd),
    },
    confidenceScore,
  };
}

function computeStats(values: number[]): FlavorStats {
  if (values.length === 0) {
    return { mean: 0, median: 0, stdDev: 0, p25: 0, p75: 0, count: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((s, v) => s + v, 0) / n;
  const variance = sorted.reduce((s, v) => s + (v - mean) ** 2, 0) / n;

  return {
    mean: Math.round(mean * 100) / 100,
    median: sorted[Math.floor(n / 2)],
    stdDev: Math.round(Math.sqrt(variance) * 100) / 100,
    p25: sorted[Math.floor(n * 0.25)],
    p75: sorted[Math.floor(n * 0.75)],
    count: n,
  };
}

function computeTransitionCurves(
  typeData: WineTerrestrialData[]
): Record<string, { year: number; value: number }[]> {
  const curves: Record<string, { year: number; value: number }[]> = {};

  for (const key of FLAVOR_KEYS) {
    const yearMap = new Map<number, number[]>();

    for (const d of typeData) {
      const year = Math.round(d.agingYears || 0);
      const value = d[key] as number | null;
      if (value === null || year <= 0) continue;

      if (!yearMap.has(year)) yearMap.set(year, []);
      yearMap.get(year)!.push(value);
    }

    const points: { year: number; value: number }[] = [];
    for (const [year, values] of yearMap.entries()) {
      const avg = values.reduce((s, v) => s + v, 0) / values.length;
      points.push({ year, value: Math.round(avg * 10) / 10 });
    }

    curves[key] = points.sort((a, b) => a.year - b.year);
  }

  return curves;
}

function computeClusterCentroids(
  records: WineTerrestrialData[]
): { ph: number; dosage: number; reduction: string; count: number }[] {
  // pH × dosage × reduction 조합으로 그룹화
  const clusters = new Map<string, { phSum: number; dosageSum: number; count: number }>();

  for (const r of records) {
    const phBucket = r.ph ? Math.round(r.ph * 10) / 10 : 3.1; // 0.1 단위
    const dosageBucket = r.dosage ? Math.round(r.dosage / 3) * 3 : 8; // 3g/L 단위
    const reduction = r.reductionPotential || 'low';
    const key = `${phBucket}::${dosageBucket}::${reduction}`;

    const existing = clusters.get(key) || { phSum: 0, dosageSum: 0, count: 0 };
    existing.phSum += r.ph || phBucket;
    existing.dosageSum += r.dosage || dosageBucket;
    existing.count += 1;
    clusters.set(key, existing);
  }

  return Array.from(clusters.entries())
    .map(([key, v]) => {
      const [, , reduction] = key.split('::');
      return {
        ph: Math.round((v.phSum / v.count) * 100) / 100,
        dosage: Math.round((v.dosageSum / v.count) * 10) / 10,
        reduction,
        count: v.count,
      };
    })
    .sort((a, b) => b.count - a.count);
}

// ═══════════════════════════════════════════════════════════════════════════
// 유사 클러스터 매칭
// ═══════════════════════════════════════════════════════════════════════════

export interface ClusterMatch {
  model: TerrestrialModel;
  similarity: number;
}

/**
 * 입력 제품과 가장 유사한 학습 모델 클러스터를 찾음
 */
export function findSimilarClusters(
  product: AgingProduct,
  models: TerrestrialModel[],
  topK: number = 5
): ClusterMatch[] {
  const scored = models.map((model) => {
    let similarity = 0;

    // 와인 타입 일치: +50점
    if (model.wineType === product.wineType) {
      similarity += 50;
    }

    // pH 근접도: 최대 +20점 (차이 0 = 20점, 차이 0.5 이상 = 0점)
    if (product.ph !== null) {
      const centroids = model.clusterCentroidsJson as unknown as { ph: number }[];
      if (Array.isArray(centroids) && centroids.length > 0) {
        const closestPh = centroids.reduce((closest, c) =>
          Math.abs(c.ph - product.ph!) < Math.abs(closest.ph - product.ph!) ? c : closest
        );
        const phDiff = Math.abs(closestPh.ph - product.ph);
        similarity += Math.max(0, 20 - phDiff * 40);
      }
    }

    // dosage 근접도: 최대 +15점
    if (product.dosage !== null) {
      const centroids = model.clusterCentroidsJson as unknown as { dosage: number }[];
      if (Array.isArray(centroids) && centroids.length > 0) {
        const closestDosage = centroids.reduce((closest, c) =>
          Math.abs(c.dosage - product.dosage!) < Math.abs(closest.dosage - product.dosage!) ? c : closest
        );
        const dosageDiff = Math.abs(closestDosage.dosage - product.dosage);
        similarity += Math.max(0, 15 - dosageDiff * 1.5);
      }
    }

    // 샘플 수 보너스: 최대 +15점
    similarity += Math.min(model.sampleCount / 100, 1) * 15;

    return { model, similarity };
  });

  return scored
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

// ═══════════════════════════════════════════════════════════════════════════
// 보정 계수 계산
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 질감 성숙도 계산 (TCI 적용)
 * 해저에서 질감 숙성이 1/TCI 배 가속
 */
export function calculateTextureMaturity(
  landAgingYears: number,
  underseaMonths: number,
  tci: number = DEFAULT_COEFFICIENTS.tci
): number {
  // 해저 숙성을 지상 환산: underseaMonths / (12 * tci)
  const equivalentLandYears = landAgingYears + (underseaMonths / (12 * tci));

  // 시그모이드 곡선: 0-100
  // 3y = ~60, 7y = ~92, 15y = ~100
  const score = 100 / (1 + Math.exp(-0.8 * (equivalentLandYears - 4)));

  return Math.round(Math.min(100, Math.max(0, score)) * 10) / 10;
}

/**
 * 향 신선도 계산 (FRI 적용)
 * 해저에서 산화 진행이 FRI배 속도 (0.5 = 50% 감속)
 */
export function calculateAromaFreshness(
  landAgingYears: number,
  underseaMonths: number,
  fri: number = DEFAULT_COEFFICIENTS.fri
): number {
  // 해저 숙성의 산화 환산: underseaMonths * fri / 12
  const totalOxidationYears = landAgingYears + (underseaMonths * fri / 12);

  // 감소 곡선: 100에서 시작, 연수에 따라 점진 감소
  // 5y = ~90, 10y = ~50, 15y+ = 점진 감소
  const score = 100 * Math.exp(-0.06 * totalOxidationYears);

  return Math.round(Math.min(100, Math.max(0, score)) * 10) / 10;
}

/**
 * 기포 미세화 점수 계산 (BRI 적용)
 *
 * 해저 환경에서 기포가 미세화되는 과정을 모델링:
 * - 외부 수압이 CO₂ 손실 구동력을 감소 → 용존 CO₂ 안정화
 * - 저온에서 CO₂ 용해도 증가 → 기포 핵(nucleation site) 균질화
 * - 장기간 안정 환경 → CO₂ 분자 재배열(physical stabilization)
 *
 * 결과: 기포 입자가 작고 조밀해지며, 입안에서 크리미한 질감 형성
 *
 * 모델: 로그 성장 곡선 — 초기 급속 개선 후 점차 포화
 * score = baseScore + (100 - baseScore) × (1 - exp(-rate × months)) × bri_factor
 */
export function calculateBubbleRefinement(
  underseaMonths: number,
  depthM: number = 30,
  bri: number = DEFAULT_COEFFICIENTS.bri
): number {
  // 지상 기포 기본 품질 (거칠고 불균일)
  const baseScore = 40;

  // BRI 기반 개선 속도: BRI가 높을수록 빠르게 미세화
  // 수심이 깊을수록 외부 압력 ↑ → CO₂ 안정화 ↑
  const depthFactor = Math.min(depthM / 30, 1.5); // 30m 기준 정규화
  const rate = 0.08 * (bri / 1.6) * depthFactor;

  // 로그 성장: 초반 급격히 개선, 이후 수렴
  const improvement = (100 - baseScore) * (1 - Math.exp(-rate * underseaMonths));
  const score = baseScore + improvement;

  return Math.round(Math.min(100, Math.max(0, score)) * 10) / 10;
}

/**
 * Off-flavor 리스크 계산
 */
export function calculateOffFlavorRisk(
  reductionPotential: ReductionPotential,
  underseaMonths: number,
  textureScore: number
): number {
  let risk = 10; // 기본 리스크

  // 환원 성향에 따른 기본 리스크
  if (reductionPotential === 'high') risk += 40;
  else if (reductionPotential === 'medium') risk += 20;

  // 장기 숙성 추가 리스크 (24개월 초과부터)
  if (underseaMonths > 24) {
    risk += (underseaMonths - 24) * 2;
  }

  // 질감 성숙도가 매우 높으면 환원 결함 감소 (성숙한 와인은 안정적)
  if (textureScore > 85) {
    risk -= 10;
  }

  return Math.round(Math.min(100, Math.max(0, risk)) * 10) / 10;
}

// ═══════════════════════════════════════════════════════════════════════════
// Golden Window (최적 인양 시기)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pareto 최적화로 최적 인양 시기 산출
 * 질감 성숙도 ≥ 80 && 향 신선도 ≥ 70인 교차 구간
 */
export function calculateOptimalHarvestWindow(
  product: AgingProduct,
  config: ParsedUAPSConfig
): { startMonths: number; endMonths: number; recommendation: string } {
  const reductionPotential = product.reductionPotential || 'low';
  let startMonths = 0;
  let endMonths = 0;

  // 6-36개월 범위에서 질감/향 점수 계산
  for (let m = 6; m <= 36; m += 1) {
    const texture = calculateTextureMaturity(0, m, config.tci);
    const aroma = calculateAromaFreshness(0, m, config.fri);
    const risk = calculateOffFlavorRisk(reductionPotential, m, texture);

    const meetsTexture = texture >= config.riskThresholds.optimalQuality;
    const meetsAroma = aroma >= 70;
    const acceptableRisk = risk < config.riskThresholds.offFlavor;

    if (meetsTexture && meetsAroma && acceptableRisk) {
      if (startMonths === 0) startMonths = m;
      endMonths = m;
    }
  }

  // 윈도우가 없으면 기본 12-18개월
  if (startMonths === 0) {
    startMonths = 12;
    endMonths = 18;
  }

  const recommendation = generateRecommendation(startMonths, endMonths, reductionPotential);

  return { startMonths, endMonths, recommendation };
}

function generateRecommendation(
  start: number,
  end: number,
  reduction: ReductionPotential
): string {
  const midpoint = Math.round((start + end) / 2);

  if (reduction === 'high') {
    return `최적 인양 시기: ${start}-${end}개월. 환원 성향이 높아 ${Math.min(end, start + 6)}개월 이내 인양을 권장합니다.`;
  }

  if (end - start >= 12) {
    return `최적 인양 시기: ${start}-${end}개월. 넓은 Golden Window로 유연한 인양이 가능합니다. 추천: ${midpoint}개월.`;
  }

  return `최적 인양 시기: ${start}-${end}개월. 최적 시점: ${midpoint}개월.`;
}

// ═══════════════════════════════════════════════════════════════════════════
// 타임라인 데이터 생성 (차트용)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 6-36개월 범위의 월별 타임라인 데이터 생성
 */
export function generateTimelineData(
  product: AgingProduct,
  config: ParsedUAPSConfig
): TimelineDataPoint[] {
  const reductionPotential = product.reductionPotential || 'low';
  const points: TimelineDataPoint[] = [];

  for (let m = 6; m <= 36; m += 1) {
    const textureMaturity = calculateTextureMaturity(0, m, config.tci);
    const aromaFreshness = calculateAromaFreshness(0, m, config.fri);
    const offFlavorRisk = calculateOffFlavorRisk(reductionPotential, m, textureMaturity);
    const bubbleRefinement = calculateBubbleRefinement(m, product.agingDepth, config.bri);

    points.push({ month: m, textureMaturity, aromaFreshness, offFlavorRisk, bubbleRefinement });
  }

  return points;
}

// ═══════════════════════════════════════════════════════════════════════════
// 설정 파싱 헬퍼
// ═══════════════════════════════════════════════════════════════════════════

/**
 * UAPSConfig[] → ParsedUAPSConfig 변환 (과학적 메타데이터 포함)
 */
export function parseUAPSConfig(
  configs: { configKey: string; configValue: string }[]
): ParsedUAPSConfig {
  const map = new Map(configs.map((c) => [c.configKey, c.configValue]));

  const tci = parseFloat(map.get('tci_coefficient') || String(DEFAULT_COEFFICIENTS.tci));
  const fri = parseFloat(map.get('fri_coefficient') || String(DEFAULT_COEFFICIENTS.fri));
  const bri = parseFloat(map.get('bri_coefficient') || String(DEFAULT_COEFFICIENTS.bri));

  // 과학적 메타데이터 생성
  const tciMeta = getTCIPrior();
  tciMeta.value = tci;

  const friMeta = calculateArrheniusFRI();
  friMeta.value = fri; // DB 값으로 오버라이드 (사용자 조정 가능)

  const briMeta = calculateHenryBRI();
  briMeta.value = bri;

  return {
    tci,
    fri,
    bri,
    tciMeta,
    friMeta,
    briMeta,
    stageThresholds: {
      youthful: parseInt(map.get('stage_threshold_youthful') || '3'),
      developing: parseInt(map.get('stage_threshold_developing') || '7'),
      mature: parseInt(map.get('stage_threshold_mature') || '15'),
    },
    riskThresholds: {
      offFlavor: parseInt(map.get('risk_threshold_off_flavor') || '70'),
      optimalQuality: parseInt(map.get('quality_threshold_optimal') || '80'),
    },
  };
}

/**
 * 풍미 예측 (통계 기반 — Layer 1만 사용하는 fallback)
 * 매칭된 클러스터의 풍미 프로파일을 TCI/FRI로 보정
 */
export function predictFlavorProfileStatistical(
  clusters: ClusterMatch[],
  underseaMonths: number,
  config: ParsedUAPSConfig
): Record<string, number> {
  if (clusters.length === 0) {
    return { citrus: 50, brioche: 30, honey: 20, nutty: 15, toast: 10, oxidation: 5 };
  }

  // 가중 평균 (similarity 기반)
  const totalWeight = clusters.reduce((s, c) => s + c.similarity, 0);
  const flavorKeys = ['citrusScore', 'briocheScore', 'honeyScore', 'nuttyScore', 'toastScore', 'oxidationScore'];
  const outputKeys = ['citrus', 'brioche', 'honey', 'nutty', 'toast', 'oxidation'];
  const result: Record<string, number> = {};

  // 1단계: 클러스터 가중 평균 계산
  const rawValues: Record<string, number> = {};
  for (let i = 0; i < flavorKeys.length; i++) {
    let weightedSum = 0;

    for (const cluster of clusters) {
      const profile = cluster.model.flavorProfileJson as Record<string, FlavorStats>;
      const stats = profile[flavorKeys[i]];
      if (stats?.mean !== undefined) {
        weightedSum += stats.mean * cluster.similarity;
      }
    }

    rawValues[outputKeys[i]] = totalWeight > 0 ? weightedSum / totalWeight : 50;
  }

  // 2단계: 비례 스케일링 — 최대값을 65~80 범위로 정규화하여 의미 있는 프로파일 생성
  // (클러스터 평균은 원래 낮은 경향이 있으므로 상대적 비율을 유지하면서 스케일업)
  const maxRaw = Math.max(...Object.values(rawValues), 1);
  const targetMax = Math.min(80, Math.max(65, maxRaw)); // 이미 충분히 크면 유지
  const scaleFactor = maxRaw < 40 ? targetMax / maxRaw : 1;

  for (let i = 0; i < flavorKeys.length; i++) {
    let baseValue = rawValues[outputKeys[i]] * scaleFactor;

    // TCI/FRI 보정 적용
    const monthFactor = underseaMonths / 12;

    if (outputKeys[i] === 'citrus') {
      // FRI로 보존: 해저에서 감소 속도 지연 (감쇠율 완화)
      baseValue *= Math.exp(-0.015 * underseaMonths * config.fri);
    } else if (outputKeys[i] === 'brioche' || outputKeys[i] === 'nutty') {
      // TCI로 가속: 해저에서 발전 가속
      baseValue += monthFactor * (1 / config.tci) * 3;
    } else if (outputKeys[i] === 'honey' || outputKeys[i] === 'toast') {
      // 장기 숙성 효과
      baseValue += monthFactor * 2.5;
    } else if (outputKeys[i] === 'oxidation') {
      // FRI로 지연
      baseValue += monthFactor * config.fri * 1.5;
    }

    result[outputKeys[i]] = Math.round(Math.min(100, Math.max(0, baseValue)) * 10) / 10;
  }

  return result;
}
