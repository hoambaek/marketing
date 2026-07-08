/**
 * 검색어 3계층 자동 태깅 (블로그 콘텐츠 캘린더 2026 Q3의 키워드 전략)
 *
 * T1 니치 소유형: 경쟁 없는 자기 정의 키워드 — 소량이지만 정확한 유입
 * T2 인접 정보성: 검색량 있는 질문에 실측 데이터로 답하는 키워드 — 유입 볼륨의 본체
 * T3 고유명·사건형: 미디어·업계 검색
 *
 * 규칙은 발행 4~6주 후 GSC 실측 쿼리로 보정한다.
 */

const T1_PATTERNS = [
  '해저숙성', '해저 숙성', '해저숙성 샴페인', '해저 와인', '바다 숙성',
  'underwater aged', 'underwater aging', 'sea aged', 'ocean aged',
];

const T2_PATTERNS = [
  '샴페인 숙성', '샴페인 보관', '샴페인 온도', '샴페인 선물', '와인 선물',
  '브뤼 나뛰르', '브뤼', 'brut nature', '샴페인 종류', '샴페인 유통기한',
  '와인 셀러', '남해 수온', '바다 수온', '수심 수온', '전통주 숙성',
  '안동소주', '숙성 소주', '침몰선 샴페인', '와인 숙성', '빈티지 샴페인',
  'champagne storage', 'champagne temperature', 'how long to age',
];

const T3_PATTERNS = [
  'evett', '에벳', '미슐랭', '보길도', '뮤즈드마레', 'muse de maree',
  'musedemaree', 'mignon boulard',
];

export function tagKeywordTier(query: string): 'T1' | 'T2' | 'T3' | null {
  const q = query.toLowerCase().trim();
  // T1이 T2보다 구체적이므로 먼저 검사 (예: "해저숙성 샴페인"은 T1)
  if (T1_PATTERNS.some((p) => q.includes(p.toLowerCase()))) return 'T1';
  if (T3_PATTERNS.some((p) => q.includes(p.toLowerCase()))) return 'T3';
  if (T2_PATTERNS.some((p) => q.includes(p.toLowerCase()))) return 'T2';
  return null;
}
