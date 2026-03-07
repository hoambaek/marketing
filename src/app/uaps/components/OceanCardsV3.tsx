'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Waves, Anchor, BarChart3, Thermometer, Wind, ArrowDown, Timer } from 'lucide-react';
import type {
  AgingProduct,
  ParsedUAPSConfig,
  AgingFactors,
  QualityWeights,
  OceanConditionsForPrediction,
  DepthSimulationResult,
} from '@/lib/types/uaps';
import { DEFAULT_AGING_FACTORS, DEFAULT_QUALITY_WEIGHTS } from '@/lib/types/uaps';
import { simulateDepthQualities, deriveKineticFactorFromOcean } from '@/lib/utils/uaps-engine';

// ═══════════════════════════════════════════════════════════════════════════
// 카드 1: 해양 환경 현황
// ═══════════════════════════════════════════════════════════════════════════

interface OceanConditionsCardProps {
  currentConditions: {
    seaTemperature: number | null;
    currentVelocity: number | null;
    waveHeight: number | null;
    wavePeriod: number | null;
    waterPressure: number | null;
    salinity: number | null;
    lastUpdated?: string;
  } | null;
  accentColor?: string;
}

export function OceanConditionsCard({ currentConditions, accentColor = '#22d3ee' }: OceanConditionsCardProps) {
  if (!currentConditions) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Waves className="w-4 h-4" style={{ color: accentColor }} />
          <h3 className="text-sm font-medium text-white/80">해양 환경 현황</h3>
        </div>
        <p className="text-xs text-white/30 mb-3">해양 데이터가 수집되지 않았습니다.</p>
        <Link
          href="/data-log"
          className="text-xs hover:underline transition-colors"
          style={{ color: accentColor }}
        >
          /data-log에서 데이터 수집 →
        </Link>
      </div>
    );
  }

  const items = [
    { label: '수온', value: currentConditions.seaTemperature, unit: '°C', icon: Thermometer, color: '#60a5fa' },
    { label: '해류', value: currentConditions.currentVelocity, unit: 'm/s', icon: Wind, color: '#34d399' },
    { label: '파고', value: currentConditions.waveHeight, unit: 'm', icon: Waves, color: '#a78bfa' },
    { label: '파주기', value: currentConditions.wavePeriod, unit: 's', icon: Timer, color: '#fbbf24' },
    { label: '수압', value: currentConditions.waterPressure, unit: 'atm', icon: ArrowDown, color: '#f472b6' },
    { label: '염도', value: currentConditions.salinity, unit: '‰', icon: Anchor, color: '#fbbf24' },
  ];

  const lastUpdated = currentConditions.lastUpdated
    ? new Date(currentConditions.lastUpdated)
    : null;
  const timeSince = lastUpdated
    ? Math.round((Date.now() - lastUpdated.getTime()) / 3600000)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Waves className="w-4 h-4" style={{ color: accentColor }} />
          <h3 className="text-sm font-medium text-white/80">해양 환경 현황</h3>
        </div>
        {timeSince !== null && (
          <span className="text-[10px] text-white/25">
            {timeSince < 1 ? '방금 전' : `${timeSince}시간 전`}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {items.map((item) => (
          <div key={item.label} className="bg-white/[0.03] rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5 mb-1">
              <item.icon className="w-3 h-3" style={{ color: item.color }} />
              <span className="text-[10px] text-white/40">{item.label}</span>
            </div>
            <span className="text-sm font-medium text-white/70">
              {item.value !== null ? `${item.value.toFixed(1)} ${item.unit}` : '—'}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 카드 2: 최적 깊이 추천
// ═══════════════════════════════════════════════════════════════════════════

interface OptimalDepthCardProps {
  product: AgingProduct | null;
  config: ParsedUAPSConfig;
  months: number;
  oceanConditions?: OceanConditionsForPrediction | null;
  agingFactors?: AgingFactors;
  qualityWeights?: QualityWeights;
  accentColor?: string;
}

export function OptimalDepthCard({
  product,
  config,
  months,
  oceanConditions,
  agingFactors,
  qualityWeights,
  accentColor = '#C4A052',
}: OptimalDepthCardProps) {
  const depthResults = useMemo(() => {
    if (!product) return null;
    return simulateDepthQualities(
      product, config, months,
      oceanConditions ?? undefined,
      agingFactors,
      qualityWeights,
    );
  }, [product, config, months, oceanConditions, agingFactors, qualityWeights]);

  if (!product || !depthResults) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Anchor className="w-4 h-4" style={{ color: accentColor }} />
          <h3 className="text-sm font-medium text-white/80">최적 깊이 추천</h3>
        </div>
        <p className="text-xs text-white/30">제품을 선택하면 깊이별 품질을 시뮬레이션합니다.</p>
      </div>
    );
  }

  const best = depthResults.reduce((a, b) => (a.quality > b.quality ? a : b));
  const maxQ = Math.max(...depthResults.map((d) => d.quality), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Anchor className="w-4 h-4" style={{ color: accentColor }} />
          <h3 className="text-sm font-medium text-white/80">최적 깊이 추천</h3>
        </div>
        <span className="text-[10px] text-white/25">{months}개월 기준</span>
      </div>
      <div className="space-y-2">
        {depthResults.map((d) => {
          const isBest = d.depth === best.depth;
          const widthPct = Math.max(10, (d.quality / maxQ) * 100);
          return (
            <div key={d.depth} className="flex items-center gap-2.5">
              <span className={`text-xs w-10 text-right font-mono ${isBest ? 'text-white/90 font-medium' : 'text-white/40'}`}>
                {d.depth}m
              </span>
              <div className="flex-1 bg-white/[0.04] rounded-full h-5 overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 0.6, delay: d.depth * 0.02 }}
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: isBest ? accentColor : 'rgba(255,255,255,0.08)',
                    opacity: isBest ? 0.8 : 0.5,
                  }}
                />
                <span className={`absolute right-2 top-0.5 text-[10px] ${isBest ? 'text-white/90' : 'text-white/40'}`}>
                  {d.quality.toFixed(1)}
                </span>
              </div>
              {isBest && (
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                  추천
                </span>
              )}
            </div>
          );
        })}
      </div>
      {product.agingDepth !== best.depth && (
        <p className="text-[11px] text-white/30 mt-2.5">
          현재 설정: {product.agingDepth}m → 최적: {best.depth}m (+{(best.quality - (depthResults.find(d => d.depth === product.agingDepth)?.quality ?? best.quality)).toFixed(1)}점)
        </p>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 카드 3: 환경 영향도
// ═══════════════════════════════════════════════════════════════════════════

interface EnvironmentalImpactCardProps {
  oceanConditions?: OceanConditionsForPrediction | null;
  accentColor?: string;
}

export function EnvironmentalImpactCard({
  oceanConditions,
  accentColor = '#B76E79',
}: EnvironmentalImpactCardProps) {
  const impacts = useMemo(() => {
    if (!oceanConditions) return null;

    const getStrength = (value: number, thresholds: [number, number]): '약' | '중' | '강' => {
      if (value < thresholds[0]) return '약';
      if (value < thresholds[1]) return '중';
      return '강';
    };

    const items = [];

    if (oceanConditions.seaTemperature !== null) {
      const t = oceanConditions.seaTemperature;
      const isLow = t < 8;
      items.push({
        label: '수온',
        value: `${t.toFixed(1)}°C`,
        target: 'FRI (향 보존)',
        direction: isLow ? '↑' : '↓',
        directionLabel: isLow ? '산화 둔화 → 향 보존 증가' : '산화 가속 → 향 보존 감소',
        strength: getStrength(Math.abs(t - 12), [3, 7]),
        color: '#60a5fa',
      });
    }

    if (oceanConditions.currentVelocity !== null) {
      const v = oceanConditions.currentVelocity;
      items.push({
        label: '해류속도',
        value: `${v.toFixed(2)} m/s`,
        target: 'K-TCI (질감 가속)',
        direction: v > 0.2 ? '↑' : '→',
        directionLabel: v > 0.2 ? '강한 해류 → 질감 가속 증가' : '약한 해류 → 기본 수준',
        strength: getStrength(v, [0.1, 0.3]),
        color: '#34d399',
      });
    }

    if (oceanConditions.waterPressure !== null) {
      const p = oceanConditions.waterPressure;
      items.push({
        label: '수압',
        value: `${p.toFixed(1)} atm`,
        target: 'BRI (기포 보존)',
        direction: p > 3 ? '↑' : '→',
        directionLabel: p > 3 ? '고압 → 기포 보존 증가' : '저압 → 기본 수준',
        strength: getStrength(p, [2, 4]),
        color: '#f472b6',
      });
    }

    if (oceanConditions.waveHeight !== null) {
      const wh = oceanConditions.waveHeight;
      items.push({
        label: '파고',
        value: `${wh.toFixed(1)} m`,
        target: 'K-TCI 보정',
        direction: wh > 1.5 ? '↑' : '→',
        directionLabel: wh > 1.5 ? '높은 파고 → 진동 효과 증가' : '낮은 파고 → 기본 수준',
        strength: getStrength(wh, [1, 2]),
        color: '#a78bfa',
      });
    }

    if (oceanConditions.wavePeriod !== null) {
      const wp = oceanConditions.wavePeriod;
      items.push({
        label: '파주기',
        value: `${wp.toFixed(1)} s`,
        target: 'K-TCI 보정',
        direction: wp < 6 ? '↑' : '→',
        directionLabel: wp < 6 ? '짧은 주기 → 진동 에너지 증가' : '긴 주기 → 기본 수준',
        strength: getStrength(10 - wp, [2, 5]),
        color: '#fbbf24',
      });
    }

    return items;
  }, [oceanConditions]);

  if (!impacts || impacts.length === 0) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4" style={{ color: accentColor }} />
          <h3 className="text-sm font-medium text-white/80">환경 영향도</h3>
        </div>
        <p className="text-xs text-white/30">해양 데이터 수집 후 각 파라미터의 영향을 분석합니다.</p>
      </div>
    );
  }

  const strengthColors = { '약': 'text-white/30', '중': 'text-yellow-400/70', '강': 'text-emerald-400/80' };
  const strengthBg = { '약': 'bg-white/[0.03]', '중': 'bg-yellow-400/[0.05]', '강': 'bg-emerald-400/[0.05]' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4" style={{ color: accentColor }} />
        <h3 className="text-sm font-medium text-white/80">환경 영향도</h3>
      </div>
      <div className="space-y-2">
        {impacts.map((item) => (
          <div key={item.label} className={`${strengthBg[item.strength]} rounded-lg px-3 py-2.5`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: item.color }}>{item.label}</span>
                <span className="text-xs text-white/50">{item.value}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{item.direction}</span>
                <span className={`text-[10px] font-medium ${strengthColors[item.strength]}`}>
                  {item.strength}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/25">{item.target}</span>
              <span className="text-[10px] text-white/30">{item.directionLabel}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
