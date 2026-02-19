/**
 * UAPS NLP 풍미 추출 API
 * POST /api/uaps/nlp/extract
 *
 * 와인 리뷰 텍스트에서 6개 풍미 지표를 추출 (Gemini AI + 키워드 폴백)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { apiLogger } from '@/lib/logger';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ReviewInput {
  text: string;
  wineName: string;
  vintage?: string | number | null;
}

interface FlavorProfile {
  fruity: number;           // 감귤류, 과일, 열대과일, 사과, 배
  floralMineral: number;    // 꽃향, 미네랄, 백악, 부싯돌, 요오드
  yeastyAutolytic: number;  // 효모, 브리오슈, 빵, 이스트, 자가분해
  acidityFreshness: number; // 산미, 상쾌함, 크리스피, 신선
  bodyTexture: number;      // 바디감, 크리미, 무스, 실키, 풍부함
  finishComplexity: number; // 여운, 복합미, 깊이, 레이어
}

// 키워드 기반 폴백 풍미 추출 — WSET/OIV 6축
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
    // 키워드 매칭 수에 따라 0-100 스케일로 변환
    if (matchCount >= 3) profile[flavor] = 80;
    else if (matchCount === 2) profile[flavor] = 60;
    else if (matchCount === 1) profile[flavor] = 40;
  }

  return profile;
}

// Gemini AI 풍미 추출
async function extractFlavorsWithGemini(
  reviews: ReviewInput[],
  apiKey: string
): Promise<FlavorProfile[]> {
  const genAI = new GoogleGenerativeAI(apiKey);

  // 모델 폴백 순서
  const models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });

      const reviewTexts = reviews.map((r, i) =>
        `[${i + 1}] Wine: ${r.wineName}${r.vintage ? ` (${r.vintage})` : ''}\nReview: ${r.text}`
      ).join('\n\n');

      const prompt = `Analyze these wine tasting notes and extract flavor intensity scores (0-100 scale) for each wine.

Flavor dimensions (WSET/OIV professional framework):
- fruity: all fruit notes (citrus, stone fruit, tropical, apple, pear, berry)
- floralMineral: floral aromas + mineral character (flowers, chalk, flint, iodine, saline)
- yeastyAutolytic: yeast/autolytic character (brioche, bread, pastry, toast, lees)
- acidityFreshness: acidity and freshness perception (crisp, tart, bright, vibrant)
- bodyTexture: body weight and texture (creamy, mousse quality, silky, rich, full)
- finishComplexity: finish length and complexity (persistent, layered, nuanced, honey, nutty, deep)

Return ONLY a JSON array of objects with these exact keys. One object per review in order.
Example: [{"fruity":65,"floralMineral":30,"yeastyAutolytic":45,"acidityFreshness":70,"bodyTexture":55,"finishComplexity":40}]

Reviews:
${reviewTexts}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // JSON 배열 추출
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('JSON 배열을 찾을 수 없음');

      const parsed = JSON.parse(jsonMatch[0]) as FlavorProfile[];

      if (parsed.length !== reviews.length) {
        throw new Error(`결과 수 불일치: ${parsed.length} vs ${reviews.length}`);
      }

      return parsed;
    } catch (error) {
      apiLogger.warn(`Gemini ${modelName} 실패, 다음 모델 시도`, { error });
      continue;
    }
  }

  // 모든 모델 실패 시 키워드 폴백
  apiLogger.warn('모든 Gemini 모델 실패, 키워드 폴백 사용');
  return reviews.map(r => extractFlavorsByKeywords(r.text));
}

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
    let results: FlavorProfile[];

    if (apiKey) {
      results = await extractFlavorsWithGemini(reviews, apiKey);
    } else {
      apiLogger.warn('GEMINI_API_KEY 없음, 키워드 폴백 사용');
      results = reviews.map(r => extractFlavorsByKeywords(r.text));
    }

    return NextResponse.json({
      results,
      method: apiKey ? 'gemini' : 'keyword_fallback',
      count: results.length,
    });
  } catch (error) {
    apiLogger.error('NLP 풍미 추출 실패', { error });
    return NextResponse.json(
      { error: 'NLP 풍미 추출 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
