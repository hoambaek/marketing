'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Waves, Anchor, BarChart3, Thermometer, Wind, ArrowDown, Timer,
  Calendar, Target, Shield,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceDot,
} from 'recharts';
import type {
  AgingProduct,
  ParsedUAPSConfig,
  AgingFactors,
  QualityWeights,
  OceanConditionsForPrediction,
  OptimalImmersionResult,
} from '@/lib/types/uaps';
import { DEFAULT_AGING_FACTORS, DEFAULT_QUALITY_WEIGHTS } from '@/lib/types/uaps';
import { simulateDepthQualities, deriveKineticFactorFromOcean } from '@/lib/utils/uaps-engine';
import type { MonthlyOceanProfile, AnnualOceanProfile } from '@/lib/utils/uaps-ocean-profile';

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
  dataSource?: 'khoa' | 'open-meteo' | 'hybrid' | string | null;
  tsiScore?: number | null;
  accentColor?: string;
}

export function OceanConditionsCard({
  currentConditions,
  dataSource,
  tsiScore,
  accentColor = '#22d3ee',
}: OceanConditionsCardProps) {
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

  // 데이터 소스 뱃지 설정
  const sourceBadge = useMemo(() => {
    if (!dataSource) return null;
    const isKhoa = dataSource === 'khoa' || dataSource === 'hybrid';
    return {
      label: isKhoa ? 'KHOA 실측' : 'Open-Meteo',
      color: isKhoa ? '#34d399' : '#60a5fa',
      bgColor: isKhoa ? 'rgba(52, 211, 153, 0.1)' : 'rgba(96, 165, 250, 0.1)',
    };
  }, [dataSource]);

  // 6개 지표 종합 숙성 환경 평가
  const overallRating = useMemo(() => {
    if (!currentConditions) return null;

    // 각 지표별 숙성 유리도 (0~1, 1=최적)
    const scores: number[] = [];

    // 1. 수온: 8~12°C 최적 (저온 산화 둔화), 16+ 불리
    const t = currentConditions.seaTemperature;
    if (t !== null) {
      if (t <= 12) scores.push(1.0);
      else if (t <= 16) scores.push(0.6);
      else scores.push(0.3);
    }

    // 2. 수압: 높을수록 좋음 (30m=4atm 기준)
    const p = currentConditions.waterPressure;
    if (p !== null) {
      if (p >= 4) scores.push(1.0);
      else if (p >= 2.5) scores.push(0.6);
      else scores.push(0.3);
    }

    // 3. 해류: 적당한 흐름 유리 (리무아주)
    const v = currentConditions.currentVelocity;
    if (v !== null) {
      if (v >= 0.1 && v <= 0.5) scores.push(1.0);
      else if (v > 0) scores.push(0.6);
      else scores.push(0.3);
    }

    // 4. 염분: 30~34 psu 정상 범위
    const s = currentConditions.salinity;
    if (s !== null) {
      if (s >= 30 && s <= 34) scores.push(1.0);
      else if (s >= 25) scores.push(0.6);
      else scores.push(0.3);
    }

    // 5. 파고: 낮을수록 안정 (30m 감쇠)
    const wh = currentConditions.waveHeight;
    if (wh !== null) {
      if (wh <= 1.5) scores.push(1.0);
      else if (wh <= 3) scores.push(0.6);
      else scores.push(0.3);
    }

    // 6. TSI (수온 안정성): 전달받은 값 사용
    if (tsiScore !== null && tsiScore !== undefined) {
      if (tsiScore >= 0.5) scores.push(1.0);
      else if (tsiScore >= 0.3) scores.push(0.6);
      else scores.push(0.3);
    }

    if (scores.length === 0) return null;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

    if (avg >= 0.8) return { text: '최적', color: '#34d399' };
    if (avg >= 0.6) return { text: '양호', color: '#22d3ee' };
    if (avg >= 0.45) return { text: '보통', color: '#fbbf24' };
    return { text: '주의', color: '#f87171' };
  }, [currentConditions, tsiScore]);

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
          {sourceBadge && (
            <span
              className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: sourceBadge.bgColor, color: sourceBadge.color }}
            >
              {sourceBadge.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {overallRating && (
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" style={{ color: overallRating.color }} />
              <span className="text-[9px] font-medium" style={{ color: overallRating.color }}>
                숙성환경 {overallRating.text}
              </span>
            </div>
          )}
          {timeSince !== null && (
            <span className="text-[10px] text-white/25">
              {timeSince < 1 ? '방금 전' : `${timeSince}시간 전`}
            </span>
          )}
        </div>
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
                <div className="absolute inset-0 flex items-center justify-between px-2">
                  {isBest ? (
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${accentColor}30`, color: accentColor }}>
                      추천
                    </span>
                  ) : <span />}
                  <span className={`text-[10px] ${isBest ? 'text-white/90' : 'text-white/40'}`}>
                    {d.quality.toFixed(1)}
                  </span>
                </div>
              </div>
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

interface DepthInfoForCard {
  depth: number;
  depthCorrected: boolean;
  dataPoints: number;
  periodStart: string;
  periodEnd: string;
}

interface EnvironmentalImpactCardProps {
  oceanConditions?: OceanConditionsForPrediction | null;
  depthInfo?: DepthInfoForCard;
  accentColor?: string;
}

export function EnvironmentalImpactCard({
  oceanConditions,
  depthInfo,
  accentColor = '#B76E79',
}: EnvironmentalImpactCardProps) {
  type Rating = '유리' | '보통' | '주의';

  const impacts = useMemo(() => {
    if (!oceanConditions) return null;

    const items: {
      label: string;
      value: string;
      target: string;
      description: string;
      rating: Rating;
      color: string;
    }[] = [];

    // 수온: 낮을수록 유리 (산화 둔화 → 향 보존)
    if (oceanConditions.seaTemperature !== null) {
      const t = oceanConditions.seaTemperature;
      const depthLabel = depthInfo?.depthCorrected ? ` (${depthInfo.depth}m)` : '';
      let rating: Rating = '보통';
      let description: string;
      if (t <= 10) { rating = '유리'; description = '저온 → 산화 둔화, 향 보존 극대화'; }
      else if (t <= 16) { rating = '보통'; description = '적정 수온 → 숙성 진행 중'; }
      else { rating = '주의'; description = '고온 → 산화 가속, 향 손실 위험'; }
      items.push({ label: '수온', value: `${t.toFixed(1)}°C${depthLabel}`, target: 'FRI (향 보존)', description, rating, color: '#60a5fa' });
    }

    // 해류: 적당한 흐름이 유리 (자연 리무아주)
    if (oceanConditions.currentVelocity !== null) {
      const v = oceanConditions.currentVelocity;
      let rating: Rating = '보통';
      let description: string;
      if (v >= 0.15) { rating = '유리'; description = '활발한 해류 → 자연 리무아주 효과'; }
      else if (v >= 0.05) { rating = '보통'; description = '약한 해류 → 기본 질감 발달'; }
      else { rating = '주의'; description = '정체 → 질감 발달 지연'; }
      items.push({ label: '해류속도', value: `${v.toFixed(2)} m/s`, target: 'K-TCI (질감)', description, rating, color: '#34d399' });
    }

    // 수압: 높을수록 유리 (기포 용해 안정)
    if (oceanConditions.waterPressure !== null) {
      const p = oceanConditions.waterPressure;
      let rating: Rating = '보통';
      let description: string;
      if (p >= 4) { rating = '유리'; description = '고압 → CO₂ 용해 안정, 기포 보존'; }
      else if (p >= 2.5) { rating = '보통'; description = '적정 수압 → 기포 안정'; }
      else { rating = '주의'; description = '저압 → 기포 방출 위험'; }
      items.push({ label: '수압', value: `${p.toFixed(1)} atm`, target: 'BRI (기포 보존)', description, rating, color: '#f472b6' });
    }

    // 파고: 30m에서 감쇠되므로 대부분 유리
    if (oceanConditions.waveHeight !== null) {
      const wh = oceanConditions.waveHeight;
      let rating: Rating = '유리';
      let description: string;
      if (wh <= 1.5) { rating = '유리'; description = '잔잔 → 숙성 환경 안정'; }
      else if (wh <= 3.0) { rating = '보통'; description = '보통 파도 → 30m 감쇠'; }
      else { rating = '주의'; description = '높은 파도 → 진동 영향 가능'; }
      items.push({ label: '파고', value: `${wh.toFixed(1)} m`, target: '환경 안정성', description, rating, color: '#a78bfa' });
    }

    // 파주기: 긴 주기가 유리 (에너지 낮음)
    if (oceanConditions.wavePeriod !== null) {
      const wp = oceanConditions.wavePeriod;
      let rating: Rating = '보통';
      let description: string;
      if (wp >= 7) { rating = '유리'; description = '긴 주기 → 낮은 진동 에너지'; }
      else if (wp >= 4) { rating = '보통'; description = '보통 주기 → 기본 수준'; }
      else { rating = '주의'; description = '짧은 주기 → 진동 에너지 높음'; }
      items.push({ label: '파주기', value: `${wp.toFixed(1)} s`, target: '환경 안정성', description, rating, color: '#fbbf24' });
    }

    return items;
  }, [oceanConditions, depthInfo]);

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

  const ratingConfig: Record<Rating, { text: string; color: string; bg: string; dot: string }> = {
    '유리': { text: 'text-emerald-400', color: '#34d399', bg: 'bg-emerald-400/[0.06]', dot: 'bg-emerald-400' },
    '보통': { text: 'text-amber-400', color: '#fbbf24', bg: 'bg-amber-400/[0.04]', dot: 'bg-amber-400' },
    '주의': { text: 'text-red-400', color: '#f87171', bg: 'bg-red-400/[0.05]', dot: 'bg-red-400' },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" style={{ color: accentColor }} />
          <h3 className="text-sm font-medium text-white/80">환경 영향도</h3>
          {depthInfo?.depthCorrected && (
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-cyan-400/10 text-cyan-400/70">
              {depthInfo.depth}m 보정
            </span>
          )}
        </div>
        {depthInfo && depthInfo.dataPoints > 0 && (
          <span className="text-[10px] text-white/25">
            {depthInfo.periodStart.slice(5)} ~ {depthInfo.periodEnd.slice(5)} ({depthInfo.dataPoints}일)
          </span>
        )}
      </div>
      <div className="space-y-2">
        {impacts.map((item) => {
          const rc = ratingConfig[item.rating];
          return (
            <div key={item.label} className={`${rc.bg} rounded-lg px-3 py-2.5`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: item.color }}>{item.label}</span>
                  <span className="text-xs text-white/50">{item.value}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />
                  <span className={`text-[10px] font-medium ${rc.text}`}>
                    {item.rating}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/25">{item.target}</span>
                <span className="text-[10px] text-white/30">{item.description}</span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 카드 4: 월별 수온 프로파일
// ═══════════════════════════════════════════════════════════════════════════

const MONTH_SHORT = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

interface MonthlyProfileCardProps {
  monthlyProfiles: MonthlyOceanProfile[] | null;
  accentColor?: string;
}

export function MonthlyProfileCard({
  monthlyProfiles,
  accentColor = '#22d3ee',
}: MonthlyProfileCardProps) {
  const chartData = useMemo(() => {
    if (!monthlyProfiles || monthlyProfiles.length === 0) return null;

    return monthlyProfiles
      .slice()
      .sort((a, b) => a.month - b.month)
      .map((p) => ({
        name: MONTH_SHORT[p.month - 1],
        month: p.month,
        temp: Math.round(p.seaTemperatureAvg * 10) / 10,
      }));
  }, [monthlyProfiles]);

  const highlights = useMemo(() => {
    if (!chartData) return null;
    const currentMonth = new Date().getMonth() + 1;
    const maxEntry = chartData.reduce((a, b) => (a.temp > b.temp ? a : b));
    const minEntry = chartData.reduce((a, b) => (a.temp < b.temp ? a : b));
    const currentEntry = chartData.find((d) => d.month === currentMonth) ?? null;
    return { max: maxEntry, min: minEntry, current: currentEntry };
  }, [chartData]);

  if (!chartData || !highlights) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4" style={{ color: accentColor }} />
          <h3 className="text-sm font-medium text-white/80">월별 수온 프로파일</h3>
        </div>
        <p className="text-xs text-white/30">해양 데이터 로드 후 12개월 수온 변화를 표시합니다.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" style={{ color: accentColor }} />
          <h3 className="text-sm font-medium text-white/80">월별 수온 프로파일</h3>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-blue-400/70">{highlights.min.name} {highlights.min.temp}°C</span>
          <span className="text-white/20">/</span>
          <span className="text-orange-400/70">{highlights.max.name} {highlights.max.temp}°C</span>
        </div>
      </div>

      {/* Recharts 미니 라인 차트 */}
      <div className="h-[120px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
            <XAxis
              dataKey="name"
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              interval={1}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              domain={['dataMin - 1', 'dataMax + 1']}
              tickFormatter={(v: number) => `${v}°`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(13, 20, 33, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontSize: '11px',
                color: 'rgba(255,255,255,0.8)',
              }}
              formatter={(value: number) => [`${value}°C`, '수온']}
            />
            <Line
              type="monotone"
              dataKey="temp"
              stroke={accentColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: accentColor }}
            />
            {/* 현재 월 하이라이트 점 */}
            {highlights.current && (
              <ReferenceDot
                x={highlights.current.name}
                y={highlights.current.temp}
                r={5}
                fill={accentColor}
                stroke="rgba(255,255,255,0.4)"
                strokeWidth={2}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {highlights.current && (
        <p className="text-[10px] text-white/30 mt-1.5 text-center">
          현재 ({highlights.current.name}): {highlights.current.temp}°C
        </p>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 카드 5: 최적 투입 월 추천
// ═══════════════════════════════════════════════════════════════════════════

interface OptimalImmersionCardProps {
  immersionResult: OptimalImmersionResult | null;
  accentColor?: string;
}

export function OptimalImmersionCard({
  immersionResult,
  accentColor = '#C4A052',
}: OptimalImmersionCardProps) {
  if (!immersionResult) {
    return null;
  }

  const { bestMonthLabel, peakScore, peakAtMonth, monthlyScores, recommendation } = immersionResult;
  const maxPeak = Math.max(...monthlyScores.map((s) => s.peakQuality), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4" style={{ color: accentColor }} />
          <h3 className="text-sm font-medium text-white/80">최적 투입 월</h3>
        </div>
        <span className="text-[10px] text-white/25">{peakAtMonth}개월차 피크</span>
      </div>

      {/* 추천 월 강조 */}
      <div className="flex items-center gap-4 mb-4">
        <div
          className="flex items-center justify-center w-16 h-16 rounded-2xl"
          style={{ backgroundColor: `${accentColor}15`, border: `1px solid ${accentColor}30` }}
        >
          <span className="text-2xl font-light" style={{ color: accentColor }}>
            {bestMonthLabel}
          </span>
        </div>
        <div>
          <p className="text-xs text-white/50 mb-0.5">투입 추천</p>
          <p className="text-sm font-medium" style={{ color: accentColor }}>
            피크 {peakScore}점
          </p>
        </div>
      </div>

      {/* 12개월 peakQuality 미니 바 차트 */}
      <div className="flex items-end gap-1 h-14 mb-3">
        {monthlyScores.map((s) => {
          const heightPct = Math.max(8, (s.peakQuality / maxPeak) * 100);
          const isBest = s.immersionMonth === immersionResult.bestMonth;
          return (
            <div
              key={s.immersionMonth}
              className="flex-1 flex flex-col items-center gap-0.5"
            >
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPct}%` }}
                transition={{ duration: 0.5, delay: s.immersionMonth * 0.03 }}
                className="w-full rounded-t"
                style={{
                  backgroundColor: isBest ? accentColor : 'rgba(255,255,255,0.08)',
                  opacity: isBest ? 0.9 : 0.5,
                  minHeight: '3px',
                }}
                title={`${s.immersionMonthLabel}: ${s.peakQuality}점`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 mb-3">
        {monthlyScores.map((s) => (
          <div key={s.immersionMonth} className="flex-1 text-center">
            <span
              className={`text-[8px] ${
                s.immersionMonth === immersionResult.bestMonth
                  ? 'font-medium'
                  : 'text-white/25'
              }`}
              style={
                s.immersionMonth === immersionResult.bestMonth
                  ? { color: accentColor }
                  : undefined
              }
            >
              {s.immersionMonth}
            </span>
          </div>
        ))}
      </div>

      {/* 추천 문구 */}
      <p className="text-[11px] text-white/35 leading-relaxed">
        {recommendation}
      </p>
    </motion.div>
  );
}
