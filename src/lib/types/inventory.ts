/**
 * 재고관리 타입 정의
 */

// 상품 타입
export type ProductType = 'first_edition' | 'en_lieu_sur_brut' | 'en_lieu_sur_magnum' | 'element_de_surprise' | 'atomes_crochus_1y' | 'atomes_crochus_2y';

// 상품 사이즈
export type BottleSize = '750ml' | '1500ml';

// 재고 상태
export type InventoryStatus = 'available' | 'reserved' | 'sold' | 'gifted' | 'damaged';

// 상품 정보
export interface Product {
  id: ProductType;
  name: string;
  nameKo: string;
  year: number;
  size: BottleSize;
  totalQuantity: number;
  isNumbered: boolean;
  description?: string;
}

// 개별 병 재고 (2025 First Edition - 넘버링 추적)
export interface NumberedBottle {
  id: string;
  productId: ProductType;
  bottleNumber: number;
  status: InventoryStatus;
  reservedFor?: string;
  soldTo?: string;
  giftedTo?: string;
  soldDate?: string;
  price?: number;
  notes?: string;
  nfcCode?: string;
  nfcRegisteredAt?: string;
}

// 일반 재고 (2026 제품 - 수량 추적)
export interface InventoryBatch {
  id: string;
  productId: ProductType;
  totalQuantity: number;
  available: number;
  reserved: number;
  sold: number;
  gifted: number;
  damaged: number;
  lastUpdated: string;
  immersionDate?: string;
  retrievalDate?: string;
  agingDepth?: number;
}

// 배치 제품 개별 병 (NFC 추적용)
export interface BottleUnit {
  id: string;
  productId: string;
  nfcCode: string;
  serialNumber?: number;
  status: 'sold' | 'gifted';
  customerName?: string;
  soldDate?: string;
  price?: number;
  notes?: string;
  nfcRegisteredAt?: string;
  createdAt?: string;
}

// 재고 거래 기록
export interface InventoryTransaction {
  id: string;
  productId: ProductType;
  bottleNumber?: number;
  type: 'sale' | 'reservation' | 'gift' | 'damage' | 'return' | 'cancel_reservation';
  quantity: number;
  customerName?: string;
  price?: number;
  notes?: string;
  createdAt: string;
}

// 상품 목록
export const PRODUCTS: Product[] = [
  {
    id: 'first_edition',
    name: '2025 First Edition',
    nameKo: '2025 퍼스트 에디션',
    year: 2025,
    size: '750ml',
    totalQuantity: 50,
    isNumbered: true,
    description: '한정판 넘버링 에디션 (1-50)',
  },
  {
    id: 'en_lieu_sur_brut',
    name: 'En Lieu Sur Brut',
    nameKo: '앙 리유 쉬르 브뤼',
    year: 2026,
    size: '750ml',
    totalQuantity: 200,
    isNumbered: false,
    description: '2026 레귤러 브뤼',
  },
  {
    id: 'en_lieu_sur_magnum',
    name: 'En Lieu Sur Magnum',
    nameKo: '앙 리유 쉬르 매그넘',
    year: 2026,
    size: '1500ml',
    totalQuantity: 24,
    isNumbered: false,
    description: '2026 매그넘 에디션',
  },
  {
    id: 'element_de_surprise',
    name: 'Élément de Surprise BDB',
    nameKo: '엘레멘 드 쉬르프리즈 BDB',
    year: 2026,
    size: '750ml',
    totalQuantity: 110,
    isNumbered: false,
    description: '블랑 드 블랑',
  },
  {
    id: 'atomes_crochus_1y',
    name: 'Atomes Crochus (1Y)',
    nameKo: '아톰 크로슈 (1년)',
    year: 2026,
    size: '750ml',
    totalQuantity: 100,
    isNumbered: false,
    description: '1년 해저숙성',
  },
  {
    id: 'atomes_crochus_2y',
    name: 'Atomes Crochus (2Y)',
    nameKo: '아톰 크로슈 (2년)',
    year: 2026,
    size: '750ml',
    totalQuantity: 40,
    isNumbered: false,
    description: '2년 해저숙성 한정판',
  },
];

// 재고 상태 라벨
export const INVENTORY_STATUS_LABELS: Record<InventoryStatus, string> = {
  available: '판매 가능',
  reserved: '예약됨',
  sold: '판매 완료',
  gifted: '증정',
  damaged: '손상',
};

// 재고 상태 색상 (Tailwind 클래스)
export const INVENTORY_STATUS_COLORS: Record<InventoryStatus, string> = {
  available: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  reserved: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  sold: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  gifted: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  damaged: 'bg-red-500/20 text-red-400 border-red-500/30',
};
