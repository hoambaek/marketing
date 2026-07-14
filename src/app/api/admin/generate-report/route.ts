/**
 * 수동 주간 리포트 생성 — /channels의 "리포트 생성" 버튼용
 *
 * Clerk 미들웨어가 보호하는 관리자 전용 라우트. 월요일 크론을 기다리지 않고
 * 지금 데이터로 방향 브리핑을 즉시 생성한다. 크론과 같은 로직(generateWeeklyReport)을
 * 재사용하며, week_start 기준 upsert라 중복 실행해도 최신본으로 덮인다.
 *
 * 메일은 기본 발송하지 않는다(sendEmail=false). 수동 확인용이라 대표가 대시보드에서
 * 바로 보면 되고, 원치 않는 반복 메일을 막는다. body { email: true }로 발송 가능.
 */

import { NextResponse } from 'next/server';
import { generateWeeklyReport } from '@/app/api/cron/weekly-report/route';

export const maxDuration = 300;

export async function POST(request: Request) {
  let sendEmail = false;
  try {
    const body = await request.json().catch(() => ({}));
    sendEmail = body?.email === true;
  } catch {
    // body 없으면 기본값 유지
  }

  try {
    const result = await generateWeeklyReport(sendEmail);
    if (result.status === 'skip') {
      return NextResponse.json({ success: false, reason: result.reason }, { status: 200 });
    }
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    console.error('[Admin] 수동 리포트 생성 오류:', e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
