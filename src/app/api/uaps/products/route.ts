/**
 * UAPS 제품(aging_products) CRUD API — service_role 경유, Clerk 인증 필수
 * GET/POST/PATCH/DELETE /api/uaps/products
 *
 * aging_products 테이블은 anon 접근을 차단했으므로 클라이언트는 이 라우트를 경유한다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  fetchAgingProducts,
  createAgingProduct,
  updateAgingProduct,
  deleteAgingProduct,
} from '@/lib/supabase/database/uaps';
import type { ProductInput } from '@/lib/types/uaps';

const UNAUTHORIZED = NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

export async function GET() {
  const { userId } = await auth();
  if (!userId) return UNAUTHORIZED;

  const products = await fetchAgingProducts();
  return NextResponse.json({ products: products ?? [] });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return UNAUTHORIZED;

  const input = (await request.json()) as ProductInput;
  const created = await createAgingProduct(input);
  if (!created) {
    return NextResponse.json({ error: '제품 등록에 실패했습니다.' }, { status: 500 });
  }
  return NextResponse.json({ product: created });
}

export async function PATCH(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return UNAUTHORIZED;

  const { id, updates } = (await request.json()) as {
    id: string;
    updates: Partial<ProductInput> & { status?: string };
  };
  if (!id) {
    return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });
  }
  const updated = await updateAgingProduct(id, updates);
  if (!updated) {
    return NextResponse.json({ error: '제품 수정에 실패했습니다.' }, { status: 500 });
  }
  return NextResponse.json({ product: updated });
}

export async function DELETE(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return UNAUTHORIZED;

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });
  }
  const success = await deleteAgingProduct(id);
  return NextResponse.json({ success });
}
