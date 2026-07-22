/**
 * UAPS 전통주(약주·청주) 타임라인 엔진 — dose 구동 모델
 *
 * 샴페인 엔진(uaps-engine.ts)은 무탄산 발효주에 안 맞는다(기포·타닌·환원취·CO2).
 * 약주는 성숙을 "개월"이 아니라 "누적 열노출량(thermal dose)"의 함수로 계산한다.
 *
 * dose(m) = Σ 아레니우스속도(저층수온ₘ) × Δt  (10°C 등가 개월로 정규화)
 * 침지월부터 실제 계절 수온 경로를 적분하므로, 같은 개월이라도 겨울/여름 침지가
 * 다른 dose·다른 피크를 갖는다(계절 자동 전이).
 *
 * 설계: docs/plans/musedemaree/2026-07-22-yakju-timeline-model-design.md
 * status: uncertain (도메인 추론 기반 가설, 다중 시점 실측 전까지 미확정)
 */

import type {
  AgingProduct,
  ParsedUAPSConfig,
  AgingFactors,
  QualityWeights,
  TimelineDataPoint,
} from '@/lib/types/uaps';
import { CATEGORY_EA_MAP } from '@/lib/types/uaps';
import {
  type MonthlyOceanProfile,
  getMonthlyProfile,
  estimateBottomTemperature,
} from '@/lib/utils/uaps-ocean-profile';
import {
  generateTimelineData as generateTimelineDataChampagne,
  calculateOptimalHarvestWindow as calculateOptimalHarvestWindowChampagne,
} from '@/lib/utils/uaps-engine';

const R = 8.314; // 기체 상수 J/(mol·K)
const T_REF_C = 10; // dose 정규화 기준 수온 (°C)

// ═══════════════════════════════════════════════════════════════════════════
// 약주 성숙 파라미터 (Phase 1 도메인 시드값)
// ═══════════════════════════════════════════════════════════════════════════

export interface YakjuAgingParams {
  kEster: number;   // 향 복합성(에스테르) 포화속도
  kUmami: number;   // 감칠맛·바디(아미노) 포화속도
  dOverripe: number; // 과숙(메일라드·노화취) 임계 dose ← 최우선 학습 대상
  sOverripe: number; // 과숙 급격도
  dSpoil: number;   // 산패(초산) 임계 dose (후기)
  sSpoil: number;   // 산패 급격도
  wEster: number;   // 종합 가중치 — 향
  wUmami: number;   // 종합 가중치 — 감칠맛
  wOverripe: number; // 종합 가중치 — 과숙(손실)
  wSpoil: number;   // 종합 가중치 — 산패(손실)
}

// 약주 매트릭스 물성값. dOverripe(과숙 임계 dose)는 관측 배치로 보정한다.
// dOverripe=3.75 : 지란지교 2026-01 침지 배치(관측 최적 3개월)에 맞춰 캘리브레이션.
//   피크=3은 저장 상수가 아니라, 이 임계에서 각 제품의 dose 경로로 argmax를 계산해 나오는 값이다.
//   (겨울 침지 3개월 = 여름 침지 2개월처럼 계절에 따라 피크가 자동 이동)
// 나머지 파라미터는 도메인 추론 시드값. 다중 시점 실측 전까지 status uncertain.
export const DEFAULT_YAKJU_PARAMS: YakjuAgingParams = {
  kEster: 0.9,
  kUmami: 0.7,
  dOverripe: 3.75,
  sOverripe: 1.6,
  dSpoil: 6.0,
  sSpoil: 1.2,
  wEster: 0.30,
  wUmami: 0.35,
  wOverripe: 0.28,
  wSpoil: 0.07,
};

// 타임라인 4슬롯의 카테고리별 라벨 (툴팁·범례 단일 소스)
// 슬롯→약주축 매핑: textureMaturity=향(이득,녹), bubbleRefinement=감칠맛(이득,녹),
//                   aromaFreshness=과숙(손실,적), offFlavorRisk=산패(손실,적)
export function getTimelineAxisLabels(category?: string | null): {
  textureMaturity: string; bubbleRefinement: string; aromaFreshness: string; offFlavorRisk: string;
} {
  return isFermentedCategory(category)
    ? { textureMaturity: '향', bubbleRefinement: '감칠맛', aromaFreshness: '과숙', offFlavorRisk: '산패' }
    : { textureMaturity: '질감', bubbleRefinement: '기포', aromaFreshness: '향 감쇠', offFlavorRisk: '환원취' };
}

// 종합점수 정규화 오프셋: Qraw 범위 대략 [-wLoss·100, +wGain·100] → 0~100으로 이동
// (affine 변환이라 argmax=피크 위치는 보존됨)
const COMPOSITE_OFFSET = 35;

