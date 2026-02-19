/**
 * CellarTracker 데이터 변환 + 업로드 API
 * POST /api/uaps/cellartracker/upload
 *
 * 수집된 CellarTracker JSON 데이터를 WineTerrestrialData 형식으로 변환하고
 * NLP 풍미 추출 후 Supabase에 업로드
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { apiLogger } from '@/lib/logger';
import { bulkInsertTerrestrialData } from '@/lib/supabase/database/uaps';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface CellarTrackerNote {
  wineName: string;
  wineType: string;
  locale: string;
  variety: string;
  date: string;
  score: string;
  reviewText: string;
  iWine: string;
  iNote: string;
}

interface FlavorScores {
  fruity: number;
  floralMineral: number;
  yeastyAutolytic: number;
  acidityFreshness: number;
  bodyTexture: number;
  finishComplexity: number;
}

// 와인명에서 빈티지 추출
function extractVintage(wineName: string): number | null {
  const match = wineName.match(/^(\d{4})\s/);
  if (match) {
    const year = parseInt(match[1], 10);
    if (year >= 1900 && year <= 2030) return year;
  }
  return null; // NV (Non-Vintage)
}

// CellarTracker wineType → UAPS WineType 변환
function classifyWineType(wineType: string, wineName: string): string {
  const lower = (wineType + ' ' + wineName).toLowerCase();

  if (lower.includes('rosé') || lower.includes('rose')) return 'rose';
  if (lower.includes('blanc de blancs') || lower.includes('bdb')) return 'blanc_de_blancs';
  if (lower.includes('blanc de noirs') || lower.includes('bdn')) return 'blanc_de_noirs';

  const vintage = extractVintage(wineName);
  if (vintage && vintage <= new Date().getFullYear() - 5) return 'vintage';

  return 'blend';
}

// 빈티지와 현재 시간으로 숙성 단계 추정
function estimateAgingStage(vintage: number | null, tastingDate: string | null): string {
  if (!vintage) return 'developing'; // NV는 대부분 developing
  const now = tastingDate ? new Date(tastingDate).getFullYear() : new Date().getFullYear();
  const age = now - vintage;
  if (age <= 3) return 'youthful';
  if (age <= 8) return 'developing';
  if (age <= 15) return 'mature';
  return 'aged';
}

// 날짜 변환 (M/D/YYYY → YYYY-MM-DD)
function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
  }
  return null;
}

// 키워드 기반 풍미 추출 (Gemini 폴백) — WSET/OIV 6축
const FLAVOR_KEYWORDS: Record<keyof FlavorScores, string[]> = {
  fruity: ['citrus', 'lemon', 'lime', 'grapefruit', 'orange', 'apple', 'pear', 'peach', 'tropical', 'fruit', 'berry', 'cherry', 'strawberry', 'melon', 'zesty'],
  floralMineral: ['floral', 'flower', 'blossom', 'mineral', 'chalk', 'flinty', 'slate', 'iodine', 'saline', 'jasmine', 'acacia', 'violet'],
  yeastyAutolytic: ['yeast', 'brioche', 'bread', 'pastry', 'dough', 'biscuit', 'autolysis', 'lees', 'bready', 'croissant', 'sourdough', 'toast', 'toasty'],
  acidityFreshness: ['acid', 'acidity', 'fresh', 'crisp', 'bright', 'tart', 'sharp', 'lively', 'zest', 'tangy', 'vibrant', 'refreshing'],
  bodyTexture: ['body', 'creamy', 'mousse', 'silky', 'rich', 'full', 'velvety', 'texture', 'weight', 'round', 'dense', 'concentrated'],
  finishComplexity: ['finish', 'complex', 'length', 'depth', 'layer', 'nuance', 'persistent', 'elegant', 'long', 'aftertaste', 'honey', 'nutty', 'almond', 'toffee'],
};

function extractFlavorsByKeywords(text: string): FlavorScores {
  const lower = text.toLowerCase();
  const scores: FlavorScores = { fruity: 0, floralMineral: 0, yeastyAutolytic: 0, acidityFreshness: 0, bodyTexture: 0, finishComplexity: 0 };

  for (const [flavor, keywords] of Object.entries(FLAVOR_KEYWORDS) as [keyof FlavorScores, string[]][]) {
    let count = 0;
    for (const kw of keywords) { if (lower.includes(kw)) count++; }
    if (count >= 3) scores[flavor] = 80;
    else if (count === 2) scores[flavor] = 60;
    else if (count === 1) scores[flavor] = 40;
  }
  return scores;
}

// Gemini NLP 배치 처리
async function extractFlavorsWithGemini(
  reviews: { text: string; wineName: string }[],
  apiKey: string
): Promise<FlavorScores[]> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const reviewTexts = reviews.map((r, i) =>
        `[${i + 1}] ${r.wineName}: ${r.text.slice(0, 300)}`
      ).join('\n\n');

      const prompt = `Analyze these champagne tasting notes. Extract flavor intensity scores (0-100) for each using WSET/OIV professional framework.

Dimensions: fruity (all fruit notes), floralMineral (floral + mineral), yeastyAutolytic (yeast/autolytic/brioche/toast), acidityFreshness (acidity/crisp/bright), bodyTexture (body/mousse/creamy), finishComplexity (finish length/complexity/nuance)

Return ONLY a JSON array. One object per review.
Example: [{"fruity":65,"floralMineral":30,"yeastyAutolytic":45,"acidityFreshness":70,"bodyTexture":55,"finishComplexity":40}]

${reviewTexts}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('JSON not found');
      const parsed = JSON.parse(match[0]) as FlavorScores[];
      if (parsed.length === reviews.length) return parsed;
      throw new Error(`Count mismatch: ${parsed.length} vs ${reviews.length}`);
    } catch {
      continue;
    }
  }
  // 모든 모델 실패 시 키워드 폴백
  return reviews.map(r => extractFlavorsByKeywords(r.text));
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { notes } = body as { notes: CellarTrackerNote[] };

    if (!notes || !Array.isArray(notes) || notes.length === 0) {
      return NextResponse.json({ error: 'notes 배열이 필요합니다.' }, { status: 400 });
    }

    // 리뷰 텍스트가 있는 노트만 필터링
    const validNotes = notes.filter(n => n.reviewText && n.reviewText.length > 10);
    apiLogger.info(`CellarTracker 업로드: ${notes.length}건 중 ${validNotes.length}건 유효`);

    // NLP 풍미 추출 (10건씩 배치)
    const apiKey = process.env.GEMINI_API_KEY;
    const BATCH_SIZE = 10;
    const allFlavors: FlavorScores[] = [];

    for (let i = 0; i < validNotes.length; i += BATCH_SIZE) {
      const batch = validNotes.slice(i, i + BATCH_SIZE);
      const reviews = batch.map(n => ({ text: n.reviewText, wineName: n.wineName }));

      let flavors: FlavorScores[];
      if (apiKey) {
        flavors = await extractFlavorsWithGemini(reviews, apiKey);
      } else {
        flavors = reviews.map(r => extractFlavorsByKeywords(r.text));
      }
      allFlavors.push(...flavors);

      // Gemini 레이트 리밋 방지
      if (apiKey && i + BATCH_SIZE < validNotes.length) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // DB 레코드 변환
    const records = validNotes.map((note, idx) => {
      const vintage = extractVintage(note.wineName);
      const wineType = classifyWineType(note.wineType, note.wineName);
      const tastingDate = parseDate(note.date);
      const agingStage = estimateAgingStage(vintage, tastingDate);
      const flavors = allFlavors[idx];

      return {
        wine_name: note.wineName,
        producer: null as string | null,
        vintage,
        wine_type: wineType,
        ph: null as number | null,
        dosage: null as number | null,
        alcohol: null as number | null,
        acidity: null as number | null,
        reduction_potential: null as string | null,
        fruity_score: flavors.fruity,
        floral_mineral_score: flavors.floralMineral,
        yeasty_autolytic_score: flavors.yeastyAutolytic,
        acidity_freshness_score: flavors.acidityFreshness,
        body_texture_score: flavors.bodyTexture,
        finish_complexity_score: flavors.finishComplexity,
        aging_years: vintage ? new Date().getFullYear() - vintage : null,
        aging_stage: agingStage,
        drinking_window_start: null as number | null,
        drinking_window_end: null as number | null,
        data_source: 'cellartracker' as const,
        review_text: note.reviewText.slice(0, 2000),
        rating: note.score ? parseInt(note.score, 10) : null,
      };
    });

    // DB 업로드
    const result = await bulkInsertTerrestrialData(records);

    return NextResponse.json({
      total: notes.length,
      valid: validNotes.length,
      inserted: result.inserted,
      errors: result.errors,
      method: apiKey ? 'gemini' : 'keyword_fallback',
    });
  } catch (error) {
    apiLogger.error('CellarTracker 업로드 실패', { error });
    return NextResponse.json(
      { error: 'CellarTracker 데이터 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
