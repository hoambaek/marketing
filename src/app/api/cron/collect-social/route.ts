/**
 * 인스타그램 오가닉 인사이트 일일 수집 크론
 *
 * Vercel Cron에서 매일 KST 09:30 (UTC 00:30) 호출.
 * - 계정 스냅샷: 팔로워 수 (추이는 스냅샷 누적으로 계산)
 * - 최근 게시물 25개의 인사이트 (reach·saved·shares·views 등)
 *   → channel_metrics_daily (계정 합계) + content_performance (게시물별 스냅샷)
 *
 * 전략 KPI: saved(저장)·shares(공유)가 팔로워 수보다 상위 지표.
 */

import { NextResponse } from 'next/server';
import {
  isInstagramConfigured,
  fetchAccountSnapshot,
  fetchRecentMedia,
  fetchMediaInsights,
  mediaContentType,
} from '@/lib/marketing/instagram';
import {
  upsertMetrics,
  upsertContentSnapshots,
  kstDaysAgo,
  type MetricRow,
  type ContentSnapshot,
} from '@/lib/marketing/store';

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

  if (!isInstagramConfigured()) {
    return NextResponse.json({
      success: true,
      result: 'skip (META_ACCESS_TOKEN 또는 META_IG_USER_ID 미설정)',
    });
  }

  try {
    const today = kstDaysAgo(0);
    const rows: MetricRow[] = [];

    // 계정 스냅샷
    const account = await fetchAccountSnapshot();
    rows.push(
      { date: today, channel: 'instagram', source: 'ig_graph', metric: 'followers', value: account.followers },
      { date: today, channel: 'instagram', source: 'ig_graph', metric: 'media_count', value: account.mediaCount }
    );

    // 게시물별 인사이트 (직렬 호출 — rate limit 배려, 최근 25개)
    const media = await fetchRecentMedia(25);
    const snapshots: ContentSnapshot[] = [];
    const totals: Record<string, number> = {};

    for (const m of media) {
      try {
        const insights = await fetchMediaInsights(m);
        snapshots.push({
          content_type: mediaContentType(m),
          external_id: m.id,
          title: m.caption?.slice(0, 120) ?? null,
          permalink: m.permalink ?? null,
          published_at: m.timestamp,
          snapshot_date: today,
          metrics: insights,
        });
        for (const [k, v] of Object.entries(insights)) {
          totals[k] = (totals[k] ?? 0) + v;
        }
      } catch {
        // 개별 게시물 실패는 전체를 막지 않는다
      }
    }

    // 계정 합계 지표 (전략 KPI 추이용)
    for (const key of ['reach', 'saved', 'shares', 'views', 'total_interactions']) {
      if (totals[key] !== undefined) {
        rows.push({
          date: today,
          channel: 'instagram',
          source: 'ig_graph',
          metric: `sum_${key}`,
          value: totals[key],
        });
      }
    }

    const [metricsUpserted, snapshotsUpserted] = await Promise.all([
      upsertMetrics(rows),
      upsertContentSnapshots(snapshots),
    ]);

    return NextResponse.json({
      success: true,
      result: { date: today, metricsUpserted, snapshotsUpserted, mediaCount: media.length },
    });
  } catch (e) {
    console.error('[Cron] 인스타그램 수집 오류:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
