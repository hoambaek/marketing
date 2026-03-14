'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Bar,
  BarChart,
} from 'recharts';
import {
  Waves,
  Thermometer,
  Wind,
  Gauge,
  Droplets,
  Navigation2,
  Activity,
  Calendar,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Anchor,
  ArrowDown,
  Timer,
  TrendingUp,
} from 'lucide-react';
import { useOceanDataStore } from '@/lib/store/ocean-data-store';
import {
  OCEAN_DATA_LABELS,
  WANDO_COORDINATES,
  OceanDataView,
} from '@/lib/types';
import {
  calculateWaterPressure,
  getDirectionLabel,
  formatDateKR,
} from '@/lib/utils/ocean-calculations';
import {
  calculateLiveFRI,
  calculateLiveBRI,
  calculateLiveKTCI,
  calculateLiveTSI,
  calculateOverallScore,
  getFRILabel,
  getBRILabel,
  getKTCILabel,
  getTSILabel,
  getOverallLabel,
} from '@/lib/utils/uaps-live-coefficients';

// View options
const VIEW_OPTIONS: { value: OceanDataView; label: string; days: string }[] = [
  { value: 'daily', label: '주간', days: '7일' },
  { value: 'monthly', label: '월간', days: '30일' },
  { value: 'full_cycle', label: '숙성주기', days: '90일' },
];

// Floating particles component for oceanic atmosphere
function OceanParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-cyan-400/20"
          initial={{
            x: Math.random() * 80 + 10 + '%',
            y: '100%',
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            y: '10%',
            x: `calc(${Math.random() * 80 + 10}% + ${Math.sin(i) * 30}px)`,
          }}
          transition={{
            duration: Math.random() * 20 + 15,
            repeat: Infinity,
            ease: 'linear',
            delay: Math.random() * 10,
          }}
        />
      ))}
    </div>
  );
}

// Depth gauge visualization (0~60m, 투입 지점 마킹)
const DEPLOYED_DEPTHS = [30, 40, 50]; // 실제 투입 수심

