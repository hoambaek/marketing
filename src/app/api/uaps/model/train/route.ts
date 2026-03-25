/**
 * UAPS 모델 학습 API
 * POST /api/uaps/model/train
 *
 * Layer 1: 전체 지상 데이터를 통계적으로 집계하여 terrestrial_model 저장
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { apiLogger } from '@/lib/logger';
import {
  fetchWineTerrestrialData,
  fetchWineTerrestrialDataCount,
  upsertTerrestrialModel,
} from '@/lib/supabase/database/uaps';
import { trainTerrestrialModel } from '@/lib/utils/uaps-engine';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // 1. 전체 데이터 건수 확인 (RLS 실패 시 폴백으로 직접 로드)
    let totalCount = await fetchWineTerrestrialDataCount();
    apiLogger.log(`UAPS 모델 학습 시작: count=${totalCount}건`);

    // 2. 전체 데이터 로드 (배치) — count가 0이어도 실제 로드 시도
    const allData = [];
    const BATCH_SIZE = 1000;
    const maxOffset = totalCount > 0 ? totalCount : 200_000; // count 실패 시 최대 20만건까지 시도
    for (let offset = 0; offset < maxOffset; offset += BATCH_SIZE) {
      const batch = await fetchWineTerrestrialData({
        limit: BATCH_SIZE,
        offset,
      });
      if (!batch || batch.length === 0) break;
      allData.push(...batch);
    }

    totalCount = allData.length;

    if (totalCount < 100) {
      return NextResponse.json(
        { error: `학습에 최소 100건의 데이터가 필요합니다. 현재: ${totalCount}건` },
        { status: 400 }
      );
    }

    apiLogger.log(`UAPS: ${allData.length}건 로드 완료, 학습 시작`);

    // 3. 통계 학습 실행
    const models = trainTerrestrialModel(allData);

    apiLogger.log(`UAPS: ${models.length}개 모델 그룹 생성`);

    // 4. DB에 저장 (upsert)
    let savedCount = 0;
    for (const model of models) {
      const result = await upsertTerrestrialModel(model);
      if (result) savedCount++;
    }

    apiLogger.log(`UAPS: ${savedCount}개 모델 저장 완료`);

    return NextResponse.json({
      totalData: allData.length,
      modelsCreated: models.length,
      modelsSaved: savedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    apiLogger.error('UAPS 모델 학습 오류:', error);
    return NextResponse.json(
      { error: '모델 학습 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
