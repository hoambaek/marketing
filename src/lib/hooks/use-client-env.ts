'use client';

import { useSyncExternalStore } from 'react';

/**
 * 클라이언트 환경을 읽는 훅 모음.
 *
 * 이 값들을 useState + useEffect로 잡으면 이펙트 본문에서 동기 setState를 하게 되고,
 * 같은 커밋 안에서 연쇄 렌더가 일어난다(react-hooks/set-state-in-effect).
 * useSyncExternalStore는 서버 스냅샷과 클라이언트 스냅샷을 따로 받으므로
 * setState 없이 같은 일을 한다 — 하이드레이션 불일치도 React가 직접 처리한다.
 */

/** 구독할 외부 소스가 없는 경우(마운트 여부) */
const noopSubscribe = () => () => {};

/**
 * 서버에서는 false, 클라이언트에서는 true.
 * 하이드레이션 이후에만 그려야 하는 것(DnD, 포털, window 의존 UI)에 쓴다.
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * 미디어 쿼리 일치 여부. 화면 크기가 바뀌면 따라 갱신된다.
 * 서버에서는 항상 false — 크기를 알 수 없으므로 데스크톱 레이아웃을 기본으로 둔다.
 *
 * @param query 예: '(max-width: 639px)'
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** 640px 미만 — Tailwind sm 브레이크포인트와 같은 경계 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 639px)');
}

/* 현재 연·월 — 서버에서는 알 수 없으므로 기준값(2026년 1월)을 준다.
   스냅샷은 한 번만 계산해 캐시한다. useSyncExternalStore는 getSnapshot이
   매번 새 객체를 돌려주면 무한 렌더로 본다. */
const FALLBACK_YM = { year: 2026, month: 1 } as const;
let cachedYM: { year: number; month: number } | null = null;

function clientYearMonth() {
  if (!cachedYM) {
    const now = new Date();
    cachedYM = { year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  return cachedYM;
}

/**
 * 브라우저 기준 현재 연·월.
 * 렌더 중 new Date()는 순수하지 않고(react-hooks/purity) 서버·클라이언트 값이 달라지므로,
 * 스냅샷을 나눠 받는다.
 */
export function useCurrentYearMonth(): { year: number; month: number } {
  return useSyncExternalStore(noopSubscribe, clientYearMonth, () => FALLBACK_YM);
}
