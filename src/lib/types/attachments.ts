/**
 * 첨부파일 타입 정의
 */

// 첨부파일 유형
export type AttachmentType = 'image' | 'document' | 'youtube';

// 첨부파일 항목
export interface Attachment {
  id: string;
  type: AttachmentType;
  name: string;
  url: string;
  thumbnailUrl?: string; // 이미지/유튜브 썸네일
  size?: number; // 파일 크기 (bytes)
  mimeType?: string;
  createdAt: string;
}

// 첨부파일 유형 라벨
export const ATTACHMENT_TYPE_LABELS: Record<AttachmentType, string> = {
  image: '이미지',
  document: '문서',
  youtube: '유튜브',
};

// 허용된 파일 확장자
export const ALLOWED_FILE_EXTENSIONS = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.hwp'],
};

// 최대 파일 크기 (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
