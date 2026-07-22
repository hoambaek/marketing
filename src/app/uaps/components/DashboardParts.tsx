'use client';

import { motion } from 'framer-motion';
import React from 'react';

// UAPS 대시보드 공용 섹션 래퍼 (샴페인·전 카테고리 공유).
// page.tsx와 [category]/page.tsx에 중복 정의돼 있던 것을 통합.
export function SectionWrapper({
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
      <div className="relative bg-[#0d1421]/40 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
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
