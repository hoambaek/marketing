import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { kstDaysAgo } from '@/lib/marketing/store';

/**
 * 경량 이상탐지 트리거 (Tier 3) — 주중 6일 사각지대 해소
 *
 * 일 수집 크론 종료 후 8주 롤링 베이스라인(중앙값±MAD) 대비 편차를 체크한다.
 * 저트래픽 오탐 방지 3원칙:
 * 1. N연속 — 단일 데이터포인트가 아니라 2일 연속 이상일 때만 발화
 * 2. 회복 윈도 — 같은 지표에 열린 경보가 있으면 재발화하지 않고, 정상 복귀 시 자동 해소
 * 3. 심각도 라우팅 — warning(관찰)과 critical(전환 0건·급락)을 구분, critical만 강한 알림
 *
 * 추가 가드: 베이스라인 중앙값이 최소 표본(MIN_BASELINE_MEDIAN) 미만인 지표는
 * 상대 편차 판정을 건너뛴다 (작은 수의 요동은 전부 노이즈).
 */

const BASELINE_DAYS = 56; // 8주
const CONSECUTIVE_N = 2; // N연속 이상만 발화
const MIN_BASELINE_DAYS = 14; // 베이스라인 데이터가 이보다 적으면 판정 안 함
const MIN_BASELINE_MEDIAN = 5; // 상대 편차 판정의 최소 표본 가드
const MAD_K = 3; // 중앙값 ± K*MAD 밖이면 이상
const CRITICAL_DROP_RATIO = 0.3; // 중앙값의 30% 미만으로 떨어지면 critical
const ZERO_CONVERSION_DAYS = 3; // 전환 0건 절대 임계 (연속일)

/** 감시 지표: 상대 편차(베이스라인 대비) 대상 */
const WATCHED_SERIES: { key: string; label: string; channel: string; metric: string; lagDays: number }[] = [
  { key: 'landing|sessions', label: '랜딩 세션', channel: 'landing', metric: 'sessions', lagDays: 2 },
  { key: 'blog|sessions', label: '블로그 세션', channel: 'blog', metric: 'sessions', lagDays: 2 },
  { key: 'search|clicks', label: '검색 클릭', channel: 'search', metric: 'clicks', lagDays: 4 },
  { key: 'instagram|sum_reach', label: '인스타 도달', channel: 'instagram', metric: 'sum_reach', lagDays: 2 },
];

/**
 * 절대 임계 감시: 전환 합계가 N일 연속 0 (베이스라인에 전환이 있던 경우만).
 * subscribe_submit은 여기 넣지 않는다 — 같은 전환이 실물 폼 제출(subscribers)로도 잡혀
 * 이중 계상되기 때문. DB 쪽이 지연도 없고 GA4 저볼륨 익명화도 안 타는 정본이다.
 * 남은 cta_click은 GA4에만 있는 신호(링크 클릭)라 유지한다.
 */
const CONVERSION_METRICS = ['event:cta_click'];

/**
 * GA4 수집 지연 — collect-web이 kstDaysAgo(3)을 수집하므로 D-3이 최신이다.
 * D-2를 평가하면 "데이터 미수집"을 "전환 0건"으로 오독한다 (2026-07-15 오탐 원인).
 */
const GA4_LAG_DAYS = 3;