function DepthGauge({ depth, maxDepth = 60 }: { depth: number; maxDepth?: number }) {
  const percentage = Math.min(100, (depth / maxDepth) * 100);

  return (
    <div className="relative h-full w-14 flex flex-col items-center">
      {/* Gauge track */}
      <div className="relative flex-1 w-3 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="absolute bottom-0 w-full bg-gradient-to-t from-cyan-500 via-cyan-400 to-teal-300"
          initial={{ height: 0 }}
          animate={{ height: `${percentage}%` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
        {/* Depth markers (0~60m, 10m 간격) */}
        {[0, 10, 20, 30, 40, 50, 60].map((mark) => (
          <div
            key={mark}
            className="absolute w-full h-px bg-white/10"
            style={{ bottom: `${(mark / maxDepth) * 100}%` }}
          />
        ))}
        {/* 투입 지점 마킹 */}
        {DEPLOYED_DEPTHS.map((d) => (
          <div
            key={`deployed-${d}`}
            className="absolute -left-1 w-5 flex items-center"
            style={{ bottom: `${(d / maxDepth) * 100}%`, transform: 'translateY(50%)' }}
          >
            <div className="w-2 h-2 rounded-full bg-[#C4A052] border border-[#C4A052]/50 shadow-[0_0_4px_rgba(196,160,82,0.4)]" />
          </div>
        ))}
      </div>
      {/* 수심 라벨 */}
      <div className="absolute left-[3.2rem] top-0 bottom-6 flex flex-col justify-between text-[9px] text-white/25 font-mono">
        <span>0</span>
        <span>30</span>
        <span>60</span>
      </div>
      {/* Current depth indicator */}
      <motion.div
        className="absolute right-7 flex items-center gap-1"
        initial={{ bottom: 0 }}
        animate={{ bottom: `${percentage}%` }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      >
        <ArrowDown className="w-3 h-3 text-cyan-400" />
        <span className="text-xs font-mono text-cyan-400">{depth}m</span>
      </motion.div>
      <div className="mt-2 text-[10px] text-white/40 font-mono">DEPTH</div>
    </div>
  );
}

// Data card component
function DataCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
  trend,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string | number | null;
  unit: string;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent rounded-2xl blur-xl group-hover:from-white/[0.12] transition-all" />
      <div className="relative bg-[#0d1421]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-4 hover:border-white/[0.12] transition-all">
        {/* Glow effect */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
          }}
        />

        <div className="flex items-start justify-between mb-3">
          <div
            className="p-2 rounded-xl"
            style={{ backgroundColor: `${color}15` }}
          >
            <div style={{ color }}>
              <Icon className="w-4 h-4" />
            </div>
          </div>
          {trend && (
            <div
              className={`text-xs px-2 py-0.5 rounded-full ${
                trend === 'up'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : trend === 'down'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-white/10 text-white/50'
              }`}
            >
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—'}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xs text-white/40 uppercase tracking-wider">{label}</p>
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-2xl font-light tracking-tight"
              style={{ color }}
            >
              {value ?? '—'}
            </span>
            <span className="text-sm text-white/30">{unit}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Chart wrapper with consistent styling
function ChartWrapper({
  title,
  icon: Icon,
  iconColor,
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  const color = iconColor || '#22d3ee';
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.03] to-transparent rounded-3xl" />
      <div className="relative bg-[#0d1421]/60 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl" style={{ backgroundColor: `${color}15` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <h3 className="text-lg font-medium text-white/90">{title}</h3>
        </div>

        {/* Chart */}
        <div className="h-64">{children}</div>
      </div>
    </motion.div>
  );
}

// UAPS Coefficient Gauge component
function CoefficientGauge({
  label,
  value,
  rawValue,
  description,
  statusLabel,
  color,
  delay = 0,
}: {
  label: string;
  value: number | null;
  rawValue: string;
  description: string;
  statusLabel: { text: string; color: string };
  color: string;
  delay?: number;
}) {
  const percentage = value !== null ? Math.round(value * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent rounded-2xl blur-xl group-hover:from-white/[0.10] transition-all" />
      <div className="relative bg-[#0d1421]/70 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.12] transition-all">
        {/* Top glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${color}50, transparent)`,
          }}
        />

        {/* Label and value */}
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-white/80">{label}</h4>
          <span className="text-xl font-light tracking-tight" style={{ color }}>
            {rawValue}
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative h-2 bg-white/[0.06] rounded-full overflow-hidden mb-3">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1.2, delay: delay + 0.2, ease: 'easeOut' }}
          />
        </div>

        {/* Status and description */}
        <div className="flex items-center justify-between">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              color: statusLabel.color,
              backgroundColor: `${statusLabel.color}20`,
            }}
          >
            {statusLabel.text}
          </span>
          <span className="text-[11px] text-white/30">{description}</span>
        </div>
      </div>
    </motion.div>
  );
}

// Custom tooltip for charts
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-[#0d1421]/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl">
      <p className="text-xs text-white/50 mb-2">{label}</p>
      {payload.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-sm text-white/80">{item.name}:</span>
          <span className="text-sm font-medium text-white">
            {typeof item.value === 'number' ? item.value.toFixed(2) : item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DataLogPage() {
  const {
    currentView,
    setCurrentView,
    hourlyData,
    dailyData,
    currentConditions,
    agingDepth,
    setAgingDepth,
    isLoading,
    error,
    fetchOceanData,
    fetchCurrentConditions,
    clearError,
  } = useOceanDataStore();

  const [showViewDropdown, setShowViewDropdown] = useState(false);
  // 3개월 단위 기간 오프셋 (0=현재, 1=3개월 전, 2=6개월 전, ...)
  const [periodOffset, setPeriodOffset] = useState(0);

  // 기간 범위 계산
  const periodRange = useMemo(() => {
    const end = new Date();
    end.setDate(end.getDate() - periodOffset * 90);
    const start = new Date(end);
    start.setDate(start.getDate() - 90);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      label: `${start.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} ~ ${end.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}`,
      isLatest: periodOffset === 0,
    };
  }, [periodOffset]);

  // Initial data fetch
  useEffect(() => {
    fetchCurrentConditions();
    fetchOceanData();
  }, [fetchCurrentConditions, fetchOceanData]);

  // UAPS coefficients calculation
  const uapsCoeffs = useMemo(() => {
    if (!currentConditions?.seaTemperature) return null;
    const fri = calculateLiveFRI(currentConditions.seaTemperature);
    const bri = calculateLiveBRI(
      currentConditions.seaTemperature,
      currentConditions.waterPressure || 4
    );
    const kTci = calculateLiveKTCI(currentConditions.tidalCurrentSpeed || 0);
    // TSI: 최근 30일 수온 데이터 필요
    const recentTemps = dailyData
      .slice(0, 30)
      .map((d) => d.seaTemperatureAvg)
      .filter((v): v is number => v !== null);
    const tsi = calculateLiveTSI(recentTemps, 50);
    const overallScore = calculateOverallScore(fri, bri, kTci, tsi);
    return { fri, bri, kTci, tsi, overallScore };
  }, [currentConditions, dailyData]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return [...dailyData].reverse().map((day) => ({
      date: day.date.slice(5), // MM-DD format
      fullDate: day.date,
      수온: day.seaTemperatureAvg,
      염분: day.salinity,
      조위: day.tideLevelAvg,
      조류유속: day.tidalCurrentSpeed,
      해류속도: day.currentVelocityAvg,
      파고: day.waveHeightAvg,
      파주기: day.wavePeriodAvg,
      기압: day.surfacePressureAvg,
      수압: calculateWaterPressure(day.depth, day.surfacePressureAvg || undefined),
      FRI: day.seaTemperatureAvg
        ? calculateLiveFRI(day.seaTemperatureAvg)
        : null,
      BRI:
        day.seaTemperatureAvg
          ? calculateLiveBRI(
              day.seaTemperatureAvg,
              calculateWaterPressure(day.depth, day.surfacePressureAvg || undefined)
            )
          : null,
    }));
  }, [dailyData]);

  const handleRefresh = () => {
    fetchCurrentConditions();
    fetchOceanData();
  };

  const currentViewOption = VIEW_OPTIONS.find((v) => v.value === currentView);

  // 데이터 소스 상태 표시
  const dataSourceLabel = useMemo(() => {
    const latestSource = dailyData[0]?.dataSource;
    const lastUpdated = currentConditions?.lastUpdated;
    let timeStr = '';
    if (lastUpdated) {
      // "2026-03-14 13:00" or ISO → 시:분 추출
      const match = lastUpdated.match(/(\d{2}):(\d{2})/);
      timeStr = match ? `${match[1]}:${match[2]}` : '';
    }
    return { latestSource, timeStr };
  }, [dailyData, currentConditions]);

  return (
    <div className="min-h-screen pb-20">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0d1525] to-[#0a0f1a]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(183, 145, 110, 0.12), transparent),
                              radial-gradient(ellipse 60% 40% at 20% 80%, rgba(6, 182, 212, 0.06), transparent),
                              radial-gradient(ellipse 50% 30% at 80% 50%, rgba(34, 211, 238, 0.08), transparent)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative pt-8 sm:pt-16 pb-6 sm:pb-12 px-4 sm:px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative"
          >
            {/* Decorative Line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="hidden sm:block absolute -left-6 top-1/2 w-16 h-px bg-gradient-to-r from-[#b7916e] to-transparent origin-left"
            />

            <div className="sm:pl-14 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-[#b7916e] text-[10px] sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-2 sm:mb-4 font-light"
                >
                  Ocean Data Log
                </motion.p>

                <h1
                  className="text-3xl sm:text-5xl lg:text-6xl text-white/95 mb-2 sm:mb-6 leading-[1.1] tracking-tight"
                  style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                >
                  <span className="sm:block inline">Deep Sea </span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b7916e] via-[#d4c4a8] to-[#b7916e]">
                    Observatory
                  </span>
                </h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.8 }}
                  className="text-white/40 text-sm sm:text-lg max-w-md font-light leading-relaxed flex items-center gap-2"
                >
                  <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  {WANDO_COORDINATES.name} ({WANDO_COORDINATES.latitude}°N, {WANDO_COORDINATES.longitude}°E)
                </motion.p>

                {/* 데이터 소스 상태 표시 */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 1.0 }}
                  className="mt-2 flex items-center gap-3 text-[11px] text-white/30 font-mono"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
                    KHOA 완도(DT_0027)
                    {dataSourceLabel.latestSource === 'hybrid' || dataSourceLabel.latestSource === 'khoa'
                      ? ' 실시간'
                      : ''}
                  </span>
                  <span className="text-white/15">|</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60" />
                    Open-Meteo 보조
                  </span>
                  {dataSourceLabel.timeStr && (
                    <>
                      <span className="text-white/15">|</span>
                      <span>마지막 갱신: {dataSourceLabel.timeStr}</span>
                    </>
                  )}
                </motion.div>
              </div>

              <div className="flex items-center gap-3">
                {/* View selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowViewDropdown(!showViewDropdown)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/[0.08] transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-white/50" />
                    <span className="text-sm text-white/80">{currentViewOption?.label}</span>
                    <span className="text-xs text-white/40">({currentViewOption?.days})</span>
                    <ChevronDown className="w-4 h-4 text-white/40" />
                  </button>

                  <AnimatePresence>
                    {showViewDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 w-48 bg-[#0d1421] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-10"
                      >
                        {VIEW_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setCurrentView(option.value);
                              setShowViewDropdown(false);
                            }}
                            className={`w-full px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors flex justify-between items-center ${
                              currentView === option.value
                                ? 'text-cyan-400 bg-cyan-500/10'
                                : 'text-white/70'
                            }`}
                          >
                            <span>{option.label}</span>
                            <span className="text-white/30 text-xs">{option.days}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Period navigation (3개월 단위 이동) */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPeriodOffset((p) => p + 1)}
                    className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/[0.08] transition-colors"
                    title="이전 3개월"
                  >
                    <ChevronLeft className="w-4 h-4 text-white/50" />
                  </button>
                  <span className="text-xs text-white/40 px-2 min-w-[140px] text-center">
                    {periodRange.label}
                  </span>
                  <button
                    onClick={() => setPeriodOffset((p) => Math.max(0, p - 1))}
                    disabled={periodRange.isLatest}
                    className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/[0.08] transition-colors disabled:opacity-30"
                    title="다음 3개월"
                  >
                    <ChevronRight className="w-4 h-4 text-white/50" />
                  </button>
                </div>

                {/* Refresh button */}
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/[0.08] transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 text-white/50 ${isLoading ? 'animate-spin' : ''}`}
                  />
                </button>
              </div>
            </div>

            {/* Error display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center justify-between"
              >
                <span>{error}</span>
                <button onClick={clearError} className="text-red-400/60 hover:text-red-400">
                  ✕
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">

          {/* ── 실시간 상태 카드 (9개) ── */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-10">
            {/* Mobile Depth indicator */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="sm:hidden bg-[#0d1421]/60 backdrop-blur-xl border border-white/[0.06] rounded-xl p-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-cyan-500/10 rounded-lg">
                    <Anchor className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className="text-xs text-white/50 uppercase tracking-wider">숙성 깊이</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(agingDepth / 60) * 100}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-lg font-light text-cyan-400 font-mono">{agingDepth}m</span>
                </div>
              </div>
            </motion.div>

            {/* Desktop Depth gauge */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="hidden sm:flex bg-[#0d1421]/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-4"
            >
              <DepthGauge depth={Math.max(...DEPLOYED_DEPTHS)} />
            </motion.div>

            {/* Data cards grid — 9개 */}
            <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              <DataCard
                icon={Thermometer}
                label="수온"
                value={currentConditions?.seaTemperature?.toFixed(1) ?? null}
                unit="°C"
                color="#22d3ee"
                delay={0.1}
              />
              <DataCard
                icon={Droplets}
                label="염분"
                value={currentConditions?.salinity?.toFixed(1) ?? null}
                unit="psu"
                color="#34d399"
                delay={0.15}
              />
              <DataCard
                icon={Anchor}
                label="조위"
                value={currentConditions?.tideLevel?.toFixed(0) ?? null}
                unit="cm"
                color="#818cf8"
                delay={0.2}
              />
              <DataCard
                icon={Gauge}
                label="기압"
                value={currentConditions?.surfacePressure?.toFixed(0) ?? null}
                unit="hPa"
                color="#f472b6"
                delay={0.25}
              />
              <DataCard
                icon={Activity}
                label="수압"
                value={currentConditions?.waterPressure?.toFixed(2) ?? null}
                unit="atm"
                color="#fb923c"
                delay={0.3}
              />
              <DataCard
                icon={Navigation2}
                label="조류 유속"
                value={currentConditions?.tidalCurrentSpeed?.toFixed(1) ?? null}
                unit="cm/s"
                color="#c084fc"
                delay={0.35}
              />
              <DataCard
                icon={Waves}
                label="파고"
                value={currentConditions?.waveHeight?.toFixed(1) ?? null}
                unit="m"
                color="#60a5fa"
                delay={0.4}
              />
              <DataCard
                icon={Timer}
                label="파주기"
                value={currentConditions?.wavePeriod?.toFixed(1) ?? null}
                unit="s"
                color="#fbbf24"
                delay={0.45}
              />
              <DataCard
                icon={TrendingUp}
                label="숙성 점수"
                value={uapsCoeffs?.overallScore ?? null}
                unit="/100"
                color="#C4A052"
                delay={0.5}
              />
            </div>
          </div>

          {/* ── UAPS 숙성 보정계수 (4개 게이지) ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-[#C4A052]/10 rounded-xl">
                <TrendingUp className="w-5 h-5 text-[#C4A052]" />
              </div>
              <h2 className="text-lg font-medium text-white/90">UAPS 숙성 보정계수</h2>
              {uapsCoeffs && (
                <span
                  className="ml-auto text-sm font-medium px-3 py-1 rounded-full"
                  style={{
                    color: getOverallLabel(uapsCoeffs.overallScore).color,
                    backgroundColor: `${getOverallLabel(uapsCoeffs.overallScore).color}20`,
                  }}
                >
                  종합 {uapsCoeffs.overallScore}/100 {getOverallLabel(uapsCoeffs.overallScore).text}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <CoefficientGauge
                label="FRI 향 보존"
                value={uapsCoeffs?.fri ?? null}
                rawValue={uapsCoeffs?.fri !== undefined ? (uapsCoeffs?.fri ?? 0).toFixed(2) : '—'}
                description={
                  currentConditions?.seaTemperature
                    ? `수온 ${currentConditions.seaTemperature.toFixed(1)}°C 기반`
                    : '데이터 없음'
                }
                statusLabel={getFRILabel(uapsCoeffs?.fri ?? NaN)}
                color="#22d3ee"
                delay={0.55}
              />
              <CoefficientGauge
                label="BRI 기포 보존"
                value={uapsCoeffs?.bri ?? null}
                rawValue={uapsCoeffs?.bri !== undefined ? (uapsCoeffs?.bri ?? 0).toFixed(2) : '—'}
                description={
                  currentConditions?.waterPressure
                    ? `수압 ${currentConditions.waterPressure.toFixed(1)}atm 기반`
                    : '데이터 없음'
                }
                statusLabel={getBRILabel(uapsCoeffs?.bri ?? NaN)}
                color="#60a5fa"
                delay={0.6}
              />
              <CoefficientGauge
                label="K-TCI 질감"
                value={uapsCoeffs?.kTci ?? null}
                rawValue={uapsCoeffs?.kTci !== undefined ? (uapsCoeffs?.kTci ?? 0).toFixed(2) : '—'}
                description={
                  currentConditions?.tidalCurrentSpeed != null
                    ? `조류 ${currentConditions.tidalCurrentSpeed.toFixed(1)}cm/s 기반`
                    : '데이터 없음'
                }
                statusLabel={getKTCILabel(uapsCoeffs?.kTci ?? NaN)}
                color="#c084fc"
                delay={0.65}
              />
              <CoefficientGauge
                label="TSI 온도 안정성"
                value={uapsCoeffs?.tsi ?? null}
                rawValue={uapsCoeffs?.tsi !== undefined ? (uapsCoeffs?.tsi ?? 0).toFixed(2) : '—'}
                description={`최근 ${Math.min(dailyData.length, 30)}일 기준`}
                statusLabel={getTSILabel(uapsCoeffs?.tsi ?? NaN)}
                color="#34d399"
                delay={0.7}
              />
            </div>
          </motion.div>

          {/* ── 시계열 차트 (8개) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* 1. 수온 변화 */}
            <ChartWrapper title="수온 변화" icon={Thermometer} iconColor="#22d3ee" delay={0.4}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="date" stroke="#ffffff30" tick={{ fill: '#ffffff50', fontSize: 11 }} />
                  <YAxis stroke="#ffffff30" tick={{ fill: '#ffffff50', fontSize: 11 }} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="수온" stroke="#22d3ee" strokeWidth={2} fill="url(#tempGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartWrapper>

            {/* 2. 염분 변화 */}
            <ChartWrapper title="염분 변화" icon={Droplets} iconColor="#34d399" delay={0.45}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="salinityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="date" stroke="#ffffff30" tick={{ fill: '#ffffff50', fontSize: 11 }} />
                  <YAxis stroke="#ffffff30" tick={{ fill: '#ffffff50', fontSize: 11 }} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="염분" stroke="#34d399" strokeWidth={2} fill="url(#salinityGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartWrapper>

            {/* 3. 조위 변화 */}
            <ChartWrapper title="조위 변화" icon={Anchor} iconColor="#818cf8" delay={0.5}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="tideGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="date" stroke="#ffffff30" tick={{ fill: '#ffffff50', fontSize: 11 }} />
                  <YAxis stroke="#ffffff30" tick={{ fill: '#ffffff50', fontSize: 11 }} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="조위" stroke="#818cf8" strokeWidth={2} fill="url(#tideGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartWrapper>

            {/* 4. 조류 유속 */}
            <ChartWrapper title="조류 유속" icon={Navigation2} iconColor="#c084fc" delay={0.55}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <defs>
                    <linearGradient id="tidalCurrentGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c084fc" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#c084fc" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="date" stroke="#ffffff30" tick={{ fill: '#ffffff50', fontSize: 11 }} />
                  <YAxis stroke="#ffffff30" tick={{ fill: '#ffffff50', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="조류유속"
                    fill="url(#tidalCurrentGradient)"
                    stroke="#c084fc"
                    strokeWidth={1}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartWrapper>

            {/* 5. 기압 / 수압 */}
            <ChartWrapper title="기압 / 수압" icon={Gauge} iconColor="#f472b6" delay={0.6}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="date" stroke="#ffffff30" tick={{ fill: '#ffffff50', fontSize: 11 }} />
                  <YAxis
                    yAxisId="left"
                    stroke="#ffffff30"
                    tick={{ fill: '#ffffff50', fontSize: 11 }}
                    domain={['auto', 'auto']}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#ffffff30"
                    tick={{ fill: '#ffffff50', fontSize: 11 }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: 10 }}
                    formatter={(value: string) => (
                      <span className="text-white/60 text-xs">{value}</span>
                    )}
                  />
                  <Line yAxisId="left" type="monotone" dataKey="기압" stroke="#f472b6" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="수압" stroke="#fb923c" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartWrapper>

            {/* 6. 파고 변화 */}
            <ChartWrapper title="파고 변화" icon={Waves} iconColor="#60a5fa" delay={0.65}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="date" stroke="#ffffff30" tick={{ fill: '#ffffff50', fontSize: 11 }} />
                  <YAxis stroke="#ffffff30" tick={{ fill: '#ffffff50', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="파고" stroke="#60a5fa" strokeWidth={2} fill="url(#waveGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartWrapper>

            {/* 7. 파주기 변화 */}
            <ChartWrapper title="파주기 변화" icon={Timer} iconColor="#fbbf24" delay={0.7}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="wavePeriodGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="date" stroke="#ffffff30" tick={{ fill: '#ffffff50', fontSize: 11 }} />
                  <YAxis stroke="#ffffff30" tick={{ fill: '#ffffff50', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="파주기" stroke="#fbbf24" strokeWidth={2} fill="url(#wavePeriodGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartWrapper>

            {/* 8. FRI/BRI 추이 */}
            <ChartWrapper title="FRI / BRI 추이" icon={TrendingUp} iconColor="#C4A052" delay={0.75}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="date" stroke="#ffffff30" tick={{ fill: '#ffffff50', fontSize: 11 }} />
                  <YAxis stroke="#ffffff30" tick={{ fill: '#ffffff50', fontSize: 11 }} domain={[0, 1]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: 10 }}
                    formatter={(value: string) => (
                      <span className="text-white/60 text-xs">{value}</span>
                    )}
                  />
                  <Line type="monotone" dataKey="FRI" stroke="#22d3ee" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="BRI" stroke="#60a5fa" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartWrapper>

          </div>

          {/* Location info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-10 text-center"
          >
            <p className="text-xs text-white/20 font-mono">
              DATA SOURCE: KHOA + OPEN-METEO MARINE API | REFRESH: MANUAL | DEPTH: {agingDepth}M
            </p>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
