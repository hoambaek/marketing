import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { dbLogger } from '@/lib/logger';

// ════════════════════════════════════════════════════════════════════════
// 월별 손익 스냅샷 — service_role 전용 (RLS로 anon 접근 전면 차단)
// ════════════════════════════════════════════════════════════════════════
// budget 대시보드가 열릴 때마다 해당 월 행을 upsert한다.
// 월이 끝나면 마지막 기록이 곧 월말 스냅샷 — Phase 3 손익 브리지의
// 기간 비교(가격·수량·믹스 분해) 원천 데이터가 된다.
// ════════════════════════════════════════════════════════════════════════

export interface ProfitSnapshotTier {
  id: string;
  nameKo: string;
  b2bPrice: number;
  varCost: number;
  sold: number;
  targetQty: number;
}

export interface ProfitSnapshotInput {
  year: number;
  month: number;
  revenue: number;
  variableCost: number;
  contribution: number;
  fixedCost: number;
  netProfit: number;
  tiers: ProfitSnapshotTier[];
}

export interface ProfitSnapshotRecord extends ProfitSnapshotInput {
  snapshotDate: string;
}

export async function fetchProfitSnapshots(year: number): Promise<ProfitSnapshotRecord[]> {
  if (!supabaseAdmin) return [];

  const { data, error } = await supabaseAdmin
    .from('profit_snapshots')
    .select(
      'year, month, snapshot_date, revenue, variable_cost, contribution, fixed_cost, net_profit, tiers'
    )
    .eq('year', year)
    .order('month', { ascending: true });

  if (error) {
    dbLogger.error('profit_snapshots 조회 실패', error);
    return [];
  }

  return (data || []).map((d) => ({
    year: d.year,
    month: d.month,
    snapshotDate: d.snapshot_date,
    revenue: Number(d.revenue),
    variableCost: Number(d.variable_cost),
    contribution: Number(d.contribution),
    fixedCost: Number(d.fixed_cost),
    netProfit: Number(d.net_profit),
    tiers: (d.tiers as ProfitSnapshotTier[]) || [],
  }));
}

export async function upsertProfitSnapshot(input: ProfitSnapshotInput): Promise<boolean> {
  if (!supabaseAdmin) {
    dbLogger.warn('profit_snapshots: service_role 미설정으로 스냅샷을 건너뜁니다.');
    return false;
  }

  const { error } = await supabaseAdmin.from('profit_snapshots').upsert(
    {
      year: input.year,
      month: input.month,
      snapshot_date: new Date().toISOString().slice(0, 10),
      revenue: input.revenue,
      variable_cost: input.variableCost,
      contribution: input.contribution,
      fixed_cost: input.fixedCost,
      net_profit: input.netProfit,
      tiers: input.tiers,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'year,month' }
  );

  if (error) {
    dbLogger.error('profit_snapshots upsert 실패', error);
    return false;
  }
  return true;
}
