import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// 공개 라우트 정의 (로그인/회원가입 페이지)
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

// 공개 API 라우트 정의 (인증 불필요한 API만)
const isPublicApiRoute = createRouteMatcher([
  '/api/health(.*)',       // 헬스체크
  '/api/public/(.*)',      // 명시적 공개 API
]);

// Clerk가 설정되지 않은 경우 기본 미들웨어
function defaultMiddleware(request: NextRequest) {
  return NextResponse.next();
}

// Clerk 미들웨어 - 모든 라우트 보호 (공개 라우트 및 공개 API 제외)
const clerkAuthMiddleware = clerkMiddleware(async (auth, req) => {
  // 공개 페이지나 공개 API는 보호하지 않음
  if (isPublicRoute(req) || isPublicApiRoute(req)) {
    return;
  }
  // 그 외 모든 라우트 (API 포함)는 인증 필요
  await auth.protect();
});

export default isClerkConfigured ? clerkAuthMiddleware : defaultMiddleware;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
