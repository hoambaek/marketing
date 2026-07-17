import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * 마케팅 관제 데이터 적재 헬퍼 (service_role 전용 — RLS 정책 없는 테이블)
 */

export interface MetricRow {
  date: string;
  channel: 'landing' | 'blog' | 'instagram' | 'newsletter' | 'search';
  source: 'ga4' | 'vercel' | 'ig_graph' | 'stibee' | 'gsc' | 'naver_openapi';
  metric: string;
  dimension?: Record<string, string>;
  value: number;
}

function dimKey(dimension: Record<string, string> | undefined): string {
  if (!dimension || Object.keys(dimension).length === 0) return '';
  return Object.keys(dimension)
    .sort()
    .map((k) => `${k}=${dimension[k]}`)
    .join('|');
}

export async function upsertMetrics(rows: MetricRow[]): Promise<number> {
  if (!supabaseAdmin) throw new Error('Supabase admin 미설정');
  if (rows.length === 0) return 0;
  const payload = rows.map((r) => ({
    date: r.date,
    channel: r.channel,
    source: r.source,
    metric: r.metric,
    dim_key: dimKey(r.dimension),
    dimension: r.dimension ?? {},
    value: r.value,
  }));
  const { error } = await supabaseAdmin
    .from('channel_metrics_daily')
    .upsert(payload, { onConflict: 'date,channel,source,metric,dim_key' });
  if (error) throw new Error(`channel_metrics_daily upsert 실패: ${error.message}`);
  return payload.length;
}

export interface ContentSnapshot {
  content_type: string;
  external_id: string;
  title?: string | null;
  permalink?: string | null;
  published_at?: string | null;
  snapshot_date: string;
  metrics: Record<string, number>;
}

export async function upsertContentSnapshots(rows: ContentSnapshot[]): Promise<number> {
  if (!supabaseAdmin) throw new Error('Supabase admin 미설정');
  if (rows.length === 0) return 0;
  const { error } = await supabaseAdmin
    .from('content_performance')
    .upsert(rows, { onConflict: 'content_type,external_id,snapshot_date' });
  if (error) throw new Error(`content_performance upsert 실패: ${error.message}`);
  return rows.length;
}

export interface SearchQueryRow {
  date: string;
  site: string;
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number | null;
  position: number | null;
  tier: string | null;
}

export async function upsertSearchQueries(rows: SearchQueryRow[]): Promise<number> {
  if (!supabaseAdmin) throw new Error('Supabase admin 미설정');
  if (rows.length === 0) return 0;
  const { error } = await supabaseAdmin
    .from('search_queries')
    .upsert(rows, { onConflict: 'date,site,query,page' });
  if (error) throw new Error(`search_queries upsert 실패: ${error.message}`);
  return rows.length;
}

/** KST 기준 N일 전 날짜 (YYYY-MM-DD) */
export function kstDaysAgo(days: number): string {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  now.setUTCDate(now.getUTCDate() - days);
  return now.toISOString().slice(0, 10);
}
