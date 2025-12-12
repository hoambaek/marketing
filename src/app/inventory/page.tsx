'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useInventoryStore } from '@/lib/store/inventory-store';
import { toast } from '@/lib/store/toast-store';
import {
  PRODUCTS,
  Product,
  ProductType,
  InventoryStatus,
  INVENTORY_STATUS_LABELS,
  INVENTORY_STATUS_COLORS,
  NumberedBottle,
} from '@/lib/types';
import {
  Wine,
  Package,
  ShoppingCart,
  BookmarkCheck,
  Gift,
  AlertTriangle,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Clock,
  Hash,
  Plus,
  RefreshCw,
  Filter,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// 애니메이션 변형
// ═══════════════════════════════════════════════════════════════════════════

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// 상품별 색상 테마
// ═══════════════════════════════════════════════════════════════════════════

const PRODUCT_COLORS: Record<string, { bg: string; text: string; accent: string; glow: string }> = {
  first_edition: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    accent: 'from-amber-500 to-amber-400',
    glow: 'rgba(245, 158, 11, 0.15)',
  },
  en_lieu_sur_brut: {
    bg: 'bg-[#b7916e]/10',
    text: 'text-[#d4c4a8]',
    accent: 'from-[#b7916e] to-[#d4c4a8]',
    glow: 'rgba(183, 145, 110, 0.15)',
  },
  en_lieu_sur_magnum: {
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    accent: 'from-violet-500 to-violet-400',
    glow: 'rgba(139, 92, 246, 0.15)',
  },
  element_de_surprise: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    accent: 'from-emerald-500 to-emerald-400',
    glow: 'rgba(16, 185, 129, 0.15)',
  },
  atomes_crochus: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    accent: 'from-rose-500 to-rose-400',
    glow: 'rgba(244, 63, 94, 0.15)',
  },
  // Default colors for custom products
  default: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    accent: 'from-cyan-500 to-cyan-400',
    glow: 'rgba(6, 182, 212, 0.15)',
  },
};

// Get product colors with fallback
const getProductColors = (productId: string) => {
  return PRODUCT_COLORS[productId] || PRODUCT_COLORS.default;
};

// ═══════════════════════════════════════════════════════════════════════════
// 개별 병 상태 변경 모달
// ═══════════════════════════════════════════════════════════════════════════

