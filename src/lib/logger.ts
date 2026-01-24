/**
 * 환경별 로거 유틸리티
 *
 * - 개발 환경: 모든 로그 출력
 * - 프로덕션 환경: error만 출력 (또는 외부 서비스로 전송)
 */

type LogLevel = 'debug' | 'log' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  prefix?: string;
  enableInProd?: boolean;
}

const isDev = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

/**
 * 로그 포맷팅
 */
function formatMessage(prefix: string | undefined, ...args: unknown[]): unknown[] {
  if (prefix) {
    return [`[${prefix}]`, ...args];
  }
  return args;
}

/**
 * 프로덕션에서 에러 로깅 (외부 서비스 연동 가능)
 */
function logToExternalService(level: LogLevel, ...args: unknown[]) {
  // TODO: Sentry, LogRocket 등 외부 로깅 서비스 연동
  // 현재는 console.error만 사용
  if (level === 'error') {
    console.error(...args);
  }
}

/**
 * 기본 로거 생성
 */
function createLogger(options: LoggerOptions = {}) {
  const { prefix, enableInProd = false } = options;

  return {
    /**
     * 디버그 로그 (개발 환경에서만)
     */
    debug: (...args: unknown[]) => {
      if (isDev && !isTest) {
        console.debug(...formatMessage(prefix, ...args));
      }
    },

    /**
     * 일반 로그 (개발 환경에서만)
     */
    log: (...args: unknown[]) => {
      if (isDev && !isTest) {
        console.log(...formatMessage(prefix, ...args));
      }
    },

    /**
     * 정보 로그 (개발 환경에서만)
     */
    info: (...args: unknown[]) => {
      if (isDev && !isTest) {
        console.info(...formatMessage(prefix, ...args));
      }
    },

    /**
     * 경고 로그 (개발 환경에서만)
     */
    warn: (...args: unknown[]) => {
      if (isDev || enableInProd) {
        console.warn(...formatMessage(prefix, ...args));
      }
    },

    /**
     * 에러 로그 (항상 출력, 프로덕션에서는 외부 서비스로 전송)
     */
    error: (...args: unknown[]) => {
      const formattedArgs = formatMessage(prefix, ...args);

      if (isDev || isTest) {
        console.error(...formattedArgs);
      } else {
        logToExternalService('error', ...formattedArgs);
      }
    },
  };
}

// 기본 로거 인스턴스들
export const logger = createLogger();

// 도메인별 로거
export const dbLogger = createLogger({ prefix: 'DB' });
export const apiLogger = createLogger({ prefix: 'API' });
export const storeLogger = createLogger({ prefix: 'Store' });
export const aiLogger = createLogger({ prefix: 'AI' });

// 커스텀 로거 생성 함수 export
export { createLogger };

export default logger;
