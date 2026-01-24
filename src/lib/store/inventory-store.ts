'use client';

import { create } from 'zustand';
import {
  ProductType,
  NumberedBottle,
  InventoryBatch,
  InventoryTransaction,
  InventoryStatus,
  PRODUCTS,
} from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import * as db from '@/lib/supabase/database';
import { storeLogger } from '@/lib/logger';

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
  isLoading: boolean;
  useSupabase: boolean;

  // 초기화
  initializeInventory: () => Promise<void>;

  // Custom Product Actions
  addProduct: (product: Omit<CustomProduct, 'id'>) => Promise<void>;
  removeProduct: (productId: string) => Promise<void>;
  getAllProducts: () => (CustomProduct & { isCustom: boolean; isNumbered: boolean })[];

  // Numbered Bottle Actions (2025 First Edition)
  updateBottleStatus: (
    bottleId: string,
    status: InventoryStatus,
    details?: { reservedFor?: string; soldTo?: string; giftedTo?: string; price?: number; notes?: string }
  ) => Promise<void>;
  getBottlesByStatus: (status: InventoryStatus) => NumberedBottle[];

  // Batch Inventory Actions (2026 Products)
  updateBatchInventory: (
    productId: ProductType | string,
    changes: { available?: number; reserved?: number; sold?: number; gifted?: number; damaged?: number }
  ) => Promise<void>;
  sellFromBatch: (productId: ProductType | string, quantity: number, customerName?: string, price?: number) => Promise<void>;
  reserveFromBatch: (productId: ProductType | string, quantity: number, customerName: string) => Promise<void>;
  confirmReservation: (productId: ProductType | string, quantity: number, customerName?: string, price?: number) => Promise<void>;
  cancelReservation: (productId: ProductType | string, quantity: number) => Promise<void>;
  reportDamage: (productId: ProductType | string, quantity: number, notes?: string) => Promise<void>;
  giftFromBatch: (productId: ProductType | string, quantity: number, recipientName: string, notes?: string) => Promise<void>;

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

  // Refresh from Supabase
  refreshFromSupabase: () => Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════════
// ID 생성 유틸리티
// ═══════════════════════════════════════════════════════════════════════════

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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

