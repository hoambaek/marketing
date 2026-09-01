/**
 * UAPS 실시간 보정계수 계산 유틸리티
 *
 * data-log 대시보드에서 현재 해양 환경 데이터를 기반으로
 * 단일 보정계수 값을 실시간 산출하는 경량 순수 함수 모듈.
 *
 * - FRI: 아레니우스 방정식 기반 향 보존 지수
 * - BRI: 헨리의 법칙 기반 기포 보존 지수
 * - K-TCI: 조류 유속 기반 운동학적 질감 계수
 * - TSI: 수온 변동 기반 온도 안정성 지수
 */

// ═══════════════════════════════════════════════════════════════════════════
// 물리 상수
// ═══════════════════════════════════════════════════════════════════════════

/** 기체 상수 (J/(mol·K)) */
const R = 8.314;

/** 켈빈 변환 오프셋 */
const KELVIN_OFFSET = 273.15;

/** FRI: 와인 산화 활성화 에너지 (J/mol) */
const EA_OXIDATION = 80_000;

/** BRI: CO₂ 용해 엔탈피 변화 (J/mol) */
const DELTA_SOL_H_CO2 = -19_900;

/** 기준 온도 (°C) — 한국 남해 연평균 수온 */
const T_REF_C = 14;

/** 기준 압력 (atm) — 대기압 */
const P_REF_ATM = 1;

/**
 * TSI: 기준 변동폭 (°C)
 * 한국 남해 표층 연간 변동: ~18°C (7→25°C)
 * 30m 해저 연간 변동: ~8°C (보고서 기준)
 * 30일 단위 측정이므로 월간 변동 기준 적용: ~5°C
 */
const TSI_REF_RANGE = 5;

/** K-TCI: 최소 kineticFactor (정지 상태) */
const KTCI_MIN = 0.6;

/** K-TCI: 최대 kineticFactor */
const KTCI_MAX = 1.8;

/**
 * K-TCI: 최대 유속 기준 (cm/s)
 * 완도 근해 실측 범위: 부이 1~50cm/s, 조류예보 0~120cm/s
 * 해저 숙성에서는 약한 조류(10~30cm/s)도 자연 리무아주에 효과적
 */
const KTCI_MAX_SPEED = 80;

// ═══════════════════════════════════════════════════════════════════════════
// FRI 정규화 기준값 (아레니우스 계산 결과)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 정규화 앵커 (2026-09-01 재보정, 대표 지시).
 *
 * 입력은 표층이 아니라 **30m 보정 수온**이다
 * (estimateBottomTemperature, `ocean-data-store`에서 1회 적용).
 * ocean_data_daily 실적재 562일(2025-01-01~2026-09-01) 기준 연간 범위 5.12~21.66°C.
 *
 * 두 앵커의 근거가 다르다:
 * - 하한(최적): 연간 최저 5.12°C에 1.5°C 여유 → 3.5°C
 * - 상한(최악): **20°C에서 FRI가 정확히 0.5가 되도록** 역산 (대표 지시 2026-09-01).
 *   해저 30m의 20°C는 지상 셀러 기준으로는 여전히 양호한 조건이라 게이지가
 *   바닥을 치면 안 된다는 판단. 결과적으로 FRI 0에 해당하는 온도는 25.6°C.
 *
 * 종전 상수(0.56 / 2.12)는 각각 9.12°C / 20.59°C여서 실측 범위 안쪽에서 잘렸다.
 * 그 결과 겨울 154일이 1.0에, 여름 58일이 0.0에 포화돼 지표가 아니라 직선이 됐다.
 *
 * ⚠️ 위 범위는 DB 백필(Open-Meteo 격자) 기준이다. KHOA 완도항 실측이 우선
 * 적용되는 최근 구간은 여름 수온이 더 낮게 들어올 수 있는데(격자 모델의 연안
 * 과열, 세션 메모리 project_mdm_ocean_data_conventions 참조), 그 경우 FRI는
 * 더 높게 나올 뿐 클램프되지 않으므로 앵커를 다시 잡을 필요는 없다.
 */
const FRI_T_BEST_C = 3.5;
const FRI_T_MID_C = 20;

