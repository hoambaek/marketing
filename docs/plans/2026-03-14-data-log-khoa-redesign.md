# Data-Log KHOA 통합 리디자인 구현 플랜

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** data-log 페이지를 KHOA 실측 데이터 우선 + Open-Meteo 보조 하이브리드 구조로 전환하고, UAPS 보정계수 실시간 표시 + 조위/조류 카드/차트를 추가한다.

**Architecture:** 데이터 소스를 KHOA 우선(실측)으로 교체하되 Open-Meteo를 폴백으로 유지. DB 스키마에 조위/조류/데이터소스 컬럼 추가. UI는 3단 구성: 실시간 카드 → UAPS 보정계수 → 시계열 차트(KHOA 핵심 + 참고 데이터).

**Tech Stack:** Next.js 16 App Router, Zustand, Supabase, Recharts, KHOA API (XML), Open-Meteo API

---

## Task 0: DB 스키마 마이그레이션

**Files:**
- Create: `supabase/migrations/20260314_add_khoa_fields.sql`
- Modify: `src/lib/types/ocean-data.ts`
- Modify: `src/lib/supabase/database.ts` (매핑 함수)

**Step 1: 마이그레이션 SQL 작성**

```sql
-- ocean_data_daily에 KHOA 신규 필드 추가
ALTER TABLE ocean_data_daily
  ADD COLUMN IF NOT EXISTS tide_level_avg NUMERIC,
  ADD COLUMN IF NOT EXISTS tide_level_min NUMERIC,
  ADD COLUMN IF NOT EXISTS tide_level_max NUMERIC,
  ADD COLUMN IF NOT EXISTS tidal_current_speed NUMERIC,
  ADD COLUMN IF NOT EXISTS tidal_current_direction NUMERIC,
  ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'open-meteo';

COMMENT ON COLUMN ocean_data_daily.tide_level_avg IS '평균 조위 (cm)';
COMMENT ON COLUMN ocean_data_daily.tide_level_min IS '최소 조위 (cm)';
COMMENT ON COLUMN ocean_data_daily.tide_level_max IS '최대 조위 (cm)';
COMMENT ON COLUMN ocean_data_daily.tidal_current_speed IS '조류 유속 (cm/s)';
COMMENT ON COLUMN ocean_data_daily.tidal_current_direction IS '조류 유향 (deg)';
COMMENT ON COLUMN ocean_data_daily.data_source IS '데이터 소스 (khoa/open-meteo/hybrid)';
```

**Step 2: TypeScript 타입 업데이트**

`src/lib/types/ocean-data.ts`의 `OceanDataDaily` 인터페이스에 추가:
```typescript
// 조위 (KHOA)
tideLevelAvg: number | null;
tideLevelMin: number | null;
tideLevelMax: number | null;
// 조류 (KHOA)
tidalCurrentSpeed: number | null;
tidalCurrentDirection: number | null;
// 데이터 소스
dataSource: string;
```

`CurrentOceanConditions`에도 추가:
```typescript
tideLevel: number | null;
tidalCurrentSpeed: number | null;
tidalCurrentDirection: number | null;
```

`OCEAN_DATA_LABELS`에 추가:
```typescript
tideLevel: { name: '조위', unit: 'cm', color: '#818cf8' },
tidalCurrentSpeed: { name: '조류 유속', unit: 'cm/s', color: '#c084fc' },
```

**Step 3: database.ts 매핑 함수 업데이트**

`mapDbOceanDataToOceanData()`, `upsertOceanDataDaily()` 함수에 새 필드 추가.

**Step 4: 마이그레이션 적용**

```bash
echo "Y" | supabase db push
```

**Step 5: 커밋**

---

## Task 1: API 라우트 하이브리드화

**Files:**
- Modify: `src/app/api/ocean-data/route.ts`
- Modify: `src/lib/utils/ocean-api.ts`

**Step 1: `/api/ocean-data` 라우트를 하이브리드로 변경**

현재 흐름: Open-Meteo만 호출 → 응답
변경 흐름:
1. KHOA API 호출 (수온/염분/기압/조위)
2. Open-Meteo 호출 (파고/파주기 보조)
3. 두 소스 병합하여 응답

API 응답에 `source` 필드 추가하여 어떤 데이터가 KHOA/Open-Meteo인지 구분.

**Step 2: `enrichWithKhoaData()` 함수 확장**

기존 함수를 `fetchHybridOceanData()`로 확장:
- KHOA: 수온(실측), 염분(실측), 기압(실측), 조위(실측)
- Open-Meteo: 파고, 파주기, 기온, 습도
- 조류: 조류예보 API에서 가져오기 (20LTC03 외모군도남측)

KHOA 실패 시 Open-Meteo로 완전 폴백 (graceful degradation).

**Step 3: 조류 데이터 통합**

`khoa-api.ts`의 조류예보 데이터를 일별 평균 유속으로 집계하여 daily 데이터에 포함.

---

## Task 2: Zustand 스토어 업데이트

**Files:**
- Modify: `src/lib/store/ocean-data-store.ts`

**Step 1: 스토어 타입/상태에 KHOA 필드 추가**

`fetchOceanData()` 액션을 하이브리드 API 응답에 맞게 수정:
- `dailyData`에 조위/조류/염분 자동 포함
- 염분을 기존 수동 입력 대신 KHOA 실측값 우선 사용
- `currentConditions`에 조위/조류 추가

**Step 2: UAPS 보정계수 실시간 계산 상태 추가**

```typescript
interface UAPSLiveCoefficients {
  fri: number | null;     // 향 보존 지수 (수온 기반 아레니우스)
  bri: number | null;     // 기포 보존 지수 (수온+수압 기반 헨리)
  kTci: number | null;    // 운동학적 질감 (조류 유속 기반)
  tsi: number | null;     // 온도 안정성 (최근 30일 수온 변동)
  overallScore: number | null; // 종합 숙성 환경 점수 (0~100)
}
```

