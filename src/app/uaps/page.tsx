'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
} from 'recharts';
import {
  Anchor,
  Wine,
  Brain,
  Plus,
  X,
  Trash2,
  Pencil,
  Loader2,
  AlertTriangle,
  Settings2,
  Play,
  RefreshCw,
  Sparkles,
  Target,
  Database,
  Gauge,
  Save,
  BarChart3,
  Info,
  LayoutGrid,
  ChevronDown,
} from 'lucide-react';

// 카테고리 목록
const UAPS_CATEGORIES = [
  { slug: 'champagne',  label: '샴페인',      emoji: '🥂', color: '#C4A052', href: '/uaps' },
  { slug: 'red-wine',   label: '레드와인',    emoji: '🍷', color: '#9f1239', href: '/uaps/red-wine' },
  { slug: 'white-wine', label: '화이트와인',  emoji: '🍾', color: '#ca8a04', href: '/uaps/white-wine' },
  { slug: 'whisky',     label: '위스키',      emoji: '🥃', color: '#d97706', href: '/uaps/whisky' },
  { slug: 'soy-sauce',  label: '간장',        emoji: '🫙', color: '#92400e', href: '/uaps/soy-sauce' },
  { slug: 'vinegar',    label: '식초',        emoji: '🍶', color: '#10b981', href: '/uaps/vinegar' },
  { slug: 'cold-brew',  label: '콜드브루',    emoji: '☕', color: '#f97316', href: '/uaps/cold-brew' },
  { slug: 'spirits',    label: '소주',        emoji: '🍵', color: '#06b6d4', href: '/uaps/spirits' },
  { slug: 'yakju',      label: '전통주',      emoji: '🍚', color: '#84cc16', href: '/uaps/yakju' },
  { slug: 'puerh',      label: '보이차',      emoji: '🫖', color: '#f43f5e', href: '/uaps/puerh' },
];

// slug → DB product_category 매핑 (DB 실제값 기준)
const UAPS_CATEGORY_DB: Record<string, string> = {
  'champagne':  'champagne',
  'red-wine':   'red_wine',
  'white-wine': 'white_wine',
  'whisky':     'whisky',
  'soy-sauce':  'soy_sauce',
  'vinegar':    'vinegar',
  'cold-brew':  'coldbrew',
  'spirits':    'spirits',
  'yakju':      'spirits',
  'puerh':      'puer',
};

import { useUAPSStore } from '@/lib/store/uaps-store';
import type {
  AgingProduct,
  ProductInput,
  WineType,
  ReductionPotential,
  ReductionCheckItem,
} from '@/lib/types/uaps';
import {
  WINE_TYPE_LABELS,
  PRODUCT_STATUS_LABELS,
  PRODUCT_STATUS_COLORS,
  REDUCTION_POTENTIAL_LABELS,
  MODEL_STATUS_LABELS,
  FLAVOR_AXES,
  CATEGORY_SUBTYPES,
  CATEGORY_REDUCTION_CHECKLIST,
  CATEGORY_FIELD_CONFIG,
} from '@/lib/types/uaps';
import {
  generateTimelineData,
  calculateOptimalHarvestWindow,
  findSimilarClusters,
  predictFlavorProfileStatistical,
} from '@/lib/utils/uaps-engine';
import { applyAgingAdjustments } from '@/lib/utils/uaps-ai-predictor';

// ═══════════════════════════════════════════════════════════════════════════
// 공통 컴포넌트
// ═══════════════════════════════════════════════════════════════════════════

