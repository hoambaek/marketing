# UAPS v5.0 핵심 3건 구현 플랜

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** UAPS 예측 정확도를 실질적으로 개선하기 위한 핵심 3건 구현 — 인양 시뮬레이션 파이프라인 + XGBoost ML 전환 + Gemini 프롬프트 최적화

**Architecture:** (1) 인양 데이터 입력 UI + 베이지안 업데이트 시뮬레이션으로 모델 검증 기반 마련, (2) Layer 1을 클러스터 평균에서 XGBoost로 전환하여 비선형 패턴 학습, (3) Gemini 프롬프트에 Chain-of-Thought + Few-shot을 적용하여 일관성과 정확도 향상

**Tech Stack:** Next.js 16, TypeScript, Python (XGBoost + ONNX), Supabase, Gemini 3 Flash

---

## Task 1: 인양 데이터 시뮬레이션 파이프라인

### 1-1: DB 스키마 — 인양 실측 데이터 테이블

**SQL (Supabase Dashboard에서 실행):**
```sql
CREATE TABLE IF NOT EXISTS retrieval_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES aging_products(id) ON DELETE CASCADE,
  retrieval_date DATE NOT NULL,
  actual_duration_months INTEGER NOT NULL,
  -- 실측 풍미 6축 (블라인드 시음)
  actual_fruity NUMERIC,
  actual_floral_mineral NUMERIC,
  actual_yeasty_autolytic NUMERIC,
  actual_acidity_freshness NUMERIC,
  actual_body_texture NUMERIC,
  actual_finish_complexity NUMERIC,
  -- 실측 품질 점수
  actual_overall_quality NUMERIC,
  -- 시음 메타데이터
  tasting_panel_size INTEGER DEFAULT 1,
  tasting_notes TEXT,
  is_simulated BOOLEAN DEFAULT false,
  -- 예측 vs 실측 비교
  prediction_id UUID REFERENCES aging_predictions(id),
  -- 메타
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1-2: TypeScript 타입 + DB CRUD

**Files:**
- Modify: `src/lib/types/uaps.ts` — `RetrievalResult` 인터페이스 추가
- Modify: `src/lib/supabase/database/uaps.ts` — CRUD 함수 추가

**RetrievalResult 타입:**
```typescript
export interface RetrievalResult {
  id: string;
  productId: string;
  retrievalDate: string;
  actualDurationMonths: number;
  actualFruity: number | null;
  actualFloralMineral: number | null;
  actualYeastyAutolytic: number | null;
  actualAcidityFreshness: number | null;
  actualBodyTexture: number | null;
  actualFinishComplexity: number | null;
  actualOverallQuality: number | null;
  tastingPanelSize: number;
  tastingNotes: string | null;
  isSimulated: boolean;
  predictionId: string | null;
  createdAt: string;
}
```

**CRUD 함수:**
- `createRetrievalResult(input)` — 인양 결과 저장
- `fetchRetrievalResults(productId?)` — 조회
- `fetchRetrievalResultsWithPredictions(productId)` — 예측과 조인하여 비교 데이터 반환

### 1-3: 가상 인양 데이터 생성기

**Files:**
- Create: `src/lib/utils/uaps-simulation.ts`

제품의 현재 예측값에 **노이즈를 추가**하여 가상 인양 데이터 생성:
```typescript
export function generateSimulatedRetrieval(
  prediction: AgingPrediction,
  noiseLevel: number = 0.1 // 10% 랜덤 편차
): Omit<RetrievalResult, 'id' | 'createdAt'>
```

노이즈 모델:
- 각 6축 점수에 정규분포 노이즈 N(0, score × noiseLevel) 추가
- 종합 품질도 동일하게 노이즈 적용
- `isSimulated = true`로 마킹

### 1-4: 베이지안 업데이트 엔진

**Files:**
- Create: `src/lib/utils/uaps-bayesian.ts`

**핵심 함수:**
```typescript
// TCI 사후분포 업데이트 (Conjugate Normal-Normal)
export function updateTCIPosterior(
  prior: { mean: number; variance: number },  // 현재 TCI 추정
  observed: RetrievalResult[],                  // 인양 데이터
  predictions: AgingPrediction[]                // 해당 예측값
): { mean: number; variance: number; n: number; convergenceRate: number }

