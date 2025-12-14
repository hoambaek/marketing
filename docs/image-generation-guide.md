# 뮤즈드마레 이미지 생성 가이드라인 (Imagen 4)

## 1. 브랜드 비주얼 아이덴티티

### 1.1 핵심 무드

```
키워드: 고요함 | 심연 | 시간 | 우아함 | 신비로움 | 자연 | 장인정신
```

뮤즈드마레의 이미지는 다음을 표현해야 합니다:

| 요소 | 표현 방식 |
|------|----------|
| **시간** | 느린 움직임, 정적인 순간, 빛의 변화 |
| **바다** | 깊은 푸른색, 수면 아래의 고요함, 빛의 산란 |
| **럭셔리** | 절제된 우아함, 과시 없는 품격, 디테일 |
| **장인정신** | 손의 움직임, 도구, 집중하는 순간 |
| **자연** | 유기적 텍스처, 불완전한 아름다움 |

### 1.2 컬러 팔레트

```
PRIMARY PALETTE (주요 사용)
┌─────────────────────────────────────────────────────────┐
│  Deep Navy      │  Pearl White    │  Rose Gold        │
│  #1A365D        │  #FAFAF9        │  #B7916E          │
│  심해, 밤바다    │  거품, 빛       │  샴페인, 따뜻함    │
└─────────────────────────────────────────────────────────┘

SECONDARY PALETTE (보조 사용)
┌─────────────────────────────────────────────────────────┐
│  Ocean Teal     │  Sand Beige     │  Charcoal         │
│  #2C5F5D        │  #D4C5B5        │  #374151          │
│  바다 깊이      │  모래, 조개     │  그림자, 깊이      │
└─────────────────────────────────────────────────────────┘

ACCENT (포인트)
┌─────────────────────────────────────────────────────────┐
│  Champagne Gold │  Seafoam        │  Coral Blush      │
│  #C9A962        │  #A8D5D8        │  #E8B4A8          │
│  기포, 빛       │  수면 반사      │  새벽/석양        │
└─────────────────────────────────────────────────────────┘
```

### 1.3 비주얼 스타일

| 속성 | 권장 | 피해야 할 것 |
|------|------|-------------|
| **조명** | 자연광, 골든아워, 부드러운 확산광 | 강한 플래시, 인공조명 느낌 |
| **톤** | 약간 desaturated, 필름 느낌 | 과포화, 네온, 비비드 |
| **질감** | 필름 그레인, 자연스러운 노이즈 | 과도한 선명함, HDR |
| **구도** | 여백 활용, 미니멀, 중앙/삼분할 | 복잡한 구성, 과밀 |
| **초점** | 얕은 심도, 부드러운 보케 | 전체 선명, 과도한 디테일 |
| **분위기** | 고요함, 명상적, 시적 | 역동적, 화려함, 소란스러움 |

---

## 2. 프롬프트 구조

### 2.1 기본 구조

```
[주제/피사체], [스타일/분위기], [조명], [컬러 톤], [기술적 설정], [추가 키워드]
```

### 2.2 공통 스타일 프리픽스

모든 프롬프트 앞에 붙일 수 있는 브랜드 스타일 키워드:

```
영문 버전:
"Editorial photography style, soft natural lighting, muted color palette with deep navy and rose gold accents, film grain texture, elegant and serene atmosphere, shallow depth of field"

한글 설명:
에디토리얼 포토그래피 스타일, 부드러운 자연광, 딥 네이비와 로즈 골드 악센트의 뮤트 컬러, 필름 그레인 텍스처, 우아하고 고요한 분위기, 얕은 심도
```

### 2.3 공통 네거티브 프롬프트

```
Negative prompt:
"oversaturated, neon colors, harsh lighting, flash photography, HDR, overly sharp, busy background, cluttered composition, text, watermark, logo, people's faces clearly visible, commercial advertising style, stock photo feel, artificial, plastic"
```

---

## 3. 카테고리별 이미지 가이드

### 3.1 바다의 일지 (Sea Log)

**주제**: 숙성 과정, 바다, 해저, 시간의 흐름

