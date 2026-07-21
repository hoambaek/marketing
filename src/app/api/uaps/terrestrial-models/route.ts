/**
 * UAPS 지상 모델(terrestrial_model) 조회 API — service_role 경유, Clerk 인증 필수
 * GET /api/uaps/terrestrial-models
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { fetchTerrestrialModels } from '@/lib/supabase/database/uaps';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const models = await fetchTerrestrialModels();
  return NextResponse.json({ models: models ?? [] });
}
