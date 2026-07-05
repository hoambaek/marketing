import { ImageResponse } from 'next/og';
import { fetchPredictionContextForTasting } from '@/lib/supabase/database/tasting-submissions';
import { getSiteUrl } from '@/lib/site-url';
import { resolveTastingDisplay } from './display';

// 카카오톡·SNS 미리보기용 시음 카드 이미지 (브랜드 네이비 배경 + 흰 로고 + 제품명)
export const runtime = 'nodejs';
export const alt = 'Muse de Marée · 비교 시음 기록';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Google Fonts에서 한글 지원 폰트를 필요한 글자만 subset으로 받아온다 (satori는 ttf/otf 지원) */
async function loadFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@500&text=${encodeURIComponent(
      text,
    )}`;
    const css = await (await fetch(url)).text();
    const resource = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
    if (!resource) return null;
    const res = await fetch(resource[1]);
    if (res.status !== 200) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

/** 흰색 로고를 base64 data URI로 로드 (배포 도메인의 정적 파일 fetch) */
async function loadLogo(): Promise<string | null> {
  try {
    const res = await fetch(`${getSiteUrl()}/images/logo/logo_all_W_KR.png`);
    if (res.status !== 200) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:image/png;base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ predictionId: string }>;
}) {
  const { predictionId } = await params;
  const ctx = await fetchPredictionContextForTasting(predictionId);
  const { productName, categoryLabel } = ctx
    ? resolveTastingDisplay(ctx)
    : { productName: '해저 숙성 제품', categoryLabel: '제품' };

  const captionText = `${productName}${categoryLabel} 비교 시음 기록`;
  const [fontData, logoSrc] = await Promise.all([loadFont(captionText), loadLogo()]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          // 브랜드 네이비 그라데이션 (흰 로고가 보이도록)
          backgroundColor: '#0a1420',
          backgroundImage:
            'radial-gradient(circle at 50% 30%, #16283c 0%, #0a1420 55%, #060d16 100%)',
          padding: '64px',
        }}
      >
        {/* 상단 골드 라인 + 라벨 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '36px' }}>
          <div style={{ width: '48px', height: '1px', backgroundColor: 'rgba(196,160,82,0.5)' }} />
          <div
            style={{
              fontSize: '20px',
              letterSpacing: '10px',
              color: 'rgba(196,160,82,0.85)',
              textTransform: 'uppercase',
            }}
          >
            Marine Élevage
          </div>
          <div style={{ width: '48px', height: '1px', backgroundColor: 'rgba(196,160,82,0.5)' }} />
        </div>

        {/* 흰색 로고 */}
        {logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoSrc} width={300} height={288} alt="Muse de Marée" style={{ opacity: 0.95 }} />
        ) : (
          <div style={{ fontSize: '56px', color: '#ffffff', letterSpacing: '4px' }}>
            MUSE DE MARÉE
          </div>
        )}

        {/* 제품명 + 시음 기록 문구 */}
        <div
          style={{
            display: 'flex',
            marginTop: '40px',
            fontSize: '46px',
            color: 'rgba(255,255,255,0.92)',
            fontFamily: fontData ? 'Noto Serif KR' : 'serif',
            textAlign: 'center',
          }}
        >
          {`${productName} · 비교 시음 기록`}
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: '18px',
            fontSize: '22px',
            letterSpacing: '6px',
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase',
          }}
        >
          Comparative Tasting
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [{ name: 'Noto Serif KR', data: fontData, style: 'normal', weight: 500 }]
        : [],
    },
  );
}
