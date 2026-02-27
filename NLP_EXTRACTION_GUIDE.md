# UAPS NLP 멀티 카테고리 6축 풍미 추출 — 원격 컴퓨터 실행 가이드

**작성일**: 2026-02-21
**목적**: 성능이 좋은 다른 컴퓨터에서 Ollama 로컬 LLM으로 카테고리별 6축 풍미 점수를 일괄 추출
**데이터 규모**: ~112,000건 리뷰 텍스트 → 6축 점수 추출 → Supabase 업데이트

---

## 1. 배경

UAPS (Undersea Aging Predictive System)는 8개 카테고리 음료의 해저 숙성 풍미를 예측합니다.
Supabase `wine_terrestrial_data` 테이블에 ~112,000건의 리뷰 데이터가 있으나, 대부분 6축 점수가 **NULL** 상태입니다.

### 핵심 원칙: 카테고리별 6축 재정의

DB 컬럼명은 모든 카테고리에서 **동일**하지만, 각 축의 **의미**가 카테고리별로 다릅니다.

| DB 컬럼 | 와인/사케 | 간장 | 식초 | 콜드브루 | 증류주 | 청주약주 | 생차 |
|---------|----------|------|------|----------|--------|---------|------|
| `fruity_score` | 과실향 | 감칠맛 깊이 | 산도 날카로움 | 향기 복합성 | 증류 순도 | 청명도 | 꽃향·과실향 |
| `floral_mineral_score` | 꽃향·미네랄 | 향미 복합성 | 에스테르 향 | 풍미 청명도 | 과실향 에스테르 | 쌀향 복합미 | 수렴성 구조 |
| `yeasty_autolytic_score` | 효모·자가분해 | 염분 통합 | 부드러움 | 산도·밝기 | 곡물 단맛 | 유산미 | 단맛 복잡성 |
| `acidity_freshness_score` | 산도·신선함 | 산미 구조 | 감칠맛 깊이 | 바디·질감 | 퓨젤 통합도 | 단맛 우아함 | 미네랄·떼루아르 |
| `body_texture_score` | 바디·질감 | 조화미 | 단맛 균형 | 단맛 깊이 | 향미 복합성 | 감칠맛 통합 | 차기 활력 |
| `finish_complexity_score` | 여운·복잡성 | 감칠맛 여운 | 여운 청명함 | 여운 공명 | 여운 따뜻함 | 여운 비단결 | 회감 속도·강도 |

---

## 2. 사전 준비

### 2-1. 필수 설치

```bash
node --version   # v18+ 확인
ollama --version # Ollama 설치 확인
```

Ollama 미설치 시:
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### 2-2. 권장 모델 (RTX 3090 24GB 기준)

```bash
# 권장: RTX 3090 24GB에서 최고 품질
ollama pull qwen2.5:32b

# 대안 (더 빠름, 품질 약간 낮음)
ollama pull qwen2.5:14b
ollama pull gemma2:9b
```

> **성능 참고**: RTX 3090 24GB에서 `qwen2.5:32b` 모델은 배치당(5건) 약 15~20초

### 2-3. 프로젝트 파일 준비

**방법 A — 필요한 파일만 복사** (권장):
```
data/scripts/nlp_extract_ollama.mjs   ← 메인 실행 스크립트 (이 파일만 있으면 됨)
```

최소 의존성 설치:
```bash
npm install @supabase/supabase-js
```

**방법 B — Git 클론**:
```bash
git clone [레포 URL]
cd marketing
npm install
```

---

## 3. 실행 방법

### 3-1. Ollama 서버 시작

```bash
ollama serve
# 또는 백그라운드: ollama serve &
```

### 3-2. 연결 확인

```bash
curl http://localhost:11434/api/tags
# 모델 목록이 JSON으로 출력되면 정상
```

### 3-3. 테스트 실행 (100건)

```bash
node data/scripts/nlp_extract_ollama.mjs --limit 100 --model qwen2.5:32b
```

