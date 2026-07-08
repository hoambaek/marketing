import 'server-only';
import { createSign } from 'node:crypto';

/**
 * Google 서비스 계정 → OAuth2 액세스 토큰 (의존성 없이 JWT 직접 서명)
 *
 * 환경변수 GOOGLE_SERVICE_ACCOUNT_KEY: 서비스 계정 JSON 키를
 * 그대로 또는 base64 인코딩해서 넣는다 (Vercel 환경변수는 base64 권장).
 * GA4 Data API와 Search Console API가 같은 키를 공유한다.
 */

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
}

const tokenCache = new Map<string, { token: string; expiresAt: number }>();

export function getServiceAccountKey(): ServiceAccountKey | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;
  try {
    const json = raw.trim().startsWith('{')
      ? raw
      : Buffer.from(raw, 'base64').toString('utf-8');
    const parsed = JSON.parse(json);
    if (!parsed.client_email || !parsed.private_key) return null;
    return parsed as ServiceAccountKey;
  } catch {
    return null;
  }
}

export function isGoogleConfigured(): boolean {
  return getServiceAccountKey() !== null;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

/** 스코프별 액세스 토큰 발급 (55분 캐시) */
export async function getGoogleAccessToken(scope: string): Promise<string> {
  const cached = tokenCache.get(scope);
  if (cached && cached.expiresAt > Date.now()) return cached.token;

  const key = getServiceAccountKey();
  if (!key) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY가 설정되지 않았습니다.');

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(
    JSON.stringify({
      iss: key.client_email,
      scope,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  );
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${claims}`);
  const signature = signer.sign(key.private_key).toString('base64url');
  const assertion = `${header}.${claims}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!res.ok) {
    throw new Error(`Google 토큰 발급 실패 (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache.set(scope, {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  });
  return data.access_token;
}
