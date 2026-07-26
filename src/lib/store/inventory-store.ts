'use client';

import { create } from 'zustand';
import {
  ProductType,
  NumberedBottle,
  InventoryBatch,
  InventoryTransaction,
  InventoryStatus,
  BottleUnit,
  PRODUCTS,
} from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import * as db from '@/lib/supabase/database';
import { handleStoreError } from '@/lib/utils/error-handler';

// ═══════════════════════════════════════════════════════════════════════════
// 인벤토리 스토어 인터페이스
// ═══════════════════════════════════════════════════════════════════════════

// Custom Product 타입
interface CustomProduct {
  id: string;
  name: string;
  nameKo: string;
  year: number;
  size: string;
  totalQuantity: number;
  description?: string;
}

interface InventoryState {
  // 데이터
  numberedBottles: NumberedBottle[];
  inventoryBatches: InventoryBatch[];
  transactions: InventoryTransaction[];
  customProducts: CustomProduct[];
  bottleUnits: BottleUnit[];

  // 상태
  isInitialized: boolean;
  isLoading: boolean;
  useSupabase: boolean;

  // 초기화
  initializeInventory: () => Promise<void>;

  // Custom Product Actions
  addProduct: (product: Omit<CustomProduct, 'id'>) => Promise<void>;
  updateProduct: (productId: string, updates: Partial<Omit<CustomProduct, 'id'>>) => Promise<void>;
  removeProduct: (productId: string) => Promise<void>;
  getAllProducts: () => (CustomProduct & { isCustom: boolean; isNumbered: boolean })[];

  // NFC + 숙성 데이터 Actions
  generateNfcCode: (bottleId: string, isNumbered: boolean, details?: {
    productId?: string; status?: 'sold' | 'gifted'; customerName?: string; soldDate?: string;
    price?: number; notes?: string; transactionId?: string;
  }) => Promise<string | null>;
  /**
   * 이 거래에서 아직 코드를 못 받은 병만큼 NFC 코드를 발급하고, 발급한 개수를 돌려준다.
   *
   * 예전에는 몇 병을 팔든 코드가 1개만 나왔다. 3병을 팔면 나머지 2병에는 붙일 태그가
   * 없었다. 지나간 거래의 미발급분과, 기록을 초기화한 뒤 재발급하는 경로도 여기로 온다.
   */
  issueMissingNfcCodes: (transactionId: string, soldDate?: string) => Promise<number>;
  /** NFC 코드로 병을 찾아 "실물 태그 기록 완료"로 표시한다. */
  markNfcWritten: (nfcCode: string) => Promise<void>;
  /**
   * NFC 쓰기를 취소하고 그 병의 기록을 초기화한다.
   * 배치 병은 유닛 자체를 삭제하고, 넘버링 병은 NFC 필드만 비운다(판매 상태는 유지).
   */
  resetNfcRecord: (nfcCode: string) => Promise<boolean>;
  updateBatchAgingData: (productId: string, data: {
    immersionDate?: string | null; retrievalDate?: string | null; agingDepth?: number;
  }) => Promise<void>;

  // Numbered Bottle Actions (2025 First Edition)
  updateBottleStatus: (
    bottleId: string,
    status: InventoryStatus,
    details?: { reservedFor?: string; soldTo?: string; giftedTo?: string; price?: number; notes?: string; soldDate?: string }
  ) => Promise<void>;
  getBottlesByStatus: (status: InventoryStatus) => NumberedBottle[];

  // Batch Inventory Actions (2026 Products)
  updateBatchInventory: (
    productId: ProductType | string,
    changes: { available?: number; reserved?: number; sold?: number; gifted?: number; damaged?: number }
  ) => Promise<void>;
  /**
   * 병 단위 작업. 두 번째 인자는 수량이 아니라 그 병의 한정번호다.
   * 성공하면 만든 거래 id를, 진행할 수 없으면 null을 돌려준다
   * (발급되는 NFC 병을 그 거래에 묶기 위해 id가 필요하다).
   */
  sellFromBatch: (productId: ProductType | string, serialNumber: number, customerName?: string, price?: number, soldDate?: string) => Promise<string | null>;
  reserveFromBatch: (productId: ProductType | string, serialNumber: number, customerName: string) => Promise<string | null>;
  confirmReservation: (productId: ProductType | string, serialNumber: number, customerName?: string, price?: number, soldDate?: string) => Promise<string | null>;
  cancelReservation: (productId: ProductType | string, serialNumber: number) => Promise<string | null>;
  reportDamage: (productId: ProductType | string, serialNumber: number, notes?: string) => Promise<string | null>;
  giftFromBatch: (productId: ProductType | string, serialNumber: number, recipientName: string, notes?: string, soldDate?: string) => Promise<string | null>;

  // Computed
  getProductSummary: (productId: string) => {
    total: number;
    available: number;
    reserved: number;
    sold: number;
    gifted: number;
    damaged: number;
    soldPercent: number;
  };
  getTotalInventoryValue: () => {
    totalBottles: number;
    sold: number;
    available: number;
    reserved: number;
  };

  // Transactions
  getTransactionsByProduct: (productId: ProductType | string) => InventoryTransaction[];
  getRecentTransactions: (limit?: number) => InventoryTransaction[];
  getFilteredTransactions: (year?: number, month?: number, limit?: number) => InventoryTransaction[];
  updateTransaction: (
    transactionId: string,
    updates: Partial<Omit<InventoryTransaction, 'id' | 'createdAt'>>
  ) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;

