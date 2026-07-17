import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * 애널리스트 에이전트용 읽기 전용 조회 툴 (Tier 2-2)
 *
 * 주간 리포트의 Claude에게 부여하는 드릴다운 도구.
 * - 전부 SELECT 전용, 파라미터는 화이트리스트 필터로만 반영 (임의 SQL 없음)
 * - 개인정보(이름·이메일·연락처)는 절대 반환하지 않는다 — 집계 수치만
 * - 결과는 저트래픽 규모에 맞게 상한(top)으로 잘라 토큰을 아낀다
 */

export const ANALYST_TOOLS = [
  {
    name: 'query_metrics',
    description:
      '채널 일일 지표(channel_metrics_daily) 조회. 유입 급감·급증의 원인을 소스/차원별로 분해할 때 사용. ' +
      'channel: landing|blog|instagram|search, metric 예: sessions, event:subscribe_submit, event:cta_click, clicks, sum_reach, sum_saved, sum_shares, referrer_visitors. ' +
      'group_by에 "dimension:channelGroup" 또는 "dimension:referrer"를 주면 해당 차원별 합계를 반환.',
    input_schema: {
      type: 'object' as const,
      properties: {
        channel: { type: 'string', description: '채널 필터 (생략 시 전체)' },
        metric: { type: 'string', description: '지표 필터 (생략 시 전체)' },
        source: { type: 'string', description: '소스 필터: ga4|vercel|ig_graph|gsc|naver_openapi(네이버 트렌드·버즈) (생략 시 전체)' },
        date_from: { type: 'string', description: 'YYYY-MM-DD (필수)' },
        date_to: { type: 'string', description: 'YYYY-MM-DD (필수)' },
        group_by: {
          type: 'string',
          description: 'date|channel|metric|dimension:<키> — 생략 시 date별',
        },
        top: { type: 'number', description: '반환 상한 (기본 20, 최대 50)' },
      },
      required: ['date_from', 'date_to'],
    },
  },
  {
    name: 'query_search_terms',
    description:
      '검색어 성과(search_queries, Search Console) 조회. 검색 유입 변화의 원인 키워드를 찾을 때 사용. ' +
      'tier: T1(니치 소유형)|T2(정보성 볼륨)|T3(고유명). 클릭 순 정렬.',
    input_schema: {
      type: 'object' as const,
      properties: {
        site: { type: 'string', description: '사이트 부분 일치 필터 (예: blog)' },
        tier: { type: 'string', description: 'T1|T2|T3 필터 (생략 시 전체)' },
        date_from: { type: 'string', description: 'YYYY-MM-DD (필수)' },
        date_to: { type: 'string', description: 'YYYY-MM-DD (필수)' },
        top: { type: 'number', description: '반환 상한 (기본 15, 최대 40)' },
      },
      required: ['date_from', 'date_to'],
    },
  },
  {
    name: 'query_content',
    description:
      '콘텐츠 성과(content_performance) 조회. 인스타 게시물·블로그 글의 저장/공유/도달 패턴을 볼 때 사용. ' +
      '게시물별 최신 스냅샷을 저장+공유 합 순으로 반환.',
    input_schema: {
      type: 'object' as const,
      properties: {
        content_type: { type: 'string', description: '유형 필터 (예: instagram)' },
        date_from: { type: 'string', description: '스냅샷 시작일 YYYY-MM-DD (필수)' },
        date_to: { type: 'string', description: '스냅샷 종료일 YYYY-MM-DD (필수)' },
        top: { type: 'number', description: '반환 상한 (기본 10, 최대 30)' },
      },
      required: ['date_from', 'date_to'],
    },
  },
  {
    name: 'query_conversions',
    description:
      '실물 전환(초대 신청·B2B 문의·명부 등록)의 일별 건수와 자기보고 유입 경로(referral_tag) 분포 조회. ' +
      '전환 급락 시 실제 폼 제출이 있었는지 확인하는 용도. 개인정보 없이 집계만 반환.',
    input_schema: {
      type: 'object' as const,
      properties: {
        date_from: { type: 'string', description: 'YYYY-MM-DD (필수)' },
        date_to: { type: 'string', description: 'YYYY-MM-DD (필수)' },
      },
      required: ['date_from', 'date_to'],
    },
  },
];

