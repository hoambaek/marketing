import 'server-only';

/**
 * Vercel Web Analytics 조회 API (2026-06 공개 공식 API)
 *
 * 환경변수:
 * - VERCEL_API_TOKEN: 계정 액세스 토큰
 * - VERCEL_TEAM_ID: team_… ID
 * - VERCEL_LANDING_PROJECT_ID / VERCEL_BLOG_PROJECT_ID: prj_… ID
 *
 * GA4와 달리 거의 실시간이므로 "어제(D-1)" 데이터를 수집한다.
 * Hobby 플랜은 커스텀 이벤트 미지원 → visits만 수집 (이벤트는 GA4가 담당).
 */

const BASE = 'https://api.vercel.com/v1/query/web-analytics';

export function isVercelConfigured(): boolean {
  return !!(
    process.env.VERCEL_API_TOKEN &&
    process.env.VERCEL_TEAM_ID &&
    (process.env.VERCEL_LANDING_PROJECT_ID || process.env.VERCEL_BLOG_PROJECT_ID)
  );
}

export function vercelProjects(): { channel: 'landing' | 'blog'; projectId: string }[] {
  const out: { channel: 'landing' | 'blog'; projectId: string }[] = [];
  if (process.env.VERCEL_LANDING_PROJECT_ID)
    out.push({ channel: 'landing', projectId: process.env.VERCEL_LANDING_PROJECT_ID });
  if (process.env.VERCEL_BLOG_PROJECT_ID)
    out.push({ channel: 'blog', projectId: process.env.VERCEL_BLOG_PROJECT_ID });
  return out;
}

async function query(
  path: string,
  projectId: string,
  params: Record<string, string>
): Promise<unknown> {
  const search = new URLSearchParams({
    projectId,
    teamId: process.env.VERCEL_TEAM_ID!,
    ...params,
  });
  const res = await fetch(`${BASE}/${path}?${search}`, {
    headers: { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}` },
  });
  if (!res.ok) {
    throw new Error(`Vercel Analytics ${path} 실패 (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

export interface VercelDailyMetric {
  metric: string;
  dimension: Record<string, string>;
  value: number;
}

/** 응답 형태 방어적 파싱: {data: [...]} 또는 배열 직접 반환 모두 허용 */
function extractRows(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    for (const key of ['data', 'rows', 'result']) {
      if (Array.isArray(obj[key])) return obj[key] as Record<string, unknown>[];
    }
    return [obj];
  }
  return [];
}

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** 지정일의 방문·페이지뷰 합계 */
export async function fetchVercelDaily(
  projectId: string,
  date: string
): Promise<VercelDailyMetric[]> {
  const raw = await query('visits/aggregate', projectId, {
    since: `${date}T00:00:00Z`,
    until: `${date}T23:59:59Z`,
  });
  const out: VercelDailyMetric[] = [];
  for (const row of extractRows(raw)) {
    const visitors = num(row.visitors);
    const pageviews = num(row.pageviews);
    if (visitors !== null) out.push({ metric: 'visitors', dimension: {}, value: visitors });
    if (pageviews !== null) out.push({ metric: 'pageviews', dimension: {}, value: pageviews });
  }
  return out;
}

/** 지정일의 referrer 상위 (네이버 등 유입 채널 측정 — API 없는 채널의 대체 측정) */
export async function fetchVercelReferrers(
  projectId: string,
  date: string
): Promise<VercelDailyMetric[]> {
  const raw = await query('visits/aggregate', projectId, {
    since: `${date}T00:00:00Z`,
    until: `${date}T23:59:59Z`,
    by: 'referrerHostname',
  });
  const out: VercelDailyMetric[] = [];
  for (const row of extractRows(raw)) {
    const referrer = String(
      row.referrerHostname ?? row.referrer ?? row.key ?? ''
    );
    const visitors = num(row.visitors) ?? num(row.pageviews) ?? num(row.count);
    if (referrer && visitors !== null) {
      out.push({ metric: 'referrer_visitors', dimension: { referrer }, value: visitors });
    }
  }
  // 상위 20개만 저장
  return out.sort((a, b) => b.value - a.value).slice(0, 20);
}
