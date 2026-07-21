/**
 * UAPS 인양 실측(retrieval_results) 조회 API — service_role 경유, Clerk 인증 필수
 * GET /api/uaps/retrieval-results?productId=
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { fetchRetrievalResults } from '@/lib/supabase/database/uaps';

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const productId = request.nextUrl.searchParams.get('productId') || undefined;
  const results = await fetchRetrievalResults(productId);
  return NextResponse.json({ results: results ?? [] });
}
