'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useInventoryStore } from '@/lib/store/inventory-store';
import {
  PRODUCTS,
  Product,
  ProductType,
  InventoryStatus,
  INVENTORY_STATUS_LABELS,
  INVENTORY_STATUS_COLORS,
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
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  bottleNumber: number;
  currentStatus: InventoryStatus;
  onSave: (status: InventoryStatus, details?: { reservedFor?: string; soldTo?: string; price?: number; notes?: string }) => void;
}) {
  const [status, setStatus] = useState<InventoryStatus>(currentStatus);
  const [customerName, setCustomerName] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setStatus(currentStatus);
    setCustomerName('');
    setPrice('');
    setNotes('');
  }, [currentStatus, isOpen]);

  const handleSave = () => {
    onSave(status, {
      reservedFor: status === 'reserved' ? customerName : undefined,
      soldTo: status === 'sold' ? customerName : undefined,
      price: price ? parseInt(price) : undefined,
      notes: notes || undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
      >
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-[#0d1525]" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />
          <div className="absolute inset-0 border border-white/[0.1] rounded-2xl" />

          <div className="relative">
            {/* Header */}
            <div className="px-6 py-4 bg-amber-500/10 border-b border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0a0f1a]/50 flex items-center justify-center text-amber-400 font-bold">
                    #{bottleNumber}
                  </div>
                  <div>
                    <h3 className="font-medium text-amber-400">First Edition #{bottleNumber}</h3>
                    <p className="text-xs text-white/30">상태 변경</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.06] text-white/40">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
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
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/60 hover:bg-white/[0.08]"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-3 rounded-xl bg-[#b7916e]/20 border border-[#b7916e]/30 text-[#d4c4a8] hover:bg-[#b7916e]/30 flex items-center justify-center gap-2"
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
    onClose();
  };

  if (!isOpen || !product) return null;

  const colors = PRODUCT_COLORS[product.id];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
      >
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-[#0d1525]" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />
          <div className="absolute inset-0 border border-white/[0.1] rounded-2xl" />

          <div className="relative">
            {/* Header */}
            <div className={`px-6 py-4 ${colors.bg} border-b border-white/[0.06]`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl bg-[#0a0f1a]/50 ${colors.text}`}>
                    <Wine className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`font-medium ${colors.text}`}>{product.name}</h3>
                    <p className="text-xs text-white/30">재고 조정</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.06] text-white/40">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Action Select */}
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">작업</label>
                <div className="grid grid-cols-2 gap-2">
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
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border flex items-center gap-2 ${
                        action === item.value
                          ? 'bg-[#b7916e]/20 border-[#b7916e]/30 text-[#d4c4a8]'
                          : 'bg-white/[0.04] border-white/[0.1] text-white/40 hover:bg-white/[0.08]'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
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
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/60 hover:bg-white/[0.08]"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-3 rounded-xl bg-[#b7916e]/20 border border-[#b7916e]/30 text-[#d4c4a8] hover:bg-[#b7916e]/30 flex items-center justify-center gap-2"
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
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
      >
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-[#0d1525]" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />
          <div className="absolute inset-0 border border-white/[0.1] rounded-2xl" />

          <div className="relative">
            {/* Header */}
            <div className="px-6 py-4 bg-[#b7916e]/10 border-b border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#0a0f1a]/50 text-[#d4c4a8]">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#d4c4a8]">{year} 상품 추가</h3>
                    <p className="text-xs text-white/30">새로운 상품을 등록합니다</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.06] text-white/40">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
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
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/60 hover:bg-white/[0.08]"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!name || !nameKo || !quantity}
                  className="flex-1 px-4 py-3 rounded-xl bg-[#b7916e]/20 border border-[#b7916e]/30 text-[#d4c4a8] hover:bg-[#b7916e]/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
    <motion.div variants={itemVariants} className="group relative rounded-2xl overflow-hidden">
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
      <div className="relative p-5">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 rounded-xl bg-white/[0.02]">
            <p className="text-xs text-white/30 mb-1">판매가능</p>
            <p className="text-xl text-emerald-400 font-medium">{summary.available}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-white/[0.02]">
            <p className="text-xs text-white/30 mb-1">예약</p>
            <p className="text-xl text-amber-400 font-medium">{summary.reserved}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-white/[0.02]">
            <p className="text-xs text-white/30 mb-1">판매완료</p>
            <p className="text-xl text-blue-400 font-medium">{summary.sold}</p>
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
    </motion.div>
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
  const [selectedBottle, setSelectedBottle] = useState<{ number: number; status: InventoryStatus } | null>(null);
  const summary = getProductSummary('first_edition');

  const handleBottleClick = (bottleNumber: number, status: InventoryStatus) => {
    setSelectedBottle({ number: bottleNumber, status });
  };

  const handleSaveStatus = (status: InventoryStatus, details?: { reservedFor?: string; soldTo?: string; price?: number; notes?: string }) => {
    if (!selectedBottle) return;
    const bottle = numberedBottles.find((b) => b.bottleNumber === selectedBottle.number);
    if (bottle) {
      updateBottleStatus(bottle.id, status, details);
    }
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
    <motion.div variants={itemVariants} className="relative rounded-xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-sm" />
      <div className="absolute inset-0 border border-white/[0.05] rounded-xl" />

      <div className="relative">
        {/* Compact Header */}
        <button
          onClick={onToggle}
          className="w-full px-4 py-2.5 flex items-center justify-between bg-amber-500/5 border-b border-white/[0.04]"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/15">
              <Hash className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span
              className="text-sm text-white/80"
              style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
            >
              2025 First Edition
            </span>
            <span className="text-[10px] text-white/30">1-50</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-white/30">가능</span>
              <span className="text-sm text-emerald-400 font-medium">{summary.available}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-white/30">판매</span>
              <span className="text-sm text-blue-400 font-medium">{summary.sold}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-white/30" />
            ) : (
              <ChevronRight className="w-4 h-4 text-white/30" />
            )}
          </div>
        </button>

        {/* Grid */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4">
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
                      onClick={() => handleBottleClick(bottle.bottleNumber, bottle.status)}
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Modal */}
      {selectedBottle && (
        <BottleStatusModal
          isOpen={!!selectedBottle}
          onClose={() => setSelectedBottle(null)}
          bottleNumber={selectedBottle.number}
          currentStatus={selectedBottle.status}
          onSave={handleSaveStatus}
        />
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 메인 페이지
// ═══════════════════════════════════════════════════════════════════════════

export default function InventoryPage() {
  const { initializeInventory, getTotalInventoryValue, getRecentTransactions, sellFromBatch, reserveFromBatch, confirmReservation, cancelReservation, reportDamage, giftFromBatch, addProduct, getAllProducts } = useInventoryStore();
  const [isFirstEditionExpanded, setIsFirstEditionExpanded] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [mounted, setMounted] = useState(false);
  const [addProductYear, setAddProductYear] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    initializeInventory();
  }, [initializeInventory]);

  const totalValue = mounted ? getTotalInventoryValue() : { totalBottles: 0, available: 0, reserved: 0, sold: 0 };
  const recentTransactions = mounted ? getRecentTransactions(5) : [];

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
      <section className="px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="mx-auto max-w-6xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center mb-12"
          >
            {/* Decorative Line */}
            <motion.div variants={itemVariants} className="flex justify-center mb-8">
              <div className="flex items-center gap-4">
                <motion.div
                  className="h-px w-16 bg-gradient-to-r from-transparent to-[#b7916e]/50"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
                <Wine className="w-5 h-5 text-[#b7916e]" />
                <motion.div
                  className="h-px w-16 bg-gradient-to-l from-transparent to-[#b7916e]/50"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-6xl text-white/90 mb-4 tracking-tight"
              style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
            >
              재고 관리
            </motion.h1>

            <motion.p variants={itemVariants} className="text-white/40 text-lg max-w-xl mx-auto">
              Muse de Marée 샴페인 재고 현황 및 관리
            </motion.p>
          </motion.div>

          {/* Summary Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-4 gap-5 mb-10"
          >
            {/* Total Bottles */}
            <motion.div variants={itemVariants} className="relative rounded-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
              <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />
              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-[#b7916e]/20 border border-[#b7916e]/20">
                    <Wine className="w-5 h-5 text-[#d4c4a8]" />
                  </div>
                  <p className="text-sm text-white/40">총 재고</p>
                </div>
                <p
                  className="text-4xl text-white/90"
                  style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                >
                  {totalValue.totalBottles}
                  <span className="text-lg text-white/30"> 병</span>
                </p>
              </div>
            </motion.div>

            {/* Available */}
            <motion.div variants={itemVariants} className="relative rounded-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
              <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />
              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/20">
                    <Package className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-sm text-white/40">판매 가능</p>
                </div>
                <p
                  className="text-4xl text-emerald-400"
                  style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                >
                  {totalValue.available}
                  <span className="text-lg text-emerald-400/50"> 병</span>
                </p>
              </div>
            </motion.div>

            {/* Reserved */}
            <motion.div variants={itemVariants} className="relative rounded-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
              <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />
              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/20">
                    <BookmarkCheck className="w-5 h-5 text-amber-400" />
                  </div>
                  <p className="text-sm text-white/40">예약됨</p>
                </div>
                <p
                  className="text-4xl text-amber-400"
                  style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                >
                  {totalValue.reserved}
                  <span className="text-lg text-amber-400/50"> 병</span>
                </p>
              </div>
            </motion.div>

            {/* Sold */}
            <motion.div variants={itemVariants} className="relative rounded-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
              <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />
              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/20">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-sm text-white/40">판매 완료</p>
                </div>
                <p
                  className="text-4xl text-blue-400"
                  style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                >
                  {totalValue.sold}
                  <span className="text-lg text-blue-400/50"> 병</span>
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 2025 First Edition Section */}
      <section className="px-4 sm:px-6 lg:px-8 mb-10">
        <div className="mx-auto max-w-6xl">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            {/* Section Title */}
            <motion.div variants={itemVariants} className="mb-4">
              <h2
                className="text-2xl text-white/80"
                style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
              >
                2025 Collection
              </h2>
              <p className="text-white/40 text-sm mt-1">한정 넘버링 에디션</p>
            </motion.div>

            {mounted && (
              <FirstEditionGrid
                isExpanded={isFirstEditionExpanded}
                onToggle={() => setIsFirstEditionExpanded(!isFirstEditionExpanded)}
              />
            )}
          </motion.div>
        </div>
      </section>

      {/* Year-based Sections (2026+) */}
      {displayYears.map((year) => {
        const yearProducts = productsByYear[year] || [];

        return (
          <section key={year} className="px-4 sm:px-6 lg:px-8 mb-10">
            <div className="mx-auto max-w-6xl">
              <motion.div variants={containerVariants} initial="hidden" animate="visible">
                {/* Section Title */}
                <motion.div variants={itemVariants} className="mb-6 flex items-center justify-between">
                  <div>
                    <h2
                      className="text-2xl text-white/80"
                      style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                    >
                      {year} Collection
                    </h2>
                    <p className="text-white/40 text-sm mt-1">
                      {year === 2026 ? '정규 라인업' : yearProducts.length > 0 ? '등록된 상품' : '등록된 상품 없음'}
                    </p>
                  </div>

                  {/* Add Product Button */}
                  <button
                    onClick={() => setAddProductYear(year)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/50 hover:bg-[#b7916e]/10 hover:border-[#b7916e]/30 hover:text-[#d4c4a8] transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">상품 추가</span>
                  </button>
                </motion.div>

                {/* Product Cards Grid */}
                {yearProducts.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
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
                  <motion.div
                    variants={itemVariants}
                    className="relative rounded-xl overflow-hidden py-12"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-white/[0.01]" />
                    <div className="absolute inset-0 border border-white/[0.04] border-dashed rounded-xl" />
                    <div className="relative flex flex-col items-center justify-center text-center">
                      <div className="p-3 rounded-xl bg-white/[0.04] mb-3">
                        <Wine className="w-6 h-6 text-white/20" />
                      </div>
                      <p className="text-white/30 text-sm">아직 등록된 상품이 없습니다</p>
                      <p className="text-white/20 text-xs mt-1">상품 추가 버튼을 눌러 새 상품을 등록하세요</p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </section>
        );
      })}

      {/* Recent Transactions Section */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">

          {/* Recent Transactions */}
          {recentTransactions.length > 0 && (
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
                  <div className="px-6 py-4 border-b border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-white/40" />
                      <h3 className="text-white/60 font-medium">최근 거래 내역</h3>
                    </div>
                  </div>

                  <div className="divide-y divide-white/[0.04]">
                    {recentTransactions.map((tx) => {
                      const product = PRODUCTS.find((p) => p.id === tx.productId);
                      return (
                        <div key={tx.id} className="px-6 py-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="text-xs text-white/30 w-20">
                              {new Date(tx.createdAt).toLocaleDateString('ko-KR', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                            <div>
                              <p className="text-white/70 text-sm">
                                {product?.name}
                                {tx.bottleNumber && ` #${tx.bottleNumber}`}
                              </p>
                              <p className="text-xs text-white/30">
                                {tx.type === 'sale' && '판매'}
                                {tx.type === 'reservation' && '예약'}
                                {tx.type === 'gift' && '증정'}
                                {tx.type === 'damage' && '손상처리'}
                                {tx.type === 'cancel_reservation' && '예약취소'}
                                {tx.customerName && ` - ${tx.customerName}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white/60">
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
                </div>
              </motion.div>
            </motion.div>
          )}

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
