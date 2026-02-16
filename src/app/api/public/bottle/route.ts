import { NextRequest, NextResponse } from 'next/server';
import { fetchBottleByNfcCode, mapDbBottleToBottle, mapDbBottleUnitToBottleUnit } from '@/lib/supabase/database/inventory';
import { fetchInventoryBatches } from '@/lib/supabase/database/inventory';
import { fetchOceanDataDaily } from '@/lib/supabase/database/ocean-data';
import { PRODUCTS } from '@/lib/types';

// 배치 숙성 정보 + 해양 데이터 조회 공통 함수
async function getAgingAndOceanData(productId: string) {
  const batches = await fetchInventoryBatches();
  const batch = batches?.find(b => b.product_id === productId);
  const aging = batch ? {
    immersionDate: batch.immersion_date,
    retrievalDate: batch.retrieval_date,
    agingDepth: batch.aging_depth,
    agingDays: batch.immersion_date && batch.retrieval_date
      ? Math.ceil((new Date(batch.retrieval_date).getTime() - new Date(batch.immersion_date).getTime()) / (1000 * 60 * 60 * 24))
      : null,
  } : null;

  const agingInfo = aging || (productId === 'first_edition' ? {
    immersionDate: null,
    retrievalDate: null,
    agingDepth: 30,
    agingDays: null,
  } : null);

  let oceanData = null;
  const immersion = batch?.immersion_date;
  const retrieval = batch?.retrieval_date;

  if (immersion) {
    const endDate = retrieval || new Date().toISOString().split('T')[0];
    const rawData = await fetchOceanDataDaily(immersion, endDate);
    if (rawData && rawData.length > 0) {
      oceanData = rawData
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(d => ({
          date: d.date,
          seaTemperatureAvg: d.seaTemperatureAvg,
          waveHeightAvg: d.waveHeightAvg,
          currentVelocityAvg: d.currentVelocityAvg,
        }));
    }
  }

  return { agingInfo, oceanData };
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const previewProductId = request.nextUrl.searchParams.get('productId');

  // 미리보기 모드: productId로 조회
  if (previewProductId) {
    try {
      const product = PRODUCTS.find(p => p.id === previewProductId);
      if (!product) {
        return NextResponse.json({ error: '존재하지 않는 상품입니다' }, { status: 404 });
      }

      const bottle = {
        type: 'preview' as const,
        productId: product.id,
        productName: product.name,
        productNameKo: product.nameKo,
        size: product.size,
      };

      const { agingInfo, oceanData } = await getAgingAndOceanData(product.id);

      return NextResponse.json({ bottle, aging: agingInfo, oceanData });
    } catch (error) {
      console.error('Bottle preview API error:', error);
      return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
    }
  }

  // NFC 코드 조회 모드
  if (!code || code.length < 4 || code.length > 12) {
    return NextResponse.json({ error: '유효하지 않은 코드입니다' }, { status: 400 });
  }

  try {
    const result = await fetchBottleByNfcCode(code);
    if (!result) {
      return NextResponse.json({ error: '등록되지 않은 병입니다' }, { status: 404 });
    }

    let bottle: Record<string, unknown>;
    let productId: string;

    if (result.type === 'numbered') {
      const mapped = mapDbBottleToBottle(result.data as Parameters<typeof mapDbBottleToBottle>[0]);
      productId = mapped.productId;
      bottle = {
        type: 'numbered',
        productId: mapped.productId,
        bottleNumber: mapped.bottleNumber,
        nfcCode: mapped.nfcCode,
        soldDate: mapped.soldDate,
      };
    } else {
      const mapped = mapDbBottleUnitToBottleUnit(result.data as Parameters<typeof mapDbBottleUnitToBottleUnit>[0]);
      productId = mapped.productId;
      bottle = {
        type: 'unit',
        productId: mapped.productId,
        nfcCode: mapped.nfcCode,
        serialNumber: mapped.serialNumber,
        status: mapped.status,
        soldDate: mapped.soldDate,
      };
    }

    const product = PRODUCTS.find(p => p.id === productId);
    if (product) {
      bottle.productName = product.name;
      bottle.productNameKo = product.nameKo;
      bottle.size = product.size;
    }

    const { agingInfo, oceanData } = await getAgingAndOceanData(productId);

    return NextResponse.json({ bottle, aging: agingInfo, oceanData });
  } catch (error) {
    console.error('Bottle API error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
