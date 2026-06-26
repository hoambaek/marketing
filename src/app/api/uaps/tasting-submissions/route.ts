import { NextRequest, NextResponse } from 'next/server';
import {
  fetchTastingSubmissions,
  approveTastingSubmission,
  rejectTastingSubmission,
} from '@/lib/supabase/database/tasting-submissions';
import type { TastingSubmissionStatus } from '@/lib/types/uaps';

// 대기/처리된 제출 목록 (Clerk 미들웨어가 보호)
export async function GET(req: NextRequest) {
  const statusParam = req.nextUrl.searchParams.get('status') ?? 'pending';
  const status = (['pending', 'approved', 'rejected'].includes(statusParam)
    ? statusParam
    : 'pending') as TastingSubmissionStatus;

  const list = await fetchTastingSubmissions(status);
  if (list === null) {
    return NextResponse.json(
      { error: '제출 목록을 불러오지 못했습니다. SUPABASE_SERVICE_ROLE_KEY 설정을 확인하세요.' },
      { status: 500 }
    );
  }
  return NextResponse.json({ submissions: list });
}

// 승인 / 거부
export async function POST(req: NextRequest) {
  let body: { action?: string; id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }
  const { action, id } = body;
  if (!id || (action !== 'approve' && action !== 'reject')) {
    return NextResponse.json({ error: 'action과 id가 필요합니다.' }, { status: 400 });
  }

  if (action === 'approve') {
    const result = await approveTastingSubmission(id);
    if (!result.ok) {
      return NextResponse.json({ error: '승인에 실패했습니다.' }, { status: 422 });
    }
    return NextResponse.json({ ok: true, retrievalId: result.retrievalId });
  }

  const ok = await rejectTastingSubmission(id);
  if (!ok) {
    return NextResponse.json({ error: '거부 처리에 실패했습니다.' }, { status: 422 });
  }
  return NextResponse.json({ ok: true });
}
