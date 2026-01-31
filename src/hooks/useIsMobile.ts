'use client';

import { useState, useEffect } from 'react';

/**
 * 모바일 디바이스 감지 훅
 * @param breakpoint - 모바일 기준 너비 (기본값: 640px)
 * @returns isMobile 상태
 */
export function useIsMobile(breakpoint: number = 640) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // 초기 체크
    checkMobile();

    // 리사이즈 이벤트 리스너 (선택적)
    // window.addEventListener('resize', checkMobile);
    // return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}
