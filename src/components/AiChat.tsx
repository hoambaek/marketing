'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useMasterPlanStore } from '@/lib/store/masterplan-store';
import { useInventoryStore } from '@/lib/store/inventory-store';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  executedFunctions?: Array<{ name: string; result: unknown }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// AI Chat Component - iOS Safari Optimized
// ═══════════════════════════════════════════════════════════════════════════

// 데이터 변경 함수 목록 (이 함수들이 실행되면 스토어 리프레시 필요)
const MASTERPLAN_MUTATION_FUNCTIONS = [
  'createTask', 'createMultipleTasks', 'updateTask', 'deleteTask',
  'createIssue', 'updateIssue', 'deleteIssue',
  'createContent', 'createMultipleContents', 'updateContent', 'deleteContent',
  'createMustDoItem', 'toggleMustDo', 'updateMustDoItem', 'deleteMustDoItem',
  'createBudgetItem', 'updateBudgetItem', 'deleteBudgetItem',
  'createExpenseItem', 'updateExpenseItem', 'deleteExpenseItem',
];

const INVENTORY_MUTATION_FUNCTIONS = [
  'updateNumberedBottle',
  'updateInventoryBatch',
  'createInventoryTransaction',
  'createCustomProduct', 'deleteCustomProduct',
];

