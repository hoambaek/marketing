'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, Image as ImageIcon, Youtube, Link, Loader2, Trash2, ExternalLink } from 'lucide-react';
import { Attachment, AttachmentType } from '@/lib/types';
import { toast } from '@/lib/store/toast-store';

interface FileUploadProps {
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

// 유튜브 URL에서 비디오 ID 추출
function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// 유튜브 썸네일 URL 생성
function getYoutubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

// 파일 아이콘 선택
function getFileIcon(type: AttachmentType) {
  if (type === 'youtube') return Youtube;
  if (type === 'image') return ImageIcon;
  return FileText;
}

// 파일 크기 포맷
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// 크기 제한
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const DIRECT_UPLOAD_LIMIT = 4 * 1024 * 1024; // 4MB - Vercel 제한

export default function FileUpload({
  attachments,
  onChange,
  maxFiles = 10,
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Presigned URL로 직접 업로드 (큰 파일용)
  const uploadWithPresignedUrl = async (file: File): Promise<Attachment | null> => {
    try {
      // 1. Presigned URL 요청
      const params = new URLSearchParams({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size.toString(),
      });

      const presignedResponse = await fetch(`/api/upload?${params}`);
      const presignedData = await presignedResponse.json();

      if (!presignedResponse.ok) {
        throw new Error(presignedData.error || 'Presigned URL 요청 실패');
      }

      // 2. R2에 직접 업로드
      const uploadResponse = await fetch(presignedData.presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('R2 업로드 실패');
      }

      // 3. Attachment 데이터 반환
      return {
        id: presignedData.id,
        type: presignedData.type,
        name: file.name,
        url: presignedData.publicUrl,
        size: file.size,
        mimeType: file.type,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Presigned upload error:', error);
      throw error;
    }
  };

  // 직접 업로드 (작은 파일용)
  const uploadDirect = async (file: File): Promise<Attachment | null> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      // 파일이 너무 크면 presigned URL 사용
      if (response.status === 413 || data.error === 'USE_PRESIGNED_URL') {
        return uploadWithPresignedUrl(file);
      }
      throw new Error(data.details ? `${data.error}: ${data.details}` : data.error);
    }

    return data;
  };

  // 파일 업로드 처리
  const uploadFile = async (file: File): Promise<Attachment | null> => {
    // 최대 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`파일 크기가 50MB를 초과합니다: ${file.name}`);
      return null;
    }

    try {
      // 4MB 이상이면 presigned URL 사용
      if (file.size > DIRECT_UPLOAD_LIMIT) {
        setUploadProgress(`${file.name} 업로드 중... (대용량 파일)`);
        return await uploadWithPresignedUrl(file);
      } else {
        return await uploadDirect(file);
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : '업로드 실패';
      toast.error(`${file.name}: ${errorMessage}`);
      return null;
    }
  };

  // 파일 선택 핸들러
  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || disabled) return;

      const remainingSlots = maxFiles - attachments.length;
      if (remainingSlots <= 0) {
        toast.error(`최대 ${maxFiles}개의 파일만 첨부할 수 있습니다.`);
        return;
      }

      const filesToUpload = Array.from(files).slice(0, remainingSlots);
      setIsUploading(true);

      const uploadedFiles: Attachment[] = [];
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        setUploadProgress(`${file.name} 업로드 중... (${i + 1}/${filesToUpload.length})`);
        const result = await uploadFile(file);
        if (result) {
          uploadedFiles.push(result);
        }
      }

      if (uploadedFiles.length > 0) {
        onChange([...attachments, ...uploadedFiles]);
        toast.success(`${uploadedFiles.length}개의 파일이 업로드되었습니다.`);
      }

      setIsUploading(false);
      setUploadProgress('');
    },
    [attachments, onChange, maxFiles, disabled]
  );

  // 드래그 앤 드롭 핸들러
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!disabled) {
        handleFileSelect(e.dataTransfer.files);
      }
    },
    [handleFileSelect, disabled]
  );

  // 유튜브 링크 추가
  const handleAddYoutube = useCallback(() => {
    if (!youtubeUrl.trim()) return;

    const videoId = extractYoutubeId(youtubeUrl);
    if (!videoId) {
      toast.error('유효한 유튜브 URL을 입력해주세요.');
      return;
    }

    const newAttachment: Attachment = {
      id: `yt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      type: 'youtube',
      name: '유튜브 영상',
      url: youtubeUrl,
      thumbnailUrl: getYoutubeThumbnail(videoId),
      createdAt: new Date().toISOString(),
    };

    onChange([...attachments, newAttachment]);
    setYoutubeUrl('');
    setShowYoutubeInput(false);
    toast.success('유튜브 영상이 추가되었습니다.');
  }, [youtubeUrl, attachments, onChange]);

  // 첨부파일 삭제
  const handleRemove = useCallback(
    (id: string) => {
      onChange(attachments.filter((a) => a.id !== id));
    },
    [attachments, onChange]
  );

  return (
    <div className="space-y-3">
      {/* 업로드 영역 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-4 transition-all
          ${isDragging ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.hwp"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-2 text-center">
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
              <p className="text-sm text-muted-foreground">{uploadProgress || '업로드 중...'}</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-sm text-foreground">
                  파일을 드래그하거나 클릭하여 업로드
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  이미지, PDF, 문서 (최대 50MB)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 유튜브 링크 추가 버튼 */}
      {!showYoutubeInput ? (
        <button
          type="button"
          onClick={() => setShowYoutubeInput(true)}
          disabled={disabled}
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50"
        >
          <Youtube className="w-4 h-4 text-red-500" />
          유튜브 영상 추가
        </button>
      ) : (
        <div className="flex gap-2">
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="유튜브 URL 입력 (예: https://youtube.com/watch?v=...)"
            className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            onKeyDown={(e) => e.key === 'Enter' && handleAddYoutube()}
          />
          <button
            type="button"
            onClick={handleAddYoutube}
            className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            <Link className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setShowYoutubeInput(false);
              setYoutubeUrl('');
            }}
            className="px-3 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 첨부파일 목록 */}
      <AnimatePresence mode="popLayout">
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {attachments.map((attachment) => {
              const Icon = getFileIcon(attachment.type);
              return (
                <motion.div
                  key={attachment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl group"
                >
                  {/* 썸네일 또는 아이콘 */}
                  <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                    {attachment.type === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="w-full h-full object-cover"
                      />
                    ) : attachment.type === 'youtube' && attachment.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={attachment.thumbnailUrl}
                        alt={attachment.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    {attachment.type === 'youtube' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                          <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white border-b-[5px] border-b-transparent ml-0.5" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 파일 정보 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{attachment.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {attachment.type === 'youtube'
                        ? '유튜브 영상'
                        : attachment.size
                        ? formatFileSize(attachment.size)
                        : '파일'}
                    </p>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => handleRemove(attachment.id)}
                        className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 파일 개수 표시 */}
      {attachments.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          {attachments.length} / {maxFiles} 파일
        </p>
      )}
    </div>
  );
}
