'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { ProfitTotals } from './profit-model';

// ════════════════════════════════════════════════════════════════════════
// 손익 워터폴 — 매출이 순익까지 내려오는 구조를 폭포형으로 분해
// ════════════════════════════════════════════════════════════════════════
// 매출(전체) → 변동원가(감소) → 공헌이익(소계) → 고정비(감소) → 순익(최종).
// 색은 방향 의미로만 사용: 합계·소계 = 중립, 감소 = 로즈, 최종 = 부호별.
// 모든 막대에 단계명·금액을 직접 표기하므로 색맹 환경에서도 읽힌다.
// ════════════════════════════════════════════════════════════════════════

interface Stage {
  label: string;
  from: number;
  to: number;
  kind: 'total' | 'down' | 'final';
}

function formatCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 100000000) return `${sign}${(abs / 100000000).toFixed(1)}억`;
  if (abs >= 10000000) return `${sign}${(abs / 10000000).toFixed(1)}천만`;
  if (abs >= 10000) return `${sign}${(abs / 10000).toFixed(0)}만`;
  return `${sign}${Math.round(abs).toLocaleString()}`;
}

const H = 190; // 플롯 영역 높이(px)

export default function PnLWaterfall({
  totals,
  isTarget,
}: {
  totals: ProfitTotals;
  isTarget: boolean;
}) {
  const { stages, y, zeroY } = useMemo(() => {
    const { revenue, contribution, netProfit } = totals;
    const stages: Stage[] = [
      { label: isTarget ? '예상매출' : '매출', from: 0, to: revenue, kind: 'total' },
      { label: '변동원가', from: revenue, to: contribution, kind: 'down' },
      { label: '공헌이익', from: 0, to: contribution, kind: 'total' },
      { label: '고정비', from: contribution, to: netProfit, kind: 'down' },
      { label: '순익', from: 0, to: netProfit, kind: 'final' },
    ];
    const max = Math.max(revenue, contribution, 1);
    const min = Math.min(0, netProfit, contribution);
    const span = max - min || 1;
    // 상단 18px 헤드룸 — 값 라벨이 막대와 겹치지 않게
    const y = (v: number) => 18 + ((max - v) / span) * (H - 18);
    return { stages, y, zeroY: y(0) };
  }, [totals, isTarget]);

  if (totals.revenue <= 0) return null;

  return (
    <div className="relative rounded-xl sm:rounded-2xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-sm" />
      <div className="absolute inset-0 border border-white/[0.06] rounded-xl sm:rounded-2xl" />
      <div className="relative p-3 sm:p-5">
        <p className="text-[10px] sm:text-xs text-white/40 mb-3">
          손익 구조 · {isTarget ? '목표 기준' : '실적 기준'}
        </p>

        <div className="relative" style={{ height: H }}>
          {/* 0 기준선 */}
          <div
            className="absolute left-0 right-0 border-t border-white/20"
            style={{ top: zeroY }}
          />

          {/* 연결선 — 이전 막대의 끝 높이에서 다음 막대로 */}
          {stages.slice(0, -1).map((s, i) => (
            <div
              key={`conn-${i}`}
              className="absolute border-t border-dashed border-white/15"
              style={{
                top: y(s.to),
                left: `${i * 20 + 10}%`,
                width: '20%',
              }}
            />
          ))}

          {/* 막대 5개 */}
          {stages.map((s, i) => {
            const top = y(Math.max(s.from, s.to));
            const height = Math.max(Math.abs(y(s.from) - y(s.to)), 2);
            const value = s.kind === 'down' ? s.from - s.to : s.to;
            const color =
              s.kind === 'down'
                ? 'bg-rose-500/55'
                : s.kind === 'final'
                ? s.to >= 0
                  ? 'bg-emerald-500/60'
                  : 'bg-rose-500/70'
                : 'bg-white/20 border border-white/25';
            const valueColor =
              s.kind === 'down'
                ? 'text-rose-300'
                : s.kind === 'final'
                ? s.to >= 0
                  ? 'text-emerald-400'
                  : 'text-rose-400'
                : 'text-white/70';
            return (
              <div
                key={s.label}
                className="absolute group"
                style={{ left: `${i * 20}%`, width: '20%', top: 0, bottom: 0 }}
                title={`${s.label} ${formatCompact(s.kind === 'down' ? -value : value)}원`}
              >
                {/* 값 라벨 (막대 위) */}
                <span
                  className={`absolute left-1/2 -translate-x-1/2 text-[9px] sm:text-[11px] tabular-nums whitespace-nowrap ${valueColor}`}
                  style={{ top: Math.max(top - 16, 0) }}
                >
                  {s.kind === 'down' ? `−${formatCompact(value)}` : formatCompact(value)}
                </span>
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  className={`absolute left-[14%] right-[14%] rounded-[3px] origin-bottom group-hover:brightness-125 transition-[filter] ${color}`}
                  style={{ top, height }}
                />
              </div>
            );
          })}
        </div>

        {/* 단계 라벨 */}
        <div className="flex mt-1.5">
          {stages.map((s) => (
            <span
              key={s.label}
              className="flex-1 text-center text-[9px] sm:text-[11px] text-white/45 truncate"
            >
              {s.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
