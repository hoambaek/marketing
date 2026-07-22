import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { apiLogger } from '@/lib/logger';
import {
  fetchOpenMeteoRawData,
  fetchKhoaHybridData,
  formatHybridResponse,
} from '@/lib/utils/ocean-api';
import {
  bulkUpsertOceanDataDaily,
  updateOceanDataSalinity,
} from '@/lib/supabase/database/ocean-data-admin';
import type { OceanDataDaily } from '@/lib/types';

type OceanDataInput = Omit<OceanDataDaily, 'id' | 'createdAt' | 'updatedAt'>;

export async function GET(request: Request) {
  // 인증 확인 (Defense in Depth)
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  try {
    // 날짜 미지정 시 오늘 기준
    const today = new Date().toISOString().split('T')[0];
    const start = startDate || today;
    const end = endDate || today;

    // 1. KHOA + Open-Meteo 동시 호출 (KHOA 실패 시 null 반환)
    const [openMeteoResult, khoaResult] = await Promise.all([
      fetchOpenMeteoRawData(start, end),
      fetchKhoaHybridData(),
    ]);

    // 2. 세 소스 병합하여 하이브리드 응답 구성
    const hybridData = formatHybridResponse(
      openMeteoResult.marine,
      openMeteoResult.weather,
      khoaResult,
    );

    if (khoaResult) {
      apiLogger.info(`하이브리드 응답: KHOA(${khoaResult.khoaData.station}) + Open-Meteo`);
    } else {
      apiLogger.info('Open-Meteo 단독 응답 (KHOA 미사용)');
    }

    return NextResponse.json(hybridData);
  } catch (error) {
    apiLogger.error('Ocean Data API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// ocean_data_daily 쓰기 — service_role 경유 (anon write 정책 제거, 2026-07-22)
// POST: 데이터로그 자동저장(벌크 upsert) / PATCH: 염분 단건 수정
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { rows } = (await request.json()) as { rows: OceanDataInput[] };
  if (!Array.isArray(rows)) {
    return NextResponse.json({ error: 'rows 배열이 필요합니다.' }, { status: 400 });
  }

  const upserted = await bulkUpsertOceanDataDaily(rows);
  return NextResponse.json({ upserted });
}

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { date, salinity } = (await request.json()) as { date: string; salinity: number };
  if (!date || typeof salinity !== 'number') {
    return NextResponse.json({ error: 'date와 salinity(number)가 필요합니다.' }, { status: 400 });
  }

  const success = await updateOceanDataSalinity(date, salinity);
  return NextResponse.json({ success });
}
