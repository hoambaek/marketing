import 'server-only';
import { getGoogleAccessToken, isGoogleConfigured } from './google-auth';

/**
 * Google Web Search Indexing API — 신규·수정·삭제 URL을 구글에 즉시 통지한다.
 *
 * GA4·Search Console과 같은 서비스 계정 키(GOOGLE_SERVICE_ACCOUNT_KEY)를 공유하되,
 * 스코프만 indexing으로 발급받는다(google-auth의 토큰 캐시는 스코프별로 분리됨).
 *
 * 사전 준비(1회, 코드로는 불가):
 * 1) GCP 프로젝트에서 "Web Search Indexing API" 활성화
 * 2) 서비스 계정을 해당 서치콘솔 속성의 '소유자'로 등록
 * 둘 중 하나라도 없으면 publish가 403(PERMISSION_DENIED / SERVICE_DISABLED)으로 실패한다.
 *
 * 참고: 이 API는 공식적으로 JobPosting·BroadcastEvent 구조화 페이지를 위한 것이라
 * 일반 페이지에 대한 재크롤 보장은 없다. 다만 정확한 URL_UPDATED/URL_DELETED 통지는
 * 유효한 신호이며 재크롤을 앞당기는 데 실무상 도움이 된다.
 */

const SCOPE = 'https://www.googleapis.com/auth/indexing';
const ENDPOINT = 'https://indexing.googleapis.com/v3/urlNotifications:publish';

export type IndexNotifyType = 'URL_UPDATED' | 'URL_DELETED';

export interface IndexNotifyResult {
  url: string;
  ok: boolean;
  status: number;
  notifyTime?: string;
  error?: string;
}

export function isIndexingConfigured(): boolean {
  return isGoogleConfigured();
}

/** 단일 URL 통지. 기본 URL_UPDATED. */
export async function publishUrlNotification(
  url: string,
  type: IndexNotifyType = 'URL_UPDATED'
): Promise<IndexNotifyResult> {
  const token = await getGoogleAccessToken(SCOPE);
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, type }),
  });
  const body = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
    urlNotificationMetadata?: { latestUpdate?: { notifyTime?: string } };
  };
  if (!res.ok) {
    return { url, ok: false, status: res.status, error: body.error?.message || `HTTP ${res.status}` };
  }
  return {
    url,
    ok: true,
    status: res.status,
    notifyTime: body.urlNotificationMetadata?.latestUpdate?.notifyTime,
  };
}

/** 여러 URL 순차 통지(레이트 여유용 딜레이). 한 건 실패해도 나머지는 계속 진행. */
export async function publishBatch(
  urls: string[],
  type: IndexNotifyType = 'URL_UPDATED',
  delayMs = 200
): Promise<IndexNotifyResult[]> {
  const out: IndexNotifyResult[] = [];
  for (const url of urls) {
    out.push(await publishUrlNotification(url, type));
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  }
  return out;
}
