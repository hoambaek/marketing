import { NextRequest, NextResponse } from 'next/server';
import {
  upsertProfitSnapshot,
  type ProfitSnapshotInput,
} from '@/lib/supabase/database/profit-snapshots';

// 월별 손익 스냅샷 upsert — service_role 경유 (Clerk 미들웨어가 보호)
export async function POST(req: NextRequest) {
  let body: Partial<ProfitSnapshotInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const { year, month } = body;
  if (
    typeof year !== 'number' ||
    typeof month !== 'number' ||
    month < 1 ||
    month > 12 ||
    !Array.isArray(body.tiers)
  ) {
    return NextResponse.json({ error: 'year/month/tiers가 필요합니다.' }, { status: 400 });
  }

  const numeric = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

  const ok = await upsertProfitSnapshot({
    year,
    month,
    revenue: numeric(body.revenue),
    variableCost: numeric(body.variableCost),
    contribution: numeric(body.contribution),
    fixedCost: numeric(body.fixedCost),
    netProfit: numeric(body.netProfit),
    tiers: body.tiers,
  });

  if (!ok) {
    return NextResponse.json(
      { error: '스냅샷 저장에 실패했습니다. SUPABASE_SERVICE_ROLE_KEY 설정을 확인하세요.' },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
