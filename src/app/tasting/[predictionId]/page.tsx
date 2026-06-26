import Link from 'next/link';
import Image from 'next/image';
import { fetchPredictionContextForTasting } from '@/lib/supabase/database/tasting-submissions';
import { PRODUCTS } from '@/lib/types';
import TastingForm from './TastingForm';

export const dynamic = 'force-dynamic';

export default async function TastingSubmitPage({
  params,
}: {
  params: Promise<{ predictionId: string }>;
}) {
  const { predictionId } = await params;
  const ctx = await fetchPredictionContextForTasting(predictionId);

  // 유효하지 않은 링크 / 서버 미설정
  if (!ctx) {
    return (
      <main className="min-h-screen bg-[#0a0b0d] text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p className="text-white/35 text-[10px] tracking-[0.3em] uppercase mb-4">Muse de Marée · Marine Élevage</p>
          <h1 className="text-2xl text-white/85 mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            유효하지 않은 링크입니다
          </h1>
          <p className="text-sm text-white/40 leading-relaxed">
            시음 기록 링크가 만료되었거나 잘못되었습니다.
            링크를 전달한 담당자에게 다시 문의해 주세요.
          </p>
        </div>
      </main>
    );
  }

  // aging_products.product_name 우선, 없으면 인벤토리 PRODUCTS 매핑, 그래도 없으면 일반명
  const inventoryProduct = PRODUCTS.find(p => p.id === ctx.productId);
  const productName =
    ctx.productName ?? inventoryProduct?.nameKo ?? inventoryProduct?.name ?? '해저 숙성 샴페인';

  return (
    <main
      className="min-h-screen bg-[#0a0b0d] text-white pb-24"
      style={{ marginTop: 'calc(-4rem - env(safe-area-inset-top, 0px))' }}
    >
      {/* 상단 로고 (가운데) — 헤더가 있던 자리를 채움 */}
      <div
        className="flex justify-center pb-2"
        style={{ paddingTop: 'calc(1.75rem + env(safe-area-inset-top, 0px))' }}
      >
        <Image
          src="/images/logo/logo_text_trans_W.png"
          alt="Muse de Marée"
          width={200}
          height={40}
          priority
          className="h-7 sm:h-8 w-auto opacity-90"
        />
      </div>

      <section className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-6 text-center">
        <p className="text-white/35 text-[10px] sm:text-xs tracking-[0.25em] uppercase mb-3 font-light">
          비교 시음 기록
        </p>
        <h1 className="text-2xl sm:text-4xl text-white/90 mb-3 leading-tight font-light" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          {productName}
        </h1>
        <p className="text-white/40 text-sm leading-relaxed">
          해저 숙성 샴페인과 지상 보관 대조군을 블라인드로 비교 시음한 결과를 기록해 주세요.
          제출하신 내용은 내부 검토 후 데이터에 반영됩니다.
        </p>
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="h-px bg-white/[0.07] mb-8" />
        <TastingForm predictionId={ctx.predictionId} />
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-10 flex justify-center">
        <Link href="/" className="opacity-30 hover:opacity-50 transition-opacity">
          <Image
            src="/images/logo/logo_text_trans_W.png"
            alt="Muse de Marée"
            width={140}
            height={28}
            className="h-5 w-auto"
          />
        </Link>
      </div>
    </main>
  );
}