**무드**: 신비로움, 고요함, 깊이, 경외감

**권장 피사체**:
- 수면 아래로 내려가는 빛
- 해저의 샴페인 케이지/병
- 바다 표면의 물결
- 수중 기포
- 어둠 속 희미한 빛
- 해양 생물 (조개, 산호, 해초)의 추상적 표현

**프롬프트 예시**:

```
예시 1: 해저 숙성 장면
"Underwater photography of champagne bottles resting on the ocean floor, 
deep navy blue water, soft light rays penetrating from above, 
small bubbles rising, barnacles and sea minerals on bottles, 
mysterious and serene atmosphere, film grain, 
shot on medium format camera, editorial style"

예시 2: 수면 빛
"Abstract ocean surface from below, looking up at diffused sunlight, 
deep blue gradient fading to soft white, 
gentle water ripples creating light patterns, 
meditative and calm mood, minimal composition, 
muted tones with hints of champagne gold, cinematic"

예시 3: 입수 순간
"Champagne cage slowly descending into dark ocean water, 
trail of tiny bubbles, dramatic depth, 
last rays of surface light fading, 
sense of time stopping, editorial photography, 
deep navy and pearl white color palette"
```

**컬러 팔레트 강조**: Deep Navy, Ocean Teal, Pearl White

---

### 3.2 메종 이야기 (Maison Stories)

**주제**: 브랜드 철학, 창업자, 여정, 기원

**무드**: 성찰적, 따뜻함, 진정성, 헤리티지

**권장 피사체**:
- 샹파뉴 포도밭 풍경
- 오래된 셀러/동굴
- 손 (작업하는, 잡고 있는)
- 빈티지 도구, 오브제
- 길, 여정을 암시하는 풍경
- 창문으로 들어오는 빛

**프롬프트 예시**:

```
예시 1: 샹파뉴 떼루아
"Champagne vineyard at golden hour, rolling hills covered in grapevines, 
soft warm light, misty atmosphere in the distance, 
sense of heritage and time, film photography style, 
muted earth tones with golden accents, 
wide landscape composition, serene and contemplative"

예시 2: 장인의 손
"Close-up of weathered hands holding a champagne bottle, 
soft window light from the side, shallow depth of field, 
texture of aged skin and glass, 
sense of care and craftsmanship, 
warm muted tones, editorial portrait style, film grain"

예시 3: 셀러
"Ancient champagne cellar with chalk walls, 
rows of bottles aging in darkness, 
single beam of light from above, dust particles floating, 
sense of time and patience, 
deep shadows with warm highlights, cinematic composition"
```

**컬러 팔레트 강조**: Sand Beige, Champagne Gold, Charcoal, 따뜻한 톤

---

### 3.3 문화와 예술 (Culture & Art)

**주제**: 협업 아티스트, 예술 작품, 공간, 창작 과정

**무드**: 영감, 창의성, 교차점, 큐레이션

**권장 피사체**:
- 공예 작업 장면 (도자기, 유리, 금속)
- 갤러리/전시 공간
- 예술 작품 디테일
- 재료와 도구
- 작업실 풍경
- 빛과 그림자의 추상적 표현

**프롬프트 예시**:

```
예시 1: 공예 작업
"Artisan hands shaping ceramic in a minimalist workshop, 
soft diffused daylight from large window, 
clay texture and wet surface catching light, 
tools arranged nearby, sense of focus and meditation, 
muted earthy palette with navy blue accents, 
editorial documentary style, medium format quality"

예시 2: 나전칠기
"Close-up of mother-of-pearl inlay work in progress, 
iridescent shell fragments on dark lacquer surface, 
delicate tools, craftsman's hands blurred in background, 
play of light on nacre creating rainbow highlights, 
shallow depth of field, luxury craft photography"

예시 3: 갤러리 공간
"Minimalist gallery space with single champagne bottle displayed, 
white walls with subtle texture, dramatic side lighting, 
long shadows, sense of reverence and curation, 
bottle as art object, museum quality presentation, 
muted tones with rose gold accent lighting"
```

