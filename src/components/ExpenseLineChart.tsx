'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BudgetCategory,
  BUDGET_CATEGORY_LABELS,
  BUDGET_CATEGORY_COLORS,
  MONTHS_INFO,
  ExpenseItem,
} from '@/lib/types';

interface ExpenseLineChartProps {
  expenses: ExpenseItem[];
  year: number;
}

// Chart configuration
const CHART_CONFIG = {
  width: 900,
  height: 340,
  padding: { top: 40, right: 30, bottom: 50, left: 70 },
};

// Category colors for lines (hex values for SVG)
const LINE_COLORS: Record<BudgetCategory, string> = {
  marketing: '#f472b6',      // Pink
  operation: '#60a5fa',      // Blue
  design: '#fb923c',         // Orange
  filming: '#34d399',        // Emerald
  pr: '#a78bfa',             // Violet
  b2b: '#f87171',            // Red
  packaging: '#fbbf24',      // Amber
  event: '#2dd4bf',          // Teal
  other: '#94a3b8',          // Slate
};

// Format currency for tooltip
const formatCurrency = (amount: number) => {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억`;
  }
  if (amount >= 10000000) {
    return `${(amount / 10000000).toFixed(1)}천만`;
  }
  if (amount >= 10000) {
    return `${Math.round(amount / 10000)}만`;
  }
  return amount.toLocaleString();
};

// Generate smooth bezier curve path
const generateSmoothPath = (points: { x: number; y: number }[]): string => {
  if (points.length < 2) return '';

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;

    // Use cubic bezier for smooth curves
    path += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
  }

  return path;
};

export default function ExpenseLineChart({ expenses, year }: ExpenseLineChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    category: BudgetCategory;
    month: number;
    amount: number;
    x: number;
    y: number;
  } | null>(null);

  const [hoveredCategory, setHoveredCategory] = useState<BudgetCategory | null>(null);

  // Calculate monthly expenses by category
  const chartData = useMemo(() => {
    const categories = Object.keys(BUDGET_CATEGORY_LABELS) as BudgetCategory[];
    const result: Record<BudgetCategory, number[]> = {} as Record<BudgetCategory, number[]>;

    // Initialize all categories with zeros for all months
    categories.forEach(cat => {
      result[cat] = Array(12).fill(0);
    });

    // Aggregate expenses by category and month
    expenses.forEach(expense => {
      if (result[expense.category]) {
        result[expense.category][expense.month - 1] += expense.amount;
      }
    });

    // Filter to only categories with data
    const activeCategories = categories.filter(cat =>
      result[cat].some(amount => amount > 0)
    );

    return { data: result, activeCategories };
  }, [expenses]);

  // Calculate max value for Y-axis scale
  const maxValue = useMemo(() => {
    let max = 0;
    chartData.activeCategories.forEach(cat => {
      chartData.data[cat].forEach(val => {
        if (val > max) max = val;
      });
    });
    // Round up to nice number
    const magnitude = Math.pow(10, Math.floor(Math.log10(max || 1)));
    return Math.ceil((max || magnitude) / magnitude) * magnitude;
  }, [chartData]);

  // Chart dimensions
  const { width, height, padding } = CHART_CONFIG;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale functions
  const xScale = (monthIndex: number) =>
    padding.left + (monthIndex / 11) * chartWidth;

  const yScale = (value: number) =>
    padding.top + chartHeight - (value / maxValue) * chartHeight;

  // Generate Y-axis ticks
  const yTicks = useMemo(() => {
    const ticks = [];
    const step = maxValue / 4;
    for (let i = 0; i <= 4; i++) {
      ticks.push(Math.round(step * i));
    }
    return ticks;
  }, [maxValue]);

  // Calculate category totals
  const categoryTotals = useMemo(() => {
    return chartData.activeCategories.map(cat => ({
      category: cat,
      total: chartData.data[cat].reduce((sum, val) => sum + val, 0),
    })).sort((a, b) => b.total - a.total);
  }, [chartData]);

  if (chartData.activeCategories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 mb-4 rounded-2xl bg-white/[0.04] flex items-center justify-center">
          <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <p className="text-white/40 text-sm">지출 데이터가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Chart Container */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-sm" />
        <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />

        <div className="relative p-4 sm:p-6">
          {/* SVG Chart */}
          <div className="overflow-x-auto scrollbar-hide">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full min-w-[600px]"
              style={{ maxHeight: '400px' }}
            >
              {/* Gradient Definitions */}
              <defs>
                {chartData.activeCategories.map(cat => (
                  <linearGradient
                    key={`gradient-${cat}`}
                    id={`gradient-${cat}`}
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor={LINE_COLORS[cat]} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={LINE_COLORS[cat]} stopOpacity="0" />
                  </linearGradient>
                ))}
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Grid Lines */}
              <g className="text-white/[0.06]">
                {/* Horizontal grid lines */}
                {yTicks.map((tick, i) => (
                  <line
                    key={`h-grid-${i}`}
                    x1={padding.left}
                    y1={yScale(tick)}
                    x2={width - padding.right}
                    y2={yScale(tick)}
                    stroke="currentColor"
                    strokeDasharray={i === 0 ? "0" : "4,4"}
                  />
                ))}
                {/* Vertical grid lines */}
                {MONTHS_INFO.map((_, i) => (
                  <line
                    key={`v-grid-${i}`}
                    x1={xScale(i)}
                    y1={padding.top}
                    x2={xScale(i)}
                    y2={height - padding.bottom}
                    stroke="currentColor"
                    strokeDasharray="4,4"
                    opacity={0.5}
                  />
                ))}
              </g>

              {/* Y-axis Labels */}
              <g className="text-white/40 text-xs">
                {yTicks.map((tick, i) => (
                  <text
                    key={`y-label-${i}`}
                    x={padding.left - 12}
                    y={yScale(tick) + 4}
                    textAnchor="end"
                    fill="currentColor"
                    fontSize="11"
                  >
                    {formatCurrency(tick)}
                  </text>
                ))}
              </g>

              {/* X-axis Labels (Months) */}
              <g className="text-white/50 text-xs">
                {MONTHS_INFO.map((month, i) => (
                  <text
                    key={`x-label-${i}`}
                    x={xScale(i)}
                    y={height - padding.bottom + 24}
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize="11"
                    fontWeight="500"
                  >
                    {month.shortName}
                  </text>
                ))}
              </g>

              {/* Area fills (behind lines) */}
              {chartData.activeCategories.map(cat => {
                const points = chartData.data[cat].map((val, i) => ({
                  x: xScale(i),
                  y: yScale(val),
                }));

                const areaPath = generateSmoothPath(points) +
                  ` L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

                return (
                  <motion.path
                    key={`area-${cat}`}
                    d={areaPath}
                    fill={`url(#gradient-${cat})`}
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: hoveredCategory === null || hoveredCategory === cat ? 0.4 : 0.1
                    }}
                    transition={{ duration: 0.3 }}
                  />
                );
              })}

              {/* Lines */}
              {chartData.activeCategories.map(cat => {
                const points = chartData.data[cat].map((val, i) => ({
                  x: xScale(i),
                  y: yScale(val),
                }));
                const path = generateSmoothPath(points);

                return (
                  <motion.path
                    key={`line-${cat}`}
                    d={path}
                    fill="none"
                    stroke={LINE_COLORS[cat]}
                    strokeWidth={hoveredCategory === cat ? 3 : 2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={hoveredCategory === cat ? "url(#glow)" : undefined}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                      pathLength: 1,
                      opacity: hoveredCategory === null || hoveredCategory === cat ? 1 : 0.2,
                    }}
                    transition={{
                      pathLength: { duration: 1.5, ease: "easeInOut" },
                      opacity: { duration: 0.3 }
                    }}
                  />
                );
              })}

              {/* Data Points */}
              {chartData.activeCategories.map(cat =>
                chartData.data[cat].map((val, monthIndex) => {
                  if (val === 0) return null;

                  const x = xScale(monthIndex);
                  const y = yScale(val);
                  const isHovered = hoveredPoint?.category === cat && hoveredPoint?.month === monthIndex;
                  const isCategoryHovered = hoveredCategory === cat;
                  const shouldShow = hoveredCategory === null || hoveredCategory === cat;

                  return (
                    <g key={`point-${cat}-${monthIndex}`}>
                      {/* Invisible larger hit area */}
                      <circle
                        cx={x}
                        cy={y}
                        r={12}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => {
                          setHoveredPoint({ category: cat, month: monthIndex, amount: val, x, y });
                        }}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                      {/* Visible point */}
                      <motion.circle
                        cx={x}
                        cy={y}
                        fill="#0a0f1a"
                        stroke={LINE_COLORS[cat]}
                        strokeWidth={2}
                        initial={{ r: 0 }}
                        animate={{
                          r: isHovered || isCategoryHovered ? 6 : 4,
                          opacity: shouldShow ? 1 : 0.2,
                        }}
                        transition={{ duration: 0.2 }}
                      />
                      {/* Glow effect on hover */}
                      {isHovered && (
                        <motion.circle
                          cx={x}
                          cy={y}
                          r={10}
                          fill="none"
                          stroke={LINE_COLORS[cat]}
                          strokeWidth={2}
                          initial={{ opacity: 0, r: 6 }}
                          animate={{ opacity: [0.5, 0], r: [6, 16] }}
                          transition={{ duration: 0.6, repeat: Infinity }}
                        />
                      )}
                    </g>
                  );
                })
              )}
            </svg>
          </div>

          {/* Tooltip */}
          {hoveredPoint && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute pointer-events-none z-10 px-3 py-2 rounded-xl bg-[#1a1f2e]/95 border border-white/10 backdrop-blur-sm shadow-xl"
              style={{
                left: `${(hoveredPoint.x / width) * 100}%`,
                top: `${(hoveredPoint.y / height) * 100}%`,
                transform: 'translate(-50%, -120%)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: LINE_COLORS[hoveredPoint.category] }}
                />
                <span className="text-xs text-white/60">
                  {BUDGET_CATEGORY_LABELS[hoveredPoint.category]}
                </span>
              </div>
              <div className="text-sm font-semibold text-white">
                {formatCurrency(hoveredPoint.amount)}원
              </div>
              <div className="text-[10px] text-white/40 mt-0.5">
                {MONTHS_INFO[hoveredPoint.month].name}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 sm:mt-6">
        <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
          {categoryTotals.map(({ category, total }) => (
            <motion.button
              key={category}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm transition-all ${
                hoveredCategory === category
                  ? 'bg-white/10 ring-1 ring-white/20'
                  : hoveredCategory === null
                    ? 'bg-white/[0.03] hover:bg-white/[0.06]'
                    : 'bg-white/[0.02] opacity-40'
              }`}
              onMouseEnter={() => setHoveredCategory(category)}
              onMouseLeave={() => setHoveredCategory(null)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: LINE_COLORS[category] }}
              />
              <span className="text-white/70 font-medium">
                {BUDGET_CATEGORY_LABELS[category]}
              </span>
              <span className="text-white/40 font-normal">
                {formatCurrency(total)}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
