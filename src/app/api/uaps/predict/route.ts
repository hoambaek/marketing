/**
 * UAPS AI 예측 API
 * POST /api/uaps/predict
 *
 * Layer 1 (통계 매칭) + Layer 2 (Gemini AI 추론) 실행
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { apiLogger } from '@/lib/logger';
import {
  fetchAgingProductById,
  fetchTerrestrialModels,
  fetchUAPSConfig,
  createAgingPrediction,
  fetchRetrievalResults,
} from '@/lib/supabase/database/uaps';
import { fetchOceanDataDaily } from '@/lib/supabase/database';
import { findSimilarClusters, parseUAPSConfig } from '@/lib/utils/uaps-engine';
import { runAIPrediction, buildPredictionResult, generateExpertProfile } from '@/lib/utils/uaps-ai-predictor';
import { buildMonthlyOceanProfiles, type MonthlyOceanProfile } from '@/lib/utils/uaps-ocean-profile';
import { predictWithXGBoost, type MLPredictionResult } from '@/lib/utils/uaps-ml-predictor';
import { updateAllCoefficients, type BayesianUpdateResult } from '@/lib/utils/uaps-bayesian';
import { fetchAgingPredictions } from '@/lib/supabase/database/uaps';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, underseaDurationMonths, agingDepth, oceanConditions } = body;

    if (!productId || !underseaDurationMonths) {
      return NextResponse.json(
        { error: 'productId와 underseaDurationMonths가 필요합니다.' },
        { status: 400 }
      );
    }

    // 1. 제품 정보 조회
    const product = await fetchAgingProductById(productId);
    if (!product) {
      return NextResponse.json({ error: '제품을 찾을 수 없습니다.' }, { status: 404 });
    }

    // agingDepth 오버라이드
    if (agingDepth) {
      product.agingDepth = agingDepth;
    }

    // 2. 설정 조회 및 파싱
    const configRows = await fetchUAPSConfig();
    const config = parseUAPSConfig(configRows || []);

    // 3. Layer 1: 학습 모델에서 유사 클러스터 매칭
    const models = await fetchTerrestrialModels();
    const clusters = findSimilarClusters(product, models || [], 5);

    apiLogger.log('UAPS: 매칭 클러스터', clusters.length, '개');

    // 3.5. 해양 프로파일 서버사이드 구축
    let monthlyOceanProfiles: MonthlyOceanProfile[] | null = null;
    try {
      const oceanData = await fetchOceanDataDaily();
      if (oceanData && oceanData.length > 0) {
        monthlyOceanProfiles = buildMonthlyOceanProfiles(oceanData);
        apiLogger.log('UAPS: 월별 해양 프로파일 구축 완료 —', oceanData.length, '일 →', monthlyOceanProfiles.length, '개월');
      }
    } catch (e) {
      apiLogger.warn('UAPS: 해양 프로파일 구축 실패, 기본값으로 진행:', e);
    }

    // 3.6. 전문가 프로파일 생성 (Google Search grounding)
    let expertProfile: Record<string, number> | null = null;
    let expertSources: string[] | null = null;
    try {
      const expertResult = await generateExpertProfile(product, monthlyOceanProfiles);
      if (expertResult) {
        expertProfile = expertResult.profile;
        expertSources = expertResult.sources;
        apiLogger.log('UAPS: 전문가 프로파일 생성 성공 (신뢰도:', expertResult.confidence, ')');
      }
    } catch (e) {
      apiLogger.warn('UAPS: 전문가 프로파일 생성 실패, 통계 기반 사용:', e);
    }

    // 3.7. v5.1: 비교 시음 '해저 실측'으로 전문가 프로파일 보정 (실측 70% + AI 30%)
    // 이전(v5.0)엔 terrestrial(지상 대조군)만, 그것도 .find() 1건만 블렌딩해서
    // 실제 해저에서 측정된 프로파일(예: 감칠맛 85)이 레이더에 반영되지 않았다.
    // 인양된 제품은 관측값(actual)이 모델 예측을 이겨야 하므로 actual_* 6축의 패널 평균을 쓴다.
    try {
      const retrievals = await fetchRetrievalResults(productId);
      const measured = (retrievals || []).filter(r => !r.isSimulated && r.actualBodyTexture != null);
      if (measured.length > 0) {
        const avg = (get: (r: (typeof measured)[number]) => number | null): number | null => {
          const vals = measured.map(get).filter((v): v is number => v != null);
          return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
        };
        const tasting: Record<string, number | null> = {
          fruity: avg(r => r.actualFruity),
          floralMineral: avg(r => r.actualFloralMineral),
          yeastyAutolytic: avg(r => r.actualYeastyAutolytic),
          acidityFreshness: avg(r => r.actualAcidityFreshness),
          bodyTexture: avg(r => r.actualBodyTexture),
          finishComplexity: avg(r => r.actualFinishComplexity),
        };
        if (expertProfile) {
          // 실측 70% + AI 전문가 30% 블렌딩 (해당 축 실측이 없으면 기존 값 유지)
          for (const key of Object.keys(tasting)) {
            const t = tasting[key];
            if (t == null) continue;
            expertProfile[key] = Math.round(t * 0.7 + (expertProfile[key] ?? t) * 0.3);
          }
        } else {
          // 전문가 프로파일이 없으면 실측 평균으로(빈 축은 중립 50)
          expertProfile = Object.fromEntries(
            Object.keys(tasting).map(k => [k, Math.round(tasting[k] ?? 50)])
          );
        }
        expertSources = [...(expertSources || []), '비교 시음 실측(해저)'];
        apiLogger.log(`UAPS: 해저 실측 ${measured.length}건 평균으로 전문가 프로파일 보정 (실측 70% + AI 30%)`);
      }
    } catch (e) {
      apiLogger.warn('UAPS: 비교 시음 데이터 조회 실패:', e);
    }

    // 3.8. v5.0: 베이지안 계수 업데이트 (해저 숙성 시음 데이터가 있을 때)
    let bayesianResult: BayesianUpdateResult | null = null;
    try {
      const retrievals = await fetchRetrievalResults(productId);
      // 베이지안 계수(TCI/FRI/BRI)는 '해저 숙성' 실측에서만 역산된다.
      // 지상 비교시음(actualDurationMonths=0)은 해저 효과가 없어 uaps-bayesian.ts의
      // extractCoefficientObservations가 어차피 스킵하므로, 여기서 미리 제외한다.
      // (제외하지 않으면 withActual.length>0로 블록에 진입해 관측 0건인데도
      //  config 계수를 DEFAULT_PRIORS로 리셋하고 'applied: N건'을 허위 보고했다.)
      const withActual = retrievals?.filter(r =>
        !r.isSimulated && r.actualBodyTexture != null && r.actualDurationMonths > 0
      ) || [];

      if (withActual.length > 0) {
        const predictions = await fetchAgingPredictions(productId, 100);
        if (predictions && predictions.length > 0) {
          bayesianResult = updateAllCoefficients(withActual, predictions);

          // 사후분포로 config 보정 계수 업데이트
          config.tci = bayesianResult.tci.posterior;
          config.fri = bayesianResult.fri.posterior;
          config.bri = bayesianResult.bri.posterior;

          apiLogger.log(
            `UAPS: 베이지안 업데이트 적용 (${withActual.length}건) — ` +
            `TCI: ${bayesianResult.tci.prior}→${bayesianResult.tci.posterior}, ` +
            `FRI: ${bayesianResult.fri.prior}→${bayesianResult.fri.posterior}, ` +
            `BRI: ${bayesianResult.bri.prior}→${bayesianResult.bri.posterior}`
          );
        }
      }
    } catch (e) {
      apiLogger.warn('UAPS: 베이지안 업데이트 실패, 기본 계수 사용:', e);
    }

    // 3.9. v5.0: ML 예측 (XGBoost, 모델 파일 있을 때만)
    let mlResult: MLPredictionResult | null = null;
    try {
      mlResult = await predictWithXGBoost({
        productCategory: product.productCategory || 'champagne',
        agingStage: 'developing', // 기본값, 클러스터에서 추론 가능
        pH: product.ph,
        dosage: product.dosage,
        alcohol: product.alcohol,
        acidity: product.acidity,
        reductionPotential: product.reductionPotential || 'low',
        agingYears: product.terrestrialAgingYears,
      });
      if (mlResult) {
        apiLogger.log('UAPS: XGBoost ML 예측 성공 (신뢰도:', mlResult.confidence, ')');
      }
    } catch (e) {
      apiLogger.warn('UAPS: ML 예측 실패, 통계 기반 사용:', e);
    }

    // 4. Layer 2: AI 예측 실행 (전문가 프로파일 + ML 결과 + 전체 모델 + 해양 데이터 전달)
    const aiResponse = await runAIPrediction(
      product,
      clusters,
      underseaDurationMonths,
      config,
      expertProfile,
      expertSources,
      models || [],
      oceanConditions || null,
      monthlyOceanProfiles,
      mlResult,
    );

    // 5. 결과 통합 (앙상블 + Pseudo-cohort t=0 앵커)
    const predictionResult = buildPredictionResult(
      product,
      aiResponse,
      clusters,
      underseaDurationMonths,
      config,
      expertProfile,
      expertSources,
      models || [],
      monthlyOceanProfiles,
    );

    // 6. DB에 저장
    const saved = await createAgingPrediction(predictionResult);

    if (!saved) {
      return NextResponse.json(
        { error: '예측 결과 저장에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      prediction: saved,
      matchedClusters: clusters.length,
      modelUsed: clusters.length > 0 ? 'hybrid' : 'statistical_fallback',
      mlModelUsed: mlResult !== null,
      mlConfidence: mlResult?.confidence ?? null,
      oceanProfileUsed: monthlyOceanProfiles !== null,
      monthlyProfileCount: monthlyOceanProfiles?.length || 0,
      bayesianUpdate: bayesianResult ? {
        applied: true,
        sampleCount: bayesianResult.sampleCount,
        tci: bayesianResult.tci,
        fri: bayesianResult.fri,
        bri: bayesianResult.bri,
        rmse: bayesianResult.overallRMSE,
        mae: bayesianResult.overallMAE,
      } : { applied: false },
    });
  } catch (error) {
    apiLogger.error('UAPS 예측 API 오류:', error);
    return NextResponse.json(
      { error: '예측 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
