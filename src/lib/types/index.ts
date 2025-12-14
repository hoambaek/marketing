// ═══════════════════════════════════════════════════════════════════════════
// 뮤즈드마레 마스터플랜 - 타입 정의
// ═══════════════════════════════════════════════════════════════════════════

// 업무 카테고리
export type TaskCategory = 'operation' | 'marketing' | 'design' | 'filming' | 'pr' | 'b2b';

// 업무 상태
export type TaskStatus = 'pending' | 'in_progress' | 'done';

// 콘텐츠 타입
export type ContentType = 'instagram' | 'youtube' | 'blog' | 'newsletter' | 'press';

// 콘텐츠 상태
export type ContentStatus = 'draft' | 'scheduled' | 'published';

// KPI 카테고리
export type KPICategory = 'instagram' | 'youtube' | 'newsletter' | 'website' | 'press' | 'b2b';

// 콘텐츠 타입 라벨
export const CONTENT_TYPES: Record<ContentType, string> = {
  instagram: '인스타그램',
  youtube: '유튜브',
  blog: '블로그',
  newsletter: '뉴스레터',
  press: '보도자료',
};

// 업무 항목
export interface Task {
  id: string;
  title: string;
  description?: string;
  year: number;
  month: number;
  week: number;
  category: TaskCategory;
  status: TaskStatus;
  assignee?: string;
  dueDate?: string;
  deliverables?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Must-Do 항목 (레거시 - 이슈관리로 대체)
export interface MustDoItem {
  id: string;
  year: number;
  month: number;
  title: string;
  done: boolean;
  category: TaskCategory;
}

// ═══════════════════════════════════════════════════════════════════════════
// 이슈/리스크 관리 타입 정의
// ═══════════════════════════════════════════════════════════════════════════

// 이슈 유형
export type IssueType = 'issue' | 'risk' | 'decision';

// 이슈 우선순위
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';

// 이슈 영향도
export type IssueImpact = 'low' | 'medium' | 'high';

// 이슈 상태
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

// 이슈 항목
export interface IssueItem {
  id: string;
  year: number;
  month: number;
  title: string;
  type: IssueType;
  priority: IssuePriority;
  impact: IssueImpact;
  status: IssueStatus;
  category: TaskCategory;
  description?: string;
  owner?: string;
  dueDate?: string;
  resolution?: string;
  relatedTaskId?: string; // 연관된 월별플랜 업무 ID
  relatedTaskTitle?: string; // 연관된 업무 제목 (조회용)
  createdAt: string;
  updatedAt: string;
}

// 이슈 유형 라벨
export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  issue: '이슈',
  risk: '리스크',
  decision: '의사결정',
};

// 이슈 유형 색상
export const ISSUE_TYPE_COLORS: Record<IssueType, { bg: string; text: string; border: string }> = {
  issue: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  risk: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  decision: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
};

// 이슈 우선순위 라벨
export const ISSUE_PRIORITY_LABELS: Record<IssuePriority, string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
  critical: '긴급',
};

// 이슈 우선순위 색상
export const ISSUE_PRIORITY_COLORS: Record<IssuePriority, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
  medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  high: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  critical: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
};

// 이슈 영향도 라벨
export const ISSUE_IMPACT_LABELS: Record<IssueImpact, string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
};

// 이슈 상태 라벨
export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  open: '미해결',
  in_progress: '진행중',
  resolved: '해결됨',
  closed: '종료',
};

// 이슈 상태 색상
export const ISSUE_STATUS_COLORS: Record<IssueStatus, { bg: string; text: string; border: string }> = {
  open: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  in_progress: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  resolved: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  closed: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
};

// 주차 데이터
export interface WeekData {
  week: number;
  title: string;
  tasks: Task[];
}

// 월별 데이터
export interface MonthData {
  id: number;
  name: string;
  shortName: string;
  title: string;
  phase: number;
  phaseName: string;
  description: string;
}

// 콘텐츠 캘린더 항목
export interface ContentItem {
  id: string;
  year: number;
  type: ContentType;
  title: string;
  description?: string;
  date: string;
  status: ContentStatus;
}

