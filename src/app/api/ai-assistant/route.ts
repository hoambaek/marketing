import { GoogleGenerativeAI, Content, Part } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { functionDeclarations, executeFunction, SYSTEM_PROMPT } from '@/lib/ai/functions';

// Gemini 3 Pro Preview 모델 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { messages, history } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // Gemini 3 Pro Preview 모델 사용
    const model = genAI.getGenerativeModel({
      model: 'gemini-3-pro-preview',
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
        console.log(`Executing function: ${call.name}`, call.args);

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
    console.error('AI Assistant Error:', error);

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
    model: 'gemini-3-pro-preview',
  });
}
