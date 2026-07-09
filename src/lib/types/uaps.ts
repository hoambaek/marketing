/**
 * UAPS (Undersea Aging Predictive System) 타입 정의
 *
 * 해저 숙성 예측 시스템의 전체 타입, 인터페이스, 상수
 */

// ═══════════════════════════════════════════════════════════════════════════
// 유니온 타입
// ═══════════════════════════════════════════════════════════════════════════

export type WineType = 'blanc_de_blancs' | 'blanc_de_noirs' | 'rose' | 'blend' | 'vintage';

export type ProductCategory =
  | 'champagne'
  | 'red_wine'
  | 'white_wine'
  | 'green_coffee_bean'
  | 'sake'
  | 'whisky'
  | 'yakju_cheongju'
  | 'spirits'
  | 'puer'
  | 'soy_sauce'
  | 'vinegar'
  | 'other';

export type AgingStage = 'youthful' | 'developing' | 'mature' | 'aged';

export type DataSource = 'vivino' | 'cellartracker' | 'decanter' | 'internal_tasting' | 'manual_entry' | 'csv_import' | 'huggingface';

export type FlavorCategory = 'fruit' | 'floral' | 'yeast' | 'nutty' | 'spice' | 'mineral' | 'oxidative' | 'off_flavor';

export type ReductionPotential = 'low' | 'medium' | 'high';

export type ClosureType =
  | 'crown_cap'
  | 'cork_natural'
  | 'cork_agglomerated'
  | 'screw_cap'
  | 'glass_stopper'
  | 'wax_seal'
  | 'ceramic_cap'
  | 'none';

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
  productCategory: ProductCategory | null;
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
  agingYearsConfidence: number | null;  // 0.0~1.0 (NLP 추론 신뢰도)
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
  productCategory: ProductCategory;
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
  productCategory: string;
  wineType: WineType | null;
  vintage: number | null;
  producer: string;
  // 물리화학
  ph: number | null;
  dosage: number | null;
  alcohol: number | null;
  acidity: number | null;
  reductionPotential: ReductionPotential;
  reductionChecks: Record<string, boolean> | null;
  closureType: ClosureType;
  // 숙성 조건
  immersionDate: string | null;
  plannedDurationMonths: number | null;
  agingDepth: number;
  // 지상 숙성 이력 (투하 전)
  terrestrialAgingYears: number | null;
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
  wineType: WineType | null;
  productCategory: ProductCategory | null;
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
  aiReasoningText: string | null;
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
  // AI 추론 보정 계수
  agingFactorsJson: AgingFactors | null;
  qualityWeightsJson: QualityWeights | null;
  // 메타
  createdAt: string;
}

// 인양 비교 시음 데이터 (v5.0)
export interface RetrievalResult {
  id: string;
  productId: string;
  retrievalDate: string;
  actualDurationMonths: number;
  // 해저 숙성 시음 결과
  actualFruity: number | null;
  actualFloralMineral: number | null;
  actualYeastyAutolytic: number | null;
  actualAcidityFreshness: number | null;
  actualBodyTexture: number | null;
  actualFinishComplexity: number | null;
  actualOverallQuality: number | null;
  // 지상 보관 대조군 시음 결과
  terrestrialFruity: number | null;
  terrestrialFloralMineral: number | null;
  terrestrialYeastyAutolytic: number | null;
  terrestrialAcidityFreshness: number | null;
  terrestrialBodyTexture: number | null;
  terrestrialFinishComplexity: number | null;
  terrestrialOverallQuality: number | null;
  // 메타
  tastingPanelSize: number;
  tastingNotes: string | null;
  isSimulated: boolean;
  predictionId: string | null;
  createdAt: string;
}

// 외부 기록자 비교 시음 제출 (대기함) — 검토·승인 후 RetrievalResult로 복사됨
export type TastingSubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface TastingSubmission {
  id: string;
  predictionId: string | null;
  productId: string;
  productCategory?: string | null;  // 예측 조인 — 6축 라벨 카테고리 현지화용
  productName?: string | null;      // aging_products 조인 — 검토 화면 표시용
  productLinked?: boolean;          // product_id가 aging_products에 실존하는지 (승인 시 카테고리 귀속 가능 여부)
  // 기록자
  recorderName: string;
  recorderAffiliation: string | null;
  // 시음 메타
  retrievalDate: string | null;
  actualDurationMonths: number | null;
  tastingPanelSize: number;
  tastingNotes: string | null;
  // 해저 숙성 6축 + 종합
  actualFruity: number | null;
  actualFloralMineral: number | null;
  actualYeastyAutolytic: number | null;
  actualAcidityFreshness: number | null;
  actualBodyTexture: number | null;
  actualFinishComplexity: number | null;
  actualOverallQuality: number | null;
  // 지상 대조군 6축 + 종합
  terrestrialFruity: number | null;
  terrestrialFloralMineral: number | null;
  terrestrialYeastyAutolytic: number | null;
  terrestrialAcidityFreshness: number | null;
  terrestrialBodyTexture: number | null;
  terrestrialFinishComplexity: number | null;
  terrestrialOverallQuality: number | null;
  // 검토 상태
  status: TastingSubmissionStatus;
  reviewedAt: string | null;
  approvedRetrievalId: string | null;
  createdAt: string;
}

