/**
 * 네이버 검색 인텔리전스 일일 수집 크론 (데이터랩 + 블로그 검색)
 *
 * Vercel Cron에서 매일 KST 07:00 (UTC 22:00) 호출. /api/admin/refresh(수동 갱신)에서도 실행.
 *
 * - 트렌드: 브랜드(뮤즈드마레) vs 카테고리(해저숙성) 일간 검색 지수.
 *   ratio가 기간 내 상댓값이라 매번 TREND_START_DATE부터 전체를 재수집·upsert한다(스케일 일관성).
 * - 버즈: 키워드별 블로그 총 검색 결과 수를 오늘 날짜로 스냅샷 — 일간 시계열로 쌓여 증가분이 신규 포스트 수.
 */

import { NextResponse } from 'next/server';
import { isNaverConfigured, fetchTrend, fetchBlogTotal, BUZZ_QUERIES } from '@/lib/marketing/naver';
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

  if (!isNaverConfigured()) {
    return NextResponse.json({
      success: true,
      result: 'skip (NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 미설정)',
    });
  }

  const result: Record<string, unknown> = {};
  const errors: string[] = [];

  // 1) 데이터랩 트렌드 — 전체 기간 재수집 (검색량 임계치 미만인 날짜는 응답에 없음 = 0)
  try {
    const groups = await fetchTrend(kstDaysAgo(1));
    const rows: MetricRow[] = groups.flatMap((g) =>
      g.data.map((p) => ({
        date: p.period,
        channel: 'search' as const,
        source: 'naver_openapi' as const,
        metric: 'trend_ratio',
        dimension: { group: g.title },
        value: p.ratio,
      })),
    );
    // upsert 페이로드가 커질 수 있어 500행씩 나눠 적재
    let upserted = 0;
    for (let i = 0; i < rows.length; i += 500) {
      upserted += await upsertMetrics(rows.slice(i, i + 500));
    }
    result.trend = { groups: groups.map((g) => ({ group: g.title, points: g.data.length })), upserted };
  } catch (e) {
    errors.push(`trend: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 2) 블로그 버즈 — 총 결과 수를 오늘 날짜로 스냅샷 (수집 성공·값 0과 수집 실패를 구분)
  try {
    const date = kstDaysAgo(0);
    const rows: MetricRow[] = [];
    for (const query of BUZZ_QUERIES) {
      rows.push({
        date,
        channel: 'search',
        source: 'naver_openapi',
        metric: 'blog_total',
        dimension: { query },
        value: await fetchBlogTotal(query),
      });
    }
    await upsertMetrics(rows);
    result.buzz = Object.fromEntries(rows.map((r) => [r.dimension?.query, r.value]));
  } catch (e) {
    errors.push(`buzz: ${e instanceof Error ? e.message : String(e)}`);
  }

  const status = errors.length > 0 && Object.keys(result).length === 0 ? 500 : 200;
  return NextResponse.json({ success: errors.length === 0, result, errors }, { status });
}
