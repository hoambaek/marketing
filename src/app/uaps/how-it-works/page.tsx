'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Database,
  Layers,
  Brain,
  Waves,
  Target,
  Sparkles,
  Thermometer,
  Wind,
  Droplets,
  TrendingUp,
  MessageSquare,
  ArrowDown,
  ArrowRight,
  GitBranch,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// 데이터 타입 뱃지 색상
// ═══════════════════════════════════════════════════════════════════════════
const BADGE = {
  raw:    { bg: 'bg-white/[0.04]',       text: 'text-white/40',    border: 'border-white/[0.08]' },
  nlp:    { bg: 'bg-cyan-500/[0.08]',    text: 'text-cyan-300',    border: 'border-cyan-500/20'  },
  model:  { bg: 'bg-violet-500/[0.08]',  text: 'text-violet-300',  border: 'border-violet-500/20'},
  curve:  { bg: 'bg-emerald-500/[0.08]', text: 'text-emerald-300', border: 'border-emerald-500/20'},
  ai:     { bg: 'bg-pink-500/[0.08]',    text: 'text-pink-300',    border: 'border-pink-500/20'  },
  coeff:  { bg: 'bg-amber-500/[0.08]',   text: 'text-amber-300',   border: 'border-amber-500/20' },
  output: { bg: 'bg-[#B76E79]/[0.10]',   text: 'text-[#e8a0a9]',   border: 'border-[#B76E79]/25' },
};

