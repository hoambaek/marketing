'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useMasterPlanStore } from '@/lib/store/masterplan-store';
import { KPICategory, MONTHS_INFO } from '@/lib/types';
import {
  Instagram,
  Youtube,
  Mail,
  Globe,
  Newspaper,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  ArrowRight,
} from 'lucide-react';

const KPI_ICONS: Record<KPICategory, React.ReactNode> = {
  instagram: <Instagram className="w-5 h-5" />,
  youtube: <Youtube className="w-5 h-5" />,
  newsletter: <Mail className="w-5 h-5" />,
  website: <Globe className="w-5 h-5" />,
  press: <Newspaper className="w-5 h-5" />,
  b2b: <Briefcase className="w-5 h-5" />,
};

const KPI_COLORS: Record<KPICategory, { bg: string; text: string; accent: string }> = {
  instagram: { bg: 'bg-pink-500/10', text: 'text-pink-500', accent: 'bg-pink-500' },
  youtube: { bg: 'bg-red-500/10', text: 'text-red-500', accent: 'bg-red-500' },
  newsletter: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', accent: 'bg-emerald-500' },
  website: { bg: 'bg-blue-500/10', text: 'text-blue-500', accent: 'bg-blue-500' },
  press: { bg: 'bg-violet-500/10', text: 'text-violet-500', accent: 'bg-violet-500' },
  b2b: { bg: 'bg-amber-500/10', text: 'text-amber-500', accent: 'bg-amber-500' },
};

const KPI_LABELS: Record<KPICategory, string> = {
  instagram: 'Instagram',
  youtube: 'YouTube',
  newsletter: '뉴스레터',
  website: '웹사이트',
  press: '보도자료',
  b2b: 'B2B',
};

const KPI_METRICS: Record<KPICategory, { label: string; unit: string }[]> = {
  instagram: [
    { label: '팔로워', unit: '명' },
    { label: '참여율', unit: '%' },
    { label: '게시물', unit: '개' },
  ],
  youtube: [
    { label: '구독자', unit: '명' },
    { label: '조회수', unit: '회' },
    { label: '영상', unit: '개' },
  ],
  newsletter: [
    { label: '구독자', unit: '명' },
    { label: '오픈율', unit: '%' },
    { label: '발송', unit: '회' },
  ],
  website: [
    { label: '방문자', unit: '명' },
    { label: '체류시간', unit: '분' },
    { label: '전환율', unit: '%' },
  ],
  press: [
    { label: '보도', unit: '건' },
    { label: '도달', unit: '만명' },
    { label: '긍정률', unit: '%' },
  ],
  b2b: [
    { label: '리드', unit: '건' },
    { label: '미팅', unit: '회' },
    { label: '계약', unit: '건' },
  ],
};

