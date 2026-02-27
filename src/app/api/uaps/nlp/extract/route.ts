/**
 * UAPS NLP 풍미 추출 API
 * POST /api/uaps/nlp/extract
 *
 * 와인 리뷰 텍스트에서 6개 풍미 지표 + agingYears를 추출 (Gemini AI + 키워드 폴백)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { apiLogger } from '@/lib/logger';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ReviewInput {
  text: string;
  wineName: string;
  vintage?: string | number | null;
  reviewDate?: string | null; // "YYYY-MM-DD" 또는 "YYYY" 형식
}

interface FlavorProfile {
  fruity: number;
  floralMineral: number;
  yeastyAutolytic: number;
  acidityFreshness: number;
  bodyTexture: number;
  finishComplexity: number;
}

interface AgingYearsResult {
  value: number | null;
  confidence: number; // 0.0~1.0
  source: 'vintage_calc' | 'direct_text' | 'nlp_inferred' | 'unknown';
}

interface ExtractResult extends FlavorProfile {
  agingYears: number | null;
  agingYearsConfidence: number | null;
}

// ─── 키워드 기반 폴백 풍미 추출 ───────────────────────────────────────────────

const FLAVOR_KEYWORDS: Record<keyof FlavorProfile, string[]> = {
  fruity: ['citrus', 'lemon', 'lime', 'grapefruit', 'orange', 'apple', 'pear', 'peach', 'tropical', 'fruit', 'berry', 'cherry', 'strawberry', 'raspberry', 'melon', 'mandarin', 'yuzu', 'zesty'],
  floralMineral: ['floral', 'flower', 'blossom', 'mineral', 'chalk', 'flinty', 'slate', 'iodine', 'saline', 'wet stone', 'petrichor', 'jasmine', 'acacia', 'rose petal', 'violet'],
  yeastyAutolytic: ['yeast', 'brioche', 'bread', 'pastry', 'dough', 'biscuit', 'autolysis', 'lees', 'bready', 'croissant', 'sourdough', 'toast', 'toasty'],
  acidityFreshness: ['acid', 'acidity', 'fresh', 'crisp', 'bright', 'tart', 'sharp', 'lively', 'zest', 'tangy', 'vibrant', 'refreshing', 'nerve'],
  bodyTexture: ['body', 'creamy', 'mousse', 'silky', 'rich', 'full', 'velvety', 'texture', 'weight', 'round', 'dense', 'concentrated', 'viscous'],
  finishComplexity: ['finish', 'complex', 'length', 'depth', 'layer', 'nuance', 'persistent', 'elegant', 'long', 'aftertaste', 'honey', 'nutty', 'almond', 'hazelnut', 'marzipan', 'toffee'],
};

function extractFlavorsByKeywords(text: string): FlavorProfile {
  const lower = text.toLowerCase();
  const profile: FlavorProfile = {
    fruity: 0, floralMineral: 0, yeastyAutolytic: 0,
    acidityFreshness: 0, bodyTexture: 0, finishComplexity: 0,
  };

  for (const [flavor, keywords] of Object.entries(FLAVOR_KEYWORDS) as [keyof FlavorProfile, string[]][]) {
    let matchCount = 0;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) matchCount++;
    }
    if (matchCount >= 3) profile[flavor] = 80;
    else if (matchCount === 2) profile[flavor] = 60;
    else if (matchCount === 1) profile[flavor] = 40;
  }

  return profile;
}

// ─── agingYears 추론 (STEP 1: vintage 계산, STEP 2: 텍스트 패턴) ──────────────

/**
 * vintage + reviewDate 기반 고신뢰도 계산
 * confidence: 0.92 (연도 계산은 거의 확실)
 */
