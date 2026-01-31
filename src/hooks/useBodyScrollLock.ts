'use client';

import { useEffect } from 'react';

/**
 * 모달이 열렸을 때 body 스크롤을 잠그는 훅
 * @param isLocked - 스크롤 잠금 여부
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (isLocked) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLocked]);
}