function Badge({ label, type }: { label: string; type: keyof typeof BADGE }) {
  const s = BADGE[type];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono border ${s.bg} ${s.text} ${s.border}`}>
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 흐름 노드 컴포넌트
// ═══════════════════════════════════════════════════════════════════════════
function FlowNode({
  number,
  icon: Icon,
  color,
  title,
  subtitle,
  inputs,
  outputs,
  children,
  index,
  isLast = false,
}: {
  number: string;
  icon: React.ElementType;
  color: string;
  title: string;
  subtitle: string;
  inputs: { label: string; type: keyof typeof BADGE }[];
  outputs: { label: string; type: keyof typeof BADGE }[];
  children: React.ReactNode;
  index: number;
  isLast?: boolean;
}) {
  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.6, delay: index * 0.08 }}
        className="rounded-2xl border bg-white/[0.02] overflow-hidden hover:bg-white/[0.035] transition-colors duration-500"
        style={{ borderColor: `${color}18` }}
      >
        {/* 상단 스트립 */}
        <div className="h-px w-full" style={{ background: `linear-gradient(to right, transparent, ${color}40, transparent)` }} />

        <div className="p-5 sm:p-6">
          {/* 헤더 */}
          <div className="flex items-start gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-mono text-xs font-bold"
              style={{ backgroundColor: `${color}12`, color, border: `1px solid ${color}25` }}
            >
              {number}
            </div>
            <div
              className="p-2 rounded-xl shrink-0"
              style={{ backgroundColor: `${color}10` }}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color }} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-semibold text-white/90">{title}</h3>
              <p className="text-[10px] tracking-widest uppercase mt-0.5" style={{ color: `${color}70` }}>{subtitle}</p>
            </div>
          </div>

          {/* 입력 → 처리 → 출력 흐름 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-stretch gap-3 mb-4">
            {/* INPUT */}
            <div className="flex-1 rounded-xl border border-white/[0.05] bg-white/[0.01] p-3 min-w-0">
              <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-2">INPUT</p>
              <div className="flex flex-wrap gap-1">
                {inputs.map((b) => <Badge key={b.label} label={b.label} type={b.type} />)}
              </div>
            </div>

            {/* 화살표 */}
            <div className="hidden sm:flex items-center text-white/15">
              <ArrowRight className="w-4 h-4" />
            </div>
            <div className="sm:hidden flex justify-center text-white/15">
              <ArrowDown className="w-4 h-4" />
            </div>

            {/* OUTPUT */}
            <div className="flex-1 rounded-xl border border-white/[0.05] bg-white/[0.01] p-3 min-w-0">
              <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-2">OUTPUT</p>
              <div className="flex flex-wrap gap-1">
                {outputs.map((b) => <Badge key={b.label} label={b.label} type={b.type} />)}
              </div>
            </div>
          </div>

          {/* 본문 */}
          <div className="text-xs sm:text-sm text-white/40 leading-relaxed space-y-2">
            {children}
          </div>
        </div>
      </motion.div>

      {/* 하단 연결 화살표 */}
      {!isLast && (
        <div className="flex justify-center my-1 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            whileInView={{ opacity: 1, scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.08 + 0.4 }}
            className="flex flex-col items-center origin-top"
          >
            <div className="w-px h-6" style={{ background: `linear-gradient(to bottom, ${color}40, transparent)` }} />
            <ArrowDown className="w-3 h-3 text-white/10 -mt-1" />
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 지상 시간 추론 — 세부 다이어그램
// ═══════════════════════════════════════════════════════════════════════════
function TerrestrialFlowDiagram() {
  return (
    <div className="mt-4 rounded-xl border border-white/[0.05] bg-black/20 p-4 space-y-3">
      <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">내부 처리 흐름</p>

      {/* Row 1 */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] px-3 py-2 text-[11px] text-emerald-300 font-mono">
          agingYears
        </div>
        <ArrowRight className="w-3 h-3 text-white/20 shrink-0" />
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-white/50">
          Stage 분류<br />
          <span className="text-[10px] text-white/25">≤3y / 3-7y / 7-15y / &gt;15y</span>
        </div>
        <ArrowRight className="w-3 h-3 text-white/20 shrink-0" />
        <div className="rounded-lg border border-violet-500/20 bg-violet-500/[0.05] px-3 py-2 text-[11px] text-violet-300 font-mono">
          youthful · developing<br />mature · aged
        </div>
      </div>

      {/* Row 2 */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/[0.05] px-3 py-2 text-[11px] text-cyan-300 font-mono">
          6축 점수 (NLP)
        </div>
        <ArrowRight className="w-3 h-3 text-white/20 shrink-0" />
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-white/50">
          연도별 평균 계산<br />
          <span className="text-[10px] text-white/25">cross-sectional</span>
        </div>
        <ArrowRight className="w-3 h-3 text-white/20 shrink-0" />
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] px-3 py-2 text-[11px] text-emerald-300 font-mono">
          transitionCurves<br />
          <span className="text-[10px] text-emerald-400/50">{'{year, value}[]'}</span>
        </div>
      </div>

      {/* Row 3 — limit explanation */}
      <div className="flex items-start gap-2 pt-1 border-t border-white/[0.04]">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400/50 mt-1 shrink-0" />
        <p className="text-[11px] text-white/30 leading-relaxed">
          <span className="text-amber-300/70 font-mono">Cross-sectional</span> — 같은 와인을 추적하지 않고, 동일 타입의 서로 다른 빈티지를 연도 기준으로 비교해 시간축을 구성합니다.
          개체 간 차이(테루아, 생산자)가 평균에 묻힐 수 있습니다.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 보정 계수 상세
// ═══════════════════════════════════════════════════════════════════════════
function CoefficientRow({
  keyName, label, value, formula, basis, color, sourceType, description,
}: {
  keyName: string; label: string; value: string; formula: string;
  basis: string; color: string; sourceType: 'scientific' | 'hypothesis'; description: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors">
      {/* 왼쪽: 키 + 값 */}
      <div className="shrink-0 sm:w-28 flex sm:flex-col items-center sm:items-start gap-3 sm:gap-1">
        <span className="text-lg font-mono font-bold" style={{ color }}>{keyName}</span>
        <span className="text-xl font-mono font-bold text-white/70">{value}</span>
      </div>
      {/* 구분선 */}
      <div className="hidden sm:block w-px bg-white/[0.05]" />
      {/* 오른쪽: 설명 */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-white/70">{label}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono border"
            style={{ color: sourceType === 'scientific' ? '#34d399' : '#fbbf24',
              borderColor: sourceType === 'scientific' ? '#34d39930' : '#fbbf2430',
              backgroundColor: sourceType === 'scientific' ? '#34d39908' : '#fbbf2408' }}>
            {sourceType === 'scientific' ? '과학적 도출' : '가설적 추정'}
          </span>
        </div>
        <p className="text-[11px] text-white/35 leading-relaxed">{description}</p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <code className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-white/40 font-mono">{formula}</code>
          <span className="text-[10px] text-white/20">{basis}</span>
        </div>
      </div>
    </div>
  );
}

// 레이더 Before→After
function RadarDiagram() {
  const axes = [
    { label: 'Fruity', angle: 0 },
    { label: 'Floral', angle: 60 },
    { label: 'Yeasty', angle: 120 },
    { label: 'Acidity', angle: 180 },
    { label: 'Body', angle: 240 },
    { label: 'Finish', angle: 300 },
  ];
  const beforeValues = [0.65, 0.55, 0.40, 0.70, 0.45, 0.35];
  const afterValues  = [0.50, 0.70, 0.75, 0.55, 0.70, 0.65];
  const size = 200; const cx = 100; const cy = 100; const maxR = 75;
  const toXY = (angle: number, r: number) => ({
    x: cx + r * Math.cos((angle - 90) * Math.PI / 180),
    y: cy + r * Math.sin((angle - 90) * Math.PI / 180),
  });
  const bP = axes.map((a, i) => toXY(a.angle, beforeValues[i] * maxR)).map(p => `${p.x},${p.y}`).join(' ');
  const aP = axes.map((a, i) => toXY(a.angle, afterValues[i]  * maxR)).map(p => `${p.x},${p.y}`).join(' ');
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {[0.25,0.5,0.75,1].map(s => <polygon key={s} points={axes.map(a => toXY(a.angle, s*maxR)).map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"/>)}
        {axes.map(a => { const e = toXY(a.angle, maxR); return <line key={a.label} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"/>; })}
        <polygon points={bP} fill="rgba(34,211,238,0.08)"  stroke="rgba(34,211,238,0.4)"  strokeWidth="1"   strokeDasharray="4 3"/>
        <polygon points={aP} fill="rgba(183,110,121,0.12)" stroke="rgba(183,110,121,0.7)" strokeWidth="1.5"/>
        {axes.map(a => { const p = toXY(a.angle, maxR+16); return <text key={a.label} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" className="fill-white/30 text-[8px] font-mono">{a.label}</text>; })}
      </svg>
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5"><div className="w-4 h-px border-t border-dashed border-cyan-400/50"/><span className="text-[10px] text-white/35">Before</span></div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 rounded-full bg-[#B76E79]/70"/><span className="text-[10px] text-white/35">After</span></div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 데이터 범례
// ═══════════════════════════════════════════════════════════════════════════
function DataLegend() {
  const items = [
    { type: 'raw' as const,    label: '원시 데이터' },
    { type: 'nlp' as const,    label: 'NLP 6축 점수' },
    { type: 'curve' as const,  label: '전이 곡선' },
    { type: 'model' as const,  label: '학습 모델' },
    { type: 'ai' as const,     label: 'AI 프로파일' },
    { type: 'coeff' as const,  label: '보정 계수' },
    { type: 'output' as const, label: '예측 결과' },
  ];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="flex flex-wrap gap-2"
    >
      {items.map(it => <Badge key={it.type} label={it.label} type={it.type} />)}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 메인 페이지
// ═══════════════════════════════════════════════════════════════════════════

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-[#0a0b0d] text-white pb-24">

      {/* ─── 헤더 ─────────────────────────────────────────────────── */}
      <section className="relative pt-8 sm:pt-16 pb-6 sm:pb-10 px-4 sm:px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <Link href="/uaps" className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors mb-8">
              <ArrowLeft className="w-3.5 h-3.5" />UAPS 대시보드
            </Link>
          </motion.div>

          <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
            className="text-cyan-400/70 text-[10px] sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-2 sm:mb-4 font-light">
            How It Works
          </motion.p>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="text-3xl sm:text-5xl text-white/95 mb-3 sm:mb-6 leading-[1.1] tracking-tight"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            <span className="bg-gradient-to-r from-cyan-300 via-white to-[#B76E79] bg-clip-text text-transparent">
              UAPS 데이터 파이프라인
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.4 }}
            className="text-white/40 text-sm sm:text-base max-w-2xl font-light leading-relaxed mb-6">
            112,316건의 리뷰 데이터가 6축 풍미 점수로 변환되고, 통계 학습을 거쳐
            해저 환경 보정 계수와 결합되는 전체 예측 과정을 단계별로 보여줍니다.
          </motion.p>

          {/* 데이터 타입 범례 */}
          <DataLegend />
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent mb-10 sm:mb-16" />
      </div>

      {/* ─── 파이프라인 플로우 ──────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 space-y-1">

        {/* 섹션 라벨 */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/60" />
          <h2 className="text-xs sm:text-sm text-white/40 tracking-widest uppercase">Data Pipeline · 8 Stages</h2>
        </motion.div>

        {/* ── STAGE 01: 데이터 수집 ── */}
        <FlowNode
          number="01" icon={Database} color="#22d3ee" index={0}
          title="데이터 수집"
          subtitle="Terrestrial Data Collection · 8 Categories"
          inputs={[
            { label: '리뷰 플랫폼', type: 'raw' },
            { label: '공식 대회·협회', type: 'raw' },
            { label: 'Kaggle / CSV', type: 'raw' },
            { label: '제조사 공식', type: 'raw' },
          ]}
          outputs={[
            { label: '112,316건 리뷰', type: 'raw' },
            { label: 'product_name / vintage', type: 'raw' },
            { label: 'review_text', type: 'raw' },
            { label: 'aging_years', type: 'raw' },
          ]}
        >
          <div className="space-y-3">
            <p className="text-white/50 text-xs leading-relaxed">
              8개 카테고리에 걸쳐 지상 숙성 테이스팅 노트를 수집합니다.
              <code className="mx-1 px-1.5 py-0.5 rounded bg-white/[0.05] text-white/50 text-[10px] font-mono">terrestrial_data</code>
              테이블에 저장되며, <span className="text-cyan-300">리뷰 텍스트</span>와
              <span className="text-cyan-300 ml-1">숙성 연수</span>가 핵심 원시 데이터입니다.
            </p>

            {/* 카테고리별 소스 테이블 */}
            <div className="rounded-xl border border-white/[0.05] overflow-hidden">
              {/* 헤더 */}
              <div className="grid grid-cols-[auto_1fr] gap-0 bg-white/[0.02] border-b border-white/[0.05] px-3 py-1.5">
                <span className="text-[9px] font-mono text-white/25 uppercase tracking-widest w-28">카테고리</span>
                <span className="text-[9px] font-mono text-white/25 uppercase tracking-widest">데이터 소스</span>
              </div>
              {[
                {
                  emoji: '🍾',
                  name: '샴페인·와인',
                  color: '#22d3ee',
                  sources: ['Vivino', 'CellarTracker', 'WineMag(Kaggle)', 'XWines', 'Decanter', 'Robert Parker', 'Gambero Rosso'],
                },
                {
                  emoji: '🍶',
                  name: '사케(日本酒)',
                  color: '#a78bfa',
                  sources: ['SakeTime.jp', '全国新酒鑑評会', '広島国際酒評会', 'CellarTracker', 'SAKEDOO', 'Sakura Award', 'Reddit r/sake'],
                },
                {
                  emoji: '🍵',
                  name: '보이차(生茶)',
                  color: '#34d399',
                  sources: ['Yunnan Sourcing US/CN', 'White2Tea', 'TeaDB', 'Reddit r/puerh', 'PuerCN(中文)'],
                },
                {
                  emoji: '☕',
                  name: '스페셜티 커피',
                  color: '#fb923c',
                  sources: ['CoffeeReview.com', 'CQI/Kaggle', 'Sweet Maria\'s', 'Cup of Excellence', 'SCAJ+Best of Panama', 'Reddit r/coldbrew', '아프리카·아시아 스페셜티'],
                },
                {
                  emoji: '🫙',
                  name: '간장(醤油)',
                  color: '#f59e0b',
                  sources: ['職人醤油', '全国醤油品評会', '日本醤油協会', '식품안전나라'],
                },
                {
                  emoji: '🥃',
                  name: '한국 전통주',
                  color: '#f472b6',
                  sources: ['홈술닷컴', '공공데이터포털', '전통주갤러리', '우리술닷컴', '수상경력 DB'],
                },
                {
                  emoji: '🍾',
                  name: '식초(Vinegar)',
                  color: '#94a3b8',
                  sources: ['Amazon US 발사믹(12/25yr)', '일본 쿠로즈(黒酢)', '예천 감식초', 'Amazon Japan 쌀식초'],
                },
                {
                  emoji: '🥃',
                  name: '위스키',
                  color: '#c084fc',
                  sources: ['위스키 전문 커뮤니티', 'Kaggle spirits'],
                },
              ].map((cat, i) => (
                <div
                  key={cat.name}
                  className={`grid grid-cols-[auto_1fr] gap-0 px-3 py-2 ${i % 2 === 0 ? 'bg-white/[0.01]' : ''} border-b border-white/[0.03] last:border-0`}
                >
                  <div className="w-28 flex items-center gap-1.5 shrink-0">
                    <span className="text-sm">{cat.emoji}</span>
                    <span className="text-[10px] font-medium" style={{ color: `${cat.color}cc` }}>{cat.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 items-center">
                    {cat.sources.map(s => (
                      <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/40 font-mono border border-white/[0.05]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FlowNode>

        {/* ── STAGE 02: NLP 6축 추출 ── */}
        <FlowNode
          number="02" icon={MessageSquare} color="#34d399" index={1}
          title="리뷰에서 풍미 점수 추출"
          subtitle="NLP Flavor Scoring · 6-Axis"
          inputs={[
            { label: '리뷰 텍스트', type: 'raw' },
            { label: '빈티지 연도', type: 'raw' },
            { label: '시음 날짜', type: 'raw' },
          ]}
          outputs={[
            { label: '6축 풍미 점수 (0–100)', type: 'nlp' },
            { label: '숙성 연수', type: 'nlp' },
            { label: '숙성 연수 신뢰도', type: 'nlp' },
          ]}
        >
          <p>
            AI 언어 모델이 수집된 리뷰 텍스트를 읽고 6가지 풍미 축의 강도를 0–100 점수로 변환합니다.
            예를 들어 "풍부한 효모 향과 크리미한 질감"이라는 리뷰는
            <span className="text-emerald-300 mx-1">Yeasty 높음 / Body 높음</span> 으로 수치화됩니다.
          </p>
          <p>
            숙성 연수는 정확도에 따라 3단계로 구분해 추출합니다.
          </p>
          <div className="mt-1 rounded-lg bg-white/[0.03] border border-white/[0.05] p-3 space-y-1.5 font-mono text-[10px]">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 w-24 shrink-0">가장 정확 (0.92)</span>
              <span className="text-white/40">빈티지 연도 + 시음 날짜 계산 → "2015년 빈티지, 2023년 시음 = 8년"</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 w-24 shrink-0">직접 언급 (0.85)</span>
              <span className="text-white/40">리뷰 텍스트 추출 → "aged 5 years on the lees"</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-violet-400 w-24 shrink-0">간접 추론 (0.60)</span>
              <span className="text-white/40">성숙도 표현에서 추정 → "fully mature, peak drinking"</span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04]">
              <span className="text-red-400/70 w-24 shrink-0">신뢰도 미달</span>
              <span className="text-white/30">→ 제외 (잘못된 학습 데이터 유입 방지)</span>
            </div>
          </div>
          <div className="mt-2 rounded-lg bg-cyan-500/[0.06] border border-cyan-500/15 px-3 py-2">
            <p className="text-[11px] text-cyan-300/70">
              ⏳ 전체 112K 건 NLP 추출 진행 중 — 완료 후 통계 모델 재학습 예정
            </p>
          </div>
        </FlowNode>

        {/* ── STAGE 03: 지상 시간 변화 추론 ── */}
        <FlowNode
          number="03" icon={TrendingUp} color="#a78bfa" index={2}
          title="지상에서 시간에 따른 풍미 변화 파악"
          subtitle="Terrestrial Aging Curve · 4-Stage"
          inputs={[
            { label: '6축 풍미 점수', type: 'nlp' },
            { label: '숙성 연수', type: 'raw' },
            { label: '제품 종류', type: 'raw' },
          ]}
          outputs={[
            { label: '연도별 풍미 전이 곡선', type: 'curve' },
            { label: '숙성 단계 (4단계)', type: 'curve' },
            { label: '연도별 풍미 평균', type: 'curve' },
          ]}
        >
          <p>
            해저 예측의 핵심 전제는 <span className="text-violet-300">"지상에서 이 음료가 시간이 지나면 어떻게 변하는가"</span>를 먼저 아는 것입니다.
            이것을 알아야 해저 환경이 그 변화를 어떻게 다르게 만드는지 계산할 수 있습니다.
          </p>
          <p>
            같은 종류의 음료 수천 건을 숙성 연수별로 묶어 각 시점의 6축 평균을 계산합니다.
            예를 들어 "블랑 드 블랑 3년 숙성의 평균 풍미"가 기준점이 됩니다.
          </p>

          <TerrestrialFlowDiagram />

          <p>
            이렇게 만든 시간별 풍미 곡선이 다음 단계 통계 학습의 기반 데이터가 됩니다.
          </p>
          <div className="mt-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-3 space-y-1.5">
            <p className="text-[10px] font-mono text-emerald-400/60 uppercase tracking-widest">투하 전 숙성 연수 파악 방법 (우선순위 순)</p>
            <div className="space-y-1 font-mono text-[10px]">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 w-6 shrink-0">①</span>
                <span className="text-emerald-300">소믈리에 직접 입력</span>
                <span className="text-white/30 ml-1">가장 정확 (신뢰도 0.95)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 w-6 shrink-0">②</span>
                <span className="text-cyan-300">빈티지 연도로 자동 계산</span>
                <span className="text-white/30 ml-1">(신뢰도 0.90)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-violet-400 w-6 shrink-0">③</span>
                <span className="text-violet-300">리뷰 텍스트에서 AI 추론</span>
                <span className="text-white/30 ml-1">(신뢰도 0.65~0.85)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/30 w-6 shrink-0">④</span>
                <span className="text-white/40">카테고리별 평균값 사용</span>
                <span className="text-white/20 ml-1">폴백 (신뢰도 0.40)</span>
              </div>
            </div>
          </div>
        </FlowNode>

        {/* ── STAGE 04: Layer 1 통계 학습 ── */}
        <FlowNode
          number="04" icon={Layers} color="#60a5fa" index={3}
          title="통계 학습 — 유사 음료 그룹 분류"
          subtitle="Statistical Clustering · 36 Groups"
          inputs={[
            { label: '연도별 풍미 전이 곡선', type: 'curve' },
            { label: '6축 풍미 점수', type: 'nlp' },
            { label: '제품 카테고리 (10종)', type: 'raw' },
            { label: '숙성 단계', type: 'curve' },
          ]}
          outputs={[
            { label: '36개 그룹 통계 모델', type: 'model' },
            { label: '풍미 분포 (평균·상하위 25%)', type: 'model' },
            { label: '음용 적정 구간 통계', type: 'model' },
            { label: '유사 클러스터 Top 5', type: 'model' },
          ]}
        >
          <p>
            <span className="text-blue-300">제품 카테고리(10종) × 숙성 단계(4단계)</span> 조합으로
            최대 <span className="text-blue-300">36개 그룹</span>을 만들어
            각 그룹의 전형적인 풍미 프로파일을 학습합니다.
          </p>
          <p>
            예측 시 입력된 제품의 카테고리·산도·당도·환원 성향 등을 기준으로
            <span className="text-blue-300">유사도 점수</span>를 매겨 가장 비슷한 그룹 5개를 찾아
            가중 평균으로 기준 풍미를 산출합니다.
          </p>
          <div className="mt-3 rounded-xl border border-blue-500/15 bg-blue-500/[0.04] p-3 space-y-2">
            <p className="text-[10px] font-mono text-blue-400/60 uppercase tracking-widest">클러스터 매칭 유사도 점수</p>
            <p className="text-[11px] text-white/35 leading-relaxed">
              각 그룹에 대해 4가지 기준으로 유사도 점수를 합산합니다.
              카테고리가 같으면 +50점, pH 유사도 최대 +20점, 당도 유사도 최대 +15점,
              표본 수 보너스 최대 +15점. 상위 5개 그룹을 가중 평균하여 기준 풍미를 도출합니다.
            </p>
            <div className="font-mono text-[10px] text-white/30 bg-black/20 rounded-lg p-2 leading-relaxed">
              유사도 = <span className="text-blue-300/80">카테고리 일치(+50)</span> + pH 근접도(+20) + 당도 근접도(+15) + 표본 수(+15)
            </div>
          </div>
          <div className="mt-2 rounded-xl border border-blue-500/15 bg-blue-500/[0.04] p-3 space-y-2">
            <p className="text-[10px] font-mono text-blue-400/60 uppercase tracking-widest">예측 기준점 설정 방식</p>
            <p className="text-[11px] text-white/35 leading-relaxed">
              예측의 시작점은 <span className="text-blue-300">투하 직전 상태의 풍미</span>를 기준으로 고정됩니다.
              해저 숙성이 그 기준점에서 얼마나 변화를 일으키는지를 계산하는 방식으로,
              단순히 도착 지점의 평균을 쓰는 것보다 더 정확하게 변화량을 반영합니다.
            </p>
            <div className="font-mono text-[10px] text-white/30 bg-black/20 rounded-lg p-2 leading-relaxed">
              예측값 = <span className="text-emerald-400/80">투하 전 상태</span> + (목표 단계 평균 − 투하 전 상태) × 해저 보정 계수
            </div>
          </div>
        </FlowNode>

        {/* ── STAGE 05: Layer 2 AI 추론 ── */}
        <FlowNode
          number="05" icon={Brain} color="#c084fc" index={4}
          title="AI가 해당 제품 특성 + 보정 계수 추론"
          subtitle="AI Expert Profile · Aging Factors · Quality Weights"
          inputs={[
            { label: '통계 그룹 모델', type: 'model' },
            { label: '제품명 / 빈티지', type: 'raw' },
            { label: '생산자 / 환원 성향', type: 'raw' },
            { label: '제품 카테고리', type: 'raw' },
          ]}
          outputs={[
            { label: 'AI 전문가 풍미 프로파일', type: 'ai' },
            { label: 'agingFactors (숙성 보정 계수)', type: 'ai' },
            { label: 'qualityWeights (품질 가중치)', type: 'ai' },
            { label: 'AI 인사이트 텍스트', type: 'ai' },
          ]}
        >
          <p>
            통계 모델은 같은 종류의 평균을 다루지만, AI는 <span className="text-purple-300">해당 제품 고유의 특성</span>을 반영합니다.
            제품명과 생산자 정보를 바탕으로 인터넷 검색을 통해 그 음료에 맞는 전문가 수준 풍미 프로파일을 생성합니다.
          </p>
          <p>
            AI는 풍미 프로파일과 함께 <span className="text-purple-300">카테고리별 숙성 보정 계수(agingFactors)</span>와
            <span className="text-purple-300">품질 평가 가중치(qualityWeights)</span>를 실시간으로 추론합니다.
            기존 하드코딩된 샴페인 전용 계수 대신, 커피·사케·위스키 등 각 카테고리에 맞는 최적 계수를 AI가 판단합니다.
          </p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="rounded-xl border border-purple-500/15 bg-purple-500/[0.04] p-3 space-y-1">
              <p className="text-[10px] font-mono text-purple-400/60 uppercase tracking-widest">agingFactors</p>
              <p className="text-[11px] text-white/35 leading-relaxed">
                숙성 곡선의 형태를 결정하는 4개 파라미터.
                질감 승수(0.3~1.5), 향 감쇠율(0.3~1.5), 위험 승수(0.3~2.0), 기준 숙성 연수.
              </p>
              <div className="font-mono text-[9px] text-white/25 bg-black/20 rounded-lg p-2">
                textureMult · aromaDecay · riskMult · baseAgingYears
              </div>
            </div>
            <div className="rounded-xl border border-purple-500/15 bg-purple-500/[0.04] p-3 space-y-1">
              <p className="text-[10px] font-mono text-purple-400/60 uppercase tracking-widest">qualityWeights</p>
              <p className="text-[11px] text-white/35 leading-relaxed">
                복합 품질 점수 계산 시 4개 지표의 가중치.
                합계가 1.0이 되도록 자동 정규화됩니다.
              </p>
              <div className="font-mono text-[9px] text-white/25 bg-black/20 rounded-lg p-2">
                texture · aroma · bubble · risk (합계 = 1.0)
              </div>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-white/30">
            AI가 계수를 반환하지 못하면 기본값(texture 1.0, aroma 1.0, risk 1.0 / 가중치 0.30·0.30·0.25·0.15)으로 폴백합니다.
          </p>
        </FlowNode>

        {/* ── STAGE 06: 해저 환경 보정 ── */}
        <FlowNode
          number="06" icon={Waves} color="#22d3ee" index={5}
          title="해저 환경 보정"
          subtitle="TCI · FRI · BRI Coefficient Application"
          inputs={[
            { label: 'expertProfileJson (AI)', type: 'ai' },
            { label: 'terrestrialAgingYears (소믈리에)', type: 'nlp' },
            { label: 'baseAgingYears (폴백)', type: 'model' },
            { label: 'agingDepth (수심 m)', type: 'raw' },
            { label: 'underseaMonths (계획 기간)', type: 'raw' },
          ]}
          outputs={[
            { label: 'textureMaturity (TCI)', type: 'coeff' },
            { label: 'aromaFreshness (FRI)', type: 'coeff' },
            { label: 'bubbleRefinement (BRI)', type: 'coeff' },
            { label: 'offFlavorRisk', type: 'coeff' },
          ]}
        >
          <p>
            3개 보정 계수가 지상 풍미 기준선에 적용됩니다.
            각 계수는 해저 4°C, 수심 30m의 물리적 조건이 숙성에 미치는 영향을 모델링합니다.
          </p>

          {/* 계수 3개 인라인 */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { key: 'TCI', color: '#22d3ee', formula: 'sigmoid(base + m/(12×TCI))', basis: '가설 (CI: 0.06–0.54)', note: '질감·자가분해 가속', val: '0.30' },
              { key: 'FRI', color: '#34d399', formula: 'exp(-Ea/R × (1/T_sea − 1/T_land))', basis: 'Arrhenius Ea=47kJ/mol', note: '산화 속도 56.5% 감소', val: '0.565' },
              { key: 'BRI', color: '#C4A052', formula: '(5 bar / driving_force) × kH_ratio', basis: "Henry's Law 수심 30m", note: '기포 안정화 ×1.60', val: '1.60' },
            ].map(c => (
              <div key={c.key} className="rounded-xl border p-3 space-y-1" style={{ borderColor: `${c.color}20`, backgroundColor: `${c.color}06` }}>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-mono font-bold" style={{ color: c.color }}>{c.key}</span>
                  <span className="text-sm font-mono text-white/60">{c.val}</span>
                </div>
                <p className="text-[10px] text-white/40">{c.note}</p>
                <code className="text-[9px] text-white/25 font-mono break-all leading-tight block">{c.formula}</code>
                <p className="text-[9px] text-white/20">{c.basis}</p>
              </div>
            ))}
          </div>
        </FlowNode>

        {/* ── STAGE 07: 복합 품질 계산 ── */}
        <FlowNode
          number="07" icon={Target} color="#C4A052" index={6}
          title="복합 품질 점수 & 골든 윈도우"
          subtitle="Composite Quality · Golden Window Detection"
          inputs={[
            { label: 'textureMaturity', type: 'coeff' },
            { label: 'aromaFreshness', type: 'coeff' },
            { label: 'bubbleRefinement', type: 'coeff' },
            { label: 'offFlavorRisk', type: 'coeff' },
            { label: 'AI qualityWeights', type: 'ai' },
          ]}
          outputs={[
            { label: 'compositeQuality (0–100)', type: 'output' },
            { label: 'goldenWindow (start–end월)', type: 'output' },
            { label: 'peakMonth + peakScore', type: 'output' },
            { label: '1–36개월 타임라인', type: 'output' },
          ]}
        >
          <p>
            4개 지표를 <span className="text-amber-300">AI가 추론한 카테고리별 가중치(qualityWeights)</span>로 합산합니다.
            예) 샴페인: 향(0.35) &gt; 질감(0.25) = 기포(0.25) &gt; 위험(0.15),
            콜드브루 커피: 질감(0.35) &gt; 향(0.30) &gt; 기포(0.20) &gt; 위험(0.15).
          </p>
          <p>
            4개 지표가 고르게 높을 때 <span className="text-amber-300">시너지 보너스(최대 +15점)</span>가 발동됩니다
            — 균형도(min/max 비율) ≥ 0.5 이고 평균 ≥ 60점인 경우.
          </p>
          <p>
            1–36개월을 모두 계산한 뒤 <span className="text-amber-300">피크 점수의 95% 이상인 구간</span>을
            골든 윈도우로 선정합니다. 환원 성향이 높으면 윈도우를 앞으로 2개월 축소합니다.
          </p>
          <div className="mt-2 font-mono text-[10px] text-white/30 rounded-lg bg-white/[0.03] p-3 leading-relaxed">
            <span className="text-amber-300/70">compositeQuality</span> = Σ(score_i × weight_i) + synergyBonus<br/>
            <span className="text-white/20">where synergyBonus = 15 × avgFactor × harmonyFactor</span>
          </div>
        </FlowNode>

        {/* ── STAGE 08: 예측 결과 ── */}
        <FlowNode
          number="08" icon={Sparkles} color="#B76E79" index={7} isLast
          title="최종 예측 리포트"
          subtitle="Prediction Output"
          inputs={[
            { label: '1–36개월 타임라인', type: 'output' },
            { label: 'goldenWindow', type: 'output' },
            { label: 'expertProfileJson', type: 'ai' },
            { label: 'compositeQuality', type: 'output' },
          ]}
          outputs={[
            { label: 'Before/After 레이더', type: 'output' },
            { label: '타임라인 그래프', type: 'output' },
            { label: '품질 점수 카드', type: 'output' },
            { label: 'AI 인사이트 텍스트', type: 'output' },
          ]}
        >
          <p>
            레이더 차트(Before → After), 1–36개월 풍미 타임라인, 골든 윈도우 하이라이트,
            품질 점수 4종(종합·질감·향·환원취), AI 인사이트 텍스트로 구성된
            종합 예측 리포트가 대시보드에 표시됩니다.
          </p>
        </FlowNode>
      </section>

      {/* ─── Before→After 레이더 ─────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 pt-16 sm:pt-24">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-[#B76E79]/60" />
          <h2 className="text-xs sm:text-sm text-white/40 tracking-widest uppercase">Flavor Transformation</h2>
        </motion.div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
            <RadarDiagram />
            <div className="flex-1 space-y-4">
              <h3 className="text-lg sm:text-xl text-white/85" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                해저 숙성에 의한 풍미 변화
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Fruity → Yeasty', desc: '과일 향이 줄어들고 효모 자가분해에 의한 복합적 향이 발달합니다.', color: '#34d399' },
                  { label: 'Floral ↑ Body ↑', desc: '꽃 향은 보존되며, 고압 환경에서 질감이 풍부해집니다.', color: '#a78bfa' },
                  { label: 'Finish & Complexity ↑', desc: '여운이 길어지고 전체적인 복합성이 크게 향상됩니다.', color: '#B76E79' },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-2.5">
                    <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: item.color }} />
                    <div>
                      <span className="text-xs font-mono font-medium" style={{ color: item.color }}>{item.label}</span>
                      <p className="text-xs text-white/35 leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 보정 계수 상세 ────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 pt-16 sm:pt-24">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-[#C4A052]/60" />
          <h2 className="text-xs sm:text-sm text-white/40 tracking-widest uppercase">Undersea Coefficients — Detail</h2>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="space-y-3">
          <CoefficientRow
            keyName="TCI" label="온도·압력 계수 (Temperature-Pressure Coefficient)" value="0.30"
            formula="score = 100 / (1 + exp(-0.6 × (baseYears + m/(12×TCI) − 4.5)))"
            basis="가설 · 95% CI [0.06, 0.54]" color="#22d3ee" sourceType="hypothesis"
            description="해저 4°C 항온 환경이 효모 자가분해와 질감 발달을 가속시키는 정도를 모델링합니다. 직접 검증 데이터가 없어 넓은 신뢰 구간을 가지며, 인양 후 시음 데이터 축적에 따라 베이지안 업데이트 예정입니다."
          />
          <CoefficientRow
            keyName="FRI" label="향 신선도 지수 (Flavor Retention Index)" value="0.565"
            formula="FRI = exp[(-Ea/R) × (1/T_ocean − 1/T_cellar)]"
            basis="아레니우스 방정식 · Ea=47kJ/mol · 95% CI [0.524, 0.608]" color="#34d399" sourceType="scientific"
            description="저온(4°C vs 12°C)에서 산화 반응 속도 감소율을 아레니우스 방정식으로 도출합니다. 해저에서 산화 속도가 지상의 56.5% 수준으로 낮아져 향기 화합물이 더 오래 보존됩니다."
          />
          <CoefficientRow
            keyName="BRI" label="기포 안정화 지수 (Bubble Retention Index)" value="1.60"
            formula="BRI = (P_land_driving / P_ocean_driving) × kH_ratio"
            basis="Henry's Law · 수심 30m · 95% CI [1.37, 1.92]" color="#C4A052" sourceType="scientific"
            description="수심 30m에서 외부 수압(4 bar)이 CO₂ 손실 구동력을 지상(5 bar) 대비 40%로 감소시킵니다. 저온 CO₂ 용해도 증가 보정(×1.24) 적용. 기포가 더 미세하고 균일하게 유지됩니다."
          />
        </motion.div>
      </section>

      {/* ─── 한계 & 로드맵 ──────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 pt-16 sm:pt-24">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
          <h2 className="text-xs sm:text-sm text-white/40 tracking-widest uppercase">Current Limitations</h2>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="rounded-2xl border border-amber-500/10 bg-amber-500/[0.03] p-5 sm:p-6 space-y-3">
          {/* 해결된 항목 */}
          {[
            { title: '단면 데이터 추론 한계', resolved: true, resolvedLabel: '투하 전 기준점 앵커 고정 방식 적용', desc: '같은 음료를 추적하는 대신, 투하 전 상태를 기준점으로 고정하고 변화량만 보정하는 방식으로 편향을 줄였습니다.', color: '#22d3ee' },
            { title: '숙성 연수 고정값 사용', resolved: true, resolvedLabel: '소믈리에 입력 우선 사용으로 개선', desc: '소믈리에 실측값 → 빈티지 자동 계산 → AI 추론 → 카테고리 평균 순의 4단계 우선순위를 적용합니다.', color: '#34d399' },
            { title: '숙성 연수 데이터 신뢰도 불명확', resolved: true, resolvedLabel: '신뢰도 점수 추출 및 필터링 적용', desc: '신뢰도 0.75 미만 데이터는 모델 학습에서 제외하여 오염된 학습 데이터 유입을 방지합니다.', color: '#a78bfa' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[9px]" style={{ backgroundColor: `${item.color}15`, border: `1px solid ${item.color}40`, color: item.color }}>✓</div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-white/50 line-through">{item.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono" style={{ color: item.color, backgroundColor: `${item.color}10`, border: `1px solid ${item.color}25` }}>{item.resolvedLabel}</span>
                </div>
                <p className="text-[11px] text-white/25 leading-relaxed mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
          {/* 구분선 */}
          <div className="border-t border-white/[0.04] pt-3 space-y-3">
            {/* 미해결 항목 */}
            {[
              { title: '6축 점수 추출 진행 중', desc: 'NLP 추출 완료 후 aging_years_confidence ≥ 0.75 데이터로 Layer 1 재학습 예정. 현재 폴백 방식 사용 중.', color: '#fb923c' },
              { title: 'TCI 미검증', desc: 'TCI(질감 가속 계수)는 유사 연구에서 간접 추론한 가설적 추정값입니다. 95% CI [0.06, 0.54]로 불확실성이 매우 크며, 실제 인양 후 블라인드 시음 데이터 축적 후 베이지안 업데이트가 필요합니다.', color: '#c084fc' },
              { title: 'Survivorship Bias', desc: '오래된 와인 리뷰는 품질이 뛰어나 살아남은 것만 남습니다. 고령 구간 클러스터의 품질 과대평가 가능성이 있으며, 인양 후 데이터로만 검증 가능합니다.', color: '#f87171' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: item.color }} />
                <div>
                  <span className="text-xs font-medium text-white/60">{item.title}</span>
                  <p className="text-[11px] text-white/30 leading-relaxed mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── 예측 정확도 현황 ────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 pt-16 sm:pt-24">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
          <h2 className="text-xs sm:text-sm text-white/40 tracking-widest uppercase">Model Accuracy · Current Status</h2>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="p-1">
            {[
              {
                status: 'done',
                label: '예측 기준점 고정',
                desc: '투하 전 음료의 상태를 기준점으로 고정하고, 해저에서 그 변화량만 계산합니다. 단순히 도착 지점 평균을 쓰는 것보다 실제 변화를 더 정확히 반영합니다.',
              },
              {
                status: 'done',
                label: '숙성 연수 신뢰도 필터링',
                desc: '리뷰에서 추출한 숙성 연수의 신뢰도를 3단계로 구분하고, 신뢰도 미달 데이터는 학습에서 제외합니다. 잘못된 데이터가 모델을 오염시키는 것을 방지합니다.',
              },
              {
                status: 'done',
                label: '소믈리에 실측 데이터 우선 반영',
                desc: '제품 등록 시 소믈리에가 직접 입력한 숙성 연수를 가장 높은 우선순위로 사용합니다. AI 추론이나 평균값 대신 실제 전문가 경험이 예측에 직접 반영됩니다.',
              },
              {
                status: 'pending',
                label: '전체 데이터 풍미 점수 추출 중',
                desc: '112K건 리뷰 전체에서 6축 풍미 점수를 추출하는 작업이 진행 중입니다. 완료되면 더 많은 데이터로 통계 모델을 재학습해 정확도가 크게 향상될 예정입니다.',
              },
            ].map((item, i) => (
              <div key={i} className={`flex gap-4 p-4 rounded-xl ${i < 3 ? 'mb-1' : ''} ${item.status === 'done' ? 'bg-emerald-500/[0.04]' : 'bg-amber-500/[0.04]'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-mono text-xs font-bold ${item.status === 'done' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'}`}>
                  {item.status === 'done' ? '✓' : '⏳'}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-xs font-medium block mb-1 ${item.status === 'done' ? 'text-white/70' : 'text-white/50'}`}>{item.label}</span>
                  <p className="text-[11px] text-white/30 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-white/[0.04] flex items-center justify-between">
            <span className="text-[11px] text-white/25">과학적 타당성 점수</span>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-white/30">초기 <span className="text-white/50">4.5</span> / 10</span>
              <span className="text-white/15">→</span>
              <span className="text-[11px] font-mono text-emerald-400/70">현재 <span className="text-emerald-400">6.2</span> / 10</span>
              <span className="text-white/15">→</span>
              <span className="text-[11px] font-mono text-white/25">인양 후 <span className="text-white/40">7.5+</span> / 10</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 pt-12 sm:pt-20 text-center">
        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <Link href="/uaps"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-cyan-400/20 text-cyan-400/70 text-sm hover:bg-cyan-400/[0.06] hover:border-cyan-400/30 transition-all duration-300">
            <ArrowLeft className="w-3.5 h-3.5" />
            대시보드로 돌아가기
          </Link>
        </motion.div>
      </section>

    </main>
  );
}
