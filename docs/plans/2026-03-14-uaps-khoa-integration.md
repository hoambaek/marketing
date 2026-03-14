# UAPS-KHOA 실측 데이터 통합 구현 플랜

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** UAPS 예측 엔진이 ocean_data_daily의 14개월치 KHOA 실측 데이터를 활용하여 계절 적응형 타임라인, 동적 FRI/BRI, K-TCI 실측 연결, TSI 통합, 최적 투입 월 추천을 구현한다.

**Architecture:** 새로운 `MonthlyOceanProfile` 레이어를 도입하여 ocean_data_daily에서 월별 통계를 집계한 후, 기존 엔진 함수들이 월별 프로파일을 파라미터로 받아 동적 계산하도록 확장한다.

**Tech Stack:** Next.js 16, TypeScript, Zustand, Supabase, KHOA API, Recharts

---

## 현재 상태 분석

### 이미 연결된 부분
1. `uaps-store.ts`: `runPrediction`에서 `ocean-data-store`의 `historicalOceanStats` 또는 `currentConditions`를 읽어 API로 전달
2. `predict/route.ts`: `oceanConditions`를 받아 `runAIPrediction`에 전달
3. `uaps-ai-predictor.ts`: AI 프롬프트에 해양 환경 데이터 섹션으로 주입 (텍스트 기반)
4. `OceanCardsV3.tsx`: 실시간 해양 현황 카드 (표시용)

### 끊어진 부분 (핵심 GAP)
1. **`generateTimelineData()`**: 36개월 타임라인에서 FRI/BRI를 **고정 계수**로 사용. 월별 계절 변동 미반영
2. **`calculateArrheniusFRI()`**: 기본 4°C 고정. ocean_data_daily 월별 수온 프로파일 미사용
3. **`calculateHenryBRI()`**: 기본 4°C 고정. 월별 수온 미사용
4. **`deriveKineticFactorFromOcean()`**: 함수 존재하지만 엔진 내부에서 실제 호출되지 않음 (죽은 코드)
5. **TSI**: `uaps-live-coefficients.ts`에 존재하지만 예측 엔진에 미통합
6. **최적 투입 월 추천**: 기능 없음

---

### Task 1: 월별 해양 프로파일 집계 함수

**Files:**
- Create: `src/lib/utils/uaps-ocean-profile.ts`
- Modify: `src/lib/types/uaps.ts`

**변경 내용:**

1. `MonthlyOceanProfile` 인터페이스:
   - month (1~12), seaTemperatureAvg/Min/Max/StdDev, salinityAvg, tidalCurrentSpeedAvg, tideLevelRange, dataPoints

2. `buildMonthlyOceanProfiles(dailyData: OceanDataDaily[])`:
   - ocean_data_daily 배열을 월별 그룹핑 → 각 월 평균/최소/최대/표준편차
   - 14개월 데이터에서 같은 월 2회 나올 수 있음 → 전체 평균
   - 데이터 없는 월은 인접 월 보간

3. `AnnualOceanProfile` 인터페이스:
   - monthlyProfiles[], annualAvgTemp, annualTempRange, annualAvgCurrentSpeed, tsiScore

4. `buildAnnualOceanProfile(monthlyProfiles, depth)`:
   - 12개월 프로파일 집계, TSI 계산

---

### Task 2: 계절 적응형 타임라인 — generateTimelineData() 확장

**Files:**
- Modify: `src/lib/utils/uaps-engine.ts`

**변경 내용:**

1. `generateTimelineData()`에 `monthlyOceanProfiles?`, `immersionMonth?` 옵셔널 파라미터 추가

2. 새 로직: 숙성 n개월차의 달력 월 산출 → 해당 월 MonthlyOceanProfile에서 수온 추출 → 월별 FRI/BRI 동적 계산
   - `calendarMonth = ((immersionMonth - 1 + n) % 12) + 1`
   - `calculateArrheniusFRI(monthlyTemp, ...)` 호출
   - `calculateHenryBRI(depth, monthlyTemp)` 호출

3. 프로파일 없으면 기존 고정값 폴백 (하위 호환)

---

