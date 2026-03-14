/**
 * KHOA 국립해양조사원 API 유틸리티
 *
 * 조위관측소 최신 관측데이터 조회 서비스 (GetDTRecentApiService)
 * - 관측소: 완도 (DT_0027) — 보길도 인근
 * - 제공 항목: 수온, 염분, 기압, 조위, 풍향, 풍속, 유향, 유속
 * - 일일 트래픽 한도: 10,000회
 */

// API 엔드포인트
const KHOA_RECENT_URL = 'https://apis.data.go.kr/1192136/dtRecent/GetDTRecentApiService';
const KHOA_WATER_TEMP_URL = 'https://apis.data.go.kr/1192136/surveyWaterTemp/GetSurveyWaterTempApiService';
const KHOA_TIDE_LEVEL_URL = 'https://apis.data.go.kr/1192136/surveyTideLevel/GetSurveyTideLevelApiService';
const KHOA_AIR_PRESS_URL = 'https://apis.data.go.kr/1192136/surveyAirPress/GetSurveyAirPressApiService';
const KHOA_TIDAL_CURRENT_URL = 'https://apis.data.go.kr/1192136/crntFcstFldEbb/GetCrntFcstFldEbbApiService';
const KHOA_BUOY_RECENT_URL = 'https://apis.data.go.kr/1192136/twRecent/GetTWRecentApiService';

export interface KhoaObservationItem {
  obsvtrNm: string;     // 관측소명
  lot: number;          // 경도
  lat: number;          // 위도
  obsrvnDt: string;     // 관측일시 (YYYY-MM-DD HH:mm)
  wndrct: number | null; // 풍향 (deg)
  wspd: number | null;   // 풍속 (m/s)
  maxMmntWspd: number | null; // 최대순간풍속 (m/s)
  artmp: number | null;  // 기온 (℃)
  atmpr: number | null;  // 기압 (hPa)
  wtem: number | null;   // 수온 (℃)
  bscTdlvHgt: number | null; // 조위 (cm)
  slntQty: number | null;    // 염분 (psu)
  crdir: number | null;  // 유향 (deg)
  crsp: number | null;   // 유속 (m/s)
}

interface KhoaApiResponse {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: { item: KhoaObservationItem[] };
      pageNo: number;
      numOfRows: number;
      totalCount: number;
    };
  };
}

/**
 * KHOA API에서 관측 데이터 조회
 * @param obsCode 관측소 코드 (기본: DT_0027 완도)
 * @param reqDate 조회일자 (yyyyMMdd, 기본: 오늘)
 * @param min 시간 간격 (분, 기본: 60)
 */
