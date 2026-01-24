import { GoogleGenerativeAI, Content, Part } from '@google/generative-ai';
import { aiLogger } from '@/lib/logger';
import { envValidators, EnvError } from '@/lib/env';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { functionDeclarations, executeFunction, SYSTEM_PROMPT } from '@/lib/ai/functions';

// 허용된 함수 목록 (안전한 읽기 전용 함수만)
const ALLOWED_FUNCTIONS = [
  'get_tasks',
  'get_tasks_by_month',
  'get_task',
  'get_kpi_items',
  'get_content_items',
  'get_must_do_items',
  'get_issues',
  'get_budget_items',
  'get_inventory_summary',
  'get_month_summary',
  'search_tasks',
];

// 쓰기 권한이 필요한 함수들
const WRITE_FUNCTIONS = [
  'create_task',
  'update_task',
  'delete_task',
  'create_issue',
  'update_issue',
  'resolve_issue',
  'create_budget_item',
  'update_budget_item',
  'delete_budget_item',
];

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다. 로그인 후 다시 시도해주세요.' },
        { status: 401 }
      );
    }

    // 페이로드 파싱 및 검증
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: '잘못된 요청 형식입니다.' },
        { status: 400 }
      );
    }

    const { messages, history } = body;

    // messages 배열 검증
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: '메시지가 필요합니다.' },
        { status: 400 }
      );
    }

    // 마지막 메시지 구조 검증
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || typeof lastMessage.content !== 'string') {
      return NextResponse.json(
        { error: '메시지 형식이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    // Gemini API 키 검증
    let apiKey: string;
    try {
      apiKey = envValidators.requireGeminiApiKey();
    } catch (error) {
      if (error instanceof EnvError) {
        return NextResponse.json(error.toJSON(), { status: 500 });
      }
      throw error;
    }

    // Gemini 3 Flash Preview 모델 사용
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
      systemInstruction: SYSTEM_PROMPT,
      tools: [{ functionDeclarations }],
    });

    // 대화 히스토리 변환
    const chatHistory: Content[] = (history || []).map((msg: { role: string; content: string }) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // 채팅 세션 시작
    const chat = model.startChat({
      history: chatHistory,
    });

    // 사용자 메시지 전송
    const userMessage = messages[messages.length - 1].content;
    let result = await chat.sendMessage(userMessage);
    let response = result.response;

    // Function Calling 처리 루프
    let functionCalls = response.functionCalls();
    const executedFunctions: Array<{ name: string; result: unknown }> = [];

    while (functionCalls && functionCalls.length > 0) {
      const functionResponses: Part[] = [];

      for (const call of functionCalls) {
        aiLogger.log(`Executing function: ${call.name}`, call.args);

        // 함수 허용 목록 검증
        const isAllowed = ALLOWED_FUNCTIONS.includes(call.name);
        const isWriteFunction = WRITE_FUNCTIONS.includes(call.name);

        // 허용되지 않은 함수는 실행하지 않음
        if (!isAllowed && !isWriteFunction) {
          aiLogger.warn(`Blocked unauthorized function call: ${call.name}`);
          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: { error: '허용되지 않은 함수입니다.' },
            },
          });
          continue;
        }

        const functionResult = await executeFunction(
          call.name,
          call.args as Record<string, unknown>
        );

        executedFunctions.push({
          name: call.name,
          result: functionResult,
        });

        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: functionResult,
          },
        });
      }

      // 함수 실행 결과를 모델에 전달
      result = await chat.sendMessage(functionResponses);
      response = result.response;
      functionCalls = response.functionCalls();
    }

    // 최종 응답 텍스트 추출
    const responseText = response.text();

    return NextResponse.json({
      response: responseText,
      executedFunctions,
    });
  } catch (error) {
    aiLogger.error('AI Assistant Error:', error);

    // 에러 메시지 처리
    let errorMessage = '요청 처리 중 오류가 발생했습니다.';

    if (error instanceof Error) {
      if (error.message.includes('API_KEY')) {
        errorMessage = 'API 키가 유효하지 않습니다.';
      } else if (error.message.includes('quota')) {
        errorMessage = 'API 할당량을 초과했습니다.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// 스트리밍 응답용 (선택적)
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'AI Assistant API is running',
    model: 'gemini-3-flash-preview',
  });
}
