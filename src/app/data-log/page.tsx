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
  Plus,
  ChevronDown,
  Anchor,
  ArrowDown,
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

// Depth gauge visualization
function DepthGauge({ depth, maxDepth = 30 }: { depth: number; maxDepth?: number }) {
  const percentage = (depth / maxDepth) * 100;

  return (
    <div className="relative h-full w-12 flex flex-col items-center">
      {/* Gauge track */}
      <div className="relative flex-1 w-3 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="absolute bottom-0 w-full bg-gradient-to-t from-cyan-500 via-cyan-400 to-teal-300"
          initial={{ height: 0 }}
          animate={{ height: `${percentage}%` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
        {/* Depth markers */}
        {[0, 10, 20, 30].map((mark) => (
          <div
            key={mark}
            className="absolute w-full h-px bg-white/20"
            style={{ bottom: `${(mark / maxDepth) * 100}%` }}
          />
        ))}
      </div>
      {/* Current depth indicator */}
      <motion.div
        className="absolute right-6 flex items-center gap-1"
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
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  delay?: number;
}) {
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
          <div className="p-2 bg-cyan-500/10 rounded-xl">
            <Icon className="w-5 h-5 text-cyan-400" />
          </div>
          <h3 className="text-lg font-medium text-white/90">{title}</h3>
        </div>

        {/* Chart */}
        <div className="h-64">{children}</div>
      </div>
    </motion.div>
  );
}

// Salinity input modal
function SalinityModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (salinity: number, notes?: string) => void;
}) {
  const [salinity, setSalinity] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(salinity);
    if (!isNaN(value) && value >= 0 && value <= 50) {
      onSubmit(value, notes || undefined);
      setSalinity('');
      setNotes('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#0d1421] border border-white/[0.08] rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-teal-500/10 rounded-xl">
                <Droplets className="w-5 h-5 text-teal-400" />
              </div>
              <h2 className="text-xl font-medium text-white">염도 기록</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-white/50 mb-2">
                  염도 (‰)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={salinity}
                  onChange={(e) => setSalinity(e.target.value)}
                  placeholder="예: 34.5"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-teal-500/50 transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm text-white/50 mb-2">
                  메모 (선택)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="측정 조건, 위치 등"
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-teal-500/50 transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-white/10 rounded-xl text-white/60 hover:bg-white/5 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-teal-500 rounded-xl text-white font-medium hover:bg-teal-400 transition-colors"
                >
                  저장
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
          <span className="text-sm font-medium text-white">{item.value}</span>
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
    addSalinityRecord,
    clearError,
  } = useOceanDataStore();

  const [showSalinityModal, setShowSalinityModal] = useState(false);
  const [showViewDropdown, setShowViewDropdown] = useState(false);

  const { loadSalinityRecords } = useOceanDataStore();

  // Initial data fetch
  useEffect(() => {
    loadSalinityRecords();
    fetchCurrentConditions();
    fetchOceanData();
  }, [loadSalinityRecords, fetchCurrentConditions, fetchOceanData]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return dailyData.map((day) => ({
      date: day.date.slice(5), // MM-DD format
      fullDate: day.date,
      수온: day.seaTemperatureAvg,
      해류속도: day.currentVelocityAvg,
      파고: day.waveHeightAvg,
      기압: day.surfacePressureAvg,
      수압: calculateWaterPressure(day.depth, day.surfacePressureAvg || undefined),
      염도: day.salinity,
    })).reverse(); // Chronological order
  }, [dailyData]);

  const handleRefresh = () => {
    fetchCurrentConditions();
    fetchOceanData();
  };

  const handleSalinitySubmit = (salinity: number, notes?: string) => {
    addSalinityRecord(salinity, agingDepth, notes);
  };

  const currentViewOption = VIEW_OPTIONS.find((v) => v.value === currentView);

  return (
    <div className="min-h-screen pb-20">
      {/* Ambient Background - Same as other pages */}
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

      {/* Hero Section - Same style as other pages */}
      <section className="relative pt-8 sm:pt-16 pb-6 sm:pb-12 px-4 sm:px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative"
          >
            {/* Decorative Line - Hidden on Mobile */}
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

              {/* Salinity input button */}
              <button
                onClick={() => setShowSalinityModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-400 hover:bg-teal-500/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">염도 기록</span>
              </button>

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
        {/* Current Conditions Grid */}
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
                    animate={{ width: `${(agingDepth / 30) * 100}%` }}
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
            <DepthGauge depth={agingDepth} />
          </motion.div>

          {/* Data cards */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <DataCard
              icon={Thermometer}
              label="수온"
              value={currentConditions?.seaTemperature?.toFixed(1) ?? null}
              unit="°C"
              color={OCEAN_DATA_LABELS.seaTemperature.color}
              delay={0.1}
            />
            <DataCard
              icon={Wind}
              label="해류 속도"
              value={currentConditions?.currentVelocity?.toFixed(2) ?? null}
              unit="m/s"
              color={OCEAN_DATA_LABELS.currentVelocity.color}
              delay={0.15}
            />
            <DataCard
              icon={Waves}
              label="파고"
              value={currentConditions?.waveHeight?.toFixed(1) ?? null}
              unit="m"
              color={OCEAN_DATA_LABELS.waveHeight.color}
              delay={0.2}
            />
            <DataCard
              icon={Gauge}
              label="기압"
              value={currentConditions?.surfacePressure?.toFixed(0) ?? null}
              unit="hPa"
              color={OCEAN_DATA_LABELS.surfacePressure.color}
              delay={0.25}
            />
            <DataCard
              icon={Activity}
              label="수압"
              value={currentConditions?.waterPressure?.toFixed(2) ?? null}
              unit="atm"
              color={OCEAN_DATA_LABELS.waterPressure.color}
              delay={0.3}
            />
            <DataCard
              icon={Droplets}
              label="염도"
              value={currentConditions?.salinity?.toFixed(1) ?? null}
              unit="‰"
              color={OCEAN_DATA_LABELS.salinity.color}
              delay={0.35}
            />
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Temperature Chart */}
          <ChartWrapper title="수온 변화" icon={Thermometer} delay={0.4}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis
                  dataKey="date"
                  stroke="#ffffff30"
                  tick={{ fill: '#ffffff50', fontSize: 11 }}
                />
                <YAxis
                  stroke="#ffffff30"
                  tick={{ fill: '#ffffff50', fontSize: 11 }}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="수온"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  fill="url(#tempGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartWrapper>

          {/* Current Velocity Chart */}
          <ChartWrapper title="해류 속도" icon={Wind} delay={0.5}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="currentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis
                  dataKey="date"
                  stroke="#ffffff30"
                  tick={{ fill: '#ffffff50', fontSize: 11 }}
                />
                <YAxis
                  stroke="#ffffff30"
                  tick={{ fill: '#ffffff50', fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="해류속도"
                  fill="url(#currentGradient)"
                  stroke="#a78bfa"
                  strokeWidth={1}
                  radius={[4, 4, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartWrapper>

          {/* Wave Height Chart */}
          <ChartWrapper title="파고 변화" icon={Waves} delay={0.6}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis
                  dataKey="date"
                  stroke="#ffffff30"
                  tick={{ fill: '#ffffff50', fontSize: 11 }}
                />
                <YAxis
                  stroke="#ffffff30"
                  tick={{ fill: '#ffffff50', fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="파고"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  fill="url(#waveGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartWrapper>

          {/* Pressure Chart */}
          <ChartWrapper title="기압 / 수압" icon={Gauge} delay={0.7}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis
                  dataKey="date"
                  stroke="#ffffff30"
                  tick={{ fill: '#ffffff50', fontSize: 11 }}
                />
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
                  formatter={(value) => (
                    <span className="text-white/60 text-xs">{value}</span>
                  )}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="기압"
                  stroke="#f472b6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="수압"
                  stroke="#fb923c"
                  strokeWidth={2}
                  dot={false}
                />
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
            DATA SOURCE: OPEN-METEO MARINE API • REFRESH INTERVAL: MANUAL • DEPTH: {agingDepth}M
          </p>
        </motion.div>
        </div>
      </section>

      {/* Salinity Modal */}
      <SalinityModal
        isOpen={showSalinityModal}
        onClose={() => setShowSalinityModal(false)}
        onSubmit={handleSalinitySubmit}
      />
    </div>
  );
}
