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
} from '@/lib/types/uaps';
import type { ClusterMatch } from './uaps-engine';
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
  DEFAULT_AGING_FACTORS,
  DEFAULT_QUALITY_WEIGHTS,
  AGING_FACTORS_RANGE,
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
  product: AgingProduct
): Promise<ExpertProfileResult | null> {
  const { GoogleGenAI } = await import('@google/genai');
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildExpertProfilePrompt(product);

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

function buildExpertProfilePrompt(product: AgingProduct): string {
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
}`;
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
 */
export function applyAgingAdjustments(
  beforeProfile: Record<string, number>,
  underseaMonths: number,
  config: ParsedUAPSConfig,
): Record<string, number> {
  const result: Record<string, number> = {};
  const monthFactor = underseaMonths / 12;

  for (const [key, baseValue] of Object.entries(beforeProfile)) {
    let adjusted = baseValue;

    if (key === 'fruity') {
      adjusted *= Math.exp(-0.02 * underseaMonths * config.fri);
    } else if (key === 'floralMineral') {
      adjusted += monthFactor * 4;
    } else if (key === 'yeastyAutolytic') {
      adjusted += monthFactor * (1 / config.tci) * 5;
    } else if (key === 'acidityFreshness') {
      adjusted *= Math.exp(-0.015 * underseaMonths * config.fri);
    } else if (key === 'bodyTexture') {
      adjusted += monthFactor * (1 / config.tci) * 4;
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
  insight: string;
  beforeCharacter: string;
  afterPrediction: string;
  riskWarning: string | null;
  agingFactors?: AgingFactors;
  qualityWeights?: QualityWeights;
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
  expertSources?: string[] | null
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

  return `당신은 식음 숙성 과학 전문가입니다.
아래 데이터를 기반으로 해저 숙성 후 풍미를 예측해주세요.

## 학습된 지상 숙성 패턴 (매칭 클러스터 상위 3개)
${JSON.stringify(clusterContext, null, 2)}

## 해저 숙성 보정 계수 (과학적 근거)
- TCI (질감 가속): ${config.tci} (95% CI: ${config.tciMeta.lower95}-${config.tciMeta.upper95})
  근거: ${config.tciMeta.sourceDescription}
  해저에서 질감 성숙이 ${(1 / config.tci).toFixed(1)}배 가속
- FRI (신선도 유지): ${config.fri} (95% CI: ${config.friMeta.lower95}-${config.friMeta.upper95})
  근거: ${config.friMeta.sourceDescription}
  산화 속도가 ${(config.fri * 100).toFixed(0)}% 수준으로 감속
- BRI (기포 안정화): ${config.bri} (95% CI: ${config.briMeta.lower95}-${config.briMeta.upper95})
  근거: ${config.briMeta.sourceDescription}
  효과: 외부 수압이 CO₂ 손실 구동력 감소 → 용존 CO₂ 안정화 → 기포 핵 균질화 → 기포가 작고 조밀해짐

## 예측 대상 제품
- 제품명: ${product.productName}
- 카테고리: ${categoryLabel} (${category})
- 서브타입: ${product.wineType ? (WINE_TYPE_LABELS[product.wineType] || product.wineType) : category} (${product.wineType ?? 'N/A'})
- 물리화학: pH ${product.ph ?? '미입력'}, 도사주 ${product.dosage ?? '미입력'}g/L, 알코올 ${product.alcohol ?? '미입력'}%
- 환원 성향: ${REDUCTION_POTENTIAL_LABELS[product.reductionPotential]} (${product.reductionPotential})
- 해저 숙성 기간: ${underseaMonths}개월, 수심 ${product.agingDepth}m

${expertProfile ? `## 전문가 테이스팅 기반 투하 전 프로파일 (Google Search 분석)
- 과실향: ${expertProfile.fruity}, 플로럴·미네랄: ${expertProfile.floralMineral}, 효모·숙성: ${expertProfile.yeastyAutolytic}
- 산도·상쾌함: ${expertProfile.acidityFreshness}, 바디감·질감: ${expertProfile.bodyTexture}, 여운·복합미: ${expertProfile.finishComplexity}
${expertSources?.length ? `- 출처: ${expertSources.join(', ')}` : ''}
→ 이 프로파일을 투하 전 기준으로 사용하여 해저 숙성 변화를 예측하세요.

` : ''}## 요청
다음 JSON 형식으로만 응답해주세요. 추가 텍스트 없이 JSON만:

{
  "flavorProfile": {
    "fruity": 0-100,           // 과실향 (감귤류, 과일, 열대과일)
    "floralMineral": 0-100,    // 플로럴·미네랄 (꽃향, 백악, 부싯돌)
    "yeastyAutolytic": 0-100,  // 효모·숙성향 (브리오슈, 자가분해)
    "acidityFreshness": 0-100, // 산도·상쾌함 (산미, 크리스피)
    "bodyTexture": 0-100,      // 바디감·질감 (크리미, 무스, 풍부함)
    "finishComplexity": 0-100  // 여운·복합미 (깊이, 레이어)
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
    "baseAgingYears": 숫자,  // 이 카테고리 제품의 투하 전 평균 숙성 기간(년). 와인:2.0, 커피:0.5, 사케:1.0, 위스키:5.0 등
    "textureMult": 0.3~1.5,  // 질감 가속 배수. 높을수록 해저에서 질감이 빨리 변함. 예: 위스키 1.3, 식초 0.5
    "aromaDecay": 0.3~1.5,   // 향 감소 속도 배수. 높을수록 향이 빨리 감소. 예: 커피 1.4, 보이차 0.4
    "riskMult": 0.3~2.0      // 환원/결함 리스크 배수. 예: 와인 1.0, 간장 0.5
  },
  "qualityWeights": {
    "texture": 0~1,   // 질감 가중치 (합계 1.0)
    "aroma": 0~1,     // 향 가중치
    "bubble": 0~1,    // 기포/탄산 가중치 (기포 없는 제품은 0 또는 매우 낮게)
    "risk": 0~1       // 리스크 가중치
  },
  "beforeCharacter": "투하 전 이 제품의 원래 특징 (한국어, 2-3문장)",
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
  allModels?: TerrestrialModel[]
): Promise<AIPredictionResponse> {
  const prompt = buildPredictionPrompt(product, clusters, underseaMonths, config, expertProfile, expertSources);

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

  // 신뢰도 = 매칭 클러스터 수 기반
  const predictionConfidence = Math.min(clusters.length / 5, 1.0);

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
    insight: `${categoryLabel} 카테고리의 통계 패턴을 기반으로 예측했습니다.`,
    beforeCharacter: `${categoryLabel} 카테고리의 일반적 풍미 패턴을 기반으로 분석했습니다. 전문가 리뷰 데이터가 없어 통계 기반 프로파일을 사용합니다.`,
    afterPrediction: `${underseaMonths}개월 해저 숙성 시 질감 성숙도 ${textureMaturity}점, 향 신선도 ${aromaFreshness}점으로 예상됩니다. 효모·숙성향과 바디감이 강화되고 과실향은 일부 감소합니다.`,
    riskWarning: offFlavorRisk >= config.riskThresholds.offFlavor
      ? `Off-flavor 리스크가 ${offFlavorRisk}%로 높습니다. 환원 성향(${REDUCTION_POTENTIAL_LABELS[product.reductionPotential]})을 감안하여 ${startMonths}개월 이내 인양을 검토하세요.`
      : null,
    agingFactors: DEFAULT_AGING_FACTORS,
    qualityWeights: DEFAULT_QUALITY_WEIGHTS,
  };
}
