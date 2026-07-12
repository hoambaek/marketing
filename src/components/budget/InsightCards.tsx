'use client';

import { motion } from 'framer-motion';
import { Lightbulb, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import type { TierCalcRow } from './profit-model';

// ════════════════════════════════════════════════════════════════════════
// 전략 인사이트 카드 — 규칙 기반 처방 층 (So what을 페이지 최상단에)
// ════════════════════════════════════════════════════════════════════════
// 1차 탑재 규칙 3종 (2026-07-12 대표 확정):
//   ① 손익분기 근접  ② 믹스 개선 기회  ③ 가격 괴리
// AI 판정이 아니라 손익 모델 계산값만으로 판정하는 결정론적 규칙이다.
// 카드가 0장이면 "특이 신호 없음"을 명시한다 (빈 상태를 침묵으로 두지 않는다).
// ════════════════════════════════════════════════════════════════════════

type InsightTone = 'opportunity' | 'warning' | 'info';

interface Insight {
  key: string;
  tone: InsightTone;
  fact: string;
  action: string;
  jumpTo?: string; // 관련 섹션 DOM id
  jumpLabel?: string;
}

function formatKRW(n: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(n));
}

export function computeInsights(rows: TierCalcRow[]): Insight[] {
  const insights: Insight[] = [];
  const active = rows.filter((r) => r.targetQty > 0 || r.sold > 0);
  const totalSold = active.reduce((s, r) => s + r.sold, 0);

  // ① 손익분기 근접 — 잔여 병수 ≤ 목표수량의 20%
  active.forEach((r) => {
    if (!Number.isFinite(r.breakEvenBottles) || r.targetQty <= 0) return;
    if (r.sold >= r.breakEvenBottles) return; // 이미 돌파
    const remaining = Math.ceil(r.breakEvenBottles - r.sold);
    if (remaining <= Math.max(1, Math.ceil(r.targetQty * 0.2))) {
      insights.push({
        key: `bep-${r.id}`,
        tone: 'opportunity',
        fact: `${r.nameKo}: ${formatKRW(remaining)}병만 더 팔면 손익분기`,
        action: '이 제품 제안을 영업 우선순위에 배치',
        jumpTo: 'breakeven-gauge',
        jumpLabel: '손익분기 진행',
      });
    }
  });

  // ② 믹스 개선 — 최고 공헌이익 제품의 판매 비중 < 목표매출 비중
  if (totalSold > 0) {
    const positive = active.filter((r) => r.contributionPerBottle > 0);
    if (positive.length >= 2) {
      const top = positive.reduce((a, b) =>
        a.contributionPerBottle >= b.contributionPerBottle ? a : b
      );
      const totalTargetRevenue = active.reduce((s, r) => s + r.targetRevenue, 0);
      const soldShare = top.sold / totalSold;
      const targetShare = totalTargetRevenue > 0 ? top.targetRevenue / totalTargetRevenue : 0;
      if (soldShare < targetShare) {
        const reference = positive
          .filter((r) => r.id !== top.id)
          .reduce((a, b) => (a.contributionPerBottle <= b.contributionPerBottle ? a : b));
        const k = top.contributionPerBottle / reference.contributionPerBottle;
        insights.push({
          key: 'mix',
          tone: 'opportunity',
          fact: `${top.nameKo} 1병 = ${reference.nameKo} ${k.toFixed(1)}병의 공헌이익 (판매 비중 ${(soldShare * 100).toFixed(0)}% < 목표 비중 ${(targetShare * 100).toFixed(0)}%)`,
          action: `제안 우선순위를 ${top.nameKo} 쪽으로 조정해 믹스를 개선`,
          jumpTo: 'portfolio-matrix',
          jumpLabel: '포트폴리오 매트릭스',
        });
      }
    }
  }

  // ③ 가격 괴리 — 현재 공급가 < 권장가 × 0.95
  const priceGaps = active
    .filter((r) => r.recommendedPrice > 0 && r.b2bPrice < r.recommendedPrice * 0.95)
    .map((r) => ({
      row: r,
      gapPct: ((r.recommendedPrice - r.b2bPrice) / r.recommendedPrice) * 100,
    }))
    .sort((a, b) => b.gapPct - a.gapPct);

  if (priceGaps.length === 1) {
    const { row, gapPct } = priceGaps[0];
    insights.push({
      key: `price-${row.id}`,
      tone: 'warning',
      fact: `${row.nameKo}: 권장가 대비 ${gapPct.toFixed(0)}% 낮게 공급 중`,
      action: `가격 인상 여지 검토 (권장 ${formatKRW(row.recommendedPrice)}원)`,
      jumpTo: 'price-reco',
      jumpLabel: '권장 공급가',
    });
  } else if (priceGaps.length >= 2) {
    const names = priceGaps.slice(0, 3).map((g) => g.row.nameKo);
    insights.push({
      key: 'price-multi',
      tone: 'warning',
      fact: `${priceGaps.length}개 제품이 권장가 대비 5% 이상 낮게 공급 중 (최대 괴리: ${names[0]} ${priceGaps[0].gapPct.toFixed(0)}%)`,
      action: '제품별 권장 공급가에서 가격 인상 여지 검토',
      jumpTo: 'price-reco',
      jumpLabel: '권장 공급가',
    });
  }

  return insights.slice(0, 4);
}

const TONE_STYLE: Record<
  InsightTone,
  { border: string; bg: string; icon: typeof Lightbulb; iconColor: string }
> = {
  opportunity: {
    border: 'border-[#b7916e]/30',
    bg: 'from-[#b7916e]/[0.10] to-transparent',
    icon: Lightbulb,
    iconColor: 'text-[#d4c4a8]',
  },
  warning: {
    border: 'border-rose-500/25',
    bg: 'from-rose-500/[0.08] to-transparent',
    icon: AlertTriangle,
    iconColor: 'text-rose-400',
  },
  info: {
    border: 'border-white/[0.08]',
    bg: 'from-white/[0.04] to-transparent',
    icon: CheckCircle2,
    iconColor: 'text-white/50',
  },
};

export default function InsightCards({ rows }: { rows: TierCalcRow[] }) {
  const insights = computeInsights(rows);
  const cards: Insight[] =
    insights.length > 0
      ? insights
      : [
          {
            key: 'none',
            tone: 'info',
            fact: '현재 특이 신호 없음',
            action: '규칙 3종(손익분기 근접 · 믹스 개선 · 가격 괴리) 모두 통과',
          },
        ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
      {cards.map((c, i) => {
        const style = TONE_STYLE[c.tone];
        const Icon = style.icon;
        return (
          <motion.div
            key={c.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="relative rounded-xl sm:rounded-2xl overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${style.bg} backdrop-blur-sm`} />
            <div className={`absolute inset-0 border ${style.border} rounded-xl sm:rounded-2xl`} />
            <div className="relative p-3 sm:p-4">
              <div className="flex items-start gap-2.5">
                <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${style.iconColor}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-white/90 leading-relaxed">{c.fact}</p>
                  <p className="text-[10px] sm:text-xs text-white/45 mt-1">{c.action}</p>
                </div>
              </div>
              {c.jumpTo && (
                <button
                  onClick={() =>
                    document.getElementById(c.jumpTo!)?.scrollIntoView({ behavior: 'smooth' })
                  }
                  className="mt-2 ml-6 inline-flex items-center gap-0.5 text-[10px] sm:text-xs text-white/40 hover:text-[#d4c4a8] transition-colors"
                >
                  {c.jumpLabel} <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
