/**
 * AI 주간 전략 정합성 리포트 크론 — 애널리스트 에이전트 (Tier 2)
 *
 * Vercel Cron에서 매주 월요일 KST 08:00 (일요일 UTC 23:00) 호출.
 * 지난주(D-7~D-1) 데이터를 직전주와 비교해 Claude가 판정 리포트를 생성한다.
 *
 * Tier 2 승격 (2026-07-09):
 * - 0단계 데이터 품질 게이트: 소스별 신선도 확인, 실패 소스는 "신뢰 저하" 플래그
 * - 읽기 전용 조회 툴 4종을 Claude에 부여 — off-track 판정 시 스스로 세그먼트 드릴다운
 * - Improvado식 진단 결정 트리를 시스템 프롬프트에 내장
 * - 저트래픽 가드: AI 역할은 통계 판정이 아니라 정성 패턴 가설 생성
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
import { tagReferral } from '@/lib/marketing/referral-tags';
import { checkDataFreshness, freshnessSummary } from '@/lib/marketing/quality';
import { ANALYST_TOOLS, runAnalystTool } from '@/lib/marketing/analyst-tools';
import { sendReportEmail } from '@/lib/marketing/report-email';
import { renderSummaryMd, type ReportStructure } from '@/lib/marketing/report-email-template';

export const maxDuration = 300;

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

/** referral_source가 있는데 referral_tag가 비어있는 행을 규칙 태깅으로 채운다 */
async function backfillReferralTags(): Promise<void> {
  if (!supabaseAdmin) return;
  for (const table of ['invitations', 'partner_inquiries', 'subscribers']) {
    const { data } = await supabaseAdmin
      .from(table)
      .select('id, referral_source')
      .is('referral_tag', null)
      .not('referral_source', 'is', null)
      .limit(500);
    for (const row of (data ?? []) as { id: string; referral_source: string | null }[]) {
      const tag = tagReferral(row.referral_source);
      if (tag) {
        await supabaseAdmin.from(table).update({ referral_tag: tag }).eq('id', row.id);
      }
    }
  }
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

const ANALYST_PROMPT = `당신은 뮤즈드마레(해저숙성 샴페인·전통주 럭셔리 브랜드)의 마케팅 애널리스트 에이전트다.
주간 데이터를 채널 운영 전략 기준으로 판정하되, 이상 신호가 보이면 제공된 조회 툴로 스스로 원인을 파고들어라.

## 전략 기준 (2026-07-08 확정)
- 브랜드 북극성: "바다의 시간을 기록하는 브랜드". 증거가 본체, 광고는 그림자.
- 판매는 B2B 전용, 온라인 채널은 브랜드 홍보만 — 전환 목표는 결제가 아니라 명부 등록(subscribe_submit)·초대 신청·B2B 문의(cta_click).
- 인스타그램: 팔로워 수보다 저장(saved)·공유(shares)가 상위 지표. 주류 계정은 추천 피드 제외라 팔로워 성장 정체는 정상.
- 블로그: 키워드 3계층 — T1(해저숙성 등 니치 소유형), T2(샴페인 보관법 등 정보성, 유입 볼륨의 본체), T3(고유명). T2가 볼륨을, T1이 정확도를 담당하는 게 정상 패턴.
- 뉴스레터: 오픈율은 Apple MPP로 부풀려져 신뢰 불가 — 클릭을 1차 지표로 본다.

## 진단 결정 트리 (이 순서로만 판단하라)
0. **데이터 품질**: 함께 제공된 "데이터 신선도" 결과를 먼저 확인. 신뢰 저하 소스가 있으면 그 소스가 담당하는 채널의 판정은 보류하고, 리포트 맨 앞에 "⚠️ 데이터 신뢰 저하: [소스]" 경고를 넣어라. 지표 하락이 실제 하락인지 수집 실패인지 구분이 최우선이다.
1. **전환 급락 시**: query_conversions로 실물 폼 제출(초대·문의·명부)이 실제로 있었는지 확인. GA4 이벤트만 줄었는데 실물 전환이 있으면 트래킹 문제, 둘 다 없으면 진짜 하락.
2. **유입 급감/급증 시**: query_metrics를 group_by=dimension:channelGroup, dimension:referrer로 소스별 분해. 어느 소스가 움직였는지 특정하고, 검색이면 query_search_terms로 어떤 키워드·계층(T1/T2/T3)인지 내려가라.
3. **인스타 지표 변동 시**: query_content로 게시물별 저장·공유 패턴을 보고 어떤 콘텐츠 속성이 움직였는지 가설을 세워라.
4. **원인 후보 제시**: 반드시 조회로 확인한 근거 수치와 함께. 확인 못 한 가설은 "미확인 가설"로 구분 표기.

## 저트래픽 규율 (필수)
- 우리는 저트래픽 브랜드다. 주간 수십~수백 단위 변동은 대부분 노이즈다. 통계적 판정을 흉내 내지 마라.
- 네 역할은 "판정 기계"가 아니라 "정성 패턴의 가설 생성자"다. 표본이 작으면 반드시 "표본 부족 — 방향성 참고만"을 명시하라.
- 큰 레버만 지적하라: 명백한 고장, 여러 기간 일관된 트렌드, 절대량이 있는 지표. 소수점 전환율 차이는 무시.

## 툴 사용 규칙
- on-track이고 특이 신호가 없으면 툴 없이 바로 리포트를 써도 된다.
- 이상 신호(급락·급증·0건)가 보이면 최소 1회는 드릴다운으로 원인을 확인하라. 최대 6회 이내로 조회를 마쳐라.

## 출력 형식 (마지막 응답은 아래 JSON 객체 하나만, 다른 텍스트 금지)
{
  "verdict": "on-track" | "watch" | "off-track",
  "headline": "판정 이유 한 문장 (데이터 신뢰 저하가 있으면 여기서 언급)",
  "funnel": [
    {"label": "발견", "sub": "검색 클릭 + 인스타 도달", "current": 숫자, "previous": 숫자},
    {"label": "목격", "sub": "랜딩 세션", "current": 숫자, "previous": 숫자},
    {"label": "관계", "sub": "명부 등록", "current": 숫자, "previous": 숫자},
    {"label": "초대·문의", "sub": "초대 신청 + B2B 문의", "current": 숫자, "previous": 숫자}
  ],
  "channels": [
    {"name": "채널명", "status": "good" | "watch" | "bad" | "no-data", "comment": "전략상 역할 수행 여부 한두 문장"}
  ],
  "anomalies": [
    {"title": "이상 신호 제목", "detail": "드릴다운 근거 수치를 포함한 설명"}
  ],
  "actions": [
    {"approval": true|false, "text": "실행 항목"}
  ]
}

작성 규칙:
- funnel의 current/previous는 주간 데이터에서 그대로 계산한 숫자만 (지어내기 금지, 없으면 0)
- channels는 블로그·인스타그램·랜딩·검색 등 데이터가 있는 채널 전부. 데이터 없는 채널은 status "no-data"
- anomalies는 없으면 빈 배열 []. 있으면 반드시 조회로 확인한 근거 수치를 detail에 포함
- actions는 3개 이하. 콘텐츠 발행·외부 발송·아웃리치는 항상 approval true
- 판정이 애매하면 verdict는 watch`;

interface ClaudeContentBlock {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}

interface ClaudeResponse {
  stop_reason: string;
  content: ClaudeContentBlock[];
}

/** 구조화 리포트 형식 검증 — 이메일·대시보드 렌더러가 기대하는 필드가 다 있는지 */
function isValidReport(p: Record<string, unknown>): boolean {
  return (
    typeof p.verdict === 'string' &&
    typeof p.headline === 'string' &&
    Array.isArray(p.funnel) &&
    p.funnel.length > 0 &&
    (p.funnel as Record<string, unknown>[]).every(
      (f) => typeof f.label === 'string' && typeof f.sub === 'string' && !isNaN(Number(f.current)) && !isNaN(Number(f.previous))
    ) &&
    Array.isArray(p.channels) &&
    Array.isArray(p.actions)
  );
}

/** 툴 루프를 돌며 최종 구조화 리포트를 얻는다 */
async function runAnalystAgent(payload: unknown): Promise<{
  report: ReportStructure;
  toolCalls: { name: string; input: Record<string, unknown> }[];
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY 미설정');

  type Message = { role: 'user' | 'assistant'; content: unknown };
  const messages: Message[] = [
    { role: 'user', content: `주간 데이터:\n${JSON.stringify(payload, null, 2)}` },
  ];
  const toolCalls: { name: string; input: Record<string, unknown> }[] = [];
  const MAX_TURNS = 8;

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 8000,
        system: ANALYST_PROMPT,
        tools: ANALYST_TOOLS,
        messages,
      }),
    });
    if (!res.ok) throw new Error(`Claude API 실패 (${res.status}): ${await res.text()}`);
    const data = (await res.json()) as ClaudeResponse;

    if (data.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: data.content });
      const toolResults: unknown[] = [];
      for (const block of data.content) {
        if (block.type !== 'tool_use' || !block.name || !block.id) continue;
        const input = block.input ?? {};
        toolCalls.push({ name: block.name, input });
        const result = await runAnalystTool(block.name, input);
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result });
      }
      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    // 최종 응답에서 JSON 파싱 — 실패하면 즉시 던지지 않고 JSON만 다시 내라고 요구 (남은 턴 내 재시도)
    const text = data.content.find((b) => b.type === 'text')?.text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (isValidReport(parsed)) {
          return {
            report: {
              verdict: parsed.verdict,
              headline: parsed.headline,
              funnel: parsed.funnel,
              channels: parsed.channels,
              anomalies: Array.isArray(parsed.anomalies) ? parsed.anomalies : [],
              actions: parsed.actions,
            },
            toolCalls,
          };
        }
      } catch {
        // JSON 파싱 실패(잘림 등) — 아래 재요구로 진행
      }
    }
    messages.push({ role: 'assistant', content: data.content });
    messages.push({
      role: 'user',
      content:
        '출력 형식 위반. 지금까지의 분석을 바탕으로 시스템 프롬프트의 출력 형식(verdict, headline, funnel, channels, anomalies, actions)을 갖춘 JSON 객체 하나만 출력하라. 다른 텍스트·툴 호출 금지.',
    });
  }
  throw new Error(`툴 루프가 ${MAX_TURNS}회 안에 유효한 JSON을 내지 못함`);
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase admin 미설정' }, { status: 500 });
  }

  try {
    // 0단계: 데이터 품질 게이트 — 소스별 신선도 확인 (모든 분석의 0번)
    const freshness = await checkDataFreshness();
    const quality = freshnessSummary(freshness);

    // 자기보고 어트리뷰션 태깅 (referral_tag 비어있는 행을 규칙으로 채움)
    await backfillReferralTags();

    const metrics = await aggregateWeeks();
    if (metrics.length === 0) {
      return NextResponse.json({
        success: true,
        result: 'skip (수집된 데이터 없음 — 수집기 연동 후 자동 시작)',
      });
    }

    const content = await topContent();
    const weekStart = kstDaysAgo(7);
    const payload = {
      weekStart,
      dataQuality: {
        allFresh: quality.allFresh,
        degradedSources: quality.degradedSources,
        detail: quality.lines,
      },
      metrics,
      topContentBySavesShares: content,
    };

    const { report, toolCalls } = await runAnalystAgent(payload);

    // 대시보드용 마크다운은 구조화 리포트에서 생성 — 이메일과 내용 동기 보장
    const summaryMd = renderSummaryMd(report, quality.degradedSources);

    const { error } = await supabaseAdmin.from('ai_reports').upsert(
      {
        week_start: weekStart,
        generated_at: new Date().toISOString(),
        verdict: report.verdict,
        summary_md: summaryMd,
        metrics_snapshot: { ...payload, structuredReport: report, analystToolCalls: toolCalls },
      },
      { onConflict: 'week_start' }
    );
    if (error) throw new Error(`ai_reports 저장 실패: ${error.message}`);

    // 리포트 메일 발송 (실패해도 크론은 성공 — 대시보드 저장이 본체)
    const emailSent = await sendReportEmail({
      weekStart,
      report,
      degradedSources: quality.degradedSources,
    });

    return NextResponse.json({
      success: true,
      weekStart,
      verdict: report.verdict,
      dataQuality: quality.allFresh ? 'fresh' : `degraded: ${quality.degradedSources.join(', ')}`,
      toolCallCount: toolCalls.length,
      emailSent,
    });
  } catch (e) {
    console.error('[Cron] 주간 리포트 오류:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
