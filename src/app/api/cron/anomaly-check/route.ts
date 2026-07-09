/**
 * 이상탐지 트리거 크론 (Tier 3)
 *
 * Vercel Cron에서 매일 KST 16:30 (UTC 07:30) 호출 — 마지막 수집기(collect-web, UTC 07:00) 직후.
 * 8주 롤링 베이스라인 대비 편차를 체크해 임계 초과 시에만:
 * 1. marketing_alerts에 경보 기록 (/channels에 표시)
 * 2. Claude 미니 조사로 원인 가설 첨부
 * 3. Slack 알림 (SLACK_WEBHOOK_URL 설정 시)
 *
 * 주 1회 리포트의 주중 6일 사각지대를 메운다. 노이즈 방지 로직은 anomaly.ts 참조.
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { runAnomalyDetection, investigateAlert, notifySlack } from '@/lib/marketing/anomaly';

export const maxDuration = 120;

function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return request.headers.get('x-vercel-cron') === '1';
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase admin 미설정' }, { status: 500 });
  }

  try {
    const { fired, resolved, skipped } = await runAnomalyDetection();

    const stored: { metric_key: string; severity: string; slack: boolean }[] = [];
    for (const alert of fired) {
      // 심각도 라우팅: critical은 조사+알림, warning은 기록 위주(웹훅 있으면 알림)
      const investigation = await investigateAlert(alert);
      const slackSent =
        alert.severity === 'critical' || process.env.SLACK_WEBHOOK_URL
          ? await notifySlack(alert, investigation)
          : false;

      const { error } = await supabaseAdmin.from('marketing_alerts').insert({
        metric_key: alert.metric_key,
        label: alert.label,
        severity: alert.severity,
        direction: alert.direction,
        status: 'open',
        current_value: alert.current_value,
        baseline_value: alert.baseline_value,
        consecutive_days: alert.consecutive_days,
        detail: alert.detail,
        investigation_md: investigation,
        notified_slack: slackSent,
      });
      if (error) throw new Error(`marketing_alerts 저장 실패: ${error.message}`);
      stored.push({ metric_key: alert.metric_key, severity: alert.severity, slack: slackSent });
    }

    return NextResponse.json({
      success: true,
      fired: stored,
      resolved,
      stillOpen: skipped,
    });
  } catch (e) {
    console.error('[Cron] 이상탐지 오류:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
