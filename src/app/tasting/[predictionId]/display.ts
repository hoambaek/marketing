import { PRODUCTS } from '@/lib/types';
import { PRODUCT_CATEGORY_LABELS } from '@/lib/types/uaps';

/** 시음 페이지·OG 이미지가 공유하는 표시명 해석 (제품명 우선순위, 카테고리 라벨) */
export function resolveTastingDisplay(ctx: {
  productId: string | null;
  productName: string | null;
  productCategory: string | null;
}): { productName: string; categoryLabel: string } {
  // aging_products.product_name 우선, 없으면 인벤토리 PRODUCTS 매핑, 그래도 없으면 일반명
  const inventoryProduct = PRODUCTS.find((p) => p.id === ctx.productId);
  const productName =
    ctx.productName ?? inventoryProduct?.nameKo ?? inventoryProduct?.name ?? '해저 숙성 제품';
  const categoryLabel =
    (ctx.productCategory &&
      PRODUCT_CATEGORY_LABELS[ctx.productCategory as keyof typeof PRODUCT_CATEGORY_LABELS]) ||
    '제품';
  return { productName, categoryLabel };
}
