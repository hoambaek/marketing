import 'server-only';
import { getGoogleAccessToken, isGoogleConfigured } from './google-auth';
import { tagKeywordTier } from './keyword-tiers';

/**
 * Google Search Console 수집기 — 키워드 3계층(T1/T2/T3) 가설 검증용
 *
 * 환경변수:
 * - GSC_LANDING_SITE: 서치콘솔 속성 URL (예: sc-domain:musedemaree.com 또는 https://musedemaree.com/)
 * - GSC_BLOG_SITE: 블로그 속성 URL (도메인 속성이면 GSC_LANDING_SITE 하나로 통합 가능)
 *
 * GSC 데이터는 2~3일 지연 → 크론은 D-3 데이터를 수집한다.
 */

const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

export function isGscConfigured(): boolean {
  return isGoogleConfigured() && !!(process.env.GSC_LANDING_SITE || process.env.GSC_BLOG_SITE);
}

export function gscSites(): { site: 'landing' | 'blog'; url: string }[] {
  const out: { site: 'landing' | 'blog'; url: string }[] = [];
  if (process.env.GSC_LANDING_SITE) out.push({ site: 'landing', url: process.env.GSC_LANDING_SITE });
  if (process.env.GSC_BLOG_SITE) out.push({ site: 'blog', url: process.env.GSC_BLOG_SITE });
  return out;
}

export interface GscQueryRow {
  date: string;
  site: 'landing' | 'blog';
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  tier: string | null;
}

export interface GscDailyTotal {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

/**
 * 차원 없는 일 합계 조회.
 * query 차원은 GSC 저볼륨 익명화 때문에 노출이 적으면 행이 통째로 숨어 빈 응답이 된다
 * (2026-07-14 실측: 같은 기간을 query·page 차원으로 조회하면 0행, 합계로 조회하면 노출 15·클릭 2).
 * 일 단위 추이 적재는 반드시 이 합계를 쓴다. 행이 없으면 그날 검색 노출 0.
 */
export async function fetchDailyTotal(
  site: { site: 'landing' | 'blog'; url: string },
  date: string
): Promise<GscDailyTotal | null> {
  const token = await getGoogleAccessToken(SCOPE);
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site.url)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: date, endDate: date, rowLimit: 1 }),
    }
  );
  if (!res.ok) throw new Error(`GSC total 실패 (${res.status}): ${await res.text()}`);
  const data = await res.json();
  const row = (data.rows ?? [])[0] as
    | { clicks: number; impressions: number; ctr: number; position: number }
    | undefined;
  if (!row) return null;
  return { clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position };
}

export async function fetchSearchQueries(
  site: { site: 'landing' | 'blog'; url: string },
  date: string
): Promise<GscQueryRow[]> {
  const token = await getGoogleAccessToken(SCOPE);
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site.url)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: date,
        endDate: date,
        dimensions: ['query', 'page'],
        rowLimit: 500,
      }),
    }
  );
  if (!res.ok) throw new Error(`GSC query 실패 (${res.status}): ${await res.text()}`);
  const data = await res.json();
  const rows = (data.rows ?? []) as {
    keys: string[];
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }[];
  return rows.map((r) => ({
    date,
    site: site.site,
    query: r.keys[0],
    page: r.keys[1] ?? '',
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
    tier: tagKeywordTier(r.keys[0]),
  }));
}
