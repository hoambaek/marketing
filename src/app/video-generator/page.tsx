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

interface VideoResult {
  name: string;
  uri: string;
  mimeType: string;
}

export default function VideoGeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [videoResult, setVideoResult] = useState<VideoResult | null>(null);
  const [operationName, setOperationName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Process image file
  const processImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setErrorMessage('');
  }, []);

  // Handle image selection from input
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  }, [processImageFile]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
  }, [processImageFile]);

  // Remove selected image
  const removeImage = useCallback(() => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Poll for video generation status
  const pollStatus = useCallback(async (opName: string) => {
    try {
      const response = await fetch(`/api/video-generator?operation=${encodeURIComponent(opName)}`);
      const data = await response.json();

      if (data.error) {
        setStatus('error');
        setErrorMessage(data.error);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
        return;
      }

      if (data.done) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }

        if (data.success && data.video) {
          setVideoResult(data.video);
          setStatus('complete');
          setStatusMessage('영상 생성이 완료되었습니다!');
        } else {
          setStatus('error');
          setErrorMessage(data.error || '영상 생성에 실패했습니다.');
        }
      } else {
        setStatusMessage(data.message || '영상 생성 중...');
      }
    } catch (error) {
      logger.error('Polling error:', error);
      setStatus('error');
      setErrorMessage('상태 확인 중 오류가 발생했습니다.');
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    }
  }, []);

  // Start video generation
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setErrorMessage('프롬프트를 입력해주세요.');
      return;
    }

    setStatus('uploading');
    setStatusMessage('영상 생성 요청 중...');
    setErrorMessage('');
    setVideoResult(null);

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await fetch('/api/video-generator', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.error) {
        setStatus('error');
        setErrorMessage(data.error);
        return;
      }

      if (data.success && data.operationName) {
        setOperationName(data.operationName);
        setStatus('polling');
        setStatusMessage('영상 생성 중... (약 1-3분 소요)');

        // Start polling every 10 seconds
        pollingRef.current = setInterval(() => {
          pollStatus(data.operationName);
        }, 10000);

        // Initial poll
        setTimeout(() => pollStatus(data.operationName), 5000);
      }
    } catch (error) {
      logger.error('Generation error:', error);
      setStatus('error');
      setErrorMessage('영상 생성 요청 중 오류가 발생했습니다.');
    }
  };

  // Get proxied video URL for preview and download
  const getProxiedVideoUrl = useCallback((uri: string) => {
    return `/api/video-generator/download?uri=${encodeURIComponent(uri)}`;
  }, []);

  // Download video
  const handleDownload = async () => {
    if (!videoResult?.uri) return;

    try {
      // Use download API proxy to fetch video
      const response = await fetch(getProxiedVideoUrl(videoResult.uri));

      if (!response.ok) {
        setErrorMessage('다운로드에 실패했습니다.');
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'generated-video-1080p.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Download error:', error);
      setErrorMessage('다운로드 중 오류가 발생했습니다.');
    }
  };

  // Reset form
  const resetForm = () => {
    setPrompt('');
    setSelectedImage(null);
    setImagePreview(null);
    setStatus('idle');
    setStatusMessage('');
    setErrorMessage('');
    setVideoResult(null);
    setOperationName(null);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isGenerating = status === 'uploading' || status === 'generating' || status === 'polling';

  return (
    <div className="min-h-screen pb-20">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#070b12] via-[#0a1018] to-[#0d1525]" />
        {/* Decorative orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#b7916e]/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/[0.02] rounded-full blur-[100px]" />
        {/* Grain texture */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Header */}
      <section className="relative pt-8 sm:pt-16 pb-6 sm:pb-8 px-4 sm:px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">설정으로 돌아가기</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-[#ccb69a] text-[10px] sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-2 sm:mb-4 font-light"
            >
              AI Video Generation
            </motion.p>

            <h1
              className="text-3xl sm:text-5xl lg:text-6xl text-white/95 mb-4 sm:mb-6 leading-[1.1] tracking-tight"
              style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
            >
              영상{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ccb69a] via-[#9a754b] to-[#ccb69a]">
                생성기
              </span>
            </h1>

            <p className="text-white/50 text-sm sm:text-lg max-w-xl">
              Google Veo 3.1을 사용하여 이미지와 프롬프트로 1080p 영상을 생성합니다.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden">
            {/* Card Background */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xl" />
            <div className="absolute inset-0 border border-white/10 rounded-2xl sm:rounded-3xl" />

            <div className="relative p-6 sm:p-8 lg:p-10">
              {/* Image Upload Section */}
              <div className="mb-6">
                <label className="block text-sm text-white/60 mb-3">
                  <ImageIcon className="w-4 h-4 inline-block mr-2" />
                  참조 이미지 (선택사항)
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={isGenerating}
                />

                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/10 inline-block">
                    <Image
                      src={imagePreview}
                      alt="Selected image"
                      width={300}
                      height={200}
                      className="max-h-[200px] w-auto object-contain"
                    />
                    <button
                      onClick={removeImage}
                      disabled={isGenerating}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-black/80 transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => !isGenerating && fileInputRef.current?.click()}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={!isGenerating ? handleDrop : undefined}
                    className={`w-full py-10 border-2 border-dashed rounded-xl transition-all cursor-pointer text-center ${
                      isGenerating
                        ? 'opacity-50 cursor-not-allowed border-white/20'
                        : isDragging
                        ? 'border-[#ccb69a] bg-[#ccb69a]/10 scale-[1.02]'
                        : 'border-white/20 hover:border-[#ccb69a]/50 hover:bg-white/[0.02]'
                    }`}
                  >
                    <Upload
                      className={`w-8 h-8 mx-auto mb-3 transition-colors ${
                        isDragging ? 'text-[#ccb69a]' : 'text-white/30 group-hover:text-[#ccb69a]/70'
                      }`}
                    />
                    <p
                      className={`text-sm transition-colors ${
                        isDragging ? 'text-[#ccb69a]' : 'text-white/40'
                      }`}
                    >
                      {isDragging ? '여기에 놓으세요' : '이미지를 업로드하세요'}
                    </p>
                    <p className="text-xs text-white/25 mt-1">
                      클릭 또는 드래그 앤 드롭
                    </p>
                  </div>
                )}
              </div>

              {/* Prompt Input Section */}
              <div className="mb-6">
                <label className="block text-sm text-white/60 mb-3">
                  <Sparkles className="w-4 h-4 inline-block mr-2" />
                  프롬프트 (영문 권장)
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Generate a cinematic video of waves crashing against rocks at sunset..."
                  disabled={isGenerating}
                  rows={4}
                  className="w-full px-4 py-4 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-[#ccb69a]/30 focus:border-[#ccb69a]/50 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-white/30 mt-2">
                  자세하고 구체적인 설명을 작성하면 더 좋은 결과를 얻을 수 있습니다.
                </p>
              </div>

              {/* Status Message */}
              <AnimatePresence mode="wait">
                {(status !== 'idle' || errorMessage) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-6"
                  >
                    {errorMessage && (
                      <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <p className="text-sm text-red-300">{errorMessage}</p>
                      </div>
                    )}

                    {status === 'complete' && !errorMessage && (
                      <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <p className="text-sm text-emerald-300">{statusMessage}</p>
                      </div>
                    )}

                    {isGenerating && (
                      <div className="flex items-center gap-3 p-4 bg-[#ccb69a]/10 border border-[#ccb69a]/20 rounded-xl">
                        <Loader2 className="w-5 h-5 text-[#ccb69a] animate-spin flex-shrink-0" />
                        <div>
                          <p className="text-sm text-[#ccb69a]">{statusMessage}</p>
                          <p className="text-xs text-white/40 mt-1">
                            페이지를 벗어나지 마세요
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Video Preview */}
              <AnimatePresence>
                {videoResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="mb-6"
                  >
                    <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/30">
                      <video
                        src={getProxiedVideoUrl(videoResult.uri)}
                        controls
                        className="w-full aspect-video"
                        playsInline
                      >
                        브라우저가 비디오 재생을 지원하지 않습니다.
                      </video>
                    </div>
                    <p className="text-xs text-white/40 mt-2 text-center">1080p (16:9) • 8초</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {status === 'complete' && videoResult ? (
                  <>
                    <button
                      onClick={handleDownload}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#9a754b] to-[#ccb69a] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                    >
                      <Download className="w-5 h-5" />
                      <span>영상 다운로드 (1080p)</span>
                    </button>
                    <button
                      onClick={resetForm}
                      className="px-6 py-4 border border-white/10 text-white/70 rounded-xl hover:bg-white/[0.05] hover:text-white transition-all"
                    >
                      새로 만들기
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating || !prompt.trim()}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#9a754b] to-[#ccb69a] text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>생성 중...</span>
                        </>
                      ) : (
                        <>
                          <Video className="w-5 h-5" />
                          <span>영상 생성하기</span>
                        </>
                      )}
                    </button>
                    {isGenerating && (
                      <button
                        onClick={resetForm}
                        className="px-6 py-4 border border-white/10 text-white/50 rounded-xl hover:bg-white/[0.05] hover:text-white/70 transition-all"
                      >
                        취소
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Info Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 grid sm:grid-cols-3 gap-4"
          >
            {[
              { label: '해상도', value: '1080p (Full HD)', icon: Video },
              { label: '비율', value: '16:9 와이드스크린', icon: Play },
              { label: '생성 시간', value: '약 1-3분', icon: Sparkles },
            ].map((item) => (
              <div
                key={item.label}
                className="p-4 rounded-xl bg-black/20 border border-white/[0.06]"
              >
                <item.icon className="w-5 h-5 text-[#ccb69a]/60 mb-2" />
                <p className="text-xs text-white/40">{item.label}</p>
                <p className="text-sm text-white/70 font-medium">{item.value}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <Footer subtitle="Video Generator" />
    </div>
  );
}
