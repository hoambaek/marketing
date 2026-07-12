'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Info } from 'lucide-react';
import { computeNetProfit, type TierCalcInput } from './profit-model';

// ════════════════════════════════════════════════════════════════════════
// 수익 레버 랭킹 — 결정론적 민감도 분석 (토네이도 차트)
// ════════════════════════════════════════════════════════════════════════
// 각 변수(제품별 공급가 · 전체 판매수량 · 병당 변동원가 · 고정비)를
// 단독으로 ±10% 움직였을 때 연 순익(목표 모드)이 얼마나 변하는지 계산해
// 변화폭이 큰 레버부터 나열한다. 막대가 긴 변수가 전략 우선순위다.
// 몬테카를로·탄력성 회귀는 표본 부족으로 의도적으로 배제 (2026-07-12 기획).
// ════════════════════════════════════════════════════════════════════════

interface Lever {
  key: string;
  label: string;
  caveat?: string;
  perturb: (inputs: TierCalcInput[], fixedCost: number, factor: number) => {
    inputs: TierCalcInput[];
    fixedCost: number;
  };
}

function formatCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '+';
  if (abs >= 100000000) return `${sign}${(abs / 100000000).toFixed(1)}억`;
  if (abs >= 10000000) return `${sign}${(abs / 10000000).toFixed(1)}천만`;
  if (abs >= 10000) return `${sign}${(abs / 10000).toFixed(0)}만`;
  return `${sign}${Math.round(abs).toLocaleString()}`;
}

export default function LeverRanking({
  calcInputs,
  fixedCost,
  targetMarginPct,
}: {
  calcInputs: TierCalcInput[];
  fixedCost: number;
  targetMarginPct: number;
}) {
  const { levers, maxAbs } = useMemo(() => {
    const active = calcInputs.filter((r) => r.targetQty > 0);

    const defs: Lever[] = [
      ...active.map((tier) => ({
        key: `price-${tier.id}`,
        label: `${tier.nameKo} 공급가`,
        caveat: '판매량 불변 가정',
        perturb: (inputs: TierCalcInput[], fc: number, factor: number) => ({
          inputs: inputs.map((r) =>
            r.id === tier.id ? { ...r, b2bPrice: r.b2bPrice * factor } : r
          ),
          fixedCost: fc,
        }),
      })),
      {
        key: 'quantity',
        label: '전체 판매수량',
        perturb: (inputs, fc, factor) => ({
          inputs: inputs.map((r) => ({ ...r, targetQty: r.targetQty * factor })),
          fixedCost: fc,
        }),
      },
      {
        key: 'varcost',
        label: '병당 변동원가',
        perturb: (inputs, fc, factor) => ({
          inputs: inputs.map((r) => ({ ...r, varCost: r.varCost * factor })),
          fixedCost: fc,
        }),
      },
      {
        key: 'fixed',
        label: '고정비 (실집행 지출)',
        perturb: (inputs, fc, factor) => ({ inputs, fixedCost: fc * factor }),
      },
    ];

    const base = computeNetProfit(calcInputs, fixedCost, targetMarginPct, 'target');

    const computed = defs.map((lever) => {
      const up = lever.perturb(calcInputs, fixedCost, 1.1);
      const down = lever.perturb(calcInputs, fixedCost, 0.9);
      const deltaUp =
        computeNetProfit(up.inputs, up.fixedCost, targetMarginPct, 'target') - base;
      const deltaDown =
        computeNetProfit(down.inputs, down.fixedCost, targetMarginPct, 'target') - base;
      return { ...lever, deltaUp, deltaDown, swing: Math.max(Math.abs(deltaUp), Math.abs(deltaDown)) };
    });

    computed.sort((a, b) => b.swing - a.swing);
    const maxSwing = computed.length > 0 ? Math.max(...computed.map((l) => l.swing)) : 0;
    return { levers: computed, maxAbs: maxSwing };
  }, [calcInputs, fixedCost, targetMarginPct]);

  if (levers.length === 0 || maxAbs === 0) return null;

  const scrollToSimulator = () =>
    document.getElementById('profit-simulator')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <SlidersHorizontal className="w-4 h-4 text-white/50" />
        <h3 className="text-sm sm:text-base font-medium text-white/80">수익 레버 랭킹</h3>
        <span className="text-[10px] sm:text-xs text-white/35">
          변수 ±10% 시 연 순익 변화 (목표 모드 기준)
        </span>
      </div>

      <div className="relative rounded-xl sm:rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-sm" />
        <div className="absolute inset-0 border border-white/[0.06] rounded-xl sm:rounded-2xl" />
        <div className="relative p-3 sm:p-5 space-y-2.5 sm:space-y-3">
          {levers.map((lever, i) => {
            // 좌(감소) / 우(증가) 발산 막대 — 델타 부호로 방향 결정
            const negDelta = Math.min(lever.deltaUp, lever.deltaDown, 0);
            const posDelta = Math.max(lever.deltaUp, lever.deltaDown, 0);
            const negW = maxAbs > 0 ? (Math.abs(negDelta) / maxAbs) * 100 : 0;
            const posW = maxAbs > 0 ? (posDelta / maxAbs) * 100 : 0;
            // +10% 방향의 델타를 대표 수치로 표기
            const upLabel = formatCompact(lever.deltaUp);
            return (
              <button
                key={lever.key}
                onClick={scrollToSimulator}
                className="block w-full text-left group"
              >
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-[11px] sm:text-xs text-white/70 group-hover:text-white/90 transition-colors truncate">
                    {i + 1}. {lever.label}
                    {lever.caveat && (
                      <span className="text-white/30"> · {lever.caveat}</span>
                    )}
                  </span>
                  <span
                    className={`text-[10px] sm:text-xs tabular-nums shrink-0 ${
                      lever.deltaUp >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    +10% → 순익 {upLabel}원
                  </span>
                </div>
                <div className="relative h-3.5 sm:h-4 flex items-center">
                  {/* 중심축 */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/15" />
                  {/* 감소 방향 (좌) */}
                  <div className="absolute right-1/2 h-2.5 sm:h-3 flex justify-end" style={{ width: '50%' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${negW}%` }}
                      transition={{ duration: 0.7, delay: i * 0.05 }}
                      className="h-full rounded-l-full bg-rose-500/60"
                      style={{ minWidth: negW > 0 ? 2 : 0 }}
                    />
                  </div>
                  {/* 증가 방향 (우) */}
                  <div className="absolute left-1/2 h-2.5 sm:h-3" style={{ width: '50%' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${posW}%` }}
                      transition={{ duration: 0.7, delay: i * 0.05 }}
                      className="h-full rounded-r-full bg-emerald-500/60"
                      style={{ minWidth: posW > 0 ? 2 : 0 }}
                    />
                  </div>
                </div>
              </button>
            );
          })}

          <div className="flex items-start gap-2 pt-1 text-[10px] sm:text-[11px] text-white/35 leading-relaxed">
            <Info className="w-3 h-3 shrink-0 mt-0.5" />
            <span>
              막대가 길수록 순익을 크게 움직이는 레버. 가격 레버는 판매량이 유지된다는
              가정이므로, 가격과 수량을 함께 움직이는 검증은 아래 시뮬레이터에서.
              막대를 누르면 시뮬레이터로 이동.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
