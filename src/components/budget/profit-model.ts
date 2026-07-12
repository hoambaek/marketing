// ════════════════════════════════════════════════════════════════════════
// 손익 계산 순수 모델
// ════════════════════════════════════════════════════════════════════════
// 대시보드 본체(ProfitDashboard)와 전략 섹션(인사이트 카드 · 레버 랭킹 ·
// 포트폴리오 매트릭스)이 같은 수식을 공유한다.
// React 상태와 분리된 순수 함수이므로, 레버 랭킹이 입력을 ±10% 흔들어
// 순익을 재계산하는 민감도 분석이 가능하다.
// 계산 기준: B2B 공급가액(부가세 별도) · 고정비 배분 = 목표매출 비중.
// ════════════════════════════════════════════════════════════════════════

export type PnLMode = 'actual' | 'target';

export interface TierCalcInput {
  id: string;
  nameKo: string;
  b2bPrice: number;
  varCost: number; // 병당 변동원가 (제품원가+수입비용+가공원가+패키지, 마케팅·판관비 제외)
  sold: number;
  stockTotal: number;
  targetQty: number;
  consumerPrice: number; // 참고용 소비자가
}

export interface TierCalcRow extends TierCalcInput {
  contributionPerBottle: number;
  allocatedFixed: number;
  breakEvenPrice: number;
  recommendedPrice: number;
  breakEvenBottles: number;
  actualRevenue: number;
  actualVarCost: number;
  actualContribution: number;
  targetRevenue: number;
  targetVarCost: number;
  targetContribution: number;
  grossMarginPct: number;
  channelAbsorb: number;
}

export interface ProfitTotals {
  revenue: number;
  varCost: number;
  contribution: number;
  netProfit: number;
  netMarginPct: number;
}

export function computeRows(
  inputs: TierCalcInput[],
  fixedCost: number,
  targetMarginPct: number
): TierCalcRow[] {
  const marginMultiplier = 1 + targetMarginPct / 100;
  const totalTargetRevenue = inputs.reduce((s, r) => s + r.targetQty * r.b2bPrice, 0);

  return inputs.map((r) => {
    const contributionPerBottle = r.b2bPrice - r.varCost;

    // 고정비 배분 = 전사 고정비 × 목표매출 비중
    const revenueShare =
      totalTargetRevenue > 0 ? (r.targetQty * r.b2bPrice) / totalTargetRevenue : 0;
    const allocatedFixed = fixedCost * revenueShare;
    const allocatedFixedPerBottle = r.targetQty > 0 ? allocatedFixed / r.targetQty : 0;

    // 손익분기 공급가 = 병당 변동원가 + 병당 배분 고정비
    const breakEvenPrice = r.varCost + allocatedFixedPerBottle;
    // 권장 공급가 = 손익분기 위에 목표마진 가산
    const recommendedPrice = breakEvenPrice * marginMultiplier;

    // 손익분기 병수 = 배분 고정비 ÷ 병당 공헌이익 (현재 공급가 기준)
    const breakEvenBottles =
      contributionPerBottle > 0 ? allocatedFixed / contributionPerBottle : Infinity;

    // 실적 (판매수량 기준)
    const actualRevenue = r.sold * r.b2bPrice;
    const actualVarCost = r.sold * r.varCost;
    const actualContribution = actualRevenue - actualVarCost;

    // 목표 (목표수량 다 팔았을 때)
    const targetRevenue = r.targetQty * r.b2bPrice;
    const targetVarCost = r.targetQty * r.varCost;
    const targetContribution = targetRevenue - targetVarCost;

    // 현재 공급가 마진 (변동원가 대비, 고정비 배분 전)
    const grossMarginPct = r.b2bPrice > 0 ? (contributionPerBottle / r.b2bPrice) * 100 : 0;

    // 채널 흡수 이득 = 소비자가(참고) − B2B 공급가
    const channelAbsorb = Math.max(0, r.consumerPrice - r.b2bPrice);

    return {
      ...r,
      contributionPerBottle,
      allocatedFixed,
      breakEvenPrice,
      recommendedPrice,
      breakEvenBottles,
      actualRevenue,
      actualVarCost,
      actualContribution,
      targetRevenue,
      targetVarCost,
      targetContribution,
      grossMarginPct,
      channelAbsorb,
    };
  });
}

export function computeTotals(
  rows: TierCalcRow[],
  fixedCost: number,
  mode: PnLMode
): ProfitTotals {
  const useTarget = mode === 'target';
  const revenue = rows.reduce((s, r) => s + (useTarget ? r.targetRevenue : r.actualRevenue), 0);
  const varCost = rows.reduce((s, r) => s + (useTarget ? r.targetVarCost : r.actualVarCost), 0);
  const contribution = revenue - varCost;
  const netProfit = contribution - fixedCost;
  const netMarginPct = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  return { revenue, varCost, contribution, netProfit, netMarginPct };
}

export function computeNetProfit(
  inputs: TierCalcInput[],
  fixedCost: number,
  targetMarginPct: number,
  mode: PnLMode
): number {
  return computeTotals(computeRows(inputs, fixedCost, targetMarginPct), fixedCost, mode).netProfit;
}
