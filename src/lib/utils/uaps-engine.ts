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
  ProductCategory,
  ReductionPotential,
  TimelineDataPoint,
  ParsedUAPSConfig,
  CoefficientMeta,
  AgingFactors,
  QualityWeights,
} from '@/lib/types/uaps';
import {
  DEFAULT_COEFFICIENTS,
  DEFAULT_AGING_FACTORS,
  DEFAULT_QUALITY_WEIGHTS,
  PRODUCT_CATEGORY_LABELS,
} from '@/lib/types/uaps';

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
  productCategory: ProductCategory;
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
  'fruityScore', 'floralMineralScore', 'yeastyAutolyticScore',
  'acidityFreshnessScore', 'bodyTextureScore', 'finishComplexityScore',
] as const;

type FlavorKey = typeof FLAVOR_KEYS[number];

/**
 * 지상 데이터 전체를 product_category × aging_stage 그룹별로 집계
 * (기존 wine_type 기반에서 product_category 기반으로 전환)
 */
export function trainTerrestrialModel(
  data: WineTerrestrialData[]
): Omit<TerrestrialModel, 'id' | 'createdAt' | 'updatedAt'>[] {
  const groups = groupByCategoryAndStage(data);
  const results: Omit<TerrestrialModel, 'id' | 'createdAt' | 'updatedAt'>[] = [];

  for (const [key, records] of Object.entries(groups)) {
    const [productCategory, agingStage] = key.split('::') as [ProductCategory, AgingStage];
    if (records.length < 5) continue; // 최소 5건 이상

    // wineType은 그룹 내 최빈값 사용 (하위 호환)
    const wineType = getMostFrequentWineType(records);
    const stats = computeGroupStats(wineType, agingStage, records, data, productCategory);

    results.push({
      wineType: stats.wineType,
      productCategory: stats.productCategory,
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

function groupByCategoryAndStage(
  data: WineTerrestrialData[]
): Record<string, WineTerrestrialData[]> {
  const groups: Record<string, WineTerrestrialData[]> = {};
  for (const d of data) {
    const stage = d.agingStage || inferAgingStage(d.agingYears);
    const category = d.productCategory || 'champagne';
    const key = `${category}::${stage}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(d);
  }
  return groups;
}

function getMostFrequentWineType(records: WineTerrestrialData[]): WineType {
  const counts = new Map<string, number>();
  for (const r of records) {
    counts.set(r.wineType, (counts.get(r.wineType) || 0) + 1);
  }
  let maxType = 'blend';
  let maxCount = 0;
  for (const [type, count] of counts) {
    if (count > maxCount) { maxType = type; maxCount = count; }
  }
  return maxType as WineType;
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
  allData: WineTerrestrialData[],
  productCategory: ProductCategory = 'champagne'
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

  // 풍미 전이 곡선 (해당 productCategory의 전체 데이터에서 연수별 추이 계산)
  const typeData = allData.filter((d) => (d.productCategory || 'champagne') === productCategory);
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
    productCategory,
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
 * productCategory 기반 매칭 (wine 계열 보너스 포함)
 */
export function findSimilarClusters(
  product: AgingProduct,
  models: TerrestrialModel[],
  topK: number = 5
): ClusterMatch[] {
  const productCategory = (product.productCategory || 'champagne') as ProductCategory;

  const scored = models.map((model) => {
    let similarity = 0;

    // productCategory 일치: +50점
    if (model.productCategory === productCategory) {
      similarity += 50;
    } else {
      // wine 계열 보너스: champagne 제품이 다른 wine 모델과도 부분 매칭
      const wineCategories = ['champagne'];
      if (wineCategories.includes(productCategory) && wineCategories.includes(model.productCategory)) {
        similarity += 30;
      }
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

  // 시그모이드 곡선: 0-100 (샴페인 맥락 최적화)
  // 중점 4.5년, 기울기 0.6 → 36개월 전 구간에서 점진적 변화 유지
  // baseAging=2.0 + 6m → ~40, +12m → ~54, +18m → ~66, +24m → ~76, +36m → ~88
  const score = 100 / (1 + Math.exp(-0.6 * (equivalentLandYears - 4.5)));

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
  // 3y = ~74, 5y = ~61, 10y = ~37 — 36개월에서 50-60대 하락
  const score = 100 * Math.exp(-0.10 * totalOxidationYears);

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
  // 기본 환원 리스크 (투하 직후부터 존재)
  const baseRisk: Record<ReductionPotential, number> = {
    low: 5,
    medium: 10,
    high: 20,
  };
  let risk = baseRisk[reductionPotential];

  // 시간 경과에 따른 점진적 리스크 증가 (1개월부터)
  // 시그모이드 기반: 초기 완만 → 변곡점 이후 가속
  const maxAdditional = reductionPotential === 'high' ? 40 : reductionPotential === 'medium' ? 30 : 20;
  const inflection = reductionPotential === 'high' ? 15 : reductionPotential === 'medium' ? 18 : 22;
  const rate = 0.2;
  risk += maxAdditional / (1 + Math.exp(-rate * (underseaMonths - inflection)));

  // 질감 성숙도 보정: 성숙한 와인은 환원 결함 감소
  if (textureScore > 70) {
    risk *= 1 - (textureScore - 70) / 200; // 최대 15% 감소
  }

  return Math.round(Math.min(100, Math.max(0, risk)) * 10) / 10;
}

// ═══════════════════════════════════════════════════════════════════════════
// 복합 품질 점수 (Composite Quality)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 종합 품질 점수 산출
 * qualityWeights 파라미터로 카테고리별 가중치 주입 (없으면 DEFAULT 사용)
 */
export function calculateCompositeQuality(
  texture: number,
  aroma: number,
  bubble: number,
  risk: number,
  _wineType: string | null,
  qualityWeights?: QualityWeights
): number {
  const w = qualityWeights || DEFAULT_QUALITY_WEIGHTS;
  const riskScore = Math.max(0, 100 - risk);

  // 기본 가중 평균
  const base = texture * w.texture + aroma * w.aroma + bubble * w.bubble + riskScore * w.risk;

  // 해저 숙성 시너지 보정: 모든 요소가 고르게 높을 때 추가 보너스
  // 균형도(harmony) = 최솟값/최댓값 비율 (1에 가까울수록 균형적)
  const scores = [texture, aroma, bubble, riskScore];
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const harmony = maxScore > 0 ? minScore / maxScore : 0;

  // 평균 수준이 60 이상이고 균형도가 0.5 이상일 때 시너지 발동
  // 최대 +15점 보너스 (평균 높을수록 · 균형적일수록 보너스 증가)
  const avgScore = (texture + aroma + bubble + riskScore) / 4;
  let synergyBonus = 0;
  if (avgScore > 60 && harmony > 0.5) {
    const avgFactor = Math.min((avgScore - 60) / 30, 1);    // 60→0, 90→1
    const harmonyFactor = (harmony - 0.5) / 0.5;            // 0.5→0, 1.0→1
    synergyBonus = 15 * avgFactor * harmonyFactor;
  }

  return Math.round(Math.min(100, base + synergyBonus) * 10) / 10;
}

// ═══════════════════════════════════════════════════════════════════════════
// Golden Window (최적 인양 시기)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 복합 품질 점수 기반 최적 인양 시기 산출
 * 1. 6-36개월 각 월별 종합 품질 계산
 * 2. 피크 월 찾기
 * 3. 윈도우 = 피크의 90% 이상인 구간
 * 4. 제품별 보정 (reductionPotential 등)
 */
export function calculateOptimalHarvestWindow(
  product: AgingProduct,
  config: ParsedUAPSConfig,
  agingFactors?: AgingFactors,
  qualityWeights?: QualityWeights
): { startMonths: number; endMonths: number; peakMonth: number; peakScore: number; recommendation: string } {
  const reductionPotential = product.reductionPotential || 'low';
  const af = agingFactors || DEFAULT_AGING_FACTORS;
  const baseAging = (product.terrestrialAgingYears != null && product.terrestrialAgingYears > 0)
    ? product.terrestrialAgingYears
    : af.baseAgingYears;

  // 6-36개월 각 월별 복합 품질 계산
  const monthlyScores: { month: number; score: number }[] = [];
  for (let m = 1; m <= 36; m += 1) {
    const texture = calculateTextureMaturity(baseAging, m, config.tci * af.textureMult);
    const aroma = calculateAromaFreshness(baseAging, m, config.fri * af.aromaDecay);
    const bubble = calculateBubbleRefinement(m, product.agingDepth, config.bri);
    const risk = calculateOffFlavorRisk(reductionPotential, m, texture) * af.riskMult;

    const score = calculateCompositeQuality(texture, aroma, bubble, risk, product.wineType, qualityWeights);
    monthlyScores.push({ month: m, score });
  }

  // 피크 월 찾기
  let peakMonth = 12;
  let peakScore = 0;
  for (const { month, score } of monthlyScores) {
    if (score > peakScore) {
      peakScore = score;
      peakMonth = month;
    }
  }

  // 윈도우 = 피크의 95% 이상인 구간
  const threshold = peakScore * 0.95;
  let startMonths = peakMonth;
  let endMonths = peakMonth;
  for (const { month, score } of monthlyScores) {
    if (score >= threshold) {
      if (month < startMonths) startMonths = month;
      if (month > endMonths) endMonths = month;
    }
  }

  // 최대 윈도우 폭 제한: 12개월
  if (endMonths - startMonths > 12) {
    const center = Math.round((startMonths + endMonths) / 2);
    startMonths = Math.max(1, center - 6);
    endMonths = center + 6;
  }

  // 환원 성향 보정: high → 윈도우 앞쪽으로 2개월 축소
  if (reductionPotential === 'high' && endMonths > peakMonth) {
    endMonths = Math.max(peakMonth, endMonths - 2);
  }

  const recommendation = generateRecommendation(
    startMonths, endMonths, peakMonth, peakScore, reductionPotential, product.productCategory || product.wineType || 'blend'
  );

  return { startMonths, endMonths, peakMonth, peakScore, recommendation };
}

function generateRecommendation(
  start: number,
  end: number,
  peak: number,
  peakScore: number,
  reduction: ReductionPotential,
  categoryOrType: string
): string {
  const typeLabel = PRODUCT_CATEGORY_LABELS[categoryOrType as ProductCategory] || categoryOrType;
  const windowWidth = end - start;
  const widthLabel = windowWidth >= 10 ? '넓음' : windowWidth >= 6 ? '표준' : '좁음';

  let msg = `[${typeLabel}] 최적 인양 시기: ${start}-${end}개월 (윈도우 폭: ${widthLabel}). ` +
    `피크: ${peak}개월 (종합 품질 ${Math.round(peakScore)}점).`;

  if (reduction === 'high') {
    msg += ` ⚠️ 환원 성향 높음 — ${Math.min(end, start + 4)}개월 이내 조기 인양 권장.`;
  }

  return msg;
}


// ═══════════════════════════════════════════════════════════════════════════
// 타임라인 데이터 생성 (차트용)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 6-36개월 범위의 월별 타임라인 데이터 생성
 */
export function generateTimelineData(
  product: AgingProduct,
  config: ParsedUAPSConfig,
  agingFactors?: AgingFactors,
  qualityWeights?: QualityWeights
): (TimelineDataPoint & { compositeQuality: number; gainScore: number; lossScore: number; netBenefit: number })[] {
  const reductionPotential = product.reductionPotential || 'low';
  const af = agingFactors || DEFAULT_AGING_FACTORS;
  const w = qualityWeights || DEFAULT_QUALITY_WEIGHTS;
  const baseAging = (product.terrestrialAgingYears != null && product.terrestrialAgingYears > 0)
    ? product.terrestrialAgingYears
    : af.baseAgingYears;
  const points: (TimelineDataPoint & { compositeQuality: number; gainScore: number; lossScore: number; netBenefit: number })[] = [];

  for (let m = 1; m <= 36; m += 1) {
    const textureMaturity = calculateTextureMaturity(baseAging, m, config.tci * af.textureMult);
    const aromaFreshness = calculateAromaFreshness(baseAging, m, config.fri * af.aromaDecay);
    const offFlavorRisk = calculateOffFlavorRisk(reductionPotential, m, textureMaturity) * af.riskMult;
    const bubbleRefinement = calculateBubbleRefinement(m, product.agingDepth, config.bri);

    const compositeQuality = calculateCompositeQuality(
      textureMaturity, aromaFreshness, bubbleRefinement, offFlavorRisk, product.wineType, w
    );

    // 이득: 시간이 지나면 좋아지는 요소 (질감 + 기포)의 가중 평균
    const gainScore = Math.round(
      ((textureMaturity * w.texture + bubbleRefinement * w.bubble) / (w.texture + w.bubble)) * 10
    ) / 10;

    // 손실: 시간이 지나면 나빠지는 요소 (향 감소 + 위험도)의 가중 평균
    const clampedRisk = Math.min(100, Math.max(0, offFlavorRisk));
    const lossScore = Math.round(
      (((100 - aromaFreshness) * w.aroma + clampedRisk * w.risk) / (w.aroma + w.risk)) * 10
    ) / 10;

    const netBenefit = Math.round((gainScore - lossScore) * 10) / 10;

    points.push({
      month: m,
      textureMaturity,
      aromaFreshness,
      offFlavorRisk: Math.round(Math.min(100, Math.max(0, offFlavorRisk)) * 10) / 10,
      bubbleRefinement,
      compositeQuality,
      gainScore,
      lossScore,
      netBenefit,
    });
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
  config: ParsedUAPSConfig,
  product?: AgingProduct,
  allModels?: TerrestrialModel[],
  agingFactors?: AgingFactors
): Record<string, number> {
  if (clusters.length === 0) {
    return { fruity: 60, floralMineral: 45, yeastyAutolytic: 40, acidityFreshness: 70, bodyTexture: 55, finishComplexity: 50 };
  }

  // 가중 평균 (similarity 기반)
  const totalWeight = clusters.reduce((s, c) => s + c.similarity, 0);
  const flavorKeys = ['fruityScore', 'floralMineralScore', 'yeastyAutolyticScore', 'acidityFreshnessScore', 'bodyTextureScore', 'finishComplexityScore'];
  const outputKeys = ['fruity', 'floralMineral', 'yeastyAutolytic', 'acidityFreshness', 'bodyTexture', 'finishComplexity'];
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

  // 2단계: 데이터 기반 정규화 — 클러스터 통계의 IQR(사분위범위)로 동적 스케일링
  // p25 → 35, p75 → 65 매핑: 평균적 샴페인 ≈ 50, 우수 ≈ 65+
  for (let i = 0; i < flavorKeys.length; i++) {
    let wP25 = 0, wP75 = 0, wMean = 0, wCount = 0;
    for (const cluster of clusters) {
      const profile = cluster.model.flavorProfileJson as Record<string, FlavorStats>;
      const stats = profile[flavorKeys[i]];
      if (stats && stats.count > 0 && (stats.p75 > 0 || stats.mean > 0)) {
        wP25 += stats.p25 * cluster.similarity;
        wP75 += stats.p75 * cluster.similarity;
        wMean += stats.mean * cluster.similarity;
        wCount += cluster.similarity;
      }
    }

    if (wCount > 0) {
      const p25 = wP25 / wCount;
      const p75 = wP75 / wCount;
      const iqr = p75 - p25;

      if (iqr > 0.5) {
        // IQR 매핑: p25 → 35, p75 → 65
        rawValues[outputKeys[i]] = 35 + ((rawValues[outputKeys[i]] - p25) / iqr) * 30;
      } else {
        // IQR이 너무 좁으면 mean 기준 스케일링
        const mean = wMean / wCount;
        if (mean > 0.5) {
          rawValues[outputKeys[i]] = (rawValues[outputKeys[i]] / mean) * 50;
        }
      }
    }

    rawValues[outputKeys[i]] = Math.min(100, Math.max(5, rawValues[outputKeys[i]]));
  }

  // 3단계: 데이터 부족 시 범용 기본값으로 보완 (카테고리별 특성은 AI Layer 2에서 보정)

  for (const key of outputKeys) {
    if (rawValues[key] < 15) {
      // 데이터 부족 축 → 범용 기본값(50)으로 보완
      rawValues[key] = rawValues[key] * 0.3 + 50 * 0.7;
    }
  }

  // 3.5단계: 제품 특성에 따른 프로파일 보정
  if (product) {
    // (a) 빈티지 와인 → 복합미·효모숙성·바디감 강화
    if (product.vintage) {
      const vintageAge = new Date().getFullYear() - product.vintage;
      const agingBonus = Math.min(vintageAge * 1.5, 15);
      rawValues.yeastyAutolytic += agingBonus;
      rawValues.finishComplexity += agingBonus * 0.8;
      rawValues.bodyTexture += agingBonus * 0.6;
      rawValues.fruity -= agingBonus * 0.4;
    }

    // (b) 환원 성향 반영
    if (product.reductionPotential === 'high') {
      rawValues.yeastyAutolytic += 8;
      rawValues.bodyTexture += 5;
      rawValues.finishComplexity += 6;
      rawValues.fruity -= 4;
    } else if (product.reductionPotential === 'medium') {
      rawValues.yeastyAutolytic += 4;
      rawValues.bodyTexture += 3;
      rawValues.finishComplexity += 3;
    }

    // (c) 도사주 수준 반영
    if (product.dosage !== null) {
      if (product.dosage < 6) {
        rawValues.acidityFreshness += 5;
        rawValues.floralMineral += 4;
        rawValues.bodyTexture -= 3;
      } else if (product.dosage > 12) {
        rawValues.bodyTexture += 5;
        rawValues.fruity += 4;
        rawValues.acidityFreshness -= 4;
      }
    }

    // (d) pH 반영 — 산도가 높을수록(pH↓) 상쾌함·미네랄↑
    if (product.ph !== null) {
      const phOffset = (3.1 - product.ph) * 10;
      rawValues.acidityFreshness += phOffset;
      rawValues.floralMineral += phOffset * 0.5;
    }

    // 범위 보정 (0-100 유지)
    for (const key of outputKeys) {
      rawValues[key] = Math.max(0, Math.min(100, rawValues[key]));
    }
  }

  // ─── Pseudo-cohort t=0 앵커 계산 ─────────────────────────────────────────
  // 제품의 투하 전 agingStage 클러스터 평균 = t=0 앵커
  // 예측 = t0_anchor + Δ × TCI/FRI (앵커 고정, 변화량에만 보정 적용)
  // 이 방식은 cross-sectional 편향의 절대값을 상쇄하고 변화율만 추출
  let t0Profile: Record<string, number> | null = null;
  if (allModels && allModels.length > 0 && product) {
    const af = agingFactors || DEFAULT_AGING_FACTORS;
    const baseAgingYears = (product.terrestrialAgingYears != null && product.terrestrialAgingYears > 0)
      ? product.terrestrialAgingYears
      : af.baseAgingYears;
    const t0Stage = inferAgingStage(baseAgingYears);
    const productCategory = (product.productCategory || 'champagne') as ProductCategory;
    const t0Model = allModels.find(m =>
      m.productCategory === productCategory && m.agingStage === t0Stage
    );
    if (t0Model) {
      const fp = t0Model.flavorProfileJson as Record<string, { mean: number } | undefined>;
      t0Profile = {
        fruity:           fp.fruityScore?.mean           ?? rawValues.fruity,
        floralMineral:    fp.floralMineralScore?.mean    ?? rawValues.floralMineral,
        yeastyAutolytic:  fp.yeastyAutolyticScore?.mean  ?? rawValues.yeastyAutolytic,
        acidityFreshness: fp.acidityFreshnessScore?.mean ?? rawValues.acidityFreshness,
        bodyTexture:      fp.bodyTextureScore?.mean      ?? rawValues.bodyTexture,
        finishComplexity: fp.finishComplexityScore?.mean ?? rawValues.finishComplexity,
      };
    }
  }

  for (let i = 0; i < flavorKeys.length; i++) {
    const key = outputKeys[i];
    const targetValue = rawValues[key];     // 목표 stage 클러스터 평균
    const anchorValue = t0Profile?.[key] ?? targetValue; // t=0 앵커 (없으면 target 자체)
    const delta = targetValue - anchorValue; // 숙성 단계 간 변화량
    const monthFactor = underseaMonths / 12;

    let adjustedValue: number;

    if (t0Profile) {
      // ── Pseudo-cohort 방식: 앵커 고정, Δ에만 TCI/FRI 보정 ──────────────
      let adjustedDelta = delta;
      if (key === 'fruity') {
        adjustedDelta = delta * Math.exp(-0.015 * underseaMonths * config.fri);
      } else if (key === 'floralMineral') {
        adjustedDelta = delta + monthFactor * 2.5;
      } else if (key === 'yeastyAutolytic') {
        adjustedDelta = delta + monthFactor * (1 / config.tci) * 3;
      } else if (key === 'acidityFreshness') {
        adjustedDelta = delta * Math.exp(-0.012 * underseaMonths * config.fri);
      } else if (key === 'bodyTexture') {
        adjustedDelta = delta + monthFactor * (1 / config.tci) * 2.5;
      } else if (key === 'finishComplexity') {
        adjustedDelta = delta + monthFactor * 2;
      }
      adjustedValue = anchorValue + adjustedDelta;
    } else {
      // ── 기존 방식: t=0 앵커 없을 때 폴백 ─────────────────────────────────
      let baseValue = targetValue;
      if (key === 'fruity') {
        baseValue *= Math.exp(-0.015 * underseaMonths * config.fri);
      } else if (key === 'floralMineral') {
        baseValue += monthFactor * 2.5;
      } else if (key === 'yeastyAutolytic') {
        baseValue += monthFactor * (1 / config.tci) * 3;
      } else if (key === 'acidityFreshness') {
        baseValue *= Math.exp(-0.012 * underseaMonths * config.fri);
      } else if (key === 'bodyTexture') {
        baseValue += monthFactor * (1 / config.tci) * 2.5;
      } else if (key === 'finishComplexity') {
        baseValue += monthFactor * 2;
      }
      adjustedValue = baseValue;
    }

    result[key] = Math.round(Math.min(100, Math.max(0, adjustedValue)) * 10) / 10;
  }

  return result;
}
