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
  | 'coldbrew'
  | 'sake'
  | 'whisky'
  | 'spirits'
  | 'puer'
  | 'soy_sauce'
  | 'vinegar'
  | 'other';

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

// 풍미 축 라벨 (레이더 차트용) — WSET/OIV 검증 6축
export const FLAVOR_AXES = [
  { key: 'fruity', label: '과실향', color: '#fde047' },
  { key: 'floralMineral', label: '플로럴·미네랄', color: '#a78bfa' },
  { key: 'yeastyAutolytic', label: '효모·숙성향', color: '#d4a574' },
  { key: 'acidityFreshness', label: '산도·상쾌함', color: '#22d3ee' },
  { key: 'bodyTexture', label: '바디감·질감', color: '#fb923c' },
  { key: 'finishComplexity', label: '여운·복합미', color: '#f472b6' },
] as const;

// ═══════════════════════════════════════════════════════════════════════════
// AI 추론 보정 계수 인터페이스
// ═══════════════════════════════════════════════════════════════════════════

// 카테고리별 숙성 특성 계수 (AI가 실시간 추론)
export interface AgingFactors {
  baseAgingYears: number;  // 투하 전 숙성 추정 (년)
  textureMult: number;     // 질감 가속 배수 (0.3~1.5)
  aromaDecay: number;      // 향 감소 속도 배수 (0.3~1.5)
  riskMult: number;        // 환원 리스크 배수 (0.3~2.0)
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
} as const;

// 기본 AgingFactors (샴페인 blend 기준)
export const DEFAULT_AGING_FACTORS: AgingFactors = {
  baseAgingYears: 2.0,
  textureMult: 1.0,
  aromaDecay: 1.0,
  riskMult: 1.0,
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
  coldbrew: '콜드브루 커피',
  sake: '사케',
  whisky: '위스키',
  spirits: '한국 전통주',
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
  coldbrew: [
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
  spirits: [
    { value: 'yakju', label: '약주' },
    { value: 'takju', label: '탁주/막걸리' },
    { value: 'cheongju', label: '청주' },
    { value: 'soju', label: '소주' },
    { value: 'fruit_wine', label: '과실주' },
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
  coldbrew: [
    { id: 'darkRoast', label: '다크 로스트', desc: 'Full City+ · 높은 탄화물', weight: -1, group: 'roast' },
    { id: 'mediumRoast', label: '미디엄 로스트', desc: 'City · Full City', weight: 0, group: 'roast' },
    { id: 'lightRoast', label: '라이트 로스트', desc: 'Cinnamon · City-', weight: 1, group: 'roast' },
    { id: 'natural', label: '내추럴 가공', desc: '자연건조 · 발효 풍미', weight: 1, group: null },
    { id: 'washed', label: '워시드 가공', desc: '수세식 · 깔끔한 산미', weight: -1, group: null },
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
  spirits: [
    { id: 'saengMakgeolli', label: '생막걸리', desc: '비살균 · 활성 효모', weight: 2, group: null },
    { id: 'pasteurized', label: '살균', desc: '가열 살균 처리', weight: -1, group: null },
    { id: 'longAged', label: '장기숙성', desc: '장기 숙성 이력', weight: 1, group: null },
    { id: 'danyangju', label: '단양주', desc: '1차 발효만', weight: 0, group: 'brew' },
    { id: 'iyangju', label: '이양주+', desc: '2차 이상 중양주', weight: 1, group: 'brew' },
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
  coldbrew:         { showVintage: true, vintageLabel: '수확 연도', showDosage: false, showAlcohol: false, subtypeLabel: '커피 타입' },
  puer:             { showVintage: true, vintageLabel: '생산 연도', showDosage: false, showAlcohol: false, subtypeLabel: '보이차 타입' },
  soy_sauce:        { showVintage: false, vintageLabel: '', showDosage: false, showAlcohol: false, subtypeLabel: '간장 타입' },
  vinegar:          { showVintage: false, vintageLabel: '', showDosage: false, showAlcohol: false, subtypeLabel: '식초 타입' },
  spirits:          { showVintage: false, vintageLabel: '', showDosage: false, showAlcohol: true, subtypeLabel: '전통주 타입' },
};

// 기본 보정 계수 (과학적 도출값)
export const DEFAULT_COEFFICIENTS = {
  tci: 0.3,   // 가설적 추정 — 실험 데이터 필요
  fri: 0.56,  // 아레니우스 방정식: Ea=47kJ/mol, 4°C/12°C 속도비
  bri: 1.6,   // 헨리의 법칙: 수심 30m CO2 압력 구배 + 용해도 보정
} as const;