function GlowCard({
  children,
  className = '',
  color = 'cyan',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  color?: 'cyan' | 'rose' | 'amber' | 'emerald';
  delay?: number;
}) {
  const glowColors = {
    cyan: 'from-cyan-500/[0.03]',
    rose: 'from-[#B76E79]/[0.03]',
    amber: 'from-[#C4A052]/[0.03]',
    emerald: 'from-emerald-500/[0.03]',
  };
  const stripColors = {
    cyan: 'via-cyan-400/40',
    rose: 'via-[#B76E79]/40',
    amber: 'via-[#C4A052]/40',
    emerald: 'via-emerald-400/40',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative group"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${glowColors[color]} to-transparent rounded-2xl blur-xl group-hover:opacity-150 transition-all`} />
      <div className={`relative bg-[#0d1421]/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.12] transition-all ${className}`}>
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent ${stripColors[color]} to-transparent`} />
        {children}
      </div>
    </motion.div>
  );
}

function SectionWrapper({
  title,
  icon: Icon,
  children,
  delay = 0,
  action,
  iconColor = '#22d3ee',
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  children: React.ReactNode;
  delay?: number;
  action?: React.ReactNode;
  iconColor?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.02] to-transparent rounded-3xl" />
      <div className="relative bg-[#0d1421]/40 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ backgroundColor: `${iconColor}15` }}>
              <Icon className="w-5 h-5" style={{ color: iconColor }} />
            </div>
            <h3 className="text-lg font-medium text-white/90">{title}</h3>
          </div>
          {action}
        </div>
        {children}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 메인 페이지
// ═══════════════════════════════════════════════════════════════════════════

export default function UAPSPage() {
  const {
    agingProducts,
    selectedProductId,
    predictions,
    latestPrediction,
    modelStatus,
    modelLastTrained,
    modelDataCount,
    modelGroupCount,
    terrestrialModels,
    config,
    isLoading,
    isTraining,
    isPredicting,
    error,
    loadAgingProducts,
    addAgingProduct,
    editAgingProduct,
    removeAgingProduct,
    selectProduct,
    loadPredictions,
    runPrediction,
    loadModelStatus,
    trainModel,
    loadConfig,
    updateCoefficient,
    clearError,
  } = useUAPSStore();

  useEffect(() => {
    loadAgingProducts();
    loadModelStatus();
    loadConfig();
    loadPredictions();
  }, [loadAgingProducts, loadModelStatus, loadConfig, loadPredictions]);

  const selectedProduct = useMemo(
    () => agingProducts.find((p) => p.id === selectedProductId) ?? null,
    [agingProducts, selectedProductId]
  );

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AgingProduct | null>(null);
  const [showCoefficientDialog, setShowCoefficientDialog] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [listCategory, setListCategory] = useState('champagne');
  // predictionMonths는 제품의 plannedDurationMonths 사용

  const [localTci, setLocalTci] = useState(config.tci);
  const [localFri, setLocalFri] = useState(config.fri);
  const [localBri, setLocalBri] = useState(config.bri);

  useEffect(() => {
    setLocalTci(config.tci);
    setLocalFri(config.fri);
    setLocalBri(config.bri);
  }, [config.tci, config.fri, config.bri]);

  const timelineData = useMemo(() => {
    if (!selectedProduct) return [];
    return generateTimelineData(selectedProduct, config);
  }, [selectedProduct, config]);

  const harvestWindow = useMemo(() => {
    if (!selectedProduct) return null;
    return calculateOptimalHarvestWindow(selectedProduct, config);
  }, [selectedProduct, config]);

  const beforeProfile = useMemo(() => {
    // 1순위: AI 예측에서 생성된 전문가 프로파일
    if (latestPrediction?.expertProfileJson) {
      return latestPrediction.expertProfileJson;
    }
    // 2순위: 기존 통계 기반
    if (!selectedProduct || terrestrialModels.length === 0) return null;
    const clusters = findSimilarClusters(selectedProduct, terrestrialModels);
    if (clusters.length === 0) return null;
    return predictFlavorProfileStatistical(clusters, 0, config, selectedProduct);
  }, [selectedProduct, terrestrialModels, config, latestPrediction]);

  const afterProfile = useMemo(() => {
    if (!selectedProduct) return null;
    const months = selectedProduct.plannedDurationMonths;
    if (!months) return null;

    // 전문가 프로파일이 있으면 TCI/FRI 보정만 적용
    if (beforeProfile && latestPrediction?.expertProfileJson) {
      return applyAgingAdjustments(beforeProfile, months, config);
    }

    // 통계 기반 폴백
    if (terrestrialModels.length === 0) return null;
    const clusters = findSimilarClusters(selectedProduct, terrestrialModels);
    if (clusters.length === 0) return null;
    return predictFlavorProfileStatistical(clusters, months, config, selectedProduct);
  }, [selectedProduct, terrestrialModels, config, beforeProfile, latestPrediction]);

  const handleSaveCoefficients = useCallback(async () => {
    if (localTci !== config.tci) await updateCoefficient('tci_coefficient', localTci);
    if (localFri !== config.fri) await updateCoefficient('fri_coefficient', localFri);
    if (localBri !== config.bri) await updateCoefficient('bri_coefficient', localBri);
  }, [localTci, localFri, localBri, config.tci, config.fri, config.bri, updateCoefficient]);

  return (
    <div className="min-h-screen pb-20">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0d1525] to-[#0a0f1a]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(6, 182, 212, 0.12), transparent),
                              radial-gradient(ellipse 60% 40% at 20% 80%, rgba(183, 145, 110, 0.06), transparent),
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

      {/* 에러 배너 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 bg-red-500/20 border border-red-500/40 text-red-300 px-4 sm:px-5 py-3 rounded-xl backdrop-blur-md flex items-center gap-3 sm:max-w-lg"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="text-sm">{error}</span>
            <button onClick={clearError} className="ml-2 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Hero Section */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="relative pt-8 sm:pt-16 pb-6 sm:pb-10 px-4 sm:px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="hidden sm:block absolute -left-6 top-1/2 w-16 h-px bg-gradient-to-r from-cyan-400 to-transparent origin-left"
            />

            <div className="sm:pl-14">
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-cyan-400/70 text-[10px] sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-2 sm:mb-4 font-light"
              >
                Undersea Aging Predictive System
              </motion.p>

              <h1
                className="text-3xl sm:text-5xl lg:text-6xl text-white/95 mb-2 sm:mb-6 leading-[1.1] tracking-tight"
                style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
              >
                <span className="sm:block inline">Predictive </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-[#B76E79] to-cyan-400">
                  Intelligence
                </span>
              </h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="text-white/40 text-sm sm:text-lg max-w-lg font-light leading-relaxed"
              >
                2-Layer Hybrid AI가 해저 숙성의 풍미 변화를 과학적으로 예측합니다
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.1 }}
                className="mt-4 flex items-center gap-2"
              >
                {/* 카테고리 드롭다운 */}
                <div className="relative">
                  <button
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/[0.1] text-white/40 text-xs hover:bg-white/[0.04] hover:border-white/20 hover:text-white/60 transition-all duration-300"
                  >
                    <LayoutGrid className="w-3 h-3" />
                    카테고리
                    <ChevronDown className={`w-2.5 h-2.5 transition-transform duration-200 ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showCategoryDropdown && (
                      <>
                        {/* 배경 오버레이 */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowCategoryDropdown(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 top-full mt-2 z-50 bg-[#0d1421]/95 border border-white/[0.08] rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden min-w-[160px]"
                        >
                          <div className="p-1.5">
                            <p className="text-[9px] text-white/25 uppercase tracking-wider px-3 pt-1.5 pb-1">카테고리 예측</p>
                            {UAPS_CATEGORIES.map((cat) => (
                              <Link
                                key={cat.slug}
                                href={cat.href}
                                onClick={() => setShowCategoryDropdown(false)}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-colors group"
                              >
                                <div
                                  className="w-1.5 h-1.5 rounded-full shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                                  style={{ backgroundColor: cat.color }}
                                />
                                <span className="text-xs text-white/50 group-hover:text-white/80 transition-colors">
                                  {cat.label}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <Link
                  href="/uaps/how-it-works"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-cyan-400/20 text-cyan-400/60 text-xs hover:bg-cyan-400/[0.06] hover:border-cyan-400/30 hover:text-cyan-400/80 transition-all duration-300"
                >
                  <Info className="w-3 h-3" />
                  작동 원리
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Content Area */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 space-y-6">

        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {[
            { label: '등록 제품', value: agingProducts.length, unit: '개', icon: Wine, color: '#22d3ee' },
            { label: '예측 실행', value: predictions.length, unit: '회', icon: Brain, color: '#B76E79' },
            { label: '학습 데이터', value: modelDataCount.toLocaleString(), unit: '건', icon: Database, color: '#C4A052' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent rounded-2xl blur-xl group-hover:from-white/[0.12] transition-all" />
              <div className="relative bg-[#0d1421]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-2.5 sm:p-4 hover:border-white/[0.12] transition-all">
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${stat.color}40, transparent)` }}
                />
                {/* 모바일: 아이콘+숫자 수직 컴팩트, 데스크톱: 기존 레이아웃 */}
                <div className="flex flex-col items-center sm:items-start">
                  <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl mb-1.5 sm:mb-3" style={{ backgroundColor: `${stat.color}15` }}>
                    <stat.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: stat.color }} />
                  </div>
                  <p className="text-[9px] sm:text-xs text-white/40 uppercase tracking-wider mb-0.5 sm:mb-1">{stat.label}</p>
                  <div className="flex items-baseline gap-0.5 sm:gap-1.5">
                    <span className="text-lg sm:text-2xl font-light tracking-tight" style={{ color: stat.color }}>
                      {stat.value}
                    </span>
                    <span className="text-[10px] sm:text-sm text-white/30">{stat.unit}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 숙성 제품 리스트 */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <SectionWrapper
          title="숙성 제품 리스트"
          icon={Anchor}
          iconColor="#22d3ee"
          delay={0.15}
          action={
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/80 hover:text-white font-medium rounded-xl px-4 py-2 text-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              추가
            </button>
          }
        >
          {/* 카테고리 필터 */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {UAPS_CATEGORIES.map((cat) => {
              const dbCat = UAPS_CATEGORY_DB[cat.slug] ?? cat.slug;
              return (
                <button
                  key={cat.slug}
                  onClick={() => setListCategory(dbCat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    listCategory === dbCat
                      ? 'border-white/20 bg-white/10 text-white'
                      : 'border-white/[0.06] bg-white/[0.02] text-white/40 hover:text-white/70 hover:border-white/10'
                  }`}
                  style={listCategory === dbCat ? { borderColor: cat.color + '60', color: cat.color, backgroundColor: cat.color + '12' } : {}}
                >
                  <span>{cat.emoji}</span>
                  {cat.label}
                </button>
              );
            })}
          </div>

          {(() => {
            const filtered = agingProducts.filter((p) => (p.productCategory ?? 'champagne') === listCategory);
            return isLoading && agingProducts.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-white/30">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              로딩 중...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Wine className="w-8 h-8 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">
                이 카테고리에 등록된 제품이 없습니다.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((product) => (
                <motion.div
                  key={product.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group"
                >
                  <div
                    onClick={() => selectProduct(product.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') selectProduct(product.id); }}
                    className={`w-full text-left border rounded-xl p-4 transition-all cursor-pointer ${
                      selectedProductId === product.id
                        ? 'border-cyan-400/50 bg-cyan-400/[0.06] shadow-[0_0_20px_rgba(34,211,238,0.08)]'
                        : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-white font-medium text-sm truncate pr-2">
                        {product.productName}
                      </h4>
                      <span
                        className={`text-[10px] font-medium whitespace-nowrap px-2 py-0.5 rounded-full ${
                          product.status === 'immersed'
                            ? 'bg-cyan-500/15 text-cyan-400'
                            : product.status === 'harvested'
                              ? 'bg-amber-500/15 text-amber-400'
                              : 'bg-white/[0.06] text-white/50'
                        }`}
                      >
                        {PRODUCT_STATUS_LABELS[product.status]}
                      </span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="space-y-1">
                        <p className="text-xs text-white/40">
                          {product.wineType
                            ? WINE_TYPE_LABELS[product.wineType]
                            : CATEGORY_SUBTYPES[product.productCategory]?.find(
                                (s) => s.value === String((product.reductionChecks as Record<string, unknown> | null)?._subtype ?? '')
                              )?.label ?? product.productCategory}
                          {product.vintage ? ` · ${product.vintage}` : ''}
                        </p>
                        <p className="text-xs text-white/30">
                          {product.agingDepth}m
                          {product.plannedDurationMonths ? ` · ${product.plannedDurationMonths}개월` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors"
                          aria-label="수정"
                          title="수정"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`"${product.productName}" 제품을 삭제하시겠습니까?`)) {
                              removeAgingProduct(product.id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
                          aria-label="삭제"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          );
          })()}

        </SectionWrapper>

      {/* 제품 추가/수정 모달 — 최상위 레벨에서 렌더링 */}
      <AnimatePresence>
        {(showModal || editingProduct) && (
          <ProductModal
            onClose={() => { setShowModal(false); setEditingProduct(null); }}
            initialData={editingProduct}
            initialCategory={editingProduct?.productCategory ?? listCategory}
            onSubmit={async (input) => {
              if (editingProduct) {
                await editAgingProduct(editingProduct.id, input);
                setEditingProduct(null);
              } else {
                const result = await addAgingProduct(input);
                if (result) setShowModal(false);
              }
            }}
          />
        )}
      </AnimatePresence>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 예측 시뮬레이터 + AI 인사이트 — 컴팩트 단일 행 */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {selectedProductId && selectedProduct && (
          <motion.div
            key="simulation-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            layout
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.02] to-transparent rounded-2xl" />
            <div className="relative bg-[#0d1421]/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden">
              {/* 상단 스트립 */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

              {/* 시뮬레이터 행 */}
              <div className="px-4 sm:px-5 py-3.5 border-b border-white/[0.04] space-y-3 sm:space-y-0">
                {/* 상단: 라벨 + 기간 + 버튼 */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                    <div className="p-1.5 rounded-lg bg-cyan-500/[0.08]">
                      <Target className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <span className="text-xs text-white/40 uppercase tracking-wider">Simulation</span>
                  </div>

                  {/* 숙성 기간 */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-white/25">기간</span>
                    <span className="text-sm font-light text-cyan-400 font-mono">
                      {selectedProduct.plannedDurationMonths ?? '—'}
                    </span>
                    <span className="text-[10px] text-white/20">개월</span>
                  </div>

                  <div className="flex-1" />

                  <button
                    onClick={() => setShowCoefficientDialog(true)}
                    className="p-2 sm:p-1.5 rounded-lg border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] text-white/30 hover:text-white/60 transition-all shrink-0"
                    title="보정 계수 설정"
                  >
                    <Settings2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  </button>
                  <button
                    onClick={() => runPrediction(selectedProductId, selectedProduct.plannedDurationMonths || 18)}
                    disabled={isPredicting || !selectedProduct.plannedDurationMonths}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500/90 to-cyan-400/90 text-black font-medium rounded-lg px-3.5 py-2 sm:py-1.5 text-xs hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    {isPredicting ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                    {isPredicting ? '분석 중' : 'AI 예측'}
                  </button>
                </div>

                {/* 품질 점수 — 모바일: 별도 행, 데스크톱: 인라인 */}
                {latestPrediction?.overallQualityScore != null && (
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    {[
                      { label: '종합', value: latestPrediction.overallQualityScore, color: '#C4A052' },
                      { label: '질감', value: latestPrediction.textureMaturityScore, color: '#34d399' },
                      { label: '향', value: latestPrediction.aromaFreshnessScore, color: '#22d3ee' },
                      { label: '환원취', value: latestPrediction.offFlavorRiskScore, color: '#f87171' },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-[10px] text-white/30">{s.label}</span>
                        <span className="text-xs font-mono font-medium" style={{ color: `${s.color}cc` }}>
                          {s.value != null ? Math.round(s.value) : '—'}
                        </span>
                      </div>
                    ))}
                    <span className="text-[9px] text-white/15 ml-1 font-mono">
                      ±{Math.round((1 - latestPrediction.predictionConfidence) * 100)}%
                    </span>
                  </div>
                )}
              </div>

              {/* AI 인사이트 행 */}
              {latestPrediction && (
                <div className="px-5 py-3 space-y-2">
                  {latestPrediction.aiInsightText ? (
                    <>
                      {/* 투하 전·후 2단 인사이트 */}
                      {latestPrediction.aiInsightText.includes('\n') ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {/* 투하 전 특징 */}
                          <div className="flex items-start gap-2">
                            <div className="p-1 rounded-md bg-cyan-400/[0.06] shrink-0 mt-0.5">
                              <Wine className="w-3 h-3 text-cyan-400/60" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] text-cyan-400/40 uppercase tracking-wider">Before</span>
                              <p className="text-[11px] text-white/50 leading-relaxed mt-0.5">
                                {latestPrediction.aiInsightText.split('\n')[0]}
                              </p>
                            </div>
                          </div>
                          {/* 숙성 후 예측 */}
                          <div className="flex items-start gap-2">
                            <div className="p-1 rounded-md bg-[#B76E79]/[0.06] shrink-0 mt-0.5">
                              <Sparkles className="w-3 h-3 text-[#B76E79]/60" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] text-[#B76E79]/40 uppercase tracking-wider">After</span>
                              <p className="text-[11px] text-white/50 leading-relaxed mt-0.5">
                                {latestPrediction.aiInsightText.split('\n').slice(1).join(' ')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <div className="p-1.5 rounded-lg bg-[#B76E79]/[0.08] shrink-0 mt-0.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#B76E79]" />
                          </div>
                          <p className="text-[11px] text-white/50 leading-relaxed">
                            {latestPrediction.aiInsightText}
                          </p>
                        </div>
                      )}
                      {/* 출처 + 신뢰도 */}
                      <div className="flex items-center justify-between">
                        <div />
                        {latestPrediction.predictionConfidence != null && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="w-10 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  latestPrediction.predictionConfidence >= 0.8 ? 'bg-emerald-400/60' :
                                  latestPrediction.predictionConfidence >= 0.5 ? 'bg-amber-400/60' : 'bg-red-400/60'
                                }`}
                                style={{ width: `${latestPrediction.predictionConfidence * 100}%` }}
                              />
                            </div>
                            <span className="text-[9px] text-white/25 font-mono">
                              {Math.round(latestPrediction.predictionConfidence * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-[11px] text-white/25 italic">AI 예측을 실행하면 투하 전·후 비교 인사이트가 표시됩니다</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 차트 (풍미 레이더 + 타임라인) */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {(beforeProfile || afterProfile) && (
          <SectionWrapper title="풍미 프로파일" icon={BarChart3} iconColor="#B76E79" delay={0.3}>
            <FlavorRadar beforeProfile={beforeProfile} afterProfile={afterProfile} />
          </SectionWrapper>
        )}

        {selectedProduct && timelineData.length > 0 && (
          <SectionWrapper title="숙성 타임라인" icon={Gauge} iconColor="#C4A052" delay={0.35}>
            <div className="h-[280px] sm:h-[400px]">
              <TimelineChart data={timelineData} harvestWindow={harvestWindow} />
            </div>
            {harvestWindow && (
              <div className="mt-2.5 space-y-2">
                {/* 핵심 지표 — 컴팩트 인라인 */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-[#C4A052]/[0.10] border border-[#C4A052]/[0.25] rounded-lg px-3 py-2 shadow-[0_0_12px_rgba(196,160,82,0.08)]">
                    <span className="text-[9px] text-[#C4A052]/70 uppercase tracking-wider font-medium">Peak</span>
                    <span className="text-sm font-medium text-[#C4A052]" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}>
                      {harvestWindow.peakMonth}<span className="text-[10px] text-[#C4A052]/50 ml-px">개월</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/[0.02] border border-white/[0.06] rounded-lg px-2.5 py-1.5" title="질감·향·환원취·기포를 종합한 품질 점수 (0~100)">
                    <span className="text-[9px] text-white/25 uppercase tracking-wider">품질</span>
                    <span className="text-sm font-light text-white/60" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}>
                      {Math.round(harvestWindow.peakScore)}<span className="text-[10px] text-white/20 ml-px">/100</span>
                    </span>
                  </div>
                </div>
                {/* 범례 — 고스트 라인 포함 */}
                <div className="flex flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-1.5">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 rounded-full bg-[#C4A052]" />
                    <span className="text-[9px] text-white/30">종합 품질</span>
                  </div>
                  <span className="text-white/10 text-[8px] hidden sm:inline">|</span>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-px bg-emerald-400/40" />
                    <span className="text-[9px] text-emerald-400/30">질감</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-px border-t border-dashed border-emerald-400/30" />
                    <span className="text-[9px] text-emerald-400/30">기포</span>
                  </div>
                  <span className="text-white/10 text-[8px] hidden sm:inline">|</span>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-px bg-red-400/35" />
                    <span className="text-[9px] text-red-400/30">향 감쇠</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-px border-t border-dashed border-red-400/30" />
                    <span className="text-[9px] text-red-400/30">환원취</span>
                  </div>
                </div>
              </div>
            )}
          </SectionWrapper>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 모델 상태 */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <SectionWrapper title="모델 상태" icon={Settings2} iconColor="#C4A052" delay={0.4}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            {[
              { label: '상태', value: MODEL_STATUS_LABELS[modelStatus], badge: true },
              { label: '최종 학습일', value: modelLastTrained ? new Date(modelLastTrained).toLocaleDateString('ko-KR') : '—' },
              { label: '학습 데이터', value: `${modelDataCount.toLocaleString()}건` },
              { label: '모델 그룹', value: `${modelGroupCount}개` },
            ].map((row) => (
              <div key={row.label} className="text-center sm:text-left">
                <span className="text-[10px] text-white/30 uppercase tracking-wider block mb-1">{row.label}</span>
                {row.badge ? (
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      modelStatus === 'trained'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : modelStatus === 'training'
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-white/[0.06] text-white/40'
                    }`}
                  >
                    {row.value}
                  </span>
                ) : (
                  <span className="text-sm text-white/60 font-mono">{row.value}</span>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={trainModel}
            disabled={isTraining}
            className="w-full flex items-center justify-center gap-2 bg-[#C4A052]/15 hover:bg-[#C4A052]/25 border border-[#C4A052]/20 text-[#C4A052] font-medium rounded-xl px-4 py-2.5 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTraining ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isTraining ? '학습 진행 중...' : '모델 재학습'}
          </button>
        </SectionWrapper>

        {/* 보정 계수 다이얼로그 */}
        <AnimatePresence>
          {showCoefficientDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
              onClick={(e) => { if (e.target === e.currentTarget) setShowCoefficientDialog(false); }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-[#0d1421] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
                <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
                  <div className="p-2 bg-cyan-500/10 rounded-xl">
                    <Settings2 className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-sm font-medium text-white">보정 계수</h2>
                    <p className="text-[10px] text-white/25 mt-0.5">예측 시 적용 · 모델 학습에는 미사용</p>
                  </div>
                  <button onClick={() => setShowCoefficientDialog(false)} className="text-white/30 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-5 space-y-5">
                  <CoefficientSlider
                    label="TCI (질감 성숙)"
                    value={localTci}
                    onChange={setLocalTci}
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    scientificBasis="가설적 추정 — 실험 검증 필요"
                    sourceType="hypothesis"
                    description={`Texture Catalysis Index — 해저 환경이 질감 발전(효모 자가분해·바디감)을 얼마나 촉진하는지 나타냅니다.\n\n도출 방식: 현재는 실험 데이터가 없어 가설 기반 추정치입니다. 해저의 일정한 저온(4~8°C)·고압(수심 30m ≈ 4기압) 환경이 효모 세포벽 분해를 가속한다는 가설에 기반하며, 값이 높을수록 숙성이 빠르게 진행됩니다.\n\n향후 실제 해저 숙성 와인의 관능 평가 데이터로 검증·보정할 예정입니다.`}
                  />
                  <CoefficientSlider
                    label="FRI (향 신선도)"
                    value={localFri}
                    onChange={setLocalFri}
                    min={0.1}
                    max={1.0}
                    step={0.01}
                    scientificBasis="아레니우스 방정식 · Ea=47kJ/mol"
                    recommendedValue={0.56}
                    sourceType="scientific"
                    description={`Freshness Retention Index — 해저 숙성 중 과실향·산도가 보존되는 비율입니다.\n\n아레니우스 방정식이란?\n화학 반응 속도가 온도에 따라 얼마나 변하는지 계산하는 공식입니다.\n  k = A × e^(-Ea / RT)\n  k: 반응 속도, Ea: 활성화 에너지, R: 기체 상수, T: 절대 온도\n\n계산 방식:\n해저(약 6°C)와 셀러(약 12°C)의 산화 반응 속도를 비교합니다.\n  셀러 속도: k₁ = A × e^(-47000 / 8.314 × 285)\n  해저 속도: k₂ = A × e^(-47000 / 8.314 × 279)\n  FRI = k₂ / k₁ ≈ 0.56\n\n즉, 해저에서는 향 손실이 셀러 대비 56% 수준으로 느려집니다.`}
                  />
                  <CoefficientSlider
                    label="BRI (기포 안정화)"
                    value={localBri}
                    onChange={setLocalBri}
                    min={1.0}
                    max={2.5}
                    step={0.05}
                    scientificBasis="헨리의 법칙 · 수심 30m CO₂ 압력 구배"
                    recommendedValue={1.6}
                    sourceType="scientific"
                    description={`Bubble Refinement Index — 수압이 CO₂ 기포를 얼마나 미세하게 만드는지 나타냅니다.\n\n헨리의 법칙이란?\n기체가 액체에 녹는 양은 압력에 비례한다는 법칙입니다.\n  C = k_H × P\n  C: 용해된 기체 농도, k_H: 헨리 상수, P: 기체 압력\n\n계산 방식:\n수심 30m에서는 수압이 약 4기압(지상 1 + 수압 3)입니다.\n  지상 CO₂ 용해: C₁ = k_H × 1atm\n  해저 CO₂ 용해: C₂ = k_H × 4atm\n  BRI = C₂ / C₁ = 4.0 (이론값)\n\n실제로는 온도·와인 성분 영향으로 보정하여 권장값 1.6을 사용합니다. 값이 높을수록 CO₂가 더 많이 녹아 기포가 작고 섬세해집니다.`}
                  />
                </div>
                <div className="flex gap-3 px-5 pb-5">
                  <button
                    onClick={() => setShowCoefficientDialog(false)}
                    className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/50 rounded-xl py-2 text-sm transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={async () => {
                      await handleSaveCoefficients();
                      setShowCoefficientDialog(false);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500/90 to-cyan-400/90 text-black font-medium rounded-xl py-2 text-sm hover:opacity-90 transition-opacity"
                  >
                    <Save className="w-3.5 h-3.5" />
                    저장
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 제품 추가/수정 모달
// ═══════════════════════════════════════════════════════════════════════════

// 모달용 카테고리 목록 (DB product_category 값 기준)
const MODAL_CATEGORIES = [
  { value: 'champagne',   label: '🥂 샴페인' },
  { value: 'red_wine',    label: '🍷 레드와인' },
  { value: 'white_wine',  label: '🍾 화이트와인' },
  { value: 'whisky',      label: '🥃 위스키' },
  { value: 'sake',        label: '🍶 사케' },
  { value: 'coldbrew',    label: '☕ 콜드브루' },
  { value: 'puer',        label: '🫖 생차/보이차' },
  { value: 'soy_sauce',   label: '🫙 간장' },
  { value: 'vinegar',     label: '🍶 식초' },
  { value: 'spirits',     label: '🍚 한국 전통주' },
];

function ProductModal({
  onClose,
  onSubmit,
  initialData,
  initialCategory = 'champagne',
}: {
  onClose: () => void;
  onSubmit: (input: ProductInput) => Promise<void>;
  initialData?: AgingProduct | null;
  initialCategory?: string;
}) {
  const isEdit = !!initialData;
  const [productCategory, setProductCategory] = useState(
    initialData?.productCategory ?? initialCategory
  );
  const [productName, setProductName] = useState(initialData?.productName ?? '');

  // 카테고리별 동적 설정
  const fieldConfig = CATEGORY_FIELD_CONFIG[productCategory] ?? CATEGORY_FIELD_CONFIG['champagne'];
  const subtypeOptions = CATEGORY_SUBTYPES[productCategory] ?? CATEGORY_SUBTYPES['champagne'];
  const reductionChecklist: ReductionCheckItem[] = CATEGORY_REDUCTION_CHECKLIST[productCategory] ?? CATEGORY_REDUCTION_CHECKLIST['champagne'];

  const [subtype, setSubtype] = useState<string>(
    initialData?.wineType ?? subtypeOptions[0]?.value ?? ''
  );
  const [vintage, setVintage] = useState<string>(initialData?.vintage?.toString() ?? '');
  const [ph, setPh] = useState<string>(initialData?.ph?.toString() ?? '');
  const [dosage, setDosage] = useState<string>(initialData?.dosage?.toString() ?? '');
  const [alcohol, setAlcohol] = useState<string>(initialData?.alcohol?.toString() ?? '');

  // 카테고리 변경 시 서브타입 + 체크리스트 초기화
  const handleCategoryChange = (newCategory: string) => {
    setProductCategory(newCategory);
    const newSubtypes = CATEGORY_SUBTYPES[newCategory];
    if (newSubtypes?.[0]) setSubtype(newSubtypes[0].value);
    const newChecklist = CATEGORY_REDUCTION_CHECKLIST[newCategory] ?? [];
    const freshChecks: Record<string, boolean> = {};
    newChecklist.forEach((item) => { freshChecks[item.id] = false; });
    setReductionChecks(freshChecks);
    if (!CATEGORY_FIELD_CONFIG[newCategory]?.showDosage) setDosage('');
    if (!CATEGORY_FIELD_CONFIG[newCategory]?.showVintage) setVintage('');
  };

  // 환원 성향 체크리스트 → 자동 산출
  const [reductionChecks, setReductionChecks] = useState<Record<string, boolean>>(() => {
    if (initialData?.reductionChecks) return { ...initialData.reductionChecks };
    const initial: Record<string, boolean> = {};
    reductionChecklist.forEach((item) => { initial[item.id] = false; });
    return initial;
  });

  const reductionScore = reductionChecklist.reduce(
    (sum, item) => sum + (reductionChecks[item.id] ? item.weight : 0), 0
  );
  const reductionPotential: ReductionPotential = reductionScore >= 3 ? 'high' : reductionScore >= 1 ? 'medium' : 'low';

  const toggleReductionCheck = (id: string) => {
    const item = reductionChecklist.find((c) => c.id === id);
    setReductionChecks((prev) => {
      const next = { ...prev };
      if (item?.group) {
        reductionChecklist.forEach((c) => {
          if (c.group === item.group && c.id !== id) next[c.id] = false;
        });
      }
      next[id] = !prev[id];
      return next;
    });
  };

  // 그룹별 분리 (라디오 그룹 vs 복수 선택)
  const groupedItems = reductionChecklist.filter((item) => item.group !== null);
  const ungroupedItems = reductionChecklist.filter((item) => item.group === null);
  const uniqueGroups = [...new Set(groupedItems.map((item) => item.group))];

  const [terrestrialAgingYears, setTerrestrialAgingYears] = useState<string>(
    initialData?.terrestrialAgingYears?.toString() ?? ''
  );
  const [immersionDate, setImmersionDate] = useState(initialData?.immersionDate ?? '');
  const [plannedDurationMonths, setPlannedDurationMonths] = useState<string>(initialData?.plannedDurationMonths?.toString() ?? '');
  const [agingDepth, setAgingDepth] = useState<string>(initialData?.agingDepth?.toString() ?? '30');
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;
    setIsSubmitting(true);
    // champagne만 WineType으로, 나머지는 null
    const isWineCategory = productCategory === 'champagne';
    await onSubmit({
      productName: productName.trim(),
      productCategory,
      wineType: isWineCategory ? (subtype as WineType) : null,
      vintage: vintage ? Number(vintage) : null,
      producer: '',
      ph: ph ? Number(ph) : null,
      dosage: dosage ? Number(dosage) : null,
      alcohol: alcohol ? Number(alcohol) : null,
      acidity: null,
      reductionPotential,
      reductionChecks: { ...reductionChecks, _subtype: subtype as unknown as boolean },
      immersionDate: immersionDate || null,
      plannedDurationMonths: plannedDurationMonths ? Number(plannedDurationMonths) : null,
      agingDepth: agingDepth ? Number(agingDepth) : 30,
      terrestrialAgingYears: terrestrialAgingYears ? Number(terrestrialAgingYears) : null,
      notes: notes.trim() || null,
    });
    setIsSubmitting(false);
  };

  const inputClass =
    'w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/40 transition-colors';
  const labelClass = 'block text-xs text-white/50 mb-1.5';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#0d1421] border border-white/[0.08] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex items-center gap-3 p-5 border-b border-white/[0.06]">
          <div className="p-2 bg-cyan-500/10 rounded-xl">
            <Anchor className="w-5 h-5 text-cyan-400" />
          </div>
          <h2 className="text-lg font-medium text-white flex-1">
            {isEdit ? '숙성 제품 수정' : '새 숙성 제품 등록'}
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* 카테고리 선택 */}
          <div>
            <label className={labelClass}>카테고리</label>
            <select
              value={productCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className={inputClass}
            >
              {MODAL_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* 제품명 */}
          <div>
            <label className={labelClass}>제품명 *</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="제품명을 입력하세요"
              className={inputClass}
              required
            />
          </div>

          {/* 서브타입 + 빈티지 (동적) */}
          <div className={`grid gap-3 ${fieldConfig.showVintage ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label className={labelClass}>{fieldConfig.subtypeLabel}</label>
              <select value={subtype} onChange={(e) => setSubtype(e.target.value)} className={inputClass}>
                {subtypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {fieldConfig.showVintage && (
              <div>
                <label className={labelClass}>{fieldConfig.vintageLabel}</label>
                <input type="number" value={vintage} onChange={(e) => setVintage(e.target.value)} placeholder="2024" className={inputClass} />
              </div>
            )}
          </div>

          {/* pH / Dosage / Alcohol (동적) */}
          <div className={`grid grid-cols-1 gap-3 ${fieldConfig.showDosage && fieldConfig.showAlcohol ? 'sm:grid-cols-3' : fieldConfig.showDosage || fieldConfig.showAlcohol ? 'sm:grid-cols-2' : ''}`}>
            <div>
              <label className={labelClass}>pH <span className="text-white/20">(선택)</span></label>
              <input type="number" step="0.01" value={ph} onChange={(e) => setPh(e.target.value)} placeholder="3.10" className={inputClass} />
            </div>
            {fieldConfig.showDosage && (
              <div>
                <label className={labelClass}>Dosage g/L <span className="text-white/20">(선택)</span></label>
                <input type="number" value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="8" className={inputClass} />
              </div>
            )}
            {fieldConfig.showAlcohol && (
              <div>
                <label className={labelClass}>Alcohol % <span className="text-white/20">(선택)</span></label>
                <input type="number" value={alcohol} onChange={(e) => setAlcohol(e.target.value)} placeholder="12.5" className={inputClass} />
              </div>
            )}
          </div>

          {/* 환원 성향 체크리스트 (카테고리별 동적) */}
          <div>
            <label className={labelClass}>환원 성향 (해당 항목 체크)</label>
            {/* 그룹별 라디오 */}
            {uniqueGroups.map((group) => (
              <div key={group}>
                <p className="text-[11px] text-white/30 mb-1.5 mt-2">{group} (하나만 선택)</p>
                <div className="space-y-1.5">
                  {groupedItems.filter((item) => item.group === group).map((item) => (
                    <label
                      key={item.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                        reductionChecks[item.id]
                          ? 'border-cyan-400/30 bg-cyan-400/[0.05]'
                          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`group-${group}`}
                        checked={reductionChecks[item.id] ?? false}
                        onChange={() => toggleReductionCheck(item.id)}
                        className="accent-cyan-400"
                      />
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm ${reductionChecks[item.id] ? 'text-white' : 'text-white/60'}`}>
                          {item.label}
                        </span>
                        <span className="text-[11px] text-white/30 ml-2 hidden sm:inline">{item.desc}</span>
                      </div>
                      <span className={`text-xs font-mono ${item.weight > 0 ? 'text-red-400/60' : item.weight < 0 ? 'text-emerald-400/60' : 'text-white/20'}`}>
                        {item.weight > 0 ? '+' : ''}{item.weight}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            {/* 비그룹 복수 선택 */}
            {ungroupedItems.length > 0 && (
              <>
                <p className="text-[11px] text-white/30 mb-1.5 mt-3">특성 (복수 선택 가능)</p>
                <div className="space-y-1.5">
                  {ungroupedItems.map((item) => (
                    <label
                      key={item.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                        reductionChecks[item.id]
                          ? 'border-cyan-400/30 bg-cyan-400/[0.05]'
                          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={reductionChecks[item.id] ?? false}
                        onChange={() => toggleReductionCheck(item.id)}
                        className="accent-cyan-400 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm ${reductionChecks[item.id] ? 'text-white' : 'text-white/60'}`}>
                          {item.label}
                        </span>
                        <span className="text-[11px] text-white/30 ml-2 hidden sm:inline">{item.desc}</span>
                      </div>
                      <span className={`text-xs font-mono ${item.weight > 0 ? 'text-red-400/60' : item.weight < 0 ? 'text-emerald-400/60' : 'text-white/20'}`}>
                        {item.weight > 0 ? '+' : ''}{item.weight}
                      </span>
                    </label>
                  ))}
                </div>
              </>
            )}
            {/* 자동 산출 결과 */}
            <div className="mt-3 flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-xs text-white/40">산출 결과:</span>
              <span className={`text-sm font-medium ${
                reductionPotential === 'high' ? 'text-red-400' : reductionPotential === 'medium' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {REDUCTION_POTENTIAL_LABELS[reductionPotential]}
              </span>
              <span className="text-[11px] text-white/20 font-mono">
                (점수: {reductionScore})
              </span>
            </div>
          </div>

          {/* 투하 전 지상 숙성 기간 */}
          <div>
            <label className={labelClass}>
              투하 전 숙성 기간 (년) <span className="text-white/20">(선택)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.1"
                min="0"
                max="30"
                value={terrestrialAgingYears}
                onChange={(e) => setTerrestrialAgingYears(e.target.value)}
                placeholder="투하 전 실제 숙성 연수"
                className={inputClass + ' flex-1'}
              />
              {terrestrialAgingYears && (
                <span className="text-xs text-cyan-400 whitespace-nowrap">실측값 사용</span>
              )}
            </div>
            <p className="text-[11px] text-white/30 mt-1.5">
              투하 전 실제 숙성 연수를 입력하면 예측 정밀도가 향상됩니다.
            </p>
          </div>

          {/* 투하 조건 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>투하 예정일</label>
              <input type="date" value={immersionDate} onChange={(e) => setImmersionDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>예정 기간 (월)</label>
              <input type="number" value={plannedDurationMonths} onChange={(e) => setPlannedDurationMonths(e.target.value)} placeholder="18" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>숙성 깊이 (m)</label>
              <input type="number" value={agingDepth} onChange={(e) => setAgingDepth(e.target.value)} placeholder="30" className={inputClass} />
            </div>
          </div>

          {/* 메모 */}
          <div>
            <label className={labelClass}>메모</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="추가 참고사항..."
              rows={3}
              className={inputClass + ' resize-none'}
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/60 rounded-xl py-2.5 text-sm transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!productName.trim() || isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-medium rounded-xl py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? '수정' : '등록'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Flavor Radar 차트
// ═══════════════════════════════════════════════════════════════════════════

const FALLBACK_PROFILES: Record<WineType, Record<string, number>> = {
  blanc_de_blancs: { fruity: 70, floralMineral: 65, yeastyAutolytic: 35, acidityFreshness: 80, bodyTexture: 45, finishComplexity: 55 },
  blanc_de_noirs:  { fruity: 55, floralMineral: 40, yeastyAutolytic: 45, acidityFreshness: 65, bodyTexture: 65, finishComplexity: 55 },
  rose:            { fruity: 65, floralMineral: 50, yeastyAutolytic: 30, acidityFreshness: 70, bodyTexture: 50, finishComplexity: 45 },
  blend:           { fruity: 60, floralMineral: 45, yeastyAutolytic: 40, acidityFreshness: 70, bodyTexture: 55, finishComplexity: 50 },
  vintage:         { fruity: 40, floralMineral: 55, yeastyAutolytic: 65, acidityFreshness: 55, bodyTexture: 70, finishComplexity: 75 },
};

function FlavorRadar({
  beforeProfile,
  afterProfile,
}: {
  beforeProfile: Record<string, number> | null;
  afterProfile: Record<string, number> | null;
}) {
  const before = beforeProfile || FALLBACK_PROFILES.blend;
  const after = afterProfile || before;

  const radarData = FLAVOR_AXES.map((axis) => ({
    axis: axis.label,
    before: Math.round(Math.min(100, Math.max(5, before[axis.key] ?? 50))),
    after: Math.round(Math.min(100, Math.max(5, after[axis.key] ?? 50))),
  }));

  const changes = radarData.map((d) => ({
    label: d.axis,
    before: d.before,
    after: d.after,
    diff: d.after - d.before,
  }));

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-0">
      {/* 레이더 차트 — 좌측, 크게 */}
      <div className="flex-1 h-[300px] sm:h-[380px] lg:h-[420px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="78%">
            <defs>
              <radialGradient id="radarBeforeFill" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.10} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.02} />
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
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />
            <Radar
              name="투하 전"
              dataKey="before"
              stroke="rgba(34,211,238,0.4)"
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
            <div className="w-5 h-px border-t border-dashed border-cyan-400/50" />
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
            const isPositive = c.diff > 0;
            const isNegative = c.diff < 0;
            return (
              <div
                key={c.label}
                className={`flex items-center justify-between rounded-lg px-3 py-2 transition-colors ${
                  isPositive
                    ? 'bg-[#B76E79]/[0.06] border border-[#B76E79]/[0.12]'
                    : isNegative
                    ? 'bg-cyan-400/[0.04] border border-cyan-400/[0.08]'
                    : 'bg-white/[0.02] border border-white/[0.04]'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-[9px] text-white/30 tracking-wide leading-none mb-0.5">{c.label}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[10px] text-white/20 font-mono">{c.before}</span>
                    <span className="text-[8px] text-white/15">→</span>
                    <span className="text-[10px] text-white/45 font-mono">{c.after}</span>
                  </div>
                </div>
                <span
                  className={`text-xs font-mono font-semibold tabular-nums ${
                    isPositive ? 'text-[#B76E79]' : isNegative ? 'text-cyan-400/70' : 'text-white/15'
                  }`}
                  style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}
                >
                  {isPositive ? '+' : ''}{c.diff}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Timeline & Golden Window 차트
// ═══════════════════════════════════════════════════════════════════════════

function TimelineChart({
  data,
  harvestWindow,
}: {
  data: { month: number; textureMaturity: number; aromaFreshness: number; offFlavorRisk: number; bubbleRefinement: number; compositeQuality?: number; gainScore?: number; lossScore?: number; netBenefit?: number }[];
  harvestWindow: { startMonths: number; endMonths: number; peakMonth: number; peakScore: number; recommendation: string } | null;
}) {
  const peakPoint = harvestWindow
    ? data.find((d) => d.month === harvestWindow.peakMonth)
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

        {/* 3구간 배경 제거됨 */}

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

        {/* 피크 수직선 */}
        {harvestWindow && (
          <ReferenceLine
            x={harvestWindow.peakMonth}
            stroke="#C4A052"
            strokeWidth={1}
            strokeDasharray="2 3"
            strokeOpacity={0.4}
          />
        )}

        {/* 골든 윈도우 경계선 제거됨 */}

        {/* 피크 마커 */}
        {harvestWindow && peakPoint && (
          <ReferenceDot
            x={harvestWindow.peakMonth}
            y={peakPoint.compositeQuality ?? 0}
            r={5}
            fill="#C4A052"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth={2}
            filter="url(#peakGlow)"
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 보정 계수 슬라이더
// ═══════════════════════════════════════════════════════════════════════════

function CoefficientSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  scientificBasis,
  recommendedValue,
  sourceType,
  description,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  scientificBasis?: string;
  recommendedValue?: number;
  sourceType?: 'hypothesis' | 'scientific';
  description?: string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  const openTooltip = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.top - 8,
        left: Math.max(12, Math.min(rect.left, window.innerWidth - 300)),
      });
    }
    setShowTooltip(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-white/50">{label}</label>
          {description && (
            <>
              <button
                ref={btnRef}
                type="button"
                onMouseEnter={openTooltip}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => showTooltip ? setShowTooltip(false) : openTooltip()}
                className="text-white/25 hover:text-white/60 transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
              {showTooltip && typeof document !== 'undefined' && createPortal(
                <div
                  className="fixed w-72 bg-[#12131a] border border-white/[0.12] rounded-xl p-3.5 shadow-2xl z-[9999]"
                  style={{ top: tooltipPos.top, left: tooltipPos.left, transform: 'translateY(-100%)' }}
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <p className="text-[11px] leading-[1.7] text-white/60 whitespace-pre-line">{description}</p>
                </div>,
                document.body
              )}
            </>
          )}
        </div>
        <span className="text-xs text-cyan-400 font-mono font-medium">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-cyan-400 h-1.5 bg-white/[0.06] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(34,211,238,0.3)]"
      />
      <div className="flex justify-between text-[10px] text-white/20 mt-1">
        <span>{min}</span>
        {recommendedValue !== undefined && (
          <span className="text-cyan-400/50">권장 {recommendedValue}</span>
        )}
        <span>{max}</span>
      </div>
      {scientificBasis && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              sourceType === 'scientific' ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <span className="text-[10px] text-white/30">{scientificBasis}</span>
        </div>
      )}
    </div>
  );
}