정상 출력 예시:
```
🧠 Ollama 멀티 카테고리 6축 풍미 추출
   모델: qwen2.5:32b
   사용 가능 모델: qwen2.5:32b
✅ 추출 대상: 100건
📋 카테고리별 분포:
   champagne (샴페인/와인): 45건
   sake (샴페인/와인): 20건
   coldbrew (콜드브루 커피): 15건
   soy_sauce (간장): 10건
   puer (생차(보이차)): 10건
  [10%] 배치 2/20 (25s) [wine] — AI: 10, 키워드: 0, 업데이트: 10
```

### 3-4. 전체 실행

```bash
# 전체 실행 (모든 fruity_score IS NULL 레코드)
node data/scripts/nlp_extract_ollama.mjs --model qwen2.5:32b

# 특정 카테고리만
node data/scripts/nlp_extract_ollama.mjs --model qwen2.5:32b --category sake
node data/scripts/nlp_extract_ollama.mjs --model qwen2.5:32b --category soy_sauce
node data/scripts/nlp_extract_ollama.mjs --model qwen2.5:32b --category puer
node data/scripts/nlp_extract_ollama.mjs --model qwen2.5:32b --category vinegar
node data/scripts/nlp_extract_ollama.mjs --model qwen2.5:32b --category coldbrew

# 건수 제한 (테스트)
node data/scripts/nlp_extract_ollama.mjs --limit 5000 --model qwen2.5:14b
```

---

## 4. 카테고리별 6축 추출 기준

### 4-1. 와인 / 샴페인 / 사케 / 위스키 (`wine`, `champagne`, `sake`, `whisky`)

| fruity_score | 과실향 강도 | citrus, berry, tropical, stone fruit |
|---|---|---|
| floral_mineral_score | 꽃향+미네랄 | floral, chalk, flinty, saline |
| yeasty_autolytic_score | 효모/자가분해 | brioche, lees, toast, bready |
| acidity_freshness_score | 산도/신선함 | crisp, tart, bright, vibrant |
| body_texture_score | 바디/질감 | creamy, mousse, silky, rich |
| finish_complexity_score | 여운/복잡성 | persistent, layered, honey, nutty |

### 4-2. 간장 (`soy_sauce`)

| fruity_score → **umami_depth** | 감칠맛 깊이 | savory, glutamate, kokumi, meaty |
|---|---|---|
| floral_mineral_score → **aroma_complexity** | 향미 복합성 | malty, roasted, ester, fermented |
| yeasty_autolytic_score → **saltiness_integration** | 염분 통합 | balanced salt, harmonious, not too salty |
| acidity_freshness_score → **acidity_structure** | 산미 구조 | lactic, bright, slight acidity |
| body_texture_score → **harmony_balance** | 조화미 | balanced, well-rounded, layered |
| finish_complexity_score → **finish_umami_lingering** | 감칠맛 여운 | lingering umami, persistent, clean |

### 4-3. 식초 (`vinegar`) — DB: `vinegar`

| fruity_score → **acidity_sharpness** | 산도 날카로움 | sharp, acidic, tart, pungent |
|---|---|---|
| floral_mineral_score → **aroma_ester_complexity** | 향기·에스테르 복합성 | fruity, ester, aromatic, apple |
| yeasty_autolytic_score → **smoothness_mellowing** | 부드러움 | smooth, mellow, aged, soft |
| acidity_freshness_score → **umami_savory_depth** | 감칠맛 깊이 | umami, savory, depth, rich |
| body_texture_score → **sweetness_balance** | 단맛 균형 | sweet, honey, caramel, balanced |
| finish_complexity_score → **finish_clean_aftertaste** | 여운 청명함 | clean, crisp finish, refreshing |

### 4-4. 콜드브루 커피 (`coldbrew`) — DB: `coldbrew`, `cold_brew_coffee`

| fruity_score → **aroma_complexity** | 향기 복합성 | floral, fruity, chocolate, caramel |
|---|---|---|
| floral_mineral_score → **flavor_clarity** | 풍미 청명도 | clean, clear, distinct, precise |
| yeasty_autolytic_score → **acidity_brightness** | 산도·밝기 | bright, citrus, malic, crisp |
| acidity_freshness_score → **body_texture** | 바디·질감 | full body, smooth, syrupy, velvety |
| body_texture_score → **sweetness_depth** | 단맛 깊이 | honey, caramel, brown sugar, molasses |
| finish_complexity_score → **aftertaste_resonance** | 여운 공명 | lingering, resonant, persistent |

