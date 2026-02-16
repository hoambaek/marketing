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
  ParsedUAPSConfig,
} from '@/lib/types/uaps';
import type { ClusterMatch } from './uaps-engine';
import {
  calculateTextureMaturity,
  calculateAromaFreshness,
  calculateOffFlavorRisk,
  calculateOptimalHarvestWindow,
  predictFlavorProfileStatistical,
} from './uaps-engine';
import { WINE_TYPE_LABELS, REDUCTION_POTENTIAL_LABELS } from '@/lib/types/uaps';

// ═══════════════════════════════════════════════════════════════════════════
// AI 예측 응답 타입
// ═══════════════════════════════════════════════════════════════════════════

interface AIPredictionResponse {
  flavorProfile: {
    citrus: number;
    brioche: number;
    honey: number;
    nutty: number;
    toast: number;
    oxidation: number;
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
  riskWarning: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// 프롬프트 생성
// ═══════════════════════════════════════════════════════════════════════════

function buildPredictionPrompt(
  product: AgingProduct,
  clusters: ClusterMatch[],
  underseaMonths: number,
  config: ParsedUAPSConfig
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

  return `당신은 와인 숙성 과학 전문가입니다.
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
- 와인 타입: ${WINE_TYPE_LABELS[product.wineType]} (${product.wineType})
- 물리화학: pH ${product.ph ?? '미입력'}, 도사주 ${product.dosage ?? '미입력'}g/L, 알코올 ${product.alcohol ?? '미입력'}%
- 환원 성향: ${REDUCTION_POTENTIAL_LABELS[product.reductionPotential]} (${product.reductionPotential})
- 해저 숙성 기간: ${underseaMonths}개월, 수심 ${product.agingDepth}m

## 요청
다음 JSON 형식으로만 응답해주세요. 추가 텍스트 없이 JSON만:

{
  "flavorProfile": {
    "citrus": 0-100,
    "brioche": 0-100,
    "honey": 0-100,
    "nutty": 0-100,
    "toast": 0-100,
    "oxidation": 0-100
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
  "insight": "예측 근거 설명 (한국어, 2-3문장. 유사 와인 언급 포함)",
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
  config: ParsedUAPSConfig
): Promise<AIPredictionResponse> {
  const prompt = buildPredictionPrompt(product, clusters, underseaMonths, config);

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
    return buildStatisticalFallback(product, clusters, underseaMonths, config);
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
  config: ParsedUAPSConfig
): Omit<AgingPrediction, 'id' | 'createdAt'> {
  const { startMonths, endMonths, recommendation } = calculateOptimalHarvestWindow(product, config);

  // AI 결과와 통계 결과를 앙상블 (AI 70% + 통계 30%)
  const statisticalFlavors = predictFlavorProfileStatistical(clusters, underseaMonths, config);
  const aiFlavors = aiResponse.flavorProfile;

  const ensembleFlavors = {
    citrus: blend(aiFlavors.citrus, statisticalFlavors.citrus),
    brioche: blend(aiFlavors.brioche, statisticalFlavors.brioche),
    honey: blend(aiFlavors.honey, statisticalFlavors.honey),
    nutty: blend(aiFlavors.nutty, statisticalFlavors.nutty),
    toast: blend(aiFlavors.toast, statisticalFlavors.toast),
    oxidation: blend(aiFlavors.oxidation, statisticalFlavors.oxidation),
  };

  // 신뢰도 = 매칭 클러스터 수 기반
  const predictionConfidence = Math.min(clusters.length / 5, 1.0);

  return {
    productId: product.id,
    wineType: product.wineType,
    inputPh: product.ph,
    inputDosage: product.dosage,
    inputReductionPotential: product.reductionPotential,
    underseaDurationMonths: underseaMonths,
    agingDepth: product.agingDepth,
    immersionDate: product.immersionDate,
    predictedCitrus: ensembleFlavors.citrus,
    predictedBrioche: ensembleFlavors.brioche,
    predictedHoney: ensembleFlavors.honey,
    predictedNutty: ensembleFlavors.nutty,
    predictedToast: ensembleFlavors.toast,
    predictedOxidation: ensembleFlavors.oxidation,
    textureMaturityScore: aiResponse.qualityScores.textureMaturity,
    aromaFreshnessScore: aiResponse.qualityScores.aromaFreshness,
    offFlavorRiskScore: aiResponse.qualityScores.offFlavorRisk,
    overallQualityScore: aiResponse.qualityScores.overallQuality,
    optimalHarvestStartMonths: aiResponse.harvestWindow.startMonths || startMonths,
    optimalHarvestEndMonths: aiResponse.harvestWindow.endMonths || endMonths,
    harvestRecommendation: recommendation,
    aiInsightText: aiResponse.insight,
    aiRiskWarning: aiResponse.riskWarning,
    tciApplied: config.tci,
    friApplied: config.fri,
    briApplied: config.bri,
    predictionConfidence: Math.round(predictionConfidence * 100) / 100,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 헬퍼
// ═══════════════════════════════════════════════════════════════════════════

/** AI 70% + 통계 30% 앙상블 */
function blend(aiValue: number, statValue: number): number {
  return Math.round((aiValue * 0.7 + statValue * 0.3) * 10) / 10;
}

/** 값 범위 0-100 클램핑 */
function clampPredictionValues(response: AIPredictionResponse): AIPredictionResponse {
  const clamp = (v: number) => Math.min(100, Math.max(0, Math.round(v * 10) / 10));

  return {
    flavorProfile: {
      citrus: clamp(response.flavorProfile?.citrus ?? 50),
      brioche: clamp(response.flavorProfile?.brioche ?? 30),
      honey: clamp(response.flavorProfile?.honey ?? 20),
      nutty: clamp(response.flavorProfile?.nutty ?? 15),
      toast: clamp(response.flavorProfile?.toast ?? 10),
      oxidation: clamp(response.flavorProfile?.oxidation ?? 5),
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
    riskWarning: response.riskWarning || null,
  };
}

/** AI 실패 시 통계 기반 폴백 */
function buildStatisticalFallback(
  product: AgingProduct,
  clusters: ClusterMatch[],
  underseaMonths: number,
  config: ParsedUAPSConfig
): AIPredictionResponse {
  const flavors = predictFlavorProfileStatistical(clusters, underseaMonths, config);
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

  return {
    flavorProfile: {
      citrus: flavors.citrus,
      brioche: flavors.brioche,
      honey: flavors.honey,
      nutty: flavors.nutty,
      toast: flavors.toast,
      oxidation: flavors.oxidation,
    },
    qualityScores: {
      textureMaturity,
      aromaFreshness,
      offFlavorRisk,
      overallQuality,
    },
    harvestWindow: { startMonths, endMonths },
    insight: `${WINE_TYPE_LABELS[product.wineType]} 타입의 통계 패턴을 기반으로 예측했습니다. ${underseaMonths}개월 해저 숙성 시 질감 성숙도 ${textureMaturity}점, 향 신선도 ${aromaFreshness}점으로 예상됩니다.`,
    riskWarning: offFlavorRisk >= config.riskThresholds.offFlavor
      ? `Off-flavor 리스크가 ${offFlavorRisk}%로 높습니다. 환원 성향(${REDUCTION_POTENTIAL_LABELS[product.reductionPotential]})을 감안하여 ${startMonths}개월 이내 인양을 검토하세요.`
      : null,
  };
}
