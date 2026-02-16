/**
 * 해양 데이터 백필 엔드포인트
 *
 * 2026-01-01부터 어제까지 누락된 날짜의 데이터를 일괄 수집
 * 수동 1회 호출용 (또는 페이지에서 버튼으로 트리거)
 * Open-Meteo API를 30일 단위 청크로 나눠서 호출
 */

import { NextResponse } from 'next/server';
import {
  fetchOpenMeteoRawData,
  extractHourlyData,
  processHourlyToDailyData,
  getYesterdayKST,
  splitDateRange,
} from '@/lib/utils/ocean-api';
import {
  bulkUpsertOceanDataDaily,
  fetchExistingDates,
} from '@/lib/supabase/database';

export const maxDuration = 300; // 백필은 오래 걸릴 수 있음

const BACKFILL_START_DATE = '2026-01-01';
const CHUNK_DAYS = 30;

function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return request.headers.get('x-vercel-cron') === '1';
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 });
  }

  try {
    const yesterday = getYesterdayKST();
    console.log(`[백필] 시작: ${BACKFILL_START_DATE} ~ ${yesterday}`);

    // 이미 저장된 날짜 조회
    const existingDates = await fetchExistingDates(BACKFILL_START_DATE, yesterday);
    console.log(`[백필] 기존 데이터: ${existingDates.size}일`);

    // 전체 기간 계산
    const start = new Date(BACKFILL_START_DATE);
    const end = new Date(yesterday);
    const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const missingDays = totalDays - existingDates.size;

    if (missingDays <= 0) {
      console.log('[백필] 누락 데이터 없음');
      return NextResponse.json({
        success: true,
        message: '누락 데이터 없음',
        existingDays: existingDates.size,
        totalDays,
      });
    }

    console.log(`[백필] 누락 일수: ${missingDays}/${totalDays}`);

    // 30일 단위 청크로 분할
    const chunks = splitDateRange(BACKFILL_START_DATE, yesterday, CHUNK_DAYS);
    let totalUpserted = 0;
    let chunksProcessed = 0;

    for (const chunk of chunks) {
      try {
        console.log(`[백필] 청크 처리 중: ${chunk.start} ~ ${chunk.end} (${chunksProcessed + 1}/${chunks.length})`);

        // Open-Meteo API에서 데이터 fetch
        const { marine, weather } = await fetchOpenMeteoRawData(chunk.start, chunk.end);

        // 시간별 → 일별 집계
        const hourlyData = extractHourlyData(marine, weather);
        const dailyRecords = processHourlyToDailyData(hourlyData);

        if (dailyRecords.length === 0) {
          console.log(`[백필] 청크 ${chunk.start}~${chunk.end}: 데이터 없음`);
          chunksProcessed++;
          continue;
        }

        // 누락된 날짜만 필터 (기존 데이터 보존, salinity 유지 위해)
        const newRecords = dailyRecords
          .filter((r) => !existingDates.has(r.date))
          .map((r) => ({ ...r, salinity: null }));

        if (newRecords.length > 0) {
          const upserted = await bulkUpsertOceanDataDaily(newRecords);
          totalUpserted += upserted;
          console.log(`[백필] 청크 ${chunk.start}~${chunk.end}: ${upserted}건 저장`);
        }

        chunksProcessed++;

        // API rate limit 방지 (청크 사이 짧은 딜레이)
        if (chunksProcessed < chunks.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (chunkError) {
        console.error(`[백필] 청크 ${chunk.start}~${chunk.end} 오류:`, chunkError);
        // 실패한 청크는 건너뛰고 계속 진행
        chunksProcessed++;
        continue;
      }
    }

    console.log(`[백필] 완료: 총 ${totalUpserted}건 저장`);

    return NextResponse.json({
      success: true,
      period: { start: BACKFILL_START_DATE, end: yesterday },
      totalDays,
      existingDays: existingDates.size,
      missingDays,
      chunksProcessed,
      totalChunks: chunks.length,
      recordsUpserted: totalUpserted,
    });
  } catch (error) {
    console.error('[백필] 오류:', error);
    return NextResponse.json(
      { error: '백필 실패', details: String(error) },
      { status: 500 }
    );
  }
}
