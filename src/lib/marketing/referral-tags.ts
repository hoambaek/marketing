/**
 * 자기보고 어트리뷰션 태깅 — "어떻게 알게 되셨나요" 원문을 정규 태그로 분류
 *
 * 저트래픽 환경이라 LLM보다 규칙 기반이 안전하고 비용 0.
 * 규칙으로 못 잡으면 '기타'로 두고, 원문(referral_source)은 항상 보존한다.
 */

export type ReferralTag =
  | '지인추천'
  | '인스타그램'
  | '유튜브'
  | 'AI검색'
  | '검색'
  | '기사·미디어'
  | '호텔·레스토랑'
  | '행사·시음'
  | '기타';

const RULES: { tag: ReferralTag; patterns: RegExp }[] = [
  { tag: '지인추천', patterns: /지인|친구|소개|추천|아는|동료|가족|와이프|남편|지웠|입소문|referral|friend|word of mouth/i },
  { tag: '인스타그램', patterns: /인스타|instagram|insta|ig\b|릴스|reels|스토리|피드|dm|디엠/i },
  // 유튜브는 기사·미디어보다 먼저 — 랜딩 셀렉트의 고정 옵션 "유튜브"를 별도 채널로 집계
  { tag: '유튜브', patterns: /유튜브|youtube|쇼츠|shorts/i },
  { tag: 'AI검색', patterns: /chatgpt|gpt|퍼플렉시티|perplexity|클로드|claude|제미나이|gemini|코파일럿|copilot|ai\s*검색|ai가|ai에게/i },
  { tag: '검색', patterns: /검색|구글|google|네이버|naver|다음|daum|빙|bing|search/i },
  { tag: '기사·미디어', patterns: /기사|뉴스|매거진|잡지|기고|보도|언론|방송|magazine|news|press|article|블로그|blog/i },
  // 랜딩 셀렉트의 고정 옵션 "호텔, 레스토랑에서 직접" — 현장 접점 채널
  { tag: '호텔·레스토랑', patterns: /호텔|레스토랑|다이닝|와인바|바에서|매장|hotel|restaurant|dining/i },
  { tag: '행사·시음', patterns: /행사|박람회|전시|팝업|시음|테이스팅|이벤트|파티|디너|event|tasting|fair|popup|팝업스토어/i },
];

export function tagReferral(source: string | null | undefined): ReferralTag | null {
  const s = (source ?? '').trim();
  if (!s) return null;
  for (const { tag, patterns } of RULES) {
    if (patterns.test(s)) return tag;
  }
  return '기타';
}