### 4-5. 전통 증류주 (`spirits`)

| fruity_score → **spirit_purity** | 증류 순도 | clean, pure, neutral, refined |
|---|---|---|
| floral_mineral_score → **fruity_ester_profile** | 과실향 에스테르 | fruity, apple, pear, ester, floral |
| yeasty_autolytic_score → **grain_sweetness_depth** | 곡물 단맛 깊이 | rice, grain, malt, sweet, nurungji |
| acidity_freshness_score → **fusel_integration** | 퓨젤 통합도 | smooth, integrated, no burn |
| body_texture_score → **aromatic_complexity** | 향미 복합성 | complex, layered, nuanced |
| finish_complexity_score → **finish_warming_smoothness** | 여운 따뜻함 | warm finish, lingering warmth |

### 4-6. 청주·약주·막걸리 (`korean_yakju`, `막걸리`, `약주`, `전통주`)

| fruity_score → **clarity_serenity** | 청명도 | clear, pristine, serene, transparent |
|---|---|---|
| floral_mineral_score → **rice_aroma_complexity** | 쌀향 복합미 | rice, nurungji, floral, grain, sake-like |
| yeasty_autolytic_score → **lactic_acid_finesse** | 유산미 섬세함 | lactic, creamy, yogurt, milky |
| acidity_freshness_score → **sweetness_elegance** | 단맛 우아함 | elegant sweet, delicate, refined |
| body_texture_score → **umami_integration** | 감칠맛 통합 | umami, savory, amino, kokumi |
| finish_complexity_score → **finish_silkiness** | 여운 비단결 | silky, velvety, smooth finish |

### 4-7. 생차 / 보이차 (`puerh_sheng`) — DB: `puer`, `puerh_sheng`

| fruity_score → **floral_fruity_brightness** | 꽃향·과실향 밝기 | floral, fruity, apricot, orchid, bright |
|---|---|---|
| floral_mineral_score → **astringency_structure** | 수렴성 구조 | astringent, tannin, gripping, drying |
| yeasty_autolytic_score → **sweetness_complexity** | 단맛 복잡성 | honey, floral honey, orchid sweet |
| acidity_freshness_score → **mineral_terroir** | 미네랄·떼루아르 | mineral, stone, camphor, forest, earthy |
| body_texture_score → **cha_qi_vitality** | 차기 활력 | energizing, warming, qi, vitality |
| finish_complexity_score → **hui_gan_tempo** | 회감 속도·강도 | hui gan, sweet return, lingering sweet |

---

## 5. 스크립트 동작 방식

```
nlp_extract_ollama.mjs
├── Supabase에서 fruity_score IS NULL + review_text 있는 레코드 로드
├── product_category 값으로 카테고리 자동 감지
├── 카테고리별 전용 프롬프트로 Ollama에 5건씩 배치 요청
│   └── 응답: {"umami_depth":75,"aroma_complexity":60,...} (카테고리별 키 이름)
├── 카테고리별 키 → DB 컬럼 자동 매핑
│   └── umami_depth → fruity_score (간장의 경우)
├── Ollama 실패 시 카테고리별 키워드로 자동 폴백
└── Supabase wine_terrestrial_data 업데이트
    ├── fruity_score         (카테고리별 의미 다름)
    ├── floral_mineral_score
    ├── yeasty_autolytic_score
    ├── acidity_freshness_score
    ├── body_texture_score
    └── finish_complexity_score
```

---

## 6. 성능 예상 (RTX 3090 24GB / 32GB RAM)

| 모델 | VRAM 사용 | 배치당 속도(5건) | 112K 전체 예상 |
|------|-----------|----------------|--------------|
| `qwen2.5:32b` | ~22GB | ~15~20초 | ~75~100시간 |
| `qwen2.5:14b` | ~12GB | ~6~8초 | ~37~50시간 |
| `gemma2:9b`   | ~8GB  | ~4~6초 | ~25~37시간 |
| `llama3.1:8b` | ~8GB  | ~4~5초 | ~25~31시간 |

