import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// 보호할 라우트 정의 (재고관리 페이지)
const isProtectedRoute = createRouteMatcher(['/inventory(.*)']);

// Clerk가 설정되지 않은 경우 기본 미들웨어
function defaultMiddleware(request: NextRequest) {
  return NextResponse.next();
}

// Clerk 미들웨어
const clerkAuthMiddleware = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
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
