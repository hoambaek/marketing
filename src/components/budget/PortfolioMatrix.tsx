'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Grid2x2, Info } from 'lucide-react';
import type { TierCalcRow } from './profit-model';

// ════════════════════════════════════════════════════════════════════════
// 제품 포트폴리오 매트릭스 — 메뉴 엔지니어링 4분면 응용
// ════════════════════════════════════════════════════════════════════════
// 가로축 = 판매량(인기), 세로축 = 병당 공헌이익. 분면마다 액션이 정해져 있어
// 분석이 곧 처방이 된다 (Kasavana-Smith 매트릭스의 5개 제품 적용).
//   스타(↑↑) 자원 집중 · 퍼즐(인기↓마진↑) 노출 변경
//   플로우호스(인기↑마진↓) 가격/원가 검토 · 도그(↓↓) 축소 검토
// 인기 임계 = 균등 배분 × 70% 규칙, 마진 임계 = 판매가중 평균 공헌이익.
// 초기 표본이 작아 몇 병 차이로 분면이 바뀐다 — 표본 주석을 강제 표기한다.
// ════════════════════════════════════════════════════════════════════════

type Quadrant = 'star' | 'puzzle' | 'plowhorse' | 'dog';

const QUADRANT_META: Record<Quadrant, { label: string; action: string; color: string }> = {
  star: { label: '스타', action: '마케팅·영업 자원 집중', color: 'text-emerald-400' },
  puzzle: { label: '퍼즐', action: '노출·제안 방식 변경 (마진은 좋은데 덜 팔림)', color: 'text-[#d4c4a8]' },
  plowhorse: { label: '플로우호스', action: '가격 인상 또는 원가 절감 검토', color: 'text-cyan-400' },
  dog: { label: '도그', action: '라인업 축소 또는 번들 소진 검토', color: 'text-white/50' },
};

function formatKRW(n: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(n));
}

