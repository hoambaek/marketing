import { toast } from '@/lib/store/toast-store';

/**
 * 앱 에러 클래스
 * 운영 에러(사용자에게 보여줄 수 있는)와 시스템 에러를 구분
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      statusCode: this.statusCode,
    };
  }
}

/**
 * 에러 코드 상수
 */
export const ERROR_CODES = {
  // 인증 관련
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  AUTH_EXPIRED: 'AUTH_EXPIRED',

  // 유효성 검사
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // 데이터베이스
  DB_CONNECTION_ERROR: 'DB_CONNECTION_ERROR',
  DB_QUERY_ERROR: 'DB_QUERY_ERROR',
  DB_NOT_FOUND: 'DB_NOT_FOUND',

  // 외부 서비스
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  API_RATE_LIMITED: 'API_RATE_LIMITED',

  // 파일
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_TYPE_INVALID: 'FILE_TYPE_INVALID',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',

  // 일반
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

/**
 * 사용자 친화적 에러 메시지 매핑
 */
const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.AUTH_REQUIRED]: '로그인이 필요합니다.',
  [ERROR_CODES.AUTH_INVALID]: '인증 정보가 올바르지 않습니다.',
  [ERROR_CODES.AUTH_EXPIRED]: '세션이 만료되었습니다. 다시 로그인해주세요.',
  [ERROR_CODES.VALIDATION_ERROR]: '입력값을 확인해주세요.',
  [ERROR_CODES.INVALID_INPUT]: '잘못된 입력입니다.',
  [ERROR_CODES.DB_CONNECTION_ERROR]: '데이터베이스 연결에 실패했습니다.',
  [ERROR_CODES.DB_QUERY_ERROR]: '데이터 처리 중 오류가 발생했습니다.',
  [ERROR_CODES.DB_NOT_FOUND]: '요청한 데이터를 찾을 수 없습니다.',
  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: '외부 서비스 오류가 발생했습니다.',
  [ERROR_CODES.API_RATE_LIMITED]: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  [ERROR_CODES.FILE_TOO_LARGE]: '파일 크기가 너무 큽니다.',
  [ERROR_CODES.FILE_TYPE_INVALID]: '허용되지 않은 파일 형식입니다.',
  [ERROR_CODES.FILE_UPLOAD_FAILED]: '파일 업로드에 실패했습니다.',
  [ERROR_CODES.UNKNOWN_ERROR]: '알 수 없는 오류가 발생했습니다.',
  [ERROR_CODES.NETWORK_ERROR]: '네트워크 연결을 확인해주세요.',
};

/**
 * 에러 메시지 가져오기
 */
export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
}

/**
 * Store 에러 핸들러
 * Zustand 스토어의 액션에서 발생한 에러를 처리
 */
export function handleStoreError(error: unknown, context: string): void {
  console.error(`[${context}]`, error);

  if (error instanceof AppError) {
    toast.error(error.message);
  } else if (error instanceof Error) {
    // API 에러 메시지 파싱
    if (error.message.includes('fetch')) {
      toast.error(getErrorMessage(ERROR_CODES.NETWORK_ERROR));
    } else {
      toast.error(error.message || getErrorMessage(ERROR_CODES.UNKNOWN_ERROR));
    }
  } else {
    toast.error(getErrorMessage(ERROR_CODES.UNKNOWN_ERROR));
  }
}

/**
 * API 에러 핸들러
 * API 라우트에서 발생한 에러를 처리하고 표준화된 응답 생성
 */
export function handleApiError(error: unknown, context: string): {
  message: string;
  code: string;
  statusCode: number;
} {
  console.error(`[API ${context}]`, error);

  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    // 특정 에러 패턴 감지
    if (error.message.includes('API_KEY') || error.message.includes('apiKey')) {
      return {
        message: 'API 키가 유효하지 않습니다.',
        code: ERROR_CODES.AUTH_INVALID,
        statusCode: 401,
      };
    }
    if (error.message.includes('quota') || error.message.includes('rate limit')) {
      return {
        message: getErrorMessage(ERROR_CODES.API_RATE_LIMITED),
        code: ERROR_CODES.API_RATE_LIMITED,
        statusCode: 429,
      };
    }

    return {
      message: error.message,
      code: ERROR_CODES.UNKNOWN_ERROR,
      statusCode: 500,
    };
  }

  return {
    message: getErrorMessage(ERROR_CODES.UNKNOWN_ERROR),
    code: ERROR_CODES.UNKNOWN_ERROR,
    statusCode: 500,
  };
}

/**
 * 비동기 함수 래퍼
 * try-catch 보일러플레이트 제거
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  context: string
): Promise<[T, null] | [null, Error]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (error) {
    console.error(`[${context}]`, error);
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
}