function inferAgingYearsFromVintage(
  vintage: string | number | null | undefined,
  reviewDate: string | null | undefined
): AgingYearsResult | null {
  if (!vintage) return null;

  const vintageYear = typeof vintage === 'string' ? parseInt(vintage, 10) : vintage;
  if (isNaN(vintageYear) || vintageYear < 1900 || vintageYear > 2030) return null;

  // reviewDate에서 연도 추출 (없으면 현재 연도)
  let reviewYear: number;
  if (reviewDate) {
    reviewYear = parseInt(reviewDate.substring(0, 4), 10);
  } else {
    reviewYear = new Date().getFullYear();
  }

  if (isNaN(reviewYear) || reviewYear < vintageYear) return null;

  const years = reviewYear - vintageYear;
  // 0년이면 신뢰도 낮음 (같은 해 출시-리뷰), 30년 초과는 신뢰도 낮춤
  if (years < 0 || years > 50) return null;
  const confidence = years > 30 ? 0.70 : 0.92;

  return { value: years, confidence, source: 'vintage_calc' };
}

/**
 * 텍스트에서 숙성 연수 패턴 직접 추출
 * "aged 5 years", "6년 숙성", "36 months on the lees" 등
 * confidence: 0.85~0.90
 */
function inferAgingYearsFromText(text: string): AgingYearsResult | null {
  const lower = text.toLowerCase();

  // 연 단위 패턴 (영어)
  const yearPatterns = [
    /(\d+(?:\.\d+)?)\s*[-–]?\s*year[s]?\s*(?:old|aged|of\s+age|on\s+(?:the\s+)?lees?|in\s+(?:bottle|cellar))/i,
    /aged?\s+(?:for\s+)?(\d+(?:\.\d+)?)\s*year[s]?/i,
    /(\d+(?:\.\d+)?)\s*yr[s]?\s+(?:old|aged)/i,
  ];

  for (const pattern of yearPatterns) {
    const match = lower.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      if (value > 0 && value <= 50) {
        return { value, confidence: 0.88, source: 'direct_text' };
      }
    }
  }

  // 월 단위 패턴 → 연으로 변환
  const monthPatterns = [
    /(\d+)\s*month[s]?\s+(?:on\s+(?:the\s+)?lees?|aged?|in\s+(?:bottle|cellar))/i,
    /disgorgement\s+after\s+(\d+)\s*month[s]?/i,
    /(\d+)\s*month[s]?\s+(?:of\s+)?(?:aging|ageing|maturation)/i,
  ];

  for (const pattern of monthPatterns) {
    const match = lower.match(pattern);
    if (match) {
      const months = parseInt(match[1], 10);
      if (months > 0 && months <= 600) {
        return { value: Math.round((months / 12) * 10) / 10, confidence: 0.85, source: 'direct_text' };
      }
    }
  }

  // 한국어 패턴
  const koreanPattern = text.match(/(\d+(?:\.\d+)?)\s*년\s*(?:숙성|산|빈티지)/);
  if (koreanPattern) {
    const value = parseFloat(koreanPattern[1]);
    if (value > 0 && value <= 50) {
      return { value, confidence: 0.88, source: 'direct_text' };
    }
  }

  return null;
}

// ─── Gemini AI 통합 추출 ─────────────────────────────────────────────────────

