/**
 * UAPS 지상 와인 데이터 건수(wine_terrestrial_data) 조회 API — service_role 경유, Clerk 인증 필수
 * GET /api/uaps/wine-terrestrial-count
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { fetchWineTerrestrialDataCount } from '@/lib/supabase/database/uaps';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const count = await fetchWineTerrestrialDataCount();
  return NextResponse.json({ count });
}
