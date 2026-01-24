/**
 * 업무/콘텐츠 관련 타입 정의
 */

import type { TaskCategory, TaskStatus } from './common';
import type { Attachment } from './attachments';

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
  attachments?: Attachment[];
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
