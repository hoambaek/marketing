/**
 * 소유 등록된 NFC 코드 목록 — service_role 경유, Clerk 인증 필수
 * GET /api/inventory/nfc-registrations  → { codes: string[] }
 *
 * bottle_registrations는 RLS 활성 + 정책 0개라 anon 클라이언트로는 읽을 수 없다.
 * 재고 화면이 "이 병에 주인이 생겼는가"만 알면 되므로 여기서 코드 목록만 꺼낸다.
 *
 * 이름·이메일은 내보내지 않는다. 재고 화면에 필요 없는 개인정보이고,
 * 한번 응답에 실리면 브라우저 캐시·로그로 새어나갈 경로가 생긴다.
 * 소유자 본인 확인은 랜딩의 OTP 경로가 담당한다.
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { dbLogger } from '@/lib/logger';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  if (!supabaseAdmin) {
    // 키 미설정 — 배지를 틀리게 보여주느니 "모름"으로 두고 화면은 계속 돈다
    return NextResponse.json({ codes: [], configured: false });
  }

  const { data, error } = await supabaseAdmin
    .from('bottle_registrations')
    .select('nfc_code');

  if (error) {
    dbLogger.error('Error fetching bottle registrations:', error);
    return NextResponse.json({ error: '조회에 실패했습니다.' }, { status: 500 });
  }

  const codes = Array.from(
    new Set((data ?? []).map((r) => r.nfc_code).filter((c): c is string => !!c)),
  );

  return NextResponse.json({ codes, configured: true });
}
