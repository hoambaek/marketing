'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Footer } from '@/components/layout/Footer';
import AdminDashboard from '@/app/admin/AdminDashboard';
import {
  Compass,
  Eye,
  Mail,
  Handshake,
  Instagram,
  Bookmark,
  Send,
  Globe,
  Sparkles,
  BarChart3,
  Database,
  Route,
  MessageCircleHeart,
  AlertTriangle,
  Siren,
  RefreshCw,
} from 'lucide-react';

/**
 * 수동 갱신 버튼 — 수집기 4종 실행 후 이어서 주간 리포트까지 생성한다.
 * 1) POST /api/admin/refresh (수집) → 2) POST /api/admin/generate-report (최신 데이터로 리포트)
 * 리포트는 수집이 끝난 뒤 돌아야 최신 데이터를 반영하므로 순차 실행한다.
 */
function RefreshAllButton() {
  const router = useRouter();
  const [phase, setPhase] = useState<'idle' | 'collecting' | 'analyzing'>('idle');
  const [note, setNote] = useState<string | null>(null);

  async function run() {
    if (phase !== 'idle') return;
    setNote(null);
    setPhase('collecting');
    try {
      const res = await fetch('/api/admin/refresh', { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) throw new Error('수집 요청 실패');
      const failed: string[] = data.errors ?? [];

      // 수집 후 최신 데이터로 주간 리포트 재생성 (수집 실패해도 있는 데이터로 진행)
      setPhase('analyzing');
      let reportNote = '';
      try {
        const rres = await fetch('/api/admin/generate-report', { method: 'POST' });
        const rdata = await rres.json().catch(() => null);
        if (rres.ok && rdata?.success) reportNote = ' · 리포트 갱신';
        else if (rdata?.reason) reportNote = ` · 리포트 skip(${rdata.reason})`;
        else reportNote = ' · 리포트 실패';
      } catch {
        reportNote = ' · 리포트 실패';
      }

      const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      setNote(
        (failed.length === 0 ? `완료 ${time}` : `수집 일부 실패: ${failed.join(', ')}`) + reportNote,
      );
      router.refresh();
    } catch {
      setNote('갱신 실패');
    } finally {
      setPhase('idle');
    }
  }

  const busy = phase !== 'idle';
  const label = phase === 'collecting' ? '수집 중…' : phase === 'analyzing' ? '리포트 분석 중…' : '지금 갱신';

  return (
    <button
      onClick={run}
      disabled={busy}
      className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-medium whitespace-nowrap border border-[#b7916e]/30 text-[#b7916e] hover:bg-[#b7916e]/10 transition-colors disabled:opacity-60 shrink-0 cursor-pointer"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
      <span>{label}</span>
      {note && <span className="text-[9px] sm:text-[10px] text-white/40 font-normal">{note}</span>}
    </button>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export interface StatCard {
  cur: number;
  prev: number;
}

export interface SourceState {
  key: string;
  name: string;
  configured: boolean;
  lastDate?: string;
  /** 데이터 품질 게이트: 허용 지연 초과 (신뢰 저하) */
  stale?: boolean;
  staleDays?: number;
}

export interface AlertItem {
  id: number;
  detected_at: string;
  metric_key: string;
  label: string;
  severity: 'warning' | 'critical';
  direction: 'drop' | 'spike' | 'zero';
  current_value: number | null;
  baseline_value: number | null;
  consecutive_days: number | null;
  investigation_md: string | null;
}

type AdminData = Omit<React.ComponentProps<typeof AdminDashboard>, 'embedded'>;

export interface TrafficSlice {
  label: string;
  value: number;
}

export interface ChannelsData {
  sources: SourceState[];
  alerts: AlertItem[];
  funnel: { discovery: StatCard; witness: StatCard; relation: StatCard; invite: StatCard };
  kpi: { igSaved: StatCard; igShares: StatCard; blogSessions: StatCard };
  traffic: { channelGroups: TrafficSlice[]; referrers: TrafficSlice[]; selfReported: TrafficSlice[] };
  report: {
    week_start: string;
    generated_at: string;
    verdict: string;
    summary_md: string;
  } | null;
  hasData: boolean;
  admin: AdminData;
}

const FUNNEL_STEPS = [
  {
    key: 'discovery' as const,
    label: '발견',
    sub: '검색 클릭 + 인스타 도달',
    icon: <Compass className="w-5 h-5" />,
    color: { bg: 'bg-blue-500/10', text: 'text-blue-400', accent: 'from-blue-500 to-blue-400', glow: 'rgba(59, 130, 246, 0.15)' },
  },
  {
    key: 'witness' as const,
    label: '목격',
    sub: '랜딩 세션',
    icon: <Eye className="w-5 h-5" />,
    color: { bg: 'bg-violet-500/10', text: 'text-violet-400', accent: 'from-violet-500 to-violet-400', glow: 'rgba(139, 92, 246, 0.15)' },
  },
  {
    key: 'relation' as const,
    label: '관계',
    sub: '명부 등록',
    icon: <Mail className="w-5 h-5" />,
    color: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', accent: 'from-emerald-500 to-emerald-400', glow: 'rgba(16, 185, 129, 0.15)' },
  },
  {
    key: 'invite' as const,
    label: '초대·문의',
    sub: '초대 신청 + B2B 문의',
    icon: <Handshake className="w-5 h-5" />,
    color: { bg: 'bg-amber-500/10', text: 'text-amber-400', accent: 'from-amber-500 to-amber-400', glow: 'rgba(245, 158, 11, 0.15)' },
  },
];

const KPI_CARDS = [
  {
    key: 'igSaved' as const,
    label: '인스타 저장',
    sub: '팔로워 수보다 상위 지표',
    icon: <Bookmark className="w-5 h-5" />,
    color: { bg: 'bg-pink-500/10', text: 'text-pink-400', accent: 'from-pink-500 to-pink-400', glow: 'rgba(236, 72, 153, 0.15)' },
  },
  {
    key: 'igShares' as const,
    label: '인스타 공유',
    sub: 'DM 공유 = 최상위 알고리즘 신호',
    icon: <Send className="w-5 h-5" />,
    color: { bg: 'bg-pink-500/10', text: 'text-pink-400', accent: 'from-pink-500 to-pink-400', glow: 'rgba(236, 72, 153, 0.15)' },
  },
  {
    key: 'blogSessions' as const,
    label: '블로그 세션',
    sub: '키워드 3계층 검증 중',
    icon: <Globe className="w-5 h-5" />,
    color: { bg: 'bg-blue-500/10', text: 'text-blue-400', accent: 'from-blue-500 to-blue-400', glow: 'rgba(59, 130, 246, 0.15)' },
  },
];

function Delta({ cur, prev }: StatCard) {
  if (prev === 0 && cur === 0) {
    return <span className="text-[10px] sm:text-xs text-white/25">데이터 수집 전</span>;
  }
  const diff = cur - prev;
  const cls = diff >= 0 ? 'text-emerald-400' : 'text-red-400';
  return (
    <span className={`text-[10px] sm:text-xs font-medium ${cls}`}>
      {diff >= 0 ? '+' : ''}
      {diff.toLocaleString()} <span className="text-white/30">전주 대비</span>
    </span>
  );
}

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  ga4: <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
  vercel: <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
  ig_graph: <Instagram className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
  gsc: <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
};

// 유입 소스 가로 바 리스트 (라벨 · 비중 바 · 값)
function TrafficList({
  title,
  sub,
  icon,
  slices,
  accent,
}: {
  title: string;
  sub: string;
  icon: React.ReactNode;
  slices: TrafficSlice[];
  accent: string;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  return (
    <div className="relative rounded-xl sm:rounded-2xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
      <div className="absolute inset-0 border border-white/[0.06] rounded-xl sm:rounded-2xl" />
      <div className="relative p-4 sm:p-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
          <div className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-white/[0.04] border border-white/[0.06] ${accent} [&>svg]:w-3.5 [&>svg]:h-3.5 sm:[&>svg]:w-5 sm:[&>svg]:h-5`}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-sm font-medium text-white/70">{title}</p>
            <p className="text-[9px] sm:text-[11px] text-white/25">{sub}</p>
          </div>
        </div>

        {total === 0 ? (
          <p className="py-6 text-center text-[11px] sm:text-xs text-white/25">데이터 수집 전</p>
        ) : (
          <div className="space-y-2.5 sm:space-y-3">
            {slices.map((s) => {
              const pct = Math.round((s.value / total) * 100);
              return (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] sm:text-sm text-white/70 truncate pr-2">{s.label}</span>
                    <span className="text-[10px] sm:text-xs text-white/40 shrink-0 tabular-nums">
                      {s.value.toLocaleString()} · {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${accent.replace('text-', 'from-').replace('/70', '')} to-white/20`}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function ChannelsDashboard({ data }: { data: ChannelsData }) {
  const { sources, alerts, funnel, kpi, traffic, report, hasData, admin } = data;

  return (
    <div className="min-h-screen pb-20">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0d1525] to-[#0a0f1a]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(183, 145, 110, 0.15), transparent),
                              radial-gradient(ellipse 60% 40% at 20% 80%, rgba(59, 130, 246, 0.08), transparent),
                              radial-gradient(ellipse 50% 30% at 80% 50%, rgba(16, 185, 129, 0.06), transparent)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Hero */}
      <section className="relative pt-8 sm:pt-16 pb-6 sm:pb-12 px-4 sm:px-6 lg:px-12">
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
              className="hidden sm:block absolute -left-6 top-1/2 w-16 h-px bg-gradient-to-r from-[#b7916e] to-transparent origin-left"
            />

            <div className="sm:pl-14">
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-[#b7916e] text-[10px] sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-2 sm:mb-4 font-light"
              >
                Marketing Intelligence
              </motion.p>

              <h1
                className="text-3xl sm:text-5xl lg:text-6xl text-white/95 mb-2 sm:mb-6 leading-[1.1] tracking-tight"
                style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
              >
                <span className="sm:block inline">Channel </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b7916e] via-[#d4c4a8] to-[#b7916e]">
                  Command
                </span>
              </h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="hidden sm:block text-white/40 text-lg max-w-xl font-light leading-relaxed"
              >
                전환은 결제가 아니라 명부 등록과 초대 — 온라인 채널은 브랜드 홍보만
              </motion.p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 이상탐지 경보 (Tier 3) — 열린 경보만, 정상 복귀 시 자동 해소 */}
      {alerts.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 mb-4 sm:mb-6">
          <div className="max-w-6xl mx-auto space-y-2 sm:space-y-3">
            {alerts.map((a) => {
              const critical = a.severity === 'critical';
              const dirLabel = a.direction === 'drop' ? '급락' : a.direction === 'spike' ? '급증' : '0건 연속';
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`relative rounded-xl sm:rounded-2xl overflow-hidden border ${
                    critical ? 'border-red-500/30 bg-red-500/[0.07]' : 'border-amber-500/25 bg-amber-500/[0.06]'
                  }`}
                >
                  <div className="relative p-3 sm:p-5 flex items-start gap-3 sm:gap-4">
                    <div
                      className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl shrink-0 ${
                        critical ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'
                      }`}
                    >
                      {critical ? <Siren className="w-4 h-4 sm:w-5 sm:h-5" /> : <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs sm:text-sm font-semibold ${critical ? 'text-red-400' : 'text-amber-400'}`}>
                        {a.label} {dirLabel}
                        <span className="ml-2 text-[10px] sm:text-xs font-normal text-white/35">
                          {new Date(a.detected_at).toLocaleString('ko-KR')} 감지
                        </span>
                      </p>
                      <p className="text-[11px] sm:text-xs text-white/50 mt-0.5">
                        현재 {a.current_value?.toLocaleString() ?? '-'} · 베이스라인 {a.baseline_value?.toLocaleString() ?? '-'}
                        {a.consecutive_days ? ` · ${a.consecutive_days}일 연속` : ''}
                      </p>
                      {a.investigation_md && (
                        <p className="text-[11px] sm:text-xs text-white/60 mt-1.5 leading-relaxed">
                          <span className="text-white/35">AI 가설 · </span>
                          {a.investigation_md}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* 수집기 상태 - Pills */}
      <section className="px-4 sm:px-6 lg:px-8 mb-4 sm:mb-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="relative rounded-xl sm:rounded-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
            <div className="absolute inset-0 border border-white/[0.06] rounded-xl sm:rounded-2xl" />
            <div className="relative p-2 sm:p-4">
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-1">
                <RefreshAllButton />
                {sources.map((s) => (
                  <div
                    key={s.key}
                    className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-medium whitespace-nowrap border ${
                      !s.configured
                        ? 'text-white/40 border-white/[0.08]'
                        : s.stale
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        !s.configured ? 'bg-white/20' : s.stale ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                    />
                    {SOURCE_ICONS[s.key]}
                    <span>{s.name}</span>
                    <span className="text-[9px] sm:text-[10px] text-white/30 font-normal">
                      {!s.configured
                        ? '연동 대기'
                        : s.stale
                          ? `⚠️ 신뢰 저하 · ${s.lastDate ? `마지막 적재 ${s.lastDate}` : '적재 없음'}`
                          : s.lastDate
                            ? `적재 ${s.lastDate}`
                            : '첫 수집 대기'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 퍼널 */}
      <section className="px-4 sm:px-6 lg:px-8 mb-6 sm:mb-10">
        <div className="max-w-6xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white/40 text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-3 sm:mb-4"
          >
            Funnel · 최근 7일
          </motion.p>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-5"
          >
            {FUNNEL_STEPS.map((step, i) => {
              const stat = funnel[step.key];
              return (
                <motion.div
                  key={step.key}
                  variants={itemVariants}
                  className="group relative rounded-xl sm:rounded-2xl overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
                  <div className="absolute inset-0 border border-white/[0.06] rounded-xl sm:rounded-2xl" />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle at 50% 100%, ${step.color.glow}, transparent 70%)`,
                    }}
                  />

                  <div className={`relative px-2.5 sm:px-5 py-2 sm:py-4 ${step.color.bg} border-b border-white/[0.04]`}>
                    <div className="flex items-center gap-1.5 sm:gap-3">
                      <div className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-[#0a0f1a]/50 ${step.color.text} [&>svg]:w-3.5 [&>svg]:h-3.5 sm:[&>svg]:w-5 sm:[&>svg]:h-5`}>
                        {step.icon}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[11px] sm:text-sm font-medium ${step.color.text}`}>
                          {i + 1} · {step.label}
                        </p>
                        <p className="text-[9px] sm:text-xs text-white/30 truncate hidden sm:block">{step.sub}</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative p-2.5 sm:p-5">
                    <p
                      className="text-xl sm:text-4xl text-white/90 mb-1 sm:mb-2"
                      style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                    >
                      {stat.cur.toLocaleString()}
                    </p>
                    <Delta {...stat} />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* 전략 KPI */}
      <section className="px-4 sm:px-6 lg:px-8 mb-6 sm:mb-10">
        <div className="max-w-6xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-white/40 text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-3 sm:mb-4"
          >
            Strategy Signals · 최근 7일
          </motion.p>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-3 gap-2 sm:gap-5"
          >
            {KPI_CARDS.map((card) => {
              const stat = kpi[card.key];
              return (
                <motion.div
                  key={card.key}
                  variants={itemVariants}
                  className="group relative rounded-xl sm:rounded-2xl overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
                  <div className="absolute inset-0 border border-white/[0.06] rounded-xl sm:rounded-2xl" />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle at 50% 100%, ${card.color.glow}, transparent 70%)`,
                    }}
                  />
                  <div className="relative p-3 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 mb-2 sm:mb-4">
                      <div className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl ${card.color.bg} border border-white/[0.06] w-fit ${card.color.text} [&>svg]:w-3.5 [&>svg]:h-3.5 sm:[&>svg]:w-5 sm:[&>svg]:h-5`}>
                        {card.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-sm text-white/50">{card.label}</p>
                        <p className="text-[9px] sm:text-[11px] text-white/25 truncate hidden sm:block">{card.sub}</p>
                      </div>
                    </div>
                    <p
                      className="text-xl sm:text-4xl text-white/90 mb-1"
                      style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                    >
                      {stat.cur.toLocaleString()}
                    </p>
                    <Delta {...stat} />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* 유입 소스 */}
      <section className="px-4 sm:px-6 lg:px-8 mb-6 sm:mb-10">
        <div className="max-w-6xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="text-white/40 text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-3 sm:mb-4"
          >
            Traffic Sources · 최근 7일 · 어디서 왔는가
          </motion.p>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-5"
          >
            <motion.div variants={itemVariants}>
              <TrafficList
                title="자기보고 (직접 물어봄)"
                sub="폼의 '어떻게 알게 되셨나요' — 다크소셜·입소문까지 잡는 최고 신호"
                icon={<MessageCircleHeart className="text-amber-400" />}
                slices={traffic.selfReported}
                accent="text-amber-400/70"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <TrafficList
                title="채널 그룹 (GA4)"
                sub="검색 · SNS · 직접 · 외부 링크"
                icon={<Route className="text-violet-400" />}
                slices={traffic.channelGroups}
                accent="text-violet-400/70"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <TrafficList
                title="유입 도메인 (Vercel)"
                sub="네이버 등 실제 유입 출처 — API 없는 채널 포함"
                icon={<Globe className="text-emerald-400" />}
                slices={traffic.referrers}
                accent="text-emerald-400/70"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* AI 주간 리포트 */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-white/40 text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-3 sm:mb-4"
          >
            AI Weekly Report
          </motion.p>

          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="relative rounded-xl sm:rounded-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#b7916e]/[0.08] to-white/[0.02] backdrop-blur-sm" />
            <div className="absolute inset-0 border border-[#b7916e]/20 rounded-xl sm:rounded-2xl" />
            <div
              className="absolute inset-0 opacity-40"
              style={{
                background: 'radial-gradient(circle at 50% 0%, rgba(183, 145, 110, 0.15), transparent 50%)',
              }}
            />

            <div className="relative p-4 sm:p-8">
              {report ? (
                <>
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[#b7916e]/20 border border-[#b7916e]/30">
                      <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-[#d4c4a8]" />
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <span
                        className={`rounded-full px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold border ${
                          report.verdict === 'on-track'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : report.verdict === 'watch'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : 'bg-red-500/15 text-red-400 border-red-500/30'
                        }`}
                      >
                        {report.verdict}
                      </span>
                      <span className="text-[10px] sm:text-xs text-white/30">
                        {report.week_start} 주 · {new Date(report.generated_at).toLocaleString('ko-KR')}
                      </span>
                    </div>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white/80 prose-p:text-white/60 prose-strong:text-[#d4c4a8] prose-li:text-white/60">
                    <ReactMarkdown>{report.summary_md}</ReactMarkdown>
                  </div>
                </>
              ) : (
                <div className="py-8 sm:py-12 text-center">
                  <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-[#b7916e]/30" />
                  <p className="text-white/40 text-sm sm:text-base font-light">
                    {hasData
                      ? '매주 월요일 자동 생성 · 지금 보려면 상단 “지금 갱신”을 누르세요'
                      : '수집기 연동 후 데이터가 쌓이면 리포트를 생성할 수 있습니다'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 명부·문의 관리 (구 Members 페이지 통합) — 퍼널 ③관계·④초대의 실물 데이터 */}
      <section className="px-4 sm:px-6 lg:px-8 mt-6 sm:mt-10">
        <div className="max-w-6xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-white/40 text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-3 sm:mb-4"
          >
            Registre · 명부와 문의
          </motion.p>
          <motion.div variants={itemVariants} initial="hidden" animate="visible">
            <AdminDashboard {...admin} embedded />
          </motion.div>
        </div>
      </section>

      <Footer subtitle="Channel Command" />
    </div>
  );
}
