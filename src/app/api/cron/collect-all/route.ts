/**
 * 수집 디스패처 크론 — 일일 수집기 4종을 순차 실행
 *
 * Vercel Hobby 플랜은 크론 잡을 2개까지만 실행하므로(vercel.json 배열 앞 2개),
 * 개별 수집 크론(ocean-data·collect-social·collect-search·collect-web)을 하나로 묶는다.
 * 각 수집기는 기존 엔드포인트를 내부 호출(원 로직 재사용, 중복 없음)하며,
 * 하나가 실패해도 나머지는 계속 진행한다(부분 성공 허용).
 *
 * Vercel Cron에서 매일 KST 16:00 (UTC 07:00) 호출 — GA4 D-2 데이터가 준비되는 시각.
 * 개별 엔드포인트는 그대로 남겨둔다(수동 백필·디버깅용).
 */

import { NextResponse } from 'next/server';

export const maxDuration = 300;

const COLLECTORS = ['ocean-data', 'collect-social', 'collect-search', 'collect-web'] as const;

function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return request.headers.get('x-vercel-cron') === '1';
  return authHeader === `Bearer ${cronSecret}`;
}

/** 내부 크론 엔드포인트를 인증 헤더와 함께 호출 */
async function callCron(origin: string, name: string): Promise<unknown> {
  const cronSecret = process.env.CRON_SECRET;
  const headers: Record<string, string> = cronSecret
    ? { authorization: `Bearer ${cronSecret}` }
    : { 'x-vercel-cron': '1' };
  // 크론의 origin은 Deployment Protection이 걸린 *.vercel.app 배포 URL이라
  // 우회 헤더 없이는 내부 호출이 SSO 302로 막힌다
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (bypass) headers['x-vercel-protection-bypass'] = bypass;
  const res = await fetch(`${origin}/api/cron/${name}`, { headers, cache: 'no-store' });
  const body = await res.json().catch(() => ({ raw: 'non-json response' }));
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(body)}`);
  return body;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 });
  }

  const origin = new URL(request.url).origin;
  const result: Record<string, unknown> = {};
  const errors: string[] = [];

  // 순차 실행 — 하나 실패해도 나머지 계속
  for (const name of COLLECTORS) {
    try {
      result[name] = await callCron(origin, name);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      result[name] = `실패: ${msg}`;
      errors.push(`${name}: ${msg}`);
    }
  }

  console.log(`[collect-all] 완료 — 성공 ${COLLECTORS.length - errors.length}/${COLLECTORS.length}`, errors);
  return NextResponse.json({ success: errors.length === 0, result, errors });
}