**컬러 팔레트 강조**: Pearl White, Charcoal, Rose Gold 악센트

---

### 3.4 테이블 위에서 (At the Table)

**주제**: 페어링, 시음, 테이블 세팅, 미식 경험

**무드**: 감각적, 우아함, 친밀함, 축제

**권장 피사체**:
- 샴페인 잔과 기포
- 테이블 세팅 디테일
- 음식 페어링 (굴, 치즈, 디저트)
- 따르는 순간
- 손으로 잔을 드는 모습
- 테이블 위 빛과 그림자

**프롬프트 예시**:

```
예시 1: 샴페인 기포
"Extreme close-up of champagne bubbles rising in a crystal flute glass, 
golden liquid with tiny effervescent bubbles, 
soft backlight creating glow, 
dark background fading to navy, 
sense of celebration and refinement, 
macro photography, shallow depth of field"

예시 2: 테이블 세팅
"Elegant minimal table setting with champagne bottle and two flutes, 
linen tablecloth with natural texture, 
soft candlelight and golden hour window light, 
oysters on ice as pairing, 
muted color palette with rose gold cutlery accents, 
editorial food photography, film aesthetic"

예시 3: 따르는 순간
"Champagne being poured into a coupe glass, 
liquid stream and foam captured mid-motion, 
soft side lighting, dark moody background, 
hand holding bottle partially visible, 
sense of ritual and anticipation, 
high-end beverage photography, cinematic"
```

**컬러 팔레트 강조**: Champagne Gold, Pearl White, Deep Navy 배경

---

### 3.5 뉴스 & 이벤트 (News & Events)

**주제**: 브랜드 이벤트, 공간, 발표, 순간 포착

**무드**: 기대감, 축하, 공식적이면서 따뜻함

**권장 피사체**:
- 이벤트 공간 (조명, 세팅)
- 사람들의 실루엣 (얼굴 없이)
- 초대장, 인쇄물 디테일
- 공간 전경
- 의미 있는 순간의 디테일

**프롬프트 예시**:

```
예시 1: 이벤트 공간
"Intimate event space prepared for champagne tasting, 
low ambient lighting with candles and string lights, 
minimalist setup with navy blue velvet seating, 
champagne bottles displayed on marble counter, 
warm inviting atmosphere, architectural photography style, 
bokeh lights in background"

예시 2: 런칭 순간
"Silhouettes of guests raising champagne glasses in toast, 
backlit by warm golden light, 
faces not visible, sense of celebration and community, 
blurred bokeh lights, cinematic composition, 
editorial event photography, film grain texture"

예시 3: 초대장
"Luxury invitation card with embossed lettering on textured paper, 
navy blue and rose gold color scheme, 
soft directional lighting creating shadows, 
champagne bottle blurred in background, 
high-end stationery photography, shallow depth of field"
```

**컬러 팔레트 강조**: Deep Navy, Rose Gold, Champagne Gold, 따뜻한 조명

---

## 4. 기술적 파라미터 가이드

### 4.1 이미지 비율

| 용도 | 비율 | 사용처 |
|------|------|--------|
| 히어로 이미지 | 16:9 또는 21:9 | 블로그 헤더, 배너 |
| 포스트 커버 | 3:2 또는 4:3 | 포스트 썸네일 |
| 정사각형 | 1:1 | SNS 공유, 그리드 |
| 세로형 | 4:5 또는 9:16 | 모바일, 스토리 |

### 4.2 권장 설정

```
Resolution: 1024x1024 이상 (고해상도 필요시 업스케일)
Style: Photography / Editorial / Cinematic
Lighting: Natural, Soft, Golden Hour
Mood: Serene, Elegant, Mysterious
```

### 4.3 후처리 방향

생성된 이미지의 일관성을 위한 후처리 가이드:

```
1. 색온도: 약간 따뜻하게 (+5~10)
2. 채도: 살짝 낮춤 (-10~15)
3. 대비: 부드럽게 (-5~10)
4. 그레인: 미세하게 추가
5. 비네팅: 미세하게 적용
6. 하이라이트: 부드럽게 (-10)
7. 섀도우: 살짝 올림 (+5~10) - 디테일 살리기
```

