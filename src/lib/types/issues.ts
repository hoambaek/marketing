/**
 * 이슈/리스크 관리 타입 정의
 */

import type { TaskCategory } from './common';
import type { Attachment } from './attachments';

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
  attachments?: Attachment[];
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
