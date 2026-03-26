/**
 * UAPS AI 예측 모듈 — Layer 2: Gemini AI 추론
 *
 * 통계 학습 결과를 컨텍스트로 주입하여 Gemini AI가 정밀 예측 수행.
 * - 비선형 패턴 포착 (pH 3.05~3.15 미묘한 차이)
 * - 상호작용 효과 (환원 성향 × 장기 숙성)
 * - 맥락적 추론 (유사 와인 비교)
 * - 자연어 인사이트 (한국어 풍미 설명)
 */

import type {
  AgingProduct,
  AgingPrediction,
  TerrestrialModel,
  ParsedUAPSConfig,
  AgingFactors,
  QualityWeights,
  ProductCategory,
  OceanConditionsForPrediction,
} from '@/lib/types/uaps';
import type { MonthlyOceanProfile } from './uaps-ocean-profile';
import type { ClusterMatch } from './uaps-engine';
import type { MLPredictionResult } from './uaps-ml-predictor';
import {
  calculateTextureMaturity,
  calculateAromaFreshness,
  calculateOffFlavorRisk,
  calculateOptimalHarvestWindow,
  predictFlavorProfileStatistical,
} from './uaps-engine';
import {
  WINE_TYPE_LABELS,
  REDUCTION_POTENTIAL_LABELS,
  PRODUCT_CATEGORY_LABELS,
  CLOSURE_TYPE_LABELS,
  CLOSURE_OTR,
  CATEGORY_EA_MAP,
  DEFAULT_AGING_FACTORS,
  DEFAULT_QUALITY_WEIGHTS,
  AGING_FACTORS_RANGE,
  MIN_EFFECTIVE_TCI,
} from '@/lib/types/uaps';

// ═══════════════════════════════════════════════════════════════════════════
// 전문가 프로파일 (Google Search Grounding)
// ═══════════════════════════════════════════════════════════════════════════

interface ExpertProfileResult {
  profile: Record<string, number>;
  sources: string[];
  confidence: number;
  summary: string;
}

/**
 * Google Search grounding으로 전문가 테이스팅 노트 기반 프로파일 생성
 */
export async function generateExpertProfile(
  product: AgingProduct,
  monthlyOceanProfiles?: MonthlyOceanProfile[] | null
): Promise<ExpertProfileResult | null> {
  const { GoogleGenAI } = await import('@google/genai');
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildExpertProfilePrompt(product, monthlyOceanProfiles);

  const EXPERT_TIMEOUT_MS = 45_000;
  const GROUNDING_MODELS = ['gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];

  for (const modelName of GROUNDING_MODELS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), EXPERT_TIMEOUT_MS);

      // Google Search grounding + JSON 모드 동시 사용 시도
      let response;
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: 'application/json',
            temperature: 0.1, // 전문가 프로파일은 사실 기반이므로 매우 낮게
            abortSignal: controller.signal,
          },
        });
      } catch {
        // JSON 모드와 grounding 호환 불가 시 텍스트 모드 폴백
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.1,
            abortSignal: controller.signal,
          },
        });
      }

      clearTimeout(timeout);

      const responseText = response.text ?? '';
      const parsed = parseExpertProfileResponse(responseText);
      if (parsed) {
        console.log(`UAPS: ${modelName} 전문가 프로파일 생성 성공`);
        return parsed;
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      const isRateLimit = error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED');
      const isTimeout = error.name === 'AbortError';
      if (!isRateLimit && !isTimeout) {
        console.warn(`UAPS: ${modelName} 전문가 프로파일 실패:`, error.message);
        break;
      }
      console.warn(`UAPS: ${modelName} ${isTimeout ? '타임아웃' : '할당량 초과'}, 다음 모델 시도...`);
    }
  }

  return null;
}

