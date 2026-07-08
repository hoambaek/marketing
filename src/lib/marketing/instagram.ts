import 'server-only';

/**
 * Instagram Graph API 수집기 (오가닉 인사이트 전용)
 *
 * 환경변수:
 * - META_ACCESS_TOKEN: System User 토큰 (만료 없음, Business Manager 발급)
 * - META_IG_USER_ID: Instagram 비즈니스 계정의 IG User ID (숫자)
 *
 * 전략 KPI 우선: saved(저장)·shares(공유)가 팔로워 수보다 상위 지표.
 * impressions는 폐기된 지표 — views 사용.
 */

const GRAPH = 'https://graph.facebook.com/v23.0';

export function isInstagramConfigured(): boolean {
  return !!(process.env.META_ACCESS_TOKEN && process.env.META_IG_USER_ID);
}

async function graphGet(path: string, params: Record<string, string>): Promise<Record<string, unknown>> {
  const search = new URLSearchParams({
    ...params,
    access_token: process.env.META_ACCESS_TOKEN!,
  });
  const res = await fetch(`${GRAPH}/${path}?${search}`);
  if (!res.ok) {
    throw new Error(`IG Graph ${path} 실패 (${res.status}): ${await res.text()}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

/** 계정 수준: 팔로워 수 (일일 스냅샷 → 추이는 DB에 쌓인 스냅샷으로 계산) */
export async function fetchAccountSnapshot(): Promise<{ followers: number; mediaCount: number }> {
  const data = await graphGet(process.env.META_IG_USER_ID!, {
    fields: 'followers_count,media_count',
  });
  return {
    followers: Number(data.followers_count ?? 0),
    mediaCount: Number(data.media_count ?? 0),
  };
}

export interface IgMedia {
  id: string;
  caption?: string;
  media_type: string; // IMAGE | CAROUSEL_ALBUM | VIDEO
  media_product_type?: string; // FEED | REELS | STORY
  permalink?: string;
  timestamp: string;
}

/** 최근 게시물 목록 (기본 25개) */
export async function fetchRecentMedia(limit = 25): Promise<IgMedia[]> {
  const data = await graphGet(`${process.env.META_IG_USER_ID!}/media`, {
    fields: 'id,caption,media_type,media_product_type,permalink,timestamp',
    limit: String(limit),
  });
  return (data.data ?? []) as IgMedia[];
}

/** 게시물별 인사이트 — 전략 KPI(saved·shares) 포함 */
export async function fetchMediaInsights(media: IgMedia): Promise<Record<string, number>> {
  // 미디어 유형별 사용 가능 지표가 다르다
  const isReel = media.media_product_type === 'REELS';
  const metrics = isReel
    ? 'reach,saved,shares,views,likes,comments,total_interactions'
    : 'reach,saved,shares,views,likes,comments,total_interactions,profile_visits,follows';
  try {
    const data = await graphGet(`${media.id}/insights`, { metric: metrics });
    const out: Record<string, number> = {};
    for (const item of (data.data ?? []) as { name: string; values?: { value: number }[] }[]) {
      out[item.name] = Number(item.values?.[0]?.value ?? 0);
    }
    return out;
  } catch {
    // 일부 지표 미지원 미디어(구형 게시물 등)는 축소 세트로 재시도
    const data = await graphGet(`${media.id}/insights`, { metric: 'reach,saved,shares' });
    const out: Record<string, number> = {};
    for (const item of (data.data ?? []) as { name: string; values?: { value: number }[] }[]) {
      out[item.name] = Number(item.values?.[0]?.value ?? 0);
    }
    return out;
  }
}

export function mediaContentType(media: IgMedia): string {
  if (media.media_product_type === 'REELS') return 'ig_reel';
  if (media.media_type === 'CAROUSEL_ALBUM') return 'ig_carousel';
  return 'ig_post';
}