function BottleStatusModal({
  isOpen,
  onClose,
  bottleNumber,
  currentStatus,
  currentBottle,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  bottleNumber: number;
  currentStatus: InventoryStatus;
  currentBottle?: NumberedBottle | null;
  onSave: (status: InventoryStatus, details?: { reservedFor?: string; soldTo?: string; giftedTo?: string; price?: number; notes?: string }) => void;
}) {
  const [status, setStatus] = useState<InventoryStatus>(currentStatus);
  const [customerName, setCustomerName] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setStatus(currentStatus);
    // Populate with existing data
    if (currentBottle) {
      const existingName = currentBottle.reservedFor || currentBottle.soldTo || currentBottle.giftedTo || '';
      setCustomerName(existingName);
      setPrice(currentBottle.price ? String(currentBottle.price) : '');
      setNotes(currentBottle.notes || '');
    } else {
      setCustomerName('');
      setPrice('');
      setNotes('');
    }
  }, [currentStatus, currentBottle, isOpen]);

  const handleSave = () => {
    onSave(status, {
      reservedFor: status === 'reserved' ? customerName : undefined,
      soldTo: status === 'sold' ? customerName : undefined,
      giftedTo: status === 'gifted' ? customerName : undefined,
      price: price ? parseInt(price) : undefined,
      notes: notes || undefined,
    });
    toast.success('병 상태가 변경되었습니다');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="bottle-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />
      <motion.div
        key="bottle-modal-content"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-md"
      >
        <div className="relative rounded-2xl overflow-hidden max-h-[85vh] flex flex-col">
          <div className="absolute inset-0 bg-[#0d1525]" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />
          <div className="absolute inset-0 border border-white/[0.1] rounded-2xl" />

          <div className="relative flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-5 py-3 sm:px-6 sm:py-4 bg-amber-500/10 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#0a0f1a]/50 flex items-center justify-center text-amber-400 font-bold text-sm sm:text-base">
                    #{bottleNumber}
                  </div>
                  <div>
                    <h3 className="font-medium text-amber-400 text-sm sm:text-base">First Edition #{bottleNumber}</h3>
                    <p className="text-[10px] sm:text-xs text-white/30">상태 변경</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.06] text-white/40">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto">
              {/* Status Select */}
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">상태</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['available', 'reserved', 'sold', 'gifted', 'damaged'] as InventoryStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                        status === s
                          ? INVENTORY_STATUS_COLORS[s]
                          : 'bg-white/[0.04] border-white/[0.1] text-white/40 hover:bg-white/[0.08]'
                      }`}
                    >
                      {INVENTORY_STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Name */}
              {(status === 'reserved' || status === 'sold' || status === 'gifted') && (
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
                    {status === 'reserved' ? '예약자' : status === 'gifted' ? '수령인' : '구매자'}
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="이름 입력"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-[#b7916e]/50"
                  />
                </div>
              )}

              {/* Price */}
              {status === 'sold' && (
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">판매가 (원)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="금액 입력"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-[#b7916e]/50"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">메모</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="메모 입력 (선택)"
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-[#b7916e]/50 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2 shrink-0">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/60 hover:bg-white/[0.08] text-sm sm:text-base"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl bg-[#b7916e]/20 border border-[#b7916e]/30 text-[#d4c4a8] hover:bg-[#b7916e]/30 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Check className="w-4 h-4" />
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 숫자 포맷팅 헬퍼
// ═══════════════════════════════════════════════════════════════════════════

const formatNumberWithCommas = (value: string): string => {
  const numbers = value.replace(/[^\d]/g, '');
  if (!numbers) return '';
  return Number(numbers).toLocaleString('ko-KR');
};

const parseNumberFromCommas = (value: string): number => {
  const numbers = value.replace(/[^\d]/g, '');
  return parseInt(numbers) || 0;
};

// ═══════════════════════════════════════════════════════════════════════════
// 일반 재고 조정 모달
// ═══════════════════════════════════════════════════════════════════════════

function BatchAdjustModal({
  isOpen,
  onClose,
  product,
  onAction,
}: {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onAction: (action: 'sell' | 'reserve' | 'gift' | 'damage' | 'confirm' | 'cancel', quantity: number, details?: { customerName?: string; price?: number; notes?: string }) => void;
}) {
  const [action, setAction] = useState<'sell' | 'reserve' | 'gift' | 'damage' | 'confirm' | 'cancel'>('sell');
  const [quantity, setQuantity] = useState('1');
  const [customerName, setCustomerName] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setAction('sell');
    setQuantity('1');
    setCustomerName('');
    setPrice('');
    setNotes('');
  }, [product, isOpen]);

  const handleQuantityChange = (value: string) => {
    setQuantity(formatNumberWithCommas(value));
  };

  const handlePriceChange = (value: string) => {
    setPrice(formatNumberWithCommas(value));
  };

  const handleSubmit = () => {
    const qty = parseNumberFromCommas(quantity) || 1;
    onAction(action, qty, {
      customerName: customerName || undefined,
      price: price ? parseNumberFromCommas(price) : undefined,
      notes: notes || undefined,
    });
    const actionLabels: Record<string, string> = {
      sell: '판매 처리되었습니다',
      reserve: '예약 처리되었습니다',
      gift: '증정 처리되었습니다',
      damage: '파손 처리되었습니다',
      confirm: '예약이 확정되었습니다',
      cancel: '예약이 취소되었습니다',
    };
    toast.success(actionLabels[action] || '처리되었습니다');
    onClose();
  };

  if (!isOpen || !product) return null;

  const colors = PRODUCT_COLORS[product.id];

  return (
    <AnimatePresence>
      <motion.div
        key="batch-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />
      <motion.div
        key="batch-modal-content"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-md"
      >
        <div className="relative rounded-2xl overflow-hidden max-h-[85vh] flex flex-col">
          <div className="absolute inset-0 bg-[#0d1525]" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />
          <div className="absolute inset-0 border border-white/[0.1] rounded-2xl" />

          <div className="relative flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className={`px-5 py-3 sm:px-6 sm:py-4 ${colors.bg} border-b border-white/[0.06] shrink-0`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`p-2 sm:p-2.5 rounded-xl bg-[#0a0f1a]/50 ${colors.text}`}>
                    <Wine className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h3 className={`font-medium ${colors.text} text-sm sm:text-base`}>{product.name}</h3>
                    <p className="text-[10px] sm:text-xs text-white/30">재고 조정</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.06] text-white/40">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto">
              {/* Action Select */}
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">작업</label>
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  {[
                    { value: 'sell', label: '판매', icon: ShoppingCart },
                    { value: 'reserve', label: '예약', icon: BookmarkCheck },
                    { value: 'gift', label: '증정', icon: Gift },
                    { value: 'damage', label: '손상처리', icon: AlertTriangle },
                    { value: 'confirm', label: '예약확정', icon: Check },
                    { value: 'cancel', label: '예약취소', icon: X },
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setAction(item.value as typeof action)}
                      className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border flex items-center gap-1.5 sm:gap-2 ${
                        action === item.value
                          ? 'bg-[#b7916e]/20 border-[#b7916e]/30 text-[#d4c4a8]'
                          : 'bg-white/[0.04] border-white/[0.1] text-white/40 hover:bg-white/[0.08]'
                      }`}
                    >
                      <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">수량</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  placeholder="1"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/90 focus:outline-none focus:border-[#b7916e]/50"
                />
              </div>

              {/* Customer Name */}
              {(action === 'sell' || action === 'reserve' || action === 'gift' || action === 'confirm') && (
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
                    {action === 'reserve' ? '예약자' : action === 'gift' ? '수령인' : '고객명'}
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="이름 입력"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-[#b7916e]/50"
                  />
                </div>
              )}

              {/* Price */}
              {(action === 'sell' || action === 'confirm') && (
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">판매가 (원)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={price}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    placeholder="금액 입력"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-[#b7916e]/50"
                  />
                </div>
              )}

              {/* Notes */}
              {action === 'damage' && (
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">손상 사유</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="손상 사유 입력"
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-[#b7916e]/50 resize-none"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2 shrink-0">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/60 hover:bg-white/[0.08] text-sm sm:text-base"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl bg-[#b7916e]/20 border border-[#b7916e]/30 text-[#d4c4a8] hover:bg-[#b7916e]/30 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Check className="w-4 h-4" />
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 상품 추가 모달
// ═══════════════════════════════════════════════════════════════════════════

function AddProductModal({
  isOpen,
  onClose,
  year,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  onAdd: (product: { name: string; nameKo: string; year: number; size: string; totalQuantity: number; description?: string }) => void;
}) {
  const [name, setName] = useState('');
  const [nameKo, setNameKo] = useState('');
  const [size, setSize] = useState('750ml');
  const [quantity, setQuantity] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setNameKo('');
      setSize('750ml');
      setQuantity('');
      setDescription('');
    }
  }, [isOpen]);

  const handleQuantityChange = (value: string) => {
    setQuantity(formatNumberWithCommas(value));
  };

  const handleSubmit = () => {
    if (!name || !nameKo || !quantity) return;

    onAdd({
      name,
      nameKo,
      year,
      size,
      totalQuantity: parseNumberFromCommas(quantity),
      description: description || undefined,
    });
    toast.success('상품이 추가되었습니다');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="add-product-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />
      <motion.div
        key="add-product-modal-content"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-md"
      >
        <div className="relative rounded-2xl overflow-hidden max-h-[85vh] flex flex-col">
          <div className="absolute inset-0 bg-[#0d1525]" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />
          <div className="absolute inset-0 border border-white/[0.1] rounded-2xl" />

          <div className="relative flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-5 py-3 sm:px-6 sm:py-4 bg-[#b7916e]/10 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-[#0a0f1a]/50 text-[#d4c4a8]">
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#d4c4a8] text-sm sm:text-base">{year} 상품 추가</h3>
                    <p className="text-[10px] sm:text-xs text-white/30">새로운 상품을 등록합니다</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.06] text-white/40">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto">
              {/* Product Name */}
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">상품명 (영문)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="En Lieu Sur Brut"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-[#b7916e]/50"
                />
              </div>

              {/* Product Name Korean */}
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">상품명 (한글)</label>
                <input
                  type="text"
                  value={nameKo}
                  onChange={(e) => setNameKo(e.target.value)}
                  placeholder="앙 리유 쉬르 브뤼"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-[#b7916e]/50"
                />
              </div>

              {/* Size & Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">용량</label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/90 focus:outline-none focus:border-[#b7916e]/50"
                  >
                    <option value="375ml">375ml</option>
                    <option value="750ml">750ml</option>
                    <option value="1500ml">1500ml (Magnum)</option>
                    <option value="3000ml">3000ml (Jeroboam)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">수량</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    placeholder="100"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-[#b7916e]/50"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">설명 (선택)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="상품 설명을 입력하세요"
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-[#b7916e]/50 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2 shrink-0">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/60 hover:bg-white/[0.08] text-sm sm:text-base"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!name || !nameKo || !quantity}
                  className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl bg-[#b7916e]/20 border border-[#b7916e]/30 text-[#d4c4a8] hover:bg-[#b7916e]/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4" />
                  추가
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 상품 카드 컴포넌트
// ═══════════════════════════════════════════════════════════════════════════

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    nameKo: string;
    year: number;
    size: string;
    totalQuantity: number;
    isNumbered?: boolean;
    isCustom?: boolean;
  };
  onManage: () => void;
  mounted: boolean;
}

function ProductCard({ product, onManage, mounted }: ProductCardProps) {
  const { getProductSummary } = useInventoryStore();
  const summary = mounted ? getProductSummary(product.id) : { available: 0, reserved: 0, sold: 0, gifted: 0, damaged: 0, soldPercent: 0 };
  const colors = getProductColors(product.id);

  return (
    <div className="group relative rounded-2xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
      <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle at 50% 100%, ${colors.glow}, transparent 70%)` }}
      />

      {/* Header - Fixed height for consistency */}
      <div className={`relative px-5 py-4 h-[88px] ${colors.bg} border-b border-white/[0.04]`}>
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`p-2.5 rounded-xl bg-[#0a0f1a]/50 ${colors.text} shrink-0`}>
              <Wine className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className={`font-medium ${colors.text} truncate`}>{product.name}</p>
              <p className="text-xs text-white/30 truncate">{product.nameKo}</p>
            </div>
          </div>
          <div className="text-right shrink-0 ml-3">
            <p className="text-xs text-white/30 whitespace-nowrap">총 수량</p>
            <p className="text-lg text-white/70">{product.totalQuantity}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="relative p-4 sm:p-5">
        {/* Stats Grid - 2x2 on mobile, 4 cols on desktop */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-3 mb-3 sm:mb-4">
          <div className="text-center p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/[0.02]">
            <p className="text-[10px] sm:text-xs text-white/30 mb-0.5 sm:mb-1">판매가능</p>
            <p className="text-base sm:text-xl text-emerald-400 font-medium">{summary.available}</p>
          </div>
          <div className="text-center p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/[0.02]">
            <p className="text-[10px] sm:text-xs text-white/30 mb-0.5 sm:mb-1">예약</p>
            <p className="text-base sm:text-xl text-amber-400 font-medium">{summary.reserved}</p>
          </div>
          <div className="text-center p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/[0.02]">
            <p className="text-[10px] sm:text-xs text-white/30 mb-0.5 sm:mb-1">판매</p>
            <p className="text-base sm:text-xl text-blue-400 font-medium">{summary.sold}</p>
          </div>
          <div className="text-center p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/[0.02]">
            <p className="text-[10px] sm:text-xs text-white/30 mb-0.5 sm:mb-1">증정</p>
            <p className="text-base sm:text-xl text-pink-400 font-medium">{summary.gifted}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-white/40">판매율</span>
            <span className={summary.soldPercent >= 50 ? 'text-emerald-400' : 'text-white/50'}>
              {summary.soldPercent}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${summary.soldPercent}%` }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              className={`h-full rounded-full bg-gradient-to-r ${colors.accent}`}
            />
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2 py-1 rounded-lg bg-white/[0.04] text-[10px] text-white/40">
            {product.size}
          </span>
          <span className="px-2 py-1 rounded-lg bg-white/[0.04] text-[10px] text-white/40">
            {product.year}
          </span>
          {product.isNumbered && (
            <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-[10px] text-amber-400">
              넘버링
            </span>
          )}
          {product.isCustom && (
            <span className="px-2 py-1 rounded-lg bg-cyan-500/20 text-[10px] text-cyan-400">
              커스텀
            </span>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={onManage}
          className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/60 hover:bg-white/[0.08] hover:text-white/80 transition-all flex items-center justify-center gap-2"
        >
          <Package className="w-4 h-4" />
          재고 관리
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// First Edition 넘버링 그리드
// ═══════════════════════════════════════════════════════════════════════════

function FirstEditionGrid({
  isExpanded,
  onToggle,
}: {
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { numberedBottles, updateBottleStatus, getProductSummary } = useInventoryStore();
  const [selectedBottle, setSelectedBottle] = useState<NumberedBottle | null>(null);
  const summary = getProductSummary('first_edition');

  const handleBottleClick = (bottleNumber: number) => {
    const bottle = numberedBottles.find((b) => b.bottleNumber === bottleNumber);
    if (bottle) {
      setSelectedBottle(bottle);
    }
  };

  const handleSaveStatus = (status: InventoryStatus, details?: { reservedFor?: string; soldTo?: string; price?: number; notes?: string }) => {
    if (!selectedBottle) return;
    updateBottleStatus(selectedBottle.id, status, details);
    setSelectedBottle(null);
  };

  const getStatusColor = (status: InventoryStatus) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30';
      case 'reserved':
        return 'bg-amber-500/20 border-amber-500/30 text-amber-400 hover:bg-amber-500/30';
      case 'sold':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
      case 'gifted':
        return 'bg-purple-500/20 border-purple-500/30 text-purple-400';
      case 'damaged':
        return 'bg-red-500/20 border-red-500/30 text-red-400';
      default:
        return 'bg-white/[0.04] border-white/[0.1] text-white/40';
    }
  };

  return (
    <div className="relative">
      <div className="p-4">
        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10">
            <span className="text-xs text-white/40">판매가능</span>
            <span className="text-sm text-emerald-400 font-medium">{summary.available}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10">
            <span className="text-xs text-white/40">예약</span>
            <span className="text-sm text-amber-400 font-medium">{summary.reserved}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10">
            <span className="text-xs text-white/40">판매</span>
            <span className="text-sm text-blue-400 font-medium">{summary.sold}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10">
            <span className="text-xs text-white/40">증정</span>
            <span className="text-sm text-purple-400 font-medium">{summary.gifted}</span>
          </div>
        </div>

        {/* Legend - Compact */}
        <div className="flex flex-wrap gap-2 mb-3">
          {(['available', 'reserved', 'sold', 'gifted', 'damaged'] as InventoryStatus[]).map((status) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded ${INVENTORY_STATUS_COLORS[status].split(' ')[0]}`} />
              <span className="text-[10px] text-white/35">{INVENTORY_STATUS_LABELS[status]}</span>
            </div>
          ))}
        </div>

        {/* Bottle Grid - Compact */}
        <div className="grid grid-cols-10 gap-1.5">
          {numberedBottles.map((bottle) => (
            <button
              key={bottle.id}
              onClick={() => handleBottleClick(bottle.bottleNumber)}
              className={`aspect-square rounded-lg border text-xs font-medium transition-all ${getStatusColor(bottle.status)} ${
                bottle.status !== 'sold' && bottle.status !== 'gifted' && bottle.status !== 'damaged'
                  ? 'cursor-pointer'
                  : 'cursor-default'
              }`}
              title={`#${bottle.bottleNumber} - ${INVENTORY_STATUS_LABELS[bottle.status]}${bottle.soldTo ? ` (${bottle.soldTo})` : ''}`}
            >
              {bottle.bottleNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {selectedBottle && (
        <BottleStatusModal
          isOpen={!!selectedBottle}
          onClose={() => setSelectedBottle(null)}
          bottleNumber={selectedBottle.bottleNumber}
          currentStatus={selectedBottle.status}
          currentBottle={selectedBottle}
          onSave={handleSaveStatus}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 메인 페이지
// ═══════════════════════════════════════════════════════════════════════════

export default function InventoryPage() {
  const { initializeInventory, refreshFromSupabase, getTotalInventoryValue, getRecentTransactions, getFilteredTransactions, isLoading, sellFromBatch, reserveFromBatch, confirmReservation, cancelReservation, reportDamage, giftFromBatch, addProduct, getAllProducts } = useInventoryStore();
  const [isFirstEditionExpanded, setIsFirstEditionExpanded] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [mounted, setMounted] = useState(false);
  const [addProductYear, setAddProductYear] = useState<number | null>(null);

  // Year section expanded state - all collapsed by default
  const [expandedYears, setExpandedYears] = useState<number[]>([]);

  // Transaction filter state
  const [txFilterYear, setTxFilterYear] = useState<number | undefined>(undefined);
  const [txFilterMonth, setTxFilterMonth] = useState<number | undefined>(undefined);

  // Toggle year section expansion
  const toggleYearExpanded = (year: number) => {
    setExpandedYears(prev =>
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    );
  };

  useEffect(() => {
    setMounted(true);
    initializeInventory();
  }, [initializeInventory]);

  // Refresh from Supabase on focus (when returning to the tab)
  useEffect(() => {
    const handleFocus = () => {
      refreshFromSupabase();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshFromSupabase]);

  const totalValue = mounted ? getTotalInventoryValue() : { totalBottles: 0, available: 0, reserved: 0, sold: 0 };

  // Use filtered transactions if filter is set, otherwise show recent
  const recentTransactions = mounted
    ? (txFilterYear || txFilterMonth)
      ? getFilteredTransactions(txFilterYear, txFilterMonth, 20)
      : getRecentTransactions(10)
    : [];

  // Get all products and group by year
  const allProducts = mounted ? getAllProducts() : [];
  const productsByYear = allProducts.reduce((acc, product) => {
    if (!product.isNumbered) {
      const year = product.year;
      if (!acc[year]) acc[year] = [];
      acc[year].push(product);
    }
    return acc;
  }, {} as Record<number, typeof allProducts>);

  // Get available years (2026 and above for batch products)
  const availableYears = Object.keys(productsByYear)
    .map(Number)
    .filter(y => y >= 2026)
    .sort((a, b) => a - b);

  // Add default years if they don't have products yet
  const displayYears = [...new Set([...availableYears, 2026, 2027, 2028])].sort((a, b) => a - b);

  const handleBatchAction = (
    action: 'sell' | 'reserve' | 'gift' | 'damage' | 'confirm' | 'cancel',
    quantity: number,
    details?: { customerName?: string; price?: number; notes?: string }
  ) => {
    if (!selectedProduct) return;

    switch (action) {
      case 'sell':
        sellFromBatch(selectedProduct.id, quantity, details?.customerName, details?.price);
        break;
      case 'reserve':
        reserveFromBatch(selectedProduct.id, quantity, details?.customerName || '');
        break;
      case 'gift':
        giftFromBatch(selectedProduct.id, quantity, details?.customerName || '', details?.notes);
        break;
      case 'damage':
        reportDamage(selectedProduct.id, quantity, details?.notes);
        break;
      case 'confirm':
        confirmReservation(selectedProduct.id, quantity, details?.customerName, details?.price);
        break;
      case 'cancel':
        cancelReservation(selectedProduct.id, quantity);
        break;
    }
  };

  const handleAddProduct = (product: { name: string; nameKo: string; year: number; size: string; totalQuantity: number; description?: string }) => {
    addProduct(product);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0d1525] to-[#0a0f1a]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(183, 145, 110, 0.12), transparent),
                              radial-gradient(ellipse 60% 40% at 20% 80%, rgba(139, 92, 246, 0.06), transparent),
                              radial-gradient(ellipse 50% 30% at 80% 50%, rgba(245, 158, 11, 0.08), transparent)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative pt-16 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative"
          >
            {/* Decorative Line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="absolute -left-4 sm:-left-6 top-1/2 w-12 sm:w-16 h-px bg-gradient-to-r from-[#b7916e] to-transparent origin-left"
            />

            <div className="pl-10 sm:pl-14 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-[#b7916e] text-xs sm:text-sm tracking-[0.3em] uppercase mb-3 sm:mb-4 font-light"
                >
                  Inventory Management
                </motion.p>

                <h1
                  className="text-4xl sm:text-5xl lg:text-6xl text-white/95 mb-4 sm:mb-6 leading-[1.1] tracking-tight"
                  style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                >
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="block"
                  >
                    Inventory
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="block text-transparent bg-clip-text bg-gradient-to-r from-[#b7916e] via-[#d4c4a8] to-[#b7916e]"
                  >
                    Management
                  </motion.span>
                </h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.8 }}
                  className="text-white/40 text-base sm:text-lg max-w-md font-light leading-relaxed"
                >
                  Muse de Marée 샴페인 재고 현황 및 관리
                </motion.p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Summary Cards Section */}
      <section className="px-4 sm:px-6 lg:px-8 mb-6 sm:mb-10">
        <div className="max-w-6xl mx-auto">
          {/* Summary Cards - Compact 2x2 on mobile */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-5"
          >
            {/* Total Bottles */}
            <motion.div variants={itemVariants} className="relative rounded-xl sm:rounded-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
              <div className="absolute inset-0 border border-white/[0.06] rounded-xl sm:rounded-2xl" />
              <div className="relative p-3 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                  <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-[#b7916e]/20 border border-[#b7916e]/20">
                    <Wine className="w-3.5 sm:w-5 h-3.5 sm:h-5 text-[#d4c4a8]" />
                  </div>
                  <p className="text-[10px] sm:text-sm text-white/40">총 재고</p>
                </div>
                <p
                  className="text-2xl sm:text-4xl text-white/90"
                  style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                >
                  {totalValue.totalBottles}
                  <span className="text-xs sm:text-lg text-white/30"> 병</span>
                </p>
              </div>
            </motion.div>

            {/* Available */}
            <motion.div variants={itemVariants} className="relative rounded-xl sm:rounded-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
              <div className="absolute inset-0 border border-white/[0.06] rounded-xl sm:rounded-2xl" />
              <div className="relative p-3 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                  <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-emerald-500/20 border border-emerald-500/20">
                    <Package className="w-3.5 sm:w-5 h-3.5 sm:h-5 text-emerald-400" />
                  </div>
                  <p className="text-[10px] sm:text-sm text-white/40">판매 가능</p>
                </div>
                <p
                  className="text-2xl sm:text-4xl text-emerald-400"
                  style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                >
                  {totalValue.available}
                  <span className="text-xs sm:text-lg text-emerald-400/50"> 병</span>
                </p>
              </div>
            </motion.div>

            {/* Reserved */}
            <motion.div variants={itemVariants} className="relative rounded-xl sm:rounded-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
              <div className="absolute inset-0 border border-white/[0.06] rounded-xl sm:rounded-2xl" />
              <div className="relative p-3 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                  <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-amber-500/20 border border-amber-500/20">
                    <BookmarkCheck className="w-3.5 sm:w-5 h-3.5 sm:h-5 text-amber-400" />
                  </div>
                  <p className="text-[10px] sm:text-sm text-white/40">예약됨</p>
                </div>
                <p
                  className="text-2xl sm:text-4xl text-amber-400"
                  style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                >
                  {totalValue.reserved}
                  <span className="text-xs sm:text-lg text-amber-400/50"> 병</span>
                </p>
              </div>
            </motion.div>

            {/* Sold */}
            <motion.div variants={itemVariants} className="relative rounded-xl sm:rounded-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
              <div className="absolute inset-0 border border-white/[0.06] rounded-xl sm:rounded-2xl" />
              <div className="relative p-3 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                  <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-blue-500/20 border border-blue-500/20">
                    <TrendingUp className="w-3.5 sm:w-5 h-3.5 sm:h-5 text-blue-400" />
                  </div>
                  <p className="text-[10px] sm:text-sm text-white/40">판매 완료</p>
                </div>
                <p
                  className="text-2xl sm:text-4xl text-blue-400"
                  style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                >
                  {totalValue.sold}
                  <span className="text-xs sm:text-lg text-blue-400/50"> 병</span>
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 2025 First Edition Section */}
      <section className="px-4 sm:px-6 lg:px-8 mb-6">
        <div className="mx-auto max-w-6xl">
          {/* Unified background wrapper - same style as 2026+ sections */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-2xl overflow-hidden"
          >
            {/* Background that spans entire section */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-sm" />
            <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />

            <div className="relative">
              {/* Section Header - Clickable to expand/collapse */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-all"
                onClick={() => setIsFirstEditionExpanded(!isFirstEditionExpanded)}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: isFirstEditionExpanded ? 0 : -90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-white/40" />
                  </motion.div>
                  <div>
                    <h2
                      className="text-xl sm:text-2xl text-white/80"
                      style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                    >
                      2025 Collection
                    </h2>
                    <p className="text-white/40 text-xs sm:text-sm">한정 넘버링 에디션 (1-50)</p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-white/30">총</span>
                    <span className="text-sm text-amber-400 font-medium">50</span>
                  </div>
                  <div className="px-2 py-1 rounded-lg bg-amber-500/20 text-[10px] text-amber-400">
                    넘버링
                  </div>
                </div>
              </div>

              {/* Collapsible Content */}
              <AnimatePresence initial={false}>
                {isFirstEditionExpanded && mounted && (
                  <motion.div
                    key="2025-content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-white/[0.04]" />
                    <FirstEditionGrid
                      isExpanded={true}
                      onToggle={() => {}}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Year-based Sections (2026+) */}
      {displayYears.map((year) => {
        const yearProducts = productsByYear[year] || [];
        const isExpanded = expandedYears.includes(year);

        return (
          <section key={year} className="px-4 sm:px-6 lg:px-8 mb-6">
            <div className="mx-auto max-w-6xl">
              {/* Unified background wrapper */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative rounded-2xl overflow-hidden"
              >
                {/* Background that spans entire section */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-sm" />
                <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />

                <div className="relative">
                  {/* Section Header - Clickable to expand/collapse */}
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-all"
                    onClick={() => toggleYearExpanded(year)}
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: isExpanded ? 0 : -90 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-5 h-5 text-white/40" />
                      </motion.div>
                      <div>
                        <h2
                          className="text-xl sm:text-2xl text-white/80"
                          style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                        >
                          {year} Collection
                        </h2>
                        <p className="text-white/40 text-xs sm:text-sm">
                          {year === 2026 ? '정규 라인업' : yearProducts.length > 0 ? `${yearProducts.length}개 상품` : '등록된 상품 없음'}
                        </p>
                      </div>
                    </div>

                    {/* Add Product Button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setAddProductYear(year); }}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/50 hover:bg-[#b7916e]/10 hover:border-[#b7916e]/30 hover:text-[#d4c4a8] transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-xs sm:text-sm hidden sm:inline">상품 추가</span>
                    </button>
                  </div>

                  {/* Collapsible Content */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        key={`${year}-content`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-white/[0.04]" />
                        {/* Product Cards Grid */}
                        {yearProducts.length > 0 ? (
                          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
                            {yearProducts.map((product) => (
                              <ProductCard
                                key={product.id}
                                product={product}
                                onManage={() => setSelectedProduct(product as unknown as Product)}
                                mounted={mounted}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 flex flex-col items-center justify-center text-center">
                            <div className="p-3 rounded-xl bg-white/[0.04] mb-3">
                              <Wine className="w-6 h-6 text-white/20" />
                            </div>
                            <p className="text-white/30 text-sm">아직 등록된 상품이 없습니다</p>
                            <p className="text-white/20 text-xs mt-1">상품 추가 버튼을 눌러 새 상품을 등록하세요</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </section>
        );
      })}

      {/* Recent Transactions Section */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">

          {/* Recent Transactions */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mt-10"
          >
            <motion.div variants={itemVariants} className="relative rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
              <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />

              <div className="relative">
                <div className="px-4 sm:px-6 py-4 border-b border-white/[0.04]">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-white/40" />
                      <h3 className="text-white/60 font-medium">거래 내역</h3>
                      {isLoading && (
                        <RefreshCw className="w-4 h-4 text-white/30 animate-spin" />
                      )}
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Filter className="w-4 h-4 text-white/30 hidden sm:block" />

                      {/* Year Filter */}
                      <select
                        value={txFilterYear || ''}
                        onChange={(e) => setTxFilterYear(e.target.value ? Number(e.target.value) : undefined)}
                        className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white/60 focus:outline-none focus:border-white/20"
                      >
                        <option value="">전체 년도</option>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                      </select>

                      {/* Month Filter */}
                      <select
                        value={txFilterMonth || ''}
                        onChange={(e) => setTxFilterMonth(e.target.value ? Number(e.target.value) : undefined)}
                        className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white/60 focus:outline-none focus:border-white/20"
                      >
                        <option value="">전체 월</option>
                        {[...Array(12)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}월</option>
                        ))}
                      </select>

                      {/* Refresh Button */}
                      <button
                        onClick={() => refreshFromSupabase()}
                        disabled={isLoading}
                        className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white/60 hover:bg-white/[0.08] transition-all disabled:opacity-50"
                        title="새로고침"
                      >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {recentTransactions.length > 0 ? (
                  <div className="divide-y divide-white/[0.04]">
                    {recentTransactions.map((tx) => {
                      const product = PRODUCTS.find((p) => p.id === tx.productId);
                      const allProductsList = getAllProducts();
                      const customProduct = allProductsList.find((p) => p.id === tx.productId);
                      const productName = product?.name || customProduct?.name || tx.productId;

                      return (
                        <div key={tx.id} className="px-4 sm:px-6 py-4 flex items-center justify-between">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="text-xs text-white/30 w-16 sm:w-20 shrink-0">
                              {new Date(tx.createdAt).toLocaleDateString('ko-KR', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                            <div className="min-w-0">
                              <p className="text-white/70 text-sm truncate">
                                {productName}
                                {tx.bottleNumber && ` #${tx.bottleNumber}`}
                              </p>
                              <p className="text-xs text-white/30 truncate">
                                {tx.type === 'sale' && '판매'}
                                {tx.type === 'reservation' && '예약'}
                                {tx.type === 'gift' && '증정'}
                                {tx.type === 'damage' && '손상처리'}
                                {tx.type === 'return' && '반품'}
                                {tx.type === 'cancel_reservation' && '예약취소'}
                                {tx.customerName && ` - ${tx.customerName}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-white/60 text-sm">
                              {tx.quantity > 1 ? `${tx.quantity}병` : '1병'}
                            </p>
                            {tx.price && (
                              <p className="text-xs text-white/30">
                                {tx.price.toLocaleString()}원
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-6 py-8 text-center">
                    <p className="text-white/30 text-sm">
                      {(txFilterYear || txFilterMonth) ? '해당 기간의 거래 내역이 없습니다.' : '거래 내역이 없습니다.'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* Bottom Decoration */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-20 text-center"
          >
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/20">
              Muse de Marée · Inventory Management
            </p>
          </motion.div>
        </div>
      </section>

      {/* Batch Adjust Modal */}
      <BatchAdjustModal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        onAction={handleBatchAction}
      />

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={addProductYear !== null}
        onClose={() => setAddProductYear(null)}
        year={addProductYear || 2026}
        onAdd={handleAddProduct}
      />
    </div>
  );
}
