'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import BottlePageContent, { type BottleDisplayData } from '../_components/BottlePageContent';

export default function BottlePage() {
  const params = useParams();
  const code = params.code as string;
  const [data, setData] = useState<BottleDisplayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;

    fetch(`/api/public/bottle?code=${encodeURIComponent(code)}`)
      .then(res => {
        if (!res.ok) throw new Error(res.status === 404 ? '등록되지 않은 병입니다' : '조회에 실패했습니다');
        return res.json();
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-white/40 text-sm"
        >
          숙성 데이터를 불러오는 중...
        </motion.div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🍾</span>
          </div>
          <h1 className="text-white/80 text-lg font-medium mb-2">병 정보를 찾을 수 없습니다</h1>
          <p className="text-white/40 text-sm">{error || '유효하지 않은 NFC 코드입니다'}</p>
        </div>
      </div>
    );
  }

  return <BottlePageContent data={data} />;
}