// 모든 계수 동시 업데이트
export function updateAllCoefficients(
  retrievals: RetrievalResult[],
  predictions: AgingPrediction[]
): {
  tci: { prior: number; posterior: number; ci95: [number, number] };
  fri: { prior: number; posterior: number; ci95: [number, number] };
  bri: { prior: number; posterior: number; ci95: [number, number] };
  overallError: number; // RMSE
}
```

**베이지안 업데이트 로직:**
- Prior: 현재 config 값 (TCI=0.40, FRI=0.56, BRI=0.72)
- Likelihood: 예측 vs 실측 오차의 정규분포
- Posterior: Conjugate 업데이트 (해석적, MCMC 불필요)
- N<10에서도 정보적 사전분포로 유의미한 업데이트 보장

### 1-5: 인양 데이터 입력 UI + 시뮬레이션 버튼

**Files:**
- Modify: `src/app/uaps/page.tsx` — 인양 결과 입력 모달 + 시뮬레이션 버튼
- Modify: `src/lib/store/uaps-store.ts` — 인양 관련 상태/액션 추가

**UI 요소:**
- 제품 선택 후 "인양 결과 입력" 버튼 (실제 데이터용)
- "시뮬레이션 실행" 버튼 → 가상 데이터 생성 + 베이지안 업데이트 + 결과 표시
- 시뮬레이션 결과 카드: TCI/FRI/BRI 사전→사후 변화, 95% CI 축소율, 수렴 그래프

### 1-6: 예측 vs 실측 비교 차트

**Files:**
- Modify: `src/app/uaps/page.tsx` 또는 `src/app/uaps/components/` — 비교 차트 컴포넌트

6축 레이더 차트에 예측(점선) vs 실측(실선) 오버레이:
- 각 축별 오차 표시 (RMSE, MAE)
- 종합 정확도 점수

---

## Task 2: XGBoost ML 전환 (Layer 1)

### 2-1: Python XGBoost 학습 스크립트

**Files:**
- Create: `data/scripts/train_xgboost.py`

**학습 데이터 준비:**
```python
# Supabase에서 wine_terrestrial_data 112K건 로드
# 입력 피처: product_category, aging_stage, pH, dosage, alcohol,
#           reduction_potential, closure_type, vintage_age
# 타겟: fruity_score, floral_mineral_score, ... (6축)

# 카테고리 인코딩: product_category → LabelEncoder
# 결측치 처리: median imputation
# 가중치: 1/카테고리 빈도 (불균형 해소)
```

**모델 학습:**
```python
import xgboost as xgb
from sklearn.model_selection import cross_val_score

# 6축 각각에 대해 독립 모델 학습
for axis in ['fruity', 'floral_mineral', 'yeasty_autolytic',
             'acidity_freshness', 'body_texture', 'finish_complexity']:
    model = xgb.XGBRegressor(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        sample_weight=weights  # 카테고리 불균형 가중치
    )
    model.fit(X_train, y_train[axis])

    # 5-fold 교차 검증
    cv_scores = cross_val_score(model, X, y[axis], cv=5, scoring='neg_rmse')

    # ONNX로 변환 (TypeScript 서버에서 실행용)
    # 또는 JSON 트리 구조로 export
```

**산출물:**
- `data/models/xgboost_*.json` — 각 축별 모델 (6개)
- `data/models/model_metadata.json` — 피처 목록, 인코딩 맵, CV 점수

### 2-2: TypeScript XGBoost 추론 모듈

**Files:**
- Create: `src/lib/utils/uaps-ml-predictor.ts`

**접근 방식:** Python ONNX 대신 **JSON 트리 직접 추론** (의존성 최소화)

```typescript
// XGBoost JSON 트리 로드 + 추론
export function predictWithXGBoost(
  features: {
    productCategory: string;
    agingStage: number;
    pH: number | null;
    dosage: number | null;
    alcohol: number | null;
    reductionPotential: string;
    closureType: string;
  }
): { fruity: number; floralMineral: number; yeastyAutolytic: number;
     acidityFreshness: number; bodyTexture: number; finishComplexity: number;
     confidence: number; featureImportance: Record<string, number> }
```

또는 **API 분리** 방식:
- Python FastAPI 서버 (별도 프로세스) → Next.js에서 HTTP 호출
- 더 유연하지만 인프라 복잡도 증가

**추천:** Phase 1에서는 JSON 트리 직접 추론 (심플), 데이터 많아지면 API 분리

### 2-3: Layer 1 엔진 교체

**Files:**
- Modify: `src/lib/utils/uaps-engine.ts` — `predictFlavorProfileStatistical()` → ML 예측 폴백 추가
- Modify: `src/app/api/uaps/predict/route.ts` — ML 예측 결과를 Gemini에 전달

```typescript
// 기존: 클러스터 평균 기반
const statResult = predictFlavorProfileStatistical(clusters, months, config, product);