// KPI 항목
export interface KPIItem {
  id: string;
  year: number;
  month: number;
  category: KPICategory;
  metric: string;
  current: number;
  target: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// 재고관리 타입 정의
// ═══════════════════════════════════════════════════════════════════════════

// 상품 타입
export type ProductType = 'first_edition' | 'en_lieu_sur_brut' | 'en_lieu_sur_magnum' | 'element_de_surprise' | 'atomes_crochus';

// 상품 사이즈
export type BottleSize = '750ml' | '1500ml';

// 재고 상태
export type InventoryStatus = 'available' | 'reserved' | 'sold' | 'gifted' | 'damaged';

// 상품 정보
export interface Product {
  id: ProductType;
  name: string;
  nameKo: string;
  year: number;
  size: BottleSize;
  totalQuantity: number;
  isNumbered: boolean;
  description?: string;
}

// 개별 병 재고 (2025 First Edition - 넘버링 추적)
export interface NumberedBottle {
  id: string;
  productId: ProductType;
  bottleNumber: number;
  status: InventoryStatus;
  reservedFor?: string;
  soldTo?: string;
  giftedTo?: string;
  soldDate?: string;
  price?: number;
  notes?: string;
}

// 일반 재고 (2026 제품 - 수량 추적)
export interface InventoryBatch {
  id: string;
  productId: ProductType;
  available: number;
  reserved: number;
  sold: number;
  gifted: number;
  damaged: number;
  lastUpdated: string;
}

// 재고 거래 기록
export interface InventoryTransaction {
  id: string;
  productId: ProductType;
  bottleNumber?: number;
  type: 'sale' | 'reservation' | 'gift' | 'damage' | 'return' | 'cancel_reservation';
  quantity: number;
  customerName?: string;
  price?: number;
  notes?: string;
  createdAt: string;
}

// 상품 목록
export const PRODUCTS: Product[] = [
  {
    id: 'first_edition',
    name: '2025 First Edition',
    nameKo: '2025 퍼스트 에디션',
    year: 2025,
    size: '750ml',
    totalQuantity: 50,
    isNumbered: true,
    description: '한정판 넘버링 에디션 (1-50)',
  },
  {
    id: 'en_lieu_sur_brut',
    name: 'En Lieu Sur Brut',
    nameKo: '앙 리유 쉬르 브뤼',
    year: 2026,
    size: '750ml',
    totalQuantity: 210,
    isNumbered: false,
    description: '2026 레귤러 브뤼',
  },
  {
    id: 'en_lieu_sur_magnum',
    name: 'En Lieu Sur Magnum',
    nameKo: '앙 리유 쉬르 매그넘',
    year: 2026,
    size: '1500ml',
    totalQuantity: 24,
    isNumbered: false,
    description: '2026 매그넘 에디션',
  },
  {
    id: 'element_de_surprise',
    name: 'Élément de Surprise BDB',
    nameKo: '엘레멘 드 쉬르프리즈 BDB',
    year: 2026,
    size: '750ml',
    totalQuantity: 120,
    isNumbered: false,
    description: '블랑 드 블랑',
  },
  {
    id: 'atomes_crochus',
    name: 'Atomes Crochus Extra Brut',
    nameKo: '아톰 크로슈 엑스트라 브뤼',
    year: 2026,
    size: '750ml',
    totalQuantity: 144,
    isNumbered: false,
    description: '엑스트라 브뤼',
  },
];

// 재고 상태 라벨
export const INVENTORY_STATUS_LABELS: Record<InventoryStatus, string> = {
  available: '판매 가능',
  reserved: '예약됨',
  sold: '판매 완료',
  gifted: '증정',
  damaged: '손상',
};

// 재고 상태 색상 (Tailwind 클래스)
export const INVENTORY_STATUS_COLORS: Record<InventoryStatus, string> = {
  available: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  reserved: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  sold: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  gifted: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  damaged: 'bg-red-500/20 text-red-400 border-red-500/30',
};

// 카테고리 라벨
export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  operation: '운영',
  marketing: '마케팅',
  design: '디자인',
  filming: '촬영',
  pr: 'PR',
  b2b: 'B2B',
};

// 카테고리 색상
export const CATEGORY_COLORS: Record<TaskCategory, string> = {
  operation: 'badge-operation',
  marketing: 'badge-marketing',
  design: 'badge-design',
  filming: 'badge-filming',
  pr: 'badge-pr',
  b2b: 'badge-b2b',
};

// 상태 라벨
export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: '대기',
  in_progress: '진행중',
  done: '완료',
};

