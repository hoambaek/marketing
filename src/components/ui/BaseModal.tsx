'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  className?: string;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

/**
 * 기본 모달 컴포넌트
 * - 백드롭 클릭으로 닫기
 * - 애니메이션 효과
 * - body 스크롤 잠금
 * - 모바일 드래그 핸들
 */
export default function BaseModal({
  isOpen,
  onClose,
  title,
  icon,
  children,
  maxWidth = 'lg',
  showCloseButton = true,
  closeOnBackdropClick = true,
  className = '',
}: BaseModalProps) {
  // body 스크롤 잠금
  useBodyScrollLock(isOpen);

  const handleBackdropClick = () => {
    if (closeOnBackdropClick) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`
              relative bg-[#0d1421] border border-white/[0.08] shadow-2xl
              w-full ${maxWidthClasses[maxWidth]}
              rounded-t-2xl sm:rounded-2xl
              max-h-[90vh] sm:max-h-[85vh]
              flex flex-col
              ${className}
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모바일 드래그 핸들 */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            {/* 헤더 */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  {icon && (
                    <div className="p-2 bg-accent/10 rounded-xl text-accent">
                      {icon}
                    </div>
                  )}
                  {title && (
                    <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                      {title}
                    </h2>
                  )}
                </div>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                )}
              </div>
            )}

            {/* 컨텐츠 */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