export default function PortfolioMatrix({ rows }: { rows: TierCalcRow[] }) {
  const data = useMemo(() => {
    const active = rows.filter((r) => r.targetQty > 0 || r.sold > 0);
    const totalSold = active.reduce((s, r) => s + r.sold, 0);
    if (active.length === 0 || totalSold === 0) return null;

    // 인기 임계: 균등 배분(1/n) × 70% 규칙 (메뉴 엔지니어링 관례)
    const popThreshold = (totalSold / active.length) * 0.7;
    // 마진 임계: 판매가중 평균 공헌이익
    const totalContribution = active.reduce((s, r) => s + r.actualContribution, 0);
    const cmThreshold = totalContribution / totalSold;

    const totalRevenue = active.reduce((s, r) => s + r.actualRevenue, 0);

    const maxSold = Math.max(...active.map((r) => r.sold));
    const cms = active.map((r) => r.contributionPerBottle);
    const minCM = Math.min(...cms, cmThreshold);
    const maxCM = Math.max(...cms, cmThreshold);
    const cmSpan = maxCM - minCM || 1;

    const items = active.map((r, i) => {
      const highPop = r.sold >= popThreshold;
      const highCM = r.contributionPerBottle >= cmThreshold;
      const quadrant: Quadrant = highPop
        ? highCM
          ? 'star'
          : 'plowhorse'
        : highCM
        ? 'puzzle'
        : 'dog';
      // 8%~92% 영역에 매핑 (버블이 가장자리에 붙지 않게)
      const x = 8 + (maxSold > 0 ? r.sold / maxSold : 0) * 84;
      const y = 8 + (1 - (r.contributionPerBottle - minCM) / cmSpan) * 84;
      const revenueShare = totalRevenue > 0 ? r.actualRevenue / totalRevenue : 0;
      return { row: r, index: i + 1, quadrant, x, y, revenueShare };
    });

    const thresholdX = 8 + (maxSold > 0 ? popThreshold / maxSold : 0.5) * 84;
    const thresholdY = 8 + (1 - (cmThreshold - minCM) / cmSpan) * 84;

    return { items, totalSold, thresholdX, thresholdY };
  }, [rows]);

  return (
    <div id="portfolio-matrix">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Grid2x2 className="w-4 h-4 text-white/50" />
        <h3 className="text-sm sm:text-base font-medium text-white/80">제품 포트폴리오 매트릭스</h3>
        <span className="text-[10px] sm:text-xs text-white/35">판매량 × 병당 공헌이익</span>
      </div>

      <div className="relative rounded-xl sm:rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-sm" />
        <div className="absolute inset-0 border border-white/[0.06] rounded-xl sm:rounded-2xl" />
        <div className="relative p-3 sm:p-5">
          {!data ? (
            <div className="text-center py-10 text-white/30 text-sm">
              판매 기록이 없어 매트릭스를 그릴 수 없습니다. inventory에 판매를 기록하면 자동
              반영됩니다.
            </div>
          ) : (
            <>
              {/* 산점도 영역 */}
              <div className="relative w-full h-64 sm:h-80 rounded-lg bg-white/[0.02] border border-white/[0.04] overflow-hidden">
                {/* 분면 경계선 */}
                <div
                  className="absolute top-0 bottom-0 border-l border-dashed border-white/15"
                  style={{ left: `${data.thresholdX}%` }}
                />
                <div
                  className="absolute left-0 right-0 border-t border-dashed border-white/15"
                  style={{ top: `${data.thresholdY}%` }}
                />
                {/* 분면 라벨 (모서리) */}
                <span className="absolute top-2 left-2 text-[9px] sm:text-[10px] text-white/25">
                  퍼즐 · 마진↑ 인기↓
                </span>
                <span className="absolute top-2 right-2 text-[9px] sm:text-[10px] text-emerald-400/40">
                  스타 · 마진↑ 인기↑
                </span>
                <span className="absolute bottom-2 left-2 text-[9px] sm:text-[10px] text-white/25">
                  도그 · 마진↓ 인기↓
                </span>
                <span className="absolute bottom-2 right-2 text-[9px] sm:text-[10px] text-cyan-400/40">
                  플로우호스 · 마진↓ 인기↑
                </span>

                {/* 제품 버블 (크기 = 매출 기여) */}
                {data.items.map((item) => {
                  const size = 26 + item.revenueShare * 38;
                  return (
                    <motion.div
                      key={item.row.id}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#b7916e]/25 border border-[#b7916e]/50 flex items-center justify-center"
                      style={{
                        left: `${item.x}%`,
                        top: `${item.y}%`,
                        width: size,
                        height: size,
                      }}
                      title={`${item.row.nameKo} · 판매 ${item.row.sold}병 · 병당 공헌이익 ${formatKRW(item.row.contributionPerBottle)}원`}
                    >
                      <span className="text-[10px] sm:text-xs text-[#d4c4a8]">{item.index}</span>
                    </motion.div>
                  );
                })}
              </div>
              {/* 축 라벨 */}
              <div className="flex justify-between text-[9px] sm:text-[10px] text-white/30 mt-1.5">
                <span>↑ 병당 공헌이익</span>
                <span>판매량 →</span>
              </div>

              {/* 범례 + 분면별 액션 */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                {data.items.map((item) => {
                  const meta = QUADRANT_META[item.quadrant];
                  return (
                    <div
                      key={item.row.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]"
                    >
                      <span className="w-5 h-5 shrink-0 rounded-full bg-[#b7916e]/20 border border-[#b7916e]/40 flex items-center justify-center text-[9px] text-[#d4c4a8]">
                        {item.index}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] sm:text-xs text-white/80 truncate">
                          {item.row.nameKo}{' '}
                          <span className={`${meta.color}`}>· {meta.label}</span>
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-white/40 truncate">
                          {meta.action}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 소표본 주석 (강제 표기) */}
              <div className="flex items-start gap-2 mt-3 text-[10px] sm:text-[11px] text-white/35 leading-relaxed">
                <Info className="w-3 h-3 shrink-0 mt-0.5" />
                <span>
                  표본 {formatKRW(data.totalSold)}병 기준. 초기 판매 단계라 몇 병 차이로 분면이
                  바뀔 수 있습니다. 분면 판정은 참고용, 액션 결정은 판매가 쌓인 뒤에.
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
