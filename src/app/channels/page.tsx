/**
 * 채널 관제 대시보드 (서버 데이터 래퍼)
 *
 * 채널 운영 전략(2026-07-08)의 KPI가 화면 구조다:
 * 퍼널(발견 → 목격 → 관계 → 초대·문의) + 전략 신호 + AI 주간 리포트.
 * 데이터는 크론 수집기가 적재한 Supabase 테이블에서 service_role로 읽는다.
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkDataFreshness } from '@/lib/marketing/quality';
import { ChannelsDashboard, type ChannelsData, type StatCard, type AlertItem } from './ChannelsDashboard';

export const dynamic = 'force-dynamic';

interface MetricRow {
  date: string;
  channel: string;
  source: string;
  metric: string;
  dimension: Record<string, string> | null;
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

// GA4 채널 그룹(영문) → 한글 라벨
const CHANNEL_GROUP_KR: Record<string, string> = {
  'Organic Search': '검색 (구글)',
  'Direct': '직접 유입',
  'Organic Social': 'SNS',
  'Social': 'SNS',
  'Referral': '외부 링크',
  'Organic Video': '동영상',
  'Email': '이메일',
  'Paid Search': '검색 광고',
  'Paid Social': 'SNS 광고',
  'Unassigned': '미분류',
  '(other)': '기타',
};

/** dimension의 특정 키로 최근 N일 값을 그룹핑해 상위 순 정렬 */
function aggregateByDim(
  metrics: MetricRow[],
  metric: string,
  dimKey: string,
  days = 7,
  labelMap?: Record<string, string>
): { label: string; value: number }[] {
  const cutoff = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
  const acc = new Map<string, number>();
  for (const m of metrics) {
    if (m.metric !== metric || m.date < cutoff) continue;
    const raw = m.dimension?.[dimKey];
    if (!raw) continue;
    const label = labelMap?.[raw] ?? raw;
    acc.set(label, (acc.get(label) ?? 0) + Number(m.value));
  }
  return [...acc.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

/** referrer 호스트명을 읽기 좋게 (빈 값·self 정리) */
function cleanReferrer(host: string): string | null {
  if (!host || host === '(direct)' || host === '(none)') return null;
  return host.replace(/^www\./, '');
}

async function loadData(): Promise<ChannelsData> {
  let metrics: MetricRow[] = [];
  let report: ChannelsData['report'] = null;
  let admin: ChannelsData['admin'] = { brandbook: [], partner: [], invitations: [], subscribers: [] };
  let selfReportedSlices: { label: string; value: number }[] = [];
  let alerts: AlertItem[] = [];
  const freshness = await checkDataFreshness();

  if (supabaseAdmin) {
    const since = new Date(Date.now() - 14 * 86400_000).toISOString().slice(0, 10);
    const [metricsRes, reportRes, bb, partner, invites, subs, alertsRes] = await Promise.all([
      supabaseAdmin
        .from('channel_metrics_daily')
        .select('date, channel, source, metric, dimension, value')
        .gte('date', since)
        .limit(4000),
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
      supabaseAdmin
        .from('marketing_alerts')
        .select('id, detected_at, metric_key, label, severity, direction, current_value, baseline_value, consecutive_days, investigation_md')
        .eq('status', 'open')
        .order('detected_at', { ascending: false })
        .limit(10),
    ]);
    metrics = (metricsRes.data ?? []) as MetricRow[];
    report = reportRes.data;
    alerts = (alertsRes.data ?? []) as AlertItem[];
    admin = {
      brandbook: bb.data ?? [],
      partner: partner.data ?? [],
      invitations: invites.data ?? [],
      subscribers: subs.data ?? [],
    };
    // 자기보고 어트리뷰션 집계 (referral_tag 우선, 없으면 원문)
    const selfReported = new Map<string, number>();
    for (const src of [invites.data ?? [], partner.data ?? [], subs.data ?? []]) {
      for (const row of src as { referral_source?: string | null; referral_tag?: string | null }[]) {
        const label = (row.referral_tag || row.referral_source || '').trim();
        if (!label) continue;
        selfReported.set(label, (selfReported.get(label) ?? 0) + 1);
      }
    }
    selfReportedSlices = [...selfReported.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }

  return {
    // 데이터 품질 게이트(Tier 2-1): 신선도 실패 소스는 stale로 표시
    sources: freshness.map((f) => ({
      key: f.source,
      name: f.name,
      configured: f.configured,
      lastDate: f.lastDate ?? undefined,
      stale: f.configured && !f.ok,
      staleDays: f.staleDays ?? undefined,
    })),
    alerts,
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
    traffic: {
      // GA4 채널 그룹별 세션 (최근 7일) — 어디서 왔는가
      channelGroups: aggregateByDim(metrics, 'sessions', 'channelGroup', 7, CHANNEL_GROUP_KR),
      // Vercel referrer 도메인별 방문자 (최근 7일) — 네이버 등 실제 유입 도메인
      referrers: aggregateByDim(metrics, 'referrer_visitors', 'referrer', 7)
        .map((r) => ({ label: cleanReferrer(r.label), value: r.value }))
        .filter((r): r is { label: string; value: number } => r.label !== null)
        .slice(0, 8),
      // 자기보고 어트리뷰션 (전체 기간) — 다크소셜·AI유입 등 측정 사각 보완
      selfReported: selfReportedSlices,
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
