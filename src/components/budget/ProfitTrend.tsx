'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Info } from 'lucide-react';
import { logger } from '@/lib/logger';

// ════════════════════════════════════════════════════════════════════════
// 월별 순익 추이 — profit_snapshots 적재분을 시간축으로
// ════════════════════════════════════════════════════════════════════════
// 대시보드가 열릴 때마다 이번 달 실적이 기록되므로, 이 차트는 달이 지날수록
// 자동으로 길어진다. 순익 부호로 막대 방향이 갈리는 발산형(0 기준선).
// 기록 2개 분기 이상 쌓이면 Phase 3 손익 브리지(가격·수량·믹스 분해)로 확장.
// ════════════════════════════════════════════════════════════════════════

interface SnapshotPoint {
  month: number;
  netProfit: number;
  revenue: number;
  fixedCost: number;
}

function formatCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 100000000) return `${sign}${(abs / 100000000).toFixed(1)}억`;
  if (abs >= 10000000) return `${sign}${(abs / 10000000).toFixed(1)}천만`;
  if (abs >= 10000) return `${sign}${(abs / 10000).toFixed(0)}만`;
  return `${sign}${Math.round(abs).toLocaleString()}`;
}

const H = 150; // 플롯 높이(px)

export default function ProfitTrend({ year }: { year: number }) {
  const [points, setPoints] = useState<SnapshotPoint[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/budget/profit-snapshot?year=${year}`)
      .then((res) => (res.ok ? res.json() : { snapshots: [] }))
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data.snapshots) ? data.snapshots : [];
        setPoints(
          list.map((s: { month: number; netProfit: number; revenue: number; fixedCost: number }) => ({
            month: s.month,
            netProfit: s.netProfit,
            revenue: s.revenue,
            fixedCost: s.fixedCost,
          }))
        );
      })
      .catch((error) => {
        logger.error('순익 추이 조회 실패', error);
        if (!cancelled) setPoints([]);
      });
    return () => {
      cancelled = true;
    };
  }, [year]);

  const byMonth = useMemo(() => {
    const map = new Map<number, SnapshotPoint>();
    (points || []).forEach((p) => map.set(p.month, p));
    return map;
  }, [points]);

  const maxAbs = useMemo(() => {
    const vals = (points || []).map((p) => Math.abs(p.netProfit));
    return Math.max(...vals, 1);
  }, [points]);

  if (points === null) return null; // 로딩 중에는 자리 차지 안 함
  const zeroY = H / 2;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <LineChart className="w-4 h-4 text-white/50" />
        <h3 className="text-sm sm:text-base font-medium text-white/80">월별 순익 추이</h3>
        <span className="text-[10px] sm:text-xs text-white/35">실적 기준 · 월말 스냅샷</span>
      </div>

      <div className="relative rounded-xl sm:rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-sm" />
        <div className="absolute inset-0 border border-white/[0.06] rounded-xl sm:rounded-2xl" />
        <div className="relative p-3 sm:p-5">
          <div className="relative" style={{ height: H }}>
            {/* 0 기준선 */}
            <div
              className="absolute left-0 right-0 border-t border-white/20"
              style={{ top: zeroY }}
            />
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
              const p = byMonth.get(m);
              const h = p ? (Math.abs(p.netProfit) / maxAbs) * (H / 2 - 14) : 0;
              const positive = (p?.netProfit ?? 0) >= 0;
              return (
                <div
                  key={m}
                  className="absolute group"
                  style={{ left: `${((m - 1) / 12) * 100}%`, width: `${100 / 12}%`, top: 0, bottom: 0 }}
                  title={
                    p
                      ? `${m}월 순익 ${formatCompact(p.netProfit)}원 · 매출 ${formatCompact(p.revenue)}원 · 고정비 ${formatCompact(p.fixedCost)}원`
                      : `${m}월 기록 없음`
                  }
                >
                  {p && (
                    <motion.div
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.5 }}
                      className={`absolute left-[22%] right-[22%] group-hover:brightness-125 transition-[filter] ${
                        positive
                          ? 'rounded-t-[3px] bg-emerald-500/60 origin-bottom'
                          : 'rounded-b-[3px] bg-rose-500/60 origin-top'
                      }`}
                      style={
                        positive
                          ? { bottom: H - zeroY, height: Math.max(h, 2) }
                          : { top: zeroY, height: Math.max(h, 2) }
                      }
                    />
                  )}
                  {/* 값 라벨 (기록 있는 달만) */}
                  {p && (
                    <span
                      className={`absolute left-1/2 -translate-x-1/2 text-[8px] sm:text-[10px] tabular-nums whitespace-nowrap ${
                        positive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                      style={
                        positive
                          ? { bottom: H - zeroY + Math.max(h, 2) + 2 }
                          : { top: zeroY + Math.max(h, 2) + 2 }
                      }
                    >
                      {formatCompact(p.netProfit)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {/* 월 라벨 */}
          <div className="flex mt-1.5">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <span
                key={m}
                className={`flex-1 text-center text-[8px] sm:text-[10px] ${
                  byMonth.has(m) ? 'text-white/50' : 'text-white/20'
                }`}
              >
                {m}월
              </span>
            ))}
          </div>

          {points.length < 3 && (
            <div className="flex items-start gap-2 mt-3 text-[10px] sm:text-[11px] text-white/35 leading-relaxed">
              <Info className="w-3 h-3 shrink-0 mt-0.5" />
              <span>
                스냅샷 축적 중 ({points.length}개월 기록됨). 대시보드를 열 때마다 이번 달
                실적이 자동 기록되고, 달이 지날수록 추이가 채워집니다.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
