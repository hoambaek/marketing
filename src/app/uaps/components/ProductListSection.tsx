'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Anchor, Plus, Loader2, Wine, Pencil, Trash2 } from 'lucide-react';
import {
  AgingProduct,
  PRODUCT_STATUS_LABELS,
  WINE_TYPE_LABELS,
  CATEGORY_SUBTYPES,
  deriveProductStatus,
} from '@/lib/types/uaps';
import { SectionWrapper } from './DashboardParts';

// UAPS 숙성 제품 리스트 섹션 (샴페인·전 카테고리 공유).
// filterSlot에 카테고리 필터(홈 전용)를 주입할 수 있고, 없으면 카드만 렌더한다.
// accent/accentRgb로 테마색 주입(기본 cyan → 샴페인 동일).
export function ProductListSection({
  products,
  filterCategory,
  isLoading,
  selectedProductId,
  onSelect,
  onEdit,
  onDelete,
  onAdd,
  accent = '#22d3ee',
  accentRgb = '34, 211, 238',
  filterSlot,
}: {
  products: AgingProduct[];
  filterCategory: string;
  isLoading: boolean;
  selectedProductId: string | null;
  onSelect: (id: string) => void;
  onEdit: (product: AgingProduct) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  accent?: string;
  accentRgb?: string;
  filterSlot?: React.ReactNode;
}) {
  const filtered = products.filter((p) => (p.productCategory ?? 'champagne') === filterCategory);

  return (
    <SectionWrapper
      title="숙성 제품 리스트"
      icon={Anchor}
      iconColor={accent}
      delay={0.15}
      action={
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/80 hover:text-white font-medium rounded-xl px-4 py-2 text-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          추가
        </button>
      }
    >
      {filterSlot}

      {isLoading && products.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-white/30">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          로딩 중...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Wine className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">
            이 카테고리에 등록된 제품이 없습니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((product, idx) => {
            const displayStatus = deriveProductStatus(product);
            return (
            <motion.div
              key={product.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="relative group"
            >
              <div
                onClick={() => onSelect(product.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') onSelect(product.id); }}
                className={`w-full text-left border rounded-xl p-4 transition-all cursor-pointer ${
                  selectedProductId === product.id
                    ? ''
                    : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
                }`}
                style={selectedProductId === product.id ? {
                  borderColor: `rgba(${accentRgb}, 0.5)`,
                  backgroundColor: `rgba(${accentRgb}, 0.06)`,
                  boxShadow: `0 0 20px rgba(${accentRgb}, 0.08)`,
                } : undefined}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-white font-medium text-sm truncate pr-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/[0.08] text-[10px] text-white/50 font-mono mr-1.5">{idx + 1}</span>
                    {product.productName}
                  </h4>
                  <span
                    className={`text-[10px] font-medium whitespace-nowrap px-2 py-0.5 rounded-full ${
                      displayStatus === 'immersed'
                        ? ''
                        : displayStatus === 'harvested'
                          ? 'bg-amber-500/15 text-amber-400'
                          : displayStatus === 'test'
                            ? 'bg-violet-500/15 text-violet-400'
                            : 'bg-white/[0.06] text-white/50'
                    }`}
                    style={displayStatus === 'immersed' ? {
                      backgroundColor: `rgba(${accentRgb}, 0.15)`,
                      color: accent,
                    } : undefined}
                  >
                    {PRODUCT_STATUS_LABELS[displayStatus]}
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-white/40">
                      {product.wineType
                        ? WINE_TYPE_LABELS[product.wineType]
                        : CATEGORY_SUBTYPES[product.productCategory]?.find(
                            (s) => s.value === String((product.reductionChecks as Record<string, unknown> | null)?._subtype ?? '')
                          )?.label ?? product.productCategory}
                      {product.vintage ? ` · ${product.vintage}` : ''}
                    </p>
                    <p className="text-xs text-white/30">
                      {product.agingDepth}m
                      {product.plannedDurationMonths ? ` · ${product.plannedDurationMonths}개월` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onEdit(product)}
                      className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors"
                      aria-label="수정"
                      title="수정"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`"${product.productName}" 제품을 삭제하시겠습니까?`)) {
                          onDelete(product.id);
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
                      aria-label="삭제"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
            );
          })}
        </div>
      )}
    </SectionWrapper>
  );
}