이 값들은 `currentConditions`가 갱신될 때 자동 계산.

**Step 3: `HistoricalOceanStats`에 조위/조류 통계 추가**

---

## Task 3: UAPS 보정계수 계산 유틸

**Files:**
- Create: `src/lib/utils/uaps-live-coefficients.ts`

보고서의 Keep 가설 기반 실시간 계산 함수:

```typescript
// H01: 아레니우스 방정식 기반 FRI
export function calculateLiveFRI(seaTemperature: number): number

// H01+H12: 헨리의 법칭 기반 BRI
export function calculateLiveBRI(seaTemperature: number, waterPressure: number): number

// H02: 조류 유속 기반 K-TCI kineticFactor
export function calculateLiveKTCI(tidalCurrentSpeed: number): number

// H11: 최근 N일 수온 변동 기반 TSI
export function calculateLiveTSI(recentTemperatures: number[]): number

// 종합 점수 (0~100)
export function calculateOverallScore(fri: number, bri: number, kTci: number, tsi: number): number
```

기존 `uaps-engine.ts`의 로직을 참조하되, 실시간 단일 값 계산용으로 경량화.

---

## Task 4: data-log 페이지 UI 리디자인

**Files:**
- Modify: `src/app/data-log/page.tsx`

### 4-1: 실시간 상태 카드 (상단)

기존 7개 → **9개**로 확장:

| 순서 | 카드 | 데이터 소스 | 아이콘 | 색상 |
|------|------|-----------|--------|------|
| 1 | 수온 | KHOA 실측 | Thermometer | #22d3ee (cyan) |
| 2 | 염분 | KHOA 실측 | Droplets | #34d399 (green) |
| 3 | 조위 | KHOA 실측 | Anchor | #818cf8 (indigo) |
| 4 | 기압 | KHOA 실측 | Gauge | #f472b6 (pink) |
| 5 | 수압 | 계산값 | Activity | #fb923c (orange) |
| 6 | 조류 유속 | 조류예보 | Navigation2 | #c084fc (purple) |
| 7 | 파고 | Open-Meteo | Waves | #60a5fa (blue) |
| 8 | 파주기 | Open-Meteo | Timer | #fbbf24 (amber) |
| 9 | 숙성 환경 점수 | 계산값 | TrendingUp | #C4A052 (gold) |

각 카드에 데이터 소스 뱃지 표시: `KHOA 실측` / `예보` / `모델`

### 4-2: UAPS 보정계수 섹션 (중단)

4개의 게이지 카드, 가로 배열:

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│  FRI 0.72    │  BRI 0.85    │  K-TCI 1.6   │  TSI 0.69    │
│  ████░░░░░░  │  ████████░░  │  ████████░░  │  ██████░░░░  │
│  향 보존     │  기포 안정    │  질감 활발    │  온도 안정    │
│  수온 기반   │  수온+수압    │  조류 기반    │  30일 변동    │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

각 게이지는:
- 프로그레스 바 (값 범위에 따른 색상: 녹색=좋음, 노란=보통, 빨간=주의)
- 현재 값 + 해석 레이블
- 툴팁으로 계산 근거 설명

### 4-3: 시계열 차트 (하단 2열 그리드)

**핵심 차트 (상위):**
1. 수온 변화 (AreaChart) — KHOA 실측, min/max 밴드 포함
2. 염분 변화 (AreaChart) — KHOA 실측 (기존 수동→자동!)
3. 조위 변화 (AreaChart) — 신규, 조석 패턴 시각화
4. 조류 유속 (BarChart) — 신규, 유향 방향 포함

**보조 차트 (하위, 접기 없이 항상 표시):**
5. 기압/수압 (LineChart, dual axis) — 기존 유지
6. 파고 변화 (AreaChart) — Open-Meteo
7. 파주기 변화 (AreaChart) — Open-Meteo
8. FRI/BRI 추이 (LineChart) — 일별 보정계수 트렌드

### 4-4: 염분 모달 변경

KHOA에서 자동 수집되므로 수동 입력 모달은 "보정/수동 오버라이드" 용도로 유지.
버튼 레이블: "염도 기록" → "염분 수동 보정"

### 4-5: 데이터 소스 표시

페이지 상단에 데이터 소스 상태 표시:
```
KHOA 완도(DT_0027) ● 실시간 | Open-Meteo ● 보조 | 마지막 갱신: 13:00
```

---

## Task 5: .env 정리 및 API 키 관리

**Files:**
- Modify: `.env.example`

`.env.example`에 KHOA 관련 변수 추가:
```
KHOA_API_KEY=your_khoa_api_key
KHOA_OBS_CODE=DT_0027
KHOA_TIDAL_OBS_CODE=20LTC03
```

---

## 구현 순서 요약

```
Task 0: DB 스키마 → 기반
Task 1: API 하이브리드화 → 데이터 흐름
Task 2: 스토어 업데이트 → 상태 관리
Task 3: UAPS 계수 유틸 → 계산 로직
Task 4: UI 리디자인 → 표시
Task 5: 환경변수 정리 → 마무리
```

## 주의사항

- KHOA API 장애 시 Open-Meteo 폴백 필수 (graceful degradation)
- 조류예보 지점코드(20LTC03)는 .env로 관리
- 기존 `salinity_records` 테이블과 수동 입력 기능은 보정용으로 유지
- `ocean_data_daily`의 기존 데이터 마이그레이션 불필요 (새 컬럼은 NULL 허용)
- 일일 API 호출 한도 10,000회 준수 (1시간 간격 × 1관측소 = 24회/일)
