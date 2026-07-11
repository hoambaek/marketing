/**
 * 수동 전체 갱신 — /channels의 "지금 갱신" 버튼용
 *
 * Clerk 미들웨어가 보호하는 관리자 전용 라우트. 수집기 4종을 병렬 호출해
 * 대시보드에서 즉시 최신 데이터를 당긴다 (전부 upsert라 중복 실행 안전).
 * GA4(D-3)·GSC는 원천 지연 때문에 버튼을 눌러도 새 데이터가 없을 수 있고,
 * 실시간 의미가 있는 건 인스타그램·해양데이터다.
 */

import { NextResponse } from 'next/server';

export const maxDuration = 120;

const COLLECTORS = ['ocean-data', 'collect-social', 'collect-search', 'collect-web'] as const;

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET이 설정되지 않았습니다.' }, { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const settled = await Promise.allSettled(
    COLLECTORS.map(async (name) => {
      const res = await fetch(`${origin}/api/cron/${name}`, {
        headers: { authorization: `Bearer ${cronSecret}` },
        cache: 'no-store',
      });
      const body = await res.json().catch(() => ({ raw: 'non-json response' }));
      if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(body)}`);
      return body;
    }),
  );

  const result: Record<string, unknown> = {};
  const errors: string[] = [];
  settled.forEach((s, i) => {
    const name = COLLECTORS[i];
    if (s.status === 'fulfilled') {
      result[name] = s.value;
    } else {
      const msg = s.reason instanceof Error ? s.reason.message : String(s.reason);
      result[name] = `실패: ${msg}`;
      errors.push(name);
    }
  });

  return NextResponse.json({
    success: errors.length === 0,
    refreshedAt: new Date().toISOString(),
    result,
    errors,
  });
}
