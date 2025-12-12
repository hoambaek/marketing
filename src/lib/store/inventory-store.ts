'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ProductType,
  NumberedBottle,
  InventoryBatch,
  InventoryTransaction,
  InventoryStatus,
  PRODUCTS,
} from '@/lib/types';

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

  // 상태
  isInitialized: boolean;

  // 초기화
  initializeInventory: () => void;

  // Custom Product Actions
  addProduct: (product: Omit<CustomProduct, 'id'>) => void;
  removeProduct: (productId: string) => void;
  getAllProducts: () => (CustomProduct & { isCustom: boolean; isNumbered: boolean })[];

  // Numbered Bottle Actions (2025 First Edition)
  updateBottleStatus: (
    bottleId: string,
    status: InventoryStatus,
    details?: { reservedFor?: string; soldTo?: string; price?: number; notes?: string }
  ) => void;
  getBottlesByStatus: (status: InventoryStatus) => NumberedBottle[];

  // Batch Inventory Actions (2026 Products)
  updateBatchInventory: (
    productId: ProductType,
    changes: { available?: number; reserved?: number; sold?: number; gifted?: number; damaged?: number }
  ) => void;
  sellFromBatch: (productId: ProductType, quantity: number, customerName?: string, price?: number) => void;
  reserveFromBatch: (productId: ProductType, quantity: number, customerName: string) => void;
  confirmReservation: (productId: ProductType, quantity: number, customerName?: string, price?: number) => void;
  cancelReservation: (productId: ProductType, quantity: number) => void;
  reportDamage: (productId: ProductType, quantity: number, notes?: string) => void;
  giftFromBatch: (productId: ProductType, quantity: number, recipientName: string, notes?: string) => void;

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
  getTransactionsByProduct: (productId: ProductType) => InventoryTransaction[];
  getRecentTransactions: (limit?: number) => InventoryTransaction[];
}

