/**
 * 분석 디스패처 크론 — 무거운 분석 작업(애널리스트·이상탐지)을 하루 하나만 실행
 *
 * Hobby 크론 2개 제한의 두 번째 슬롯. collect-all 직후(UTC 07:40 / KST 16:40) 호출.
 * - 월요일(KST): 주간 리포트(weekly-report) 생성·발송. 이상탐지는 건너뜀.
 * - 그 외 요일: 이상탐지(anomaly-check)만 실행.
 * 한 호출에 무거운 Claude 작업을 하나만 돌려 실행시간 초과를 막는다.
 * 개별 엔드포인트(weekly-report·anomaly-check)는 그대로 남겨둔다(수동 실행용).
 */

import { NextResponse } from 'next/server';

export const maxDuration = 300;

function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return request.headers.get('x-vercel-cron') === '1';
  return authHeader === `Bearer ${cronSecret}`;
}

async function callCron(origin: string, name: string): Promise<unknown> {
  const cronSecret = process.env.CRON_SECRET;
  const headers: Record<string, string> = cronSecret
    ? { authorization: `Bearer ${cronSecret}` }
    : { 'x-vercel-cron': '1' };
  const res = await fetch(`${origin}/api/cron/${name}`, { headers, cache: 'no-store' });
  const body = await res.json().catch(() => ({ raw: 'non-json response' }));
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(body)}`);
  return body;
}

/** KST 기준 요일 (0=일 … 1=월) */
function kstDayOfWeek(): number {
  const kst = new Date(Date.now() + 9 * 3600_000);
  return kst.getUTCDay();
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 });
  }

  const origin = new URL(request.url).origin;
  const isMondayKst = kstDayOfWeek() === 1;
  const job = isMondayKst ? 'weekly-report' : 'anomaly-check';

  try {
    const result = await callCron(origin, job);
    console.log(`[analyze] ${job} 완료`);
    return NextResponse.json({ success: true, job, result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`[analyze] ${job} 실패: ${msg}`);
    return NextResponse.json({ success: false, job, error: msg }, { status: 500 });
  }
}