function buildExpertProfilePrompt(product: AgingProduct, monthlyOceanProfiles?: MonthlyOceanProfile[] | null): string {
  const vintageStr = product.vintage ? ` ${product.vintage}` : '';
  const searchQuery = `${product.productName}${vintageStr}`;
  const category = (product.productCategory || 'champagne') as ProductCategory;
  const categoryLabel = PRODUCT_CATEGORY_LABELS[category] || category;

  // 카테고리별 전문가 역할
  const expertRoles: Record<string, string> = {
    champagne: '샴페인/스파클링 와인 전문가',
    red_wine: '레드 와인 전문가',
    white_wine: '화이트 와인 전문가',
    coldbrew: '커피 전문가 (SCA Q-Grader)',
    sake: '사케 전문가 (唎酒師)',
    whisky: '위스키 전문가',
    spirits: '전통주/증류주 전문가',
    puer: '보이차/생차 전문가 (茶藝師)',
    soy_sauce: '발효 식품 전문가',
    vinegar: '식초/발효 식품 전문가',
  };
  const expertRole = expertRoles[category] || '식음 전문가';

  // 카테고리별 참조 소스
  const sourcesByCategory: Record<string, string> = {
    champagne: 'Wine Advocate, Decanter, Wine Spectator, Jancis Robinson, CellarTracker',
    red_wine: 'Wine Advocate, Robert Parker, Decanter, Wine Spectator',
    white_wine: 'Wine Advocate, Jancis Robinson, Decanter, CellarTracker',
    coldbrew: 'CoffeeReview, Cup of Excellence, SCA 리뷰',
    sake: '全国新酒鑑評会, Kura Master, IWC Sake, SAKEDOO',
    whisky: 'WhiskyBase, Whisky Advocate, Master of Malt',
    spirits: '더술닷컴, 전통주갤러리, 우리술닷컴',
    puer: 'YunnanSourcing, TeaDB, 茶友网',
    soy_sauce: '職人醤油, 全国品評会',
    vinegar: 'Amazon Reviews, 黒酢品評会',
  };
  const sources = sourcesByCategory[category] || '전문 리뷰 사이트';

  return `당신은 ${expertRole}입니다.
다음 ${categoryLabel} 제품의 풍미 프로파일을 전문가 테이스팅 노트를 기반으로 분석해주세요.

## 대상 제품
- 이름: ${searchQuery}
- 카테고리: ${categoryLabel}
- 생산자: ${product.producer || '미입력'}
- 타입: ${product.wineType ? (WINE_TYPE_LABELS[product.wineType] || product.wineType) : product.productCategory}
${product.vintage ? `- 빈티지: ${product.vintage}` : '- NV (논빈티지)'}
${product.ph ? `- pH: ${product.ph}` : ''}
${product.dosage ? `- Dosage: ${product.dosage}g/L` : ''}

## 요청
${sources} 등 전문가 리뷰를 검색하여
이 제품의 현재 상태(투하 전) 풍미 프로파일을 0-100 스케일로 평가해주세요.

각 축의 기준:
- 30 이하: 약함/미미
- 40-55: 보통
- 55-70: 좋음
- 70-85: 우수
- 85+: 뛰어남

JSON만 응답:
{
  "fruity": 0-100,
  "floralMineral": 0-100,
  "yeastyAutolytic": 0-100,
  "acidityFreshness": 0-100,
  "bodyTexture": 0-100,
  "finishComplexity": 0-100,
  "sources": ["검색에서 참조한 리뷰 출처 1-3개"],
  "confidence": 0-1,
  "summary": "한 줄 요약 (한국어)"
}${monthlyOceanProfiles && monthlyOceanProfiles.length > 0 ? `

## 해저 숙성 환경 (KHOA 실측 월별 해양 프로파일)
이 제품은 완도 해역 40m 수심에서 해저 숙성됩니다.
| 월 | 수온(°C) | 염도(‰) | 조류(cm/s) |
|---|---|---|---|
${monthlyOceanProfiles.map(p =>
  `| ${p.month}월 | ${p.seaTemperatureAvg.toFixed(1)} | ${p.salinityAvg !== null ? p.salinityAvg.toFixed(1) : '-'} | ${p.tidalCurrentSpeedAvg !== null ? p.tidalCurrentSpeedAvg.toFixed(1) : '-'} |`
).join('\n')}

풍미 프로파일 평가 시 아래 해저 숙성 효과를 반영하세요:
- 겨울(12~2월) 저수온(7~9°C): 산화 억제 → 향 보존 극대화, FRI 유리
- 여름(7~9월) 고수온(14~16°C): 산화 가속 → 숙성 빠름, 환원취 리스크
- 조류에 의한 자연 리무아주: 질감(bodyTexture) 가속 발달
- 40m 수압(4.9atm): 기포 미세화, CO₂ 안정` : ''}`;
}

function parseExpertProfileResponse(text: string): ExpertProfileResult | null {
  try {
    // JSON 블록 추출
    let jsonStr = text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];
    jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    const parsed = JSON.parse(jsonStr);
    const FLAVOR_KEYS = ['fruity', 'floralMineral', 'yeastyAutolytic', 'acidityFreshness', 'bodyTexture', 'finishComplexity'];
    const profile: Record<string, number> = {};

    for (const key of FLAVOR_KEYS) {
      const val = Number(parsed[key]);
      if (isNaN(val)) return null;
      profile[key] = Math.min(100, Math.max(0, Math.round(val)));
    }

    return {
      profile,
      sources: Array.isArray(parsed.sources) ? parsed.sources.map(String) : [],
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    };
  } catch {
    return null;
  }
}

/**
 * beforeProfile에 TCI/FRI 시간 보정만 적용하여 afterProfile 생성
 * v3.0: kineticFactor 반영 — TCI 기반 보정에 운동학적 인자 적용
 */
