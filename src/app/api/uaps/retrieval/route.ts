import { NextRequest, NextResponse } from 'next/server';
import {
  createRetrievalResult,
  updateRetrievalResult,
} from '@/lib/supabase/database/retrieval-results';
import type { RetrievalResult } from '@/lib/types/uaps';

type RetrievalInput = Omit<RetrievalResult, 'id' | 'createdAt'>;

// 인양 실측 결과 저장/수정 — service_role 경유 (Clerk 미들웨어가 보호)
export async function POST(req: NextRequest) {
  let body: { id?: string; payload?: RetrievalInput };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const { id, payload } = body;
  if (!payload || typeof payload.productId !== 'string' || !payload.productId) {
    return NextResponse.json({ error: 'productId가 필요합니다.' }, { status: 400 });
  }

  const saved = id
    ? await updateRetrievalResult(id, payload)
    : await createRetrievalResult(payload);

  if (!saved) {
    return NextResponse.json(
      { error: '저장에 실패했습니다. SUPABASE_SERVICE_ROLE_KEY 설정을 확인하세요.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, result: saved });
}
