import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { apiLogger } from '@/lib/logger';
import {
  fetchOpenMeteoRawData,
  formatCombinedResponse,
} from '@/lib/utils/ocean-api';

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

    const { marine, weather } = await fetchOpenMeteoRawData(start, end);
    const combinedData = formatCombinedResponse(marine, weather);

    return NextResponse.json(combinedData);
  } catch (error) {
    apiLogger.error('Ocean Data API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
