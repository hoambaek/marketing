/**
 * UAPS (Undersea Aging Predictive System) 타입 정의
 *
 * 해저 숙성 예측 시스템의 전체 타입, 인터페이스, 상수
 */

// ═══════════════════════════════════════════════════════════════════════════
// 유니온 타입
// ═══════════════════════════════════════════════════════════════════════════

export type WineType = 'blanc_de_blancs' | 'blanc_de_noirs' | 'rose' | 'blend' | 'vintage';

export type AgingStage = 'youthful' | 'developing' | 'mature' | 'aged';

export type DataSource = 'vivino' | 'cellartracker' | 'decanter' | 'internal_tasting' | 'manual_entry' | 'csv_import' | 'huggingface';

export type FlavorCategory = 'fruit' | 'floral' | 'yeast' | 'nutty' | 'spice' | 'mineral' | 'oxidative' | 'off_flavor';

export type ReductionPotential = 'low' | 'medium' | 'high';

export type ProductStatus = 'planned' | 'immersed' | 'harvested';

export type ModelStatus = 'untrained' | 'training' | 'trained';

// ═══════════════════════════════════════════════════════════════════════════
// 인터페이스
// ═══════════════════════════════════════════════════════════════════════════

// 지상 숙성 기초 데이터 (AI 학습용)
export interface WineTerrestrialData {
  id: string;
  wineName: string;
  producer: string | null;
  vintage: number | null;
  wineType: WineType;
  // 물리화학
  ph: number | null;
  dosage: number | null;
  alcohol: number | null;
  acidity: number | null;
  reductionPotential: ReductionPotential | null;
  // 풍미 프로파일 (0-100) — WSET/OIV 6축
  fruityScore: number | null;
  floralMineralScore: number | null;
  yeastyAutolyticScore: number | null;
  acidityFreshnessScore: number | null;
  bodyTextureScore: number | null;
  finishComplexityScore: number | null;
  // 숙성
  agingYears: number | null;
  agingStage: AgingStage | null;
  drinkingWindowStart: number | null;
  drinkingWindowEnd: number | null;
  // 출처
  dataSource: DataSource;
  reviewText: string | null;
  rating: number | null;
  // 메타
  createdAt: string;
  updatedAt: string;
}

// AI 학습 결과
export interface TerrestrialModel {
  id: string;
  wineType: WineType;
  agingStage: AgingStage;
  sampleCount: number;
  flavorProfileJson: unknown;
  physicochemicalStatsJson: unknown;
  transitionCurvesJson: unknown;
  clusterCentroidsJson: unknown;
  drinkingWindowStatsJson: unknown;
  confidenceScore: number;
  computedAt: string;
  createdAt: string;
  updatedAt: string;
}

