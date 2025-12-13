'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

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
// AI Chat Component
// ═══════════════════════════════════════════════════════════════════════════

export default function AiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 스크롤 자동 이동
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 모바일에서 채팅창 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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

  return (
    <>
      {/* 플로팅 버블 버튼 */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50
                   w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-2xl
                   bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800
                   hover:from-amber-500 hover:via-amber-600 hover:to-amber-700
                   transition-all duration-300 ease-out
                   flex items-center justify-center group
                   border border-amber-500/30"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.svg
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-6 h-6 text-white"
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
              transition={{ duration: 0.2 }}
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </motion.svg>
          )}
        </AnimatePresence>

        {/* 펄스 애니메이션 */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping" />
        )}
      </motion.button>

      {/* 채팅창 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed z-50 overflow-hidden shadow-2xl
                       bg-gradient-to-b from-stone-900/98 to-stone-950/98
                       backdrop-blur-xl border border-amber-900/30
                       flex flex-col
                       inset-0 rounded-none
                       sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[400px] sm:h-[600px] sm:max-h-[80vh] sm:rounded-2xl"
          >
            {/* 헤더 */}
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-amber-900/20
                          bg-gradient-to-r from-amber-900/20 via-stone-900/50 to-amber-900/20
                          safe-area-inset-top">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-800
                                flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-amber-100 font-medium tracking-wide text-sm sm:text-base" style={{ fontFamily: 'var(--font-cormorant)' }}>
                      Muse AI Assistant
                    </h3>
                    <p className="text-[10px] sm:text-xs text-amber-700/80">마케팅 플랜 & 이슈 관리</p>
                  </div>
                </div>
                {/* 닫기 버튼 */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800/50
                           transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 메시지 영역 */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 scrollbar-thin scrollbar-thumb-amber-900/30">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 sm:px-6">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-900/20 flex items-center justify-center mb-3 sm:mb-4">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-amber-600/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                  </div>
                  <h4 className="text-amber-200/80 font-medium mb-2 text-base sm:text-lg" style={{ fontFamily: 'var(--font-cormorant)' }}>
                    무엇을 도와드릴까요?
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
                    월별 플랜, 이슈 관리, 컨텐츠 캘린더를<br />
                    자연어로 관리할 수 있습니다.
                  </p>
                  <div className="mt-4 sm:mt-6 space-y-2 w-full max-w-sm">
                    {[
                      '1월 태스크 목록 보여줘',
                      '새로운 마케팅 이슈 등록해줘',
                      '인스타그램 컨텐츠 추가',
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(suggestion)}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-left text-xs sm:text-sm text-amber-300/70
                                 bg-amber-900/10 hover:bg-amber-900/20 rounded-lg
                                 border border-amber-900/20 hover:border-amber-700/30
                                 transition-all duration-200 active:scale-[0.98]"
                      >
                        &quot;{suggestion}&quot;
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
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-amber-700 to-amber-800 text-white'
                        : 'bg-stone-800/80 text-stone-200 border border-stone-700/50'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                    ) : (
                      <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none
                        prose-headings:text-amber-400 prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-2
                        prose-h3:text-base prose-h4:text-sm
                        prose-p:my-1.5 prose-p:text-stone-200
                        prose-strong:text-amber-300 prose-strong:font-semibold
                        prose-ul:my-1.5 prose-ul:pl-4 prose-li:my-0.5 prose-li:text-stone-300
                        prose-ol:my-1.5 prose-ol:pl-4
                        prose-code:text-amber-400 prose-code:bg-stone-900/50 prose-code:px-1 prose-code:rounded
                        prose-pre:bg-stone-900/50 prose-pre:rounded-lg">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    )}

                    {/* 실행된 함수 표시 */}
                    {message.executedFunctions && message.executedFunctions.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-stone-600/30">
                        <p className="text-xs text-amber-500/70 flex items-center gap-1">
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
                  <div className="bg-stone-800/80 border border-stone-700/50 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-stone-400">생각 중...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* 입력 영역 */}
            <div className="p-3 sm:p-4 border-t border-amber-900/20 bg-stone-900/50 safe-area-inset-bottom">
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="메시지를 입력하세요..."
                  rows={1}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-stone-800/50 border border-stone-700/50
                           rounded-xl text-sm text-stone-200 placeholder-stone-500
                           focus:outline-none focus:border-amber-700/50 focus:ring-1 focus:ring-amber-700/30
                           resize-none transition-all duration-200"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-br from-amber-600 to-amber-700
                           hover:from-amber-500 hover:to-amber-600
                           disabled:from-stone-700 disabled:to-stone-800 disabled:cursor-not-allowed
                           rounded-xl transition-all duration-200
                           flex items-center justify-center active:scale-95"
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              <p className="text-[10px] text-stone-600 mt-2 text-center hidden sm:block">
                Gemini 3 Pro Preview로 구동됩니다
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
