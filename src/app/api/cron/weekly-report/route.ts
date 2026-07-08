/**
 * AI 주간 전략 정합성 리포트 크론
 *
 * Vercel Cron에서 매주 월요일 KST 08:00 (일요일 UTC 23:00) 호출.
 * 지난주(D-7~D-1) 데이터를 직전주와 비교해 Claude가 판정 리포트를 생성한다.
 *
 * 판정 기준은 채널 운영 전략(2026-07-08)의 KPI:
 * - 온라인 채널의 제1 전환 = 명부 등록 (subscribe_submit)
 * - 인스타그램은 팔로워 수가 아니라 저장(saved)·공유(shares)
 * - 블로그는 키워드 3계층(T1/T2/T3) 가설 검증
 * - 판매는 B2B 전용 — 전환은 결제가 아니라 문의·초대
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { kstDaysAgo } from '@/lib/marketing/store';

export const maxDuration = 120;

function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return request.headers.get('x-vercel-cron') === '1';
  return authHeader === `Bearer ${cronSecret}`;
}

interface MetricAgg {
  channel: string;
  metric: string;
  thisWeek: number;
  prevWeek: number;
}

async function aggregateWeeks(): Promise<MetricAgg[]> {
  if (!supabaseAdmin) throw new Error('Supabase admin 미설정');
  const from = kstDaysAgo(14);
  const mid = kstDaysAgo(7);
  const { data, error } = await supabaseAdmin
    .from('channel_metrics_daily')
    .select('date, channel, metric, value')
    .gte('date', from);
  if (error) throw new Error(error.message);

  const agg = new Map<string, MetricAgg>();
  for (const row of data ?? []) {
    const key = `${row.channel}|${row.metric}`;
    const entry = agg.get(key) ?? { channel: row.channel, metric: row.metric, thisWeek: 0, prevWeek: 0 };
    if (row.date >= mid) entry.thisWeek += Number(row.value);
    else entry.prevWeek += Number(row.value);
    agg.set(key, entry);
  }
  return [...agg.values()];
}

async function topContent(): Promise<Record<string, unknown>[]> {
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin
    .from('content_performance')
    .select('content_type, title, permalink, metrics, snapshot_date')
    .gte('snapshot_date', kstDaysAgo(7))
    .order('snapshot_date', { ascending: false })
    .limit(50);
  // 게시물별 최신 스냅샷만, 저장+공유 순 상위 5
  const seen = new Set<string>();
  const latest: Record<string, unknown>[] = [];
  for (const row of data ?? []) {
    const key = `${row.content_type}:${row.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    latest.push(row);
  }
  return latest
    .sort((a, b) => {
      const score = (r: Record<string, unknown>) => {
        const m = (r.metrics ?? {}) as Record<string, number>;
        return (m.saved ?? 0) + (m.shares ?? 0);
      };
      return score(b) - score(a);
    })
    .slice(0, 5);
}

const STRATEGY_PROMPT = `당신은 뮤즈드마레(해저숙성 샴페인·전통주 럭셔리 브랜드)의 마케팅 전략 분석가다.
아래 주간 데이터를 채널 운영 전략 기준으로 판정하라.

## 전략 기준 (2026-07-08 확정)
- 브랜드 북극성: "바다의 시간을 기록하는 브랜드". 증거가 본체, 광고는 그림자.
- 판매는 B2B 전용, 온라인 채널은 브랜드 홍보만 — 전환 목표는 결제가 아니라 명부 등록(subscribe_submit)·초대 신청·B2B 문의(cta_click).
- 인스타그램: 팔로워 수보다 저장(saved)·공유(shares)가 상위 지표. 주류 계정은 추천 피드 제외라 팔로워 성장 정체는 정상.
- 블로그: 키워드 3계층 — T1(해저숙성 등 니치 소유형), T2(샴페인 보관법 등 정보성, 유입 볼륨의 본체), T3(고유명). T2가 볼륨을, T1이 정확도를 담당하는 게 정상 패턴.
- 뉴스레터: 오픈율 40% 이상(소수 정예 기준), 수신거부율 상승은 서사 피로의 조기 경보.

## 출력 형식 (JSON만, 다른 텍스트 금지)
{
  "verdict": "on-track" | "watch" | "off-track",
  "summary_md": "마크다운 리포트"
}

summary_md 구조:
1. **판정 한 줄** — verdict의 이유
2. **퍼널** — 발견(검색 클릭+인스타 도달) → 목격(랜딩 세션) → 관계(명부 등록) → 초대·문의, 각 단계 전주 대비
3. **채널별 진단** — 각 채널이 전략상 역할을 하고 있는가
4. **이상 신호** — 있으면 명시, 없으면 "없음"
5. **다음 주 액션** — 3개 이하, 실행 가능한 형태

규칙: 데이터에 없는 수치를 지어내지 마라. 데이터가 부족한 채널은 "데이터 수집 전"으로 표기하라. 판정이 애매하면 watch를 선택하라.`;

async function callClaude(payload: unknown): Promise<{ verdict: string; summary_md: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY 미설정');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 4000,
      system: STRATEGY_PROMPT,
      messages: [
        { role: 'user', content: `주간 데이터:\n${JSON.stringify(payload, null, 2)}` },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Claude API 실패 (${res.status}): ${await res.text()}`);
  const data = await res.json();
  const text: string = data.content?.[0]?.text ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Claude 응답에서 JSON을 찾지 못함');
  const parsed = JSON.parse(jsonMatch[0]);
  if (!parsed.verdict || !parsed.summary_md) throw new Error('Claude 응답 형식 불일치');
  return parsed;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase admin 미설정' }, { status: 500 });
  }

  try {
    const metrics = await aggregateWeeks();
    if (metrics.length === 0) {
      return NextResponse.json({
        success: true,
        result: 'skip (수집된 데이터 없음 — 수집기 연동 후 자동 시작)',
      });
    }

    const content = await topContent();
    const weekStart = kstDaysAgo(7);
    const payload = { weekStart, metrics, topContentBySavesShares: content };

    const report = await callClaude(payload);

    const { error } = await supabaseAdmin.from('ai_reports').upsert(
      {
        week_start: weekStart,
        generated_at: new Date().toISOString(),
        verdict: report.verdict,
        summary_md: report.summary_md,
        metrics_snapshot: payload,
      },
      { onConflict: 'week_start' }
    );
    if (error) throw new Error(`ai_reports 저장 실패: ${error.message}`);

    return NextResponse.json({ success: true, weekStart, verdict: report.verdict });
  } catch (e) {
    console.error('[Cron] 주간 리포트 오류:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