---

## 5. 프롬프트 템플릿

### 5.1 기본 템플릿

```
[SUBJECT]: {피사체 상세 설명}
[STYLE]: Editorial photography, {추가 스타일}
[LIGHTING]: {조명 설명}, soft and natural
[COLOR]: Muted color palette, deep navy and rose gold accents, {추가 색상}
[MOOD]: {분위기}, serene, elegant
[TECHNICAL]: Film grain texture, shallow depth of field, {추가 기술}
[NEGATIVE]: {피해야 할 요소}
```

### 5.2 카테고리별 빠른 템플릿

```javascript
// 코드에서 사용할 수 있는 템플릿 객체

const IMAGE_PROMPT_TEMPLATES = {
  // 공통 스타일 프리픽스
  commonPrefix: `Editorial photography style, soft natural lighting, 
    muted color palette with deep navy and rose gold accents, 
    film grain texture, elegant and serene atmosphere, 
    shallow depth of field`,
  
  // 공통 네거티브
  commonNegative: `oversaturated, neon colors, harsh lighting, 
    flash photography, HDR, overly sharp, busy background, 
    cluttered composition, text, watermark, logo, 
    people's faces clearly visible, commercial advertising style, 
    stock photo feel, artificial, plastic`,

  // 카테고리별 템플릿
  categories: {
    'sea-log': {
      style: 'underwater photography, mysterious deep ocean',
      colors: 'deep navy blue, ocean teal, pearl white highlights',
      mood: 'mysterious, serene, profound depth',
      subjects: ['ocean floor', 'light rays underwater', 'bubbles', 'marine textures']
    },
    
    'maison': {
      style: 'heritage documentary, warm editorial',
      colors: 'warm earth tones, champagne gold, soft shadows',
      mood: 'contemplative, authentic, timeless',
      subjects: ['vineyards', 'cellars', 'artisan hands', 'vintage objects']
    },
    
    'culture': {
      style: 'art documentation, gallery aesthetic',
      colors: 'neutral whites, charcoal shadows, rose gold accents',
      mood: 'inspirational, curated, refined',
      subjects: ['craft process', 'art objects', 'workshop spaces', 'material textures']
    },
    
    'table': {
      style: 'food and beverage photography, sensory',
      colors: 'champagne gold, crystal clarity, warm candlelight',
      mood: 'sensual, celebratory, intimate',
      subjects: ['champagne glasses', 'bubbles', 'table settings', 'food pairings']
    },
    
    'news': {
      style: 'event photography, atmospheric',
      colors: 'ambient warm lighting, navy and gold',
      mood: 'anticipation, celebration, warmth',
      subjects: ['event spaces', 'silhouettes', 'invitation details', 'ambient scenes']
    }
  }
};
```

### 5.3 프롬프트 생성 함수 예시

```typescript
// utils/generateImagePrompt.ts

interface PromptInput {
  category: 'sea-log' | 'maison' | 'culture' | 'table' | 'news';
  subject: string;
  additionalDetails?: string;
  mood?: string;
  aspectRatio?: '16:9' | '3:2' | '1:1' | '4:5';
}

export function generateImagePrompt(input: PromptInput): {
  prompt: string;
  negativePrompt: string;
} {
  const { category, subject, additionalDetails, mood } = input;
  const template = IMAGE_PROMPT_TEMPLATES.categories[category];
  
  const prompt = `
    ${subject}, ${additionalDetails || ''},
    ${template.style},
    ${IMAGE_PROMPT_TEMPLATES.commonPrefix},
    color palette: ${template.colors},
    mood: ${mood || template.mood},
    high quality, professional photography
  `.replace(/\s+/g, ' ').trim();
  
  return {
    prompt,
    negativePrompt: IMAGE_PROMPT_TEMPLATES.commonNegative
  };
}

// 사용 예시
const result = generateImagePrompt({
  category: 'sea-log',
  subject: 'champagne bottles resting on sandy ocean floor',
  additionalDetails: 'soft light rays from above, small bubbles',
  mood: 'peaceful and mysterious'
});
```

