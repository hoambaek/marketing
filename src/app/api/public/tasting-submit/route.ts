import { NextRequest, NextResponse } from 'next/server';
import { createTastingSubmission } from '@/lib/supabase/database/tasting-submissions';
import { apiLogger } from '@/lib/logger';
import type { TastingSubmissionInput } from '@/lib/types/uaps';

// 0~100 범위의 점수(또는 null) 검증
function score(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return n;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  const predictionId = typeof body.predictionId === 'string' ? body.predictionId.trim() : '';
  const recorderName = typeof body.recorderName === 'string' ? body.recorderName.trim() : '';

  if (!predictionId) {
    return NextResponse.json({ error: '유효하지 않은 링크입니다.' }, { status: 400 });
  }
  if (!recorderName) {
    return NextResponse.json({ error: '기록자 이름을 입력해 주세요.' }, { status: 400 });
  }
  if (recorderName.length > 100) {
    return NextResponse.json({ error: '기록자 이름이 너무 깁니다.' }, { status: 400 });
  }

  const panel = Number(body.tastingPanelSize);
  const input: TastingSubmissionInput = {
    predictionId,
    recorderName,
    recorderAffiliation:
      typeof body.recorderAffiliation === 'string' ? body.recorderAffiliation.trim().slice(0, 120) || null : null,
    retrievalDate: typeof body.retrievalDate === 'string' && body.retrievalDate ? body.retrievalDate : null,
    actualDurationMonths:
      body.actualDurationMonths != null && Number.isFinite(Number(body.actualDurationMonths))
        ? Number(body.actualDurationMonths)
        : null,
    tastingPanelSize: Number.isFinite(panel) && panel >= 1 ? Math.floor(panel) : 1,
    tastingNotes: typeof body.tastingNotes === 'string' ? body.tastingNotes.slice(0, 2000) || null : null,
    actualFruity: score(body.actualFruity),
    actualFloralMineral: score(body.actualFloralMineral),
    actualYeastyAutolytic: score(body.actualYeastyAutolytic),
    actualAcidityFreshness: score(body.actualAcidityFreshness),
    actualBodyTexture: score(body.actualBodyTexture),
    actualFinishComplexity: score(body.actualFinishComplexity),
    actualOverallQuality: score(body.actualOverallQuality),
    terrestrialFruity: score(body.terrestrialFruity),
    terrestrialFloralMineral: score(body.terrestrialFloralMineral),
    terrestrialYeastyAutolytic: score(body.terrestrialYeastyAutolytic),
    terrestrialAcidityFreshness: score(body.terrestrialAcidityFreshness),
    terrestrialBodyTexture: score(body.terrestrialBodyTexture),
    terrestrialFinishComplexity: score(body.terrestrialFinishComplexity),
    terrestrialOverallQuality: score(body.terrestrialOverallQuality),
  };

  const result = await createTastingSubmission(input);
  if (!result) {
    apiLogger.warn('시음 제출 실패', { predictionId });
    return NextResponse.json(
      { error: '제출에 실패했습니다. 링크가 유효하지 않거나 서버 설정 문제일 수 있습니다.' },
      { status: 422 }
    );
  }

  return NextResponse.json({ ok: true, id: result.id });
}
