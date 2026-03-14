import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { CATEGORY_REDUCTION_CHECKLIST } from '@/lib/types/uaps';

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { productName, productCategory } = await request.json();
  if (!productName) {
    return NextResponse.json({ error: '제품명이 필요합니다.' }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY 미설정' }, { status: 500 });
  }

  const categoryLabels: Record<string, string> = {
    champagne: '샴페인/스파클링 와인', red_wine: '레드와인', white_wine: '화이트와인',
    whisky: '위스키', sake: '사케/일본주', coldbrew: '콜드브루 커피',
    puer: '보이차/생차', soy_sauce: '간장', vinegar: '식초', spirits: '한국 전통주',
  };
  const categoryLabel = categoryLabels[productCategory] || productCategory;

  const subtypeOptions: Record<string, string[]> = {
    champagne: ['blend', 'blanc_de_blancs', 'blanc_de_noirs', 'rose', 'vintage'],
    red_wine: ['cabernet_sauvignon', 'merlot', 'pinot_noir', 'syrah', 'blend_red', 'other_red'],
    white_wine: ['chardonnay', 'sauvignon_blanc', 'riesling', 'blend_white', 'other_white'],
    whisky: ['single_malt', 'blended', 'bourbon', 'rye', 'other_whisky'],
    sake: ['junmai_daiginjo', 'junmai_ginjo', 'junmai', 'honjozo', 'sparkling_sake'],
    coldbrew: ['single_origin', 'blend_coffee', 'decaf'],
    puer: ['sheng_raw', 'shou_ripe', 'aged_vintage'],
    soy_sauce: ['naturally_brewed', 'aged_premium', 'tamari'],
    vinegar: ['balsamic', 'apple_cider', 'rice_wine', 'traditional'],
    spirits: ['makgeolli', 'soju_premium', 'yakju', 'fruit_wine'],
  };

  const closureOptions = ['cork_natural', 'crown_cap', 'screwcap', 'diam', 'glass_stopper', 'ceramic_cap'];
  const validSubtypes = subtypeOptions[productCategory] || [];

  // 카테고리별 환원 체크리스트 → AI에게 ID와 설명 전달
  const checklist = CATEGORY_REDUCTION_CHECKLIST[productCategory] || CATEGORY_REDUCTION_CHECKLIST['champagne'] || [];
  const checklistDesc = checklist.map(item =>
    `"${item.id}": ${item.label} (${item.desc})${item.group ? ` [그룹: ${item.group}, 이 그룹에서 하나만 선택]` : ''}`
  ).join('\n  ');

  const prompt = `"${productName}" 제품을 웹에서 검색하여 정확한 정보를 찾아주세요. 카테고리: ${categoryLabel}.

반드시 아래 JSON 형식만 반환하세요:

{
  "subtype": "${validSubtypes.join(' | ')} 중 하나",
  "vintage": 빈티지 연도 숫자 또는 null,
  "ph": pH 숫자 또는 null,
  "dosage": 도사주 g/L 숫자 또는 null,
  "alcohol": 알코올 도수 % 숫자 또는 null,
  "closureType": "${closureOptions.join(' | ')} 중 하나",
  "terrestrialAgingYears": 출시 전 숙성 기간 연수 숫자,
  "reductionChecks": {해당하는 체크리스트 ID를 true로 설정},
  "notes": "제품 특징 한 줄 요약 한국어 30자 이내"
}

reductionChecks에 사용할 수 있는 체크리스트 항목:
  ${checklistDesc}

이 제품의 양조/제조 방식을 분석하여 해당하는 항목을 true로 설정하세요.
같은 그룹의 항목은 하나만 true로 설정하세요.
모르는 항목은 false로 설정하세요.`;

  try {
    // @google/genai — Google Search grounding 사용 (uaps-ai-predictor와 동일 패턴)
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const MODELS = ['gemini-3-flash-preview', 'gemini-2.5-flash'];

    let responseText = '';

    for (const modelName of MODELS) {
      try {
        // Google Search grounding + JSON 모드 시도
        let response;
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              tools: [{ googleSearch: {} }],
              responseMimeType: 'application/json',
            },
          });
        } catch {
          // JSON 모드 호환 불가 시 텍스트 모드 폴백
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              tools: [{ googleSearch: {} }],
            },
          });
        }

        responseText = response.text ?? '';
        if (responseText.includes('{')) break; // JSON 응답 받으면 중단
      } catch {
        continue; // 다음 모델 시도
      }
    }

    if (!responseText) {
      return NextResponse.json({ error: 'AI 응답 없음' }, { status: 500 });
    }

    // JSON 추출
    const cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'JSON 추출 실패', raw: responseText }, { status: 500 });
    }

    const info = JSON.parse(jsonMatch[0]);

    // subtype 검증
    if (info.subtype && !validSubtypes.includes(info.subtype)) {
      const match = validSubtypes.find(v =>
        info.subtype.toLowerCase().includes(v.replace(/_/g, ' ')) ||
        v.includes(info.subtype.toLowerCase())
      );
      info.subtype = match || validSubtypes[0] || info.subtype;
    }

    // closureType 검증
    if (info.closureType && !closureOptions.includes(info.closureType)) {
      info.closureType = 'cork_natural';
    }

    return NextResponse.json(info);
  } catch (error) {
    return NextResponse.json(
      { error: 'AI 정보 조회 실패', details: String(error) },
      { status: 500 }
    );
  }
}