---

## 6. 실제 프롬프트 예시 모음

### 6.1 히어로 이미지용

```
메인 히어로:
"Cinematic wide shot of dark ocean surface at twilight, 
deep navy blue water with subtle golden light reflection, 
single champagne bottle silhouette floating, 
mysterious and elegant atmosphere, 
film grain, anamorphic lens flare, 
minimalist composition with vast negative space, 
luxury brand editorial style"

카테고리 히어로 - 바다의 일지:
"Underwater scene looking up towards ocean surface, 
abstract light patterns through water, 
deep blue gradient from navy to soft cyan, 
ethereal and meditative mood, 
no visible objects, pure light and water, 
fine art photography style"

카테고리 히어로 - 메종:
"Champagne vineyard landscape at dawn, 
rows of vines leading to misty horizon, 
soft golden light breaking through clouds, 
dew drops on leaves, sense of heritage, 
wide cinematic composition, 
muted warm tones, film photography"
```

### 6.2 포스트 썸네일용

```
숙성 다이어리:
"Close-up of champagne bottle underwater with marine growth, 
barnacles and mineral deposits on glass, 
dark ocean background, subtle light from above, 
texture focus, sense of time passage, 
macro photography style, film grain"

셰프 인터뷰:
"Chef's hands plating delicate dish, 
soft overhead lighting, marble counter surface, 
champagne glass visible in background blur, 
focus on hands and food, 
warm editorial food photography"

테이스팅 노트:
"Single champagne flute with golden liquid, 
bubbles rising against dark background, 
soft rim lighting creating glow, 
elegant and minimal composition, 
beverage photography, shallow depth of field"
```

### 6.3 인라인 콘텐츠용

```
구분선 역할 추상 이미지:
"Abstract water texture, close-up of ocean surface ripples, 
deep blue tones with golden light reflections, 
minimal and meditative, fine art style, 
can be used as background texture"

인용구 배경:
"Soft out-of-focus champagne bubbles, 
golden and white bokeh lights on navy background, 
dreamy and ethereal atmosphere, 
abstract, suitable for text overlay"
```

---

## 7. 품질 체크리스트

이미지 생성 후 확인사항:

### 7.1 브랜드 적합성

- [ ] 컬러가 브랜드 팔레트 내에 있는가?
- [ ] 분위기가 "고요하고 우아한가"?
- [ ] 과도하게 화려하거나 상업적이지 않은가?
- [ ] 브랜드 스토리와 연결되는가?

### 7.2 기술적 품질

- [ ] 해상도가 충분한가?
- [ ] 구도가 균형 잡혀 있는가?
- [ ] 불필요한 아티팩트가 없는가?
- [ ] 텍스트 오버레이 공간이 있는가? (필요시)

### 7.3 콘텐츠 적합성

- [ ] 포스트 주제와 맞는가?
- [ ] 카테고리 무드와 일치하는가?
- [ ] 다른 이미지들과 일관성이 있는가?

---

## 8. 피해야 할 이미지 유형

### 8.1 절대 사용 금지

```
❌ 명확히 보이는 사람 얼굴 (초상권 문제)
❌ 타 브랜드 로고나 제품
❌ 과도하게 화려하거나 파티 분위기
❌ 저품질 스톡 이미지 느낌
❌ AI가 생성한 것이 명백히 보이는 부자연스러운 이미지
❌ 텍스트가 포함된 이미지
❌ 폭력적이거나 부정적인 이미지
```

### 8.2 주의해서 사용

```
⚠️ 음식 이미지 (고급스러움 유지 필수)
⚠️ 사람의 손 (자연스러운 포즈 확인)
⚠️ 실제 장소처럼 보이는 이미지 (오해 소지)
⚠️ 계절감이 강한 이미지 (시의성 고려)
```

---

## 9. API 연동 예시

### 9.1 Imagen 4 API 호출 (Google Cloud)

