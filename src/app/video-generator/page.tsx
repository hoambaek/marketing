'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useCallback } from 'react';
import { Footer } from '@/components/layout/Footer';
import { logger } from '@/lib/logger';
import {
  Video,
  Upload,
  Sparkles,
  Download,
  Loader2,
  X,
  Image as ImageIcon,
  Play,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

type GenerationStatus = 'idle' | 'uploading' | 'generating' | 'polling' | 'complete' | 'error';
type ModelTab = 'veo' | 'seedance' | 'seedance15';

interface VideoResult {
  uri: string;
  mimeType: string;
}

// ─── 공통 상태 훅 ───
function useVideoGenerator() {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [videoResult, setVideoResult] = useState<VideoResult | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isGenerating = status === 'uploading' || status === 'generating' || status === 'polling';

  const resetForm = useCallback(() => {
    setPrompt('');
    setStatus('idle');
    setStatusMessage('');
    setErrorMessage('');
    setVideoResult(null);
    if (pollingRef.current) clearInterval(pollingRef.current);
  }, []);

  const startPolling = useCallback((pollFn: () => Promise<void>, intervalMs = 10000, delayMs = 5000) => {
    pollingRef.current = setInterval(pollFn, intervalMs);
    setTimeout(pollFn, delayMs);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
  }, []);

  return {
    prompt, setPrompt,
    status, setStatus,
    statusMessage, setStatusMessage,
    errorMessage, setErrorMessage,
    videoResult, setVideoResult,
    isGenerating, resetForm, startPolling, stopPolling,
  };
}

// ─── 이미지 업로드 훅 ───
function useImageUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFile(f);
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(f);
  }, []);

  const remove = useCallback(() => {
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  return { file, preview, isDragging, setIsDragging, inputRef, processFile, remove };
}

// ─── 이미지 업로드 UI 컴포넌트 ───
function ImageUploadBox({
  label,
  placeholder,
  upload,
  disabled,
}: {
  label: string;
  placeholder: string;
  upload: ReturnType<typeof useImageUpload>;
  disabled: boolean;
}) {
  return (
    <div>
      <label className="block text-sm text-white/60 mb-3">
        <ImageIcon className="w-4 h-4 inline-block mr-2" />
        {label}
      </label>
      <input
        ref={upload.inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && upload.processFile(e.target.files[0])}
        className="hidden"
        disabled={disabled}
      />
      {upload.preview ? (
        <div className="relative rounded-xl overflow-hidden border border-white/10 inline-block">
          <Image src={upload.preview} alt={label} width={300} height={200} className="max-h-[200px] w-auto object-contain" />
          <button onClick={upload.remove} disabled={disabled} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-black/80 transition-colors disabled:opacity-50">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => !disabled && upload.inputRef.current?.click()}
          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); upload.setIsDragging(true); }}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); upload.setIsDragging(false); }}
          onDrop={!disabled ? (e) => { e.preventDefault(); e.stopPropagation(); upload.setIsDragging(false); if (e.dataTransfer.files[0]) upload.processFile(e.dataTransfer.files[0]); } : undefined}
          className={`w-full py-10 border-2 border-dashed rounded-xl transition-all cursor-pointer text-center ${
            disabled ? 'opacity-50 cursor-not-allowed border-white/20'
              : upload.isDragging ? 'border-[#ccb69a] bg-[#ccb69a]/10 scale-[1.02]'
              : 'border-white/20 hover:border-[#ccb69a]/50 hover:bg-white/[0.02]'
          }`}
        >
          <Upload className={`w-8 h-8 mx-auto mb-3 transition-colors ${upload.isDragging ? 'text-[#ccb69a]' : 'text-white/30'}`} />
          <p className={`text-sm ${upload.isDragging ? 'text-[#ccb69a]' : 'text-white/40'}`}>
            {upload.isDragging ? '여기에 놓으세요' : placeholder}
          </p>
          <p className="text-xs text-white/25 mt-1">클릭 또는 드래그 앤 드롭</p>
        </div>
      )}
    </div>
  );
}

