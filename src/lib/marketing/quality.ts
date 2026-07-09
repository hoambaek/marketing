import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { isGa4Configured } from '@/lib/marketing/ga4';
import { isVercelConfigured } from '@/lib/marketing/vercel-analytics';
import { isInstagramConfigured } from '@/lib/marketing/instagram';
import { isGscConfigured } from '@/lib/marketing/gsc';
import { kstDaysAgo } from '@/lib/marketing/store';

/**
 * 데이터 품질 게이트 (Tier 2-1) — 모든 분석의 0번 단계
 *
 * 소스별 마지막 적재일을 확인해 "신선도"를 판정한다.
 * 4개 소스 중 하나만 배치가 조용히 실패해도 주간 리포트 전체가 오염되므로,
 * 리포트 생성 전에 반드시 이 게이트를 통과시키고 실패 소스는 "신뢰 저하"로 표기한다.
 */

export interface SourceFreshness {
  source: 'ga4' | 'vercel' | 'ig_graph' | 'gsc';
  name: string;
  configured: boolean;
  lastDate: string | null;
  /** 오늘(KST)로부터 마지막 적재일까지 경과일. 적재 없으면 null */
  staleDays: number | null;
  /** 이 소스의 정상 지연 허용치 (수집 지연 + 여유) */
  maxLagDays: number;
  ok: boolean;
}

// 소스별 허용 지연: 수집기 자체가 D-1~D-2 데이터를 넣고, GSC는 원천이 2~3일 늦는다
const SOURCE_SPECS: { source: SourceFreshness['source']; name: string; maxLagDays: number; isConfigured: () => boolean }[] = [
  { source: 'ga4', name: 'GA4', maxLagDays: 3, isConfigured: isGa4Configured },
  { source: 'vercel', name: 'Vercel', maxLagDays: 2, isConfigured: isVercelConfigured },
  { source: 'ig_graph', name: 'Instagram', maxLagDays: 2, isConfigured: isInstagramConfigured },
  { source: 'gsc', name: 'Search Console', maxLagDays: 5, isConfigured: isGscConfigured },
];

function daysBetween(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400_000);
}

export async function checkDataFreshness(): Promise<SourceFreshness[]> {
  const today = kstDaysAgo(0);
  const lastDates: Partial<Record<string, string>> = {};

  if (supabaseAdmin) {
    // 최근 30일 범위에서 소스별 max(date) — 인덱스(idx_cmd_date) 범위 안에서 조회
    const { data } = await supabaseAdmin
      .from('channel_metrics_daily')
      .select('source, date')
      .gte('date', kstDaysAgo(30))
      .order('date', { ascending: false })
      .limit(2000);
    for (const row of data ?? []) {
      if (!lastDates[row.source]) lastDates[row.source] = row.date;
    }
  }

  return SOURCE_SPECS.map(({ source, name, maxLagDays, isConfigured }) => {
    const configured = isConfigured();
    const lastDate = lastDates[source] ?? null;
    const staleDays = lastDate ? daysBetween(lastDate, today) : null;
    // 미연동 소스는 게이트 대상이 아님(연동 대기로 별도 표시), 연동됐는데 적재가 늦으면 실패
    const ok = !configured || (staleDays !== null && staleDays <= maxLagDays);
    return { source, name, configured, lastDate, staleDays, maxLagDays, ok };
  });
}

/** 리포트 프롬프트에 넣을 신선도 요약 (판정 근거가 되는 0단계 데이터) */
export function freshnessSummary(freshness: SourceFreshness[]): {
  allFresh: boolean;
  degradedSources: string[];
  lines: string[];
} {
  const degraded = freshness.filter((f) => f.configured && !f.ok);
  return {
    allFresh: degraded.length === 0,
    degradedSources: degraded.map((f) => f.name),
    lines: freshness.map((f) => {
      if (!f.configured) return `${f.name}: 미연동`;
      if (f.ok) return `${f.name}: 정상 (마지막 적재 ${f.lastDate}, 허용 지연 ${f.maxLagDays}일 이내)`;
      return `${f.name}: ⚠️ 신뢰 저하 — 마지막 적재 ${f.lastDate ?? '없음'} (${f.staleDays ?? '-'}일 경과, 허용 ${f.maxLagDays}일)`;
    }),
  };
}
