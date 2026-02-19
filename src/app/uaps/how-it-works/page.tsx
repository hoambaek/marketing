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
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// 6단계 파이프라인 데이터
// ═══════════════════════════════════════════════════════════════════════════

const PIPELINE_STEPS = [
  {
    number: '01',
    title: '데이터 수집',
    subtitle: 'Terrestrial Data Collection',
    icon: Database,
    color: '#22d3ee',
    description:
      '전 세계 스파클링 와인 테이스팅 노트를 수집합니다. CellarTracker, Vivino, NeurIPS 데이터셋 등에서 32,000건 이상의 리뷰 데이터를 표준화된 6축 풍미 프로파일로 변환합니다.',
    detail: '와인 타입 × 숙성 단계별 클러스터링',
  },
  {
    number: '02',
    title: 'Layer 1: 통계 학습',
    subtitle: 'Statistical Clustering',
    icon: Layers,
    color: '#34d399',
    description:
      '와인 타입(Blend, Vintage, Rosé 등)과 숙성 단계(Developing, Mature, Aged)의 조합으로 모델 그룹을 생성합니다. 각 그룹의 평균 풍미 프로파일과 표준편차를 계산하여 기준선을 확립합니다.',
    detail: '19개 모델 그룹 · 클러스터 유사도 매칭',
  },
  {
    number: '03',
    title: 'Layer 2: AI 추론',
    subtitle: 'Gemini AI Inference',
    icon: Brain,
    color: '#a78bfa',
    description:
      'Google Gemini AI가 통계 기준선을 보정합니다. 와인의 품종, 빈티지, 생산자 특성을 고려한 전문가 수준의 풍미 프로파일을 생성하고, 해저 숙성 시 예상되는 변화를 추론합니다.',
    detail: 'gemini-2.0-flash · 전문가 프로파일 생성',
  },
  {
    number: '04',
    title: '해저 환경 보정',
    subtitle: 'Undersea Aging Simulation',
    icon: Waves,
    color: '#22d3ee',
    description:
      '3가지 해양 환경 계수(TCI, FRI, BRI)를 적용하여 해저 숙성의 고유한 영향을 시뮬레이션합니다. 온도, 압력, 미세진동이 풍미에 미치는 영향을 과학적 모델로 계산합니다.',
    detail: 'TCI · FRI · BRI 3축 보정',
  },
  {
    number: '05',
    title: '타임라인 생성',
    subtitle: 'Timeline Projection',
    icon: Target,
    color: '#C4A052',
    description:
      '1~36개월 구간의 풍미 변화 타임라인을 생성합니다. 각 시점별 6축 프로파일, 품질 점수, 골든 윈도우(최적 수확 시점)를 계산합니다. Off-flavor 리스크는 시그모이드 함수로 모델링합니다.',
    detail: '골든 윈도우 95% · Off-flavor 시그모이드',
  },
  {
    number: '06',
    title: '예측 결과',
    subtitle: 'Prediction Output',
    icon: Sparkles,
    color: '#B76E79',
    description:
      'Before→After 레이더 차트, 타임라인 그래프, 품질 점수(종합/질감/향/환원취), AI 인사이트 텍스트를 포함한 종합 예측 리포트를 생성합니다.',
    detail: '6축 레이더 · 타임라인 · 품질 스코어',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 보정 계수 데이터
// ═══════════════════════════════════════════════════════════════════════════

const COEFFICIENTS = [
  {
    key: 'TCI',
    label: '온도·압력 계수',
    subtitle: 'Temperature-Pressure Coefficient',
    icon: Thermometer,
    color: '#22d3ee',
    value: '0.40',
    basis: '가설적 추정',
    sourceType: 'hypothesis' as const,
    description:
      '해저 12°C 항온 + 2.5atm 가압 환경이 효모자가분해와 질감 발달에 미치는 영향을 모델링합니다.',
  },
  {
    key: 'FRI',
    label: '향 신선도 지수',
    subtitle: 'Flavor Retention Index',
    icon: Wind,
    color: '#34d399',
    value: '0.56',
    basis: '아레니우스 방정식 · Ea=47kJ/mol',
    sourceType: 'scientific' as const,
    description:
      '저온 환경에서의 향기 화합물 보존율을 아레니우스 반응속도론으로 계산합니다.',
  },
  {
    key: 'BRI',
    label: '기포 안정화 지수',
    subtitle: 'Bubble Retention Index',
    icon: Droplets,
    color: '#C4A052',
    value: '0.72',
    basis: 'Henry의 법칙',
    sourceType: 'scientific' as const,
    description:
      '고압 환경에서 CO₂ 용해도 증가에 따른 기포 크기 미세화와 무스(mousse) 질감 향상을 계산합니다.',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 컴포넌트
// ═══════════════════════════════════════════════════════════════════════════

function TimelineNode({
  step,
  index,
  isLast,
}: {
  step: (typeof PIPELINE_STEPS)[number];
  index: number;
  isLast: boolean;
}) {
  const Icon = step.icon;

  return (
    <div className="relative flex gap-4 sm:gap-8">
      {/* 세로 라인 + 노드 */}
      <div className="flex flex-col items-center shrink-0">
        {/* 번호 노드 */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="relative z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2"
          style={{
            borderColor: `${step.color}60`,
            background: `radial-gradient(circle, ${step.color}15, transparent)`,
            boxShadow: `0 0 20px ${step.color}20, 0 0 40px ${step.color}10`,
          }}
        >
          <span
            className="text-xs sm:text-sm font-mono font-bold"
            style={{ color: step.color }}
          >
            {step.number}
          </span>
        </motion.div>

        {/* 연결 라인 */}
        {!isLast && (
          <motion.div
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: index * 0.1 + 0.3 }}
            className="w-px flex-1 min-h-[40px] origin-top"
            style={{
              background: `linear-gradient(to bottom, ${step.color}40, ${PIPELINE_STEPS[index + 1]?.color ?? step.color}40)`,
            }}
          />
        )}
      </div>

      {/* 카드 */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6, delay: index * 0.1 + 0.15 }}
        className="flex-1 pb-8 sm:pb-12"
      >
        <div
          className="relative rounded-2xl border bg-white/[0.02] p-5 sm:p-6 overflow-hidden group hover:bg-white/[0.04] transition-colors duration-500"
          style={{ borderColor: `${step.color}15` }}
        >
          {/* 글로우 배경 */}
          <div
            className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-[0.03] blur-3xl group-hover:opacity-[0.06] transition-opacity duration-700"
            style={{ backgroundColor: step.color }}
          />

          {/* 헤더 */}
          <div className="flex items-start gap-3 mb-3">
            <div
              className="p-2 rounded-xl shrink-0"
              style={{ backgroundColor: `${step.color}10` }}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: step.color }} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-white/90 leading-tight">
                {step.title}
              </h3>
              <p
                className="text-[10px] sm:text-xs tracking-wider uppercase mt-0.5"
                style={{ color: `${step.color}80` }}
              >
                {step.subtitle}
              </p>
            </div>
          </div>

          {/* 설명 */}
          <p className="text-xs sm:text-sm text-white/45 leading-relaxed mb-3">
            {step.description}
          </p>

          {/* 디테일 태그 */}
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-mono"
            style={{
              backgroundColor: `${step.color}08`,
              color: `${step.color}90`,
              border: `1px solid ${step.color}20`,
            }}
          >
            <div
              className="w-1 h-1 rounded-full"
              style={{ backgroundColor: step.color }}
            />
            {step.detail}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CoefficientCard({
  coeff,
  index,
}: {
  coeff: (typeof COEFFICIENTS)[number];
  index: number;
}) {
  const Icon = coeff.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.5, delay: index * 0.12 }}
      className="rounded-2xl border bg-white/[0.02] p-5 sm:p-6 hover:bg-white/[0.04] transition-colors duration-500 group"
      style={{ borderColor: `${coeff.color}15` }}
    >
      {/* 아이콘 + 키 */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="p-2 rounded-xl"
          style={{ backgroundColor: `${coeff.color}10` }}
        >
          <Icon className="w-4 h-4" style={{ color: coeff.color }} />
        </div>
        <div>
          <span
            className="text-sm font-mono font-bold"
            style={{ color: coeff.color }}
          >
            {coeff.key}
          </span>
          <span className="text-[10px] text-white/30 ml-2">{coeff.value}</span>
        </div>
      </div>

      {/* 라벨 */}
      <h4 className="text-sm font-medium text-white/80 mb-0.5">{coeff.label}</h4>
      <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2">
        {coeff.subtitle}
      </p>

      {/* 설명 */}
      <p className="text-xs text-white/40 leading-relaxed mb-3">
        {coeff.description}
      </p>

      {/* 근거 */}
      <div
        className="flex items-center gap-1.5 text-[10px] font-mono"
        style={{ color: `${coeff.color}70` }}
      >
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor:
              coeff.sourceType === 'scientific' ? '#34d399' : '#f59e0b',
          }}
        />
        {coeff.basis}
      </div>
    </motion.div>
  );
}

