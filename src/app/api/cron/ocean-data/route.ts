/**
 * 해양 데이터 일일 자동 수집 Cron 엔드포인트
 *
 * Vercel Cron에서 매일 KST 10:00 (UTC 01:00) 호출
 * 어제 날짜의 해양 데이터를 Open-Meteo에서 가져와 DB에 저장
 */

import { NextResponse, after } from 'next/server';
import {
  fetchOpenMeteoRawData,
  extractHourlyData,
  processHourlyToDailyData,
  getYesterdayKST,
} from '@/lib/utils/ocean-api';
import { bulkUpsertOceanDataDaily } from '@/lib/supabase/database';

export const maxDuration = 60;

function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    // CRON_SECRET 미설정 시 Vercel 환경에서만 허용
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

    // Open-Meteo API에서 어제 데이터 fetch
    const { marine, weather } = await fetchOpenMeteoRawData(yesterday, yesterday);

    // 시간별 → 일별 집계
    const hourlyData = extractHourlyData(marine, weather);
    const dailyRecords = processHourlyToDailyData(hourlyData);

    if (dailyRecords.length === 0) {
      return NextResponse.json({ message: '수집된 데이터 없음', date: yesterday });
    }

    // DB에 저장 (salinity는 null로 설정)
    const recordsWithSalinity = dailyRecords.map((r) => ({
      ...r,
      salinity: null,
    }));

    const upserted = await bulkUpsertOceanDataDaily(recordsWithSalinity);

    // 로깅은 응답 후 비차단으로 실행 (server-after-nonblocking)
    after(() => {
      console.log(`[Cron] 해양 데이터 저장 완료: ${upserted}건 (${yesterday})`);
    });

    return NextResponse.json({
      success: true,
      date: yesterday,
      recordsUpserted: upserted,
    });
  } catch (error) {
    console.error('[Cron] 해양 데이터 수집 오류:', error);
    return NextResponse.json(
      { error: '데이터 수집 실패', details: String(error) },
      { status: 500 }
    );
  }
}
