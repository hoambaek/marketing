'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useBudgetStore } from '@/lib/store/budget-store';

// ════════════════════════════════════════════════════════════════════════
// 월별 수입·지출 추이 — budget 실집행 기록의 시간축 그룹 막대
// ════════════════════════════════════════════════════════════════════════
// 수입 #b0762a(딥 브론즈) · 지출 #0891b2(딥 시안).
// 다크 서피스(#0a0f1a) 기준 색각이상 분리 ΔE 71 · 대비 3:1 이상 검증 통과
// (dataviz validate_palette, 2026-07-12). 범례 + 호버 툴팁으로 이중 인코딩.
// ════════════════════════════════════════════════════════════════════════

const INCOME_COLOR = '#b0762a';
const EXPENSE_COLOR = '#0891b2';
const H = 170; // 플롯 높이(px)

function formatCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 100000000) return `${sign}${(abs / 100000000).toFixed(1)}억`;
  if (abs >= 10000000) return `${sign}${(abs / 10000000).toFixed(1)}천만`;
  if (abs >= 10000) return `${sign}${(abs / 10000).toFixed(0)}만`;
  return `${sign}${abs.toLocaleString()}`;
}

export default function MonthlyCashflow({ year }: { year: number }) {
  const { incomeItems, expenseItems } = useBudgetStore(
    useShallow((s) => ({ incomeItems: s.incomeItems, expenseItems: s.expenseItems }))
  );

  const { months, maxVal, hasData } = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const income = incomeItems
        .filter((it) => it.year === year && it.month === m)
        .reduce((s, it) => s + it.amount, 0);
      const expense = expenseItems
        .filter((it) => it.year === year && it.month === m)
        .reduce((s, it) => s + it.amount, 0);
      return { m, income, expense };
    });
    const maxVal = Math.max(...months.map((x) => Math.max(x.income, x.expense)), 1);
    const hasData = months.some((x) => x.income > 0 || x.expense > 0);
    return { months, maxVal, hasData };
  }, [incomeItems, expenseItems, year]);

  if (!hasData) return null;

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-white/50" />
          <h3 className="text-sm sm:text-base font-medium text-white/80">월별 수입 · 지출</h3>
        </div>
        {/* 범례 */}
        <div className="flex items-center gap-3 text-[10px] sm:text-xs text-white/50">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: INCOME_COLOR }} />
            수입
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: EXPENSE_COLOR }} />
            지출
          </span>
        </div>
      </div>

      <div className="relative rounded-xl sm:rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-sm" />
        <div className="absolute inset-0 border border-white/[0.06] rounded-xl sm:rounded-2xl" />
        <div className="relative p-3 sm:p-5">
          <div className="relative" style={{ height: H }}>
            {/* 기준선 */}
            <div className="absolute left-0 right-0 bottom-0 border-t border-white/15" />
            {months.map(({ m, income, expense }) => {
              const hIncome = (income / maxVal) * (H - 20);
              const hExpense = (expense / maxVal) * (H - 20);
              return (
                <div
                  key={m}
                  className="absolute bottom-0 top-0 group"
                  style={{ left: `${((m - 1) / 12) * 100}%`, width: `${100 / 12}%` }}
                  title={`${m}월 수입 ${formatCompact(income)}원 · 지출 ${formatCompact(expense)}원`}
                >
                  {/* 그룹 막대: 수입(좌) 지출(우), 2px 간격 */}
                  <div className="absolute bottom-0 left-[14%] right-[14%] flex items-end justify-center gap-[2px] h-full">
                    <motion.div
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.5 }}
                      className="w-1/2 rounded-t-[3px] origin-bottom group-hover:brightness-125 transition-[filter]"
                      style={{ height: Math.max(hIncome, income > 0 ? 2 : 0), background: INCOME_COLOR }}
                    />
                    <motion.div
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.5, delay: 0.05 }}
                      className="w-1/2 rounded-t-[3px] origin-bottom group-hover:brightness-125 transition-[filter]"
                      style={{ height: Math.max(hExpense, expense > 0 ? 2 : 0), background: EXPENSE_COLOR }}
                    />
                  </div>
                  {/* 호버 툴팁 */}
                  <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-0 hidden group-hover:block z-10">
                    <div className="px-2 py-1.5 rounded-lg bg-[#0a0f1a]/95 border border-white/15 whitespace-nowrap text-[10px] leading-relaxed">
                      <p className="text-white/60">{m}월</p>
                      <p style={{ color: '#d4a662' }}>수입 {formatCompact(income)}원</p>
                      <p style={{ color: '#38bdf8' }}>지출 {formatCompact(expense)}원</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* 월 라벨 */}
          <div className="flex mt-1.5">
            {months.map(({ m, income, expense }) => (
              <span
                key={m}
                className={`flex-1 text-center text-[8px] sm:text-[10px] ${
                  income > 0 || expense > 0 ? 'text-white/50' : 'text-white/20'
                }`}
              >
                {m}월
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