export function applyAgingAdjustments(
  beforeProfile: Record<string, number>,
  underseaMonths: number,
  config: ParsedUAPSConfig,
  kineticFactor: number = 1.0,
): Record<string, number> {
  const result: Record<string, number> = {};
  const monthFactor = underseaMonths / 12;
  const kf = Math.max(0.5, kineticFactor);
  // K-TCI: tci / kineticFactor (kf↑ → 더 빠른 가속)
  // v3.1: effectiveTci 하한 클램핑 → 최대 5배 가속 제한
  const effectiveTci = Math.max(MIN_EFFECTIVE_TCI, config.tci / kf);

  for (const [key, baseValue] of Object.entries(beforeProfile)) {
    let adjusted = baseValue;

    if (key === 'fruity') {
      adjusted *= Math.exp(-0.02 * underseaMonths * config.fri);
    } else if (key === 'floralMineral') {
      adjusted += monthFactor * 4;
    } else if (key === 'yeastyAutolytic') {
      adjusted += monthFactor * (1 / effectiveTci) * 5;
    } else if (key === 'acidityFreshness') {
      adjusted *= Math.exp(-0.015 * underseaMonths * config.fri);
    } else if (key === 'bodyTexture') {
      adjusted += monthFactor * (1 / effectiveTci) * 4;
    } else if (key === 'finishComplexity') {
      adjusted += monthFactor * 3.5;
    }

    result[key] = Math.round(Math.min(100, Math.max(0, adjusted)) * 10) / 10;
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// AI 예측 응답 타입
// ═══════════════════════════════════════════════════════════════════════════

interface AIPredictionResponse {
  flavorProfile: {
    fruity: number;
    floralMineral: number;
    yeastyAutolytic: number;
    acidityFreshness: number;
    bodyTexture: number;
    finishComplexity: number;
  };
  qualityScores: {
    textureMaturity: number;
    aromaFreshness: number;
    offFlavorRisk: number;
    overallQuality: number;
  };
  harvestWindow: {
    startMonths: number;
    endMonths: number;
  };
  reasoning: string | null;
  insight: string;
  beforeCharacter: string;
  afterPrediction: string;
  riskWarning: string | null;
  agingFactors?: AgingFactors;
  qualityWeights?: QualityWeights;
}

// ═══════════════════════════════════════════════════════════════════════════
// v5.0 프롬프트 템플릿 시스템
// ═══════════════════════════════════════════════════════════════════════════

/** 카테고리별 전문가 역할 */
const EXPERT_ROLES: Record<string, string> = {
  champagne: '샴페인/스파클링 와인 숙성 과학 전문가이자 WSET Diploma Holder',
  red_wine: '레드 와인 숙성 과학 전문가이자 Master of Wine 후보',
  white_wine: '화이트 와인 숙성 과학 전문가',
  coldbrew: '커피 숙성 과학 전문가 (SCA Q-Grader)',
  sake: '사케 숙성 과학 전문가 (唎酒師)',
  whisky: '위스키 숙성 과학 전문가 (Master of Whisky)',
  spirits: '전통주/발효 과학 전문가',
  puer: '보이차/생차 숙성 과학 전문가 (茶藝師)',
  soy_sauce: '발효 식품 숙성 과학 전문가',
  vinegar: '식초/발효 식품 숙성 과학 전문가',
};

/** Chain-of-Thought 분석 절차 템플릿 */
const CHAIN_OF_THOUGHT_TEMPLATE = `
## 분석 절차 (반드시 이 순서를 따르세요)

Step 1 — 제품 특성 분석:
카테고리, 서브타입, pH, dosage, closure 기반으로 이 제품의 현재(투하 전) 풍미 프로파일을 파악하세요.
전문가 프로파일이 제공되었으면 그것을 앵커로, 없으면 학습 클러스터를 앵커로 활용하세요.

Step 2 — 지상 숙성 기준점 설정:
Layer 1 통계 클러스터 매칭 결과를 참고하여 기준 풍미를 확립하세요.
sample_count가 높고 confidence가 높은 클러스터에 더 큰 가중치를 두세요.

Step 3 — 해저 환경 보정 계산:
월별 수온 프로파일(FRI), 수압(BRI), 조류(K-TCI) 보정을 적용하세요.
- 겨울(12~2월) 저수온 → FRI 유리(향 보존), 숙성 감속
- 여름(7~9월) 고수온 → FRI 불리(산화 가속), 숙성 가속, 환원취 리스크
- 조류 진동 → K-TCI 질감 가속 (자연 리무아주 효과)

Step 4 — 시간 경과 예측:
3단계 비선형 향 감쇠를 고려하세요:
- 0~2년: 급격한 1차 향 감소
- 2~3.5년: 안정기 (2차/3차 향 발달)
- 3.5년+: 후기 급감 (과숙 리스크)
질감은 시그모이드 성장 패턴을 따릅니다.

Step 5 — 최종 판단:
6축 풍미 점수, 4개 품질 점수, 최적 인양 윈도우를 도출하세요.
인양 윈도우는 품질이 피크의 95% 이상을 유지하는 구간입니다.
`;

/** Few-shot 예시 (카테고리별 대표 사례) */
const FEW_SHOT_EXAMPLES: Record<string, string> = {
  champagne: `
### 참고 사례 1: Dom Pérignon 2012 Vintage (30m, 12개월)
입력: pH 3.10, dosage 4g/L, cork_natural, 환원성향 low
전문가 프로파일: fruity=68, floralMineral=62, yeastyAutolytic=78, acidityFreshness=72, bodyTexture=70, finishComplexity=75
해저환경: 연평균 수온 11.2°C, 조류 0.15m/s
결과: fruity=58, floralMineral=68, yeastyAutolytic=88, acidityFreshness=65, bodyTexture=82, finishComplexity=85
품질: textureMaturity=84, aromaFreshness=72, offFlavorRisk=12, overallQuality=88
reasoning: "빈티지 특유의 높은 효모향 기반(78→88), 12개월 해저에서 자가분해 가속. 과실향은 FRI 보정으로 14% 감소(68→58). 조류 0.15m/s로 K-TCI 중간 수준, 질감 가속 뚜렷(70→82). 환원취 리스크 낮음(low + 12개월). 인양 윈도우 10~18개월."

### 참고 사례 2: Krug Grande Cuvée NV (40m, 18개월)
입력: pH 3.05, dosage 5g/L, crown_cap, 환원성향 medium
전문가 프로파일: fruity=55, floralMineral=58, yeastyAutolytic=90, acidityFreshness=68, bodyTexture=82, finishComplexity=88
해저환경: 연평균 수온 10.8°C, 조류 0.12m/s
결과: fruity=42, floralMineral=70, yeastyAutolytic=95, acidityFreshness=58, bodyTexture=92, finishComplexity=94
품질: textureMaturity=92, aromaFreshness=62, offFlavorRisk=18, overallQuality=91
reasoning: "NV 7년 앙금 접촉으로 이미 극도로 높은 효모향(90). 18개월 해저에서 질감 극대화(82→92). 과실향 23% 감소(55→42, 장기숙성 감쇠). crown_cap OTR=0으로 산화 최소. 40m 수압으로 BRI 유리. 환원성향 medium이나 18개월에서 리스크 18%로 관리 가능."`,

  red_wine: `
### 참고 사례: Château Margaux 2015 (30m, 12개월)
입력: pH 3.65, alcohol 13.5%, cork_natural, 환원성향 low
전문가 프로파일: fruity=72, floralMineral=55, yeastyAutolytic=35, acidityFreshness=68, bodyTexture=78, finishComplexity=82
결과: fruity=62, floralMineral=65, yeastyAutolytic=48, acidityFreshness=60, bodyTexture=86, finishComplexity=88
품질: textureMaturity=82, aromaFreshness=68, offFlavorRisk=10, overallQuality=85
reasoning: "보르도 1등급의 구조감(bodyTexture 78) 기반, 해저 수압+저온에서 타닌 중합 가속(78→86). 과실향 14% 감소, 3차 향(미네랄, 복합미) 발달. cork_natural OTR=1.2로 미세 산화 허용 → 복합미 증가."`,

  whisky: `
### 참고 사례: Highland Single Malt 12Y (30m, 18개월)
입력: alcohol 46%, cork_natural, 환원성향 low
전문가 프로파일: fruity=55, floralMineral=40, yeastyAutolytic=25, acidityFreshness=45, bodyTexture=72, finishComplexity=70
결과: fruity=48, floralMineral=52, yeastyAutolytic=35, acidityFreshness=38, bodyTexture=82, finishComplexity=80
품질: textureMaturity=80, aromaFreshness=55, offFlavorRisk=8, overallQuality=78
reasoning: "위스키 Ea=60kJ/mol로 반응 속도가 느려 18개월에도 변화 완만. 해저 저온+고압에서 에스테르화 반응 천천히 진행 → 복합미 증가. 높은 알코올(46%)이 환원취 억제."`,
};

/** 기본 Few-shot (카테고리 매칭 안 될 때) */
const DEFAULT_FEW_SHOT = FEW_SHOT_EXAMPLES.champagne;

/** ML 학습 데이터 수 (프롬프트 표시용) */
let cachedSampleCount: string | null = null;

/** 피처 중요도 상위 3개를 포맷 */
function formatTopFeatures(importance: Record<string, number>): string {
  return Object.entries(importance)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([k, v]) => `${k} ${Math.round(v * 100)}%`)
    .join(', ');
}

/** ML 메타데이터에서 학습 샘플 수 설정 */
export function setMLSampleCount(count: number): void {
  cachedSampleCount = count > 1000 ? `${Math.round(count / 1000)}K` : String(count);
}

// ═══════════════════════════════════════════════════════════════════════════
// 프롬프트 생성
// ═══════════════════════════════════════════════════════════════════════════

function buildPredictionPrompt(
  product: AgingProduct,
  clusters: ClusterMatch[],
  underseaMonths: number,
  config: ParsedUAPSConfig,
  expertProfile?: Record<string, number> | null,
  expertSources?: string[] | null,
  oceanConditions?: OceanConditionsForPrediction | null,
  monthlyOceanProfiles?: MonthlyOceanProfile[] | null,
  mlResult?: MLPredictionResult | null,
): string {
  const clusterContext = clusters.slice(0, 3).map((c) => {
    const fp = c.model.flavorProfileJson as Record<string, { mean: number; stdDev: number }>;
    return {
      wineType: c.model.wineType,
      agingStage: c.model.agingStage,
      sampleCount: c.model.sampleCount,
      similarity: Math.round(c.similarity),
      flavors: Object.fromEntries(
        Object.entries(fp).map(([k, v]) => [k, v?.mean ?? 0])
      ),
      confidence: c.model.confidenceScore,
    };
  });

  const category = (product.productCategory || 'champagne') as ProductCategory;
  const categoryLabel = PRODUCT_CATEGORY_LABELS[category] || category;

  // v3.0: 카테고리별 Ea 정보
  const eaEntry = CATEGORY_EA_MAP[category];
  const eaInfo = eaEntry
    ? `${eaEntry.ea}kJ/mol (${eaEntry.reactionBasis}, 범위: ${eaEntry.eaLower}-${eaEntry.eaUpper})`
    : '47kJ/mol (기본값)';

  // v3.0: 마개 정보
  const closureType = product.closureType || 'cork_natural';
  const closureLabel = CLOSURE_TYPE_LABELS[closureType] || closureType;
  const otr = CLOSURE_OTR[closureType] ?? 0;

  // v3.1: 해양 환경 데이터 (전체 수집 기간 통계 기반)
  const oceanSection = oceanConditions ? `
## 해양 환경 데이터 (전체 수집 기간 평균)
- 평균 수온: ${oceanConditions.seaTemperature !== null ? `${oceanConditions.seaTemperature}°C` : '미수집'}
- 평균 해류속도: ${oceanConditions.currentVelocity !== null ? `${oceanConditions.currentVelocity} m/s` : '미수집'}
- 평균 파고: ${oceanConditions.waveHeight !== null ? `${oceanConditions.waveHeight} m` : '미수집'}
- 평균 파주기: ${oceanConditions.wavePeriod !== null ? `${oceanConditions.wavePeriod} s` : '미수집'}
- 수압: ${oceanConditions.waterPressure !== null ? `${oceanConditions.waterPressure} atm` : '미수집'}
- 평균 염도: ${oceanConditions.salinity !== null ? `${oceanConditions.salinity}‰` : '미수집'}
→ 이 값은 전체 수집 기간의 통계 평균입니다. 기본 가정(수온 4°C 등) 대신 이 값 기반으로 추론하세요.
→ 파주기가 짧을수록(< 6s) K-TCI(운동학적 질감 보정)가 강화됩니다. E_orbital ∝ H²/T.
` : '';

  // v3.2: 월별 해양 프로파일 (서버사이드 구축)
  const monthlyProfileSection = monthlyOceanProfiles && monthlyOceanProfiles.length > 0 ? `
## 월별 해양 환경 프로파일 (KHOA 실측 데이터 기반, 12개월)
| 월 | 평균수온(°C) | 최저수온 | 최고수온 | 편차 | 염도(‰) | 조류(m/s) | 파고(m) |
|---|---|---|---|---|---|---|---|
${monthlyOceanProfiles.map(p =>
  `| ${p.month}월 | ${p.seaTemperatureAvg.toFixed(1)} | ${p.seaTemperatureMin.toFixed(1)} | ${p.seaTemperatureMax.toFixed(1)} | ${p.seaTemperatureStdDev.toFixed(2)} | ${p.salinityAvg !== null ? p.salinityAvg.toFixed(1) : '-'} | ${p.tidalCurrentSpeedAvg !== null ? p.tidalCurrentSpeedAvg.toFixed(3) : '-'} | ${p.waveHeightAvg !== null ? p.waveHeightAvg.toFixed(2) : '-'} |`
).join('\n')}
→ 이 월별 프로파일로 계절별 숙성 속도 차이를 반영하세요.
→ 여름(7~9월) 고수온 구간: 숙성 가속 + 환원취 리스크 증가, 겨울(12~2월) 저수온: 안정 숙성 + 향 보존.
→ 연간 수온 편차(max-min)가 클수록 계절적 숙성 복합성이 높아집니다.
` : '';

  // v5.0: 카테고리별 전문가 역할
  const expertRole = EXPERT_ROLES[category] || '식음 숙성 과학 전문가';

  // v5.0: Few-shot 예시
  const fewShot = FEW_SHOT_EXAMPLES[category] || DEFAULT_FEW_SHOT;

  return `당신은 ${expertRole}이며, 해저 숙성 과학의 전문가입니다.
아래 데이터와 분석 절차를 기반으로 해저 숙성 후 풍미를 예측해주세요.

## 학습된 지상 숙성 패턴 (매칭 클러스터 상위 3개)
${JSON.stringify(clusterContext, null, 2)}

## 해저 숙성 보정 계수 (과학적 근거)
- K-TCI (운동학적 질감 가속): ${config.tci} (95% CI: ${config.tciMeta.lower95}-${config.tciMeta.upper95})
  근거: ${config.tciMeta.sourceDescription}
  해저에서 질감 성숙이 ${(1 / config.tci).toFixed(1)}배 가속 (K-TCI 합산 시 최대 5배 제한)
  ⚡ K-TCI는 해류의 미세 진동(운동학적 인자)이 병 내부에 자연적 리무아주 효과를 만들어 질감을 가속합니다.
  kineticFactor(0.5~2.0)를 추론해주세요. 높을수록 해류 진동 효과가 강합니다. (effectiveTci ≥ 0.2 클램핑)
- FRI (신선도 유지): ${config.fri} (95% CI: ${config.friMeta.lower95}-${config.friMeta.upper95})
  근거: ${config.friMeta.sourceDescription}
  산화 속도가 ${(config.fri * 100).toFixed(0)}% 수준으로 감속
  카테고리별 활성화 에너지(Ea): ${eaInfo}
  마개: ${closureLabel} (OTR=${otr} mg O₂/year) — OTR이 높으면 산소 투과로 산화 가속
- BRI (기포 안정화): ${config.bri} (95% CI: ${config.briMeta.lower95}-${config.briMeta.upper95})
  근거: ${config.briMeta.sourceDescription}
  효과: 외부 수압이 CO₂ 손실 구동력 감소 → 용존 CO₂ 안정화 → 기포 핵 균질화 → 기포가 작고 조밀해짐
${oceanSection}${monthlyProfileSection}## 예측 대상 제품
- 제품명: ${product.productName}
- 카테고리: ${categoryLabel} (${category})
- 서브타입: ${product.wineType ? (WINE_TYPE_LABELS[product.wineType] || product.wineType) : category} (${product.wineType ?? 'N/A'})
- 마개: ${closureLabel} (OTR: ${otr} mg O₂/year)
- 물리화학: pH ${product.ph ?? '미입력'}, 도사주 ${product.dosage ?? '미입력'}g/L, 알코올 ${product.alcohol ?? '미입력'}%
- 환원 성향: ${REDUCTION_POTENTIAL_LABELS[product.reductionPotential]} (${product.reductionPotential})
- 해저 숙성 기간: ${underseaMonths}개월, 수심 ${product.agingDepth}m

${expertProfile ? `## 전문가 테이스팅 기반 투하 전 프로파일 (Google Search 분석)
- 과실향: ${expertProfile.fruity}, 플로럴·미네랄: ${expertProfile.floralMineral}, 효모·숙성: ${expertProfile.yeastyAutolytic}
- 산도·상쾌함: ${expertProfile.acidityFreshness}, 바디감·질감: ${expertProfile.bodyTexture}, 여운·복합미: ${expertProfile.finishComplexity}
${expertSources?.length ? `- 출처: ${expertSources.join(', ')}` : ''}
→ 이 프로파일을 투하 전 기준으로 사용하여 해저 숙성 변화를 예측하세요.

` : ''}${mlResult ? `## ML 모델 예측 (XGBoost, ${cachedSampleCount ?? '112K'}건 학습, 신뢰도 ${Math.round(mlResult.confidence * 100)}%)
- 과실향: ${mlResult.fruity}${mlResult.featureImportance?.fruity ? ` (중요 피처: ${formatTopFeatures(mlResult.featureImportance.fruity)})` : ''}
- 플로럴·미네랄: ${mlResult.floralMineral}
- 효모·숙성향: ${mlResult.yeastyAutolytic}
- 산도·상쾌함: ${mlResult.acidityFreshness}
- 바디감·질감: ${mlResult.bodyTexture}
- 여운·복합미: ${mlResult.finishComplexity}
→ 이 ML 예측을 참고하되, 전문가 지식과 해저 환경 보정으로 최종 판단하세요.
→ ML은 지상 숙성 패턴 기반이므로, 해저 보정(TCI/FRI/BRI)은 별도 적용 필요.

` : ''}## 유사 제품 예측 사례 (Few-shot 참고)
${fewShot}
${CHAIN_OF_THOUGHT_TEMPLATE}
## 응답 형식
JSON 응답 전에 "reasoning" 필드에 위 5단계 분석 과정을 간결하게 기술하세요.
다음 JSON 형식으로만 응답해주세요. 추가 텍스트 없이 JSON만:

{
  "reasoning": "Step 1~5 분석 과정 요약 (한국어, 3~5문장)",
  "flavorProfile": {
    "fruity": 0-100,
    "floralMineral": 0-100,
    "yeastyAutolytic": 0-100,
    "acidityFreshness": 0-100,
    "bodyTexture": 0-100,
    "finishComplexity": 0-100
  },
  "qualityScores": {
    "textureMaturity": 0-100,
    "aromaFreshness": 0-100,
    "offFlavorRisk": 0-100,
    "overallQuality": 0-100
  },
  "harvestWindow": {
    "startMonths": 시작월,
    "endMonths": 종료월
  },
  "agingFactors": {
    "baseAgingYears": 숫자,
    "textureMult": 0.3~1.5,
    "aromaDecay": 0.3~1.5,
    "riskMult": 0.3~2.0,
    "kineticFactor": 0.5~2.0
  },
  "qualityWeights": {
    "texture": 0~1,
    "aroma": 0~1,
    "bubble": 0~1,
    "risk": 0~1
  },
  "beforeCharacter": "투하 전 특징 (한국어, 2-3문장)",
  "afterPrediction": "해저 숙성 후 예상 변화 (한국어, 2-3문장)",
  "riskWarning": "리스크 경고 (한국어) 또는 null"
}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// AI 예측 실행
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gemini API를 사용한 AI 예측 실행
 * 서버 사이드 전용 (API Route에서 호출)
 *
 * 기본: Gemini 3 Flash (@google/genai SDK)
 * 폴백: Gemini 2.5 Flash → 통계 기반
 */
export async function runAIPrediction(
  product: AgingProduct,
  clusters: ClusterMatch[],
  underseaMonths: number,
  config: ParsedUAPSConfig,
  expertProfile?: Record<string, number> | null,
  expertSources?: string[] | null,
  allModels?: TerrestrialModel[],
  oceanConditions?: OceanConditionsForPrediction | null,
  monthlyOceanProfiles?: MonthlyOceanProfile[] | null,
  mlResult?: MLPredictionResult | null,
): Promise<AIPredictionResponse> {
  const prompt = buildPredictionPrompt(product, clusters, underseaMonths, config, expertProfile, expertSources, oceanConditions, monthlyOceanProfiles, mlResult);

  // 모델 우선순위: Gemini 3 Flash → 2.5 Flash → 2.5 Flash Lite
  const GEMINI_MODELS = ['gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];

  try {
    const { GoogleGenAI, ThinkingLevel } = await import('@google/genai');
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY가 설정되지 않았습니다');
    }

    const ai = new GoogleGenAI({ apiKey });

    // 모델 폴백: 429/타임아웃 시 다음 모델로 시도
    const MODEL_TIMEOUT_MS = 30_000; // 모델당 30초 타임아웃
    let lastError: Error | null = null;

    for (const modelName of GEMINI_MODELS) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);

        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2, // 낮은 temperature로 예측 일관성 확보
            // Gemini 3: thinking 수준 low로 속도 최적화
            ...(modelName.startsWith('gemini-3') && {
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            }),
            abortSignal: controller.signal,
          },
        });

        clearTimeout(timeout);

        const responseText = response.text ?? '';
        const jsonText = responseText
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .trim();

        const parsed = JSON.parse(jsonText) as AIPredictionResponse;
        console.log(`UAPS: ${modelName} 예측 성공`);
        return clampPredictionValues(parsed);
      } catch (modelError: unknown) {
        lastError = modelError instanceof Error ? modelError : new Error(String(modelError));
        const isRateLimit = lastError.message.includes('429') || lastError.message.includes('quota') || lastError.message.includes('RESOURCE_EXHAUSTED');
        const isTimeout = lastError.name === 'AbortError' || lastError.message.includes('abort');
        if (!isRateLimit && !isTimeout) throw lastError;
        console.warn(`UAPS: ${modelName} ${isTimeout ? '타임아웃(30s)' : '할당량 초과'}, 다음 모델 시도...`);
      }
    }

    throw lastError || new Error('모든 Gemini 모델 실패');
  } catch (error) {
    // AI 실패 시 Layer 1 통계 기반 폴백
    console.error('UAPS AI 예측 실패, 통계 기반 폴백 사용:', error);
    return buildStatisticalFallback(product, clusters, underseaMonths, config, allModels);
  }
}

/**
 * 전체 예측 결과 생성 (Layer 1 + Layer 2 통합)
 */
export function buildPredictionResult(
  product: AgingProduct,
  aiResponse: AIPredictionResponse,
  clusters: ClusterMatch[],
  underseaMonths: number,
  config: ParsedUAPSConfig,
  expertProfile?: Record<string, number> | null,
  expertSources?: string[] | null,
  allModels?: TerrestrialModel[]
): Omit<AgingPrediction, 'id' | 'createdAt'> {
  // AI 추론 보정 계수 (없으면 DEFAULT 폴백)
  const aiAgingFactors = aiResponse.agingFactors || DEFAULT_AGING_FACTORS;
  const aiQualityWeights = aiResponse.qualityWeights || DEFAULT_QUALITY_WEIGHTS;

  const { startMonths, endMonths, recommendation } = calculateOptimalHarvestWindow(product, config, aiAgingFactors, aiQualityWeights);

  // AI 결과와 통계 결과를 앙상블 (AI 70% + 통계 30%)
  const statisticalFlavors = predictFlavorProfileStatistical(clusters, underseaMonths, config, product, allModels, aiAgingFactors);
  const aiFlavors = aiResponse.flavorProfile;

  const ensembleFlavors = {
    fruity: blend(aiFlavors.fruity, statisticalFlavors.fruity),
    floralMineral: blend(aiFlavors.floralMineral, statisticalFlavors.floralMineral),
    yeastyAutolytic: blend(aiFlavors.yeastyAutolytic, statisticalFlavors.yeastyAutolytic),
    acidityFreshness: blend(aiFlavors.acidityFreshness, statisticalFlavors.acidityFreshness),
    bodyTexture: blend(aiFlavors.bodyTexture, statisticalFlavors.bodyTexture),
    finishComplexity: blend(aiFlavors.finishComplexity, statisticalFlavors.finishComplexity),
  };

  // 신뢰도 = 다중 요소 가중 합산 (0~1)
  const clusterScore = Math.min(clusters.length / 5, 1.0); // 클러스터 매칭 (최대 5개)
  const dataScore = clusters.length > 0
    ? Math.min((clusters.reduce((s, c) => s + (c.model?.sampleCount || 0), 0) / clusters.length) / 200, 1.0)
    : 0; // 학습 데이터 규모
  const expertScore = expertProfile ? 0.9 : 0.4; // 전문가 프로파일 유무
  const tastingScore = (expertSources || []).includes('비교 시음 실측') ? 1.0 : 0.3; // 비교시음 데이터
  const aiFactorScore = aiResponse.agingFactors ? 0.85 : 0.5; // AI 보정 계수 추론 성공

  const predictionConfidence = Math.min(1.0,
    clusterScore * 0.25 +
    dataScore * 0.15 +
    expertScore * 0.20 +
    tastingScore * 0.20 +
    aiFactorScore * 0.20
  );

  return {
    productId: product.id,
    wineType: product.wineType,
    productCategory: (product.productCategory || 'champagne') as ProductCategory,
    inputPh: product.ph,
    inputDosage: product.dosage,
    inputReductionPotential: product.reductionPotential,
    underseaDurationMonths: underseaMonths,
    agingDepth: product.agingDepth,
    immersionDate: product.immersionDate,
    predictedFruity: ensembleFlavors.fruity,
    predictedFloralMineral: ensembleFlavors.floralMineral,
    predictedYeastyAutolytic: ensembleFlavors.yeastyAutolytic,
    predictedAcidityFreshness: ensembleFlavors.acidityFreshness,
    predictedBodyTexture: ensembleFlavors.bodyTexture,
    predictedFinishComplexity: ensembleFlavors.finishComplexity,
    textureMaturityScore: aiResponse.qualityScores.textureMaturity,
    aromaFreshnessScore: aiResponse.qualityScores.aromaFreshness,
    offFlavorRiskScore: aiResponse.qualityScores.offFlavorRisk,
    overallQualityScore: aiResponse.qualityScores.overallQuality,
    optimalHarvestStartMonths: aiResponse.harvestWindow.startMonths || startMonths,
    optimalHarvestEndMonths: aiResponse.harvestWindow.endMonths || endMonths,
    harvestRecommendation: recommendation,
    aiReasoningText: aiResponse.reasoning || null,
    aiInsightText: [aiResponse.beforeCharacter, aiResponse.afterPrediction].filter(Boolean).join('\n') || aiResponse.insight,
    aiRiskWarning: aiResponse.riskWarning,
    expertProfileJson: expertProfile || null,
    expertSources: expertSources || null,
    tciApplied: config.tci,
    friApplied: config.fri,
    briApplied: config.bri,
    predictionConfidence: Math.round(predictionConfidence * 100) / 100,
    agingFactorsJson: aiResponse.agingFactors || null,
    qualityWeightsJson: aiResponse.qualityWeights || null,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 헬퍼
// ═══════════════════════════════════════════════════════════════════════════

/** AI 70% + 통계 30% 앙상블 */
function blend(aiValue: number, statValue: number): number {
  return Math.round((aiValue * 0.7 + statValue * 0.3) * 10) / 10;
}

/** 값 범위 클램핑 + agingFactors/qualityWeights 정규화 */
function clampPredictionValues(response: AIPredictionResponse): AIPredictionResponse {
  const clamp = (v: number) => Math.min(100, Math.max(0, Math.round(v * 10) / 10));

  // agingFactors 범위 클램핑
  let agingFactors: AgingFactors | undefined;
  if (response.agingFactors) {
    const af = response.agingFactors;
    agingFactors = {
      baseAgingYears: Math.min(AGING_FACTORS_RANGE.baseAgingYears.max, Math.max(AGING_FACTORS_RANGE.baseAgingYears.min, af.baseAgingYears ?? DEFAULT_AGING_FACTORS.baseAgingYears)),
      textureMult: Math.min(AGING_FACTORS_RANGE.textureMult.max, Math.max(AGING_FACTORS_RANGE.textureMult.min, af.textureMult ?? DEFAULT_AGING_FACTORS.textureMult)),
      aromaDecay: Math.min(AGING_FACTORS_RANGE.aromaDecay.max, Math.max(AGING_FACTORS_RANGE.aromaDecay.min, af.aromaDecay ?? DEFAULT_AGING_FACTORS.aromaDecay)),
      riskMult: Math.min(AGING_FACTORS_RANGE.riskMult.max, Math.max(AGING_FACTORS_RANGE.riskMult.min, af.riskMult ?? DEFAULT_AGING_FACTORS.riskMult)),
      kineticFactor: Math.min(AGING_FACTORS_RANGE.kineticFactor.max, Math.max(AGING_FACTORS_RANGE.kineticFactor.min, af.kineticFactor ?? DEFAULT_AGING_FACTORS.kineticFactor)),
    };
  }

  // qualityWeights 정규화 (합계 = 1.0)
  let qualityWeights: QualityWeights | undefined;
  if (response.qualityWeights) {
    const qw = response.qualityWeights;
    const sum = (qw.texture ?? 0) + (qw.aroma ?? 0) + (qw.bubble ?? 0) + (qw.risk ?? 0);
    if (sum > 0) {
      qualityWeights = {
        texture: (qw.texture ?? 0) / sum,
        aroma: (qw.aroma ?? 0) / sum,
        bubble: (qw.bubble ?? 0) / sum,
        risk: (qw.risk ?? 0) / sum,
      };
    }
  }

  return {
    flavorProfile: {
      fruity: clamp(response.flavorProfile?.fruity ?? 60),
      floralMineral: clamp(response.flavorProfile?.floralMineral ?? 45),
      yeastyAutolytic: clamp(response.flavorProfile?.yeastyAutolytic ?? 40),
      acidityFreshness: clamp(response.flavorProfile?.acidityFreshness ?? 70),
      bodyTexture: clamp(response.flavorProfile?.bodyTexture ?? 55),
      finishComplexity: clamp(response.flavorProfile?.finishComplexity ?? 50),
    },
    qualityScores: {
      textureMaturity: clamp(response.qualityScores?.textureMaturity ?? 70),
      aromaFreshness: clamp(response.qualityScores?.aromaFreshness ?? 80),
      offFlavorRisk: clamp(response.qualityScores?.offFlavorRisk ?? 20),
      overallQuality: clamp(response.qualityScores?.overallQuality ?? 75),
    },
    harvestWindow: {
      startMonths: response.harvestWindow?.startMonths ?? 12,
      endMonths: response.harvestWindow?.endMonths ?? 18,
    },
    reasoning: response.reasoning || null,
    insight: response.insight || '예측 데이터가 충분하지 않아 통계 기반으로 분석했습니다.',
    beforeCharacter: response.beforeCharacter || '',
    afterPrediction: response.afterPrediction || '',
    riskWarning: response.riskWarning || null,
    agingFactors,
    qualityWeights,
  };
}

/** AI 실패 시 통계 기반 폴백 */
function buildStatisticalFallback(
  product: AgingProduct,
  clusters: ClusterMatch[],
  underseaMonths: number,
  config: ParsedUAPSConfig,
  allModels?: TerrestrialModel[]
): AIPredictionResponse {
  const flavors = predictFlavorProfileStatistical(clusters, underseaMonths, config, product, allModels, DEFAULT_AGING_FACTORS);
  const textureMaturity = calculateTextureMaturity(0, underseaMonths, config.tci);
  const aromaFreshness = calculateAromaFreshness(0, underseaMonths, config.fri);
  const offFlavorRisk = calculateOffFlavorRisk(
    product.reductionPotential || 'low',
    underseaMonths,
    textureMaturity
  );

  const overallQuality = Math.round(
    (textureMaturity * 0.35 + aromaFreshness * 0.35 + (100 - offFlavorRisk) * 0.3) * 10
  ) / 10;

  const { startMonths, endMonths } = calculateOptimalHarvestWindow(product, config);
  const categoryLabel = PRODUCT_CATEGORY_LABELS[(product.productCategory || 'champagne') as ProductCategory] || product.wineType;

  return {
    flavorProfile: {
      fruity: flavors.fruity,
      floralMineral: flavors.floralMineral,
      yeastyAutolytic: flavors.yeastyAutolytic,
      acidityFreshness: flavors.acidityFreshness,
      bodyTexture: flavors.bodyTexture,
      finishComplexity: flavors.finishComplexity,
    },
    qualityScores: {
      textureMaturity,
      aromaFreshness,
      offFlavorRisk,
      overallQuality,
    },
    harvestWindow: { startMonths, endMonths },
    reasoning: null,
    insight: `${categoryLabel} 카테고리의 통계 패턴을 기반으로 예측했습니다.`,
    beforeCharacter: `${categoryLabel} 카테고리의 일반적 풍미 패턴을 기반으로 분석했습니다. 전문가 리뷰 데이터가 없어 통계 기반 프로파일을 사용합니다.`,
    afterPrediction: `${underseaMonths}개월 해저 숙성 시 질감 성숙도 ${textureMaturity}점, 향 신선도 ${aromaFreshness}점으로 예상됩니다. 효모·숙성향과 바디감이 강화되고 과실향은 일부 감소합니다.`,
    riskWarning: offFlavorRisk >= config.riskThresholds.offFlavor
      ? `Off-flavor 리스크가 ${offFlavorRisk}%로 높습니다. 환원 성향(${REDUCTION_POTENTIAL_LABELS[product.reductionPotential]})을 감안하여 ${startMonths}개월 이내 인양을 검토하세요.`
      : null,
    agingFactors: { ...DEFAULT_AGING_FACTORS },
    qualityWeights: { ...DEFAULT_QUALITY_WEIGHTS },
  };
}
