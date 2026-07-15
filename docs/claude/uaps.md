# UAPS (Undersea Aging Predictive System)

해저 숙성 풍미 예측 시스템. 2-Layer Hybrid AI + XGBoost ML.

## 핵심 파일
| 파일 | 역할 |
|------|------|
| `uaps-engine.ts` | Layer 1 통계 엔진 (타임라인·골든윈도우·깊이 시뮬레이션) |
| `uaps-ai-predictor.ts` | Layer 2 Gemini AI (CoT+Few-shot, 카테고리별 축 가이드 주입) |
| `uaps-ml-predictor.ts` | XGBoost ML 추론 |
| `uaps-ocean-profile.ts` | 월별 해양 프로파일 |
| `uaps-bayesian.ts` | 베이지안 업데이트 엔진 |
| `uaps-store.ts` | Zustand 상태 관리 |
| `types/uaps.ts` | 타입 + 상수 (**6축 라벨·정의 SSOT**) |

## 카테고리 (11) — DB 식별자 기준
`champagne`(40K) / `red_wine`(23K) / `white_wine`(14K) / `green_coffee_bean`(생두, 구 coldbrew, 9.9K) / `sake`(9K) / `yakju_cheongju`(전통주 약주·청주, 3.6K) / `spirits`(증류주 소주) / `puer`(3K) / `soy_sauce`(1.3K) / `vinegar`(700) / `whisky`(400)
- 2026-07: `spirits` 하나였던 전통주를 **발효주(yakju_cheongju) / 증류주(spirits)로 분리**. 학습데이터·제품·예측은 yakju_cheongju로 이관됨.
- slug 매핑: yakju→yakju_cheongju, soju→spirits, green-bean→green_coffee_bean, puerh→puer

## 풍미 6축 — 카테고리별 (2026-07 전면 개편)
- DB 컬럼 슬롯 6개는 **모든 카테고리 공통·고정**: `fruity_score` ~ `finish_complexity_score`
- 슬롯의 **의미(라벨·정의)는 카테고리별**: `CATEGORY_FLAVOR_LABELS` + `CATEGORY_FLAVOR_DEFINITIONS` (`types/uaps.ts`) → `getFlavorAxes(category)`로 소비
- **전 축 양성**(높을수록 좋음) — `CATEGORY_NEGATIVE_AXIS`는 비어 있음 (결점도→클린컵, 타격감→순도로 반전 완료)
- DB `category_flavor_axes`(9카테고리×6축)는 동기 사본 — 코드 수정 시 함께 갱신
- 예: 전통주=아로마·단맛·산미·감칠맛·바디감·여운 / 증류주=곡물향·숙성향·순도·단맛·목넘김·여운 / 위스키=몰트·과일꽃·피트·오크·바디·피니시
- 시음 폼(`/tasting/[id]`)·레이더는 라벨+**하단 정의 설명** 자동 표시

## 예측 파이프라인
1. 지상 데이터 112K건 → `wine_terrestrial_data` (NLP 6축 추출 완료)
2. Layer 1: product_category × aging_stage 클러스터링 + XGBoost ML
3. Layer 2: Gemini AI (CoT 5단계 + Few-shot + 카테고리별 6축 의미 주입 + reasoning)
4. 비교 시음 보정 (지상 시음 70% + AI 30% → beforeProfile)
5. 해저 보정: TCI(질감) · FRI(향) · BRI(기포) · K-TCI(조류) · TSI(안정성)
6. 타임라인 1~36개월 + 골든 윈도우 + 품질 점수

## 보정 계수 (AgingFactors — AI가 제품별 추론)
- `baseAgingYears` / `textureMult` / `aromaDecay` / `riskMult` / `kineticFactor`
- **`timeScale`(0.3~5.0, 기본 1.0)**: 시간축 압축 배수. 엔진이 성숙 계산에 `effM = m × timeScale` 적용 (차트 x축·계절 주기는 실제 월 유지). 와인=1.0, 전통주≈3~4, 보이차<1. **비와인의 "피크 21개월 vs AI 추천 3~6개월" 모순의 해결책** — 기존 예측에 없으면 1.0 폴백이므로 재예측 필요.
- 물리 곡선 기본 시간축은 와인 기준(텍스처 시그모이드 중심 4.5년, 리스크 변곡 18개월)임을 유의.

## 외부 시음 파이프라인 (전 카테고리 지원)
1. 제품 예측 후 **시음 기록 링크** 버튼(메인+카테고리 페이지) → `/tasting/{predictionId}` 공개 링크 복사
2. 외부 기록자: 로그인 없이 대조군(지상)+해저 6축 입력 → `tasting_submissions` (pending)
3. **제출 검토**(`/uaps/tasting-review`)에서 승인 → `retrieval_results` 복사 → 예측 보정에 사용
- 폼·검토 화면 모두 제출별 카테고리 축 라벨·정의로 표시됨
- **카테고리 귀속은 제품 경유 간접 연결**: retrieval_results에 카테고리 컬럼 없음. product_id → aging_products.product_category로 귀속. 승인해도 즉시 통계 반영이 아니라 **해당 제품의 다음 예측 실행 시** 반영(시음 70% 블렌딩 + 베이지안 계수 업데이트)
- **제품 연결 검증 (2026-07-09)**: `tasting_submissions.product_id`는 FK 없음('unknown' 폴백 존재) → 검토 목록이 aging_products 실존 여부를 확인해 `productName`/`productLinked` 반환. 미연결 제출은 경고 배지 표시, 승인 시 카테고리→제품 선택 모달로 재지정 후 승인(서버에서 제품 실존 재검증, 제출 행 product_id도 갱신)

## 해양 데이터 (KHOA + Open-Meteo)
- 관측소: 완도 DT_0027(염분·조위) + 완도항 부이 TW_0078(유속) + 조류예보 20LTC03
- 일일 크론(`/api/cron/ocean-data`)이 KHOA 실측(염분·조위·조류)까지 저장 (2026-07 연결)
- KHOA reqDate는 `yyyyMMdd` (하이픈 불가), `current_direction_dominant`는 integer(round 필요)
- 백필 완료: 염분·조위·조류 501/501 커버리지
- 깊이: 투하 수심 20/30/40m, 최적 깊이 시뮬레이션은 40m 초과 페널티 (`-0.6/m`)

## 알려진 특성/주의
- `/uaps`(샴페인 메인)와 `/uaps/[category]`는 별도 컴포넌트 — 로직 수정 시 양쪽 확인
- `terrestrial_model`의 전이곡선(transitionCurves)은 저장만 되고 타임라인 엔진이 읽지 않음 (미배선)
- 전통주 학습데이터는 96% youthful 편중 — 시간축 전이 학습 불가, timeScale로 대응
- 모델 재학습: UAPS 화면의 "모델 재학습" 또는 POST `/api/uaps/model/train` (Clerk 인증)
