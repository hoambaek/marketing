/**
 * UAPS 예측(aging_predictions) 조회 API — service_role 경유, Clerk 인증 필수
 * GET /api/uaps/predictions?productId=&limit=20
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { fetchAgingPredictions } from '@/lib/supabase/database/uaps';

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const productId = params.get('productId') || undefined;
  const limitRaw = params.get('limit');
  const limit = limitRaw ? Number(limitRaw) : 20;

  const predictions = await fetchAgingPredictions(productId, Number.isFinite(limit) ? limit : 20);
  return NextResponse.json({ predictions: predictions ?? [] });
}