export default function KPIPage() {
  const { kpiItems, updateKPI } = useMasterPlanStore();
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<KPICategory | 'all'>('all');

  // Get KPIs for selected month
  const monthKPIs = kpiItems.filter((kpi) => kpi.month === selectedMonth);

  // Filter by category
  const filteredKPIs =
    selectedCategory === 'all'
      ? monthKPIs
      : monthKPIs.filter((kpi) => kpi.category === selectedCategory);

  // Calculate overall progress
  const overallProgress = monthKPIs.reduce(
    (acc, kpi) => {
      acc.current += kpi.current;
      acc.target += kpi.target;
      return acc;
    },
    { current: 0, target: 0 }
  );

  const overallPercent =
    overallProgress.target > 0
      ? Math.round((overallProgress.current / overallProgress.target) * 100)
      : 0;

  // Get trend indicator
  const getTrendIcon = (current: number, target: number) => {
    const percent = (current / target) * 100;
    if (percent >= 100) {
      return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    } else if (percent >= 70) {
      return <ArrowRight className="w-4 h-4 text-amber-500" />;
    } else {
      return <TrendingDown className="w-4 h-4 text-red-400" />;
    }
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <section className="px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display text-4xl sm:text-5xl text-foreground mb-2">
              KPI 대시보드
            </h1>
            <p className="text-muted-foreground text-lg mb-6">
              핵심 성과 지표 모니터링 및 목표 달성 현황
            </p>
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="card-luxury p-4 mb-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Month Selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
                {MONTHS_INFO.map((month) => (
                  <button
                    key={month.id}
                    onClick={() => setSelectedMonth(month.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      selectedMonth === month.id
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {month.name}
                  </button>
                ))}
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-foreground text-background'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  전체
                </button>
                {(Object.keys(KPI_LABELS) as KPICategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                      selectedCategory === cat
                        ? `${KPI_COLORS[cat].bg} ${KPI_COLORS[cat].text}`
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {KPI_ICONS[cat]}
                    <span className="hidden sm:inline">{KPI_LABELS[cat]}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Overall Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="card-luxury p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-accent/20">
                <BarChart3 className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {MONTHS_INFO.find((m) => m.id === selectedMonth)?.name} 전체 목표 달성률
                </p>
                <p className="text-3xl font-display text-foreground">
                  {overallPercent}
                  <span className="text-lg text-muted-foreground">%</span>
                </p>
              </div>
            </div>
            <div className="progress-bar h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(overallPercent, 100)}%` }}
                transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                className="progress-bar-fill"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredKPIs.map((kpi, index) => {
              const colors = KPI_COLORS[kpi.category];
              const percent = Math.round((kpi.current / kpi.target) * 100);
              const metrics = KPI_METRICS[kpi.category];

              return (
                <motion.div
                  key={kpi.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.05 }}
                  className="card-luxury overflow-hidden"
                >
                  {/* Card Header */}
                  <div className={`px-5 py-4 ${colors.bg}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-background/50 ${colors.text}`}>
                          {KPI_ICONS[kpi.category]}
                        </div>
                        <div>
                          <p className={`font-medium ${colors.text}`}>
                            {KPI_LABELS[kpi.category]}
                          </p>
                          <p className="text-xs text-muted-foreground">{kpi.metric}</p>
                        </div>
                      </div>
                      {getTrendIcon(kpi.current, kpi.target)}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    {/* Main Metric */}
                    <div className="flex items-end justify-between mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">현재</p>
                        <p className="text-3xl font-display text-foreground">
                          {kpi.current.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">목표</p>
                        <p className="text-xl text-muted-foreground">
                          {kpi.target.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">달성률</span>
                        <span
                          className={`font-medium ${
                            percent >= 100
                              ? 'text-emerald-500'
                              : percent >= 70
                              ? 'text-amber-500'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {percent}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(percent, 100)}%` }}
                          transition={{ duration: 0.6, delay: 0.3 + index * 0.05 }}
                          className={`h-full rounded-full ${colors.accent}`}
                        />
                      </div>
                    </div>

                    {/* Achievement Badge */}
                    {percent >= 100 && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10">
                        <Target className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-medium text-emerald-500">
                          목표 달성!
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredKPIs.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card-luxury p-12 text-center"
            >
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">
                선택한 조건에 해당하는 KPI가 없습니다.
              </p>
            </motion.div>
          )}

          {/* Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8 grid md:grid-cols-3 gap-4"
          >
            {/* Achieved */}
            <div className="card-luxury p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-emerald-500/20">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-sm text-muted-foreground">목표 달성</p>
              </div>
              <p className="text-3xl font-display text-foreground">
                {monthKPIs.filter((k) => k.current >= k.target).length}
                <span className="text-lg text-muted-foreground">/{monthKPIs.length}</span>
              </p>
            </div>

            {/* On Track */}
            <div className="card-luxury p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-amber-500/20">
                  <ArrowRight className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-sm text-muted-foreground">진행중 (70%+)</p>
              </div>
              <p className="text-3xl font-display text-foreground">
                {
                  monthKPIs.filter((k) => {
                    const p = (k.current / k.target) * 100;
                    return p >= 70 && p < 100;
                  }).length
                }
                <span className="text-lg text-muted-foreground">개</span>
              </p>
            </div>

            {/* Need Attention */}
            <div className="card-luxury p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-red-500/20">
                  <TrendingDown className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-sm text-muted-foreground">주의 필요</p>
              </div>
              <p className="text-3xl font-display text-foreground">
                {
                  monthKPIs.filter((k) => {
                    const p = (k.current / k.target) * 100;
                    return p < 70;
                  }).length
                }
                <span className="text-lg text-muted-foreground">개</span>
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