async function extractWithGemini(
  reviews: ReviewInput[],
  apiKey: string
): Promise<ExtractResult[]> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });

      const reviewTexts = reviews.map((r, i) => {
        const vintageInfo = r.vintage ? ` (vintage: ${r.vintage})` : '';
        const dateInfo = r.reviewDate ? ` [reviewed: ${r.reviewDate}]` : '';
        return `[${i + 1}] Wine: ${r.wineName}${vintageInfo}${dateInfo}\nReview: ${r.text}`;
      }).join('\n\n');

      const prompt = `Analyze these wine tasting notes and extract:
1. Flavor intensity scores (0-100 scale) for 6 WSET/OIV dimensions
2. agingYears: estimate how many years the wine was aged/old at time of review

For agingYears:
- If vintage year and review date both given: calculate (reviewYear - vintageYear)
- If review mentions "X years old/aged" or "X months on lees": extract directly
- If only maturity descriptors (young/developing/peak/mature/aged): estimate range midpoint
- If completely unclear: return null
- Return agingYearsConfidence: 0.90 (calculated from dates), 0.85 (explicit text), 0.60 (from descriptors), 0 (unknown/null)

Flavor dimensions:
- fruity: citrus, stone fruit, tropical, apple, pear, berry
- floralMineral: flowers, chalk, flint, iodine, saline, mineral
- yeastyAutolytic: brioche, bread, pastry, toast, lees, biscuit
- acidityFreshness: crisp, tart, bright, vibrant, fresh
- bodyTexture: creamy, mousse, silky, rich, full, weight
- finishComplexity: persistent, layered, honey, nutty, deep, long

Return ONLY a JSON array. One object per review in input order.
Example: [{"fruity":65,"floralMineral":30,"yeastyAutolytic":45,"acidityFreshness":70,"bodyTexture":55,"finishComplexity":40,"agingYears":5,"agingYearsConfidence":0.85}]

Reviews:
${reviewTexts}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('JSON 배열을 찾을 수 없음');

      const parsed = JSON.parse(jsonMatch[0]) as ExtractResult[];

      if (parsed.length !== reviews.length) {
        throw new Error(`결과 수 불일치: ${parsed.length} vs ${reviews.length}`);
      }

      return parsed;
    } catch (error) {
      apiLogger.warn(`Gemini ${modelName} 실패, 다음 모델 시도`, { error });
      continue;
    }
  }

  // 모든 Gemini 모델 실패 → 키워드 + 로컬 추론 폴백
  apiLogger.warn('모든 Gemini 모델 실패, 키워드 폴백 사용');
  return reviews.map((r) => {
    const flavors = extractFlavorsByKeywords(r.text);
    // 폴백에서도 vintage 계산은 시도
    const vintageResult = inferAgingYearsFromVintage(r.vintage, r.reviewDate);
    const textResult = !vintageResult ? inferAgingYearsFromText(r.text) : null;
    const best = vintageResult ?? textResult;
    return {
      ...flavors,
      agingYears: best?.value ?? null,
      agingYearsConfidence: best?.confidence ?? null,
    };
  });
}

// ─── API 핸들러 ───────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { reviews } = body as { reviews: ReviewInput[] };

    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return NextResponse.json({ error: 'reviews 배열이 필요합니다.' }, { status: 400 });
    }

    if (reviews.length > 20) {
      return NextResponse.json({ error: '한 번에 최대 20건까지 처리 가능합니다.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let results: ExtractResult[];

    if (apiKey) {
      // STEP 1: vintage_calc를 먼저 수행하여 Gemini 결과를 덮어씀
      const geminiResults = await extractWithGemini(reviews, apiKey);

      results = geminiResults.map((geminiResult, i) => {
        const r = reviews[i];
        // vintage 계산이 가능하면 Gemini 추론보다 우선 (더 신뢰도 높음)
        const vintageResult = inferAgingYearsFromVintage(r.vintage, r.reviewDate);
        if (vintageResult) {
          return {
            ...geminiResult,
            agingYears: vintageResult.value,
            agingYearsConfidence: vintageResult.confidence,
          };
        }
        return geminiResult;
      });
    } else {
      apiLogger.warn('GEMINI_API_KEY 없음, 키워드 폴백 사용');
      results = reviews.map((r) => {
        const flavors = extractFlavorsByKeywords(r.text);
        const vintageResult = inferAgingYearsFromVintage(r.vintage, r.reviewDate);
        const textResult = !vintageResult ? inferAgingYearsFromText(r.text) : null;
        const best = vintageResult ?? textResult;
        return {
          ...flavors,
          agingYears: best?.value ?? null,
          agingYearsConfidence: best?.confidence ?? null,
        };
      });
    }

    // 신뢰도 0.75 미만은 agingYears를 null로 처리 (모델 오염 방지)
    const safeResults = results.map((r) => ({
      ...r,
      agingYears: (r.agingYearsConfidence ?? 0) >= 0.75 ? r.agingYears : null,
      agingYearsConfidence: (r.agingYearsConfidence ?? 0) >= 0.75 ? r.agingYearsConfidence : null,
    }));

    return NextResponse.json({
      results: safeResults,
      method: apiKey ? 'gemini' : 'keyword_fallback',
      count: safeResults.length,
    });
  } catch (error) {
    apiLogger.error('NLP 풍미 추출 실패', { error });
    return NextResponse.json(
      { error: 'NLP 풍미 추출 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