```typescript
// utils/generateImage.ts

import { ImageGenerationClient } from '@google-cloud/aiplatform';

interface GenerateImageOptions {
  category: string;
  subject: string;
  additionalDetails?: string;
  aspectRatio?: '16:9' | '3:2' | '1:1' | '4:5';
  numberOfImages?: number;
}

export async function generateBrandImage(options: GenerateImageOptions) {
  const { prompt, negativePrompt } = generateImagePrompt({
    category: options.category as any,
    subject: options.subject,
    additionalDetails: options.additionalDetails,
  });

  const client = new ImageGenerationClient();
  
  const request = {
    model: 'imagen-4.0',
    prompt: prompt,
    negativePrompt: negativePrompt,
    numberOfImages: options.numberOfImages || 4,
    aspectRatio: options.aspectRatio || '3:2',
    // Imagen 4 specific settings
    personGeneration: 'DONT_ALLOW', // 사람 얼굴 생성 방지
    safetyFilterLevel: 'BLOCK_MEDIUM_AND_ABOVE',
  };

  const response = await client.generateImages(request);
  return response.images;
}
```

### 9.2 관리자 UI 컴포넌트

```typescript
// components/admin/AIImageGenerator.tsx

'use client';

import { useState } from 'react';

const CATEGORIES = [
  { value: 'sea-log', label: '바다의 일지', icon: '🌊' },
  { value: 'maison', label: '메종 이야기', icon: '🍾' },
  { value: 'culture', label: '문화와 예술', icon: '🎨' },
  { value: 'table', label: '테이블 위에서', icon: '🍽️' },
  { value: 'news', label: '뉴스 & 이벤트', icon: '📰' },
];

const ASPECT_RATIOS = [
  { value: '16:9', label: '16:9 (히어로)' },
  { value: '3:2', label: '3:2 (포스트)' },
  { value: '1:1', label: '1:1 (SNS)' },
  { value: '4:5', label: '4:5 (모바일)' },
];

export function AIImageGenerator({ onSelect }: { onSelect: (url: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    category: 'sea-log',
    subject: '',
    additionalDetails: '',
    aspectRatio: '3:2',
  });

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      setImages(data.images);
    } catch (error) {
      console.error(error);
      alert('이미지 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectImage = async (imageUrl: string) => {
    // 선택한 이미지를 Supabase Storage에 업로드
    const response = await fetch('/api/admin/upload-generated-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
    });
    
    const { url } = await response.json();
    onSelect(url);
    setIsOpen(false);
  };

  // ... render UI
}
```

---

## 10. 브랜드 이미지 라이브러리 구축

### 10.1 카테고리별 기본 이미지 세트

초기 런칭 시 준비할 이미지 목록:

```
바다의 일지 (10장)
├── hero_ocean_surface.jpg
├── hero_underwater_light.jpg
├── thumbnail_bottles_seafloor.jpg
├── thumbnail_bubbles.jpg
├── thumbnail_kelp_texture.jpg
├── inline_water_abstract_1.jpg
├── inline_water_abstract_2.jpg
├── background_deep_blue.jpg
├── divider_wave_pattern.jpg
└── quote_bg_bubbles.jpg

메종 이야기 (10장)
├── hero_vineyard_golden.jpg
├── hero_cellar_light.jpg
├── thumbnail_hands_bottle.jpg
├── thumbnail_vintage_tools.jpg
├── thumbnail_chalk_walls.jpg
├── inline_grape_closeup.jpg
├── inline_cellar_rows.jpg
├── background_earth_texture.jpg
├── divider_vine_pattern.jpg
└── quote_bg_cellar.jpg

... (각 카테고리별 10장씩)
```

### 10.2 이미지 네이밍 컨벤션

```
[category]_[usage]_[description]_[variant].jpg

예시:
sea-log_hero_underwater-light_v1.jpg
maison_thumbnail_artisan-hands_v2.jpg
table_inline_champagne-pour_v1.jpg
```

---

**문서 버전**: 1.0  
**최종 수정일**: 2024년 12월  
**다음 업데이트**: 실제 이미지 생성 테스트 후 프롬프트 최적화