// 페이즈 정보
export const PHASE_INFO = [
  { id: 1, name: '세계관 구축', months: [1, 2, 3], color: '#1A365D', description: '브랜드 아이덴티티와 스토리텔링 기반 구축' },
  { id: 2, name: '기대감 조성', months: [4, 5], color: '#2D4A6F', description: '타겟 오디언스 시딩 및 PR 본격화' },
  { id: 3, name: '클라이맥스', months: [6], color: '#B7916E', description: '인양 이벤트 및 미디어 집중' },
  { id: 4, name: '런칭 & 확산', months: [7, 8], color: '#D4A574', description: '그랜드 런칭 및 세일즈 확대' },
  { id: 5, name: '성장 & 확장', months: [9, 10, 11, 12], color: '#8B7355', description: '시장 확대 및 브랜드 성장' },
];

// 지원 년도
export const AVAILABLE_YEARS = [2026, 2027, 2028];

// ═══════════════════════════════════════════════════════════════════════════
// 예산관리 타입 정의
// ═══════════════════════════════════════════════════════════════════════════

// 예산 카테고리
export type BudgetCategory = 'marketing' | 'operation' | 'design' | 'filming' | 'pr' | 'b2b' | 'packaging' | 'event' | 'other';

// 예산 카테고리 라벨
export const BUDGET_CATEGORY_LABELS: Record<BudgetCategory, string> = {
  marketing: '마케팅',
  operation: '운영',
  design: '디자인',
  filming: '촬영',
  pr: 'PR',
  b2b: 'B2B',
  packaging: '패키징',
  event: '이벤트',
  other: '기타',
};