// 변경: ML 우선, 클러스터 폴백
const mlResult = predictWithXGBoost(productFeatures);
const statResult = predictFlavorProfileStatistical(clusters, months, config, product);
const layer1Result = mlResult ? blendResults(mlResult, statResult, 0.7) : statResult;
// ML 70% + 통계 30% 블렌딩 (ML 가용 시)
```

### 2-4: Gemini 프롬프트에 ML 결과 주입

**Files:**
- Modify: `src/lib/utils/uaps-ai-predictor.ts` — `buildPredictionPrompt()`에 ML 예측 + 피처 중요도 섹션 추가

```
## ML 모델 예측 (XGBoost, 112K건 학습)
- 과실향: 65 ± 8 (피처 중요도: aging_stage 42%, dosage 23%, pH 18%)
- 효모향: 72 ± 5 (피처 중요도: aging_stage 55%, reduction 20%)
...
→ 이 ML 예측을 참고하되, 전문가 지식으로 보정하세요.
```

---

## Task 3: Gemini 프롬프트 최적화

### 3-1: 프롬프트 템플릿 구조화

**Files:**
- Modify: `src/lib/utils/uaps-ai-predictor.ts`

현재 프롬프트를 **섹션 템플릿 + 변수** 구조로 분리:

```typescript
const PROMPT_TEMPLATES = {
  systemRole: '당신은 {expertRole}이며, 해저 숙성 과학의 전문가입니다.',
  chainOfThought: `
분석 절차를 단계적으로 따르세요:
1. 제품 특성 분석: 카테고리, 서브타입, pH, dosage, closure 기반으로 기본 풍미 프로파일 파악
2. 지상 숙성 기준점: Layer 1 통계/ML 결과를 앵커로 활용
3. 해저 환경 적용: 월별 수온(FRI), 수압(BRI), 조류(K-TCI) 보정
4. 시간 경과 예측: 3단계 비선형 향 감쇠 + 질감 시그모이드 성장 고려
5. 최종 판단: 6축 점수, 품질, 인양 윈도우 종합
`,
  fewShotExamples: [
    // 잘 예측된 기존 결과 2~3개를 템플릿화
  ],
};
```

### 3-2: Chain-of-Thought 강제

프롬프트 끝에 추가:
```
## 분석 절차 (반드시 이 순서를 따르세요)
Step 1: 이 제품의 현재 풍미 특성을 분석하세요 (투하 전 상태)
Step 2: {underseaMonths}개월간 해저 숙성 시 각 보정 계수의 영향을 계산하세요
Step 3: 월별 해양 프로파일에서 계절별 숙성 속도 차이를 고려하세요
Step 4: 최종 6축 풍미 점수와 종합 품질을 도출하세요
Step 5: 최적 인양 윈도우를 결정하고 근거를 설명하세요

JSON 응답 전에 간단한 분석 과정을 "reasoning" 필드에 기술하세요.
```

### 3-3: Few-shot 예시 추가

DB에서 **가장 신뢰도 높은 기존 예측 결과 2~3건**을 프롬프트에 포함:
```
## 참고: 유사 제품 예측 사례
### 사례 1: Dom Pérignon 2015 (Vintage, 30m, 12개월)
입력: pH 3.10, dosage 4g/L, cork_natural, 해저수온 8~16°C
결과: fruity=62, yeastyAutolytic=85, overallQuality=94
분석: 빈티지 특유의 높은 효모향 기반, 해저 저온으로 산화 억제...
```

### 3-4: 응답에 "reasoning" 필드 추가

JSON 응답 구조에 추가:
```json
{
  "reasoning": "Step 1: Krug NV는 7년 앙금 접촉으로 이미 높은 효모향...",
  "flavorProfile": { ... },
  "agingFactors": { ... }
}
```

`reasoning` 필드는 DB에 저장하여 예측 근거 추적 + 향후 프롬프트 개선에 활용.

---

## 구현 순서

```
Task 3 (프롬프트 최적화) ← 가장 빠르고 리스크 적음
  → 3-1: 템플릿 구조화
  → 3-2: Chain-of-Thought
  → 3-3: Few-shot
  → 3-4: reasoning 필드

Task 1 (인양 시뮬레이션) ← 프롬프트와 독립
  → 1-1: DB 스키마
  → 1-2: 타입 + CRUD
  → 1-3: 가상 데이터 생성기
  → 1-4: 베이지안 엔진
  → 1-5: UI
  → 1-6: 비교 차트

Task 2 (XGBoost) ← 가장 규모 큼, 마지막
  → 2-1: Python 학습
  → 2-2: TS 추론 모듈
  → 2-3: Layer 1 교체
  → 2-4: Gemini에 ML 주입
```

## 주의사항

- Task 2의 Python 의존성: `pip install xgboost scikit-learn pandas`
- XGBoost JSON 트리 추론은 순수 TypeScript로 구현 (npm 패키지 불필요)
- 베이지안 업데이트는 Conjugate Normal-Normal (MCMC 불필요, 순수 수학)
- Few-shot 예시는 DB에서 자동 추출하여 프롬프트에 동적 포함
- 모든 변경은 기존 API/UI와 하위 호환 유지