  // Refresh from Supabase
  refreshFromSupabase: () => Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════════
// ID 생성 유틸리티
// ═══════════════════════════════════════════════════════════════════════════

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/** 병마다 번호를 들고 있는 제품 (2025 퍼스트 에디션). 배치 제품과 처리 경로가 다르다. */
const NUMBERED_PRODUCT_IDS = new Set<string>(PRODUCTS.filter((p) => p.isNumbered).map((p) => p.id));

// ═══════════════════════════════════════════════════════════════════════════
// 초기 데이터 생성 (로컬 폴백용)
// ═══════════════════════════════════════════════════════════════════════════

const createInitialNumberedBottles = (): NumberedBottle[] => {
  const bottles: NumberedBottle[] = [];
  for (let i = 1; i <= 50; i++) {
    bottles.push({
      id: `first-edition-${i}`,
      productId: 'first_edition',
      bottleNumber: i,
      status: 'available',
    });
  }
  return bottles;
};

const createInitialBatches = (): InventoryBatch[] => {
  return PRODUCTS.filter((p) => !p.isNumbered).map((product) => ({
    id: `batch-${product.id}`,
    productId: product.id,
    totalQuantity: product.totalQuantity,
    available: product.totalQuantity,
    reserved: 0,
    sold: 0,
    gifted: 0,
    damaged: 0,
    lastUpdated: new Date().toISOString(),
  }));
};

// ═══════════════════════════════════════════════════════════════════════════
// Zustand 스토어
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// 배치 제품 병 단위 처리
// ═══════════════════════════════════════════════════════════════════════════

type CounterKey = 'available' | 'reserved' | 'sold' | 'gifted' | 'damaged';

type BottleActionSpec = {
  productId: string;
  /** 한정번호 */
  serialNumber: number;
  /** 재고 칸 이동. 예: 판매는 { available: -1, sold: 1 } */
  counterDelta: Partial<Record<CounterKey, number>>;
  txType: InventoryTransaction['type'];
  /** create=새 병 기록, confirm=예약된 병을 고침, release=병 기록 삭제 */
  mode: 'create' | 'confirm' | 'release';
  status?: BottleUnit['status'];
  customerName?: string;
  price?: number;
  notes?: string;
  soldDate?: string;
};

const applyDelta = (b: InventoryBatch, d: Partial<Record<CounterKey, number>>): InventoryBatch => ({
  ...b,
  available: b.available + (d.available ?? 0),
  reserved: b.reserved + (d.reserved ?? 0),
  sold: b.sold + (d.sold ?? 0),
  gifted: b.gifted + (d.gifted ?? 0),
  damaged: b.damaged + (d.damaged ?? 0),
  lastUpdated: new Date().toISOString(),
});

/** 이 거래가 병을 어느 재고 칸에 넣어 뒀는지. 예약취소·반품은 병이 보유로 돌아간 상태다. */
const counterBucketOf = (type: string): CounterKey => {
  switch (type) {
    case 'sale': return 'sold';
    case 'reservation': return 'reserved';
    case 'gift': return 'gifted';
    case 'damage': return 'damaged';
    default: return 'available';
  }
};

/** 이 거래 유형에 맞는 병 상태. null이면 병 기록이 남을 이유가 없다(보유로 복귀). */
const unitStatusOf = (type: string): BottleUnit['status'] | null => {
  switch (type) {
    case 'sale': return 'sold';
    case 'reservation': return 'reserved';
    case 'gift': return 'gifted';
    case 'damage': return 'damaged';
    default: return null;
  }
};

/** 어느 칸도 음수가 되지 않아야 한다 — 없는 재고를 팔 수는 없다 */
const deltaFits = (b: InventoryBatch, d: Partial<Record<CounterKey, number>>): boolean => {
  const next = applyDelta(b, d);
  return next.available >= 0 && next.reserved >= 0 && next.sold >= 0
    && next.gifted >= 0 && next.damaged >= 0;
};

type StoreSet = (partial: (state: InventoryState) => Partial<InventoryState>) => void;
type StoreGet = () => InventoryState;

/**
 * 배치 제품의 병 하나를 처리한다.
 *
 * 재고 칸을 한 병 옮기고, 그 한정번호의 병 기록을 만들거나 고치거나 지우고,
 * 거래를 한 줄 남긴다. 거래의 bottle_number에 한정번호가 들어가므로 거래 내역에서
 * "앙 리유 쉬르 브뤼 #7"로 읽힌다.
 *
 * 성공하면 만든 거래 id를, 진행할 수 없으면 null을 준다.
 */
async function runBottleAction(
  set: StoreSet,
  get: StoreGet,
  spec: BottleActionSpec
): Promise<string | null> {
  const state = get();
  const batch = state.inventoryBatches.find((b) => b.productId === spec.productId);
  if (!batch || !deltaFits(batch, spec.counterDelta)) return null;

  const existing = state.bottleUnits.find(
    (u) => u.productId === spec.productId && u.serialNumber === spec.serialNumber
  );

  // 이미 나간 번호에 또 붙일 수 없고, 없는 병을 확정하거나 무를 수도 없다
  if (spec.mode === 'create' && existing) return null;
  if (spec.mode !== 'create' && !existing) return null;

  const originalBatch = { ...batch };
  const originalUnits = state.bottleUnits;
  const nextBatch = applyDelta(batch, spec.counterDelta);

  const txId = generateId();
  const unitId = existing?.id ?? `unit-${generateId()}`;
  const now = new Date().toISOString();
  const soldDate = spec.soldDate || now.split('T')[0];
  const keepsDate = spec.status === 'sold' || spec.status === 'gifted';
  // 예약을 확정할 때 이름을 새로 넣지 않았으면 예약자 이름을 그대로 쓴다
  const customerName = spec.customerName ?? existing?.customerName;

  const nextUnits: BottleUnit[] =
    spec.mode === 'release'
      ? state.bottleUnits.filter((u) => u.id !== unitId)
      : spec.mode === 'confirm'
        ? state.bottleUnits.map((u) =>
            u.id === unitId
              ? {
                  ...u,
                  status: spec.status ?? u.status,
                  customerName,
                  price: spec.price ?? u.price,
                  notes: spec.notes ?? u.notes,
                  soldDate,
                  transactionId: txId,
                }
              : u
          )
        : [
            ...state.bottleUnits,
            {
              id: unitId,
              productId: spec.productId,
              serialNumber: spec.serialNumber,
              status: spec.status ?? 'sold',
              customerName,
              price: spec.price,
              notes: spec.notes,
              soldDate: keepsDate ? soldDate : undefined,
              transactionId: txId,
              createdAt: now,
            },
          ];

  const transaction: InventoryTransaction = {
    id: txId,
    productId: spec.productId as ProductType,
    bottleNumber: spec.serialNumber,
    type: spec.txType,
    quantity: 1,
    customerName,
    price: spec.price,
    notes: spec.notes,
    createdAt: now,
  };

  // 낙관적 업데이트
  set((s) => ({
    inventoryBatches: s.inventoryBatches.map((b) => (b.productId === spec.productId ? nextBatch : b)),
    bottleUnits: nextUnits,
    transactions: [...s.transactions, transaction],
  }));

  if (!get().useSupabase) return txId;

  try {
    await db.updateInventoryBatch(spec.productId, {
      available: nextBatch.available,
      reserved: nextBatch.reserved,
      sold: nextBatch.sold,
      gifted: nextBatch.gifted,
      damaged: nextBatch.damaged,
    });

    if (spec.mode === 'release') {
      await db.deleteBottleUnit(unitId);
    } else if (spec.mode === 'confirm') {
      // 비워 둔 항목은 덮지 않는다 — 예약 때 넣은 예약자 이름이 지워지면 안 된다
      await db.updateBottleUnit(unitId, {
        status: spec.status ?? 'sold',
        sold_date: soldDate,
        transaction_id: txId,
        ...(spec.customerName !== undefined && { customer_name: spec.customerName }),
        ...(spec.price !== undefined && { price: spec.price }),
        ...(spec.notes !== undefined && { notes: spec.notes }),
      });
    } else {
      await db.createBottleUnit({
        id: unitId,
        product_id: spec.productId,
        nfc_code: null,
        serial_number: spec.serialNumber,
        status: spec.status ?? 'sold',
        customer_name: customerName ?? null,
        sold_date: keepsDate ? soldDate : null,
        price: spec.price ?? null,
        notes: spec.notes ?? null,
        transaction_id: txId,
      });
    }

    await db.createInventoryTransaction({
      id: txId,
      product_id: spec.productId,
      bottle_number: spec.serialNumber,
      type: spec.txType,
      quantity: 1,
      customer_name: customerName ?? null,
      price: spec.price ?? null,
      notes: spec.notes ?? null,
    });

    return txId;
  } catch (error) {
    // 롤백 — 재고·병·거래를 모두 되돌린다
    set((s) => ({
      inventoryBatches: s.inventoryBatches.map((b) => (b.productId === spec.productId ? originalBatch : b)),
      bottleUnits: originalUnits,
      transactions: s.transactions.filter((t) => t.id !== txId),
    }));
    handleStoreError(error, 'InventoryStore.runBottleAction');
    return null;
  }
}

export const useInventoryStore = create<InventoryState>()((set, get) => ({
      // 초기 데이터
      numberedBottles: [],
      inventoryBatches: [],
      transactions: [],
      customProducts: [],
      bottleUnits: [],
      isInitialized: false,
      isLoading: false,
      useSupabase: isSupabaseConfigured(),

      // ═══════════════════════════════════════════════════════════════════
      // 초기화 - Supabase에서 데이터 로드 (항상 최신 데이터 가져오기)
      // ═══════════════════════════════════════════════════════════════════

      initializeInventory: async () => {
        if (!isSupabaseConfigured()) {
          // Supabase 미설정 시 로컬 데이터 사용
          set({
            numberedBottles: createInitialNumberedBottles(),
            inventoryBatches: createInitialBatches(),
            transactions: [],
            isInitialized: true,
            useSupabase: false,
          });
          return;
        }

        set({ isLoading: true });

        try {
          // Supabase에서 데이터 로드 (항상 최신 데이터)
          const [bottles, batches, transactions, customProducts, units] = await Promise.all([
            db.fetchNumberedBottles(),
            db.fetchInventoryBatches(),
            db.fetchInventoryTransactions(500), // 더 많은 트랜잭션 로드
            db.fetchCustomProducts(),
            db.fetchBottleUnits(),
          ]);

          // DB에서 로드한 배치 매핑
          let loadedBatches = batches?.map(db.mapDbBatchToBatch) || [];

          // PRODUCTS에 정의된 제품 중 배치가 없는 것 찾기
          const existingProductIds = new Set(loadedBatches.map(b => b.productId));
          const missingProducts = PRODUCTS.filter(p => !p.isNumbered && !existingProductIds.has(p.id));

          // 누락된 배치 생성 및 DB에 저장
          if (missingProducts.length > 0) {
            const newBatches: InventoryBatch[] = missingProducts.map(product => ({
              id: `batch-${product.id}`,
              productId: product.id,
              totalQuantity: product.totalQuantity,
              available: product.totalQuantity,
              reserved: 0,
              sold: 0,
              gifted: 0,
              damaged: 0,
              lastUpdated: new Date().toISOString(),
            }));

            // DB에 새 배치 저장
            for (const batch of newBatches) {
              await db.createInventoryBatch({
                id: batch.id,
                product_id: batch.productId,
                total_quantity: batch.totalQuantity,
                available: batch.available,
                reserved: batch.reserved,
                sold: batch.sold,
                gifted: batch.gifted,
                damaged: batch.damaged,
              });
            }

            loadedBatches = [...loadedBatches, ...newBatches];
          }

          set({
            numberedBottles: bottles?.map(db.mapDbBottleToBottle) || createInitialNumberedBottles(),
            inventoryBatches: loadedBatches.length > 0 ? loadedBatches : createInitialBatches(),
            transactions: transactions?.map(db.mapDbTransactionToTransaction) || [],
            customProducts: customProducts?.map(db.mapDbCustomProductToProduct) || [],
            bottleUnits: units.map(db.mapDbBottleUnitToBottleUnit),
            isInitialized: true,
            isLoading: false,
            useSupabase: true,
          });
        } catch (error) {
          handleStoreError(error, 'InventoryStore.initializeInventory');
          // 실패 시 로컬 데이터 사용
          set({
            numberedBottles: createInitialNumberedBottles(),
            inventoryBatches: createInitialBatches(),
            transactions: [],
            isInitialized: true,
            isLoading: false,
            useSupabase: false,
          });
        }
      },

      // ═══════════════════════════════════════════════════════════════════
      // Supabase에서 새로고침 (강제 재로드)
      // ═══════════════════════════════════════════════════════════════════

      refreshFromSupabase: async () => {
        if (!isSupabaseConfigured()) return;

        set({ isLoading: true });

        try {
          const [bottles, batches, transactions, customProducts, units] = await Promise.all([
            db.fetchNumberedBottles(),
            db.fetchInventoryBatches(),
            db.fetchInventoryTransactions(500),
            db.fetchCustomProducts(),
            db.fetchBottleUnits(),
          ]);

          // DB에서 로드한 배치 매핑
          let loadedBatches = batches?.map(db.mapDbBatchToBatch) || [];

          // PRODUCTS에 정의된 제품 중 배치가 없는 것 찾기
          const existingProductIds = new Set(loadedBatches.map(b => b.productId));
          const missingProducts = PRODUCTS.filter(p => !p.isNumbered && !existingProductIds.has(p.id));

          // 누락된 배치 생성 및 DB에 저장
          if (missingProducts.length > 0) {
            const newBatches: InventoryBatch[] = missingProducts.map(product => ({
              id: `batch-${product.id}`,
              productId: product.id,
              totalQuantity: product.totalQuantity,
              available: product.totalQuantity,
              reserved: 0,
              sold: 0,
              gifted: 0,
              damaged: 0,
              lastUpdated: new Date().toISOString(),
            }));

            // DB에 새 배치 저장
            for (const batch of newBatches) {
              await db.createInventoryBatch({
                id: batch.id,
                product_id: batch.productId,
                total_quantity: batch.totalQuantity,
                available: batch.available,
                reserved: batch.reserved,
                sold: batch.sold,
                gifted: batch.gifted,
                damaged: batch.damaged,
              });
            }

            loadedBatches = [...loadedBatches, ...newBatches];
          }

          set({
            numberedBottles: bottles?.map(db.mapDbBottleToBottle) || [],
            inventoryBatches: loadedBatches,
            transactions: transactions?.map(db.mapDbTransactionToTransaction) || [],
            customProducts: customProducts?.map(db.mapDbCustomProductToProduct) || [],
            bottleUnits: units.map(db.mapDbBottleUnitToBottleUnit),
            isLoading: false,
          });
        } catch (error) {
          handleStoreError(error, 'InventoryStore.refreshFromSupabase');
          set({ isLoading: false });
        }
      },

      // ═══════════════════════════════════════════════════════════════════
      // Numbered Bottle Actions
      // ═══════════════════════════════════════════════════════════════════

      updateBottleStatus: async (bottleId, status, details) => {
        const bottle = get().numberedBottles.find((b) => b.id === bottleId);
        if (!bottle) return;

        // 원본 저장 (롤백용)
        const originalBottle = { ...bottle };

        const updatedBottle = {
          ...bottle,
          status,
          ...(details?.reservedFor && { reservedFor: details.reservedFor }),
          ...(details?.soldTo && { soldTo: details.soldTo }),
          ...(details?.giftedTo && { giftedTo: details.giftedTo }),
          ...(details?.price && { price: details.price }),
          ...(details?.notes && { notes: details.notes }),
          ...(status === 'sold' && { soldDate: details?.soldDate || new Date().toISOString() }),
          ...((status === 'sold' || status === 'gifted') && details?.soldDate && { soldDate: details.soldDate }),
        };

        // 낙관적 업데이트
        set((state) => ({
          numberedBottles: state.numberedBottles.map((b) =>
            b.id === bottleId ? updatedBottle : b
          ),
        }));

        // Supabase에 저장
        if (get().useSupabase) {
          try {
            // giftedTo는 DB의 sold_to 필드에 저장 (gifted 상태일 때)
            const soldToValue = status === 'gifted'
              ? (details?.giftedTo || null)
              : (details?.soldTo || null);

            await db.updateNumberedBottle(bottleId, {
              status,
              reserved_for: details?.reservedFor || null,
              sold_to: soldToValue,
              price: details?.price || null,
              notes: details?.notes || null,
              sold_date: (status === 'sold' || status === 'gifted') ? (details?.soldDate || new Date().toISOString()) : null,
            });

            // 트랜잭션 기록
            const transactionType =
              status === 'sold' ? 'sale'
                : status === 'reserved' ? 'reservation'
                : status === 'gifted' ? 'gift'
                : status === 'damaged' ? 'damage'
                : 'return';

            // 고객명: sold → soldTo, reserved → reservedFor, gifted → giftedTo
            const customerName = details?.soldTo || details?.reservedFor || details?.giftedTo || null;

            const txId = generateId();
            await db.createInventoryTransaction({
              id: txId,
              product_id: 'first_edition',
              bottle_number: bottle.bottleNumber,
              type: transactionType,
              quantity: 1,
              customer_name: customerName,
              price: details?.price || null,
              notes: details?.notes || null,
            });

            // 로컬 트랜잭션 추가
            set((state) => ({
              transactions: [
                ...state.transactions,
                {
                  id: txId,
                  productId: 'first_edition',
                  bottleNumber: bottle.bottleNumber,
                  type: transactionType,
                  quantity: 1,
                  customerName: customerName || undefined,
                  price: details?.price,
                  notes: details?.notes,
                  createdAt: new Date().toISOString(),
                },
              ],
            }));
          } catch (error) {
            // 롤백
            set((state) => ({
              numberedBottles: state.numberedBottles.map((b) =>
                b.id === bottleId ? originalBottle : b
              ),
            }));
            handleStoreError(error, 'InventoryStore.updateBottleStatus');
          }
        } else {
          // 로컬만 - 트랜잭션 추가
          const transactionType =
            status === 'sold' ? 'sale'
              : status === 'reserved' ? 'reservation'
              : status === 'gifted' ? 'gift'
              : status === 'damaged' ? 'damage'
              : 'return';

          const customerName = details?.soldTo || details?.reservedFor || details?.giftedTo;

          set((state) => ({
            transactions: [
              ...state.transactions,
              {
                id: generateId(),
                productId: 'first_edition',
                bottleNumber: bottle.bottleNumber,
                type: transactionType,
                quantity: 1,
                customerName,
                price: details?.price,
                notes: details?.notes,
                createdAt: new Date().toISOString(),
              },
            ],
          }));
        }
      },

      getBottlesByStatus: (status) => {
        return get().numberedBottles.filter((b) => b.status === status);
      },

      // ═══════════════════════════════════════════════════════════════════
      // NFC + 숙성 데이터 Actions
      // ═══════════════════════════════════════════════════════════════════

      generateNfcCode: async (bottleId, isNumbered, details) => {
        const nfcCode = await db.generateUniqueNfcCode();
        if (!nfcCode) return null;

        if (isNumbered) {
          // 넘버링 병 NFC 등록
          if (get().useSupabase) {
            await db.updateNumberedBottleNfc(bottleId, nfcCode);
          }
          set((state) => ({
            numberedBottles: state.numberedBottles.map((b) =>
              b.id === bottleId ? { ...b, nfcCode, nfcRegisteredAt: new Date().toISOString() } : b
            ),
          }));
        } else if (details?.productId) {
          // 병 기록이 아예 없는 옛 거래를 메우는 경로. 새 판매는 runBottleAction이 병을
          // 먼저 만들고 코드만 붙이므로 여기로 오지 않는다.
          const unitId = `unit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // 한정번호 — 1번부터 올라가며 아직 안 쓴 가장 작은 번호.
          // DB를 우선 신뢰하고(다른 기기에서 발급했을 수 있다), 실패하면 메모리로 계산한다.
          const localUsed = new Set(
            get().bottleUnits
              .filter((u) => u.productId === details.productId && u.serialNumber != null)
              .map((u) => u.serialNumber as number)
          );
          let localNext = 1;
          while (localUsed.has(localNext)) localNext++;
          const serialNumber = get().useSupabase
            ? (await db.getNextBottleUnitSerial(details.productId)) ?? localNext
            : localNext;

          const unit = {
            id: unitId,
            product_id: details.productId,
            nfc_code: nfcCode,
            serial_number: serialNumber,
            status: (details.status || 'sold') as BottleUnit['status'],
            customer_name: details.customerName || null,
            sold_date: details.soldDate || new Date().toISOString().split('T')[0],
            price: details.price || null,
            notes: details.notes || null,
            transaction_id: details.transactionId || null,
          };

          if (get().useSupabase) {
            await db.createBottleUnit(unit);
          }

          set((state) => ({
            bottleUnits: [...state.bottleUnits, {
              id: unitId,
              productId: details.productId!,
              nfcCode,
              serialNumber,
              status: unit.status,
              customerName: details.customerName,
              soldDate: unit.sold_date,
              price: details.price,
              notes: details.notes,
              nfcRegisteredAt: new Date().toISOString(),
              transactionId: details.transactionId,
              createdAt: new Date().toISOString(),
            }],
          }));
        }

        return nfcCode;
      },

      issueMissingNfcCodes: async (transactionId, soldDate) => {
        const tx = get().transactions.find((t) => t.id === transactionId);
        if (!tx) return 0;
        // 넘버링 병(2025 퍼스트 에디션)은 병 행 자체가 코드를 들고 있다. 여기는 배치 병 전용.
        if (NUMBERED_PRODUCT_IDS.has(tx.productId)) return 0;
        if (tx.type !== 'sale' && tx.type !== 'gift') return 0;

        let issued = 0;

        // 1) 이 거래의 병 중 아직 코드가 없는 것에 코드를 붙인다.
        //    새 판매는 병이 먼저 만들어지고 코드가 비어 있는 상태로 여기 온다.
        const codeless = get().bottleUnits.filter(
          (u) => u.transactionId === transactionId && !u.nfcCode
        );
        for (const unit of codeless) {
          const code = await db.generateUniqueNfcCode();
          if (!code) break;
          const registeredAt = new Date().toISOString();

          if (get().useSupabase) {
            const ok = await db.updateBottleUnit(unit.id, {
              nfc_code: code,
              nfc_registered_at: registeredAt,
            });
            if (!ok) break;
          }

          set((state) => ({
            bottleUnits: state.bottleUnits.map((u) =>
              u.id === unit.id ? { ...u, nfcCode: code, nfcRegisteredAt: registeredAt } : u
            ),
          }));
          issued++;
        }

        // 2) 병 기록 자체가 모자란 옛 거래는 수량만큼 채운다.
        //    순차 실행이어야 한다 — 한정번호가 직전 삽입 결과를 보고 매겨진다.
        const linked = get().bottleUnits.filter((u) => u.transactionId === transactionId).length;
        for (let i = linked; i < tx.quantity; i++) {
          const code = await get().generateNfcCode('', false, {
            productId: tx.productId,
            status: tx.type === 'gift' ? 'gifted' : 'sold',
            customerName: tx.customerName,
            soldDate: soldDate || tx.createdAt.slice(0, 10),
            price: tx.price,
            notes: tx.notes,
            transactionId,
          });
          if (!code) break;
          issued++;
        }

        return issued;
      },

      markNfcWritten: async (nfcCode) => {
        const writtenAt = new Date().toISOString();
        const unit = get().bottleUnits.find((u) => u.nfcCode === nfcCode);
        const bottle = get().numberedBottles.find((b) => b.nfcCode === nfcCode);

        // 낙관적 업데이트 — 태그는 이미 물리적으로 기록됐다. UI가 먼저 따라가도 된다.
        set((state) => ({
          bottleUnits: state.bottleUnits.map((u) =>
            u.nfcCode === nfcCode ? { ...u, nfcWrittenAt: writtenAt } : u
          ),
          numberedBottles: state.numberedBottles.map((b) =>
            b.nfcCode === nfcCode ? { ...b, nfcWrittenAt: writtenAt } : b
          ),
        }));

        if (!get().useSupabase) return;

        try {
          if (unit) await db.markBottleUnitNfcWritten(unit.id);
          else if (bottle) await db.markNumberedBottleNfcWritten(bottle.id);
        } catch (error) {
          handleStoreError(error, 'InventoryStore.markNfcWritten');
        }
      },

      /**
       * NFC 정보만 비운다. 병 기록(한정번호·고객·판매 상태)과 재고 수량은 그대로 남는다.
       *
       * 병 행 자체를 지우면 재고 카운터와 어긋난다 — 팔린 것으로 세어 둔 병이
       * 기록만 사라지기 때문이다. 판매를 무르는 건 거래 내역 수정으로 한다.
       */
      resetNfcRecord: async (nfcCode) => {
        const unit = get().bottleUnits.find((u) => u.nfcCode === nfcCode);
        const bottle = get().numberedBottles.find((b) => b.nfcCode === nfcCode);
        if (!unit && !bottle) return false;

        // DB를 먼저 비우고 성공했을 때만 화면을 바꾼다
        if (get().useSupabase) {
          try {
            const ok = unit
              ? await db.clearBottleUnitNfc(unit.id)
              : await db.clearNumberedBottleNfc(bottle!.id);
            if (!ok) return false;
          } catch (error) {
            handleStoreError(error, 'InventoryStore.resetNfcRecord');
            return false;
          }
        }

        const cleared = { nfcCode: undefined, nfcRegisteredAt: undefined, nfcWrittenAt: undefined };
        set((state) => ({
          bottleUnits: state.bottleUnits.map((u) => (u.nfcCode === nfcCode ? { ...u, ...cleared } : u)),
          numberedBottles: state.numberedBottles.map((b) =>
            b.nfcCode === nfcCode ? { ...b, ...cleared } : b
          ),
        }));

        return true;
      },

      updateBatchAgingData: async (productId, data) => {
        // 낙관적 업데이트
        set((state) => ({
          inventoryBatches: state.inventoryBatches.map((b) =>
            b.productId === productId
              ? {
                  ...b,
                  ...(data.immersionDate !== undefined && { immersionDate: data.immersionDate || undefined }),
                  ...(data.retrievalDate !== undefined && { retrievalDate: data.retrievalDate || undefined }),
                  ...(data.agingDepth !== undefined && { agingDepth: data.agingDepth }),
                }
              : b
          ),
        }));

        if (get().useSupabase) {
          try {
            await db.updateBatchAgingDates(
              productId,
              data.immersionDate || null,
              data.retrievalDate || null,
              data.agingDepth
            );
          } catch (error) {
            handleStoreError(error, 'InventoryStore.updateBatchAgingData');
          }
        }
      },

      // ═══════════════════════════════════════════════════════════════════
      // Batch Inventory Actions
      // ═══════════════════════════════════════════════════════════════════

      updateBatchInventory: async (productId, changes) => {
        // 원본 저장 (롤백용)
        const original = get().inventoryBatches.find((b) => b.productId === productId);

        // 낙관적 업데이트
        set((state) => ({
          inventoryBatches: state.inventoryBatches.map((batch) =>
            batch.productId === productId
              ? {
                  ...batch,
                  ...changes,
                  lastUpdated: new Date().toISOString(),
                }
              : batch
          ),
        }));

        // Supabase에 저장
        if (get().useSupabase) {
          try {
            await db.updateInventoryBatch(productId as string, changes);
          } catch (error) {
            // 롤백
            if (original) {
              set((state) => ({
                inventoryBatches: state.inventoryBatches.map((batch) =>
                  batch.productId === productId ? original : batch
                ),
              }));
            }
            handleStoreError(error, 'InventoryStore.updateBatchInventory');
          }
        }
      },

      // ─────────────────────────────────────────────────────────────────
      // 배치 제품 병 단위 작업
      //
      // 모든 병에 NFC를 붙이므로 수량 단위 입출고가 맞지 않는다. 여섯 작업이 모두
      // "한정번호 하나를 이 칸에서 저 칸으로 옮긴다"로 같아져 runBottleAction으로 모았다.
      // ─────────────────────────────────────────────────────────────────

      sellFromBatch: (productId, serialNumber, customerName, price, soldDate) =>
        runBottleAction(set, get, {
          productId: productId as string,
          serialNumber,
          counterDelta: { available: -1, sold: 1 },
          txType: 'sale',
          mode: 'create',
          status: 'sold',
          customerName,
          price,
          soldDate,
        }),

      reserveFromBatch: (productId, serialNumber, customerName) =>
        runBottleAction(set, get, {
          productId: productId as string,
          serialNumber,
          counterDelta: { available: -1, reserved: 1 },
          txType: 'reservation',
          mode: 'create',
          status: 'reserved',
          customerName,
        }),

      giftFromBatch: (productId, serialNumber, recipientName, notes, soldDate) =>
        runBottleAction(set, get, {
          productId: productId as string,
          serialNumber,
          counterDelta: { available: -1, gifted: 1 },
          txType: 'gift',
          mode: 'create',
          status: 'gifted',
          customerName: recipientName,
          notes,
          soldDate,
        }),

      reportDamage: (productId, serialNumber, notes) =>
        runBottleAction(set, get, {
          productId: productId as string,
          serialNumber,
          counterDelta: { available: -1, damaged: 1 },
          txType: 'damage',
          mode: 'create',
          status: 'damaged',
          notes,
        }),

      // 예약해 둔 그 병을 판매로 넘긴다 — 새 병을 만들지 않고 기존 행을 고친다
      confirmReservation: (productId, serialNumber, customerName, price, soldDate) =>
        runBottleAction(set, get, {
          productId: productId as string,
          serialNumber,
          counterDelta: { reserved: -1, sold: 1 },
          txType: 'sale',
          mode: 'confirm',
          status: 'sold',
          customerName,
          price,
          notes: '예약 확정',
          soldDate,
        }),

      // 예약을 무르면 그 병 기록을 지운다 — 한정번호가 풀려 다시 쓸 수 있다
      cancelReservation: (productId, serialNumber) =>
        runBottleAction(set, get, {
          productId: productId as string,
          serialNumber,
          counterDelta: { reserved: -1, available: 1 },
          txType: 'cancel_reservation',
          mode: 'release',
        }),

      // ═══════════════════════════════════════════════════════════════════
      // Custom Product Actions
      // ═══════════════════════════════════════════════════════════════════

      addProduct: async (product) => {
        const id = `custom-${generateId()}`;
        const newProduct: CustomProduct = { ...product, id };

        // 낙관적 업데이트
        set((state) => ({
          customProducts: [...state.customProducts, newProduct],
          inventoryBatches: [
            ...state.inventoryBatches,
            {
              id: `batch-${id}`,
              productId: id as ProductType,
              totalQuantity: product.totalQuantity,
              available: product.totalQuantity,
              reserved: 0,
              sold: 0,
              gifted: 0,
              damaged: 0,
              lastUpdated: new Date().toISOString(),
            },
          ],
        }));

        // Supabase에 저장
        if (get().useSupabase) {
          try {
            await db.createCustomProduct({
              id,
              name: product.name,
              name_ko: product.nameKo,
              year: product.year,
              size: product.size,
              total_quantity: product.totalQuantity,
              description: product.description || null,
            });

            await db.createInventoryBatch({
              id: `batch-${id}`,
              product_id: id,
              total_quantity: product.totalQuantity,
              available: product.totalQuantity,
              reserved: 0,
              sold: 0,
              gifted: 0,
              damaged: 0,
            });
          } catch (error) {
            // 롤백
            set((state) => ({
              customProducts: state.customProducts.filter((p) => p.id !== id),
              inventoryBatches: state.inventoryBatches.filter((b) => b.productId !== id),
            }));
            handleStoreError(error, 'InventoryStore.addProduct');
          }
        }
      },

      removeProduct: async (productId) => {
        // 원본 저장 (롤백용)
        const originalProduct = get().customProducts.find((p) => p.id === productId);
        const originalBatch = get().inventoryBatches.find((b) => b.productId === productId);

        // 낙관적 업데이트
        set((state) => ({
          customProducts: state.customProducts.filter((p) => p.id !== productId),
          inventoryBatches: state.inventoryBatches.filter((b) => b.productId !== productId),
        }));

        if (get().useSupabase) {
          try {
            await db.deleteCustomProduct(productId);
            await db.deleteInventoryBatch(productId);
          } catch (error) {
            // 롤백
            set((state) => ({
              customProducts: originalProduct ? [...state.customProducts, originalProduct] : state.customProducts,
              inventoryBatches: originalBatch ? [...state.inventoryBatches, originalBatch] : state.inventoryBatches,
            }));
            handleStoreError(error, 'InventoryStore.removeProduct');
          }
        }
      },

      updateProduct: async (productId, updates) => {
        const currentState = get();
        const customProduct = currentState.customProducts.find((p) => p.id === productId);
        const baseProduct = PRODUCTS.find((p) => p.id === productId);

        // 커스텀 상품이나 기본 상품 둘 다 없으면 return
        if (!customProduct && !baseProduct) return;

        const isCustom = !!customProduct;

        // 원본 저장 (롤백용)
        const originalCustomProduct = customProduct ? { ...customProduct } : null;
        const originalBatch = currentState.inventoryBatches.find((b) => b.productId === productId);
        const originalBatchCopy = originalBatch ? { ...originalBatch } : null;

        // 배치에서 현재 총수량 가져오기 (DB에 저장된 totalQuantity 사용)
        const batch = currentState.inventoryBatches.find((b) => b.productId === productId);
        const oldTotalQuantity = batch?.totalQuantity ?? (customProduct?.totalQuantity ?? baseProduct?.totalQuantity ?? 0);
        const newTotalQuantity = updates.totalQuantity ?? oldTotalQuantity;
        const quantityDiff = newTotalQuantity - oldTotalQuantity;

        // 커스텀 상품인 경우 로컬 상태 업데이트
        if (isCustom) {
          set((state) => ({
            customProducts: state.customProducts.map((p) =>
              p.id === productId ? { ...p, ...updates } : p
            ),
          }));
        }

        // 총수량이 변경되면 배치 재고의 totalQuantity와 available 조정
        if (quantityDiff !== 0 && batch) {
          const newAvailable = Math.max(0, batch.available + quantityDiff);
          set((state) => ({
            inventoryBatches: state.inventoryBatches.map((b) =>
              b.productId === productId
                ? { ...b, totalQuantity: newTotalQuantity, available: newAvailable, lastUpdated: new Date().toISOString() }
                : b
            ),
          }));

          // 기본 상품과 커스텀 상품 모두 배치의 total_quantity를 DB에 저장
          if (get().useSupabase) {
            try {
              await db.updateInventoryBatch(productId, {
                total_quantity: newTotalQuantity,
                available: newAvailable,
              });
            } catch (error) {
              // 롤백
              if (originalBatchCopy) {
                set((state) => ({
                  inventoryBatches: state.inventoryBatches.map((b) =>
                    b.productId === productId ? originalBatchCopy : b
                  ),
                }));
              }
              handleStoreError(error, 'InventoryStore.updateProduct.batch');
              return;
            }
          }
        }

        // 커스텀 상품인 경우 Supabase에 상품 정보도 저장
        if (isCustom && get().useSupabase) {
          try {
            await db.updateCustomProduct(productId, {
              name: updates.name,
              name_ko: updates.nameKo,
              year: updates.year,
              size: updates.size,
              total_quantity: updates.totalQuantity,
              description: updates.description,
            });
          } catch (error) {
            // 롤백
            if (originalCustomProduct) {
              set((state) => ({
                customProducts: state.customProducts.map((p) =>
                  p.id === productId ? originalCustomProduct : p
                ),
              }));
            }
            if (originalBatchCopy) {
              set((state) => ({
                inventoryBatches: state.inventoryBatches.map((b) =>
                  b.productId === productId ? originalBatchCopy : b
                ),
              }));
            }
            handleStoreError(error, 'InventoryStore.updateProduct.custom');
          }
        }
      },

      getAllProducts: () => {
        const state = get();

        // 기본 상품: 배치의 totalQuantity 사용 (DB에 저장된 값)
        const baseProducts = PRODUCTS.map((p) => {
          const batch = state.inventoryBatches.find((b) => b.productId === p.id);
          // 배치가 있으면 배치의 totalQuantity 사용, 없으면 기본값 사용
          const totalQuantity = batch?.totalQuantity ?? p.totalQuantity;

          return {
            id: p.id,
            name: p.name,
            nameKo: p.nameKo,
            year: p.year,
            size: p.size,
            totalQuantity,
            description: p.description,
            isCustom: false,
            isNumbered: p.isNumbered,
          };
        });

        // 커스텀 상품도 배치의 totalQuantity 사용
        const custom = state.customProducts.map((p) => {
          const batch = state.inventoryBatches.find((b) => b.productId === p.id);
          const totalQuantity = batch?.totalQuantity ?? p.totalQuantity;

          return {
            ...p,
            totalQuantity,
            isCustom: true,
            isNumbered: false,
          };
        });

        return [...baseProducts, ...custom];
      },

      // ═══════════════════════════════════════════════════════════════════
      // Computed
      // ═══════════════════════════════════════════════════════════════════

      getProductSummary: (productId) => {
        const state = get();
        const product = PRODUCTS.find((p) => p.id === productId);
        const customProduct = state.customProducts.find((p) => p.id === productId);

        if (!product && !customProduct) {
          return { total: 0, available: 0, reserved: 0, sold: 0, gifted: 0, damaged: 0, soldPercent: 0 };
        }

        if (product?.isNumbered) {
          // First Edition - numbered bottles
          const bottles = state.numberedBottles.filter((b) => b.productId === productId);
          const available = bottles.filter((b) => b.status === 'available').length;
          const reserved = bottles.filter((b) => b.status === 'reserved').length;
          const sold = bottles.filter((b) => b.status === 'sold').length;
          const gifted = bottles.filter((b) => b.status === 'gifted').length;
          const damaged = bottles.filter((b) => b.status === 'damaged').length;

          return {
            total: product.totalQuantity,
            available,
            reserved,
            sold,
            gifted,
            damaged,
            soldPercent: Math.round((sold / product.totalQuantity) * 100),
          };
        } else {
          // Batch products (including custom products)
          const batch = state.inventoryBatches.find((b) => b.productId === productId);

          if (!batch) {
            const fallbackTotal = product?.totalQuantity || customProduct?.totalQuantity || 0;
            return { total: fallbackTotal, available: 0, reserved: 0, sold: 0, gifted: 0, damaged: 0, soldPercent: 0 };
          }

          // 배치의 totalQuantity 사용 (DB에 저장된 값)
          const total = batch.totalQuantity;

          return {
            total,
            available: batch.available,
            reserved: batch.reserved,
            sold: batch.sold,
            gifted: batch.gifted,
            damaged: batch.damaged,
            soldPercent: total > 0 ? Math.round((batch.sold / total) * 100) : 0,
          };
        }
      },

      getTotalInventoryValue: () => {
        const state = get();
        let totalBottles = 0;
        let sold = 0;
        let available = 0;
        let reserved = 0;

        // Include base products
        PRODUCTS.forEach((product) => {
          const summary = state.getProductSummary(product.id);
          totalBottles += summary.total;
          sold += summary.sold;
          available += summary.available;
          reserved += summary.reserved;
        });

        // Include custom products
        state.customProducts.forEach((product) => {
          const summary = state.getProductSummary(product.id);
          totalBottles += summary.total;
          sold += summary.sold;
          available += summary.available;
          reserved += summary.reserved;
        });

        return { totalBottles, sold, available, reserved };
      },

      // ═══════════════════════════════════════════════════════════════════
      // Transactions
      // ═══════════════════════════════════════════════════════════════════

      getTransactionsByProduct: (productId) => {
        return get().transactions.filter((t) => t.productId === productId);
      },

      getRecentTransactions: (limit = 10) => {
        // 모든 트랜잭션을 시간순으로 정렬하여 반환 (중복 제거 없음)
        return get()
          .transactions
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);
      },

      getFilteredTransactions: (year?: number, month?: number, limit = 50) => {
        let filtered = get().transactions;

        if (year) {
          filtered = filtered.filter((tx) => {
            const txDate = new Date(tx.createdAt);
            return txDate.getFullYear() === year;
          });
        }

        if (month) {
          filtered = filtered.filter((tx) => {
            const txDate = new Date(tx.createdAt);
            return txDate.getMonth() + 1 === month;
          });
        }

        return filtered
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);
      },

      updateTransaction: async (transactionId, updates) => {
        const tx = get().transactions.find((t) => t.id === transactionId);
        if (!tx) return;

        // 넘버링 병(2025)은 병 행을 따로 들고 있어 여기서 손대지 않는다
        const isBatch = !NUMBERED_PRODUCT_IDS.has(tx.productId);
        const unit = isBatch
          ? get().bottleUnits.find((u) => u.transactionId === transactionId)
          : undefined;

        const nextType = updates.type ?? tx.type;
        const nextSerial = updates.bottleNumber ?? tx.bottleNumber;

        // 작업 유형이 바뀌면 재고 칸도 함께 옮긴다.
        // 예전에는 거래 행만 고쳐서 "판매 → 증정"으로 바꿔도 재고는 판매로 남았다.
        const batch = get().inventoryBatches.find((b) => b.productId === tx.productId);
        const counterDelta: Partial<Record<CounterKey, number>> = {};
        if (isBatch && batch && nextType !== tx.type) {
          const from = counterBucketOf(tx.type);
          const to = counterBucketOf(nextType);
          counterDelta[from] = (counterDelta[from] ?? 0) - tx.quantity;
          counterDelta[to] = (counterDelta[to] ?? 0) + tx.quantity;
        }
        const movesCounters = Object.keys(counterDelta).length > 0;
        if (movesCounters && batch && !deltaFits(batch, counterDelta)) return;

        // 새 유형이 '보유'로 돌아가는 것(예약취소·반품)이면 병 기록을 지운다
        const nextStatus = unitStatusOf(nextType);
        const dropsUnit = !!unit && nextStatus === null;

        // 롤백용 원본
        const originalTx = { ...tx };
        const originalBatch = batch ? { ...batch } : null;
        const originalUnits = get().bottleUnits;

        const nextBatch = batch && movesCounters ? applyDelta(batch, counterDelta) : batch;

        // 낙관적 업데이트
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === transactionId ? { ...t, ...updates, bottleNumber: nextSerial } : t
          ),
          inventoryBatches: nextBatch
            ? state.inventoryBatches.map((b) => (b.productId === tx.productId ? nextBatch : b))
            : state.inventoryBatches,
          bottleUnits: !unit
            ? state.bottleUnits
            : dropsUnit
              ? state.bottleUnits.filter((u) => u.id !== unit.id)
              : state.bottleUnits.map((u) =>
                  u.id === unit.id
                    ? {
                        ...u,
                        ...(nextStatus && { status: nextStatus }),
                        ...(nextSerial != null && { serialNumber: nextSerial }),
                        customerName: updates.customerName ?? u.customerName,
                        price: updates.price ?? u.price,
                        notes: updates.notes ?? u.notes,
                      }
                    : u
                ),
        }));

        if (!get().useSupabase) return;

        try {
          await db.updateInventoryTransaction(transactionId, {
            product_id: updates.productId,
            bottle_number: nextSerial ?? null,
            type: updates.type,
            quantity: updates.quantity,
            customer_name: updates.customerName ?? null,
            price: updates.price ?? null,
            notes: updates.notes ?? null,
          });

          if (nextBatch && movesCounters) {
            await db.updateInventoryBatch(tx.productId as string, {
              available: nextBatch.available,
              reserved: nextBatch.reserved,
              sold: nextBatch.sold,
              gifted: nextBatch.gifted,
              damaged: nextBatch.damaged,
            });
          }

          if (unit) {
            if (dropsUnit) {
              await db.deleteBottleUnit(unit.id);
            } else {
              await db.updateBottleUnit(unit.id, {
                ...(nextStatus && { status: nextStatus }),
                ...(nextSerial != null && { serial_number: nextSerial }),
                ...(updates.customerName !== undefined && { customer_name: updates.customerName }),
                ...(updates.price !== undefined && { price: updates.price }),
                ...(updates.notes !== undefined && { notes: updates.notes }),
              });
            }
          }
        } catch (error) {
          // 롤백
          set((state) => ({
            transactions: state.transactions.map((t) => (t.id === transactionId ? originalTx : t)),
            inventoryBatches: originalBatch
              ? state.inventoryBatches.map((b) => (b.productId === tx.productId ? originalBatch : b))
              : state.inventoryBatches,
            bottleUnits: originalUnits,
          }));
          handleStoreError(error, 'InventoryStore.updateTransaction');
        }
      },

      /**
       * 거래를 지우고 그 거래로 나간 병도 함께 되돌린다.
       *
       * 예전에는 재고 숫자만 되돌리고 병 기록을 남겨서, 재고상 안 판 병인데 한정번호는
       * 계속 묶여 있고 NFC 코드도 살아 있는 상태가 됐다.
       */
      deleteTransaction: async (transactionId) => {
        const tx = get().transactions.find((t) => t.id === transactionId);
        if (!tx) return;

        const isBatch = !NUMBERED_PRODUCT_IDS.has(tx.productId);
        const linkedUnits = isBatch
          ? get().bottleUnits.filter((u) => u.transactionId === transactionId)
          : [];

        const batch = isBatch
          ? get().inventoryBatches.find((b) => b.productId === tx.productId)
          : undefined;

        /*
         * 병을 내보낸 거래(판매·예약·증정·손상)만 재고를 되돌린다.
         * 예약취소·반품은 이미 병이 재고로 돌아간 기록이라, 지운다고 되살릴 병 정보가
         * 없다. 숫자를 건드리면 실체 없는 예약이 생기므로 기록만 지운다.
         */
        const bucket = counterBucketOf(tx.type);
        const restores = bucket !== 'available';
        const counterDelta: Partial<Record<CounterKey, number>> = restores
          ? { [bucket]: -tx.quantity, available: tx.quantity }
          : {};

        const originalBatch = batch ? { ...batch } : null;
        const originalUnits = get().bottleUnits;
        const nextBatch = batch && restores ? applyDelta(batch, counterDelta) : batch;
        const droppedIds = new Set(linkedUnits.map((u) => u.id));

        // 낙관적 업데이트
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== transactionId),
          inventoryBatches: nextBatch
            ? state.inventoryBatches.map((b) => (b.productId === tx.productId ? nextBatch : b))
            : state.inventoryBatches,
          bottleUnits: state.bottleUnits.filter((u) => !droppedIds.has(u.id)),
        }));

        if (!get().useSupabase) return;

        try {
          for (const unit of linkedUnits) {
            await db.deleteBottleUnit(unit.id);
          }
          if (nextBatch && restores) {
            await db.updateInventoryBatch(tx.productId as string, {
              available: nextBatch.available,
              reserved: nextBatch.reserved,
              sold: nextBatch.sold,
              gifted: nextBatch.gifted,
              damaged: nextBatch.damaged,
            });
          }
          await db.deleteInventoryTransaction(transactionId);
        } catch (error) {
          // 롤백
          set((state) => ({
            transactions: [...state.transactions, tx],
            inventoryBatches: originalBatch
              ? state.inventoryBatches.map((b) => (b.productId === tx.productId ? originalBatch : b))
              : state.inventoryBatches,
            bottleUnits: originalUnits,
          }));
          handleStoreError(error, 'InventoryStore.deleteTransaction');
        }
      },
}));