/** 앵커 온도의 아레니우스 원시값 (상수 정의 시점에 1회 계산) */
function friRawAt(celsius: number): number {
  return Math.exp(
    (-EA_OXIDATION / R) * (1 / (celsius + KELVIN_OFFSET) - 1 / (T_REF_C + KELVIN_OFFSET))
  );
}

/** FRI 원시값 하한 (3.5°C 기준 = 산화 최소, ≈0.280) */
const FRI_RAW_MIN = friRawAt(FRI_T_BEST_C);

/**
 * FRI 원시값 상한 (≈3.691, 온도로는 25.6°C).
 * FRI_T_MID_C가 정확히 0.5가 되도록 유도: (MIN + MAX) / 2 = raw(20°C)
 */
const FRI_RAW_MAX = 2 * friRawAt(FRI_T_MID_C) - FRI_RAW_MIN;

// ═══════════════════════════════════════════════════════════════════════════
// BRI 정규화 기준값
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 정규화 앵커 (2026-09-01 재보정). FRI와 같은 규칙을 적용한다.
 *
 * 종전 상수(0.5 / 5.0)는 30m 운용 수압(≈3.98atm)에서 실제로 나오는 raw 범위
 * 3.20~5.21과 어긋나 눈금의 41%만 쓰였고, 겨울 29일이 1.0에 포화했다.
 *
 * - 상한(최적): 3.5°C @ 운용 수압 → ≈5.461
 * - 하한(최악): **20°C에서 BRI가 정확히 0.5가 되도록** 역산 → ≈1.250
 *
 * BRI는 수압이 지배적이라(30m에서 4atm 고정) 온도 기여가 ±20%뿐이다. 그래서
 * 하한 1.250은 실제 도달하는 값이 아니라 "0으로 읽어야 할 조건"의 정의다
 * (같은 raw를 얕고 따뜻한 조건에서 만나면 그때가 0). 실측 562일은 0.46~0.94에
 * 들어오며 클램프되지 않는다.
 */
const BRI_T_BEST_C = 3.5;
const BRI_T_MID_C = 20;

/** BRI 정규화 기준 수압 (atm) — 운용 수심 30m: 1 + 30 × 0.0993 */
const BRI_P_OPERATING = 3.98;

/** 앵커 온도의 헨리·반트호프 원시값 (상수 정의 시점에 1회 계산) */
function briRawAt(celsius: number, pressureAtm: number): number {
  return (
    Math.exp(
      (-DELTA_SOL_H_CO2 / R) * (1 / (celsius + KELVIN_OFFSET) - 1 / (T_REF_C + KELVIN_OFFSET))
    ) *
    (pressureAtm / P_REF_ATM)
  );
}

/** BRI 원시값 상한 (3.5°C @ 3.98atm, ≈5.461) */
const BRI_RAW_MAX = briRawAt(BRI_T_BEST_C, BRI_P_OPERATING);

/**
 * BRI 원시값 하한 (≈1.250).
 * BRI_T_MID_C가 정확히 0.5가 되도록 유도: (MIN + MAX) / 2 = raw(20°C)
 */
const BRI_RAW_MIN = 2 * briRawAt(BRI_T_MID_C, BRI_P_OPERATING) - BRI_RAW_MAX;

// ═══════════════════════════════════════════════════════════════════════════
// 종합 점수 가중치
// ═══════════════════════════════════════════════════════════════════════════

const WEIGHT_FRI = 0.40;
const WEIGHT_BRI = 0.25;
const WEIGHT_KTCI = 0.20;
const WEIGHT_TSI = 0.15;

// ═══════════════════════════════════════════════════════════════════════════
// 헬퍼
// ═══════════════════════════════════════════════════════════════════════════

/** °C → K 변환 */
function toKelvin(celsius: number): number {
  return celsius + KELVIN_OFFSET;
}

/** 값을 [min, max] 범위로 클램프 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** 유효한 숫자인지 검증 */
function isValidNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. FRI — 향 보존 지수 (Flavor Retention Index)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 아레니우스 방정식 기반 향 보존 지수 (실시간 단일 값)
 *
 * FRI_raw = exp(-Ea/R × (1/T - 1/Tref))
 * - Ea = 80,000 J/mol (와인 산화 기준)
 * - Tref = 14°C (연평균 수온)
 * - FRI_raw가 낮을수록 산화가 느려 보존이 좋음
 *
 * 정규화: FRI_raw를 0~1로 역매핑 (0.56→1.0, 2.12→0.0)
 *
 * @param seaTemperature 현재 수온 (°C)
 * @returns 정규화된 FRI (0~1, 1=최적 보존)
 */