// 외부 시음 제출 입력 (공개 폼 → 서버)
export interface TastingSubmissionInput {
  predictionId: string;
  recorderName: string;
  recorderAffiliation?: string | null;
  retrievalDate?: string | null;
  actualDurationMonths?: number | null;
  tastingPanelSize: number;
  tastingNotes?: string | null;
  actualFruity: number | null;
  actualFloralMineral: number | null;
  actualYeastyAutolytic: number | null;
  actualAcidityFreshness: number | null;
  actualBodyTexture: number | null;
  actualFinishComplexity: number | null;
  actualOverallQuality: number | null;
  terrestrialFruity: number | null;
  terrestrialFloralMineral: number | null;
  terrestrialYeastyAutolytic: number | null;
  terrestrialAcidityFreshness: number | null;
  terrestrialBodyTexture: number | null;
  terrestrialFinishComplexity: number | null;
  terrestrialOverallQuality: number | null;
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
  productCategory: string;
  wineType: WineType | null;
  vintage: number | null;
  producer: string;
  ph: number | null;
  dosage: number | null;
  alcohol: number | null;
  acidity: number | null;
  reductionPotential: ReductionPotential;
  reductionChecks: Record<string, boolean> | null;
  closureType: ClosureType;
  immersionDate: string | null;
  plannedDurationMonths: number | null;
  agingDepth: number;
  terrestrialAgingYears: number | null;
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
  productCategory?: ProductCategory;
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

// 풍미 축 라벨 (레이더 차트용) — 샴페인 기본값 (WSET/OIV 6축)
// key/color는 6슬롯 고정, label만 카테고리별로 재정의됨 (getFlavorAxes 참조)
export const FLAVOR_AXES = [
  { key: 'fruity', label: '과실향', color: '#fde047' },
  { key: 'floralMineral', label: '플로럴·미네랄', color: '#a78bfa' },
  { key: 'yeastyAutolytic', label: '효모·숙성향', color: '#d4a574' },
  { key: 'acidityFreshness', label: '산도·상쾌함', color: '#22d3ee' },
  { key: 'bodyTexture', label: '바디감·질감', color: '#fb923c' },
  { key: 'finishComplexity', label: '여운·복합미', color: '#f472b6' },
] as const;

// 카테고리별 6축 라벨 (DB category_flavor_axes와 동기 — v2)
// 축 순서 = FLAVOR_AXES 순서(fruity_score ~ finish_complexity_score 슬롯)
export const CATEGORY_FLAVOR_LABELS: Record<string, readonly [string, string, string, string, string, string]> = {
  champagne:         ['과실향', '플로럴·미네랄', '효모·숙성향', '산도·상쾌함', '바디감·질감', '여운·복합미'],
  'champagne/wine':  ['과실향', '플로럴·미네랄', '효모·숙성향', '산도·상쾌함', '바디감·질감', '여운·복합미'],
  soy_sauce:         ['감칠맛', '짠맛', '단맛', '향(구수함)', '농후감', '여운'],
  vinegar:           ['산미', '부드러움', '향', '단맛', '바디·밀도', '여운'],
  green_coffee_bean: ['향', '산미', '바디', '단맛', '여운', '클린컵'],
  yakju_cheongju:    ['아로마', '단맛', '산미', '감칠맛', '바디감', '여운'],
  spirits:           ['곡물향', '숙성향', '순도', '단맛', '목넘김', '여운'],
  whisky:            ['몰트·곡물향', '과일·꽃향', '피트·스모크', '오크·바닐라', '바디감', '피니시'],
  sake:              ['긴조·쌀향', '단맛', '산미', '감칠맛', '바디감', '여운(키레)'],
  puer:              ['향', '쓴맛', '떫은맛', '단맛(회감)', '바디감', '여운'],
};

// 카테고리별 6축 정의 (시음 폼·레이더에서 각 축 하단 설명으로 표시)
// 축 순서 = CATEGORY_FLAVOR_LABELS와 동일
export const CATEGORY_FLAVOR_DEFINITIONS: Record<string, readonly [string, string, string, string, string, string]> = {
  yakju_cheongju: [
    '과실향·누룩향 등 향의 복합성',
    '유리당에서 오는 단맛·잔당감',
    '유기산(젖산·숙신산)의 산뜻한 신맛',
    '유리아미노산의 감칠맛·깊이(旨味)',
    '입안에서 느끼는 무게감·농순감',
    '삼킨 뒤 남는 후미·단뒷맛의 지속',
  ],
  spirits: [
    '증류 향 — 쌀·곡물의 구수함(화향)',
    '옹기·오크 숙성의 깊은 향(바닐라·나무)',
    '알코올 자극·잡향이 적고 깨끗한 정도(높을수록 순수)',
    '목넘김 후 올라오는 곡류 단맛(잔당감)',
    '삼킬 때 매끄럽게 넘어가는 부드러움',
    '날숨 시 코·입에 남는 잔향의 지속',
  ],
  whisky: [
    '맥아·시리얼의 구수한 향',
    '사과·배·시트러스·꽃 뉘앙스',
    '훈연·요오드·바다향의 강도',
    '오크통 숙성의 바닐라·나무·카라멜',
    '입안 무게감·기름진 질감',
    '삼킨 뒤 이어지는 따뜻한 여운',
  ],
  sake: [
    '멜론·바나나 긴조향, 쌀·누룩향',
    '쌀에서 오는 은은한 단맛',
    '상쾌하게 받쳐주는 신맛',
    '우마미·깊이(경수일수록 도드라짐)',
    '진하고 옅은 정도(濃淡)',
    '깔끔하게 끊기는 뒷맛(키레)',
  ],
  puer: [
    '꽃·과실·묵은(진)향의 복합성',
    '첫맛의 쌉쌀함',
    '혀를 조이는 수렴성(떫음)',
    '쓴맛 뒤 올라오는 단맛(回甘)',
    '입안의 두터움·매끄러움(순후)',
    '목넘김 후 오래 남는 기운(후운·차기)',
  ],
  soy_sauce: [
    '발효 우마미·깊이(핵심)',
    '염도·짭짤함',
    '은은한 단맛',
    '발효·볶은 곡물의 구수한 향',
    '입안 진하고 묵직한 정도(こく)',
    '뒤에 남는 감칠맛·풍미 지속',
  ],
  vinegar: [
    '신맛의 강도·원숙함',
    '코를 쏘지 않고 부드럽게 감기는 정도',
    '과실·발효·오크의 향 복합성',
    '자연스러운 단맛(발사믹 등)',
    '농도·점도(숙성 식초의 시럽감)',
    '뒤에 남는 산뜻함·풍미',
  ],
  green_coffee_bean: [
    '마른/젖은 향(프래그런스·아로마)',
    '밝고 상쾌한 신맛',
    '입안 무게감·질감',
    '자연스러운 당미',
    '삼킨 뒤 지속되는 풍미(애프터테이스트)',
    '잡맛·결점 없는 깨끗함(높을수록 좋음)',
  ],
};

// 이취·부정 축 인덱스 (0-based) — 예측 편향 방지 표기용
export const CATEGORY_NEGATIVE_AXIS: Record<string, number> = {
  // 전 카테고리 6축을 양성(높을수록 좋음)으로 통일 — 음성축 없음
  // (생두 결점도 → 클린컵↑, 증류주 타격감 → 순도↑ 등으로 반전 완료)
};

/**
 * 카테고리별 풍미 6축 반환 (key/color 고정, label만 카테고리별)
 * 미정의 카테고리는 샴페인 기본값(FLAVOR_AXES) 사용
 */
export function getFlavorAxes(category?: string | null) {
  const labels = (category && CATEGORY_FLAVOR_LABELS[category]) || null;
  const defs = (category && CATEGORY_FLAVOR_DEFINITIONS[category]) || null;
  return FLAVOR_AXES.map((axis, i) => ({
    key: axis.key,
    color: axis.color,
    label: labels ? labels[i] : axis.label,
    definition: defs ? defs[i] : null,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// AI 추론 보정 계수 인터페이스
// ═══════════════════════════════════════════════════════════════════════════

// 카테고리별 숙성 특성 계수 (AI가 실시간 추론)
export interface AgingFactors {
  baseAgingYears: number;  // 투하 전 숙성 추정 (년)
  textureMult: number;     // 질감 가속 배수 (0.3~1.5)
  aromaDecay: number;      // 향 감소 속도 배수 (0.3~1.5)
  riskMult: number;        // 환원 리스크 배수 (0.3~2.0)
  kineticFactor: number;   // 운동학적 인자 K-TCI (0.5~2.0), 해류 진동 기반 질감 가속
  timeScale?: number;      // 시간축 압축 배수 (숙성 속도) — 1.0=와인/샴페인 기준, >1=빠른 숙성(전통주·간장 등), <1=느린 숙성(보이차)
}

// 카테고리별 품질 가중치 (합계 = 1.0)
export interface QualityWeights {
  texture: number;   // 질감 가중치
  aroma: number;     // 향 가중치
  bubble: number;    // 기포 가중치
  risk: number;      // 리스크 가중치
}

// 계수 범위 상수 (클램핑용)
export const AGING_FACTORS_RANGE = {
  baseAgingYears: { min: 0, max: 30 },
  textureMult: { min: 0.3, max: 1.5 },
  aromaDecay: { min: 0.3, max: 1.5 },
  riskMult: { min: 0.3, max: 2.0 },
  kineticFactor: { min: 0.5, max: 2.0 },
  timeScale: { min: 0.3, max: 5.0 },
} as const;

// 기본 AgingFactors (샴페인 blend 기준)
export const DEFAULT_AGING_FACTORS: AgingFactors = {
  baseAgingYears: 2.0,
  textureMult: 1.0,
  aromaDecay: 1.0,
  riskMult: 1.0,
  kineticFactor: 1.0,
  timeScale: 1.0,
};

// 기본 QualityWeights (범용)
export const DEFAULT_QUALITY_WEIGHTS: QualityWeights = {
  texture: 0.30,
  aroma: 0.30,
  bubble: 0.25,
  risk: 0.15,
};

// 카테고리 라벨
export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  champagne: '샴페인',
  red_wine: '레드와인',
  white_wine: '화이트와인',
  green_coffee_bean: '생두 (그린빈)',
  sake: '사케',
  whisky: '위스키',
  yakju_cheongju: '전통주(약주·청주)',
  spirits: '증류주(소주)',
  puer: '생차/보이차',
  soy_sauce: '간장',
  vinegar: '식초',
  other: '기타',
};

// ═══════════════════════════════════════════════════════════════════════════
// 카테고리별 폼 분기 상수
// ═══════════════════════════════════════════════════════════════════════════

// 카테고리 → 서브타입 옵션
export const CATEGORY_SUBTYPES: Record<string, { value: string; label: string }[]> = {
  champagne: [
    { value: 'blanc_de_blancs', label: 'Blanc de Blancs' },
    { value: 'blanc_de_noirs', label: 'Blanc de Noirs' },
    { value: 'rose', label: 'Rosé' },
    { value: 'blend', label: 'Blend' },
    { value: 'vintage', label: 'Vintage' },
  ],
  red_wine: [
    { value: 'cabernet', label: '카베르네 소비뇽' },
    { value: 'pinot_noir', label: '피노 누아' },
    { value: 'merlot', label: '메를로' },
    { value: 'syrah', label: '시라' },
    { value: 'blend', label: '블렌드' },
  ],
  white_wine: [
    { value: 'chardonnay', label: '샤르도네' },
    { value: 'sauvignon_blanc', label: '소비뇽 블랑' },
    { value: 'riesling', label: '리슬링' },
    { value: 'blend', label: '블렌드' },
  ],
  whisky: [
    { value: 'single_malt', label: '싱글 몰트' },
    { value: 'blended', label: '블렌디드' },
    { value: 'bourbon', label: '버번' },
    { value: 'rye', label: '라이' },
    { value: 'single_grain', label: '싱글 그레인' },
  ],
  sake: [
    { value: 'junmai_daiginjo', label: '준마이 다이긴조' },
    { value: 'junmai_ginjo', label: '준마이 긴조' },
    { value: 'junmai', label: '준마이' },
    { value: 'honjozo', label: '혼조조' },
    { value: 'tokubetsu', label: '토쿠베츠' },
  ],
  green_coffee_bean: [
    { value: 'arabica', label: '아라비카' },
    { value: 'robusta', label: '로부스타' },
    { value: 'blend', label: '블렌드' },
    { value: 'specialty', label: '스페셜티' },
  ],
  puer: [
    { value: 'sheng', label: '생차 (生茶)' },
    { value: 'shou', label: '숙차 (熟茶)' },
    { value: 'aged_sheng', label: '노생차' },
    { value: 'wild_tree', label: '고수차' },
  ],
  soy_sauce: [
    { value: 'koikuchi', label: '진간장 (濃口)' },
    { value: 'usukuchi', label: '국간장 (薄口)' },
    { value: 'tamari', label: '타마리' },
    { value: 'saishikomi', label: '재사입 (再仕込)' },
    { value: 'shiro', label: '백간장 (白)' },
  ],
  vinegar: [
    { value: 'balsamic', label: '발사믹' },
    { value: 'kurozu', label: '흑초 (黒酢)' },
    { value: 'apple_cider', label: '사과식초' },
    { value: 'rice', label: '쌀식초' },
    { value: 'fruit', label: '과일식초' },
  ],
  yakju_cheongju: [
    { value: 'yakju', label: '약주' },
    { value: 'cheongju', label: '청주' },
    { value: 'takju', label: '탁주/막걸리' },
    { value: 'hapju', label: '합주' },
    { value: 'fruit_wine', label: '과실주' },
  ],
  spirits: [
    { value: 'distilled', label: '증류식 소주' },
    { value: 'andong', label: '안동소주' },
    { value: 'rice', label: '쌀소주' },
    { value: 'barley', label: '보리소주' },
    { value: 'liqueur', label: '리큐르' },
  ],
};

// 카테고리별 환원 체크리스트
export interface ReductionCheckItem {
  id: string;
  label: string;
  desc: string;
  weight: number;
  group: string | null;
}

export const CATEGORY_REDUCTION_CHECKLIST: Record<string, ReductionCheckItem[]> = {
  'champagne': [
    { id: 'brutNature', label: '낮은 도사주', desc: 'Brut Nature · Extra Brut (0~6g/L)', weight: 2, group: 'dosage' },
    { id: 'brut', label: '일반 도사주', desc: 'Brut · Extra Dry (6~12g/L)', weight: 0, group: 'dosage' },
    { id: 'highDosage', label: '높은 도사주', desc: 'Demi-Sec · Doux (12g/L+)', weight: -2, group: 'dosage' },
    { id: 'reductive', label: '환원적 양조', desc: '스테인리스 스틸 발효 · 불활성 가스 블랭킷', weight: 1, group: null },
    { id: 'surLie', label: '장기 앙금 접촉', desc: 'Sur lie 장기 숙성', weight: 1, group: null },
    { id: 'oxidative', label: '산화적 양조 · 솔레라', desc: '산소 접촉 반복, 솔레라 블렌딩', weight: -1, group: null },
    { id: 'oak', label: '오크 숙성', desc: '오크통 숙성 과정 포함', weight: -1, group: null },
  ],
  red_wine: [
    { id: 'reductive', label: '환원적 양조', desc: '스테인리스 스틸 · 불활성 가스', weight: 1, group: null },
    { id: 'oak', label: '오크 숙성', desc: '프렌치/아메리칸 오크 배럴', weight: -1, group: null },
    { id: 'longMaceration', label: '장기 침용', desc: '30일+ 스킨 콘택트', weight: 1, group: null },
    { id: 'unfined', label: '무청징/무여과', desc: '내추럴 스타일', weight: 1, group: null },
  ],
  white_wine: [
    { id: 'reductive', label: '환원적 양조', desc: '스테인리스 스틸 · 저온 발효', weight: 1, group: null },
    { id: 'oak', label: '오크 숙성', desc: '오크통 숙성 과정 포함', weight: -1, group: null },
    { id: 'surLie', label: '앙금 접촉', desc: 'Sur lie 숙성', weight: 1, group: null },
    { id: 'skinContact', label: '스킨 콘택트', desc: '오렌지 와인 스타일', weight: 1, group: null },
  ],
  whisky: [
    { id: 'heavyPeat', label: '피트 (높음)', desc: '아일라 스타일 · 50+ PPM', weight: 2, group: 'peat' },
    { id: 'mediumPeat', label: '피트 (보통)', desc: '하이랜드 · 10~30 PPM', weight: 1, group: 'peat' },
    { id: 'noPeat', label: '피트 (없음)', desc: '논피트 · 스페이사이드 스타일', weight: 0, group: 'peat' },
    { id: 'sherryCask', label: '셰리 캐스크', desc: '올로로소/PX 셰리 캐스크 숙성', weight: -1, group: null },
    { id: 'refillCask', label: '리필 캐스크', desc: '리필 캐스크 (2회차+)', weight: 1, group: null },
    { id: 'bourbonCask', label: '버번 캐스크', desc: '아메리칸 오크 버번 배럴', weight: 0, group: null },
  ],
  sake: [
    { id: 'namazake', label: '생주 (生酒)', desc: '비가열 처리, 효소 활성', weight: 2, group: null },
    { id: 'genshu', label: '원주 (原酒)', desc: '가수 없음, 알코올 17~20%', weight: 1, group: null },
    { id: 'chouki', label: '장기숙성', desc: '고온 · 상온 장기숙성 이력', weight: 1, group: null },
    { id: 'hiire', label: '히이레 (火入)', desc: '가열 살균 처리', weight: -1, group: null },
    { id: 'muroka', label: '무로카 (無濾過)', desc: '무여과, 잔여 효모 함유', weight: 1, group: null },
  ],
  green_coffee_bean: [
    { id: 'natural', label: '내추럴 가공', desc: '자연건조 · 과실·발효 풍미', weight: 1, group: 'process' },
    { id: 'honey', label: '허니 가공', desc: '점액질 잔류 건조 · 단맛', weight: 1, group: 'process' },
    { id: 'washed', label: '워시드 가공', desc: '수세식 · 깔끔한 산미', weight: 0, group: 'process' },
    { id: 'newCrop', label: '뉴 크롭', desc: '당해 수확 · 높은 수분·활성', weight: 1, group: null },
    { id: 'highGrown', label: '고지대·고밀도', desc: 'SHB/SHG · 고밀도 생두', weight: 1, group: null },
  ],
  puer: [
    { id: 'jinYaCha', label: '긴압차', desc: '병차·전차·타차 압축 형태', weight: 1, group: null },
    { id: 'sanCha', label: '산차', desc: '찻잎 그대로, 비압축', weight: 0, group: null },
    { id: 'wetStorage', label: '습창 보관', desc: '고습도 환경 보관', weight: 2, group: 'storage' },
    { id: 'dryStorage', label: '건창 보관', desc: '건조 환경 보관', weight: 0, group: 'storage' },
  ],
  soy_sauce: [
    { id: 'longAged', label: '장기숙성 (2년+)', desc: '2년 이상 장기 발효', weight: 1, group: null },
    { id: 'seaSalt', label: '천일염', desc: '천일염 사용', weight: 0, group: null },
    { id: 'traditional', label: '재래식', desc: '전통 발효 방식', weight: 1, group: null },
    { id: 'brewed', label: '양조식', desc: '단기 양조 · 표준 발효', weight: -1, group: null },
  ],
  vinegar: [
    { id: 'longAged', label: '장기숙성 (3년+)', desc: '3년 이상 장기 숙성', weight: 1, group: null },
    { id: 'naturalFerment', label: '천연 발효', desc: '자연 초산균 발효', weight: 1, group: null },
    { id: 'traditional', label: '전통 방식', desc: '전통 항아리·나무통 숙성', weight: 1, group: null },
    { id: 'industrial', label: '산업 제조', desc: '속성 발효 · 대량 생산', weight: -2, group: null },
  ],
  yakju_cheongju: [
    { id: 'saengju', label: '생주 (비살균)', desc: '비살균 · 활성 효모', weight: 2, group: null },
    { id: 'pasteurized', label: '살균', desc: '가열 살균 처리', weight: -1, group: null },
    { id: 'longAged', label: '장기숙성', desc: '장기 숙성 이력', weight: 1, group: null },
    { id: 'danyangju', label: '단양주', desc: '1차 발효만', weight: 0, group: 'brew' },
    { id: 'iyangju', label: '이양주+', desc: '2차 이상 중양주', weight: 1, group: 'brew' },
  ],
  spirits: [
    { id: 'onggiAged', label: '옹기 숙성', desc: '옹기(항아리) 숙성 — 미세 호흡', weight: 1, group: null },
    { id: 'oakAged', label: '오크 숙성', desc: '오크통 숙성 — 나무·바닐라향', weight: 1, group: null },
    { id: 'highProof', label: '고도수 원액', desc: '40도 이상, 에스테르화 활발', weight: 1, group: null },
    { id: 'atmospheric', label: '상압 증류', desc: '풍부한 향, 잡미 잔존 가능', weight: 0, group: 'distill' },
    { id: 'reducedPressure', label: '감압 증류', desc: '깨끗·부드러움, 향 약함', weight: -1, group: 'distill' },
  ],
};

// 카테고리별 필드 표시 설정
export interface CategoryFieldConfig {
  showVintage: boolean;
  vintageLabel: string;
  showDosage: boolean;
  showAlcohol: boolean;
  subtypeLabel: string;
}

export const CATEGORY_FIELD_CONFIG: Record<string, CategoryFieldConfig> = {
  champagne:        { showVintage: true, vintageLabel: '빈티지', showDosage: true, showAlcohol: true, subtypeLabel: '와인 타입' },
  red_wine:         { showVintage: true, vintageLabel: '빈티지', showDosage: false, showAlcohol: true, subtypeLabel: '품종' },
  white_wine:       { showVintage: true, vintageLabel: '빈티지', showDosage: false, showAlcohol: true, subtypeLabel: '품종' },
  whisky:           { showVintage: true, vintageLabel: '증류 연도', showDosage: false, showAlcohol: true, subtypeLabel: '위스키 타입' },
  sake:             { showVintage: true, vintageLabel: '양조 연도', showDosage: false, showAlcohol: true, subtypeLabel: '사케 등급' },
  green_coffee_bean: { showVintage: true, vintageLabel: '수확 연도', showDosage: false, showAlcohol: false, subtypeLabel: '생두 타입' },
  puer:             { showVintage: true, vintageLabel: '생산 연도', showDosage: false, showAlcohol: false, subtypeLabel: '보이차 타입' },
  soy_sauce:        { showVintage: false, vintageLabel: '', showDosage: false, showAlcohol: false, subtypeLabel: '간장 타입' },
  vinegar:          { showVintage: false, vintageLabel: '', showDosage: false, showAlcohol: false, subtypeLabel: '식초 타입' },
  yakju_cheongju:   { showVintage: false, vintageLabel: '', showDosage: false, showAlcohol: true, subtypeLabel: '약주·청주 타입' },
  spirits:          { showVintage: true, vintageLabel: '증류 연도', showDosage: false, showAlcohol: true, subtypeLabel: '증류주 타입' },
};

// 기본 보정 계수 (과학적 도출값)
export const DEFAULT_COEFFICIENTS = {
  tci: 0.3,   // 가설적 추정 — 실험 데이터 필요
  fri: 0.56,  // 아레니우스 방정식: Ea=47kJ/mol, 4°C/12°C 속도비
  bri: 1.6,   // 헨리의 법칙: 수심 30m CO2 압력 구배 + 용해도 보정
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// v3.0: 과학적 정합성 + 해양 데이터 통합
// ═══════════════════════════════════════════════════════════════════════════

// 마개 타입 라벨 & 산소 투과율 (OTR: mg O₂/year)
export const CLOSURE_TYPE_LABELS: Record<ClosureType, string> = {
  crown_cap: '크라운캡',
  cork_natural: '천연 코르크',
  cork_agglomerated: '압축 코르크',
  screw_cap: '스크류캡',
  glass_stopper: '유리 스토퍼',
  wax_seal: '밀랍 씰',
  ceramic_cap: '도자기 마개',
  none: '없음 (개방 숙성)',
};

// OTR (Oxygen Transfer Rate, mg O₂/year) — 문헌 기반
export const CLOSURE_OTR: Record<ClosureType, number> = {
  crown_cap: 0.0,          // 밀봉 — 산소 투과 없음
  cork_natural: 1.2,       // 천연 코르크 평균 OTR (0.5~2.5)
  cork_agglomerated: 0.8,  // 압축 코르크 — 천연보다 약간 낮음
  screw_cap: 0.05,         // Stelvin 타입 — 거의 밀봉
  glass_stopper: 0.02,     // Vino-Seal — 거의 밀봉
  wax_seal: 0.3,           // 밀랍 — 미세 투과
  ceramic_cap: 0.5,        // 도자기 — 미세 기공
  none: 5.0,               // 개방 — 최대 산화
};

// 카테고리별 기본 마개
export const CATEGORY_DEFAULT_CLOSURE: Record<string, ClosureType> = {
  champagne: 'crown_cap',
  red_wine: 'cork_natural',
  white_wine: 'screw_cap',
  whisky: 'cork_natural',
  sake: 'screw_cap',
  green_coffee_bean: 'screw_cap',
  puer: 'none',
  soy_sauce: 'ceramic_cap',
  vinegar: 'glass_stopper',
  yakju_cheongju: 'screw_cap',
  spirits: 'cork_natural',
};

// 카테고리별 활성화 에너지 매트릭스 (kJ/mol)
export interface CategoryEaEntry {
  ea: number;           // 중앙값 (kJ/mol)
  eaLower: number;      // 95% CI 하한
  eaUpper: number;      // 95% CI 상한
  reactionBasis: string; // 주요 반응 근거
}

export const CATEGORY_EA_MAP: Record<string, CategoryEaEntry> = {
  champagne:  { ea: 47, eaLower: 42, eaUpper: 52, reactionBasis: '안토시아닌/폴리페놀 산화' },
  red_wine:   { ea: 50, eaLower: 45, eaUpper: 55, reactionBasis: '안토시아닌 중합 + 타닌 산화' },
  white_wine: { ea: 44, eaLower: 39, eaUpper: 49, reactionBasis: '폴리페놀 산화 (갈변)' },
  whisky:     { ea: 60, eaLower: 52, eaUpper: 68, reactionBasis: '에스테르화 반응 (숙성향 생성)' },
  sake:       { ea: 35, eaLower: 30, eaUpper: 40, reactionBasis: '아미노-카보닐 반응 (메일라드)' },
  green_coffee_bean: { ea: 38, eaLower: 33, eaUpper: 43, reactionBasis: '지질 산화 + 클로로겐산 분해 (생두 에이징)' },
  puer:       { ea: 42, eaLower: 37, eaUpper: 47, reactionBasis: '카테킨 산화 중합 (후발효)' },
  soy_sauce:  { ea: 50, eaLower: 44, eaUpper: 56, reactionBasis: '멜라노이딘 생성 (갈변)' },
  vinegar:    { ea: 45, eaLower: 40, eaUpper: 50, reactionBasis: '초산 에스테르화 (숙성향)' },
  yakju_cheongju: { ea: 40, eaLower: 35, eaUpper: 45, reactionBasis: '아미노-카보닐(메일라드) + 유기산 에스테르화' },
  spirits:    { ea: 55, eaLower: 48, eaUpper: 62, reactionBasis: '에스테르화 반응 (숙성향 생성·퓨젤 순화)' },
};

// K-TCI 최대 가속 제한 — effectiveTci = tci / kf 의 하한
// effectiveTci >= 0.2 → 최대 1/0.2 = 5배 가속
export const MAX_TCI_ACCELERATION = 5.0;
export const MIN_EFFECTIVE_TCI = 1 / MAX_TCI_ACCELERATION; // 0.2

// Conservative Cap — 해저/지상 품질 차이 제한
export const CONSERVATIVE_CAP = {
  compositeQualityDelta: 20,  // 최대 ±20점 이내
} as const;

// 해양 환경 데이터 (UAPS 예측용)
export interface OceanConditionsForPrediction {
  seaTemperature: number | null;    // 실측 수온 (°C)
  currentVelocity: number | null;   // 실측 해류속도 (m/s)
  waveHeight: number | null;        // 실측 파고 (m)
  wavePeriod: number | null;        // 실측 파주기 (s)
  waterPressure: number | null;     // 실측 수압 (atm)
  salinity: number | null;          // 실측 염도 (‰)
}

// 깊이별 시뮬레이션 결과
export interface DepthSimulationResult {
  depth: number;
  quality: number;
  texture: number;
  aroma: number;
  bubble: number;
  risk: number;
}

// 최적 숙성 기간 분석 결과
export interface OptimalImmersionResult {
  // 최적 기간
  bestStartDate: string;        // "2026-11" (YYYY-MM)
  bestEndDate: string;           // "2027-05"
  bestStartLabel: string;        // "2026년 11월"
  bestEndLabel: string;          // "2027년 5월"
  durationMonths: number;        // 제품의 plannedDurationMonths
  peakScore: number;             // 최적 기간의 피크 품질
  peakAtMonth: number;           // 피크 도달 시점 (투입 후 몇 개월)
  // 12개 시나리오
  monthlyScores: {
    startDate: string;           // "2026-04"
    endDate: string;             // "2026-10"
    startLabel: string;          // "2026년 4월"
    endLabel: string;            // "2026년 10월"
    immersionMonth: number;      // 달력 월 (1~12)
    peakQuality: number;
    peakAtMonth: number;
    goldenWindowStart: number;
    goldenWindowEnd: number;
    avgFri: number;
    avgBri: number;
    avgKf: number;
  }[];
  recommendation: string;
}
