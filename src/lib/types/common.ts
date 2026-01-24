/**
 * 공통 타입 정의
 */

// 업무 카테고리
export type TaskCategory = 'operation' | 'marketing' | 'design' | 'filming' | 'pr' | 'b2b';

// 업무 상태
export type TaskStatus = 'pending' | 'in_progress' | 'done';

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