export function calculateLiveFRI(seaTemperature: number): number {
  if (!isValidNumber(seaTemperature)) return 0.5;

  const tSea = toKelvin(seaTemperature);
  const tRef = toKelvin(T_REF_C);

  const exponent = (-EA_OXIDATION / R) * (1 / tSea - 1 / tRef);
  const friRaw = Math.exp(exponent);

  // 역매핑: 낮은 friRaw = 좋은 보존 = 높은 정규화 값
  const normalized = 1 - (friRaw - FRI_RAW_MIN) / (FRI_RAW_MAX - FRI_RAW_MIN);
  return clamp(normalized, 0, 1);
}

/**
 * FRI 원시값 반환 (디버그/툴팁용)
 */
export function calculateLiveFRIRaw(seaTemperature: number): number {
  if (!isValidNumber(seaTemperature)) return 1.0;

  const tSea = toKelvin(seaTemperature);
  const tRef = toKelvin(T_REF_C);

  const exponent = (-EA_OXIDATION / R) * (1 / tSea - 1 / tRef);
  return Math.exp(exponent);
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. BRI — 기포 보존 지수 (Bubble Retention Index)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 헨리의 법칙 기반 기포 보존 지수 (실시간 단일 값)
 *
 * CO₂ 용해도: 온도 낮을수록, 압력 높을수록 증가
 * BRI_raw = (Kh(T) × P) / (Kh(Tref) × Pref)
 *   Kh(T) = Kh0 × exp(-deltasolH/R × (1/T - 1/Tref))  [Van't Hoff]
 *   => BRI_raw = exp(-deltasolH/R × (1/T - 1/Tref)) × (P / Pref)
 *
 * 정규화: 0.5~5.0 → 0~1 선형 매핑 (높을수록 좋음)
 *
 * @param seaTemperature 현재 수온 (°C)
 * @param waterPressure 현재 수압 (atm), 수심 30m ≈ 4 atm
 * @returns 정규화된 BRI (0~1, 1=최적 기포 보존)
 */
export function calculateLiveBRI(
  seaTemperature: number,
  waterPressure: number
): number {
  if (!isValidNumber(seaTemperature) || !isValidNumber(waterPressure)) return 0.5;
  if (waterPressure <= 0) return 0;

  const tSea = toKelvin(seaTemperature);
  const tRef = toKelvin(T_REF_C);

  // Van't Hoff: Kh(T)/Kh(Tref) = exp(-deltasolH/R × (1/T - 1/Tref))
  const khRatio = Math.exp((-DELTA_SOL_H_CO2 / R) * (1 / tSea - 1 / tRef));

  const briRaw = khRatio * (waterPressure / P_REF_ATM);

  // 선형 정규화: [0.5, 5.0] → [0, 1]
  const normalized = (briRaw - BRI_RAW_MIN) / (BRI_RAW_MAX - BRI_RAW_MIN);
  return clamp(normalized, 0, 1);
}

/**
 * BRI 원시값 반환 (디버그/툴팁용)
 */
export function calculateLiveBRIRaw(
  seaTemperature: number,
  waterPressure: number
): number {
  if (!isValidNumber(seaTemperature) || !isValidNumber(waterPressure)) return 1.0;
  if (waterPressure <= 0) return 0;

  const tSea = toKelvin(seaTemperature);
  const tRef = toKelvin(T_REF_C);

  const khRatio = Math.exp((-DELTA_SOL_H_CO2 / R) * (1 / tSea - 1 / tRef));
  return khRatio * (waterPressure / P_REF_ATM);
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. K-TCI — 운동학적 질감 계수 (Kinetic Texture Coefficient Index)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 조류 유속 기반 운동학적 질감 계수 (실시간 단일 값)
 *
 * kineticFactor = 0.6 + (speed / 150) × 1.2, 클램프 [0.6, 1.8]
 *  - 0 cm/s → 0.6 (정지)
 *  - 50 cm/s → 1.0 (보통)
 *  - 120 cm/s → 1.56 (활발)
 *  - 150+ cm/s → 1.8 (최대)
 *
 * 정규화: [0.6, 1.8] → [0, 1]
 *
 * @param tidalCurrentSpeed 조류 유속 (cm/s)
 * @returns 정규화된 K-TCI (0~1, 1=최대 질감 효과)
 */
export function calculateLiveKTCI(tidalCurrentSpeed: number): number {
  if (!isValidNumber(tidalCurrentSpeed)) return 0.5;

  const speed = Math.max(0, tidalCurrentSpeed);
  // 제곱근 스케일: 약한 조류(10~30cm/s)도 자연 리무아주에 효과적
  const ratio = Math.sqrt(Math.min(speed, KTCI_MAX_SPEED) / KTCI_MAX_SPEED);
  const kf = KTCI_MIN + ratio * (KTCI_MAX - KTCI_MIN);
  const kfClamped = clamp(kf, KTCI_MIN, KTCI_MAX);

  // 정규화: [0.6, 1.8] → [0, 1]
  return (kfClamped - KTCI_MIN) / (KTCI_MAX - KTCI_MIN);
}

/**
 * K-TCI kineticFactor 원시값 반환 (디버그/툴팁용)
 */
export function calculateLiveKTCIRaw(tidalCurrentSpeed: number): number {
  if (!isValidNumber(tidalCurrentSpeed)) return 1.0;

  const speed = Math.max(0, tidalCurrentSpeed);
  const ratio = Math.sqrt(Math.min(speed, KTCI_MAX_SPEED) / KTCI_MAX_SPEED);
  const kf = KTCI_MIN + ratio * (KTCI_MAX - KTCI_MIN);
  return clamp(kf, KTCI_MIN, KTCI_MAX);
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. TSI — 온도 안정성 지수 (Temperature Stability Index)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 최근 N일 수온 변동 기반 온도 안정성 지수 (실시간)
 *
 * 표준편차 기반 + 수심 보정: TSI = (1 - σ/σ_ref) × depthBonus
 *  - σ_ref = 4°C (표층 월간 변동 기준)
 *  - 수심이 깊을수록 수온 안정 → depthBonus = 1 + depth/100
 *    (30m → ×1.30, 50m → ×1.50)
 *  - 관측 수온은 표층이지만, 실제 숙성 수심에서는 변동이 더 작음을 반영
 *
 * @param recentTemperatures 최근 N일간 수온 배열 (°C)
 * @param depth 숙성 수심 (m, 기본 50)
 * @returns TSI (0~1, 1=완전 안정)
 */
export function calculateLiveTSI(recentTemperatures: number[], depth: number = 50): number {
  if (!Array.isArray(recentTemperatures) || recentTemperatures.length === 0) {
    return 0.5;
  }

  const valid = recentTemperatures.filter(isValidNumber);
  if (valid.length === 0) return 0.5;
  if (valid.length === 1) return 1.0;

  // 표준편차 계산
  const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
  const variance = valid.reduce((sum, v) => sum + (v - mean) ** 2, 0) / valid.length;
  const stddev = Math.sqrt(variance);

  // σ_ref = 4°C (표층 월간 변동 기준)
  const TSI_REF_STDDEV = 4;
  const baseTsi = 1 - stddev / TSI_REF_STDDEV;

  // 수심 보정: 깊을수록 열성층 차폐로 안정성 증가 (최대 +15%)
  const depthBonus = 1 + Math.min(depth, 60) / 400;
  const tsi = baseTsi * depthBonus;

  return clamp(tsi, 0, 1);
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. 종합 숙성 환경 점수
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 가중 평균 기반 종합 숙성 환경 점수 (0~100)
 *
 * 가중치: FRI 40% | BRI 25% | K-TCI 20% | TSI 15%
 * 모든 입력은 정규화된 값 (0~1)
 *
 * @param fri 정규화된 FRI (0~1)
 * @param bri 정규화된 BRI (0~1)
 * @param kTci 정규화된 K-TCI (0~1)
 * @param tsi TSI (0~1)
 * @returns 종합 점수 (0~100)
 */
export function calculateOverallScore(
  fri: number,
  bri: number,
  kTci: number,
  tsi: number
): number {
  // 무효 입력 방어: 각각 0.5 폴백
  const f = isValidNumber(fri) ? clamp(fri, 0, 1) : 0.5;
  const b = isValidNumber(bri) ? clamp(bri, 0, 1) : 0.5;
  const k = isValidNumber(kTci) ? clamp(kTci, 0, 1) : 0.5;
  const t = isValidNumber(tsi) ? clamp(tsi, 0, 1) : 0.5;

  const weighted = f * WEIGHT_FRI + b * WEIGHT_BRI + k * WEIGHT_KTCI + t * WEIGHT_TSI;
  return Math.round(weighted * 100);
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. 상태 레이블 헬퍼
// ═══════════════════════════════════════════════════════════════════════════

export interface CoefficientLabel {
  text: string;
  color: string;
}

/** 색상 상수 */
const COLOR_GOOD = '#34d399';
const COLOR_NORMAL = '#fbbf24';
const COLOR_WARN = '#f87171';

/**
 * FRI 상태 레이블 (정규화 값 기준)
 * - >= 0.7: 우수 (산화 매우 느림)
 * - >= 0.4: 양호
 * - < 0.4: 주의 (산화 빠름)
 */
export function getFRILabel(fri: number): CoefficientLabel {
  if (!isValidNumber(fri)) return { text: '데이터 없음', color: COLOR_NORMAL };
  if (fri >= 0.7) return { text: '우수', color: COLOR_GOOD };
  if (fri >= 0.4) return { text: '양호', color: COLOR_NORMAL };
  return { text: '주의', color: COLOR_WARN };
}

/**
 * BRI 상태 레이블 (정규화 값 기준)
 * - >= 0.6: 우수 (기포 안정)
 * - >= 0.3: 양호
 * - < 0.3: 주의 (기포 손실 위험)
 */
export function getBRILabel(bri: number): CoefficientLabel {
  if (!isValidNumber(bri)) return { text: '데이터 없음', color: COLOR_NORMAL };
  if (bri >= 0.6) return { text: '우수', color: COLOR_GOOD };
  if (bri >= 0.3) return { text: '양호', color: COLOR_NORMAL };
  return { text: '주의', color: COLOR_WARN };
}

/**
 * K-TCI 상태 레이블 (정규화 값 기준)
 * - >= 0.5: 활발 (질감 강화 효과)
 * - >= 0.2: 보통
 * - < 0.2: 미약 (조류 약함)
 */
export function getKTCILabel(kTci: number): CoefficientLabel {
  if (!isValidNumber(kTci)) return { text: '데이터 없음', color: COLOR_NORMAL };
  if (kTci >= 0.5) return { text: '활발', color: COLOR_GOOD };
  if (kTci >= 0.2) return { text: '보통', color: COLOR_NORMAL };
  return { text: '미약', color: COLOR_WARN };
}

/**
 * TSI 상태 레이블
 * - >= 0.7: 안정 (변동 적음)
 * - >= 0.4: 보통
 * - < 0.4: 불안정 (변동 큼)
 */
export function getTSILabel(tsi: number): CoefficientLabel {
  if (!isValidNumber(tsi)) return { text: '데이터 없음', color: COLOR_NORMAL };
  if (tsi >= 0.7) return { text: '안정', color: COLOR_GOOD };
  if (tsi >= 0.4) return { text: '보통', color: COLOR_NORMAL };
  return { text: '불안정', color: COLOR_WARN };
}

/**
 * 종합 점수 상태 레이블 (0~100 스케일)
 * - >= 75: 최적 환경
 * - >= 50: 양호 환경
 * - < 50: 개선 필요
 */
export function getOverallLabel(score: number): CoefficientLabel {
  if (!isValidNumber(score)) return { text: '데이터 없음', color: COLOR_NORMAL };
  if (score >= 75) return { text: '최적', color: COLOR_GOOD };
  if (score >= 50) return { text: '양호', color: COLOR_NORMAL };
  return { text: '개선 필요', color: COLOR_WARN };
}
