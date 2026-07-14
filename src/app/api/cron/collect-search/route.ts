/**
 * 구글 검색 성과 일일 수집 크론 (Search Console)
 *
 * Vercel Cron에서 매일 KST 11:00 (UTC 02:00) 호출.
 * GSC 데이터는 2~3일 지연 → D-3 데이터를 수집한다.
 * 검색어는 키워드 3계층(T1/T2/T3)으로 자동 태깅 — 블로그 캘린더 가설 검증용.
 */

import { NextResponse } from 'next/server';
import { isGscConfigured, gscSites, fetchSearchQueries, fetchDailyTotal } from '@/lib/marketing/gsc';
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
      // 검색어 상세(계층 태깅)는 search_queries 테이블로 — 저볼륨에선 익명화로 빈 배열일 수 있음
      const queries = await fetchSearchQueries(site, date);
      const upserted = await upsertSearchQueries(queries);

      // 일 추이는 차원 없는 합계로 적재 — query 차원은 저볼륨 익명화로 행이 숨어
      // "적재 없음(신뢰 저하)" 오탐의 원인이었다. 노출 0인 날도 0으로 적재해
      // "수집 정상·값 0"과 "수집 실패"를 구분한다. (계층별 집계는 search_queries에서 파생)
      const total = await fetchDailyTotal(site, date);
      const rows: MetricRow[] = [
        { date, channel: 'search', source: 'gsc', metric: 'clicks', dimension: { site: site.site }, value: total?.clicks ?? 0 },
        { date, channel: 'search', source: 'gsc', metric: 'impressions', dimension: { site: site.site }, value: total?.impressions ?? 0 },
      ];
      if (total) {
        rows.push({ date, channel: 'search', source: 'gsc', metric: 'avg_position', dimension: { site: site.site }, value: total.position });
      }
      await upsertMetrics(rows);
      result[site.site] = { date, queries: upserted, totals: total ?? 'no impressions' };
    } catch (e) {
      errors.push(`${site.site}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const status = errors.length > 0 && Object.keys(result).length === 0 ? 500 : 200;
  return NextResponse.json({ success: errors.length === 0, result, errors }, { status });
}