export const useInventoryStore = create<InventoryState>()((set, get) => ({
      // 초기 데이터
      numberedBottles: [],
      inventoryBatches: [],
      transactions: [],
      customProducts: [],
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
          const [bottles, batches, transactions, customProducts] = await Promise.all([
            db.fetchNumberedBottles(),
            db.fetchInventoryBatches(),
            db.fetchInventoryTransactions(500), // 더 많은 트랜잭션 로드
            db.fetchCustomProducts(),
          ]);

          set({
            numberedBottles: bottles?.map(db.mapDbBottleToBottle) || createInitialNumberedBottles(),
            inventoryBatches: batches?.map(db.mapDbBatchToBatch) || createInitialBatches(),
            transactions: transactions?.map(db.mapDbTransactionToTransaction) || [],
            customProducts: customProducts?.map(db.mapDbCustomProductToProduct) || [],
            isInitialized: true,
            isLoading: false,
            useSupabase: true,
          });
        } catch (error) {
          storeLogger.error('Failed to load inventory from Supabase:', error);
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
          const [bottles, batches, transactions, customProducts] = await Promise.all([
            db.fetchNumberedBottles(),
            db.fetchInventoryBatches(),
            db.fetchInventoryTransactions(500),
            db.fetchCustomProducts(),
          ]);

          set({
            numberedBottles: bottles?.map(db.mapDbBottleToBottle) || [],
            inventoryBatches: batches?.map(db.mapDbBatchToBatch) || [],
            transactions: transactions?.map(db.mapDbTransactionToTransaction) || [],
            customProducts: customProducts?.map(db.mapDbCustomProductToProduct) || [],
            isLoading: false,
          });
        } catch (error) {
          storeLogger.error('Failed to refresh from Supabase:', error);
          set({ isLoading: false });
        }
      },

      // ═══════════════════════════════════════════════════════════════════
      // Numbered Bottle Actions
      // ═══════════════════════════════════════════════════════════════════

      updateBottleStatus: async (bottleId, status, details) => {
        const bottle = get().numberedBottles.find((b) => b.id === bottleId);
        if (!bottle) return;

        const updatedBottle = {
          ...bottle,
          status,
          ...(details?.reservedFor && { reservedFor: details.reservedFor }),
          ...(details?.soldTo && { soldTo: details.soldTo }),
          ...(details?.giftedTo && { giftedTo: details.giftedTo }),
          ...(details?.price && { price: details.price }),
          ...(details?.notes && { notes: details.notes }),
          ...(status === 'sold' && { soldDate: new Date().toISOString() }),
        };

        // 로컬 상태 업데이트
        set((state) => ({
          numberedBottles: state.numberedBottles.map((b) =>
            b.id === bottleId ? updatedBottle : b
          ),
        }));

        // Supabase에 저장
        if (get().useSupabase) {
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
            sold_date: status === 'sold' ? new Date().toISOString() : null,
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
      // Batch Inventory Actions
      // ═══════════════════════════════════════════════════════════════════

      updateBatchInventory: async (productId, changes) => {
        // 로컬 상태 업데이트
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
          await db.updateInventoryBatch(productId as string, changes);
        }
      },

      sellFromBatch: async (productId, quantity, customerName, price) => {
        const batch = get().inventoryBatches.find((b) => b.productId === productId);
        if (!batch || batch.available < quantity) return;

        // 로컬 상태 업데이트
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
        }));

        // Supabase에 저장
        if (get().useSupabase) {
          await db.updateInventoryBatch(productId as string, {
            available: batch.available - quantity,
            sold: batch.sold + quantity,
          });

          const txId = generateId();
          await db.createInventoryTransaction({
            id: txId,
            product_id: productId as string,
            bottle_number: null,
            type: 'sale',
            quantity,
            customer_name: customerName || null,
            price: price || null,
            notes: null,
          });

          set((state) => ({
            transactions: [
              ...state.transactions,
              {
                id: txId,
                productId: productId as ProductType,
                type: 'sale',
                quantity,
                customerName,
                price,
                createdAt: new Date().toISOString(),
              },
            ],
          }));
        } else {
          set((state) => ({
            transactions: [
              ...state.transactions,
              {
                id: generateId(),
                productId: productId as ProductType,
                type: 'sale',
                quantity,
                customerName,
                price,
                createdAt: new Date().toISOString(),
              },
            ],
          }));
        }
      },

      reserveFromBatch: async (productId, quantity, customerName) => {
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
        }));

        if (get().useSupabase) {
          await db.updateInventoryBatch(productId as string, {
            available: batch.available - quantity,
            reserved: batch.reserved + quantity,
          });

          const txId = generateId();
          await db.createInventoryTransaction({
            id: txId,
            product_id: productId as string,
            bottle_number: null,
            type: 'reservation',
            quantity,
            customer_name: customerName,
            price: null,
            notes: null,
          });

          set((state) => ({
            transactions: [
              ...state.transactions,
              {
                id: txId,
                productId: productId as ProductType,
                type: 'reservation',
                quantity,
                customerName,
                createdAt: new Date().toISOString(),
              },
            ],
          }));
        } else {
          set((state) => ({
            transactions: [
              ...state.transactions,
              {
                id: generateId(),
                productId: productId as ProductType,
                type: 'reservation',
                quantity,
                customerName,
                createdAt: new Date().toISOString(),
              },
            ],
          }));
        }
      },

      confirmReservation: async (productId, quantity, customerName, price) => {
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
        }));

        if (get().useSupabase) {
          await db.updateInventoryBatch(productId as string, {
            reserved: batch.reserved - quantity,
            sold: batch.sold + quantity,
          });

          const txId = generateId();
          await db.createInventoryTransaction({
            id: txId,
            product_id: productId as string,
            bottle_number: null,
            type: 'sale',
            quantity,
            customer_name: customerName || null,
            price: price || null,
            notes: '예약 확정',
          });

          set((state) => ({
            transactions: [
              ...state.transactions,
              {
                id: txId,
                productId: productId as ProductType,
                type: 'sale',
                quantity,
                customerName,
                price,
                notes: '예약 확정',
                createdAt: new Date().toISOString(),
              },
            ],
          }));
        } else {
          set((state) => ({
            transactions: [
              ...state.transactions,
              {
                id: generateId(),
                productId: productId as ProductType,
                type: 'sale',
                quantity,
                customerName,
                price,
                notes: '예약 확정',
                createdAt: new Date().toISOString(),
              },
            ],
          }));
        }
      },

      cancelReservation: async (productId, quantity) => {
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
        }));

        if (get().useSupabase) {
          await db.updateInventoryBatch(productId as string, {
            reserved: batch.reserved - quantity,
            available: batch.available + quantity,
          });

          const txId = generateId();
          await db.createInventoryTransaction({
            id: txId,
            product_id: productId as string,
            bottle_number: null,
            type: 'cancel_reservation',
            quantity,
            customer_name: null,
            price: null,
            notes: null,
          });

          set((state) => ({
            transactions: [
              ...state.transactions,
              {
                id: txId,
                productId: productId as ProductType,
                type: 'cancel_reservation',
                quantity,
                createdAt: new Date().toISOString(),
              },
            ],
          }));
        } else {
          set((state) => ({
            transactions: [
              ...state.transactions,
              {
                id: generateId(),
                productId: productId as ProductType,
                type: 'cancel_reservation',
                quantity,
                createdAt: new Date().toISOString(),
              },
            ],
          }));
        }
      },

      reportDamage: async (productId, quantity, notes) => {
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
        }));

        if (get().useSupabase) {
          await db.updateInventoryBatch(productId as string, {
            available: batch.available - quantity,
            damaged: batch.damaged + quantity,
          });

          const txId = generateId();
          await db.createInventoryTransaction({
            id: txId,
            product_id: productId as string,
            bottle_number: null,
            type: 'damage',
            quantity,
            customer_name: null,
            price: null,
            notes: notes || null,
          });

          set((state) => ({
            transactions: [
              ...state.transactions,
              {
                id: txId,
                productId: productId as ProductType,
                type: 'damage',
                quantity,
                notes,
                createdAt: new Date().toISOString(),
              },
            ],
          }));
        } else {
          set((state) => ({
            transactions: [
              ...state.transactions,
              {
                id: generateId(),
                productId: productId as ProductType,
                type: 'damage',
                quantity,
                notes,
                createdAt: new Date().toISOString(),
              },
            ],
          }));
        }
      },

      giftFromBatch: async (productId, quantity, recipientName, notes) => {
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
        }));

        if (get().useSupabase) {
          await db.updateInventoryBatch(productId as string, {
            available: batch.available - quantity,
            gifted: batch.gifted + quantity,
          });

          const txId = generateId();
          await db.createInventoryTransaction({
            id: txId,
            product_id: productId as string,
            bottle_number: null,
            type: 'gift',
            quantity,
            customer_name: recipientName,
            price: null,
            notes: notes || null,
          });

          set((state) => ({
            transactions: [
              ...state.transactions,
              {
                id: txId,
                productId: productId as ProductType,
                type: 'gift',
                quantity,
                customerName: recipientName,
                notes,
                createdAt: new Date().toISOString(),
              },
            ],
          }));
        } else {
          set((state) => ({
            transactions: [
              ...state.transactions,
              {
                id: generateId(),
                productId: productId as ProductType,
                type: 'gift',
                quantity,
                customerName: recipientName,
                notes,
                createdAt: new Date().toISOString(),
              },
            ],
          }));
        }
      },

      // ═══════════════════════════════════════════════════════════════════
      // Custom Product Actions
      // ═══════════════════════════════════════════════════════════════════

      addProduct: async (product) => {
        const id = `custom-${generateId()}`;
        const newProduct: CustomProduct = { ...product, id };

        // 로컬 상태 업데이트
        set((state) => ({
          customProducts: [...state.customProducts, newProduct],
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

        // Supabase에 저장
        if (get().useSupabase) {
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
            available: product.totalQuantity,
            reserved: 0,
            sold: 0,
            gifted: 0,
            damaged: 0,
          });
        }
      },

      removeProduct: async (productId) => {
        set((state) => ({
          customProducts: state.customProducts.filter((p) => p.id !== productId),
          inventoryBatches: state.inventoryBatches.filter((b) => b.productId !== productId),
        }));

        if (get().useSupabase) {
          await db.deleteCustomProduct(productId);
          await db.deleteInventoryBatch(productId);
        }
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
}));
