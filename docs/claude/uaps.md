# UAPS (Undersea Aging Predictive System)

해저 숙성 풍미 예측 시스템. 2-Layer Hybrid AI + XGBoost ML.

## 핵심 파일
| 파일 | 역할 |
|------|------|
| `uaps-engine.ts` | Layer 1 통계 엔진 v4.0 |
| `uaps-ai-predictor.ts` | Layer 2 Gemini AI (v5.0 CoT+Few-shot) |
| `uaps-ml-predictor.ts` | XGBoost ML 추론 |
| `uaps-ocean-profile.ts` | 월별 해양 프로파일 |
| `uaps-live-coefficients.ts` | 실시간 보정계수 |
| `uaps-bayesian.ts` | 베이지안 업데이트 엔진 |
| `uaps-simulation.ts` | 가상 데이터 생성 |
| `uaps-store.ts` | Zustand 상태 관리 |
| `database/uaps.ts` | DB CRUD |
| `types/uaps.ts` | 타입 + 상수 |

## 풍미 6축 (WSET/OIV)
| DB 컬럼 | TS 키 | 라벨 |
|---------|-------|------|
| `fruity_score` | `fruity` | 과실향 |
| `floral_mineral_score` | `floralMineral` | 플로럴·미네랄 |
| `yeasty_autolytic_score` | `yeastyAutolytic` | 효모·숙성향 |
| `acidity_freshness_score` | `acidityFreshness` | 산도·상쾌함 |
| `body_texture_score` | `bodyTexture` | 바디감·질감 |
| `finish_complexity_score` | `finishComplexity` | 여운·복합미 |

## 예측 파이프라인
1. 지상 데이터 112K건 → `wine_terrestrial_data`
2. NLP 6축 추출 (Ollama 로컬 LLM)
3. Layer 1: product_category × aging_stage 클러스터링 + XGBoost ML
4. Layer 2: Gemini AI (CoT 5단계 + Few-shot + reasoning)
5. 비교 시음 데이터 보정 (시음 70% + AI 30%)
6. 해저 보정: TCI(질감) · FRI(향) · BRI(기포) · K-TCI(조류) · TSI(안정성)
7. 타임라인 1~36개월 + 골든 윈도우 + 품질 점수

## 10개 카테고리
`champagne`(40K) / `red_wine`(23K) / `white_wine`(14K) / `coldbrew`(10K) / `sake`(9K) / `spirits`(3K) / `puer`(3K) / `soy_sauce`(1K) / `vinegar`(700) / `whisky`(400)

## 보정 계수
- **TCI**: 기본 0.3, 가설적 추정
- **FRI**: 아레니우스 방정식, 월별 수온 기반 동적 (0.3~0.8)
- **BRI**: 헨리의 법칙, 수온+수압 기반
- **K-TCI**: 조류 유속, 제곱근 스케일, kf 0.6~1.8
- **TSI**: 표준편차 + 수심 보정

## v5.0 변경 (2026-03-17)
- **프롬프트 최적화**: Chain-of-Thought 5단계 강제 + Few-shot 카테고리별 예시 + reasoning 필드
- **카테고리별 전문가 역할**: `EXPERT_ROLES` 10개 (WSET Diploma, Master of Wine 등)
- **XGBoost ML**: 103K건 학습, 6축 독립 모델, JSON 트리 직접 추론 (npm 의존성 없음)
- **비교 시음**: 지상 보관(대조군) + 해저 숙성 탭 UI, DB에 함께 저장
- **시음 → 예측 보정**: 지상 시음 70% + AI 전문가 30% 블렌딩 → beforeProfile로 사용
- **베이지안 업데이트**: Conjugate Normal-Normal, TCI/FRI/BRI 사후분포 업데이트
- **DB 추가**: `aging_predictions.ai_reasoning_text`, `retrieval_results` 테이블 (지상+해저 시음)

## KHOA 해양 데이터
- 관측소: 완도 DT_0027 + 완도항 TW_0078
- 14개월 백필 완료 (2025-01 ~ 2026-03)
- 40m 깊이 보정: blending ratio 모델