// 레이더 Before→After 도식 (CSS)
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
  const afterValues = [0.50, 0.70, 0.75, 0.55, 0.70, 0.65];

  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 75;

  const toXY = (angle: number, r: number) => ({
    x: cx + r * Math.cos((angle - 90) * (Math.PI / 180)),
    y: cy + r * Math.sin((angle - 90) * (Math.PI / 180)),
  });

  const beforePoints = axes
    .map((a, i) => toXY(a.angle, beforeValues[i] * maxR))
    .map((p) => `${p.x},${p.y}`)
    .join(' ');

  const afterPoints = axes
    .map((a, i) => toXY(a.angle, afterValues[i] * maxR))
    .map((p) => `${p.x},${p.y}`)
    .join(' ');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        {/* 그리드 */}
        {[0.25, 0.5, 0.75, 1].map((s) => (
          <polygon
            key={s}
            points={axes
              .map((a) => toXY(a.angle, s * maxR))
              .map((p) => `${p.x},${p.y}`)
              .join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.5"
          />
        ))}

        {/* 축 라인 */}
        {axes.map((a) => {
          const end = toXY(a.angle, maxR);
          return (
            <line
              key={a.label}
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="0.5"
            />
          );
        })}

        {/* Before 영역 */}
        <polygon
          points={beforePoints}
          fill="rgba(34,211,238,0.08)"
          stroke="rgba(34,211,238,0.4)"
          strokeWidth="1"
          strokeDasharray="4 3"
        />

        {/* After 영역 */}
        <polygon
          points={afterPoints}
          fill="rgba(183,110,121,0.12)"
          stroke="rgba(183,110,121,0.7)"
          strokeWidth="1.5"
        />

        {/* 축 라벨 */}
        {axes.map((a) => {
          const pos = toXY(a.angle, maxR + 16);
          return (
            <text
              key={a.label}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-white/30 text-[8px] font-mono"
            >
              {a.label}
            </text>
          );
        })}
      </svg>

      {/* 범례 */}
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-px border-t border-dashed border-cyan-400/50" />
          <span className="text-[10px] text-white/35">Before</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 rounded-full bg-[#B76E79]/70" />
          <span className="text-[10px] text-white/35">After</span>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 메인 페이지
// ═══════════════════════════════════════════════════════════════════════════

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-[#0a0b0d] text-white pb-20">
      {/* 헤더 */}
      <section className="relative pt-8 sm:pt-16 pb-6 sm:pb-10 px-4 sm:px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          {/* 뒤로가기 */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link
              href="/uaps"
              className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors mb-8"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              UAPS 대시보드
            </Link>
          </motion.div>

          {/* 타이틀 */}
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-cyan-400/70 text-[10px] sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-2 sm:mb-4 font-light"
          >
            How It Works
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-3xl sm:text-5xl text-white/95 mb-3 sm:mb-6 leading-[1.1] tracking-tight"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            <span className="bg-gradient-to-r from-cyan-300 via-white to-[#B76E79] bg-clip-text text-transparent">
              UAPS 예측 파이프라인
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-white/40 text-sm sm:text-lg max-w-xl font-light leading-relaxed"
          >
            데이터 수집부터 최종 예측까지, 해저 숙성의 풍미 변화를 과학적으로
            예측하는 6단계 과정을 탐험합니다.
          </motion.p>
        </div>
      </section>

      {/* 구분선 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 6단계 세로 타임라인 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 pt-10 sm:pt-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-8"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/60" />
          <h2 className="text-xs sm:text-sm text-white/40 tracking-widest uppercase">
            Pipeline Steps
          </h2>
        </motion.div>

        <div className="pl-1 sm:pl-4">
          {PIPELINE_STEPS.map((step, i) => (
            <TimelineNode
              key={step.number}
              step={step}
              index={i}
              isLast={i === PIPELINE_STEPS.length - 1}
            />
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 보정 계수 3열 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 pt-12 sm:pt-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-8"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#C4A052]/60" />
          <h2 className="text-xs sm:text-sm text-white/40 tracking-widest uppercase">
            Undersea Coefficients
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {COEFFICIENTS.map((coeff, i) => (
            <CoefficientCard key={coeff.key} coeff={coeff} index={i} />
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Before → After 레이더 도식 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 pt-12 sm:pt-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-8"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#B76E79]/60" />
          <h2 className="text-xs sm:text-sm text-white/40 tracking-widest uppercase">
            Flavor Transformation
          </h2>
        </motion.div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
            {/* 레이더 */}
            <RadarDiagram />

            {/* 설명 */}
            <div className="flex-1 space-y-4">
              <h3
                className="text-lg sm:text-xl text-white/85"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                해저 숙성에 의한 풍미 변화
              </h3>
              <div className="space-y-3">
                {[
                  {
                    label: 'Fruity → Yeasty',
                    desc: '과일 향이 줄어들고 효모 자가분해에 의한 복합적 향이 발달합니다.',
                    color: '#34d399',
                  },
                  {
                    label: 'Floral ↑ Body ↑',
                    desc: '꽃 향은 보존되며, 고압 환경에서 질감이 풍부해집니다.',
                    color: '#a78bfa',
                  },
                  {
                    label: 'Finish & Complexity ↑',
                    desc: '여운이 길어지고 전체적인 복합성이 크게 향상됩니다.',
                    color: '#B76E79',
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-2.5">
                    <div
                      className="w-1 h-1 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <span
                        className="text-xs font-mono font-medium"
                        style={{ color: item.color }}
                      >
                        {item.label}
                      </span>
                      <p className="text-xs text-white/35 leading-relaxed mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 하단 CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 pt-12 sm:pt-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/uaps"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-cyan-400/20 text-cyan-400/70 text-sm hover:bg-cyan-400/[0.06] hover:border-cyan-400/30 transition-all duration-300"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            대시보드로 돌아가기
          </Link>
        </motion.div>
      </section>
    </main>
  );
}
