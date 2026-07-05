/**
 * 공유 링크(OG 메타·이미지)용 사이트 절대 URL.
 * 카카오톡 등 외부 크롤러는 og:image에 절대 URL을 요구하므로 배포 도메인이 필요하다.
 * 우선순위: 명시적 env → Vercel 프로덕션 도메인 → 커스텀 도메인 폴백.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return 'https://musedemaree.com';
}