export interface AnomalyAlert {
  metric_key: string;
  label: string;
  severity: 'warning' | 'critical';
  direction: 'drop' | 'spike' | 'zero';
  current_value: number;
  baseline_value: number;
  consecutive_days: number;
  detail: Record<string, unknown>;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function mad(values: number[], med: number): number {
  return median(values.map((v) => Math.abs(v - med)));
}

interface DailyRow {
  date: string;
  channel: string;
  metric: string;
  value: number;
}

/** 날짜별 합계 시리즈로 변환 (차원 분해 행들을 합침) */
function toDailySeries(rows: DailyRow[], channel: string, metric: string): Map<string, number> {
  const series = new Map<string, number>();
  for (const r of rows) {
    if (r.channel !== channel || r.metric !== metric) continue;
    series.set(r.date, (series.get(r.date) ?? 0) + Number(r.value));
  }
  return series;
}

/** lagDays를 감안해 평가할 최근 N일 날짜 목록 (오늘 제외, 최신순) */
function evalDates(lagDays: number, n: number): string[] {
  return Array.from({ length: n }, (_, i) => kstDaysAgo(lagDays + i));
}

function checkRelative(
  rows: DailyRow[],
  spec: (typeof WATCHED_SERIES)[number]
): AnomalyAlert | null {
  const series = toDailySeries(rows, spec.channel, spec.metric);
  const recent = evalDates(spec.lagDays, CONSECUTIVE_N);
  const recentValues = recent.map((d) => series.get(d));
  // 평가일에 데이터가 아예 없으면 수집 문제(품질 게이트 영역)이지 트렌드 이상이 아님
  if (recentValues.some((v) => v === undefined)) return null;

  const baseline: number[] = [];
  const baselineStart = kstDaysAgo(spec.lagDays + BASELINE_DAYS);
  const recentSet = new Set(recent);
  for (const [date, value] of series) {
    if (date >= baselineStart && !recentSet.has(date) && date < recent[0]) baseline.push(value);
  }
  if (baseline.length < MIN_BASELINE_DAYS) return null;

  const med = median(baseline);
  if (med < MIN_BASELINE_MEDIAN) return null; // 저트래픽 최소 표본 가드
  const deviation = Math.max(mad(baseline, med), med * 0.1); // MAD 0 방지 하한

  const vals = recentValues as number[];
  const allLow = vals.every((v) => v < med - MAD_K * deviation);
  const allHigh = vals.every((v) => v > med + MAD_K * deviation);
  if (!allLow && !allHigh) return null;

  const avgRecent = vals.reduce((s, v) => s + v, 0) / vals.length;
  const severity: AnomalyAlert['severity'] =
    allLow && avgRecent < med * CRITICAL_DROP_RATIO ? 'critical' : 'warning';

  return {
    metric_key: spec.key,
    label: spec.label,
    severity,
    direction: allLow ? 'drop' : 'spike',
    current_value: Math.round(avgRecent * 10) / 10,
    baseline_value: Math.round(med * 10) / 10,
    consecutive_days: CONSECUTIVE_N,
    detail: {
      recentDates: recent,
      recentValues: vals,
      baselineDays: baseline.length,
      baselineMedian: med,
      baselineMad: deviation,
      rule: `중앙값±${MAD_K}×MAD, ${CONSECUTIVE_N}일 연속`,
    },
  };
}

/**
 * 전환 0건 판정 — 실물 폼 제출(DB)이 정본이고, GA4 cta_click을 보조로 더한다.
 * GA4는 D-3까지만 수집되고 저볼륨 익명화도 타므로 단독 근거로 쓰지 않는다.
 * 실물 폼 제출(명부·초대·문의·브랜드북)은 지연이 없어 그날의 전환을 바로 반영한다.
 * @param formSubmitsByDate KST 날짜(YYYY-MM-DD) → 실물 폼 제출 건수
 */
function checkZeroConversions(
  rows: DailyRow[],
  formSubmitsByDate: Map<string, number>
): AnomalyAlert | null {
  // GA4 전환 이벤트 + 실물 폼 제출을 KST 일별로 합산
  const series = new Map<string, number>();
  for (const r of rows) {
    if (!CONVERSION_METRICS.includes(r.metric)) continue;
    series.set(r.date, (series.get(r.date) ?? 0) + Number(r.value));
  }
  for (const [date, count] of formSubmitsByDate) {
    series.set(date, (series.get(date) ?? 0) + count);
  }
  const recent = evalDates(GA4_LAG_DAYS, ZERO_CONVERSION_DAYS);
  // 평가일 데이터 자체가 없으면(수집 실패) 품질 게이트 영역
  if (recent.some((d) => !rows.some((r) => r.date === d))) return null;

  const recentSum = recent.reduce((s, d) => s + (series.get(d) ?? 0), 0);
  if (recentSum > 0) return null;

  // 베이스라인 기간에 전환이 거의 없었다면 0건은 정상 (알림 없음)
  const baselineStart = kstDaysAgo(GA4_LAG_DAYS + BASELINE_DAYS);
  let baselineTotal = 0;
  const recentSet = new Set(recent);
  for (const [date, value] of series) {
    if (date >= baselineStart && !recentSet.has(date) && date < recent[0]) {
      baselineTotal += value;
    }
  }
  // 분모는 반드시 달력 일수 — series에는 전환이 있던 날짜만 들어 있어서
  // 항목 수를 세면 "전환이 있던 날의 평균"이 되어 항상 1 이상이 나온다.
  // 그러면 아래 저트래픽 가드가 영구히 무력화된다 (2026-07-15 오탐 원인).
  const dailyAvg = baselineTotal / BASELINE_DAYS;
  if (dailyAvg < 0.5) return null; // 주 3~4건 미만 규모면 0건 연속은 판정 불가

  return {
    metric_key: 'conversions|zero',
    label: '전환(명부·초대·문의·브랜드북)',
    severity: 'critical',
    direction: 'zero',
    current_value: 0,
    baseline_value: Math.round(dailyAvg * 10) / 10,
    consecutive_days: ZERO_CONVERSION_DAYS,
    detail: {
      recentDates: recent,
      rule: `전환 0건 ${ZERO_CONVERSION_DAYS}일 연속 (실물 폼 제출 + GA4 cta_click, D-${GA4_LAG_DAYS} 기준, 절대 임계)`,
      baselineDailyAvg: dailyAvg,
    },
  };
}

/**
 * 실물 폼 제출(명부·초대·문의)을 KST 날짜별 건수로 집계한다.
 * timestamptz(UTC)를 Asia/Seoul 날짜로 변환해 GA4 이벤트의 KST 일자와 맞춘다.
 */
async function fetchFormSubmitsByKstDate(since: string): Promise<Map<string, number>> {
  const byDate = new Map<string, number>();
  if (!supabaseAdmin) return byDate;

  // 랜딩 폼(landing/src/lib/forms.ts)이 쓰는 테이블 전부 + 블로그 명부(subscribers).
  // brandbook_requests 누락 시 브랜드북 신청이 전환으로 안 세진다.
  const sources: { table: string; ts: string }[] = [
    { table: 'subscribers', ts: 'subscribed_at' },
    { table: 'invitations', ts: 'created_at' },
    { table: 'partner_inquiries', ts: 'created_at' },
    { table: 'brandbook_requests', ts: 'created_at' },
  ];

  for (const { table, ts } of sources) {
    // since(KST 날짜)의 자정을 UTC로 넉넉히 잡아 조회 (KST 변환은 아래에서)
    const { data, error } = await supabaseAdmin
      .from(table)
      .select(ts)
      .gte(ts, `${since}T00:00:00+09:00`);
    if (error) continue; // 한 테이블 실패해도 나머지는 진행 (전환 신호는 합집합)
    for (const row of (data ?? []) as unknown as Record<string, string | null>[]) {
      const raw = row[ts];
      if (!raw) continue;
      // UTC → KST 날짜 (YYYY-MM-DD)
      const kstDate = new Date(new Date(raw).getTime() + 9 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      byDate.set(kstDate, (byDate.get(kstDate) ?? 0) + 1);
    }
  }
  return byDate;
}

export interface AnomalyRunResult {
  fired: AnomalyAlert[];
  resolved: string[];
  skipped: string[];
}

/** 이상탐지 실행: 신규 경보 발화 + 정상 복귀 경보 해소. DB 반영까지 수행 */
export async function runAnomalyDetection(): Promise<AnomalyRunResult> {
  if (!supabaseAdmin) throw new Error('Supabase admin 미설정');

  const since = kstDaysAgo(BASELINE_DAYS + 7);
  const { data, error } = await supabaseAdmin
    .from('channel_metrics_daily')
    .select('date, channel, metric, value')
    .gte('date', since)
    .limit(20000);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as DailyRow[];

  // 실물 폼 제출을 KST 날짜별로 집계 (GA4 이벤트가 저볼륨 익명화로 0일 때의 실제 전환 신호)
  const formSubmitsByDate = await fetchFormSubmitsByKstDate(since);

  // 현재 열린 경보 (회복 윈도: 열려있는 동안 같은 지표 재발화 금지)
  const { data: openData } = await supabaseAdmin
    .from('marketing_alerts')
    .select('id, metric_key')
    .eq('status', 'open');
  const openByKey = new Map<string, number>();
  for (const a of openData ?? []) openByKey.set(a.metric_key, a.id);

  const candidates: (AnomalyAlert | null)[] = [
    ...WATCHED_SERIES.map((spec) => checkRelative(rows, spec)),
    checkZeroConversions(rows, formSubmitsByDate),
  ];

  const fired: AnomalyAlert[] = [];
  const skipped: string[] = [];
  const stillAnomalous = new Set<string>();

  for (const alert of candidates) {
    if (!alert) continue;
    stillAnomalous.add(alert.metric_key);
    if (openByKey.has(alert.metric_key)) {
      skipped.push(alert.metric_key); // 이미 열린 경보 — 재발화 안 함
      continue;
    }
    fired.push(alert);
  }

  // 회복 윈도: 열린 경보 중 이번 검사에서 이상이 아니면 해소 처리
  const resolved: string[] = [];
  for (const [key, id] of openByKey) {
    if (stillAnomalous.has(key)) continue;
    await supabaseAdmin
      .from('marketing_alerts')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', id);
    resolved.push(key);
  }

  return { fired, resolved, skipped };
}

/** 신규 경보에 대한 Claude 미니 조사 — 2~4문장 원인 가설 (판정이 아니라 가설) */
export async function investigateAlert(alert: AnomalyAlert): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !supabaseAdmin) return null;

