/**
 * 해양 데이터 일일 자동 수집 Cron 엔드포인트
 *
 * Vercel Cron에서 매일 KST 10:00 (UTC 01:00) 호출
 * 어제 날짜의 해양 데이터를 Open-Meteo에서 가져오고,
 * KHOA 국립해양조사원 실측값(염분·조위·수온·기압)을 병합해 DB에 저장
 */

import { NextResponse, after } from 'next/server';
import {
  fetchOpenMeteoRawData,
  extractHourlyData,
  processHourlyToDailyData,
  enrichWithKhoaData,
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

    // Open-Meteo 레코드에 salinity 필드 추가 (KHOA 병합 전 기본값 null)
    const baseRecords = dailyRecords.map((r) => ({
      ...r,
      salinity: null,
    }));

    // KHOA 실측값 병합 (염분·조위·수온·기압). reqDate는 yyyyMMdd 포맷 필수.
    // KHOA 실패 시 enrichWithKhoaData가 원본을 그대로 반환 (graceful degradation)
    const khoaReqDate = yesterday.replaceAll('-', '');
    const mergedRecords = await enrichWithKhoaData(baseRecords, khoaReqDate);

    const upserted = await bulkUpsertOceanDataDaily(mergedRecords);

    // 병합 결과 요약 (KHOA 실측 반영 여부 확인용)
    const khoaMerged = mergedRecords.filter((r) => r.dataSource === 'hybrid').length;

    // 로깅은 응답 후 비차단으로 실행 (server-after-nonblocking)
    after(() => {
      console.log(`[Cron] 해양 데이터 저장 완료: ${upserted}건 (${yesterday}), KHOA 병합 ${khoaMerged}건`);
    });

    return NextResponse.json({
      success: true,
      date: yesterday,
      recordsUpserted: upserted,
      khoaMerged,
    });
  } catch (error) {
    console.error('[Cron] 해양 데이터 수집 오류:', error);
    return NextResponse.json(
      { error: '데이터 수집 실패', details: String(error) },
      { status: 500 }
    );
  }
}