> **팁**: BATCH_SIZE를 5→10으로 늘리면 처리 속도 약 30~40% 향상 가능
> 스크립트 상단 `const BATCH_SIZE = 5;` 값 수정

---

## 7. Claude Code에 붙여넣을 요청 프롬프트

아래 내용을 그대로 다른 컴퓨터의 Claude Code에 붙여넣으세요:

---

```
안녕, 나는 UAPS (Undersea Aging Predictive System) 프로젝트를 진행 중이야.

이 컴퓨터에서 Ollama 로컬 LLM을 사용해 Supabase DB의 음료 리뷰 텍스트에서
카테고리별 6축 풍미 점수를 추출해야 해.

## 작업 내용
- Supabase `wine_terrestrial_data` 테이블에 ~112,000건 데이터가 있음
- `review_text`는 있지만 `fruity_score`가 NULL인 레코드가 대부분
- 카테고리(champagne, sake, whisky, soy_sauce, vinegar, coldbrew, spirits, korean_yakju, puer 등)별로
  6축의 의미가 다르고, 전용 프롬프트로 점수를 추출
- Ollama 로컬 LLM으로 추출 후 DB에 업데이트

## 실행 파일
`data/scripts/nlp_extract_ollama.mjs` 파일이 이미 준비되어 있음

## 요청 순서
1. `ollama serve` 실행 중인지 확인하고 사용 가능한 모델 목록 알려줘
2. 테스트: 100건만 먼저 실행
   ```
   node data/scripts/nlp_extract_ollama.mjs --limit 100 --model [모델명]
   ```
3. 정상 확인 후 전체 실행
   ```
   node data/scripts/nlp_extract_ollama.mjs --model [모델명]
   ```
4. 카테고리별로 나눠서 실행도 가능:
   ```
   node data/scripts/nlp_extract_ollama.mjs --model [모델명] --category sake
   node data/scripts/nlp_extract_ollama.mjs --model [모델명] --category soy_sauce
   ```
5. 진행 상황 주기적으로 체크해줘 (건수, 카테고리별 분포, 예상 완료 시간)
6. 완료 후 DB 현황 알려줘 (전체/NULL/완료율)

## Supabase 연결 정보
- URL: https://gbhrvgvsrjhdxtaaztcx.supabase.co
- Anon Key: 스크립트 내부에 하드코딩됨

## 주의사항
- RTX 3090 24GB 기준 qwen2.5:32b 권장 (최고 품질)
- Ollama 응답이 JSON 형식이 아닐 경우 키워드 방식으로 자동 폴백됨 (정상)
- 배치 크기 기본값 5 → 스크립트 상단 BATCH_SIZE 값 조정 가능
- 중간에 끊겨도 이미 업데이트된 건은 자동 스킵됨 (fruity_score IS NULL 조건)

한국어로 답변해줘.
```

---

## 8. 중단 및 재시작

- 언제든 `Ctrl+C`로 중단 가능
- 재시작하면 `fruity_score IS NOT NULL`인 건은 자동 스킵
- 카테고리별로 분리 실행 가능 (`--category` 옵션)

---

## 9. 완료 확인 방법

Claude Code에게:
```
Supabase에서 fruity_score가 NULL인 레코드 수와 전체 레코드 수를 카테고리별로 조회해서 알려줘.
```

또는 직접 스크립트 실행 시 완료 후 자동 출력:
```
📊 DB 현황
   전체: 112316건
   NULL 남은 건수: 0건
   완료율: 100.0%
```

---

## 10. 완료 후 다음 단계

NLP 추출 완료 후 원래 Mac에서:

```bash
# Layer 1 모델 재학습 (37K → 112K 데이터 기준)
node data/scripts/retrain_model.mjs
```

또는 Claude Code에게:
```
Layer 1 모델 재학습 해줘. 스크립트: data/scripts/retrain_model.mjs
```
