import 'server-only';
import { getGoogleAccessToken, isGoogleConfigured } from './google-auth';

/**
 * GA4 Data API 수집기 (랜딩 + 블로그 공용 프로퍼티 G-YVXMD6VF59)
 *
 * 환경변수:
 * - GA4_PROPERTY_ID: GA4 관리 → 속성 설정의 숫자 ID (측정 ID G-… 아님)
 *
 * GA4 표준 데이터는 24~48시간 지연되므로 크론은 "그제(D-2)" 데이터를 수집한다.
 */

const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';

export function isGa4Configured(): boolean {
  return isGoogleConfigured() && !!process.env.GA4_PROPERTY_ID;
}

interface Ga4Row {
  dimensionValues: { value: string }[];
  metricValues: { value: string }[];
}

async function runReport(body: Record<string, unknown>): Promise<Ga4Row[]> {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const token = await getGoogleAccessToken(SCOPE);
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) throw new Error(`GA4 runReport 실패 (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return (data.rows ?? []) as Ga4Row[];
}

export interface Ga4DailyMetric {
  metric: string;
  dimension: Record<string, string>;
  value: number;
}

/** hostName으로 landing/blog 채널을 구분한다 */
export function hostToChannel(host: string): 'landing' | 'blog' | null {
  if (host.startsWith('blog.')) return 'blog';
  if (host.includes('musedemaree')) return 'landing';
  return null;
}

/** 지정일의 세션·사용자 (호스트×소스채널별) */
export async function fetchDailyTraffic(date: string): Promise<Ga4DailyMetric[]> {
  const rows = await runReport({
    dateRanges: [{ startDate: date, endDate: date }],
    dimensions: [{ name: 'hostName' }, { name: 'sessionDefaultChannelGroup' }],
    metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
  });
  const out: Ga4DailyMetric[] = [];
  for (const r of rows) {
    const [host, channelGroup] = r.dimensionValues.map((d) => d.value);
    out.push(
      { metric: 'sessions', dimension: { host, channelGroup }, value: Number(r.metricValues[0].value) },
      { metric: 'activeUsers', dimension: { host, channelGroup }, value: Number(r.metricValues[1].value) }
    );
  }
  return out;
}

/** 지정일의 커스텀 이벤트 집계 (cta_click, subscribe_submit 등) */
export async function fetchDailyEvents(date: string): Promise<Ga4DailyMetric[]> {
  const rows = await runReport({
    dateRanges: [{ startDate: date, endDate: date }],
    dimensions: [{ name: 'hostName' }, { name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        inListFilter: { values: ['cta_click', 'subscribe_submit'] },
      },
    },
  });
  return rows.map((r) => {
    const [host, eventName] = r.dimensionValues.map((d) => d.value);
    return {
      metric: `event:${eventName}`,
      dimension: { host },
      value: Number(r.metricValues[0].value),
    };
  });
}

/** 지정일의 랜딩페이지 상위 20 (블로그 글별 유입 추적용) */
export async function fetchDailyLandingPages(date: string): Promise<Ga4DailyMetric[]> {
  const rows = await runReport({
    dateRanges: [{ startDate: date, endDate: date }],
    dimensions: [{ name: 'hostName' }, { name: 'landingPage' }],
    metrics: [{ name: 'sessions' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 20,
  });
  return rows.map((r) => {
    const [host, landingPage] = r.dimensionValues.map((d) => d.value);
    return {
      metric: 'landing_sessions',
      dimension: { host, landingPage },
      value: Number(r.metricValues[0].value),
    };
  });
}
