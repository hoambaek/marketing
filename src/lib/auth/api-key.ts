import { NextRequest, NextResponse } from 'next/server';

interface AuthResult {
  authorized: true;
}

interface AuthError {
  authorized: false;
  response: NextResponse;
}

export function validateApiKey(request: NextRequest): AuthResult | AuthError {
  const apiKey = process.env.EXTERNAL_API_KEY;

  if (!apiKey) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'API key not configured on server' },
        { status: 500 }
      ),
    };
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Missing or invalid Authorization header. Use: Bearer <key>' },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.slice(7);
  if (token !== apiKey) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      ),
    };
  }

  return { authorized: true };
}
