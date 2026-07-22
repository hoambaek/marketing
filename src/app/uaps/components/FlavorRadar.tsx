'use client';

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { getFlavorAxes, CATEGORY_NEGATIVE_AXIS } from '@/lib/types/uaps';

// UAPS Flavor Radar (샴페인·전 카테고리 공유).
// - 샴페인 페이지: products/selectedProductId/onSelectProduct 전달 → 좌측 제품 선택기 노출.
// - 카테고리 페이지: accent/accentRgb 전달 → 테마색 적용 (선택기 없음).
// accent 기본값 cyan이라 샴페인은 기존과 동일. 빈 프로파일은 0(중심 수렴)으로 정직하게 표시.
export function FlavorRadar({
  beforeProfile,
  afterProfile,
  products,
  selectedProductId,
  onSelectProduct,
  category,
  accent = '#22d3ee',
  accentRgb = '34, 211, 238',
}: {
  beforeProfile: Record<string, number> | null;
  afterProfile: Record<string, number> | null;
  products?: { id: string; productName: string }[];
  selectedProductId?: string | null;
  onSelectProduct?: (id: string) => void;
  category?: string | null;
  accent?: string;
  accentRgb?: string;
}) {
  const ZERO_PROFILE: Record<string, number> = { fruity: 0, floralMineral: 0, yeastyAutolytic: 0, acidityFreshness: 0, bodyTexture: 0, finishComplexity: 0 };
  const before = beforeProfile || ZERO_PROFILE;
  const after = afterProfile || before;

  // 음성축(이취·산화 리스크 등): 값이 낮을수록 좋음 — 라벨에 ↓ 마커, 비교표 색상 반전
  const negIdx = category ? CATEGORY_NEGATIVE_AXIS[category] : undefined;

  const radarData = getFlavorAxes(category).map((axis, i) => ({
    axis: negIdx === i ? `${axis.label} ↓` : axis.label,
    isNeg: negIdx === i,
    before: Math.round(Math.min(100, Math.max(0, before[axis.key] ?? 0))),
    after: Math.round(Math.min(100, Math.max(0, after[axis.key] ?? 0))),
  }));

  const changes = radarData.map((d) => ({
    label: d.axis,
    isNeg: d.isNeg,
    before: d.before,
    after: d.after,
    diff: d.after - d.before,
  }));

  // 제품 선택기 유무에 따라 차트 크기가 달라진다 (선택기가 가로 폭을 먹으므로).
  const hasSelector = !!(products && products.length > 0);

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-0">
      {/* 제품 번호 — 데스크탑: 좌측 세로, 모바일: 상단 가로 */}
      {hasSelector && (
        <div className="lg:w-[140px] flex lg:flex-col items-start">
          <div className="flex lg:flex-col gap-1.5 flex-nowrap lg:flex-wrap overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto lg:max-h-[340px] pb-1 lg:pb-0 lg:pr-3 lg:mr-3 lg:border-r lg:border-white/[0.04]">
            {products!.map((p, i) => (
              <button
                key={p.id}
                onClick={() => onSelectProduct?.(p.id)}
                title={p.productName}
                className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] transition-all whitespace-nowrap ${
                  selectedProductId === p.id
                    ? 'bg-[#B76E79]/15 border border-[#B76E79]/30 text-[#B76E79]'
                    : 'bg-white/[0.03] border border-white/[0.06] text-white/35 hover:text-white/60 hover:border-white/[0.12]'
                }`}
              >
                <span className="w-4 h-4 flex items-center justify-center rounded-full bg-white/[0.08] text-[9px] font-mono shrink-0">{i + 1}</span>
                <span className="truncate max-w-[80px] lg:max-w-[100px]">{p.productName}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {/* 레이더 차트 */}
      <div className={`flex-1 relative ${hasSelector ? 'h-[280px] sm:h-[320px] lg:h-[360px]' : 'h-[300px] sm:h-[380px] lg:h-[420px]'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={hasSelector ? '88%' : '78%'}>
            <defs>
              <radialGradient id="radarBeforeFill" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={accent} stopOpacity={0.10} />
                <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
              </radialGradient>
              <radialGradient id="radarAfterFill" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#B76E79" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#B76E79" stopOpacity={0.06} />
              </radialGradient>
              <filter id="radarGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <PolarGrid stroke="rgba(255,255,255,0.04)" gridType="circle" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'var(--font-pretendard, Pretendard, sans-serif)' }}
              tickLine={false}
            />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="투하 전"
              dataKey="before"
              stroke={`rgba(${accentRgb},0.4)`}
              fill="url(#radarBeforeFill)"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
            <Radar
              name="AI 예측"
              dataKey="after"
              stroke="#B76E79"
              fill="url(#radarAfterFill)"
              strokeWidth={2}
              filter="url(#radarGlow)"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* 우측 패널 — 범례 + 변화량 */}
      <div className="lg:w-[220px] flex flex-col justify-center lg:pl-2 lg:border-l lg:border-white/[0.04]">
        {/* 범례 */}
        <div className="flex lg:flex-col items-center lg:items-start gap-3 lg:gap-2 mb-4 lg:mb-5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-px border-t border-dashed" style={{ borderColor: `${accent}80` }} />
            <span className="text-[10px] text-white/40 tracking-wide">투하 전</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-[2px] rounded-full bg-[#B76E79]" />
            <span className="text-[10px] text-white/40 tracking-wide">해저 숙성 후</span>
          </div>
        </div>

        {/* 6축 변화량 카드 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1.5">
          {changes.map((c) => {
            // 음성축은 리스크↓(diff<0)가 개선, 양성축은 값↑(diff>0)가 개선
            const isPositive = c.isNeg ? c.diff < 0 : c.diff > 0;
            const isNegative = c.isNeg ? c.diff > 0 : c.diff < 0;
            return (
              <div
                key={c.label}
                className="flex items-center justify-between rounded-lg px-3 py-2 border transition-colors"
                style={{
                  backgroundColor: isPositive ? 'rgba(183,110,121,0.06)' : isNegative ? `rgba(${accentRgb},0.04)` : 'rgba(255,255,255,0.02)',
                  borderColor: isPositive ? 'rgba(183,110,121,0.12)' : isNegative ? `rgba(${accentRgb},0.08)` : 'rgba(255,255,255,0.04)',
                }}
              >
                <div className="flex flex-col">
                  <span className="text-[9px] lg:text-[10px] text-white/30 tracking-wide leading-none mb-0.5">{c.label}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[10px] lg:text-xs text-white/20 font-mono">{c.before}</span>
                    <span className="text-[8px] lg:text-[10px] text-white/15">→</span>
                    <span className="text-[10px] lg:text-xs text-white/50 font-mono font-medium">{c.after}</span>
                  </div>
                </div>
                <span
                  className="text-sm lg:text-base font-mono font-semibold tabular-nums"
                  style={{
                    color: isPositive ? '#B76E79' : isNegative ? `rgba(${accentRgb},0.7)` : 'rgba(255,255,255,0.15)',
                    fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                  }}
                >
                  {c.diff > 0 ? '+' : ''}{c.diff}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