type ToolInput = Record<string, unknown>;

function str(input: ToolInput, key: string): string | undefined {
  const v = input[key];
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function capTop(input: ToolInput, def: number, max: number): number {
  const v = Number(input['top']);
  if (!Number.isFinite(v) || v <= 0) return def;
  return Math.min(Math.floor(v), max);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function dateRange(input: ToolInput): { from: string; to: string } {
  const from = str(input, 'date_from');
  const to = str(input, 'date_to');
  if (!from || !to || !DATE_RE.test(from) || !DATE_RE.test(to)) {
    throw new Error('date_from/date_to는 YYYY-MM-DD 형식 필수');
  }
  return { from, to };
}

async function queryMetrics(input: ToolInput): Promise<unknown> {
  if (!supabaseAdmin) throw new Error('Supabase 미설정');
  const { from, to } = dateRange(input);
  let q = supabaseAdmin
    .from('channel_metrics_daily')
    .select('date, channel, source, metric, dimension, value')
    .gte('date', from)
    .lte('date', to)
    .limit(5000);
  const channel = str(input, 'channel');
  const metric = str(input, 'metric');
  const source = str(input, 'source');
  if (channel) q = q.eq('channel', channel);
  if (metric) q = q.eq('metric', metric);
  if (source) q = q.eq('source', source);
  const { data, error } = await q;
  if (error) throw new Error(error.message);

  const groupBy = str(input, 'group_by') ?? 'date';
  const top = capTop(input, 20, 50);
  const acc = new Map<string, number>();
  for (const row of data ?? []) {
    let key: string;
    if (groupBy.startsWith('dimension:')) {
      const dimKey = groupBy.slice('dimension:'.length);
      key = (row.dimension as Record<string, string> | null)?.[dimKey] ?? '(없음)';
    } else if (groupBy === 'channel') key = row.channel;
    else if (groupBy === 'metric') key = `${row.channel}|${row.metric}`;
    else key = row.date;
    acc.set(key, (acc.get(key) ?? 0) + Number(row.value));
  }
  const rows = [...acc.entries()].map(([key, value]) => ({ key, value }));
  // 날짜 그룹은 시간순, 나머지는 값 내림차순
  rows.sort((a, b) => (groupBy === 'date' ? a.key.localeCompare(b.key) : b.value - a.value));
  return { group_by: groupBy, rows: rows.slice(0, top), truncated: rows.length > top };
}

async function querySearchTerms(input: ToolInput): Promise<unknown> {
  if (!supabaseAdmin) throw new Error('Supabase 미설정');
  const { from, to } = dateRange(input);
  let q = supabaseAdmin
    .from('search_queries')
    .select('site, query, tier, clicks, impressions, position')
    .gte('date', from)
    .lte('date', to)
    .limit(3000);
  const tier = str(input, 'tier');
  const site = str(input, 'site');
  if (tier) q = q.eq('tier', tier);
  if (site) q = q.ilike('site', `%${site}%`);
  const { data, error } = await q;
  if (error) throw new Error(error.message);

  const acc = new Map<string, { query: string; tier: string | null; clicks: number; impressions: number; posSum: number; posN: number }>();
  for (const row of data ?? []) {
    const e = acc.get(row.query) ?? { query: row.query, tier: row.tier, clicks: 0, impressions: 0, posSum: 0, posN: 0 };
    e.clicks += row.clicks ?? 0;
    e.impressions += row.impressions ?? 0;
    if (row.position != null) {
      e.posSum += Number(row.position);
      e.posN += 1;
    }
    acc.set(row.query, e);
  }
  const top = capTop(input, 15, 40);
  const rows = [...acc.values()]
    .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)
    .slice(0, top)
    .map((e) => ({
      query: e.query,
      tier: e.tier,
      clicks: e.clicks,
      impressions: e.impressions,
      avg_position: e.posN ? Math.round((e.posSum / e.posN) * 10) / 10 : null,
    }));
  return { rows };
}

async function queryContent(input: ToolInput): Promise<unknown> {
  if (!supabaseAdmin) throw new Error('Supabase 미설정');
  const { from, to } = dateRange(input);
  let q = supabaseAdmin
    .from('content_performance')
    .select('content_type, external_id, title, published_at, snapshot_date, metrics')
    .gte('snapshot_date', from)
    .lte('snapshot_date', to)
    .order('snapshot_date', { ascending: false })
    .limit(500);
  const contentType = str(input, 'content_type');
  if (contentType) q = q.eq('content_type', contentType);
  const { data, error } = await q;
  if (error) throw new Error(error.message);

  // 게시물별 최신 스냅샷만
  const seen = new Set<string>();
  const latest: typeof data = [];
  for (const row of data ?? []) {
    const key = `${row.content_type}:${row.external_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    latest!.push(row);
  }
  const top = capTop(input, 10, 30);
  const score = (m: Record<string, number> | null) => (m?.saved ?? 0) + (m?.shares ?? 0);
  const rows = (latest ?? [])
    .sort((a, b) => score(b.metrics as Record<string, number>) - score(a.metrics as Record<string, number>))
    .slice(0, top)
    .map((r) => ({
      content_type: r.content_type,
      title: r.title,
      published_at: r.published_at,
      snapshot_date: r.snapshot_date,
      metrics: r.metrics,
    }));
  return { rows };
}

async function queryConversions(input: ToolInput): Promise<unknown> {
  if (!supabaseAdmin) throw new Error('Supabase 미설정');
  const { from, to } = dateRange(input);
  const toEnd = `${to}T23:59:59+09:00`;
  const fromStart = `${from}T00:00:00+09:00`;

  const tables = [
    { table: 'invitations', label: '초대 신청', tsCol: 'created_at' },
    { table: 'partner_inquiries', label: 'B2B 문의', tsCol: 'created_at' },
    { table: 'subscribers', label: '명부 등록', tsCol: 'subscribed_at' },
  ] as const;

  const result: Record<string, unknown> = {};
  for (const { table, label, tsCol } of tables) {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select(`${tsCol}, referral_tag`)
      .gte(tsCol, fromStart)
      .lte(tsCol, toEnd)
      .limit(2000);
    if (error) throw new Error(`${table}: ${error.message}`);
    const byDay = new Map<string, number>();
    const byTag = new Map<string, number>();
    for (const row of (data ?? []) as unknown as Record<string, string | null>[]) {
      const ts = row[tsCol];
      if (!ts) continue;
      // KST 날짜로 환산
      const day = new Date(new Date(ts).getTime() + 9 * 3600_000).toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
      const tag = row.referral_tag ?? '(미태깅)';
      byTag.set(tag, (byTag.get(tag) ?? 0) + 1);
    }
    result[label] = {
      total: (data ?? []).length,
      by_day: [...byDay.entries()].sort().map(([date, count]) => ({ date, count })),
      by_referral_tag: [...byTag.entries()].sort((a, b) => b[1] - a[1]).map(([tag, count]) => ({ tag, count })),
    };
  }
  return result;
}

export async function runAnalystTool(name: string, input: ToolInput): Promise<string> {
  try {
    let out: unknown;
    switch (name) {
      case 'query_metrics':
        out = await queryMetrics(input);
        break;
      case 'query_search_terms':
        out = await querySearchTerms(input);
        break;
      case 'query_content':
        out = await queryContent(input);
        break;
      case 'query_conversions':
        out = await queryConversions(input);
        break;
      default:
        return JSON.stringify({ error: `알 수 없는 툴: ${name}` });
    }
    return JSON.stringify(out);
  } catch (e) {
    return JSON.stringify({ error: e instanceof Error ? e.message : String(e) });
  }
}