### Task 3: K-TCI 실측 연결 — deriveKineticFactorFromOcean() 활성화

**Files:**
- Modify: `src/lib/utils/uaps-engine.ts`

**변경 내용:**

1. `generateTimelineData()` 내부에서 월별 프로파일의 `tidalCurrentSpeedAvg`로 `deriveKineticFactorFromOcean()` 호출
2. 단위 통일: ocean_data_daily의 `tidalCurrentSpeed`는 cm/s → m/s 변환하여 전달
3. `calculateOptimalHarvestWindow()`에도 월별 프로파일 전달

---

### Task 4: TSI(온도 안정성 지수) 예측 통합

**Files:**
- Modify: `src/lib/utils/uaps-engine.ts`
- Modify: `src/lib/utils/uaps-ocean-profile.ts`

**변경 내용:**

1. TSI를 `calculateCompositeQuality()` 보너스로 반영:
   - TSI >= 0.7: +3점
   - TSI >= 0.4: +0점
   - TSI < 0.4: -3점

2. `generateTimelineData()`에서 월별 TSI 계산

---

### Task 5: 최적 투입 월 추천 기능

**Files:**
- Modify: `src/lib/utils/uaps-engine.ts`
- Modify: `src/lib/types/uaps.ts`

**변경 내용:**

1. `OptimalImmersionResult` 타입: bestMonth, peakScore, peakMonth, monthlyScores[], recommendation

2. `simulateOptimalImmersionMonth()` 함수:
   - 12개 투입 월 각각에 대해 `generateTimelineData()` 실행
   - 최고 peakScore 투입 월 = 최적
   - 추천 문구 생성

---

### Task 6: API 라우트 확장

**Files:**
- Modify: `src/app/api/uaps/predict/route.ts`
- Modify: `src/lib/supabase/database/ocean-data.ts`

**변경 내용:**

1. predict API에서 ocean_data_daily 전체 로드 → `buildMonthlyOceanProfiles()` → 엔진에 전달
2. `fetchOceanDataDailyAll()` 추가 (전체 기간 로드, 배치)
3. 예측 결과에 `oceanProfileUsed`, `immersionMonth` 필드 추가

---

### Task 7: UAPS 대시보드 UI 강화

**Files:**
- Modify: `src/app/uaps/components/OceanCardsV3.tsx`
- Modify: `src/app/uaps/page.tsx`

**변경 내용:**

1. OceanConditionsCard에 data_source 뱃지 + TSI 표시
2. 새 카드: MonthlyProfileCard (12개월 수온 미니 차트)
3. 새 카드: OptimalImmersionCard (투입 월 시뮬레이션 결과)
4. EnvironmentalImpactCard에 TSI 추가 (4개 보정계수)

---

### Task 8: ocean-data-store 확장

**Files:**
- Modify: `src/lib/store/ocean-data-store.ts`

**변경 내용:**

1. `monthlyOceanProfiles: MonthlyOceanProfile[] | null` 상태 추가
2. `loadHistoricalOceanStats()`에서 `buildMonthlyOceanProfiles()` 호출

---

## 구현 순서

```
Task 1 (타입 + 프로파일 함수) — 기반
  ├── Task 8 (store 확장) ← Task 1
  ├── Task 2 (계절 타임라인) ← Task 1
  ├── Task 3 (K-TCI 연결) ← Task 1
  └── Task 4 (TSI 통합) ← Task 1
      └── Task 5 (최적 투입 월) ← Task 2, 3, 4
          └── Task 6 (API 확장) ← Task 5
              └── Task 7 (UI) ← Task 6, 8
```

**추천:** Task 1 → Task 8 → Task 2+3+4 (병렬) → Task 5 → Task 6 → Task 7

## 주의사항

- ocean_data_daily 14개월 (~420행): 서버사이드 전체 로드 가능, 배치 불필요
- 단위 불일치: `tidalCurrentSpeed` (cm/s) vs `currentVelocity` (m/s) → 변환 명시
- Conservative Cap 유지: 기존 지상 대비 ±20점 제한 그대로 적용
- DB 마이그레이션: `aging_predictions`에 `ocean_profile_used`, `immersion_month` 컬럼 추가 필요