export default function AiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 스토어 리프레시 함수
  const refreshMasterplan = useMasterPlanStore((state) => state.initializeFromSupabase);
  const refreshInventory = useInventoryStore((state) => state.refreshFromSupabase);

  // 실행된 함수에 따라 스토어 리프레시
  const refreshStoresIfNeeded = useCallback((executedFunctions: Array<{ name: string; result: unknown }>) => {
    if (!executedFunctions || executedFunctions.length === 0) return;

    const functionNames = executedFunctions.map(f => f.name);

    // Masterplan 스토어 리프레시 필요 여부 확인
    const needsMasterplanRefresh = functionNames.some(name =>
      MASTERPLAN_MUTATION_FUNCTIONS.includes(name)
    );

    // Inventory 스토어 리프레시 필요 여부 확인
    const needsInventoryRefresh = functionNames.some(name =>
      INVENTORY_MUTATION_FUNCTIONS.includes(name)
    );

    // 필요한 스토어만 리프레시
    if (needsMasterplanRefresh) {
      console.log('Refreshing masterplan store...');
      refreshMasterplan();
    }

    if (needsInventoryRefresh) {
      console.log('Refreshing inventory store...');
      refreshInventory();
    }
  }, [refreshMasterplan, refreshInventory]);

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // iOS Safari Visual Viewport 처리 - 키보드 높이 감지
  useEffect(() => {
    if (!isOpen || !isMobile) return;

    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      // 키보드가 올라왔을 때 viewport 높이 변화 감지
      const keyboardH = window.innerHeight - viewport.height;
      setKeyboardHeight(Math.max(0, keyboardH));

      // 키보드가 올라오면 메시지 영역 스크롤
      if (keyboardH > 0 && messagesContainerRef.current) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
      }
    };

    viewport.addEventListener('resize', handleResize);
    viewport.addEventListener('scroll', handleResize);

    return () => {
      viewport.removeEventListener('resize', handleResize);
      viewport.removeEventListener('scroll', handleResize);
    };
  }, [isOpen, isMobile]);

  // 스크롤 자동 이동
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // 채팅창 열릴 때 body 스크롤 방지 + iOS 바운스 방지
  useEffect(() => {
    if (isOpen && isMobile) {
      // iOS Safari 바운스 스크롤 방지
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [isOpen, isMobile]);

  // 메시지 전송
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // 전송 후 입력창 포커스 유지 (키보드 유지)
    if (isMobile) {
      inputRef.current?.blur();
    }

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          history: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        executedFunctions: data.executedFunctions,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // 데이터 변경 함수가 실행됐으면 스토어 리프레시
      if (data.executedFunctions && data.executedFunctions.length > 0) {
        refreshStoresIfNeeded(data.executedFunctions);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error instanceof Error
          ? `오류가 발생했습니다: ${error.message}`
          : '알 수 없는 오류가 발생했습니다.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Enter 키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 입력창 포커스 시 스크롤
  const handleInputFocus = () => {
    if (isMobile) {
      setTimeout(() => {
        scrollToBottom();
      }, 300);
    }
  };

  return (
    <>
      {/* 플로팅 버블 버튼 - 채팅창 열리면 모바일에서 숨김 */}
      <AnimatePresence>
        {(!isOpen || !isMobile) && (
          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[60]
                       w-14 h-14 rounded-full shadow-2xl
                       bg-[#0a0f1a] hover:bg-[#0f1520]
                       transition-all duration-300 ease-out
                       flex items-center justify-center
                       border border-[#b7916e]/30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.svg
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  className="w-6 h-6 text-[#b7916e]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </motion.svg>
              ) : (
                <motion.svg
                  key="chat"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="w-6 h-6 text-[#b7916e]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </motion.svg>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </AnimatePresence>

      {/* 채팅창 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatContainerRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed z-50 flex flex-col
                       bg-[#0a0f1a]
                       border-white/[0.06]
                       inset-0
                       sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[400px] sm:h-[600px] sm:max-h-[80vh]
                       sm:rounded-2xl sm:border sm:shadow-2xl"
            style={{
              // iOS Safari: 키보드 높이만큼 하단 패딩 조절
              paddingBottom: isMobile ? `${keyboardHeight}px` : '0px',
              // dvh 사용으로 동적 뷰포트 대응
              height: isMobile ? '100dvh' : undefined,
              maxHeight: isMobile ? '100dvh' : undefined,
            }}
          >
            {/* 헤더 - Safe Area 대응 */}
            <div
              className="flex-shrink-0 px-4 py-3 border-b border-white/[0.06]
                        bg-[#0a0f1a]/80 backdrop-blur-xl"
              style={{
                paddingTop: isMobile ? 'max(12px, env(safe-area-inset-top))' : '12px',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/[0.08] border border-white/[0.06]
                                flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#b7916e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white/90 font-medium tracking-wide text-base" style={{ fontFamily: 'var(--font-cormorant)' }}>
                      Muse AI
                    </h3>
                    <p className="text-[11px] text-[#b7916e]">마케팅 어시스턴트</p>
                  </div>
                </div>
                {/* 닫기 버튼 */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center
                           text-white/40 hover:text-white/80 hover:bg-white/[0.04]
                           active:bg-white/[0.08] transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 메시지 영역 - flex-1로 남은 공간 차지 */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain
                        p-4 space-y-4"
              style={{
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
                  <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-[#b7916e]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                  </div>
                  <h4 className="text-white/80 font-medium mb-2 text-lg" style={{ fontFamily: 'var(--font-cormorant)' }}>
                    무엇을 도와드릴까요?
                  </h4>
                  <p className="text-sm text-white/40 leading-relaxed mb-6">
                    월별 플랜, 이슈, 컨텐츠를<br />
                    자연어로 관리하세요.
                  </p>
                  <div className="space-y-2 w-full max-w-xs">
                    {[
                      '1월 태스크 보여줘',
                      '새 이슈 등록',
                      '컨텐츠 추가',
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInput(suggestion);
                          inputRef.current?.focus();
                        }}
                        className="w-full px-4 py-3 text-left text-sm text-white/60
                                 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl
                                 border border-white/[0.06] hover:border-[#b7916e]/30
                                 transition-all duration-200 active:scale-[0.98]"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-[#b7916e]/20 text-white border border-[#b7916e]/30'
                        : 'bg-white/[0.04] text-white/90 border border-white/[0.06]'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <p className="text-[15px] whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                    ) : (
                      <div className="text-[15px] leading-relaxed prose prose-invert prose-sm max-w-none
                        prose-headings:text-[#d4a574] prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-2
                        prose-h3:text-base prose-h4:text-sm
                        prose-p:my-1.5 prose-p:text-white/80
                        prose-strong:text-[#d4a574] prose-strong:font-semibold
                        prose-ul:my-1.5 prose-ul:pl-4 prose-li:my-0.5 prose-li:text-white/70
                        prose-ol:my-1.5 prose-ol:pl-4
                        prose-code:text-[#b7916e] prose-code:bg-white/[0.04] prose-code:px-1 prose-code:rounded
                        prose-pre:bg-white/[0.04] prose-pre:rounded-lg">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    )}

                    {/* 실행된 함수 표시 */}
                    {message.executedFunctions && message.executedFunctions.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/[0.06]">
                        <p className="text-xs text-[#b7916e]/70 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M5 13l4 4L19 7" />
                          </svg>
                          {message.executedFunctions.map(f => f.name).join(', ')} 실행됨
                        </p>
                      </div>
                    )}

                    <p className="text-[10px] mt-1 opacity-50">
                      {message.timestamp.toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* 로딩 인디케이터 */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-[#b7916e] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-[#b7916e] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-[#b7916e] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-white/40">생각 중...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 스크롤 앵커 */}
              <div ref={messagesEndRef} className="h-1" />
            </div>

            {/* 입력 영역 - Safe Area 대응 */}
            <div
              className="flex-shrink-0 p-3 border-t border-white/[0.06] bg-[#0a0f1a]/90 backdrop-blur-sm"
              style={{
                paddingBottom: isMobile ? 'max(12px, env(safe-area-inset-bottom))' : '12px',
              }}
            >
              <div className="flex gap-2 items-end">
                {/* input 사용 (iOS에서 더 안정적) - 16px 이상으로 zoom 방지 */}
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={handleInputFocus}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 px-4 py-3 bg-white/[0.04] border border-white/[0.06]
                           rounded-xl text-white/90 placeholder-white/30
                           focus:outline-none focus:border-[#b7916e]/50 focus:ring-1 focus:ring-[#b7916e]/30
                           transition-all duration-200
                           text-base"
                  style={{
                    // iOS zoom 방지: 최소 16px
                    fontSize: '16px',
                    // iOS 자동 확대/축소 방지
                    touchAction: 'manipulation',
                  }}
                  disabled={isLoading}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="flex-shrink-0 w-12 h-12 bg-[#b7916e]/20 border border-[#b7916e]/30
                           hover:bg-[#b7916e]/30 hover:border-[#b7916e]/50
                           disabled:bg-white/[0.04] disabled:border-white/[0.06] disabled:cursor-not-allowed
                           rounded-xl transition-all duration-200
                           flex items-center justify-center active:scale-95"
                >
                  <svg className="w-5 h-5 text-[#b7916e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
