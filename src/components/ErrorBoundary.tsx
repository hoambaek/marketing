'use client';

import { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary 컴포넌트
 * 하위 컴포넌트에서 발생하는 JavaScript 에러를 캐치하여
 * 전체 앱 크래시를 방지하고 폴백 UI를 표시
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 프로덕션에서는 에러 로깅 서비스로 전송 (Sentry, LogRocket 등)
    if (process.env.NODE_ENV === 'production') {
      // TODO: 에러 로깅 서비스 연동
      // logErrorToService(error, errorInfo);
    } else {
      console.error('Error caught by ErrorBoundary:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // 커스텀 폴백이 있으면 사용
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 에러 UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0b0d] px-4">
          <div className="text-center max-w-md">
            {/* 에러 아이콘 */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>

            {/* 에러 메시지 */}
            <h2
              className="text-2xl text-white/90 font-medium mb-3"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              문제가 발생했습니다
            </h2>
            <p className="text-white/50 text-sm mb-6 leading-relaxed">
              예기치 않은 오류가 발생했습니다.
              <br />
              잠시 후 다시 시도해 주세요.
            </p>

            {/* 개발 환경에서만 에러 상세 표시 */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-left">
                <p className="text-red-400 text-xs font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-6 py-3 bg-[#b7916e]/20 hover:bg-[#b7916e]/30
                         text-[#b7916e] border border-[#b7916e]/30 hover:border-[#b7916e]/50
                         rounded-xl transition-all duration-200 text-sm font-medium"
              >
                다시 시도
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-white/[0.04] hover:bg-white/[0.08]
                         text-white/70 hover:text-white/90 border border-white/[0.06]
                         rounded-xl transition-all duration-200 text-sm"
              >
                페이지 새로고침
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
