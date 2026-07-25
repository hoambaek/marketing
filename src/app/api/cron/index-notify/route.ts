/**
 * 블로그 신규·수정 글을 구글 Web Search Indexing API에 자동 통지하는 크론.
 *
 * 소스: 블로그 sitemap의 <loc>+<lastmod>(post.updated_at). lastmod가 최근
 * (WINDOW_H시간 이내)인 URL만 URL_UPDATED로 통지한다 — 상태 테이블 없이
 * sitemap을 단일 진실원으로 삼는 스테이트리스 방식.
 *
 * 매일 1회(22:00 UTC = 07:00 KST) 실행 → WINDOW_H를 크론 간격(24h)보다 넉넉히
 * 26h로 잡아 경계에서의 누락을 막는다(경계 중복 통지는 무해, 구글이 dedupe).
 *
 * 랜딩(www) sitemap은 lastmod가 빌드시각이라 변경 감지에 무의미해서 제외한다.
 *
 * 사전 준비(1회): lib/marketing/indexing.ts 상단 주석 참조
 * (Indexing API 활성화 + 서비스계정 소유자 등록). 미완료 시 failed에 403이 쌓인다.
 */
import { NextResponse } from 'next/server';
import { isIndexingConfigured, publishUrlNotification } from '@/lib/marketing/indexing';

export const maxDuration = 60;

const BLOG_SITEMAP = process.env.INDEX_NOTIFY_SITEMAP || 'https://blog.musedemaree.com/sitemap.xml';
const WINDOW_H = Number(process.env.INDEX_NOTIFY_WINDOW_H || 26);
const MAX_URLS = 50; // 저볼륨 블로그 방어용 상한(Indexing 일 기본 쿼터 200)

function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return request.headers.get('x-vercel-cron') === '1';
  return authHeader === `Bearer ${cronSecret}`;
}

interface SitemapEntry {
  loc: string;
  lastmod?: string;
}

function parseSitemap(xml: string): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  const blocks = xml.match(/<url>[\s\S]*?<\/url>/g) || [];
  for (const block of blocks) {
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1]?.trim();
    if (!loc) continue;
    const lastmod = block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]?.trim();
    entries.push({ loc, lastmod });
  }
  return entries;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 });
  }
  if (!isIndexingConfigured()) {
    return NextResponse.json({ skipped: 'GOOGLE_SERVICE_ACCOUNT_KEY 미설정' });
  }

  const res = await fetch(BLOG_SITEMAP, { cache: 'no-store' });
  if (!res.ok) {
    return NextResponse.json({ error: `sitemap 조회 실패 (${res.status})` }, { status: 502 });
  }
  const entries = parseSitemap(await res.text());

  const cutoff = Date.now() - WINDOW_H * 3600 * 1000;
  const changed = entries
    .filter((e) => {
      if (!e.lastmod) return false;
      const t = Date.parse(e.lastmod);
      return Number.isFinite(t) && t >= cutoff;
    })
    .slice(0, MAX_URLS);

  const results: Awaited<ReturnType<typeof publishUrlNotification>>[] = [];
  for (const e of changed) {
    results.push(await publishUrlNotification(e.loc, 'URL_UPDATED'));
    await new Promise((r) => setTimeout(r, 200));
  }

  const failed = results.filter((r) => !r.ok);
  return NextResponse.json({
    sitemap: BLOG_SITEMAP,
    windowHours: WINDOW_H,
    totalInSitemap: entries.length,
    changedRecently: changed.length,
    notified: results.length - failed.length,
    notifiedUrls: results.filter((r) => r.ok).map((r) => r.url),
    failed: failed.map((f) => ({ url: f.url, status: f.status, error: f.error })),
  });
}
