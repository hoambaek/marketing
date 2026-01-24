/**
 * 환경 변수 검증 유틸리티
 *
 * 필수 환경 변수의 존재 여부를 확인하고,
 * 누락된 경우 명확한 에러 메시지를 제공
 */

// 필수 환경 변수 정의
const REQUIRED_ENV_VARS = {
  // Supabase (선택적 - 없으면 로컬 스토리지 사용)
  supabase: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'] as const,

  // Clerk 인증 (선택적 - 없으면 인증 우회)
  clerk: ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'] as const,

  // AI 기능 (AI 사용 시 필수)
  ai: ['GEMINI_API_KEY'] as const,

  // 파일 업로드 (업로드 기능 사용 시 필수)
  storage: [
    'CLOUDFLARE_R2_ACCOUNT_ID',
    'CLOUDFLARE_R2_ACCESS_KEY_ID',
    'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
    'CLOUDFLARE_R2_PUBLIC_URL',
  ] as const,
} as const;

type EnvGroup = keyof typeof REQUIRED_ENV_VARS;

/**
 * 특정 그룹의 환경 변수가 모두 설정되어 있는지 확인
 */
export function isEnvGroupConfigured(group: EnvGroup): boolean {
  const vars = REQUIRED_ENV_VARS[group];
  return vars.every((v) => !!process.env[v]);
}

/**
 * 특정 그룹에서 누락된 환경 변수 목록 반환
 */
export function getMissingEnvVars(group: EnvGroup): string[] {
  const vars = REQUIRED_ENV_VARS[group];
  return vars.filter((v) => !process.env[v]);
}

/**
 * 환경 변수가 설정되어 있는지 확인하고, 없으면 에러 throw
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Please add it to your .env.local file.`
    );
  }
  return value;
}

/**
 * 환경 변수 가져오기 (기본값 지원)
 */
export function getEnv(name: string, defaultValue?: string): string | undefined {
  return process.env[name] || defaultValue;
}

/**
 * 환경 변수를 숫자로 가져오기
 */
export function getEnvNumber(name: string, defaultValue?: number): number | undefined {
  const value = process.env[name];
  if (!value) return defaultValue;

  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return defaultValue;

  return parsed;
}

/**
 * 환경 변수를 boolean으로 가져오기
 */
export function getEnvBoolean(name: string, defaultValue = false): boolean {
  const value = process.env[name];
  if (!value) return defaultValue;

  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * API 라우트에서 사용할 환경 변수 검증 함수들
 */
export const envValidators = {
  /**
   * AI API 사용 전 Gemini API 키 확인
   */
  requireGeminiApiKey(): string {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new EnvError(
        'GEMINI_API_KEY가 설정되지 않았습니다.',
        'AI 기능을 사용하려면 GEMINI_API_KEY를 설정해주세요.'
      );
    }
    return key;
  },

  /**
   * 파일 업로드 전 R2 환경 변수 확인
   */
  requireR2Config(): {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    publicUrl: string;
    bucketName: string;
  } {
    const missing = getMissingEnvVars('storage');
    if (missing.length > 0) {
      throw new EnvError(
        '파일 업로드 환경 변수가 설정되지 않았습니다.',
        `누락된 변수: ${missing.join(', ')}`
      );
    }

    return {
      accountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID!,
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
      publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL!,
      bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME || 'musedemaree',
    };
  },

  /**
   * Supabase 설정 여부 확인
   */
  isSupabaseConfigured(): boolean {
    return isEnvGroupConfigured('supabase');
  },

  /**
   * Clerk 설정 여부 확인
   */
  isClerkConfigured(): boolean {
    return isEnvGroupConfigured('clerk');
  },
};

/**
 * 환경 변수 에러 클래스
 */
export class EnvError extends Error {
  public readonly hint: string;

  constructor(message: string, hint: string) {
    super(message);
    this.name = 'EnvError';
    this.hint = hint;
  }

  toJSON() {
    return {
      error: this.message,
      hint: this.hint,
    };
  }
}

/**
 * 개발 환경에서 환경 변수 상태 로깅 (디버깅용)
 */
export function logEnvStatus(): void {
  if (process.env.NODE_ENV !== 'development') return;

  console.log('\n--- Environment Variables Status ---');

  for (const [group, vars] of Object.entries(REQUIRED_ENV_VARS)) {
    const configured = isEnvGroupConfigured(group as EnvGroup);
    const status = configured ? '✅' : '⚠️';
    console.log(`${status} ${group}: ${configured ? 'Configured' : 'Missing'}`);

    if (!configured) {
      const missing = getMissingEnvVars(group as EnvGroup);
      console.log(`   Missing: ${missing.join(', ')}`);
    }
  }

  console.log('------------------------------------\n');
}
