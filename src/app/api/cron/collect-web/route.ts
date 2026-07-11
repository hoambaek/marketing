/**
 * 웹 트래픽 일일 수집 크론 (GA4 + Vercel Analytics)
 *
 * Vercel Cron에서 매일 KST 아침 07시대 (UTC 22:00) 호출.
 * - GA4: 24~48시간 처리 지연이 있어 아침 수집 기준 완성이 보장되는 D-3 데이터 수집
 * - Vercel Analytics: 거의 실시간이므로 D-1 데이터 수집
 * 소스별로 환경변수 미설정 시 해당 소스만 건너뛴다 (부분 성공 허용).
 */

import { NextResponse } from 'next/server';
import {
  isGa4Configured,
  fetchDailyTraffic,
  fetchDailyEvents,
  fetchDailyLandingPages,
  hostToChannel,
} from '@/lib/marketing/ga4';
import {
  isVercelConfigured,
  vercelProjects,
  fetchVercelDaily,
  fetchVercelReferrers,
} from '@/lib/marketing/vercel-analytics';
import { upsertMetrics, kstDaysAgo, type MetricRow } from '@/lib/marketing/store';

export const maxDuration = 60;

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

  const result: Record<string, unknown> = {};
  const errors: string[] = [];

  // ── GA4 (D-3) ──
  if (isGa4Configured()) {
    const date = kstDaysAgo(3);
    try {
      const rows: MetricRow[] = [];
      const [traffic, events, landings] = await Promise.all([
        fetchDailyTraffic(date),
        fetchDailyEvents(date),
        fetchDailyLandingPages(date),
      ]);
      for (const m of [...traffic, ...events, ...landings]) {
        const channel = hostToChannel(m.dimension.host ?? '');
        if (!channel) continue;
        rows.push({ date, channel, source: 'ga4', metric: m.metric, dimension: m.dimension, value: m.value });
      }
      result.ga4 = { date, upserted: await upsertMetrics(rows) };
    } catch (e) {
      errors.push(`ga4: ${e instanceof Error ? e.message : String(e)}`);
    }
  } else {
    result.ga4 = 'skip (GOOGLE_SERVICE_ACCOUNT_KEY 또는 GA4_PROPERTY_ID 미설정)';
  }

  // ── Vercel Analytics (D-1) ──
  if (isVercelConfigured()) {
    const date = kstDaysAgo(1);
    try {
      const rows: MetricRow[] = [];
      for (const project of vercelProjects()) {
        const [daily, referrers] = await Promise.all([
          fetchVercelDaily(project.projectId, date),
          fetchVercelReferrers(project.projectId, date),
        ]);
        for (const m of [...daily, ...referrers]) {
          rows.push({
            date,
            channel: project.channel,
            source: 'vercel',
            metric: m.metric,
            dimension: m.dimension,
            value: m.value,
          });
        }
      }
      result.vercel = { date, upserted: await upsertMetrics(rows) };
    } catch (e) {
      errors.push(`vercel: ${e instanceof Error ? e.message : String(e)}`);
    }
  } else {
    result.vercel = 'skip (VERCEL_API_TOKEN 등 미설정)';
  }

  const status = errors.length > 0 && Object.keys(result).length === 0 ? 500 : 200;
  return NextResponse.json({ success: errors.length === 0, result, errors }, { status });
}
