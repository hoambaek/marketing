/**
 * 원가계산기 타입 정의
 */

// 샴페인 종류별 입력
export interface CostCalculatorChampagneType {
  id?: string; // 재고연동 시 product id
  name: string;
  bottles: number;
  costPerBottle: number; // EUR
  packagingCost?: number; // 제품별 패키지 제작비 (KRW)
}

// 원가계산기 설정 (년도별)
export interface CostCalculatorSettings {
  id: string;
  year: number;
  exchangeRate: number; // EUR/KRW
  champagneTypes: CostCalculatorChampagneType[];
  // 수입 비용 (KRW)
  shippingCost: number;
  insuranceCost: number;
  taxCost: number;
  customsFee: number;
  // 가공 원가 (KRW)
  structureCost: number;
  seaUsageFee: number;
  aiMonitoringCost: number;
  certificationCost: number;
  // 판매 원가 (KRW)
  packagingCost: number;
  marketingCost: number;
  sgaCost: number;
  // 메타데이터
  createdAt: string;
  updatedAt: string;
}
