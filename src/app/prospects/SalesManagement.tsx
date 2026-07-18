'use client';

/**
 * 영업관리 — 탭 래퍼 (거래처 / 전통주)
 *
 * 탭 상태는 URL(?tab=)에 인코딩해 공유·복원 가능.
 * 거래처 탭: 신규 발굴 B2B 후보 파셋 보드.
 * 전통주 탭: 해저숙성할 전통주를 픽하는 기준판.
 */

import { useSearchParams, useRouter } from 'next/navigation';
import { Store, Wine, CupSoda } from 'lucide-react';
import { ProspectsView, type Prospect } from './ProspectsView';
import { LiquorView, type LiquorCandidate } from './LiquorView';
import { NonAlcoholView, type NonAlcoholCandidate } from './NonAlcoholView';

export function SalesManagement({
  prospects, liquors, nonalcs,
}: {
  prospects: Prospect[];
  liquors: LiquorCandidate[];
  nonalcs: NonAlcoholCandidate[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab');
  const tab = tabParam === 'liquor' ? 'liquor' : tabParam === 'nonalc' ? 'nonalc' : 'prospects';

  const switchTab = (t: 'prospects' | 'liquor' | 'nonalc') => {
    const params = new URLSearchParams(searchParams.toString());
    if (t === 'prospects') params.delete('tab');
    else params.set('tab', t);
    router.replace(`/prospects?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 pb-24">
      <h1 className="font-serif text-3xl sm:text-4xl text-white/90 tracking-tight mb-4">영업관리</h1>

      {/* 탭 */}
      <div className="flex items-center gap-1 mb-6 border-b border-white/[0.06]">
        <TabButton active={tab === 'prospects'} onClick={() => switchTab('prospects')} icon={<Store className="w-4 h-4" />}>
          거래처 <span className="text-white/40">{prospects.length}</span>
        </TabButton>
        <TabButton active={tab === 'liquor'} onClick={() => switchTab('liquor')} icon={<Wine className="w-4 h-4" />}>
          전통주 <span className="text-white/40">{liquors.length}</span>
        </TabButton>
        <TabButton active={tab === 'nonalc'} onClick={() => switchTab('nonalc')} icon={<CupSoda className="w-4 h-4" />}>
          무알콜 <span className="text-white/40">{nonalcs.length}</span>
        </TabButton>
      </div>

      {tab === 'prospects' ? (
        <ProspectsView prospects={prospects} />
      ) : tab === 'liquor' ? (
        <LiquorView liquors={liquors} />
      ) : (
        <NonAlcoholView items={nonalcs} />
      )}
    </div>
  );
}

function TabButton({
  active, onClick, icon, children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-colors ${
        active
          ? 'text-white border-[#b7916e]'
          : 'text-white/45 border-transparent hover:text-white/70'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