// 숙성 제품
export interface AgingProduct {
  id: string;
  productName: string;
  wineType: WineType;
  vintage: number | null;
  producer: string;
  // 물리화학
  ph: number | null;
  dosage: number | null;
  alcohol: number | null;
  acidity: number | null;
  reductionPotential: ReductionPotential;
  reductionChecks: Record<string, boolean> | null;
  // 숙성 조건
  immersionDate: string | null;
  plannedDurationMonths: number | null;
  agingDepth: number;
  // 상태
  status: ProductStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// AI 예측 결과
export interface AgingPrediction {
  id: string;
  productId: string | null;
  // 입력
  wineType: WineType;
  inputPh: number | null;
  inputDosage: number | null;
  inputReductionPotential: string | null;
  underseaDurationMonths: number;
  agingDepth: number;
  immersionDate: string | null;
  // 예측 풍미 — WSET/OIV 6축
  predictedFruity: number | null;
  predictedFloralMineral: number | null;
  predictedYeastyAutolytic: number | null;
  predictedAcidityFreshness: number | null;
  predictedBodyTexture: number | null;
  predictedFinishComplexity: number | null;
  // 품질 점수
  textureMaturityScore: number | null;
  aromaFreshnessScore: number | null;
  offFlavorRiskScore: number | null;
  overallQualityScore: number | null;
  // 최적 윈도우
  optimalHarvestStartMonths: number | null;
  optimalHarvestEndMonths: number | null;
  harvestRecommendation: string | null;
  // AI 인사이트
  aiInsightText: string | null;
  aiRiskWarning: string | null;
  // 전문가 프로파일 (Google Search grounding)
  expertProfileJson: Record<string, number> | null;
  expertSources: string[] | null;
  // 보정 계수
  tciApplied: number;
  friApplied: number;
  briApplied: number;
  predictionConfidence: number;
  // 메타
  createdAt: string;
}

// 풍미 사전
export interface FlavorDictionary {
  id: string;
  expertTerm: string;
  consumerKeywords: string[];
  associatedStage: AgingStage | null;
  flavorCategory: FlavorCategory;
  tciWeight: number;
  friWeight: number;
  createdAt: string;
}

// 시스템 설정
export interface UAPSConfig {
  id: string;
  configKey: string;
  configValue: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 폼/입력 타입
// ═══════════════════════════════════════════════════════════════════════════

// 제품 등록 입력
export interface ProductInput {
  productName: string;
  wineType: WineType;
  vintage: number | null;
  producer: string;
  ph: number | null;
  dosage: number | null;
  alcohol: number | null;
  acidity: number | null;
  reductionPotential: ReductionPotential;
  reductionChecks: Record<string, boolean> | null;
  immersionDate: string | null;
  plannedDurationMonths: number | null;
  agingDepth: number;
  notes: string | null;
}

// 예측 실행 입력
export interface PredictionInput {
  productId: string;
  underseaDurationMonths: number;
  agingDepth: number;
}

// 레이더 차트용
export interface FlavorRadarData {
  axis: string;
  current: number;
  predicted: number;
}

// 타임라인 차트용
export interface TimelineDataPoint {
  month: number;
  textureMaturity: number;
  aromaFreshness: number;
  offFlavorRisk: number;
  bubbleRefinement: number;
}

// 계수 메타데이터 (과학적 근거 추적)
export type CoefficientSource = 'hypothesis' | 'literature' | 'arrhenius' | 'henrys_law' | 'experiment';

export interface CoefficientMeta {
  value: number;
  lower95: number;        // 95% CI 하한
  upper95: number;        // 95% CI 상한
  source: CoefficientSource;
  sourceDescription: string;  // 근거 요약 (한 줄)
  references: string[];       // 논문/법칙 참조
}

// 파싱된 설정 (config 테이블 → 구조화)
export interface ParsedUAPSConfig {
  tci: number;
  fri: number;
  bri: number;
  tciMeta: CoefficientMeta;
  friMeta: CoefficientMeta;
  briMeta: CoefficientMeta;
  stageThresholds: {
    youthful: number;
    developing: number;
    mature: number;
  };
  riskThresholds: {
    offFlavor: number;
    optimalQuality: number;
  };
}

// 지상 데이터 필터
export interface TerrestrialDataFilters {
  wineType?: WineType;
  agingStage?: AgingStage;
  dataSource?: DataSource;
  limit?: number;
  offset?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// 라벨 상수
// ═══════════════════════════════════════════════════════════════════════════

export const WINE_TYPE_LABELS: Record<WineType, string> = {
  blanc_de_blancs: 'Blanc de Blancs',
  blanc_de_noirs: 'Blanc de Noirs',
  rose: 'Rosé',
  blend: 'Blend',
  vintage: 'Vintage',
};

export const AGING_STAGE_LABELS: Record<AgingStage, string> = {
  youthful: '청년기 (Youthful)',
  developing: '발전기 (Developing)',
  mature: '성숙기 (Mature)',
  aged: '노화기 (Aged)',
};

export const DATA_SOURCE_LABELS: Record<DataSource, string> = {
  vivino: 'Vivino',
  cellartracker: 'CellarTracker',
  decanter: 'Decanter',
  internal_tasting: '내부 시음',
  manual_entry: '수동 입력',
  csv_import: 'CSV 가져오기',
  huggingface: 'HuggingFace',
};

export const FLAVOR_CATEGORY_LABELS: Record<FlavorCategory, string> = {
  fruit: '과일',
  floral: '꽃',
  yeast: '효모',
  nutty: '견과류',
  spice: '향신료',
  mineral: '미네랄',
  oxidative: '산화',
  off_flavor: '결함',
};

export const REDUCTION_POTENTIAL_LABELS: Record<ReductionPotential, string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
};

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  planned: '투하 예정',
  immersed: '숙성 중',
  harvested: '인양 완료',
};

export const PRODUCT_STATUS_COLORS: Record<ProductStatus, string> = {
  planned: 'text-blue-400',
  immersed: 'text-cyan-400',
  harvested: 'text-amber-400',
};

export const MODEL_STATUS_LABELS: Record<ModelStatus, string> = {
  untrained: '미학습',
  training: '학습 중',
  trained: '학습 완료',
};

// 풍미 축 라벨 (레이더 차트용) — WSET/OIV 검증 6축
export const FLAVOR_AXES = [
  { key: 'fruity', label: '과실향', color: '#fde047' },
  { key: 'floralMineral', label: '플로럴·미네랄', color: '#a78bfa' },
  { key: 'yeastyAutolytic', label: '효모·숙성향', color: '#d4a574' },
  { key: 'acidityFreshness', label: '산도·상쾌함', color: '#22d3ee' },
  { key: 'bodyTexture', label: '바디감·질감', color: '#fb923c' },
  { key: 'finishComplexity', label: '여운·복합미', color: '#f472b6' },
] as const;

// 기본 보정 계수 (과학적 도출값)
export const DEFAULT_COEFFICIENTS = {
  tci: 0.3,   // 가설적 추정 — 실험 데이터 필요
  fri: 0.56,  // 아레니우스 방정식: Ea=47kJ/mol, 4°C/12°C 속도비
  bri: 1.6,   // 헨리의 법칙: 수심 30m CO2 압력 구배 + 용해도 보정
} as const;
