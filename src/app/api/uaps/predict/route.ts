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
} from '@/lib/supabase/database/uaps';
import { findSimilarClusters, parseUAPSConfig } from '@/lib/utils/uaps-engine';
import { runAIPrediction, buildPredictionResult } from '@/lib/utils/uaps-ai-predictor';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, underseaDurationMonths, agingDepth } = body;

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

    // 4. Layer 2: AI 예측 실행
    const aiResponse = await runAIPrediction(
      product,
      clusters,
      underseaDurationMonths,
      config
    );

    // 5. 결과 통합 (앙상블)
    const predictionResult = buildPredictionResult(
      product,
      aiResponse,
      clusters,
      underseaDurationMonths,
      config
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
    });
  } catch (error) {
    apiLogger.error('UAPS 예측 API 오류:', error);
    return NextResponse.json(
      { error: '예측 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
