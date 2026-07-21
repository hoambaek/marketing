/**
 * UAPS 설정(uaps_config) 조회·수정 API — service_role 경유, Clerk 인증 필수
 * GET /api/uaps/config          → 전체 설정 조회
 * PATCH /api/uaps/config        → { key, value } 단건 수정
 *
 * uaps_config는 UAPS 핵심 계수·임계값이라 anon 접근을 전면 차단했다 (2026-07-21).
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { fetchUAPSConfig, updateUAPSConfigValue } from '@/lib/supabase/database/uaps';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const configs = await fetchUAPSConfig();
  return NextResponse.json({ configs: configs ?? [] });
}

export async function PATCH(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { key, value } = (await request.json()) as { key: string; value: string };
  if (!key) {
    return NextResponse.json({ error: 'key가 필요합니다.' }, { status: 400 });
  }
  const success = await updateUAPSConfigValue(key, String(value));
  return NextResponse.json({ success });
}