// 약주 타임라인 표시·탐색 범위 (개월). 약주는 수개월 내 성숙하므로 12개월로 한정
// (샴페인 36개월과 달리 — 대표 지시 2026-07-22). 피크는 저온 겨울 침지 기준 2~3개월.
const YAKJU_MAX_MONTHS = 12;

/** 이 카테고리가 dose 구동 발효주 모델을 쓰는가 (Phase 1: 약주만) */
export function isFermentedCategory(category?: string | null): boolean {
  return ['yakju_cheongju'].includes(category ?? '');
}

// ═══════════════════════════════════════════════════════════════════════════
// dose 경로
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 침지월부터 1~maxMonths 각 월의 누적 dose 배열 반환 (10°C 등가 개월)
 * 해양 프로파일이 없으면 10°C 평탄 가정 → dose = 경과 개월(계절 무시 폴백)
 */
export function computeDosePath(
  product: AgingProduct,
  monthlyOceanProfiles?: MonthlyOceanProfile[],
  immersionMonth?: number,
  maxMonths = 36,
): number[] {
  const category = (product.productCategory || 'yakju_cheongju') as string;
  const eaEntry = CATEGORY_EA_MAP[category];
  const ea = eaEntry ? eaEntry.ea * 1000 : 40000;
  const depth = product.agingDepth ?? 30;

  const rate = (tempC: number) => Math.exp(-ea / (R * (tempC + 273.15)));
  const refRate = rate(T_REF_C);

  const hasOcean = !!(monthlyOceanProfiles && monthlyOceanProfiles.length > 0 && immersionMonth);
  const path: number[] = [];
  let cum = 0;
  for (let m = 1; m <= maxMonths; m += 1) {
    let monthRate = 1; // 폴백: 10°C 등가
    if (hasOcean) {
      const calendarMonth = ((immersionMonth! - 1 + m - 1) % 12) + 1;
      const sst = getMonthlyProfile(monthlyOceanProfiles!, calendarMonth).seaTemperatureAvg;
      const bottomTemp = estimateBottomTemperature(sst, depth, calendarMonth);
      monthRate = rate(bottomTemp) / refRate;
    }
    cum += monthRate;
    path.push(cum);
  }
  return path;
}

// ═══════════════════════════════════════════════════════════════════════════
// 약주 4축 곡선
// ═══════════════════════════════════════════════════════════════════════════

interface YakjuAxes {
  aroma: number;    // 향 복합성 (이득)
  umami: number;    // 감칠맛·바디 (이득)
  overripe: number; // 과숙 (손실)
  spoil: number;    // 산패 (손실)
  qRaw: number;     // 종합 원점수 (argmax용)
}

function evalAxes(D: number, p: YakjuAgingParams): YakjuAxes {
  const aroma = 100 * (1 - Math.exp(-p.kEster * D));
  const umami = 100 * (1 - Math.exp(-p.kUmami * D));
  const overripe = 100 / (1 + Math.exp(-p.sOverripe * (D - p.dOverripe)));
  const spoil = 100 / (1 + Math.exp(-p.sSpoil * (D - p.dSpoil)));
  const qRaw = p.wEster * aroma + p.wUmami * umami - p.wOverripe * overripe - p.wSpoil * spoil;
  return { aroma, umami, overripe, spoil, qRaw };
}

const round1 = (x: number) => Math.round(x * 10) / 10;
const clamp = (x: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, x));

// ═══════════════════════════════════════════════════════════════════════════
// 타임라인 (차트용) — 샴페인과 동일한 반환 shape 유지
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 약주 타임라인. TimelineDataPoint의 기존 4슬롯에 약주 4축을 매핑한다.
 * (색상 정합: 녹색 슬롯=이득, 적색 슬롯=손실)
 *   textureMaturity  ← 향 복합성(aroma)    [녹색·이득]
 *   bubbleRefinement ← 감칠맛·바디(umami)   [녹색·이득]
 *   aromaFreshness   ← 과숙(overripe)       [적색·손실]
 *   offFlavorRisk    ← 산패(spoil)          [적색·손실]
 * TimelineChart는 카테고리별 라벨맵으로 이 슬롯들을 재명명한다.
 */
