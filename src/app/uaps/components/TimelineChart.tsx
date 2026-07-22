'use client';

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceLine,
} from 'recharts';

// UAPS 숙성 타임라인 & 골든 윈도우 차트 (샴페인·전 카테고리 공유).
// 고정 팔레트(금색 종합품질·시안 계획선·초록 효율점)라 카테고리 테마색은 쓰지 않는다.
// plannedMonths를 넘기면 계획 기간 수직선 + 계획 내 피크 마커가 추가된다.
export function TimelineChart({
  data,
  harvestWindow,
  plannedMonths,
}: {
  data: { month: number; textureMaturity: number; aromaFreshness: number; offFlavorRisk: number; bubbleRefinement: number; compositeQuality?: number; gainScore?: number; lossScore?: number; netBenefit?: number }[];
  harvestWindow: { startMonths: number; endMonths: number; peakMonth: number; peakScore: number; recommendation: string } | null;
  plannedMonths?: number | null;
}) {
  const peakPoint = harvestWindow
    ? data.find((d) => d.month === harvestWindow.peakMonth)
    : null;

  // 계획 기간 내 피크 (이론적 피크와 다를 수 있음)
  const plannedPeakPoint = plannedMonths
    ? (() => {
        const planned = data.filter(d => d.month <= plannedMonths);
        if (planned.length === 0) return null;
        return planned.reduce((best, d) =>
          (d.compositeQuality ?? 0) > (best.compositeQuality ?? 0) ? d : best
        );
      })()
    : null;

  // 효율 최적점: 피크 점수에서 4점 이내에 처음 도달하는 시점
  const efficientPoint = harvestWindow
    ? (() => {
        const threshold = harvestWindow.peakScore - 4;
        return data.find(d => (d.compositeQuality ?? 0) >= threshold) ?? null;
      })()
    : null;

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey: string }[]; label?: number }) => {
    if (!active || !payload?.length) return null;
    const get = (key: string) => payload.find((p) => p.dataKey === key)?.value;
    const quality = get('compositeQuality');
    const texture = get('textureMaturity');
    const bubble = get('bubbleRefinement');
    const aroma = get('aromaFreshness');
    const offFlavor = get('offFlavorRisk');
    const isPeak = harvestWindow && label === harvestWindow.peakMonth;
    return (
      <div className={`px-3 py-2.5 rounded-xl border backdrop-blur-md ${isPeak ? 'bg-[#C4A052]/10 border-[#C4A052]/30' : 'bg-[#0d1421]/90 border-white/[0.08]'}`}>
        <div className="flex items-center justify-between gap-4 mb-1.5">
          <span className={`text-[11px] font-medium ${isPeak ? 'text-[#C4A052]' : 'text-white/60'}`}>
            {label}개월{isPeak ? ' — Peak' : ''}
          </span>
          {quality != null && (
            <span className="text-sm font-mono font-medium text-[#C4A052]">{Math.round(quality)}</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
          {texture != null && <span className="text-[10px] text-emerald-400/60">질감 {Math.round(texture)}</span>}
          {aroma != null && <span className="text-[10px] text-red-400/50">향 {Math.round(aroma)}</span>}
          {bubble != null && <span className="text-[10px] text-emerald-400/60">기포 {Math.round(bubble)}</span>}
          {offFlavor != null && <span className="text-[10px] text-red-400/50">환원취 {Math.round(offFlavor)}</span>}
        </div>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 20, right: 12, left: -10, bottom: 5 }}>
        <defs>
          {/* 종합 품질 곡선 아래 그라디언트 — 금색 */}
          <linearGradient id="qualityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C4A052" stopOpacity={0.2} />
            <stop offset="60%" stopColor="#C4A052" stopOpacity={0.05} />
            <stop offset="100%" stopColor="#C4A052" stopOpacity={0} />
          </linearGradient>
          {/* 이득 영역 */}
          <linearGradient id="gainFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.22} />
            <stop offset="70%" stopColor="#22c55e" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
          </linearGradient>
          {/* 손실 영역 */}
          <linearGradient id="lossFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.18} />
            <stop offset="70%" stopColor="#ef4444" stopOpacity={0.06} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
          </linearGradient>
          {/* 피크 마커 글로우 */}
          <filter id="peakGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
          tickFormatter={(v) => `${v}`}
          axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
          tickLine={false}
          label={{ value: '개월', position: 'insideBottomRight', offset: -5, fill: 'rgba(255,255,255,0.2)', fontSize: 9 }}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }}
          axisLine={false}
          tickLine={false}
          tickCount={6}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(196,160,82,0.2)', strokeWidth: 1, strokeDasharray: '3 3' }} />

        {/* 이득/손실 영역 — 극히 미묘한 배경 */}
        <Area type="monotone" dataKey="gainScore" stroke="none" fill="url(#gainFill)" legendType="none" />
        <Area type="monotone" dataKey="lossScore" stroke="none" fill="url(#lossFill)" legendType="none" />

        {/* 이득 고스트 라인: 질감(실선) + 기포(점선) — 에메랄드 */}
        <Line type="monotone" dataKey="textureMaturity" stroke="#34d399" strokeWidth={1} strokeOpacity={0.4} dot={false} legendType="none" />
        <Line type="monotone" dataKey="bubbleRefinement" stroke="#34d399" strokeWidth={1} strokeOpacity={0.3} strokeDasharray="3 4" dot={false} legendType="none" />

        {/* 손실 고스트 라인: 향 신선도(실선, 하강=감쇠) + Off-flavor(점선) — 레드 */}
        <Line type="monotone" dataKey="aromaFreshness" stroke="#f87171" strokeWidth={1} strokeOpacity={0.35} dot={false} legendType="none" />
        <Line type="monotone" dataKey="offFlavorRisk" stroke="#f87171" strokeWidth={1} strokeOpacity={0.3} strokeDasharray="3 4" dot={false} legendType="none" />

        {/* 종합 품질 곡선 — 주인공 */}
        <Area
          type="monotone"
          dataKey="compositeQuality"
          stroke="#C4A052"
          strokeWidth={2.5}
          fill="url(#qualityGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#C4A052', stroke: 'rgba(255,255,255,0.8)', strokeWidth: 1.5 }}
          legendType="none"
        />

        {/* 계획 기간 수직선 (점선, 시안) */}
        {plannedMonths && (
          <ReferenceLine
            x={plannedMonths}
            stroke="#22d3ee"
            strokeWidth={1}
            strokeDasharray="4 4"
            strokeOpacity={0.3}
            label={{ value: `${plannedMonths}개월`, position: 'top', fill: 'rgba(34,211,238,0.5)', fontSize: 9 }}
          />
        )}

        {/* 이론적 피크 수직선 (금색) */}
        {harvestWindow && (
          <ReferenceLine
            x={harvestWindow.peakMonth}
            stroke="#C4A052"
            strokeWidth={1}
            strokeDasharray="2 3"
            strokeOpacity={0.4}
          />
        )}

        {/* 계획 기간 내 피크 마커 (시안, 이론적 피크와 다를 때만) */}
        {plannedMonths && plannedPeakPoint && harvestWindow && plannedPeakPoint.month !== harvestWindow.peakMonth && (
          <ReferenceDot
            x={plannedPeakPoint.month}
            y={plannedPeakPoint.compositeQuality ?? 0}
            r={4}
            fill="#22d3ee"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth={1.5}
          />
        )}

        {/* 효율 최적점 마커 + 라벨 (초록) */}
        {efficientPoint && harvestWindow && efficientPoint.month < harvestWindow.peakMonth && (
          <>
            <ReferenceDot
              x={efficientPoint.month}
              y={efficientPoint.compositeQuality ?? 0}
              r={4}
              fill="#34d399"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth={1.5}
            />
            <ReferenceDot
              x={efficientPoint.month}
              y={(efficientPoint.compositeQuality ?? 0) + 6}
              r={0}
              label={{ value: '추천', fill: '#34d399', fontSize: 9, fontWeight: 600 }}
            />
          </>
        )}

        {/* 이론적 피크 마커 + 라벨 (금색) */}
        {harvestWindow && peakPoint && (
          <>
            <ReferenceDot
              x={harvestWindow.peakMonth}
              y={peakPoint.compositeQuality ?? 0}
              r={5}
              fill="#C4A052"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth={2}
              filter="url(#peakGlow)"
            />
            <ReferenceDot
              x={harvestWindow.peakMonth}
              y={(peakPoint.compositeQuality ?? 0) + 6}
              r={0}
              label={{ value: 'Peak', fill: '#C4A052', fontSize: 9, fontWeight: 600 }}
            />
          </>
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
