import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { fetchKhoaRecentData, aggregateKhoaDaily } from '@/lib/utils/khoa-api';

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const reqDate = searchParams.get('date') || undefined; // yyyyMMdd
  const obsCode = searchParams.get('obsCode') || undefined;
  const min = searchParams.get('min') ? parseInt(searchParams.get('min')!) : 60;
  const format = searchParams.get('format') || 'daily'; // 'daily' | 'hourly'

  try {
    const items = await fetchKhoaRecentData({ obsCode, reqDate, min });

    if (format === 'hourly') {
      return NextResponse.json({
        station: items[0]?.obsvtrNm || '알 수 없음',
        coordinates: items[0] ? { lat: items[0].lat, lon: items[0].lot } : null,
        totalCount: items.length,
        data: items,
      });
    }

    const daily = aggregateKhoaDaily(items);
    return NextResponse.json({
      station: items[0]?.obsvtrNm || '알 수 없음',
      coordinates: items[0] ? { lat: items[0].lat, lon: items[0].lot } : null,
      totalCount: items.length,
      daily,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'KHOA API 조회 실패', details: String(error) },
      { status: 500 }
    );
  }
}
