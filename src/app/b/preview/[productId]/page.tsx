'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import BottlePageContent, { type BottleDisplayData } from '../../_components/BottlePageContent';

export default function BottlePreviewPage() {
  const params = useParams();
  const productId = params.productId as string;
  const [data, setData] = useState<BottleDisplayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;

    fetch(`/api/public/bottle?productId=${encodeURIComponent(productId)}`)
      .then(res => {
        if (!res.ok) throw new Error(res.status === 404 ? '존재하지 않는 상품입니다' : '조회에 실패했습니다');
        return res.json();
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [productId]);

  return (
    <div className="min-h-screen bg-[#060810] flex items-center justify-center p-8">
      {/* 모바일 프레임 */}
      <div className="relative">
        {/* 폰 외곽 */}
        <div className="relative w-[375px] h-[812px] rounded-[3rem] border-[8px] border-[#1a1a2e] bg-[#0a0b0d] shadow-2xl shadow-black/50 overflow-hidden">
          {/* 노치 */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[28px] bg-[#1a1a2e] rounded-b-2xl z-20" />

          {/* 상태바 */}
          <div className="absolute top-0 left-0 right-0 h-[44px] z-10 flex items-center justify-between px-8">
            <span className="text-[11px] text-white/50 font-medium">9:41</span>
            <div className="flex items-center gap-1">
              <div className="flex gap-[2px]">
                <div className="w-[3px] h-[4px] bg-white/40 rounded-[1px]" />
                <div className="w-[3px] h-[6px] bg-white/40 rounded-[1px]" />
                <div className="w-[3px] h-[8px] bg-white/40 rounded-[1px]" />
                <div className="w-[3px] h-[10px] bg-white/50 rounded-[1px]" />
              </div>
              <span className="text-[11px] text-white/50 ml-1">100%</span>
            </div>
          </div>

          {/* 컨텐츠 영역 */}
          <div className="absolute inset-0 overflow-y-auto pt-[44px] scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-white/40 text-sm"
                >
                  로딩 중...
                </motion.div>
              </div>
            ) : error || !data ? (
              <div className="h-full flex items-center justify-center px-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🍾</span>
                  </div>
                  <h1 className="text-white/80 text-lg font-medium mb-2">상품 정보를 찾을 수 없습니다</h1>
                  <p className="text-white/40 text-sm">{error || '유효하지 않은 상품 ID입니다'}</p>
                </div>
              </div>
            ) : (
              <BottlePageContent data={data} />
            )}
          </div>

          {/* 하단 인디케이터 */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[134px] h-[5px] bg-white/20 rounded-full z-20" />
        </div>

        {/* 프레임 반사 효과 */}
        <div className="absolute inset-0 rounded-[3rem] pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%)',
          }}
        />
      </div>
    </div>
  );
}
