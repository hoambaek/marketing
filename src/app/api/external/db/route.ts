import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/auth/api-key';
import { executeFunction, functionDeclarations } from '@/lib/ai/functions';

// GET /api/external/db - 사용 가능한 함수 목록 반환 (자기 문서화)
export async function GET(request: NextRequest) {
  const auth = validateApiKey(request);
  if (!auth.authorized) return auth.response;

  const functions = functionDeclarations.map((fn) => ({
    name: fn.name,
    description: fn.description,
    parameters: fn.parameters,
  }));

  return NextResponse.json({
    success: true,
    count: functions.length,
    functions,
  });
}

// POST /api/external/db - DB 함수 실행
export async function POST(request: NextRequest) {
  const auth = validateApiKey(request);
  if (!auth.authorized) return auth.response;

  let body: { action?: string; params?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { action, params } = body;

  if (!action || typeof action !== 'string') {
    return NextResponse.json(
      { error: 'Missing required field: action (string)' },
      { status: 400 }
    );
  }

  // 허용된 함수인지 확인
  const allowedFunctions = functionDeclarations.map((fn) => fn.name);
  if (!allowedFunctions.includes(action)) {
    return NextResponse.json(
      {
        error: `Unknown action: "${action}"`,
        availableActions: allowedFunctions,
      },
      { status: 400 }
    );
  }

  const result = await executeFunction(action, params || {});

  return NextResponse.json(result, {
    status: result.success ? 200 : 500,
  });
}
