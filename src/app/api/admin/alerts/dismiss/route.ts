/**
 * 경보 수동 닫기 — /channels 경보 카드의 닫기 버튼용
 *
 * Clerk 미들웨어가 보호하는 관리자 전용 라우트. 대표가 경보를 확인한 뒤 직접 닫는다.
 * status='dismissed'로 표시(resolved와 구분: dismissed = 사람이 확인 후 닫음).
 * 회복 윈도 로직은 status='open'만 재발화 억제 대상으로 보므로, 이상 조건이 계속되면
 * 다음 크론에서 다시 발화할 수 있다(같은 문제가 지속되면 다시 알리는 게 맞다).
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase admin 미설정' }, { status: 500 });
  }

  let id: unknown;
  try {
    const body = await request.json();
    id = body?.id;
  } catch {
    return NextResponse.json({ error: 'id 필요' }, { status: 400 });
  }
  if (typeof id !== 'number') {
    return NextResponse.json({ error: 'id는 숫자여야 함' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('marketing_alerts')
    .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'open');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, id });
}
