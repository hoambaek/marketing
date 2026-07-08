/**
 * 채널 관제 대시보드 (서버 데이터 래퍼)
 *
 * 채널 운영 전략(2026-07-08)의 KPI가 화면 구조다:
 * 퍼널(발견 → 목격 → 관계 → 초대·문의) + 전략 신호 + AI 주간 리포트.
 * 데이터는 크론 수집기가 적재한 Supabase 테이블에서 service_role로 읽는다.
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import { isGa4Configured } from '@/lib/marketing/ga4';
import { isVercelConfigured } from '@/lib/marketing/vercel-analytics';
import { isInstagramConfigured } from '@/lib/marketing/instagram';
import { isGscConfigured } from '@/lib/marketing/gsc';
import { ChannelsDashboard, type ChannelsData, type StatCard } from './ChannelsDashboard';

export const dynamic = 'force-dynamic';

interface MetricRow {
  date: string;
  channel: string;
  source: string;
  metric: string;
  value: number;
}

function sum(metrics: MetricRow[], channel: string, metric: string, days: 7 | 14): number {
  const cutoff = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
  return metrics
    .filter((m) => m.channel === channel && m.metric === metric && m.date >= cutoff)
    .reduce((s, m) => s + Number(m.value), 0);
}

function delta(metrics: MetricRow[], channel: string, metric: string): StatCard {
  const cur = sum(metrics, channel, metric, 7);
  return { cur, prev: sum(metrics, channel, metric, 14) - cur };
}

function combine(...stats: StatCard[]): StatCard {
  return {
    cur: stats.reduce((s, x) => s + x.cur, 0),
    prev: stats.reduce((s, x) => s + x.prev, 0),
  };
}

async function loadData(): Promise<ChannelsData> {
  let metrics: MetricRow[] = [];
  let report: ChannelsData['report'] = null;
  const lastDates: Record<string, string> = {};
  let admin: ChannelsData['admin'] = { brandbook: [], partner: [], invitations: [], subscribers: [] };

  if (supabaseAdmin) {
    const since = new Date(Date.now() - 14 * 86400_000).toISOString().slice(0, 10);
    const [metricsRes, reportRes, bb, partner, invites, subs] = await Promise.all([
      supabaseAdmin
        .from('channel_metrics_daily')
        .select('date, channel, source, metric, value')
        .gte('date', since)
        .limit(3000),
      supabaseAdmin
        .from('ai_reports')
        .select('week_start, generated_at, verdict, summary_md')
        .order('week_start', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin.from('brandbook_requests').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('partner_inquiries').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('invitations').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('subscribers').select('*').order('subscribed_at', { ascending: false }),
    ]);
    metrics = (metricsRes.data ?? []) as MetricRow[];
    report = reportRes.data;
    admin = {
      brandbook: bb.data ?? [],
      partner: partner.data ?? [],
      invitations: invites.data ?? [],
      subscribers: subs.data ?? [],
    };
    for (const m of metrics) {
      if (!lastDates[m.source] || m.date > lastDates[m.source]) lastDates[m.source] = m.date;
    }
  }

  return {
    sources: [
      { key: 'ga4', name: 'GA4', configured: isGa4Configured(), lastDate: lastDates['ga4'] },
      { key: 'vercel', name: 'Vercel', configured: isVercelConfigured(), lastDate: lastDates['vercel'] },
      { key: 'ig_graph', name: 'Instagram', configured: isInstagramConfigured(), lastDate: lastDates['ig_graph'] },
      { key: 'gsc', name: 'Search Console', configured: isGscConfigured(), lastDate: lastDates['gsc'] },
    ],
    funnel: {
      discovery: combine(delta(metrics, 'search', 'clicks'), delta(metrics, 'instagram', 'sum_reach')),
      witness: delta(metrics, 'landing', 'sessions'),
      relation: combine(
        delta(metrics, 'landing', 'event:subscribe_submit'),
        delta(metrics, 'blog', 'event:subscribe_submit')
      ),
      invite: combine(
        delta(metrics, 'landing', 'event:cta_click'),
        delta(metrics, 'blog', 'event:cta_click')
      ),
    },
    kpi: {
      igSaved: delta(metrics, 'instagram', 'sum_saved'),
      igShares: delta(metrics, 'instagram', 'sum_shares'),
      blogSessions: delta(metrics, 'blog', 'sessions'),
    },
    report,
    hasData: metrics.length > 0,
    admin,
  };
}

export default async function ChannelsPage() {
  const data = await loadData();
  return <ChannelsDashboard data={data} />;
}
