import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// ════════════════════════════════════════════════════════════════════════
// service_role 클라이언트 — 서버 전용
// ════════════════════════════════════════════════════════════════════════
// RLS를 우회하는 관리자 키. 절대 클라이언트 번들에 포함되면 안 된다.
// (import 'server-only'로 클라이언트 컴포넌트에서 import 시 빌드 에러 발생)
//
// tasting_submissions처럼 anon 접근을 차단한 테이블을 다루는
// 서버 API 라우트에서만 사용한다.
// ════════════════════════════════════════════════════════════════════════

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  logger.warn('SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다. 외부 시음 제출 기능이 비활성화됩니다.');
}

export const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

export const isSupabaseAdminConfigured = () => !!supabaseAdmin;
