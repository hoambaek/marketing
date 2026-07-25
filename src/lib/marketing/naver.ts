import 'server-only';

/**
 * 네이버 오픈 API — 데이터랩 검색어 트렌드 + 블로그 검색
 *
 * 비로그인 방식: X-Naver-Client-Id/Secret 헤더만 필요 (developers.naver.com 앱 키).
 * 호출 한도는 데이터랩 1,000회/일, 검색 25,000회/일 — 일일 수집(트렌드 1회 + 버즈 3회)에는 여유.
 *
 * 트렌드 ratio는 "요청 기간·키워드셋 내 최댓값=100"인 상댓값이다. 스케일 일관성을 위해
 * 매 수집마다 TREND_START_DATE부터 전체 기간을 다시 받아 통째로 upsert한다.
 * 검색량이 임계치 미만인 날짜는 응답에서 아예 빠진다(= 사실상 0, 표시 단에서 0 채움).
 */

export function isNaverConfigured(): boolean {
  return Boolean(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET);
}

/** 트렌드 비교 키워드셋 — 그룹을 바꾸면 전체 스케일이 재정규화되므로 과거 값과의 직접 비교가 깨진다 */
export const TREND_GROUPS = [
  { groupName: '뮤즈드마레', keywords: ['뮤즈드마레', '뮤즈 드 마레', 'musedemaree'] },
  { groupName: '해저숙성', keywords: ['해저숙성', '해저숙성 샴페인', '해저숙성 와인', '해저와인'] },
] as const;

/** 트렌드 수집 시작일 (데이터랩 조회 하한은 2016-01-01) */
export const TREND_START_DATE = '2026-01-01';

/**
 * 블로그 버즈(총 검색 결과 수) 스냅샷 대상 검색어.
 * exact=true는 따옴표 정확 구문 검색 — 브랜드명은 반드시 exact로 쓴다. 비구문 검색은 형태소
 * 분해로 무관한 글이 잡힌다(실측 2026-07-17: "뮤즈드마레" 비구문 1건 = 2018년 파리 여행기의
 * "뮤즈드루"+"마레지구" 오탐, 정확 구문은 0건). 카테고리 검색어는 단어 동시 포함이 의도라 비구문 유지.
 * dimension.query 키는 원문 그대로 유지되므로 시계열 키는 바뀌지 않는다(7/17 이전 값 1은 오탐).
 */
export const BUZZ_QUERIES = [
  { query: '뮤즈드마레', exact: true },
  { query: '해저숙성 샴페인', exact: false },
  { query: '해저숙성 와인', exact: false },
] as const;

function authHeaders(): Record<string, string> {
  return {
    'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID ?? '',
    'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET ?? '',
  };
}

export interface TrendGroupSeries {
  title: string;
  data: { period: string; ratio: number }[];
}

/** 데이터랩 일간 검색 추이 — TREND_START_DATE ~ endDate 전체를 반환 */
export async function fetchTrend(endDate: string): Promise<TrendGroupSeries[]> {
  const res = await fetch('https://openapi.naver.com/v1/datalab/search', {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startDate: TREND_START_DATE,
      endDate,
      timeUnit: 'date',
      keywordGroups: TREND_GROUPS,
    }),
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`데이터랩 트렌드 호출 실패 (${res.status}): ${await res.text()}`);
  }
  const body = (await res.json()) as { results?: TrendGroupSeries[] };
  return body.results ?? [];
}

/** 블로그 검색의 총 결과 수 — 키워드 언급 누적 버즈량 프록시. exact면 따옴표 정확 구문으로 조회 */
export async function fetchBlogTotal(query: string, exact = false): Promise<number> {
  const params = new URLSearchParams({ query: exact ? `"${query}"` : query, display: '1' });
  const res = await fetch(`https://openapi.naver.com/v1/search/blog.json?${params}`, {
    headers: authHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`블로그 검색 호출 실패 (${res.status}): ${await res.text()}`);
  }
  const body = (await res.json()) as { total?: number };
  return body.total ?? 0;
}
