'use client';

import { motion } from 'framer-motion';

export interface BottleDisplayData {
  bottle: {
    type: 'numbered' | 'unit' | 'preview';
    productName?: string;
    productNameKo?: string;
    size?: string;
    bottleNumber?: number;
    nfcCode?: string;
    soldDate?: string;
  };
  aging: {
    immersionDate: string | null;
    retrievalDate: string | null;
    agingDepth: number | null;
    agingDays: number | null;
  } | null;
  oceanData: Array<{
    date: string;
    seaTemperatureAvg: number | null;
    waveHeightAvg: number | null;
    currentVelocityAvg: number | null;
  }> | null;
}

function MiniChart({ data, dataKey, color, label, unit }: {
  data: Array<Record<string, unknown>>;
  dataKey: string;
  color: string;
  label: string;
  unit: string;
}) {
  const values = data
    .map(d => d[dataKey] as number | null)
    .filter((v): v is number => v !== null);

  if (values.length === 0) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const range = max - min || 1;

  const width = 280;
  const height = 60;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/50">{label}</span>
        <span className="text-xs font-mono" style={{ color }}>
          평균 {avg.toFixed(1)}{unit}
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[60px]">
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <polygon
          points={`0,${height} ${points} ${width},${height}`}
          fill={`url(#grad-${dataKey})`}
        />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex justify-between text-[10px] text-white/30">
        <span>최저 {min.toFixed(1)}{unit}</span>
        <span>최고 {max.toFixed(1)}{unit}</span>
      </div>
    </div>
  );
}

export default function BottlePageContent({
  data,
}: {
  data: BottleDisplayData;
}) {
  const { bottle, aging, oceanData } = data;

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white">
      {/* 배경 */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0d1525] to-[#0a0f1a]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(183, 145, 110, 0.15), transparent),
                              radial-gradient(ellipse 60% 40% at 50% 100%, rgba(56, 189, 248, 0.08), transparent)`,
          }}
        />
      </div>

      <div className="max-w-md mx-auto px-5 py-8 space-y-6">
        {/* 로고 영역 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-xl font-serif text-[#d4c4a8] tracking-wider" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            MUSE DE MARÉE
          </h1>
          <p className="text-[10px] text-white/30 tracking-[0.3em] mt-1">OCEAN-AGED CHAMPAGNE</p>
        </motion.div>

        {/* 제품 정보 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative rounded-2xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/[0.03]" />
          <div className="absolute inset-0 border border-white/[0.08] rounded-2xl" />
          <div className="relative p-5 space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-medium text-[#d4c4a8]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                {bottle.productName || 'Champagne'}
              </h2>
              {bottle.productNameKo && (
                <p className="text-xs text-white/40">{bottle.productNameKo}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              {bottle.bottleNumber && (
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <p className="text-[10px] text-white/30 mb-1">병 번호</p>
                  <p className="text-lg font-bold text-amber-400">#{bottle.bottleNumber}</p>
                </div>
              )}
              {bottle.size && (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-[10px] text-white/30 mb-1">용량</p>
                  <p className="text-lg font-bold text-white/70">{bottle.size}</p>
                </div>
              )}
            </div>

            {bottle.nfcCode && (
              <div className="flex justify-center">
                <div className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                  <span className="text-[10px] font-mono text-cyan-400/70">NFC: {bottle.nfcCode}</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* 숙성 정보 */}
        {aging && (aging.immersionDate || aging.agingDepth) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative rounded-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/[0.03]" />
            <div className="absolute inset-0 border border-white/[0.08] rounded-2xl" />
            <div className="relative p-5 space-y-4">
              <h3 className="text-sm font-medium text-cyan-400/80 flex items-center gap-2">
                <span>🌊</span>
                해저 숙성 정보
              </h3>

              <div className="space-y-3">
                {aging.immersionDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/40">입수일</span>
                    <span className="text-sm text-white/70">{aging.immersionDate}</span>
                  </div>
                )}
                {aging.retrievalDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/40">인양일</span>
                    <span className="text-sm text-white/70">{aging.retrievalDate}</span>
                  </div>
                )}
                {aging.agingDays && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/40">숙성 기간</span>
                    <span className="text-sm font-medium text-cyan-400">{aging.agingDays}일</span>
                  </div>
                )}
                {aging.agingDepth && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/40">숙성 수심</span>
                    <span className="text-sm text-white/70">{aging.agingDepth}m</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/40">숙성 위치</span>
                  <span className="text-sm text-white/70">완도 해역</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 해양 데이터 차트 */}
        {oceanData && oceanData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative rounded-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/[0.03]" />
            <div className="absolute inset-0 border border-white/[0.08] rounded-2xl" />
            <div className="relative p-5 space-y-5">
              <h3 className="text-sm font-medium text-cyan-400/80 flex items-center gap-2">
                <span>📊</span>
                숙성 환경 데이터
              </h3>

              <MiniChart
                data={oceanData}
                dataKey="seaTemperatureAvg"
                color="#38bdf8"
                label="수온"
                unit="°C"
              />
              <MiniChart
                data={oceanData}
                dataKey="waveHeightAvg"
                color="#a78bfa"
                label="파고"
                unit="m"
              />
              <MiniChart
                data={oceanData}
                dataKey="currentVelocityAvg"
                color="#34d399"
                label="해류 속도"
                unit="m/s"
              />

              <p className="text-[10px] text-white/20 text-center">
                {oceanData.length}일간의 해양 데이터 (Open-Meteo Marine API)
              </p>
            </div>
          </motion.div>
        )}

        {/* 숙성 데이터 없는 경우 안내 */}
        {(!aging || (!aging.immersionDate && !aging.agingDepth)) && (!oceanData || oceanData.length === 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative rounded-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/[0.03]" />
            <div className="absolute inset-0 border border-white/[0.08] rounded-2xl" />
            <div className="relative p-5 text-center space-y-2">
              <span className="text-2xl">🌊</span>
              <p className="text-sm text-white/40">숙성 데이터가 아직 등록되지 않았습니다</p>
            </div>
          </motion.div>
        )}

        {/* 인증 마크 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center py-4 space-y-2"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-emerald-400 text-xs">✓</span>
            <span className="text-emerald-400/70 text-xs">NFC 인증 완료</span>
          </div>
          <p className="text-[10px] text-white/20">
            이 페이지는 NFC 태그로 인증된 정품 확인 페이지입니다
          </p>
        </motion.div>

        {/* 푸터 */}
        <div className="text-center pb-8">
          <p className="text-[10px] text-white/15">&copy; 2026 Muse de Marée. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