  try {
    // 관련 컨텍스트: 해당 지표의 최근 28일 시리즈 + 최근 7일 차원 분해
    const [channel, metric] = alert.metric_key.includes('|')
      ? alert.metric_key.split('|')
      : ['landing', 'sessions'];
    const { data } = await supabaseAdmin
      .from('channel_metrics_daily')
      .select('date, channel, metric, dimension, value')
      .gte('date', kstDaysAgo(28))
      .eq('channel', channel === 'conversions' ? 'landing' : channel)
      .limit(3000);

    const daily = new Map<string, number>();
    const dims = new Map<string, number>();
    for (const r of data ?? []) {
      if (channel !== 'conversions' && r.metric !== metric) continue;
      daily.set(r.date, (daily.get(r.date) ?? 0) + Number(r.value));
      const dim = r.dimension as Record<string, string> | null;
      const dimLabel = dim?.channelGroup ?? dim?.referrer;
      if (dimLabel) dims.set(dimLabel, (dims.get(dimLabel) ?? 0) + Number(r.value));
    }

    const context = {
      alert: {
        지표: alert.label,
        방향: alert.direction,
        현재: alert.current_value,
        베이스라인: alert.baseline_value,
        규칙: alert.detail.rule,
      },
      최근28일_일별: [...daily.entries()].sort().map(([date, value]) => ({ date, value })),
      차원별_합계: [...dims.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10),
    };

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 800,
        system:
          '당신은 저트래픽 럭셔리 브랜드(뮤즈드마레)의 마케팅 이상탐지 조사관이다. ' +
          '경보와 데이터를 보고 2~4문장으로 원인 가설과 사람이 확인할 것 1가지를 제시하라. ' +
          '저트래픽이라 통계 판정은 불가 — 가설임을 명확히 하라. 데이터에 없는 수치를 지어내지 마라. 마크다운 없이 평문으로.',
        messages: [{ role: 'user', content: JSON.stringify(context, null, 2) }],
      }),
    });
    if (!res.ok) return null;
    const result = await res.json();
    return result.content?.[0]?.text ?? null;
  } catch {
    return null; // 조사 실패는 경보 자체를 막지 않는다
  }
}

/** Slack 웹훅 알림 (SLACK_WEBHOOK_URL 미설정 시 조용히 건너뜀 — 경보는 /channels에서 확인 가능) */
export async function notifySlack(alert: AnomalyAlert, investigation: string | null): Promise<boolean> {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) return false;

  const emoji = alert.severity === 'critical' ? '🚨' : '⚠️';
  const dir = alert.direction === 'drop' ? '급락' : alert.direction === 'spike' ? '급증' : '0건 연속';
  const lines = [
    `${emoji} [뮤즈드마레 관제] ${alert.label} ${dir}`,
    `현재 ${alert.current_value} / 베이스라인 ${alert.baseline_value} (${alert.consecutive_days}일 연속, ${alert.detail.rule})`,
  ];
  if (investigation) lines.push(`\nAI 가설: ${investigation}`);
  lines.push(`\n확인: https://plan.musedemaree.com/channels`);

  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: lines.join('\n') }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