export function generateTimelineDataYakju(
  product: AgingProduct,
  _config: ParsedUAPSConfig,
  _agingFactors?: AgingFactors,
  _qualityWeights?: QualityWeights,
  monthlyOceanProfiles?: MonthlyOceanProfile[],
  immersionMonth?: number,
): (TimelineDataPoint & { compositeQuality: number; gainScore: number; lossScore: number; netBenefit: number })[] {
  const p = DEFAULT_YAKJU_PARAMS;
  const dose = computeDosePath(product, monthlyOceanProfiles, immersionMonth, YAKJU_MAX_MONTHS);
  const points: (TimelineDataPoint & { compositeQuality: number; gainScore: number; lossScore: number; netBenefit: number })[] = [];

  for (let m = 1; m <= YAKJU_MAX_MONTHS; m += 1) {
    const a = evalAxes(dose[m - 1], p);
    const compositeQuality = round1(clamp(a.qRaw + COMPOSITE_OFFSET));
    const gainScore = round1((p.wEster * a.aroma + p.wUmami * a.umami) / (p.wEster + p.wUmami));
    const lossScore = round1((p.wOverripe * a.overripe + p.wSpoil * a.spoil) / (p.wOverripe + p.wSpoil));
    const netBenefit = round1(gainScore - lossScore);

    points.push({
      month: m,
      textureMaturity: round1(a.aroma),   // 향
      bubbleRefinement: round1(a.umami),  // 감칠맛
      aromaFreshness: round1(a.overripe), // 과숙
      offFlavorRisk: round1(a.spoil),     // 산패
      compositeQuality,
      gainScore,
      lossScore,
      netBenefit,
    });
  }
  return points;
}

// ═══════════════════════════════════════════════════════════════════════════
// 최적 인양 시기 (dose 기반 피크)
// ═══════════════════════════════════════════════════════════════════════════

export function calculateOptimalHarvestWindowYakju(
  product: AgingProduct,
  _config: ParsedUAPSConfig,
  _agingFactors?: AgingFactors,
  _qualityWeights?: QualityWeights,
  monthlyOceanProfiles?: MonthlyOceanProfile[],
  immersionMonth?: number,
): { startMonths: number; endMonths: number; peakMonth: number; peakScore: number; recommendation: string } {
  const p = DEFAULT_YAKJU_PARAMS;
  const dose = computeDosePath(product, monthlyOceanProfiles, immersionMonth, YAKJU_MAX_MONTHS);

  const scores: { month: number; score: number }[] = [];
  for (let m = 1; m <= YAKJU_MAX_MONTHS; m += 1) {
    const a = evalAxes(dose[m - 1], p);
    scores.push({ month: m, score: clamp(a.qRaw + COMPOSITE_OFFSET) });
  }

  // 피크(동점이면 이른 시점)
  let peakMonth = 1;
  let peakScore = 0;
  for (const { month, score } of scores) {
    if (round1(score) > round1(peakScore)) {
      peakScore = score;
      peakMonth = month;
    }
  }

  // 윈도우 = 피크의 95% 이상 구간
  const threshold = peakScore * 0.95;
  let startMonths = peakMonth;
  let endMonths = peakMonth;
  for (const { month, score } of scores) {
    if (score >= threshold) {
      if (month < startMonths) startMonths = month;
      if (month > endMonths) endMonths = month;
    }
  }

  const seasonNote = monthlyOceanProfiles && monthlyOceanProfiles.length > 0 && immersionMonth
    ? `${immersionMonth}월 침지 기준`
    : '계절 미반영(해양 데이터 없음)';
  const recommendation =
    `[전통주(약주·청주)] 최적 인양 시기: ${startMonths}-${endMonths}개월 ` +
    `(dose 구동, ${seasonNote}). 피크: ${peakMonth}개월 (종합 품질 ${Math.round(peakScore)}점).`;

  return { startMonths, endMonths, peakMonth, peakScore: round1(peakScore), recommendation };
}

// ═══════════════════════════════════════════════════════════════════════════
// 라우터 — 카테고리로 약주/샴페인 엔진 분기
// ═══════════════════════════════════════════════════════════════════════════

export function generateTimelineDataRouted(
  product: AgingProduct,
  config: ParsedUAPSConfig,
  agingFactors?: AgingFactors,
  qualityWeights?: QualityWeights,
  monthlyOceanProfiles?: MonthlyOceanProfile[],
  immersionMonth?: number,
) {
  if (isFermentedCategory(product.productCategory)) {
    return generateTimelineDataYakju(product, config, agingFactors, qualityWeights, monthlyOceanProfiles, immersionMonth);
  }
  return generateTimelineDataChampagne(product, config, agingFactors, qualityWeights, monthlyOceanProfiles, immersionMonth);
}

export function calculateOptimalHarvestWindowRouted(
  product: AgingProduct,
  config: ParsedUAPSConfig,
  agingFactors?: AgingFactors,
  qualityWeights?: QualityWeights,
  monthlyOceanProfiles?: MonthlyOceanProfile[],
  immersionMonth?: number,
) {
  if (isFermentedCategory(product.productCategory)) {
    return calculateOptimalHarvestWindowYakju(product, config, agingFactors, qualityWeights, monthlyOceanProfiles, immersionMonth);
  }
  return calculateOptimalHarvestWindowChampagne(product, config, agingFactors, qualityWeights, monthlyOceanProfiles, immersionMonth);
}