// ─── 상태/영상 프리뷰/버튼 공통 UI ───
function StatusAndActions({
  gen,
  videoSrc,
  videoLabel,
  onGenerate,
  onDownload,
}: {
  gen: ReturnType<typeof useVideoGenerator>;
  videoSrc: string | null;
  videoLabel: string;
  onGenerate: () => void;
  onDownload: () => void;
}) {
  return (
    <>
      {/* Status */}
      <AnimatePresence mode="wait">
        {(gen.status !== 'idle' || gen.errorMessage) && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6">
            {gen.errorMessage && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{gen.errorMessage}</p>
              </div>
            )}
            {gen.status === 'complete' && !gen.errorMessage && (
              <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <p className="text-sm text-emerald-300">{gen.statusMessage}</p>
              </div>
            )}
            {gen.isGenerating && (
              <div className="flex items-center gap-3 p-4 bg-[#ccb69a]/10 border border-[#ccb69a]/20 rounded-xl">
                <Loader2 className="w-5 h-5 text-[#ccb69a] animate-spin flex-shrink-0" />
                <div>
                  <p className="text-sm text-[#ccb69a]">{gen.statusMessage}</p>
                  <p className="text-xs text-white/40 mt-1">페이지를 벗어나지 마세요</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Preview */}
      <AnimatePresence>
        {gen.videoResult && videoSrc && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="mb-6">
            <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/30">
              <video src={videoSrc} controls className="w-full aspect-video" playsInline>
                브라우저가 비디오 재생을 지원하지 않습니다.
              </video>
            </div>
            <p className="text-xs text-white/40 mt-2 text-center">{videoLabel}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {gen.status === 'complete' && gen.videoResult ? (
          <>
            <button onClick={onDownload} className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#9a754b] to-[#ccb69a] text-white rounded-xl font-medium hover:opacity-90 transition-opacity">
              <Download className="w-5 h-5" />
              <span>영상 다운로드</span>
            </button>
            <button onClick={gen.resetForm} className="px-6 py-4 border border-white/10 text-white/70 rounded-xl hover:bg-white/[0.05] hover:text-white transition-all">
              새로 만들기
            </button>
          </>
        ) : (
          <>
            <button onClick={onGenerate} disabled={gen.isGenerating || !gen.prompt.trim()} className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#9a754b] to-[#ccb69a] text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
              {gen.isGenerating ? (<><Loader2 className="w-5 h-5 animate-spin" /><span>생성 중...</span></>) : (<><Video className="w-5 h-5" /><span>영상 생성하기</span></>)}
            </button>
            {gen.isGenerating && (
              <button onClick={gen.resetForm} className="px-6 py-4 border border-white/10 text-white/50 rounded-xl hover:bg-white/[0.05] hover:text-white/70 transition-all">
                취소
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}

// ─── Veo 3.1 탭 ───
function VeoTab() {
  const gen = useVideoGenerator();
  const firstFrame = useImageUpload();

  const getProxiedUrl = (uri: string) => `/api/video-generator/download?uri=${encodeURIComponent(uri)}`;

  const pollVeo = useCallback(async (opName: string) => {
    try {
      const res = await fetch(`/api/video-generator?operation=${encodeURIComponent(opName)}`);
      const data = await res.json();
      if (data.error) { gen.setStatus('error'); gen.setErrorMessage(data.error); gen.stopPolling(); return; }
      if (data.done) {
        gen.stopPolling();
        if (data.success && data.video) { gen.setVideoResult(data.video); gen.setStatus('complete'); gen.setStatusMessage('영상 생성이 완료되었습니다!'); }
        else { gen.setStatus('error'); gen.setErrorMessage(data.error || '영상 생성에 실패했습니다.'); }
      } else { gen.setStatusMessage(data.message || '영상 생성 중...'); }
    } catch { gen.setStatus('error'); gen.setErrorMessage('상태 확인 중 오류가 발생했습니다.'); gen.stopPolling(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async () => {
    if (!gen.prompt.trim()) { gen.setErrorMessage('프롬프트를 입력해주세요.'); return; }
    gen.setStatus('uploading'); gen.setStatusMessage('영상 생성 요청 중...'); gen.setErrorMessage(''); gen.setVideoResult(null);
    try {
      const formData = new FormData();
      formData.append('prompt', gen.prompt);
      if (firstFrame.file) formData.append('firstFrame', firstFrame.file);
      const res = await fetch('/api/video-generator', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) { gen.setStatus('error'); gen.setErrorMessage(data.error); return; }
      if (data.success && data.operationName) {
        gen.setStatus('polling'); gen.setStatusMessage('영상 생성 중... (약 1-3분 소요)');
        gen.startPolling(() => pollVeo(data.operationName));
      }
    } catch (e) { logger.error('Veo error:', e); gen.setStatus('error'); gen.setErrorMessage('영상 생성 요청 중 오류가 발생했습니다.'); }
  };

  const handleDownload = async () => {
    if (!gen.videoResult?.uri) return;
    try {
      const res = await fetch(getProxiedUrl(gen.videoResult.uri));
      if (!res.ok) { gen.setErrorMessage('다운로드에 실패했습니다.'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'veo-video-1080p.mp4';
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch { gen.setErrorMessage('다운로드 중 오류가 발생했습니다.'); }
  };

  return (
    <>
      <ImageUploadBox label="첫 프레임 이미지 (선택사항)" placeholder="영상의 시작 이미지를 업로드하세요" upload={firstFrame} disabled={gen.isGenerating} />
      <div className="mt-6 mb-6">
        <label className="block text-sm text-white/60 mb-3"><Sparkles className="w-4 h-4 inline-block mr-2" />프롬프트 (영문 권장)</label>
        <textarea value={gen.prompt} onChange={(e) => gen.setPrompt(e.target.value)} placeholder="Generate a cinematic video of waves crashing against rocks at sunset..." disabled={gen.isGenerating} rows={4} className="w-full px-4 py-4 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-[#ccb69a]/30 focus:border-[#ccb69a]/50 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed" />
      </div>
      <StatusAndActions gen={gen} videoSrc={gen.videoResult ? getProxiedUrl(gen.videoResult.uri) : null} videoLabel="1080p (16:9) • 8초" onGenerate={handleGenerate} onDownload={handleDownload} />
    </>
  );
}

// ─── Seedance 탭 (2.0 / 1.5 Pro 공용) ───
function SeedanceTab({ modelId = 'seedance-2.0' }: { modelId?: string }) {
  const gen = useVideoGenerator();
  const firstFrame = useImageUpload();
  const lastFrame = useImageUpload();
  const [ratio, setRatio] = useState('16:9');
  const [duration, setDuration] = useState(5);

  const pollSeedance = useCallback(async (taskId: string) => {
    try {
      const res = await fetch(`/api/video-generator/seedance?taskId=${encodeURIComponent(taskId)}`);
      const data = await res.json();
      if (data.error) { gen.setStatus('error'); gen.setErrorMessage(data.error); gen.stopPolling(); return; }
      if (data.done) {
        gen.stopPolling();
        if (data.success && data.video) { gen.setVideoResult(data.video); gen.setStatus('complete'); gen.setStatusMessage('영상 생성이 완료되었습니다!'); }
        else { gen.setStatus('error'); gen.setErrorMessage(data.error || '영상 생성에 실패했습니다.'); }
      } else { gen.setStatusMessage(data.message || '영상 생성 중...'); }
    } catch { gen.setStatus('error'); gen.setErrorMessage('상태 확인 중 오류가 발생했습니다.'); gen.stopPolling(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async () => {
    if (!gen.prompt.trim()) { gen.setErrorMessage('프롬프트를 입력해주세요.'); return; }
    if (modelId === 'seedance-1.5-pro' && !firstFrame.file) { gen.setErrorMessage('Seedance 1.5 Pro는 첫 프레임 이미지가 필수입니다.'); return; }
    gen.setStatus('uploading'); gen.setStatusMessage('영상 생성 요청 중...'); gen.setErrorMessage(''); gen.setVideoResult(null);

    try {
      // Seedance는 이미지 URL을 사용 → S3에 업로드하거나 presigned URL 필요
      // 현재는 이미지 URL 없이 text-to-video만 지원, 또는 외부 URL 직접 입력
      const body: Record<string, unknown> = { prompt: gen.prompt, ratio, duration, model: modelId };

      // 이미지가 있으면 presigned URL로 S3 업로드 후 URL 전달
      if (firstFrame.file) {
        const url = await uploadImageAndGetUrl(firstFrame.file);
        if (url) body.firstFrameUrl = url;
      }
      if (lastFrame.file) {
        const url = await uploadImageAndGetUrl(lastFrame.file);
        if (url) body.lastFrameUrl = url;
      }

      const res = await fetch('/api/video-generator/seedance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) { gen.setStatus('error'); gen.setErrorMessage(data.error); return; }
      if (data.success && data.taskId) {
        gen.setStatus('polling'); gen.setStatusMessage('영상 생성 중... (약 30초~2분 소요)');
        gen.startPolling(() => pollSeedance(data.taskId));
      }
    } catch (e) { logger.error('Seedance error:', e); gen.setStatus('error'); gen.setErrorMessage('영상 생성 요청 중 오류가 발생했습니다.'); }
  };

  const handleDownload = async () => {
    if (!gen.videoResult?.uri) return;
    try {
      // 서버 프록시를 통해 다운로드 (CORS 우회)
      const res = await fetch(`/api/video-generator/download?uri=${encodeURIComponent(gen.videoResult.uri)}`);
      if (!res.ok) { gen.setErrorMessage('다운로드에 실패했습니다.'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'seedance-video.mp4';
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch { gen.setErrorMessage('다운로드 중 오류가 발생했습니다.'); }
  };

  return (
    <>
      {/* Frame Uploads */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <ImageUploadBox label={modelId === 'seedance-1.5-pro' ? '첫 프레임 이미지 (필수)' : '첫 프레임 (선택사항)'} placeholder="영상의 시작 이미지" upload={firstFrame} disabled={gen.isGenerating} />
        <ImageUploadBox label="마지막 프레임 (선택사항)" placeholder="영상의 끝 이미지" upload={lastFrame} disabled={gen.isGenerating} />
      </div>

      {/* Prompt */}
      <div className="mb-6">
        <label className="block text-sm text-white/60 mb-3"><Sparkles className="w-4 h-4 inline-block mr-2" />프롬프트</label>
        <textarea value={gen.prompt} onChange={(e) => gen.setPrompt(e.target.value)} placeholder="Cinematic ocean wave crashing with dramatic lighting..." disabled={gen.isGenerating} rows={4} className="w-full px-4 py-4 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-[#ccb69a]/30 focus:border-[#ccb69a]/50 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed" />
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs text-white/50 mb-2">비율</label>
          <select value={ratio} onChange={(e) => setRatio(e.target.value)} disabled={gen.isGenerating} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#ccb69a]/30 disabled:opacity-50">
            <option value="16:9">16:9</option>
            <option value="9:16">9:16</option>
            <option value="1:1">1:1</option>
            <option value="4:3">4:3</option>
            <option value="3:4">3:4</option>
            <option value="21:9">21:9</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-2">길이 ({duration}초)</label>
          <input type="range" min={4} max={15} value={duration} onChange={(e) => setDuration(Number(e.target.value))} disabled={gen.isGenerating} className="w-full accent-[#ccb69a]" />
        </div>
      </div>

      <StatusAndActions gen={gen} videoSrc={gen.videoResult?.uri || null} videoLabel={`${ratio} • ${duration}초`} onGenerate={handleGenerate} onDownload={handleDownload} />
    </>
  );
}

// S3 presigned URL 업로드 헬퍼
async function uploadImageAndGetUrl(file: File): Promise<string | null> {
  try {
    // GET으로 presigned URL 발급
    const params = new URLSearchParams({
      fileName: file.name,
      fileType: file.type,
      fileSize: String(file.size),
    });
    const res = await fetch(`/api/upload?${params}`);
    if (!res.ok) {
      const err = await res.json();
      logger.error('Presigned URL 발급 실패:', err);
      return null;
    }
    const { presignedUrl, publicUrl } = await res.json();
    if (!presignedUrl) return null;

    // presigned URL로 직접 R2에 업로드
    const putRes = await fetch(presignedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!putRes.ok) {
      logger.error('R2 업로드 실패:', putRes.status);
      return null;
    }

    return publicUrl;
  } catch (e) {
    logger.error('Image upload failed:', e);
    return null;
  }
}

// ─── 메인 페이지 ───
export default function VideoGeneratorPage() {
  const [activeTab, setActiveTab] = useState<ModelTab>('veo');

  const tabs: { id: ModelTab; label: string; desc: string }[] = [
    { id: 'veo', label: 'Google Veo 3.1', desc: '1080p • 8초 • 첫 프레임' },
    { id: 'seedance', label: 'Seedance 2.0', desc: '720p~1080p • 4~15초 • 첫/마지막 프레임' },
    { id: 'seedance15', label: 'Seedance 1.5 Pro', desc: '이미지→영상 • 4~15초 • 첫/마지막 프레임' },
  ];

  return (
    <div className="min-h-screen pb-20">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#070b12] via-[#0a1018] to-[#0d1525]" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#b7916e]/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/[0.02] rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />
      </div>

      {/* Header */}
      <section className="relative pt-8 sm:pt-16 pb-6 sm:pb-8 px-4 sm:px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <Link href="/settings" className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">설정으로 돌아가기</span>
          </Link>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}>
            <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="text-[#ccb69a] text-[10px] sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-2 sm:mb-4 font-light">
              AI Video Generation
            </motion.p>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl text-white/95 mb-4 sm:mb-6 leading-[1.1] tracking-tight" style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}>
              영상 <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ccb69a] via-[#9a754b] to-[#ccb69a]">생성기</span>
            </h1>
            <p className="text-white/50 text-sm sm:text-lg max-w-xl">
              AI 모델을 선택하여 프롬프트와 이미지로 영상을 생성합니다.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="max-w-4xl mx-auto">

          {/* Tab Selector */}
          <div className="flex gap-2 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 rounded-xl border text-left transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#ccb69a]/10 border-[#ccb69a]/40 text-white'
                    : 'bg-white/[0.02] border-white/[0.06] text-white/50 hover:border-white/15 hover:text-white/70'
                }`}
              >
                <p className="text-sm font-medium">{tab.label}</p>
                <p className="text-xs mt-0.5 opacity-60">{tab.desc}</p>
              </button>
            ))}
          </div>

          {/* Card */}
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xl" />
            <div className="absolute inset-0 border border-white/10 rounded-2xl sm:rounded-3xl" />
            <div className="relative p-6 sm:p-8 lg:p-10">
              {activeTab === 'veo' && <VeoTab />}
              {activeTab === 'seedance' && <SeedanceTab key="seedance-2.0" modelId="seedance-2.0" />}
              {activeTab === 'seedance15' && <SeedanceTab key="seedance-1.5-pro" modelId="seedance-1.5-pro" />}
            </div>
          </div>

          {/* Info Section */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 grid sm:grid-cols-3 gap-4">
            {(activeTab === 'veo' ? [
              { label: '해상도', value: '1080p (Full HD)', icon: Video },
              { label: '비율', value: '16:9 와이드스크린', icon: Play },
              { label: '생성 시간', value: '약 1-3분', icon: Sparkles },
            ] : activeTab === 'seedance' ? [
              { label: '해상도', value: '720p ~ 1080p', icon: Video },
              { label: '비율', value: '16:9 / 9:16 / 1:1 등', icon: Play },
              { label: '영상 길이', value: '4~15초 조절 가능', icon: Sparkles },
            ] : [
              { label: '모델', value: 'Seedance 1.5 Pro', icon: Video },
              { label: '비율', value: '16:9 / 9:16 / 1:1 등', icon: Play },
              { label: '영상 길이', value: '4~15초 조절 가능', icon: Sparkles },
            ]).map((item) => (
              <div key={item.label} className="p-4 rounded-xl bg-black/20 border border-white/[0.06]">
                <item.icon className="w-5 h-5 text-[#ccb69a]/60 mb-2" />
                <p className="text-xs text-white/40">{item.label}</p>
                <p className="text-sm text-white/70 font-medium">{item.value}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      <Footer subtitle="Video Generator" />
    </div>
  );
}