// 예산 카테고리 색상
export const BUDGET_CATEGORY_COLORS: Record<BudgetCategory, { bg: string; text: string; border: string }> = {
  marketing: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
  operation: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  design: { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30' },
  filming: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  pr: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  b2b: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  packaging: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  event: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
  other: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
};

// 예산 항목 (월별 예산)
export interface BudgetItem {
  id: string;
  year: number;
  month: number;
  category: BudgetCategory;
  budgeted: number; // 예산
  spent: number; // 지출
  description?: string;
}

// 지출 내역
export interface ExpenseItem {
  id: string;
  year: number;
  month: number;
  category: BudgetCategory;
  amount: number;
  description: string;
  vendor?: string; // 거래처
  date: string;
  receipt?: string; // 영수증 URL
  notes?: string;
}

// 월별 기본 정보
export const MONTHS_INFO: MonthData[] = [
  { id: 1, name: '1월', shortName: 'Jan', title: '기반 구축의 달', phase: 1, phaseName: '세계관 구축', description: '샴페인 도착, 해저 입수, 브랜드 아이덴티티 작업' },
  { id: 2, name: '2월', shortName: 'Feb', title: '브랜드 구축의 달', phase: 1, phaseName: '세계관 구축', description: '로고 확정, 패키지 디자인, SNS 채널 개설' },
  { id: 3, name: '3월', shortName: 'Mar', title: '콘텐츠 본격화의 달', phase: 1, phaseName: '세계관 구축', description: '브랜드 필름 공개, 콘텐츠 시리즈 시작' },
  { id: 4, name: '4월', shortName: 'Apr', title: '시딩의 달', phase: 2, phaseName: '기대감 조성', description: '인플루언서 시딩, VIP 프리뷰 시작' },
  { id: 5, name: '5월', shortName: 'May', title: 'PR 본격화의 달', phase: 2, phaseName: '기대감 조성', description: '언론 보도, 미디어 인터뷰, B2B 영업' },
  { id: 6, name: '6월', shortName: 'Jun', title: '인양의 달', phase: 3, phaseName: '클라이맥스', description: '인양 이벤트, 라이브 중계, 미디어 집중' },
  { id: 7, name: '7월', shortName: 'Jul', title: '런칭 준비의 달', phase: 4, phaseName: '런칭 & 확산', description: '팝업 스토어 준비, 최종 점검' },
  { id: 8, name: '8월', shortName: 'Aug', title: '런칭의 달', phase: 4, phaseName: '런칭 & 확산', description: '그랜드 런칭, 판매 시작' },
  { id: 9, name: '9월', shortName: 'Sep', title: '시장 안착의 달', phase: 5, phaseName: '성장 & 확장', description: '판매 채널 확대, 고객 피드백 수집' },
  { id: 10, name: '10월', shortName: 'Oct', title: '브랜드 강화의 달', phase: 5, phaseName: '성장 & 확장', description: '시즌 캠페인, 콜라보레이션' },
  { id: 11, name: '11월', shortName: 'Nov', title: '확장의 달', phase: 5, phaseName: '성장 & 확장', description: '해외 진출 준비, 연말 프로모션' },
  { id: 12, name: '12월', shortName: 'Dec', title: '결산의 달', phase: 5, phaseName: '성장 & 확장', description: '연간 성과 분석, 차년도 전략 수립' },
];

// ═══════════════════════════════════════════════════════════════════════════
// 해저숙성 데이터로그 타입 정의
// ═══════════════════════════════════════════════════════════════════════════

// 완도 해역 좌표
export const WANDO_COORDINATES = {
  latitude: 34.31,
  longitude: 126.76,
  name: '완도 해역',
} as const;

// 기본 숙성 깊이 (미터)
export const DEFAULT_AGING_DEPTH = 30;

// 시간 뷰 타입
export type OceanDataView = 'daily' | 'monthly' | 'full_cycle';

// 해양 데이터 (시간별)
export interface OceanDataHourly {
  time: string;
  seaTemperature: number | null;
  currentVelocity: number | null;
  currentDirection: number | null;
  waveHeight: number | null;
  waveDirection: number | null;
  wavePeriod: number | null;
  surfacePressure: number | null;
  airTemperature: number | null;
  humidity: number | null;
}

// 해양 데이터 (일별 집계)
export interface OceanDataDaily {
  id: string;
  date: string;
  // 수온
  seaTemperatureAvg: number | null;
  seaTemperatureMin: number | null;
  seaTemperatureMax: number | null;
  // 해류
  currentVelocityAvg: number | null;
  currentDirectionDominant: number | null;
  // 파고
  waveHeightAvg: number | null;
  waveHeightMax: number | null;
  // 기상
  surfacePressureAvg: number | null;
  airTemperatureAvg: number | null;
  humidityAvg: number | null;
  // 수동 입력
  salinity: number | null;
  // 메타데이터
  depth: number;
  createdAt: string;
  updatedAt: string;
}

// 염도 기록
export interface SalinityRecord {
  id: string;
  measuredAt: string;
  salinity: number;
  depth: number | null;
  notes: string | null;
  createdAt: string;
}

// 현재 상태 데이터
export interface CurrentOceanConditions {
  seaTemperature: number | null;
  currentVelocity: number | null;
  currentDirection: number | null;
  waveHeight: number | null;
  surfacePressure: number | null;
  waterPressure: number | null; // 계산값
  salinity: number | null; // 최근 수동 입력값
  lastUpdated: string;
}

// Open-Meteo API 응답 타입
export interface OpenMeteoMarineResponse {
  latitude: number;
  longitude: number;
  hourly: {
    time: string[];
    sea_surface_temperature?: (number | null)[];
    ocean_current_velocity?: (number | null)[];
    ocean_current_direction?: (number | null)[];
    wave_height?: (number | null)[];
    wave_direction?: (number | null)[];
    wave_period?: (number | null)[];
  };
  daily?: {
    time: string[];
    sea_surface_temperature_max?: (number | null)[];
    wave_height_max?: (number | null)[];
  };
}

export interface OpenMeteoWeatherResponse {
  latitude: number;
  longitude: number;
  hourly: {
    time: string[];
    surface_pressure?: (number | null)[];
    temperature_2m?: (number | null)[];
    relative_humidity_2m?: (number | null)[];
  };
}

// 차트 데이터 포인트
export interface OceanChartDataPoint {
  date: string;
  label: string;
  seaTemperature?: number | null;
  seaTemperatureMin?: number | null;
  seaTemperatureMax?: number | null;
  currentVelocity?: number | null;
  waveHeight?: number | null;
  waveHeightMax?: number | null;
  surfacePressure?: number | null;
  waterPressure?: number | null;
  salinity?: number | null;
}

// 데이터 상태 라벨
export const OCEAN_DATA_LABELS: Record<string, { name: string; unit: string; color: string }> = {
  seaTemperature: { name: '수온', unit: '°C', color: '#22d3ee' },
  currentVelocity: { name: '해류 속도', unit: 'm/s', color: '#a78bfa' },
  waveHeight: { name: '파고', unit: 'm', color: '#60a5fa' },
  surfacePressure: { name: '기압', unit: 'hPa', color: '#f472b6' },
  waterPressure: { name: '수압', unit: '기압', color: '#fb923c' },
  salinity: { name: '염도', unit: '‰', color: '#34d399' },
};