// ═══════════════════════════════════════════════════════════════════════════
// ID 생성 유틸리티
// ═══════════════════════════════════════════════════════════════════════════

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ═══════════════════════════════════════════════════════════════════════════
// 초기 데이터 생성
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

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      // 초기 데이터
      numberedBottles: [],
      inventoryBatches: [],
      transactions: [],
      customProducts: [],
      isInitialized: false,

      // ═══════════════════════════════════════════════════════════════════
      // 초기화
      // ═══════════════════════════════════════════════════════════════════

      initializeInventory: () => {
        const state = get();
        if (state.isInitialized && state.numberedBottles.length > 0) return;

        set({
          numberedBottles: createInitialNumberedBottles(),
          inventoryBatches: createInitialBatches(),
          transactions: [],
          isInitialized: true,
        });
      },

      // ═══════════════════════════════════════════════════════════════════
      // Numbered Bottle Actions
      // ═══════════════════════════════════════════════════════════════════

      updateBottleStatus: (bottleId, status, details) => {
        const bottle = get().numberedBottles.find((b) => b.id === bottleId);
        if (!bottle) return;

        // 상태 업데이트
        set((state) => ({
          numberedBottles: state.numberedBottles.map((b) =>
            b.id === bottleId
              ? {
                  ...b,
                  status,
                  ...(details?.reservedFor && { reservedFor: details.reservedFor }),
                  ...(details?.soldTo && { soldTo: details.soldTo }),
                  ...(details?.price && { price: details.price }),
                  ...(details?.notes && { notes: details.notes }),
                  ...(status === 'sold' && { soldDate: new Date().toISOString() }),
                }
              : b
          ),
        }));

        // 트랜잭션 기록
        const transactionType =
          status === 'sold'
            ? 'sale'
            : status === 'reserved'
            ? 'reservation'
            : status === 'gifted'
            ? 'gift'
            : status === 'damaged'
            ? 'damage'
            : 'return';

        set((state) => ({
          transactions: [
            ...state.transactions,
            {
              id: generateId(),
              productId: 'first_edition',
              bottleNumber: bottle.bottleNumber,
              type: transactionType,
              quantity: 1,
              customerName: details?.soldTo || details?.reservedFor,
              price: details?.price,
              notes: details?.notes,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },

      getBottlesByStatus: (status) => {
        return get().numberedBottles.filter((b) => b.status === status);
      },

      // ═══════════════════════════════════════════════════════════════════
      // Batch Inventory Actions
      // ═══════════════════════════════════════════════════════════════════

      updateBatchInventory: (productId, changes) => {
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
      },

      sellFromBatch: (productId, quantity, customerName, price) => {
        const batch = get().inventoryBatches.find((b) => b.productId === productId);
        if (!batch || batch.available < quantity) return;

        set((state) => ({
          inventoryBatches: state.inventoryBatches.map((b) =>
            b.productId === productId
              ? {
                  ...b,
                  available: b.available - quantity,
                  sold: b.sold + quantity,
                  lastUpdated: new Date().toISOString(),
                }
              : b
          ),
          transactions: [
            ...state.transactions,
            {
              id: generateId(),
              productId,
              type: 'sale',
              quantity,
              customerName,
              price,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },

      reserveFromBatch: (productId, quantity, customerName) => {
        const batch = get().inventoryBatches.find((b) => b.productId === productId);
        if (!batch || batch.available < quantity) return;

        set((state) => ({
          inventoryBatches: state.inventoryBatches.map((b) =>
            b.productId === productId
              ? {
                  ...b,
                  available: b.available - quantity,
                  reserved: b.reserved + quantity,
                  lastUpdated: new Date().toISOString(),
                }
              : b
          ),
          transactions: [
            ...state.transactions,
            {
              id: generateId(),
              productId,
              type: 'reservation',
              quantity,
              customerName,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },

      confirmReservation: (productId, quantity, customerName, price) => {
        const batch = get().inventoryBatches.find((b) => b.productId === productId);
        if (!batch || batch.reserved < quantity) return;

        set((state) => ({
          inventoryBatches: state.inventoryBatches.map((b) =>
            b.productId === productId
              ? {
                  ...b,
                  reserved: b.reserved - quantity,
                  sold: b.sold + quantity,
                  lastUpdated: new Date().toISOString(),
                }
              : b
          ),
          transactions: [
            ...state.transactions,
            {
              id: generateId(),
              productId,
              type: 'sale',
              quantity,
              customerName,
              price,
              notes: '예약 확정',
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },

      cancelReservation: (productId, quantity) => {
        const batch = get().inventoryBatches.find((b) => b.productId === productId);
        if (!batch || batch.reserved < quantity) return;

        set((state) => ({
          inventoryBatches: state.inventoryBatches.map((b) =>
            b.productId === productId
              ? {
                  ...b,
                  reserved: b.reserved - quantity,
                  available: b.available + quantity,
                  lastUpdated: new Date().toISOString(),
                }
              : b
          ),
          transactions: [
            ...state.transactions,
            {
              id: generateId(),
              productId,
              type: 'cancel_reservation',
              quantity,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },

      reportDamage: (productId, quantity, notes) => {
        const batch = get().inventoryBatches.find((b) => b.productId === productId);
        if (!batch || batch.available < quantity) return;

        set((state) => ({
          inventoryBatches: state.inventoryBatches.map((b) =>
            b.productId === productId
              ? {
                  ...b,
                  available: b.available - quantity,
                  damaged: b.damaged + quantity,
                  lastUpdated: new Date().toISOString(),
                }
              : b
          ),
          transactions: [
            ...state.transactions,
            {
              id: generateId(),
              productId,
              type: 'damage',
              quantity,
              notes,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },

      giftFromBatch: (productId, quantity, recipientName, notes) => {
        const batch = get().inventoryBatches.find((b) => b.productId === productId);
        if (!batch || batch.available < quantity) return;

        set((state) => ({
          inventoryBatches: state.inventoryBatches.map((b) =>
            b.productId === productId
              ? {
                  ...b,
                  available: b.available - quantity,
                  gifted: b.gifted + quantity,
                  lastUpdated: new Date().toISOString(),
                }
              : b
          ),
          transactions: [
            ...state.transactions,
            {
              id: generateId(),
              productId,
              type: 'gift',
              quantity,
              customerName: recipientName,
              notes,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },

      // ═══════════════════════════════════════════════════════════════════
      // Custom Product Actions
      // ═══════════════════════════════════════════════════════════════════

      addProduct: (product) => {
        const id = `custom-${generateId()}`;
        const newProduct: CustomProduct = { ...product, id };

        // Add to custom products
        set((state) => ({
          customProducts: [...state.customProducts, newProduct],
          // Also create inventory batch for the new product
          inventoryBatches: [
            ...state.inventoryBatches,
            {
              id: `batch-${id}`,
              productId: id as ProductType,
              available: product.totalQuantity,
              reserved: 0,
              sold: 0,
              gifted: 0,
              damaged: 0,
              lastUpdated: new Date().toISOString(),
            },
          ],
        }));
      },

      removeProduct: (productId) => {
        set((state) => ({
          customProducts: state.customProducts.filter((p) => p.id !== productId),
          inventoryBatches: state.inventoryBatches.filter((b) => b.productId !== productId),
        }));
      },

      getAllProducts: () => {
        const state = get();
        const baseProducts = PRODUCTS.map((p) => ({
          id: p.id,
          name: p.name,
          nameKo: p.nameKo,
          year: p.year,
          size: p.size,
          totalQuantity: p.totalQuantity,
          description: p.description,
          isCustom: false,
          isNumbered: p.isNumbered,
        }));

        const custom = state.customProducts.map((p) => ({
          ...p,
          isCustom: true,
          isNumbered: false,
        }));

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
          const totalQuantity = product?.totalQuantity || customProduct?.totalQuantity || 0;

          if (!batch) {
            return { total: totalQuantity, available: 0, reserved: 0, sold: 0, gifted: 0, damaged: 0, soldPercent: 0 };
          }

          return {
            total: totalQuantity,
            available: batch.available,
            reserved: batch.reserved,
            sold: batch.sold,
            gifted: batch.gifted,
            damaged: batch.damaged,
            soldPercent: totalQuantity > 0 ? Math.round((batch.sold / totalQuantity) * 100) : 0,
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
        return get()
          .transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);
      },
    }),
    {
      name: 'muse-de-maree-inventory',
      partialize: (state) => ({
        numberedBottles: state.numberedBottles,
        inventoryBatches: state.inventoryBatches,
        transactions: state.transactions,
        customProducts: state.customProducts,
        isInitialized: state.isInitialized,
      }),
    }
  )
);