export async function fetchKhoaRecentData(options?: {
  obsCode?: string;
  reqDate?: string;
  min?: number;
  numOfRows?: number;
}): Promise<KhoaObservationItem[]> {
  const apiKey = process.env.KHOA_API_KEY;
  if (!apiKey) {
    throw new Error('KHOA_API_KEY 환경변수가 설정되지 않았습니다.');
  }

  const obsCode = options?.obsCode || process.env.KHOA_OBS_CODE || 'DT_0027';
  const min = options?.min || 60;
  const numOfRows = options?.numOfRows || 300;

  const params = new URLSearchParams({
    serviceKey: apiKey,
    obsCode,
    min: min.toString(),
    numOfRows: numOfRows.toString(),
  });

  if (options?.reqDate) {
    params.set('reqDate', options.reqDate);
  }

  const response = await fetch(`${KHOA_RECENT_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`KHOA API 오류 (${response.status}): ${response.statusText}`);
  }

  const text = await response.text();

  // XML 파싱 (KHOA API는 XML 기본)
  const items = parseKhoaXml(text);
  return items;
}

/**
 * KHOA XML 응답을 파싱
 */
function parseKhoaXml(xml: string): KhoaObservationItem[] {
  const items: KhoaObservationItem[] = [];

  // resultCode 확인
  const codeMatch = xml.match(/<resultCode>(\d+)<\/resultCode>/);
  if (codeMatch && codeMatch[1] !== '00') {
    const msgMatch = xml.match(/<resultMsg>([^<]+)<\/resultMsg>/);
    throw new Error(`KHOA API 에러 [${codeMatch[1]}]: ${msgMatch?.[1] || '알 수 없는 오류'}`);
  }

  // <item> 태그 파싱
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    items.push({
      obsvtrNm: extractXmlText(itemXml, 'obsvtrNm') || '',
      lot: parseFloat(extractXmlText(itemXml, 'lot') || '0'),
      lat: parseFloat(extractXmlText(itemXml, 'lat') || '0'),
      obsrvnDt: extractXmlText(itemXml, 'obsrvnDt') || '',
      wndrct: parseXmlNumber(itemXml, 'wndrct'),
      wspd: parseXmlNumber(itemXml, 'wspd'),
      maxMmntWspd: parseXmlNumber(itemXml, 'maxMmntWspd'),
      artmp: parseXmlNumber(itemXml, 'artmp'),
      atmpr: parseXmlNumber(itemXml, 'atmpr'),
      wtem: parseXmlNumber(itemXml, 'wtem'),
      bscTdlvHgt: parseXmlNumber(itemXml, 'bscTdlvHgt'),
      slntQty: parseXmlNumber(itemXml, 'slntQty'),
      crdir: parseXmlNumber(itemXml, 'crdir'),
      crsp: parseXmlNumber(itemXml, 'crsp'),
    });
  }

  return items;
}

function extractXmlText(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return match ? match[1] : null;
}

function parseXmlNumber(xml: string, tag: string): number | null {
  const text = extractXmlText(xml, tag);
  if (!text || text.trim() === '') return null;
  const num = parseFloat(text);
  return isNaN(num) ? null : num;
}

/**
 * KHOA 시간별 데이터를 일별 통계로 집계
 */
export function aggregateKhoaDaily(items: KhoaObservationItem[]): {
  date: string;
  seaTemperatureAvg: number | null;
  seaTemperatureMin: number | null;
  seaTemperatureMax: number | null;
  salinity: number | null;
  surfacePressureAvg: number | null;
  tideLevelAvg: number | null;
  tideLevelMin: number | null;
  tideLevelMax: number | null;
  airTemperatureAvg: number | null;
  windSpeedAvg: number | null;
  currentDirectionDominant: number | null;
  currentVelocityAvg: number | null;
}[] {
  const dailyMap = new Map<string, KhoaObservationItem[]>();

  for (const item of items) {
    const date = item.obsrvnDt.split(' ')[0];
    const existing = dailyMap.get(date) || [];
    existing.push(item);
    dailyMap.set(date, existing);
  }

  const result: ReturnType<typeof aggregateKhoaDaily> = [];

  dailyMap.forEach((hourItems, date) => {
    const temps = hourItems.map(i => i.wtem).filter((v): v is number => v !== null);
    const salinities = hourItems.map(i => i.slntQty).filter((v): v is number => v !== null);
    const pressures = hourItems.map(i => i.atmpr).filter((v): v is number => v !== null);
    const tides = hourItems.map(i => i.bscTdlvHgt).filter((v): v is number => v !== null);
    const airTemps = hourItems.map(i => i.artmp).filter((v): v is number => v !== null);
    const windSpeeds = hourItems.map(i => i.wspd).filter((v): v is number => v !== null);
    const currDirs = hourItems.map(i => i.crdir).filter((v): v is number => v !== null);
    const currSpds = hourItems.map(i => i.crsp).filter((v): v is number => v !== null);

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

    result.push({
      date,
      seaTemperatureAvg: avg(temps),
      seaTemperatureMin: temps.length > 0 ? Math.min(...temps) : null,
      seaTemperatureMax: temps.length > 0 ? Math.max(...temps) : null,
      salinity: avg(salinities),
      surfacePressureAvg: avg(pressures),
      tideLevelAvg: avg(tides),
      tideLevelMin: tides.length > 0 ? Math.min(...tides) : null,
      tideLevelMax: tides.length > 0 ? Math.max(...tides) : null,
      airTemperatureAvg: avg(airTemps),
      windSpeedAvg: avg(windSpeeds),
      currentDirectionDominant: currDirs.length > 0 ? currDirs[Math.floor(currDirs.length / 2)] : null,
      currentVelocityAvg: avg(currSpds),
    });
  });

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

// ─── 과거 데이터 조회 (API 2~4) ───

export interface KhoaWaterTempItem {
  obsvtrNm: string;
  lat: number;
  lot: number;
  obsrvnDt: string;
  wtem: number | null;
}

export interface KhoaTideLevelItem {
  obsvtrNm: string;
  lat: number;
  lot: number;
  obsrvnDt: string;
  bscTdlvHgt: number | null; // 실측 조위 (cm)
  tdlvHgt: number | null;    // 예측 조위 (cm)
}

export interface KhoaAirPressItem {
  obsvtrNm: string;
  lat: number;
  lot: number;
  obsrvnDt: string;
  atmpr: number | null;
}

/**
 * 공통 KHOA API 호출 (과거 데이터용)
 */
async function fetchKhoaSurveyData(
  baseUrl: string,
  options?: { obsCode?: string; reqDate?: string; min?: number; numOfRows?: number }
): Promise<string> {
  const apiKey = process.env.KHOA_API_KEY;
  if (!apiKey) throw new Error('KHOA_API_KEY 환경변수가 설정되지 않았습니다.');

  const params = new URLSearchParams({
    serviceKey: apiKey,
    obsCode: options?.obsCode || process.env.KHOA_OBS_CODE || 'DT_0027',
    min: (options?.min || 60).toString(),
    numOfRows: (options?.numOfRows || 300).toString(),
  });
  if (options?.reqDate) params.set('reqDate', options.reqDate);

  const response = await fetch(`${baseUrl}?${params.toString()}`);
  if (!response.ok) throw new Error(`KHOA API 오류 (${response.status})`);
  return response.text();
}

/**
 * 과거 수온 시계열 조회
 */
export async function fetchKhoaWaterTemp(options?: {
  obsCode?: string; reqDate?: string; min?: number; numOfRows?: number;
}): Promise<KhoaWaterTempItem[]> {
  const xml = await fetchKhoaSurveyData(KHOA_WATER_TEMP_URL, options);
  const items: KhoaWaterTempItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const x = match[1];
    items.push({
      obsvtrNm: extractXmlText(x, 'obsvtrNm') || '',
      lat: parseFloat(extractXmlText(x, 'lat') || '0'),
      lot: parseFloat(extractXmlText(x, 'lot') || '0'),
      obsrvnDt: extractXmlText(x, 'obsrvnDt') || '',
      wtem: parseXmlNumber(x, 'wtem'),
    });
  }
  return items;
}

/**
 * 과거 조위(실측+예측) 시계열 조회
 */
export async function fetchKhoaTideLevel(options?: {
  obsCode?: string; reqDate?: string; min?: number; numOfRows?: number;
}): Promise<KhoaTideLevelItem[]> {
  const xml = await fetchKhoaSurveyData(KHOA_TIDE_LEVEL_URL, options);
  const items: KhoaTideLevelItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const x = match[1];
    items.push({
      obsvtrNm: extractXmlText(x, 'obsvtrNm') || '',
      lat: parseFloat(extractXmlText(x, 'lat') || '0'),
      lot: parseFloat(extractXmlText(x, 'lot') || '0'),
      obsrvnDt: extractXmlText(x, 'obsrvnDt') || '',
      bscTdlvHgt: parseXmlNumber(x, 'bscTdlvHgt'),
      tdlvHgt: parseXmlNumber(x, 'tdlvHgt'),
    });
  }
  return items;
}

/**
 * 과거 기압 시계열 조회
 */
export async function fetchKhoaAirPress(options?: {
  obsCode?: string; reqDate?: string; min?: number; numOfRows?: number;
}): Promise<KhoaAirPressItem[]> {
  const xml = await fetchKhoaSurveyData(KHOA_AIR_PRESS_URL, options);
  const items: KhoaAirPressItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const x = match[1];
    items.push({
      obsvtrNm: extractXmlText(x, 'obsvtrNm') || '',
      lat: parseFloat(extractXmlText(x, 'lat') || '0'),
      lot: parseFloat(extractXmlText(x, 'lot') || '0'),
      obsrvnDt: extractXmlText(x, 'obsrvnDt') || '',
      atmpr: parseXmlNumber(x, 'atmpr'),
    });
  }
  return items;
}

/**
 * 날짜 범위의 일별 수온 백필 (과거 데이터 수집)
 * @param startDate YYYY-MM-DD
 * @param endDate YYYY-MM-DD
 * @returns 일별 평균/최소/최대 수온
 */
export async function backfillDailyWaterTemp(
  startDate: string,
  endDate: string,
  obsCode?: string
): Promise<{ date: string; avg: number; min: number; max: number }[]> {
  const results: { date: string; avg: number; min: number; max: number }[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const reqDate = d.toISOString().split('T')[0].replace(/-/g, '');
    try {
      const items = await fetchKhoaWaterTemp({ obsCode, reqDate, min: 60 });
      const temps = items.map(i => i.wtem).filter((v): v is number => v !== null);
      if (temps.length > 0) {
        results.push({
          date: d.toISOString().split('T')[0],
          avg: temps.reduce((a, b) => a + b, 0) / temps.length,
          min: Math.min(...temps),
          max: Math.max(...temps),
        });
      }
    } catch {
      // 특정 날짜 실패 시 건너뜀
    }
  }

  return results;
}

// ─── 해양관측부이 (API 10: TW_0078 완도항) ───

/**
 * 해양관측부이 최신 관측데이터 조회
 * DT_ 관측소와 다른 엔드포인트(twRecent) 사용
 * @param obsCode 부이 관측소 코드 (기본: TW_0078 완도항)
 */
export async function fetchKhoaBuoyData(options?: {
  obsCode?: string;
  reqDate?: string;
  min?: number;
  numOfRows?: number;
}): Promise<{ crsp: number | null; crdir: number | null }[]> {
  const apiKey = process.env.KHOA_API_KEY;
  if (!apiKey) throw new Error('KHOA_API_KEY 환경변수가 설정되지 않았습니다.');

  const params = new URLSearchParams({
    serviceKey: apiKey,
    obsCode: options?.obsCode || 'TW_0078',
    min: (options?.min || 60).toString(),
    numOfRows: (options?.numOfRows || 300).toString(),
  });
  if (options?.reqDate) params.set('reqDate', options.reqDate);

  const response = await fetch(`${KHOA_BUOY_RECENT_URL}?${params.toString()}`);
  if (!response.ok) throw new Error(`KHOA 부이 API 오류 (${response.status})`);

  const xml = await response.text();
  const codeMatch = xml.match(/<resultCode>(\d+)<\/resultCode>/);
  if (codeMatch && codeMatch[1] !== '00') return [];

  const items: { crsp: number | null; crdir: number | null }[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    items.push({
      crsp: parseXmlNumber(match[1], 'crsp'),
      crdir: parseXmlNumber(match[1], 'crdir'),
    });
  }
  return items;
}

// ─── 조류예보 (API 7: 최강창낙조) ───

export interface KhoaTidalCurrentItem {
  obsvtrNm: string;      // 관측소명
  obsrvnDt: string;      // 예보일시 (YYYY-MM-DD HH:mm)
  crntFcstFldEbb: string; // 창조(flood) / 낙조(ebb)
  crdir: number | null;   // 유향 (deg)
  crsp: number | null;    // 유속 (cm/s)
}

/**
 * 조류예보(최강창낙조) 데이터 조회
 * @param obsCode 조류예보 지점코드 (기본: 20LTC03 외모군도남측)
 * @param numOfRows 조회 건수 (기본: 10)
 */
export async function fetchKhoaTidalCurrentForecast(options?: {
  obsCode?: string;
  numOfRows?: number;
}): Promise<KhoaTidalCurrentItem[]> {
  const apiKey = process.env.KHOA_API_KEY;
  if (!apiKey) {
    throw new Error('KHOA_API_KEY 환경변수가 설정되지 않았습니다.');
  }

  const obsCode = options?.obsCode || process.env.KHOA_TIDAL_OBS_CODE || '20LTC03';
  const numOfRows = options?.numOfRows || 10;

  const params = new URLSearchParams({
    serviceKey: apiKey,
    obsCode,
    numOfRows: numOfRows.toString(),
  });

  const response = await fetch(`${KHOA_TIDAL_CURRENT_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`KHOA 조류예보 API 오류 (${response.status}): ${response.statusText}`);
  }

  const xml = await response.text();

  // resultCode 확인
  const codeMatch = xml.match(/<resultCode>(\d+)<\/resultCode>/);
  if (codeMatch && codeMatch[1] !== '00') {
    const msgMatch = xml.match(/<resultMsg>([^<]+)<\/resultMsg>/);
    throw new Error(`KHOA 조류예보 API 에러 [${codeMatch[1]}]: ${msgMatch?.[1] || '알 수 없는 오류'}`);
  }

  const items: KhoaTidalCurrentItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    items.push({
      obsvtrNm: extractXmlText(itemXml, 'obsvtrNm') || '',
      obsrvnDt: extractXmlText(itemXml, 'obsrvnDt') || '',
      crntFcstFldEbb: extractXmlText(itemXml, 'crntFcstFldEbb') || '',
      crdir: parseXmlNumber(itemXml, 'crdir'),
      crsp: parseXmlNumber(itemXml, 'crsp'),
    });
  }

  return items;
}

