/**
 * 구글 검색 성과 일일 수집 크론 (Search Console)
 *
 * Vercel Cron에서 매일 KST 11:00 (UTC 02:00) 호출.
 * GSC 데이터는 2~3일 지연 → D-3 데이터를 수집한다.
 * 검색어는 키워드 3계층(T1/T2/T3)으로 자동 태깅 — 블로그 캘린더 가설 검증용.
 */

import { NextResponse } from 'next/server';
import { isGscConfigured, gscSites, fetchSearchQueries } from '@/lib/marketing/gsc';
import { upsertSearchQueries, upsertMetrics, kstDaysAgo, type MetricRow } from '@/lib/marketing/store';

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

  if (!isGscConfigured()) {
    return NextResponse.json({
      success: true,
      result: 'skip (GOOGLE_SERVICE_ACCOUNT_KEY 또는 GSC_*_SITE 미설정)',
    });
  }

  const date = kstDaysAgo(3);
  const result: Record<string, unknown> = {};
  const errors: string[] = [];

  for (const site of gscSites()) {
    try {
      const queries = await fetchSearchQueries(site, date);
      const upserted = await upsertSearchQueries(queries);

      // 계층별 합계를 channel_metrics_daily에도 적재 (추이 그래프용)
      const tierTotals: Record<string, { clicks: number; impressions: number }> = {};
      for (const q of queries) {
        const tier = q.tier ?? 'untagged';
        tierTotals[tier] = tierTotals[tier] ?? { clicks: 0, impressions: 0 };
        tierTotals[tier].clicks += q.clicks;
        tierTotals[tier].impressions += q.impressions;
      }
      const rows: MetricRow[] = [];
      for (const [tier, t] of Object.entries(tierTotals)) {
        rows.push(
          { date, channel: 'search', source: 'gsc', metric: 'clicks', dimension: { site: site.site, tier }, value: t.clicks },
          { date, channel: 'search', source: 'gsc', metric: 'impressions', dimension: { site: site.site, tier }, value: t.impressions }
        );
      }
      await upsertMetrics(rows);
      result[site.site] = { date, queries: upserted };
    } catch (e) {
      errors.push(`${site.site}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const status = errors.length > 0 && Object.keys(result).length === 0 ? 500 : 200;
  return NextResponse.json({ success: errors.length === 0, result, errors }, { status });
}
