/**
 * EUR → KRW 환율 — 서버 경유
 * GET /api/exchange-rate  → { rate: number, date: string }
 *
 * 브라우저에서 환율 API를 직접 부르면 CORS에 막힌다(그쪽이 허용 헤더를 주지 않는다).
 * 서버 간 요청에는 CORS가 적용되지 않으므로 여기서 대신 부른다.
 *
 * 원본은 유럽중앙은행 고시를 그대로 싣는 frankfurter다. 평일 하루 한 번(CET 16시경)
 * 갱신되므로 1시간 캐시로 충분하고, 그만큼 외부 호출도 줄어든다.
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';

const SOURCE = 'https://api.frankfurter.dev/v1/latest?base=EUR&symbols=KRW';
const CACHE_SECONDS = 3600;

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  try {
    const res = await fetch(SOURCE, {
      next: { revalidate: CACHE_SECONDS },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      logger.error('Exchange rate source returned', res.status);
      return NextResponse.json({ error: '환율을 가져오지 못했습니다.' }, { status: 502 });
    }

    const data = (await res.json()) as { date?: string; rates?: { KRW?: number } };
    const rate = data.rates?.KRW;

    if (typeof rate !== 'number' || !Number.isFinite(rate)) {
      // 응답 모양이 바뀐 경우. 틀린 환율로 원가를 계산하느니 실패로 알린다
      logger.error('Exchange rate response missing KRW', data);
      return NextResponse.json({ error: '환율 응답 형식이 올바르지 않습니다.' }, { status: 502 });
    }

    return NextResponse.json({ rate, date: data.date ?? null });
  } catch (error) {
    logger.error('Failed to fetch exchange rate:', error);
    return NextResponse.json({ error: '환율을 가져오지 못했습니다.' }, { status: 502 });
  }
}