/**
 * 오늘 날짜의 조류예보에서 최대 유속 데이터 추출
 * 데이터가 2025-01-01부터 시계열 순으로 저장되어 있어 페이지 추정 필요
 * @returns 오늘의 최대 유속/유향 또는 null
 */
export async function getTodayTidalCurrentForecast(obsCode?: string): Promise<{
  speed: number;
  direction: number;
  type: string; // 'flood' | 'ebb'
  time: string;
} | null> {
  const apiKey = process.env.KHOA_API_KEY;
  if (!apiKey) return null;

  const code = obsCode || process.env.KHOA_TIDAL_OBS_CODE || '20LTC03';

  // 오늘 날짜 (KST)
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const todayStr = kst.toISOString().split('T')[0];

  // 날짜 기반 페이지 추정: 2025-01-01부터 하루 ~4건, 300건/페이지
  const startDate = new Date('2025-01-01');
  const daysSinceStart = Math.floor((kst.getTime() - startDate.getTime()) / 86400000);
  const estimatedIndex = daysSinceStart * 4; // 하루 약 4건
  const estimatedPage = Math.max(1, Math.floor(estimatedIndex / 300) + 1);

  // 추정 페이지 ± 1 범위 검색
  for (const page of [estimatedPage, estimatedPage - 1, estimatedPage + 1]) {
    if (page < 1) continue;
    try {
      const params = new URLSearchParams({
        serviceKey: apiKey,
        obsCode: code,
        numOfRows: '300',
        pageNo: page.toString(),
      });
      const response = await fetch(`${KHOA_TIDAL_CURRENT_URL}?${params.toString()}`);
      if (!response.ok) continue;

      const xml = await response.text();
      const codeMatch = xml.match(/<resultCode>(\d+)<\/resultCode>/);
      if (codeMatch && codeMatch[1] !== '00') continue;

      const items: KhoaTidalCurrentItem[] = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      while ((match = itemRegex.exec(xml)) !== null) {
        const x = match[1];
        const dt = extractXmlText(x, 'predcDt') || extractXmlText(x, 'obsrvnDt') || '';
        if (dt.startsWith(todayStr)) {
          items.push({
            obsvtrNm: extractXmlText(x, 'obsvtrNm') || '',
            obsrvnDt: dt,
            crntFcstFldEbb: extractXmlText(x, 'crntFcstFldEbb') || '',
            crdir: parseXmlNumber(x, 'crdir'),
            crsp: parseXmlNumber(x, 'crsp'),
          });
        }
      }

      if (items.length === 0) continue;

      // 최대 유속 항목 선택
      let maxItem: KhoaTidalCurrentItem | null = null;
      let maxSpeed = -1;
      for (const item of items) {
        if (item.crsp !== null && item.crsp > maxSpeed) {
          maxSpeed = item.crsp;
          maxItem = item;
        }
      }

      if (!maxItem || maxItem.crsp === null) continue;

      return {
        speed: maxItem.crsp,
        direction: maxItem.crdir ?? 0,
        type: maxItem.crntFcstFldEbb.includes('창') ? 'flood' : 'ebb',
        time: maxItem.obsrvnDt,
      };
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * 관측소 코드 목록 (HWP 가이드 기준)
 */
export const KHOA_STATIONS: Record<string, string> = {
  DT_0001: '인천', DT_0002: '평택', DT_0003: '영광', DT_0004: '제주',
  DT_0005: '부산', DT_0006: '묵호', DT_0007: '목포', DT_0008: '안산',
  DT_0010: '서귀포', DT_0011: '후포', DT_0012: '속초', DT_0013: '울릉도',
  DT_0014: '통영', DT_0016: '여수', DT_0017: '대산', DT_0018: '군산',
  DT_0020: '울산', DT_0021: '추자도', DT_0022: '성산포', DT_0023: '모슬포',
  DT_0024: '장항', DT_0025: '보령', DT_0026: '고흥발포', DT_0027: '완도',
  DT_0028: '진도', DT_0029: '거제도', DT_0031: '거문도', DT_0032: '강화대교',
  DT_0035: '흑산도', DT_0037: '어청도', DT_0039: '왕돌초', DT_0042: '교본초',
  DT_0043: '영흥도', DT_0044: '영종대교', DT_0049: '광양', DT_0050: '태안',
  DT_0051: '서천마량', DT_0052: '인천송도', DT_0056: '부산항신항',
  DT_0057: '동해항', DT_0061: '삼천포', DT_0062: '마산', DT_0063: '가덕도',
  DT_0065: '덕적도', DT_0066: '향화도', DT_0067: '안흥', DT_0068: '위도',
  DT_0091: '포항', DT_0092: '여호항', DT_0093: '소무의도', DT_0094: '서거차도',
  DT_0902: '포항시청_냉천항만교(수위)',
  IE_0060: '이어도', IE_0061: '신안가거초', IE_0062: '옹진소청초',
};
