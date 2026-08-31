'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useInventoryStore } from '@/lib/store/inventory-store';
import { toast } from '@/lib/store/toast-store';
import { logger } from '@/lib/logger';
import { writeNfcTag, getNfcBlocker } from '@/lib/utils/nfc-writer';
import { Footer } from '@/components/layout/Footer';
import {
  PRODUCTS,
  Product,
  ProductType,
  InventoryStatus,
  INVENTORY_STATUS_LABELS,
  INVENTORY_STATUS_COLORS,
  NumberedBottle,
  InventoryTransaction,
  BottleUnit,
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
  Scale,
  Trash2,
  Anchor,
  Loader2,
  Pencil,
} from 'lucide-react';
import {
  fetchStructuresByYear,
  saveStructuresForYear,
  fetchPricingSettings,
} from '@/lib/supabase/database';
import type { PricingTierSetting } from '@/lib/supabase/database';

// ═══════════════════════════════════════════════════════════════════════════
// 상품 ID → 가격 티어 ID 매핑
// ═══════════════════════════════════════════════════════════════════════════

const UNIT_STATUS_LABELS: Record<string, string> = {
  reserved: '예약',
  sold: '판매',
  gifted: '증정',
  damaged: '손상',
};

/** 거래 행에 붙거나 표 아래 고아 목록에 서는 NFC 발급 병 한 줄 */
type NfcBottleRow = {
  key: string;
  nfcCode: string;
  /** "앙 리유 쉬르 브뤼 #3" — 어떤 병의 몇 번 병인지 */
  label: string;
  meta: string;
  statusLabel: string;
  /** 실물 태그에 기록까지 마쳤는지 — 우리가 태그를 구웠다는 기록 */
  written: boolean;
  /** 고객이 그 태그로 들어와 이름을 남겼는지 — written과 다른 사실이다.
      앱의 웹 NFC 쓰기는 안드로이드 크롬에서만 돌아서, 아이폰이나 외부 앱으로
      구운 태그는 written이 영영 false다. 그때도 이 값은 참이 될 수 있다. */
  ownerRegistered: boolean;
  /** 병 번호(넘버링) 또는 제품별 발급 순번(배치) */
  serial?: number;
  sortKey: string;
};

const PRODUCT_TO_PRICING_TIER: Record<string, string> = {
  'first_edition': 'first-edition',
  'en_lieu_sur_brut': 'entry',
  'en_lieu_sur_magnum': 'magnum',
  'element_de_surprise': 'bdb',
  'atomes_crochus_1y': 'atome-1y',
  'atomes_crochus_2y': 'atome-2y',
};

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
  atomes_crochus_1y: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    accent: 'from-rose-500 to-rose-400',
    glow: 'rgba(244, 63, 94, 0.15)',
  },
  atomes_crochus_2y: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    accent: 'from-purple-500 to-purple-400',
    glow: 'rgba(168, 85, 247, 0.15)',
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
  defaultPrice,
}: {
  isOpen: boolean;
  onClose: () => void;
  bottleNumber: number;
  currentStatus: InventoryStatus;
  currentBottle?: NumberedBottle | null;
  onSave: (status: InventoryStatus, details?: { reservedFor?: string; soldTo?: string; giftedTo?: string; price?: number; notes?: string; soldDate?: string }) => void;
  defaultPrice?: number;
}) {
  /* 초깃값은 props에서 바로 만든다. 이 모달은 selectedBottle이 있을 때만 마운트되므로
     열릴 때마다 이 계산이 새로 돈다 — 이펙트로 되채울 필요가 없다. */
  const [status, setStatus] = useState<InventoryStatus>(currentStatus);
  const [customerName, setCustomerName] = useState(
    () => currentBottle?.reservedFor || currentBottle?.soldTo || currentBottle?.giftedTo || ''
  );
  // 기존 가격이 있으면 사용, 없으면 기본 판매가 사용
  const [price, setPrice] = useState(() =>
    currentBottle?.price ? String(currentBottle.price) : defaultPrice ? String(defaultPrice) : ''
  );
  const [notes, setNotes] = useState(() => currentBottle?.notes || '');
  const [soldDate, setSoldDate] = useState(() => new Date().toISOString().split('T')[0]);

  const handleSave = () => {
    onSave(status, {
      reservedFor: status === 'reserved' ? customerName : undefined,
      soldTo: status === 'sold' ? customerName : undefined,
      giftedTo: status === 'gifted' ? customerName : undefined,
      price: price ? parseInt(price) : undefined,
      notes: notes || undefined,
      soldDate: (status === 'sold' || status === 'gifted') ? soldDate : undefined,
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

              {/* 판매/증정일 */}
              {(status === 'sold' || status === 'gifted') && (
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
                    {status === 'sold' ? '판매일' : '증정일'}
                  </label>
                  <input
                    type="date"
                    value={soldDate}
                    onChange={(e) => setSoldDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/90 focus:outline-none focus:border-[#b7916e]/50 [color-scheme:dark]"
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
  defaultPrice,
  units,
  customerNames,
}: {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onAction: (action: 'sell' | 'reserve' | 'gift' | 'damage' | 'confirm' | 'cancel', serialNumber: number, details?: { customerName?: string; price?: number; notes?: string; soldDate?: string }) => void;
  defaultPrice?: number;
  /** 이 제품의 병 기록 — 한정번호가 이미 쓰였는지, 예약 상태인지 판단한다 */
  units: BottleUnit[];
  /** 지금까지 쓴 고객명 (최근 순) */
  customerNames: string[];
}) {
  const [action, setAction] = useState<'sell' | 'reserve' | 'gift' | 'damage' | 'confirm' | 'cancel'>('sell');
  /** null이면 자동 제안 번호를 그대로 쓴다. 손으로 고치면 그 값이 들어간다. */
  const [serialInput, setSerialInput] = useState<string | null>(null);
  /** null이면 예약자 이름을 그대로 따라간다. 입력하면 그 값이 들어간다. */
  const [customerNameInput, setCustomerNameInput] = useState<string | null>(null);
  const [nameFocused, setNameFocused] = useState(false);
  /* 가격은 기본 판매가에서 파생하고, 사용자가 입력하면 그 값이 덮는다.
     defaultPrice가 늦게 로드돼도 저절로 따라오므로 채워 넣는 이펙트가 필요 없다. */
  const [priceEdit, setPrice] = useState<string | null>(null);
  const price = priceEdit ?? (defaultPrice ? formatNumberWithCommas(String(defaultPrice)) : '');
  const [notes, setNotes] = useState('');
  const [soldDate, setSoldDate] = useState(() => new Date().toISOString().split('T')[0]);

  /** 예약확정·예약취소는 이미 예약된 병에만 걸 수 있다 */
  const picksReserved = action === 'confirm' || action === 'cancel';

  const usedSerials = useMemo(
    () => new Set(units.filter((u) => u.serialNumber != null).map((u) => u.serialNumber as number)),
    [units]
  );
  const reservedSerials = useMemo(
    () => units.filter((u) => u.status === 'reserved' && u.serialNumber != null)
      .map((u) => u.serialNumber as number)
      .sort((a, b) => a - b),
    [units]
  );

  /**
   * 자동으로 제안할 한정번호.
   * 새로 내보내는 병은 1번부터 올라가며 아직 안 쓴 가장 작은 번호,
   * 예약을 확정·취소할 때는 예약된 병 중 가장 작은 번호.
   */
  const suggestedSerial = useMemo(() => {
    if (picksReserved) return reservedSerials[0];
    let next = 1;
    while (usedSerials.has(next)) next++;
    return next;
  }, [picksReserved, reservedSerials, usedSerials]);



  const handlePriceChange = (value: string) => {
    setPrice(formatNumberWithCommas(value));
  };

  // 손으로 고치기 전까지는 자동 제안 번호가 그대로 보인다
  const serial = serialInput ?? (suggestedSerial != null ? String(suggestedSerial) : '');
  const serialTouched = serialInput !== null;

  const serialNumber = parseInt(serial, 10);

  // 예약을 확정할 때는 예약자 이름을 미리 채워 준다 — 다시 칠 이유가 없다
  const reservedUnit = picksReserved
    ? units.find((u) => u.status === 'reserved' && u.serialNumber === serialNumber)
    : undefined;
  const customerName = customerNameInput ?? reservedUnit?.customerName ?? '';
  const setCustomerName = setCustomerNameInput;
  const serialValid = Number.isInteger(serialNumber) && serialNumber > 0;
  const isReservedSerial = serialValid && reservedSerials.includes(serialNumber);
  const isUsedSerial = serialValid && usedSerials.has(serialNumber);

  /** 번호가 이 작업에 쓸 수 있는 번호인지 */
  const serialError = !serialValid
    ? '번호를 입력하세요'
    : picksReserved
      ? (isReservedSerial ? null : `#${serialNumber}는 예약된 병이 아닙니다`)
      : (isUsedSerial ? `#${serialNumber}는 이미 나간 병입니다` : null);

  const overTotal = serialValid && !!product && serialNumber > product.totalQuantity;

  // 이름을 입력하는 중이면 그 글자가 들어간 것만 추린다
  const nameSuggestions = useMemo(() => {
    const q = customerName.trim();
    const pool = q ? customerNames.filter((n) => n.includes(q) && n !== q) : customerNames;
    return pool.slice(0, 6);
  }, [customerName, customerNames]);

  const handleSubmit = () => {
    if (serialError) return;
    onAction(action, serialNumber, {
      customerName: customerName || undefined,
      price: price ? parseNumberFromCommas(price) : undefined,
      notes: notes || undefined,
      soldDate: (action === 'sell' || action === 'gift' || action === 'confirm') ? soldDate : undefined,
    });
    onClose();
  };

  if (!isOpen || !product) return null;

  const colors = PRODUCT_COLORS[product.id];
  const needsCustomer = action === 'sell' || action === 'reserve' || action === 'gift' || action === 'confirm';

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
                      onClick={() => { setAction(item.value as typeof action); setSerialInput(null); setCustomerNameInput(null); }}
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

              {/* 한정번호 — 병마다 NFC가 붙으니 수량이 아니라 이 번호 하나로 처리한다 */}
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <label className="block text-xs text-white/40 uppercase tracking-wider">한정번호</label>
                  <span className="text-[11px] text-white/25">
                    총 {product.totalQuantity}병 · 나간 병 {usedSerials.size}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* #는 입력칸 안에 겹쳐 둔다. 밖에 두면 좁은 화면에서 줄이 넘쳐 가로 스크롤이 생긴다 */}
                  <div className="relative flex-1 min-w-0">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-white/30 font-mono">#</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={serial}
                      onChange={(e) => setSerialInput(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="번호"
                      className={`w-full pl-9 pr-4 py-3 rounded-xl bg-white/[0.04] border text-white/90 placeholder:text-white/30 focus:outline-none ${
                        serialError ? 'border-red-500/40 focus:border-red-500/60' : 'border-white/[0.1] focus:border-[#b7916e]/50'
                      }`}
                    />
                  </div>
                  {serialTouched && suggestedSerial != null && String(suggestedSerial) !== serial && (
                    <button
                      onClick={() => setSerialInput(null)}
                      className="px-3 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/50 hover:bg-white/[0.08] text-xs shrink-0"
                      title="자동 번호로 되돌리기"
                    >
                      #{suggestedSerial}
                    </button>
                  )}
                </div>

                {serialError ? (
                  <p className="text-[11px] text-red-400/80 mt-1.5">{serialError}</p>
                ) : overTotal ? (
                  <p className="text-[11px] text-amber-400/80 mt-1.5">
                    한정 수량 {product.totalQuantity}병을 넘는 번호입니다. 맞는지 확인하세요.
                  </p>
                ) : (
                  <p className="text-[11px] text-white/25 mt-1.5">
                    {picksReserved
                      ? `예약된 병 ${reservedSerials.length}개 중에서 고릅니다`
                      : '빈 번호를 자동으로 채웁니다. 직접 고쳐도 됩니다.'}
                  </p>
                )}

                {/* 예약된 병 바로 고르기 */}
                {picksReserved && reservedSerials.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {reservedSerials.slice(0, 12).map((n) => (
                      <button
                        key={n}
                        onClick={() => setSerialInput(String(n))}
                        className={`px-2 py-1 rounded-lg text-[11px] font-mono border transition-all ${
                          n === serialNumber
                            ? 'bg-[#b7916e]/20 border-[#b7916e]/40 text-[#d4c4a8]'
                            : 'bg-white/[0.04] border-white/[0.1] text-white/45 hover:bg-white/[0.08]'
                        }`}
                      >
                        #{n}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer Name */}
              {needsCustomer && (
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
                    {action === 'reserve' ? '예약자' : action === 'gift' ? '수령인' : '고객명'}
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    onFocus={() => setNameFocused(true)}
                    // 목록을 누르는 순간 blur가 먼저 오므로 조금 늦게 닫는다
                    onBlur={() => setTimeout(() => setNameFocused(false), 150)}
                    placeholder="이름 입력"
                    autoComplete="off"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-[#b7916e]/50"
                  />
                  {/* 겹쳐 띄우면 모달 스크롤 영역에 잘린다. 아래로 밀어내고 같이 스크롤시킨다. */}
                  {nameFocused && nameSuggestions.length > 0 && (
                    <div className="mt-1.5 rounded-xl bg-white/[0.02] border border-white/[0.08] overflow-hidden">
                      <p className="px-4 pt-2 pb-1 text-[10px] text-white/25">전에 입력한 이름</p>
                      {nameSuggestions.map((name) => (
                        <button
                          key={name}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { setCustomerName(name); setNameFocused(false); }}
                          className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-white/[0.06] transition-colors"
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
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

              {/* 판매/증정일 */}
              {(action === 'sell' || action === 'gift' || action === 'confirm') && (
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
                    {action === 'gift' ? '증정일' : '판매일'}
                  </label>
                  <input
                    type="date"
                    value={soldDate}
                    onChange={(e) => setSoldDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/90 focus:outline-none focus:border-[#b7916e]/50 [color-scheme:dark]"
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
                  disabled={!!serialError}
                  className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl bg-[#b7916e]/20 border border-[#b7916e]/30 text-[#d4c4a8] hover:bg-[#b7916e]/30 flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#b7916e]/20"
                >
                  <Check className="w-4 h-4" />
                  {serialValid ? `#${serialNumber} 확인` : '확인'}
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
// NFC 쓰기 모달
// ═══════════════════════════════════════════════════════════════════════════

function NfcWriteModal({
  isOpen,
  onClose,
  bottles,
  initialCode,
  missingCount = 0,
  onIssueMore,
  onWritten,
  onReset,
}: {
  isOpen: boolean;
  onClose: () => void;
  /** 이 모달이 다루는 병들. 한 거래에서 여러 병이 나갔으면 전부 들어온다. */
  bottles: NfcBottleRow[];
  /** 처음 띄울 병의 코드 */
  initialCode: string;
  /** 이 거래에서 아직 코드를 못 받은 병 수 */
  missingCount?: number;
  onIssueMore?: () => void;
  onWritten?: (nfcCode: string) => void;
  onReset?: (nfcCode: string) => void;
}) {
  const [writeStatus, setWriteStatus] = useState<'idle' | 'writing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [index, setIndex] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  // 못 쓰는 이유를 문장으로 받는다. https 문제인지 브라우저 문제인지 현장에서 갈라 봐야 한다.
  const nfcBlocker = typeof window === 'undefined' ? null : getNfcBlocker();

  const active = bottles[index];
  const nfcCode = active?.nfcCode ?? '';
  const bottleUrl = `https://musedemaree.com/b/${nfcCode}`;

  /** 진행 중인 NFC 쓰기를 멈춘다. write()는 태그가 닿을 때까지 스스로 끝나지 않는다. */
  const cancelWrite = () => {
    abortRef.current?.abort();
    abortRef.current = null;
  };

  /**
   * 언제든 닫는다. 쓰는 중이면 그 쓰기를 취소하고 닫는다 —
   * 예전엔 writing이면 막았는데, 태그를 못 읽으면 그 상태로 멈춰 모달이 영영 안 닫혔다.
   */
  const guardedClose = () => {
    cancelWrite();
    setWriteStatus('idle');
    onClose();
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(nfcCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 클립보드 거부 — 화면의 코드를 직접 옮겨 적으면 된다 */
    }
  };

  const goTo = (next: number) => {
    cancelWrite();
    setIndex(next);
    setWriteStatus('idle');
    setErrorMessage('');
    setConfirmReset(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    setWriteStatus('idle');
    setErrorMessage('');
    setConfirmReset(false);
    const start = bottles.findIndex((b) => b.nfcCode === initialCode);
    setIndex(start >= 0 ? start : 0);
    // 열릴 때 한 번만 자리를 잡는다. 이후 목록이 늘어나도 보던 병을 유지한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialCode]);

  // 모달이 사라져도 NFC 대기가 남아 있으면 다음 쓰기가 InvalidStateError로 막힌다
  useEffect(() => () => { abortRef.current?.abort(); }, []);

  useEffect(() => {
    if (writeStatus !== 'success') return;
    const timer = setTimeout(() => {
      // 여러 병을 연달아 쓰는 중이면 다음 미기록 병으로 넘어간다
      const next = bottles.findIndex((b, i) => i > index && !b.written);
      if (next >= 0) goTo(next);
      else onClose();
    }, 1400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writeStatus]);

  const handleWrite = async () => {
    if (!nfcCode) return;

    // 앞선 대기가 살아 있으면 새 write가 InvalidStateError로 막힌다
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // write()는 태그가 닿을 때까지 영원히 기다린다. 30초면 위치가 틀린 것으로 본다.
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 30000);

    setWriteStatus('writing');
    setErrorMessage('');
    try {
      const result = await writeNfcTag(nfcCode, { signal: controller.signal });
      if (result.success) {
        setWriteStatus('success');
        onWritten?.(nfcCode);
      } else if (result.aborted && !timedOut) {
        // 사용자가 취소한 것이므로 에러 화면 없이 되돌린다
        setWriteStatus('idle');
      } else if (result.aborted) {
        setWriteStatus('error');
        setErrorMessage('30초 동안 태그를 인식하지 못했습니다. 태그를 뒷면 카메라 바로 아래에 붙이고, 두꺼운 케이스는 벗긴 뒤 다시 시도하세요.');
      } else {
        setWriteStatus('error');
        setErrorMessage(result.error || 'NFC 쓰기 실패');
      }
    } catch (error) {
      setWriteStatus('error');
      setErrorMessage(error instanceof Error ? `NFC 쓰기 중 오류: ${error.message}` : 'NFC 쓰기 중 오류가 발생했습니다');
    } finally {
      clearTimeout(timer);
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="nfc-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={guardedClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />
      <motion.div
        key="nfc-modal-content"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-md"
      >
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-[#0d1525]" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />
          <div className="absolute inset-0 border border-white/[0.1] rounded-2xl" />

          <div className="relative">
            {/* Header */}
            <div className="px-5 py-3 sm:px-6 sm:py-4 bg-cyan-500/10 border-b border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-[#0a0f1a]/50 text-cyan-400">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-cyan-400 text-sm sm:text-base">NFC 태그 등록</h3>
                    <p className="text-[10px] sm:text-xs text-white/30">
                      {bottles.length > 1
                        ? `${bottles.length}병 중 ${index + 1}번째 · 기록 ${bottles.filter((b) => b.written).length}/${bottles.length}`
                        : '고객 조회용 NFC 태그에 기록'}
                    </p>
                  </div>
                </div>
                <button onClick={guardedClose} className="p-2 rounded-xl hover:bg-white/[0.06] text-white/40">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* 어떤 병인지 — 코드만 보면 실물과 대조할 수가 없다 */}
              {active && (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-3">
                  <div className="flex items-center gap-2">
                    {/* 여러 병을 연달아 쓸 때 앞뒤로 넘긴다 */}
                    {bottles.length > 1 && (
                      <button
                        onClick={() => goTo((index - 1 + bottles.length) % bottles.length)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] shrink-0"
                        title="이전 병"
                      >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                      </button>
                    )}
                    <div className="flex-1 text-center min-w-0">
                      <p className="text-sm font-medium text-white/85 truncate">{active.label}</p>
                      {active.meta && <p className="text-[11px] text-white/35 mt-0.5 truncate">{active.meta}</p>}
                      <span
                        className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full border ${
                          active.written
                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400/90'
                            : 'bg-white/[0.04] border-white/[0.12] text-white/40'
                        }`}
                      >
                        {active.written ? '태그 쓰기 완료' : '태그 쓰기 기록 없음'}
                      </span>
                      {/* 소유 등록은 별개의 사실이라 칩을 따로 세운다.
                          쓰기 기록이 비어도 여기가 켜져 있으면 태그는 이미 동작한다. */}
                      <span
                        className={`inline-block mt-2 ml-1.5 text-[10px] px-2 py-0.5 rounded-full border ${
                          active.ownerRegistered
                            ? 'bg-cyan-500/10 border-cyan-500/25 text-cyan-300/90'
                            : 'bg-white/[0.04] border-white/[0.12] text-white/40'
                        }`}
                      >
                        {active.ownerRegistered ? '소유 등록됨' : '소유 등록 전'}
                      </span>
                    </div>
                    {bottles.length > 1 && (
                      <button
                        onClick={() => goTo((index + 1) % bottles.length)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] shrink-0"
                        title="다음 병"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* 병 선택 점 — 어느 병이 남았는지 한눈에 */}
                  {bottles.length > 1 && (
                    <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
                      {bottles.map((b, i) => (
                        <button
                          key={b.key}
                          onClick={() => goTo(i)}
                          title={`${b.label} · 태그 쓰기 ${b.written ? '완료' : '기록 없음'} · 소유 등록 ${b.ownerRegistered ? '됨' : '전'}`}
                          className={`w-2 h-2 rounded-full transition-all ${
                            b.ownerRegistered ? 'bg-cyan-300' : b.written ? 'bg-emerald-400' : 'bg-amber-400'
                          } ${i === index ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-[#0d1525]' : 'opacity-50'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 이 거래의 남은 병 — 예전에는 몇 병을 팔든 코드가 1개만 나왔다 */}
              {missingCount > 0 && onIssueMore && (
                <button
                  onClick={onIssueMore}
                  className="w-full px-4 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400/90 hover:bg-cyan-500/20 text-xs flex items-center justify-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  코드 없는 {missingCount}병 마저 발급
                </button>
              )}

              {/* NFC 코드 표시 */}
              {active && (
                <div className="text-center">
                  <p className="text-xs text-white/40 mb-1">NFC 코드</p>
                  <p className="text-2xl font-mono font-bold text-cyan-400 tracking-wider">{nfcCode}</p>
                  <p className="text-xs text-white/30 mt-1 break-all">{bottleUrl}</p>
                  <button
                    onClick={copyCode}
                    className="mt-2 px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.1] text-white/50 hover:bg-white/[0.08] text-[11px]"
                  >
                    {copied ? '복사됨' : '코드 복사'}
                  </button>
                </div>
              )}

              {active && writeStatus === 'idle' && (
                <>
                  {nfcBlocker === null ? (
                    <button
                      onClick={handleWrite}
                      className="w-full px-4 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 flex items-center justify-center gap-2 font-medium"
                    >
                      <Sparkles className="w-4 h-4" />
                      NFC 태그에 쓰기
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400/80 text-xs leading-relaxed">
                      {nfcBlocker} 위 NFC 코드를 다른 앱으로 직접 기록해도 됩니다.
                    </div>
                  )}
                </>
              )}

              {writeStatus === 'writing' && (
                <div className="text-center py-4">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="inline-block"
                  >
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                  </motion.div>
                  <p className="text-white/60 text-sm mt-3">NFC 태그를 기기 뒷면에 가까이 대주세요...</p>
                  <p className="text-white/30 text-[11px] mt-1.5">갤럭시는 뒷면 카메라 바로 아래가 안테나입니다. 3초쯤 붙여 두세요.</p>
                  <button
                    onClick={cancelWrite}
                    className="mt-4 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/60 hover:bg-white/[0.08] text-sm"
                  >
                    취소
                  </button>
                </div>
              )}

              {writeStatus === 'success' && (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 text-emerald-400" />
                  </div>
                  <p className="text-emerald-400 text-sm mt-3 font-medium">NFC 태그 기록 완료!</p>
                </div>
              )}

              {writeStatus === 'error' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400/80 text-xs">
                    {errorMessage}
                  </div>
                  <button
                    onClick={handleWrite}
                    className="w-full px-4 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 flex items-center justify-center gap-2 text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    다시 시도
                  </button>
                </div>
              )}

              {/* 닫기 버튼 */}
              {(writeStatus === 'idle' || writeStatus === 'error') && (
                <button
                  onClick={guardedClose}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/60 hover:bg-white/[0.08] text-sm"
                >
                  닫기
                </button>
              )}

              {/* 쓰기 취소 · 기록 초기화 — 잘못 발급한 병을 없던 일로 되돌린다 */}
              {active && onReset && (writeStatus === 'idle' || writeStatus === 'error') && (
                <div className="pt-3 border-t border-white/[0.06]">
                  {confirmReset ? (
                    <div className="space-y-2">
                      <p className="text-[11px] text-red-400/80 leading-relaxed">
                        이 병의 NFC 기록을 지웁니다. 코드 {nfcCode}는 무효가 되어 고객이 링크를 열면
                        &ldquo;등록되지 않은 병&rdquo;으로 보입니다. 거래 내역과 재고 수량은 그대로 남습니다.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmReset(false)}
                          className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/60 hover:bg-white/[0.08] text-xs"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => { onReset(nfcCode); }}
                          className="flex-1 px-3 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 text-xs font-medium"
                        >
                          기록 삭제
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmReset(true)}
                      className="w-full px-4 py-2 rounded-xl text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.08] text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      쓰기 취소 · 이 병 기록 초기화
                    </button>
                  )}
                </div>
              )}
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
// 상품 수정 모달
// ═══════════════════════════════════════════════════════════════════════════

function EditProductModal({
  isOpen,
  onClose,
  product,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  product: { id: string; name: string; nameKo: string; year: number; size: string; totalQuantity: number; description?: string } | null;
  onSave: (productId: string, updates: { totalQuantity: number }) => void;
}) {
  /* 초깃값은 props에서 만든다 — 대상이 바뀌면 호출부의 key가 새로 마운트시킨다 */
  const [quantity, setQuantity] = useState(() => product?.totalQuantity.toLocaleString() ?? '');

  const handleQuantityChange = (value: string) => {
    setQuantity(formatNumberWithCommas(value));
  };

  const handleSubmit = () => {
    if (!product || !quantity) return;

    onSave(product.id, {
      totalQuantity: parseNumberFromCommas(quantity),
    });
    toast.success('총수량이 수정되었습니다');
    onClose();
  };

  if (!isOpen || !product) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="edit-product-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />
      <motion.div
        key="edit-product-modal-content"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-md"
      >
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-[#0d1525]" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />
          <div className="absolute inset-0 border border-white/[0.1] rounded-2xl" />

          <div className="relative p-5 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-medium text-white/90">총수량 수정</h3>
                <p className="text-xs text-white/40">{product.nameKo}</p>
              </div>
              <button onClick={onClose} className="p-2 text-white/40 hover:text-white/60">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">총 수량</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-[#b7916e]/50"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-5">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/60 hover:bg-white/[0.08]"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={!quantity}
                className="flex-1 px-4 py-3 rounded-xl bg-[#b7916e]/20 border border-[#b7916e]/30 text-[#d4c4a8] hover:bg-[#b7916e]/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                저장
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 트랜잭션 수정 모달
// ═══════════════════════════════════════════════════════════════════════════

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    id: string;
    productId: string;
    type: string;
    quantity: number;
    bottleNumber?: number;
    customerName?: string;
    price?: number;
    notes?: string;
  } | null;
  onSave: (transactionId: string, updates: { type?: string; quantity: number; bottleNumber?: number; customerName?: string; price?: number; notes?: string }) => void;
  onDelete: (transactionId: string) => void;
  /** 이 거래에 묶인 병들 — 삭제하면 함께 사라진다 */
  linkedBottles: BottleUnit[];
  /** 이 제품의 병 기록 전부 — 한정번호 중복을 본다 */
  productUnits: BottleUnit[];
  /** 2025 넘버링 병이면 병 기록을 여기서 다루지 않는다 */
  isNumberedProduct: boolean;
}

function EditTransactionModal({
  isOpen, onClose, transaction, onSave, onDelete,
  linkedBottles, productUnits, isNumberedProduct,
}: EditTransactionModalProps) {
  /* 초깃값은 props에서 만든다 — 대상이 바뀌면 호출부의 key가 새로 마운트시킨다 */
  const [type, setType] = useState(() => transaction?.type ?? '');
  const [serialInput, setSerialInput] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState(() => transaction?.customerName || '');
  const [price, setPrice] = useState(() =>
    transaction?.price ? transaction.price.toLocaleString() : ''
  );
  const [notes, setNotes] = useState(() => transaction?.notes || '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handlePriceChange = (value: string) => {
    setPrice(formatNumberWithCommas(value));
  };

  // 한정번호는 배치 제품만 여기서 고친다
  const editsSerial = !isNumberedProduct;
  const serial = serialInput ?? (transaction?.bottleNumber != null ? String(transaction.bottleNumber) : '');
  const serialNumber = parseInt(serial, 10);
  const serialValid = Number.isInteger(serialNumber) && serialNumber > 0;

  // 다른 병이 이미 쓰고 있는 번호로는 옮길 수 없다
  const linkedIds = new Set(linkedBottles.map((u) => u.id));
  const takenByOther = serialValid && productUnits.some(
    (u) => u.serialNumber === serialNumber && !linkedIds.has(u.id)
  );
  const serialError = !editsSerial
    ? null
    : !serialValid
      ? '번호를 입력하세요'
      : takenByOther
        ? `#${serialNumber}는 다른 병이 쓰고 있습니다`
        : null;

  const handleSave = () => {
    if (!transaction || serialError) return;

    onSave(transaction.id, {
      type: type !== transaction.type ? type : undefined,
      quantity: transaction.quantity,
      bottleNumber: editsSerial && serialValid ? serialNumber : undefined,
      customerName: customerName || undefined,
      price: price ? parseNumberFromCommas(price) : undefined,
      notes: notes || undefined,
    });
    toast.success('거래 내역을 수정했습니다');
    onClose();
  };

  const handleDelete = () => {
    if (!transaction) return;
    onDelete(transaction.id);
    onClose();
  };

  if (!isOpen || !transaction) return null;

  const typeLabels: Record<string, string> = {
    sale: '판매',
    reservation: '예약',
    gift: '증정',
    damage: '손상처리',
    return: '반품',
    cancel_reservation: '예약취소',
  };

  return (
    <AnimatePresence>
      <motion.div
        key="edit-tx-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />
      <motion.div
        key="edit-tx-modal-content"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-md"
      >
        <div className="relative rounded-2xl overflow-hidden max-h-[85vh] flex flex-col">
          <div className="absolute inset-0 bg-[#0d1525]" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />
          <div className="absolute inset-0 border border-white/[0.1] rounded-2xl" />

          <div className="relative p-5 sm:p-6 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between mb-5 shrink-0">
              <div>
                <h3 className="text-lg font-medium text-white/90">거래 내역 수정</h3>
                <p className="text-xs text-white/40">{typeLabels[transaction.type] || transaction.type}</p>
              </div>
              <button onClick={onClose} className="p-2 text-white/40 hover:text-white/60">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">작업 유형</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/90 focus:outline-none focus:border-[#b7916e]/50"
                >
                  <option value="sale">판매</option>
                  <option value="reservation">예약</option>
                  <option value="gift">증정</option>
                  <option value="damage">손상처리</option>
                  <option value="return">반품</option>
                  <option value="cancel_reservation">예약취소</option>
                </select>
              </div>

              {/* 한정번호 — 병 하나짜리 거래라 수량 대신 이 번호를 고친다 */}
              {editsSerial && (
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">한정번호</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-white/30 font-mono">#</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={serial}
                      onChange={(e) => setSerialInput(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="번호"
                      className={`w-full pl-9 pr-4 py-3 rounded-xl bg-white/[0.04] border text-white/90 placeholder:text-white/30 focus:outline-none ${
                        serialError ? 'border-red-500/40 focus:border-red-500/60' : 'border-white/[0.1] focus:border-[#b7916e]/50'
                      }`}
                    />
                  </div>
                  {serialError ? (
                    <p className="text-[11px] text-red-400/80 mt-1.5">{serialError}</p>
                  ) : (
                    <p className="text-[11px] text-white/25 mt-1.5">번호를 바꾸면 병 기록의 번호도 함께 바뀝니다.</p>
                  )}
                </div>
              )}

              {/* 옛 거래는 아직 병이 여러 개일 수 있다 */}
              {transaction.quantity > 1 && (
                <div className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-400/80">
                  이 거래는 {transaction.quantity}병짜리 옛 기록입니다. 번호는 대표 한 병에만 붙습니다.
                </div>
              )}

              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">고객명</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="고객명 입력"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-[#b7916e]/50"
                />
              </div>

              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">금액 (원)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={price}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-[#b7916e]/50"
                />
              </div>

              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">메모</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="메모 입력"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-[#b7916e]/50 resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            {confirmDelete ? (
              <div className="pt-5 shrink-0 space-y-2">
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-400/85 leading-relaxed">
                  이 거래를 지우고 재고를 되돌립니다.
                  {linkedBottles.length > 0 && (
                    <>
                      {' '}이 거래로 나간 병{' '}
                      <span className="font-mono">
                        {linkedBottles.map((u) => `#${u.serialNumber ?? '?'}`).join(', ')}
                      </span>
                      의 기록과 NFC 코드도 함께 지워집니다. 한정번호는 다시 쓸 수 있게 됩니다.
                    </>
                  )}
                  {linkedBottles.some((u) => u.nfcCode) && ' 이미 태그를 쓴 병이면 고객이 링크를 열 수 없게 됩니다.'}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/60 hover:bg-white/[0.08]"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 font-medium"
                  >
                    지우기
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 pt-5 shrink-0">
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                  title="거래 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/60 hover:bg-white/[0.08]"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={!!serialError}
                  className="flex-1 px-4 py-3 rounded-xl bg-[#b7916e]/20 border border-[#b7916e]/30 text-[#d4c4a8] hover:bg-[#b7916e]/30 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" />
                  저장
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 무게관리 모달
// ═══════════════════════════════════════════════════════════════════════════

interface StructureItem {
  id: string;
  name: string;
  volume: string;
  weight: number;
  quantity: number;
}

interface Structure {
  id: string;
  year: number;
  name: string;
  capacity: number;
  maxWeight: number;
  structureWeight: number;
  isSlotOnly: boolean;
  slotOnlyType: string | null;
  items: StructureItem[];
}

// 년도별 기본 구조물 생성
const getDefaultStructuresForYear = (year: number): Structure[] => {
  if (year === 2026) {
    return [
      {
        id: 'default_1',
        year: 2026,
        name: '구조물 1번',
        capacity: 250,
        maxWeight: 500,
        structureWeight: 150,
        isSlotOnly: false,
        slotOnlyType: null,
        items: [
          { id: 'item_1', name: '샴페인', volume: '750ml', weight: 1.5, quantity: 227 },
          { id: 'item_2', name: '조옥화 안동소주', volume: '800ml', weight: 0.8, quantity: 4 },
          { id: 'item_3', name: '더치커피', volume: '300ml', weight: 0.3, quantity: 4 },
          { id: 'item_4', name: '코리진', volume: '500ml', weight: 0.5, quantity: 2 },
          { id: 'item_5', name: '강릉소주', volume: '375ml', weight: 0.4, quantity: 2 },
          { id: 'item_6', name: '소우주 탄산수', volume: '325ml', weight: 0.33, quantity: 6 },
          { id: 'item_7', name: '지란지교 약주', volume: '500ml', weight: 0.5, quantity: 2 },
        ],
      },
      {
        id: 'default_2',
        year: 2026,
        name: '구조물 2번',
        capacity: 250,
        maxWeight: 500,
        structureWeight: 165,
        isSlotOnly: false,
        slotOnlyType: null,
        items: [
          { id: 'item_8', name: '샴페인 (매그넘)', volume: '1500ml', weight: 3.5, quantity: 24 },
          { id: 'item_9', name: '샴페인', volume: '750ml', weight: 1.5, quantity: 167 },
        ],
      },
      {
        id: 'default_3',
        year: 2026,
        name: '구조물 3번',
        capacity: 50,
        maxWeight: 500,
        structureWeight: 100,
        isSlotOnly: true,
        slotOnlyType: 'champagne_750',
        items: [
          { id: 'item_10', name: '샴페인', volume: '750ml', weight: 1.5, quantity: 50 },
        ],
      },
    ];
  }
  // 다른 년도는 빈 구조물로 시작
  return [];
};

function WeightManagementModal({
  isOpen,
  onClose,
  year,
}: {
  isOpen: boolean;
  onClose: () => void;
  year: number;
}) {
  // 아이템에 ID가 없으면 추가
  const ensureItemIds = (structures: Structure[]): Structure[] => {
    return structures.map(s => ({
      ...s,
      items: s.items.map((item, idx) => ({
        ...item,
        id: item.id || `item_${s.id}_${idx}_${Date.now()}`
      }))
    }));
  };

  const [structures, setStructures] = useState<Structure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedStructure, setExpandedStructure] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Supabase에서 데이터 로드 (실패 시 localStorage 폴백)
  const loadFromSupabase = useCallback(async () => {
    setIsLoading(true);
    const storageKey = `weight_management_structures_${year}`;

    try {
      const data = await fetchStructuresByYear(year);
      if (data && data.length > 0) {
        // Supabase 데이터가 있으면 사용
        setStructures(data);
        setExpandedStructure(prev => prev || data[0].id);
      } else {
        // Supabase에 데이터가 없으면 localStorage 확인
        const localData = localStorage.getItem(storageKey);
        if (localData) {
          const parsed = ensureItemIds(JSON.parse(localData));
          setStructures(parsed);
          setExpandedStructure(prev => prev || (parsed.length > 0 ? parsed[0].id : null));
        } else {
          // localStorage도 없으면 기본값 사용
          const defaults = getDefaultStructuresForYear(year);
          setStructures(defaults);
          setExpandedStructure(prev => prev || (defaults.length > 0 ? defaults[0].id : null));
        }
      }
    } catch (error) {
      logger.error('Error loading structures from Supabase:', error);
      // 에러 시 localStorage 확인
      const localData = localStorage.getItem(storageKey);
      if (localData) {
        const parsed = ensureItemIds(JSON.parse(localData));
        setStructures(parsed);
        setExpandedStructure(prev => prev || (parsed.length > 0 ? parsed[0].id : null));
      } else {
        // localStorage도 없으면 기본값 사용
        const defaults = getDefaultStructuresForYear(year);
        setStructures(defaults);
        setExpandedStructure(prev => prev || (defaults.length > 0 ? defaults[0].id : null));
      }
    } finally {
      setIsLoading(false);
      setHasInitialized(true);
    }
  }, [year]);

  // 년도가 변경될 때 또는 모달이 열릴 때 데이터 로드
  useEffect(() => {
    if (isOpen) {
      loadFromSupabase();
    }
  }, [year, isOpen, loadFromSupabase]);

  // Supabase에 저장 (실패 시 localStorage 폴백)
  const saveToSupabase = useCallback(async (dataToSave: Structure[]) => {
    if (!hasInitialized) return;

    const storageKey = `weight_management_structures_${year}`;

    setIsSaving(true);
    try {
      const success = await saveStructuresForYear(year, dataToSave);
      if (!success) {
        // Supabase 저장 실패 시 localStorage에 백업
        logger.warn('Supabase save failed, falling back to localStorage');
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      }
    } catch (error) {
      logger.error('Error saving structures to Supabase:', error);
      // 에러 시에도 localStorage에 백업
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    } finally {
      setIsSaving(false);
    }
  }, [year, hasInitialized]);

  // 구조물 변경 시 자동 저장 (debounce)
  useEffect(() => {
    if (!hasInitialized || isLoading) return;

    const timeoutId = setTimeout(() => {
      saveToSupabase(structures);
    }, 1000); // 1초 후 자동 저장

    return () => clearTimeout(timeoutId);
  }, [structures, hasInitialized, isLoading, saveToSupabase]);

  // 구조물별 계산
  const calculateStructure = (structure: Structure) => {
    let totalBottles = 0;
    let totalWeight = 0;

    structure.items.forEach((item) => {
      totalBottles += item.quantity;
      totalWeight += item.quantity * item.weight;
    });

    const totalWeightWithStructure = totalWeight + structure.structureWeight;
    const capacityPercent = (totalBottles / structure.capacity) * 100;
    const weightPercent = (totalWeightWithStructure / structure.maxWeight) * 100;

    return {
      totalBottles,
      totalWeight: totalWeight.toFixed(1),
      totalWeightWithStructure: totalWeightWithStructure.toFixed(1),
      capacityPercent: Math.min(capacityPercent, 100),
      weightPercent: Math.min(weightPercent, 100),
      isOverCapacity: totalBottles > structure.capacity,
      isOverWeight: totalWeightWithStructure > structure.maxWeight,
    };
  };

  // 전체 현황 계산
  const calculateTotal = () => {
    let totalPlanned = 0;
    let totalCapacity = 0;
    let totalWeight = 0;
    let totalMaxWeight = 0;

    structures.forEach((structure) => {
      const calc = calculateStructure(structure);
      totalPlanned += parseInt(calc.totalBottles.toString());
      totalCapacity += structure.capacity;
      totalWeight += parseFloat(calc.totalWeightWithStructure);
      totalMaxWeight += structure.maxWeight;
    });

    return {
      totalPlanned,
      totalCapacity,
      overflow: Math.max(0, totalPlanned - totalCapacity),
      totalWeight: totalWeight.toFixed(1),
      totalMaxWeight,
    };
  };

  // 아이템 수량 변경
  const updateItemQuantity = (structureId: string, itemId: string, newQuantity: number) => {
    setStructures((prev) =>
      prev.map((s) => {
        if (s.id === structureId) {
          return {
            ...s,
            items: s.items.map((item) =>
              item.id === itemId ? { ...item, quantity: Math.max(0, newQuantity) } : item
            ),
          };
        }
        return s;
      })
    );
  };

  // 아이템 필드 업데이트
  const updateItemField = (structureId: string, itemId: string, field: 'name' | 'volume' | 'weight', value: string | number) => {
    setStructures((prev) =>
      prev.map((s) => {
        if (s.id === structureId) {
          return {
            ...s,
            items: s.items.map((item) =>
              item.id === itemId ? { ...item, [field]: value } : item
            ),
          };
        }
        return s;
      })
    );
  };

  // 아이템 추가
  const addItem = (structureId: string) => {
    const newItemId = `item_${Date.now()}`;
    setStructures((prev) =>
      prev.map((s) => {
        if (s.id === structureId) {
          return {
            ...s,
            items: [...s.items, {
              id: newItemId,
              name: '',
              volume: '',
              weight: 0,
              quantity: 1
            }],
          };
        }
        return s;
      })
    );
  };

  // 아이템 삭제
  const removeItem = (structureId: string, itemId: string) => {
    setStructures((prev) =>
      prev.map((s) => {
        if (s.id === structureId) {
          return {
            ...s,
            items: s.items.filter((item) => item.id !== itemId),
          };
        }
        return s;
      })
    );
  };

  // 구조물 무게 변경
  const updateStructureWeight = (structureId: string, newWeight: number) => {
    setStructures((prev) =>
      prev.map((s) => (s.id === structureId ? { ...s, structureWeight: Math.max(0, newWeight) } : s))
    );
  };

  // 구조물 추가
  const addStructure = () => {
    const newId = `structure_${Date.now()}`;
    const structureNumber = structures.length + 1;
    setStructures(prev => [...prev, {
      id: newId,
      year,
      name: `구조물 ${structureNumber}번`,
      capacity: 250,
      maxWeight: 500,
      structureWeight: 150,
      isSlotOnly: false,
      slotOnlyType: null,
      items: [],
    }]);
    setExpandedStructure(newId);
  };

  // 구조물 삭제
  const removeStructure = (structureId: string) => {
    setStructures(prev => prev.filter(s => s.id !== structureId));
  };

  // 구조물 설정 변경
  const updateStructureSettings = (structureId: string, field: 'capacity' | 'maxWeight', value: number) => {
    setStructures(prev => prev.map(s =>
      s.id === structureId ? { ...s, [field]: Math.max(0, value) } : s
    ));
  };

  // 초기화
  const resetToDefault = () => {
    setStructures(getDefaultStructuresForYear(year));
  };

  const total = calculateTotal();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="weight-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />
      <motion.div
        key="weight-modal-content"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 sm:inset-4 z-50 sm:mx-auto max-w-4xl sm:my-auto sm:max-h-[90vh] overflow-hidden"
      >
        <div className="relative sm:rounded-2xl overflow-hidden h-full flex flex-col touch-manipulation" style={{ overscrollBehavior: 'contain' }}>
          <div className="absolute inset-0 bg-[#0d1525]" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />
          <div className="absolute inset-0 border border-white/[0.1] sm:rounded-2xl" />

          <div className="relative flex flex-col h-full pb-[env(safe-area-inset-bottom)]">
            {/* Header */}
            <div className="px-4 py-3 sm:px-6 sm:py-4 bg-cyan-500/10 border-b border-white/[0.06] shrink-0 pt-[env(safe-area-inset-top)]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-[#0a0f1a]/50 text-cyan-400 shrink-0">
                    <Anchor className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-cyan-400 text-sm sm:text-lg truncate">{year}년 해저숙성 구조물</h3>
                      {isSaving && (
                        <span className="flex items-center gap-1 text-xs text-white/40 shrink-0">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span className="hidden sm:inline">저장 중…</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-white/30 hidden sm:block">구조물별 적재 현황 및 무게 계산</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <button
                    onClick={addStructure}
                    disabled={isLoading}
                    className="min-h-[44px] min-w-[44px] sm:min-w-0 px-2 sm:px-3 py-2 sm:py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 active:bg-cyan-500/40 text-xs flex items-center justify-center gap-1 disabled:opacity-50 transition-colors"
                    aria-label="구조물 추가"
                  >
                    <Plus className="w-4 h-4 sm:w-3 sm:h-3" />
                    <span className="hidden sm:inline">구조물 추가</span>
                  </button>
                  <button
                    onClick={resetToDefault}
                    disabled={isLoading}
                    className="min-h-[44px] min-w-[44px] sm:min-w-0 px-2 sm:px-3 py-2 sm:py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.1] text-white/40 hover:text-white/60 active:bg-white/[0.08] text-xs disabled:opacity-50 transition-colors hidden sm:flex items-center justify-center"
                    aria-label="초기화"
                  >
                    초기화
                  </button>
                  <button
                    onClick={onClose}
                    className="min-h-[44px] min-w-[44px] p-2 rounded-xl hover:bg-white/[0.06] active:bg-white/[0.1] text-white/40 transition-colors flex items-center justify-center"
                    aria-label="닫기"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="px-4 sm:px-6 py-4 border-b border-white/[0.06] shrink-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">총 적재 예정</p>
                  <p className="text-xl sm:text-2xl text-white/80 font-medium">{total.totalPlanned}<span className="text-sm text-white/40">병</span></p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">적재 가능</p>
                  <p className="text-xl sm:text-2xl text-emerald-400 font-medium">{total.totalCapacity}<span className="text-sm text-emerald-400/50">병</span></p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">초과</p>
                  <p className={`text-xl sm:text-2xl font-medium ${total.overflow > 0 ? 'text-red-400' : 'text-white/40'}`}>
                    {total.overflow}<span className={`text-sm ${total.overflow > 0 ? 'text-red-400/50' : 'text-white/20'}`}>병</span>
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">총 무게</p>
                  <p className="text-xl sm:text-2xl text-cyan-400 font-medium">{total.totalWeight}<span className="text-sm text-cyan-400/50">kg</span></p>
                </div>
              </div>
            </div>

            {/* Structures List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {isLoading && (
                <div className="p-8 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                    <p className="text-white/40 text-sm">데이터를 불러오는 중...</p>
                  </div>
                </div>
              )}
              {!isLoading && structures.length === 0 && (
                <div className="p-8 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                  <div className="p-3 rounded-xl bg-white/[0.04] inline-block mb-3">
                    <Anchor className="w-6 h-6 text-white/20" />
                  </div>
                  <p className="text-white/40 text-sm mb-2">등록된 구조물이 없습니다</p>
                  <p className="text-white/30 text-xs mb-4">{year}년 해저숙성 구조물을 추가해주세요</p>
                  <button
                    onClick={addStructure}
                    className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 text-sm flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    첫 번째 구조물 추가
                  </button>
                </div>
              )}
              {!isLoading && structures.map((structure) => {
                const calc = calculateStructure(structure);
                const isExpanded = expandedStructure === structure.id;

                return (
                  <div key={structure.id} className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
                    {/* Structure Header */}
                    <button
                      type="button"
                      className="w-full p-3 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] active:bg-white/[0.04] transition-colors text-left"
                      onClick={() => setExpandedStructure(isExpanded ? null : structure.id)}
                      aria-expanded={isExpanded}
                      aria-label={`${structure.name} ${isExpanded ? '접기' : '펼치기'}`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <motion.div animate={{ rotate: isExpanded ? 0 : -90 }} transition={{ duration: 0.2 }} className="shrink-0">
                          <ChevronDown className="w-4 h-4 text-white/40" />
                        </motion.div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <h4 className="text-white/80 font-medium text-sm sm:text-base">{structure.name}</h4>
                            {structure.isSlotOnly && (
                              <span className="px-1.5 sm:px-2 py-0.5 rounded bg-amber-500/20 text-[9px] sm:text-[10px] text-amber-400 shrink-0">슬롯 전용</span>
                            )}
                            <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] shrink-0 ${
                              calc.isOverCapacity || calc.isOverWeight ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {calc.isOverCapacity || calc.isOverWeight ? '초과' : '적재 완료'}
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-xs text-white/30 mt-0.5">
                            <span className="tabular-nums">{structure.capacity}</span>병 | <span className="tabular-nums">{structure.maxWeight}</span>kg
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm text-white/60 tabular-nums">
                            <span className={calc.isOverCapacity ? 'text-red-400' : ''}>{calc.totalBottles}</span>
                            <span className="text-white/30">/{structure.capacity}병</span>
                          </p>
                          <p className="text-xs text-white/40 tabular-nums">
                            <span className={calc.isOverWeight ? 'text-red-400' : ''}>{calc.totalWeightWithStructure}</span>
                            <span className="text-white/30">/{structure.maxWeight}kg</span>
                          </p>
                        </div>
                        {/* Mobile compact stats */}
                        <div className="text-right sm:hidden">
                          <p className="text-xs text-white/60 tabular-nums">
                            <span className={calc.isOverCapacity ? 'text-red-400' : ''}>{calc.totalBottles}</span>
                            <span className="text-white/30">/{structure.capacity}</span>
                          </p>
                        </div>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); removeStructure(structure.id); }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); removeStructure(structure.id); } }}
                          className="min-h-[44px] min-w-[44px] p-2 rounded-lg hover:bg-red-500/20 active:bg-red-500/30 text-white/30 hover:text-red-400 transition-colors flex items-center justify-center"
                          aria-label="구조물 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </div>
                      </div>
                    </button>

                    {/* Expanded Content */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-white/[0.04] p-4 space-y-4">
                            {/* Progress Bars */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-white/40">용량</span>
                                  <span className={calc.isOverCapacity ? 'text-red-400' : 'text-white/50'}>
                                    {calc.capacityPercent.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      calc.isOverCapacity ? 'bg-red-500' : 'bg-cyan-500'
                                    }`}
                                    style={{ width: `${Math.min(calc.capacityPercent, 100)}%` }}
                                  />
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-white/40">무게</span>
                                  <span className={calc.isOverWeight ? 'text-red-400' : 'text-white/50'}>
                                    {calc.weightPercent.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      calc.isOverWeight ? 'bg-red-500' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${Math.min(calc.weightPercent, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Structure Settings */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-white/[0.02]">
                              <div className="flex items-center justify-between gap-2">
                                <label htmlFor={`capacity-${structure.id}`} className="text-xs sm:text-sm text-white/50 shrink-0">용량</label>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    id={`capacity-${structure.id}`}
                                    type="number"
                                    inputMode="numeric"
                                    value={structure.capacity}
                                    onChange={(e) => updateStructureSettings(structure.id, 'capacity', parseInt(e.target.value) || 0)}
                                    className="w-20 px-2 py-2 min-h-[44px] rounded-lg bg-white/[0.04] border border-white/[0.1] text-white/80 text-sm text-right focus:outline-none focus:border-cyan-500/50 tabular-nums"
                                  />
                                  <span className="text-xs sm:text-sm text-white/30">병</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <label htmlFor={`maxweight-${structure.id}`} className="text-xs sm:text-sm text-white/50 shrink-0">최대 무게</label>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    id={`maxweight-${structure.id}`}
                                    type="number"
                                    inputMode="decimal"
                                    value={structure.maxWeight}
                                    onChange={(e) => updateStructureSettings(structure.id, 'maxWeight', parseFloat(e.target.value) || 0)}
                                    className="w-20 px-2 py-2 min-h-[44px] rounded-lg bg-white/[0.04] border border-white/[0.1] text-white/80 text-sm text-right focus:outline-none focus:border-cyan-500/50 tabular-nums"
                                  />
                                  <span className="text-xs sm:text-sm text-white/30">kg</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <label htmlFor={`structweight-${structure.id}`} className="text-xs sm:text-sm text-white/50 shrink-0">구조물 무게</label>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    id={`structweight-${structure.id}`}
                                    type="number"
                                    inputMode="decimal"
                                    value={structure.structureWeight}
                                    onChange={(e) => updateStructureWeight(structure.id, parseFloat(e.target.value) || 0)}
                                    className="w-20 px-2 py-2 min-h-[44px] rounded-lg bg-white/[0.04] border border-white/[0.1] text-white/80 text-sm text-right focus:outline-none focus:border-cyan-500/50 tabular-nums"
                                  />
                                  <span className="text-xs sm:text-sm text-white/30">kg</span>
                                </div>
                              </div>
                            </div>

                            {/* Items - Mobile Cards / Desktop Table */}
                            {/* Mobile Card View */}
                            <div className="sm:hidden space-y-3">
                              {structure.items.map((item, itemIndex) => {
                                const itemTotalWeight = (item.quantity * item.weight).toFixed(1);
                                const itemKey = item.id || `item_${structure.id}_${itemIndex}`;

                                return (
                                  <div key={itemKey} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                      <input
                                        type="text"
                                        value={item.name}
                                        onChange={(e) => updateItemField(structure.id, item.id, 'name', e.target.value)}
                                        placeholder="품목명"
                                        className="flex-1 px-3 py-2 min-h-[44px] rounded-lg bg-white/[0.04] border border-white/[0.1] text-white/80 text-sm focus:outline-none focus:border-cyan-500/50 placeholder:text-white/30"
                                      />
                                      <button
                                        onClick={() => removeItem(structure.id, item.id)}
                                        className="min-h-[44px] min-w-[44px] p-2 rounded-lg hover:bg-red-500/20 active:bg-red-500/30 text-white/30 hover:text-red-400 transition-colors flex items-center justify-center"
                                        aria-label="품목 삭제"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                      <div>
                                        <label className="block text-[10px] text-white/40 mb-1">용량</label>
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="number"
                                            inputMode="numeric"
                                            value={parseInt(item.volume) || ''}
                                            onChange={(e) => updateItemField(structure.id, item.id, 'volume', e.target.value ? `${e.target.value}ml` : '')}
                                            placeholder="750"
                                            className="w-full px-2 py-2 min-h-[44px] rounded-lg bg-white/[0.04] border border-white/[0.1] text-white/80 text-sm text-center focus:outline-none focus:border-cyan-500/50 placeholder:text-white/30"
                                          />
                                          <span className="text-xs text-white/30 shrink-0">ml</span>
                                        </div>
                                      </div>
                                      <div>
                                        <label className="block text-[10px] text-white/40 mb-1">개당 무게</label>
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="number"
                                            inputMode="decimal"
                                            step="0.01"
                                            value={item.weight}
                                            onChange={(e) => updateItemField(structure.id, item.id, 'weight', parseFloat(e.target.value) || 0)}
                                            className="w-full px-2 py-2 min-h-[44px] rounded-lg bg-white/[0.04] border border-white/[0.1] text-white/80 text-sm text-center focus:outline-none focus:border-cyan-500/50"
                                          />
                                          <span className="text-xs text-white/30 shrink-0">kg</span>
                                        </div>
                                      </div>
                                      <div>
                                        <label className="block text-[10px] text-white/40 mb-1">수량</label>
                                        <input
                                          type="number"
                                          inputMode="numeric"
                                          value={item.quantity}
                                          onChange={(e) => updateItemQuantity(structure.id, item.id, parseInt(e.target.value) || 0)}
                                          className="w-full px-2 py-2 min-h-[44px] rounded-lg bg-white/[0.04] border border-white/[0.1] text-white/80 text-sm text-center focus:outline-none focus:border-cyan-500/50"
                                        />
                                      </div>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-white/[0.04] text-right">
                                      <span className="text-xs text-white/40">총 무게: </span>
                                      <span className="text-sm text-white/70 font-medium">{itemTotalWeight}kg</span>
                                    </div>
                                  </div>
                                );
                              })}
                              {/* Mobile Summary */}
                              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-white/50">적재물 소계</span>
                                  <span className="text-white/70 font-medium">{calc.totalBottles}병 / {calc.totalWeight}kg</span>
                                </div>
                                <div className="flex justify-between text-sm pt-2 border-t border-white/[0.04]">
                                  <span className="text-cyan-400">총 무게 (구조물 포함)</span>
                                  <span className="text-cyan-400 font-medium">{calc.totalWeightWithStructure}kg / {structure.maxWeight}kg</span>
                                </div>
                              </div>
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden sm:block rounded-lg border border-white/[0.06] overflow-hidden">
                              <table className="w-full">
                                <thead>
                                  <tr className="bg-white/[0.02]">
                                    <th className="px-3 py-2 text-left text-[10px] text-white/40 uppercase tracking-wider">품목명</th>
                                    <th className="px-3 py-2 text-center text-[10px] text-white/40 uppercase tracking-wider">용량</th>
                                    <th className="px-3 py-2 text-center text-[10px] text-white/40 uppercase tracking-wider">개당 무게</th>
                                    <th className="px-3 py-2 text-center text-[10px] text-white/40 uppercase tracking-wider">수량</th>
                                    <th className="px-3 py-2 text-right text-[10px] text-white/40 uppercase tracking-wider">총 무게</th>
                                    <th className="px-3 py-2 w-10"></th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                  {structure.items.map((item, itemIndex) => {
                                    const itemTotalWeight = (item.quantity * item.weight).toFixed(1);
                                    const itemKey = item.id || `item_${structure.id}_${itemIndex}`;

                                    return (
                                      <tr key={itemKey}>
                                        <td className="px-2 py-2">
                                          <input
                                            type="text"
                                            value={item.name}
                                            onChange={(e) => updateItemField(structure.id, item.id, 'name', e.target.value)}
                                            placeholder="품목명"
                                            className="w-full px-2 py-1.5 rounded bg-white/[0.04] border border-white/[0.1] text-white/80 text-sm focus:outline-none focus:border-cyan-500/50 placeholder:text-white/30"
                                          />
                                        </td>
                                        <td className="px-2 py-2">
                                          <div className="flex items-center justify-center gap-1">
                                            <input
                                              type="number"
                                              value={parseInt(item.volume) || ''}
                                              onChange={(e) => updateItemField(structure.id, item.id, 'volume', e.target.value ? `${e.target.value}ml` : '')}
                                              placeholder="750"
                                              className="w-16 px-2 py-1.5 rounded bg-white/[0.04] border border-white/[0.1] text-white/80 text-sm text-center focus:outline-none focus:border-cyan-500/50 placeholder:text-white/30"
                                            />
                                            <span className="text-xs text-white/30">ml</span>
                                          </div>
                                        </td>
                                        <td className="px-2 py-2">
                                          <div className="flex items-center justify-center gap-1">
                                            <input
                                              type="number"
                                              step="0.01"
                                              value={item.weight}
                                              onChange={(e) => updateItemField(structure.id, item.id, 'weight', parseFloat(e.target.value) || 0)}
                                              className="w-16 px-2 py-1.5 rounded bg-white/[0.04] border border-white/[0.1] text-white/80 text-sm text-center focus:outline-none focus:border-cyan-500/50"
                                            />
                                            <span className="text-xs text-white/30">kg</span>
                                          </div>
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                          <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateItemQuantity(structure.id, item.id, parseInt(e.target.value) || 0)}
                                            className="w-16 px-2 py-1.5 rounded bg-white/[0.04] border border-white/[0.1] text-white/80 text-sm text-center focus:outline-none focus:border-cyan-500/50"
                                          />
                                        </td>
                                        <td className="px-3 py-2 text-sm text-white/50 text-right tabular-nums">{itemTotalWeight}kg</td>
                                        <td className="px-2 py-2">
                                          <button
                                            onClick={() => removeItem(structure.id, item.id)}
                                            className="p-1.5 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all"
                                            aria-label="품목 삭제"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                                <tfoot>
                                  <tr className="bg-white/[0.02]">
                                    <td colSpan={3} className="px-3 py-2 text-sm text-white/50 font-medium">적재물 소계</td>
                                    <td className="px-3 py-2 text-sm text-white/70 text-center font-medium tabular-nums">{calc.totalBottles}병</td>
                                    <td className="px-3 py-2 text-sm text-white/70 text-right font-medium tabular-nums">{calc.totalWeight}kg</td>
                                    <td></td>
                                  </tr>
                                  <tr className="bg-cyan-500/10">
                                    <td colSpan={3} className="px-3 py-2 text-sm text-cyan-400 font-medium">총 무게 (구조물 + 적재물)</td>
                                    <td></td>
                                    <td className="px-3 py-2 text-sm text-cyan-400 text-right font-medium tabular-nums">
                                      {calc.totalWeightWithStructure}kg / {structure.maxWeight}kg
                                    </td>
                                    <td></td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>

                            {/* Add Item Button */}
                            <button
                              onClick={() => addItem(structure.id)}
                              className="w-full min-h-[48px] py-3 rounded-xl border-2 border-dashed border-white/[0.08] hover:border-cyan-500/30 active:border-cyan-500/50 bg-white/[0.01] hover:bg-cyan-500/5 active:bg-cyan-500/10 text-white/40 hover:text-cyan-400 transition-colors flex items-center justify-center gap-2"
                              aria-label="품목 추가"
                            >
                              <Plus className="w-4 h-4" />
                              <span className="text-sm">품목 추가</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {/* Warning Note */}
              {total.overflow > 0 && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm text-red-400 font-medium mb-1">주의: {total.overflow}병 초과</h4>
                      <p className="text-xs text-white/50">
                        현재 총 {total.totalPlanned}병 중 {total.totalCapacity}병만 적재 가능합니다.
                      </p>
                      <div className="mt-2 text-xs text-white/40 space-y-1">
                        <p>해결 방안:</p>
                        <p>1. 소형 구조물 추가 제작 ({total.overflow}병용)</p>
                        <p>2. {total.overflow}병은 다음 배치로 연기</p>
                        <p>3. 기타 제품 중 일부를 제외하고 샴페인 추가 적재</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 sm:px-5 sm:py-4 border-t border-white/[0.06] shrink-0">
              <button
                onClick={onClose}
                className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 active:bg-cyan-500/40 transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                확인
              </button>
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
  onEditQuantity?: () => void;
  mounted: boolean;
}

function ProductCard({ product, onManage, onEditQuantity, mounted }: ProductCardProps) {
  const { getProductSummary, inventoryBatches, updateBatchAgingData } = useInventoryStore();
  const [editingAging, setEditingAging] = useState(false);
  const batch = inventoryBatches.find(b => b.productId === product.id);
  /* 날짜는 배치에서 파생하고, 사용자가 고친 값만 덮는다.
     이펙트로 배치→로컬을 되맞추면 저장 직후 서버 값이 돌아올 때마다 연쇄 렌더가 난다. */
  const [immersionEdit, setImmersionDate] = useState<string | null>(null);
  const [retrievalEdit, setRetrievalDate] = useState<string | null>(null);
  const immersionDate = immersionEdit ?? (batch?.immersionDate || '');
  const retrievalDate = retrievalEdit ?? (batch?.retrievalDate || '');
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
            <div className="flex items-center gap-1.5">
              <p className="text-lg text-white/70">{product.totalQuantity}</p>
              {!product.isNumbered && onEditQuantity && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditQuantity();
                  }}
                  className="p-1 rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
                  title="총수량 수정"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="relative p-4 sm:p-5">
        {/* Stats Grid - 2x2 on mobile, 4 cols on desktop */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-3 mb-3 sm:mb-4">
          <div className="text-center p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/[0.02] flex flex-col items-center justify-center">
            <p className="text-[10px] sm:text-xs text-white/30 mb-0.5 sm:mb-1">보유</p>
            <p className="text-base sm:text-xl text-emerald-400 font-medium">{summary.available}</p>
          </div>
          <div className="text-center p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/[0.02] flex flex-col items-center justify-center">
            <p className="text-[10px] sm:text-xs text-white/30 mb-0.5 sm:mb-1">예약</p>
            <p className="text-base sm:text-xl text-amber-400 font-medium">{summary.reserved}</p>
          </div>
          <div className="text-center p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/[0.02] flex flex-col items-center justify-center">
            <p className="text-[10px] sm:text-xs text-white/30 mb-0.5 sm:mb-1">판매</p>
            <p className="text-base sm:text-xl text-blue-400 font-medium">{summary.sold}</p>
          </div>
          <div className="text-center p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/[0.02] flex flex-col items-center justify-center">
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

        {/* 숙성 기간 (배치 제품만) */}
        {!product.isNumbered && (
          <div className="mb-4">
            {!editingAging ? (
              <button
                onClick={(e) => { e.stopPropagation(); setEditingAging(true); }}
                className="w-full p-2.5 rounded-xl bg-cyan-500/5 border border-cyan-500/10 hover:bg-cyan-500/10 transition-all text-left"
              >
                {batch?.immersionDate ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Anchor className="w-3.5 h-3.5 text-cyan-400/60" />
                      <span className="text-xs text-cyan-400/70">
                        {batch.immersionDate} ~ {batch.retrievalDate || '숙성 중'}
                      </span>
                    </div>
                    {batch.retrievalDate ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">완료</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">숙성 중</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-white/30">
                    <Anchor className="w-3.5 h-3.5" />
                    <span className="text-xs">숙성 기간 설정</span>
                  </div>
                )}
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10 space-y-2" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2 mb-1">
                  <Anchor className="w-3.5 h-3.5 text-cyan-400/60" />
                  <span className="text-xs text-cyan-400/70">숙성 기간</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-white/30 block mb-1">입수일</label>
                    <input
                      type="date"
                      value={immersionDate}
                      onChange={(e) => setImmersionDate(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.1] text-xs text-white/80 focus:outline-none focus:border-cyan-500/30 [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/30 block mb-1">인양일</label>
                    <input
                      type="date"
                      value={retrievalDate}
                      onChange={(e) => setRetrievalDate(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.1] text-xs text-white/80 focus:outline-none focus:border-cyan-500/30 [color-scheme:dark]"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setEditingAging(false)}
                    className="flex-1 px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.1] text-xs text-white/40 hover:bg-white/[0.08]"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => {
                      updateBatchAgingData(product.id, {
                        immersionDate: immersionDate || null,
                        retrievalDate: retrievalDate || null,
                      });
                      setEditingAging(false);
                      toast.success('숙성 기간이 저장되었습니다');
                    }}
                    className="flex-1 px-2 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-xs text-cyan-400 hover:bg-cyan-500/30"
                  >
                    저장
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onManage}
            className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/60 hover:bg-white/[0.08] hover:text-white/80 transition-all flex items-center justify-center gap-2"
          >
            <Package className="w-4 h-4" />
            재고 관리
          </button>
        </div>
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
  defaultPrice,
}: {
  isExpanded: boolean;
  onToggle: () => void;
  defaultPrice?: number;
}) {
  const { numberedBottles, updateBottleStatus, getProductSummary, generateNfcCode, markNfcWritten, resetNfcRecord, ownerRegisteredCodes } = useInventoryStore();
  const [selectedBottle, setSelectedBottle] = useState<NumberedBottle | null>(null);
  const [nfcModalOpen, setNfcModalOpen] = useState(false);
  const [nfcCodeState, setNfcCodeState] = useState('');
  const summary = getProductSummary('first_edition');

  // 모달에 띄운 코드의 병 — "몇 번 병"과 쓰기 완료 여부를 모달에서 그대로 보여준다
  const nfcTargetBottle = numberedBottles.find((b) => b.nfcCode === nfcCodeState);

  const handleBottleClick = (bottleNumber: number) => {
    const bottle = numberedBottles.find((b) => b.bottleNumber === bottleNumber);
    if (!bottle) return;
    // 이미 코드가 발급된 병은 NFC 모달로 재진입한다.
    // 코드는 판매/증정 저장 시점에 DB에 박히는데, 그때 태그 쓰기가 실패하거나
    // 모달을 그냥 닫으면 "DB엔 코드, 실물 태그엔 아무것도" 상태로 남는다.
    if (bottle.nfcCode) {
      setNfcCodeState(bottle.nfcCode);
      setNfcModalOpen(true);
      return;
    }
    setSelectedBottle(bottle);
  };

  const handleSaveStatus = async (status: InventoryStatus, details?: { reservedFor?: string; soldTo?: string; giftedTo?: string; price?: number; notes?: string; soldDate?: string }) => {
    if (!selectedBottle) return;
    await updateBottleStatus(selectedBottle.id, status, details);

    // 판매/증정 시 NFC 코드 생성
    if (status === 'sold' || status === 'gifted') {
      try {
        const code = await generateNfcCode(selectedBottle.id, true);
        if (code) {
          setNfcCodeState(code);
          setNfcModalOpen(true);
        } else {
          // 조용히 넘기면 태그 없는 병이 판매 처리된 채로 남는다
          alert('NFC 코드 발급에 실패했습니다. 병을 다시 눌러 재시도해 주세요.');
        }
      } catch (e) {
        console.error('[inventory] NFC 코드 생성 실패:', e);
        alert('NFC 코드 발급 중 오류가 발생했습니다. 병을 다시 눌러 재시도해 주세요.');
      }
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
    <div className="relative">
      <div className="p-4">
        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10">
            <span className="text-xs text-white/40">보유</span>
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
              className={`relative aspect-square rounded-lg border text-xs font-medium transition-all cursor-pointer ${getStatusColor(bottle.status)}`}
              title={
                bottle.nfcCode
                  ? `#${bottle.bottleNumber} · NFC ${bottle.nfcCode} — 태그 쓰기 ${bottle.nfcWrittenAt ? '완료' : '기록 없음'} · 소유 등록 ${ownerRegisteredCodes.includes(bottle.nfcCode) ? '됨' : '전'}, 눌러서 열기`
                  : `#${bottle.bottleNumber} - ${INVENTORY_STATUS_LABELS[bottle.status]}${bottle.soldTo ? ` (${bottle.soldTo})` : ''}`
              }
            >
              {bottle.bottleNumber}
              {/* 초록 = 실물 태그까지 기록 완료, 하늘 = 코드만 발급 */}
              {bottle.nfcCode && (
                <span
                  className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${
                    bottle.nfcWrittenAt ? 'bg-emerald-400' : 'bg-cyan-400'
                  }`}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {selectedBottle && (
        <BottleStatusModal
          /* 병이 바뀌면 새로 마운트해 폼을 다시 만든다 */
          key={selectedBottle.id}
          isOpen={!!selectedBottle}
          onClose={() => setSelectedBottle(null)}
          bottleNumber={selectedBottle.bottleNumber}
          currentStatus={selectedBottle.status}
          currentBottle={selectedBottle}
          onSave={handleSaveStatus}
          defaultPrice={defaultPrice}
        />
      )}

      {/* NFC Write Modal — 넘버링 병은 언제나 한 병짜리다 */}
      <NfcWriteModal
        isOpen={nfcModalOpen}
        onClose={() => setNfcModalOpen(false)}
        initialCode={nfcCodeState}
        bottles={nfcTargetBottle ? [{
          key: nfcTargetBottle.id,
          nfcCode: nfcCodeState,
          label: `2025 퍼스트 에디션 #${nfcTargetBottle.bottleNumber}`,
          meta: [
            INVENTORY_STATUS_LABELS[nfcTargetBottle.status],
            nfcTargetBottle.soldTo || nfcTargetBottle.giftedTo,
          ].filter(Boolean).join(' · '),
          statusLabel: nfcTargetBottle.status === 'gifted' ? '증정' : '판매',
          written: !!nfcTargetBottle.nfcWrittenAt,
          ownerRegistered: ownerRegisteredCodes.includes(nfcCodeState),
          serial: nfcTargetBottle.bottleNumber,
          sortKey: nfcTargetBottle.nfcRegisteredAt || '',
        }] : []}
        onWritten={(code) => markNfcWritten(code)}
        onReset={async (code) => {
          const ok = await resetNfcRecord(code);
          setNfcModalOpen(false);
          if (ok) toast.success('NFC 기록을 초기화했습니다');
          else toast.error('초기화에 실패했습니다. 다시 시도해 주세요');
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 메인 페이지
// ═══════════════════════════════════════════════════════════════════════════

export default function InventoryPage() {
  const { initializeInventory, refreshFromSupabase, getTotalInventoryValue, getRecentTransactions, getFilteredTransactions, isLoading, sellFromBatch, reserveFromBatch, confirmReservation, cancelReservation, reportDamage, giftFromBatch, addProduct, updateProduct, getAllProducts, updateTransaction, deleteTransaction, issueMissingNfcCodes, markNfcWritten, resetNfcRecord, updateBatchAgingData, inventoryBatches, bottleUnits, numberedBottles, transactions, ownerRegisteredCodes } = useInventoryStore();
  const [isFirstEditionExpanded, setIsFirstEditionExpanded] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [mounted, setMounted] = useState(false);
  const [addProductYear, setAddProductYear] = useState<number | null>(null);
  const [weightModalYear, setWeightModalYear] = useState<number | null>(null);

  // NFC 모달 상태 — 거래에서 열면 그 거래의 병 전부를 넘겨가며 쓴다
  const [nfcModalOpen, setNfcModalOpen] = useState(false);
  const [nfcCode, setNfcCode] = useState('');
  const [nfcModalTxId, setNfcModalTxId] = useState<string | null>(null);

  // 가격 설정 상태 (pricing 페이지의 판매가 자동 입력용)
  const [pricingSettings, setPricingSettings] = useState<PricingTierSetting[]>([]);

  // 상품 총수량 수정 모달 상태
  const [editingProduct, setEditingProduct] = useState<{ id: string; name: string; nameKo: string; year: number; size: string; totalQuantity: number } | null>(null);

  // 트랜잭션 수정 모달 상태
  const [editingTransaction, setEditingTransaction] = useState<{
    id: string;
    productId: string;
    type: string;
    quantity: number;
    bottleNumber?: number;
    customerName?: string;
    price?: number;
    notes?: string;
  } | null>(null);

  // Year section expanded state - all collapsed by default
  const [expandedYears, setExpandedYears] = useState<number[]>([]);

  // Custom years state (years added by user) - 서버/클라이언트 hydration 일치를 위해 빈 배열로 초기화
  const [customYears, setCustomYears] = useState<number[]>([]);
  const [customYearsLoaded, setCustomYearsLoaded] = useState(false);

  // localStorage에서 customYears 로드 (클라이언트에서만)
  useEffect(() => {
    const saved = localStorage.getItem('inventory_custom_years');
    if (saved) {
      setCustomYears(JSON.parse(saved));
    }
    setCustomYearsLoaded(true);
  }, []);

  // Save customYears to localStorage when changed (로드 완료 후에만 저장)
  useEffect(() => {
    if (customYearsLoaded) {
      localStorage.setItem('inventory_custom_years', JSON.stringify(customYears));
    }
  }, [customYears, customYearsLoaded]);

  // Transaction filter state
  const [txFilterYear, setTxFilterYear] = useState<number | undefined>(undefined);
  const [txFilterMonth, setTxFilterMonth] = useState<number | undefined>(undefined);
  const [txCurrentPage, setTxCurrentPage] = useState(1);
  // 표가 하나로 합쳐졌으니 8줄. 행 자체도 줄여 카드 높이를 낮췄다
  const TX_PER_PAGE = 8;
  // 거래에 안 붙은 NFC 병 목록 펼침 상태
  const [orphansOpen, setOrphansOpen] = useState(false);

  // Toggle year section expansion
  const toggleYearExpanded = (year: number) => {
    setExpandedYears(prev =>
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    );
  };

  // Add new year
  const handleAddYear = () => {
    const currentYear = new Date().getFullYear();
    // Find next available year (starting from current year + 1)
    const existingYears = [...new Set([...availableYears, 2026, ...customYears])];
    let nextYear = currentYear;
    while (existingYears.includes(nextYear)) {
      nextYear++;
    }
    setCustomYears(prev => [...prev, nextYear].sort((a, b) => a - b));
    // Auto-expand the new year
    setExpandedYears(prev => [...prev, nextYear]);
    toast.success(`${nextYear}년 컬렉션이 추가되었습니다`);
  };

  // Remove custom year
  const handleRemoveYear = (year: number) => {
    setCustomYears(prev => prev.filter(y => y !== year));
    setExpandedYears(prev => prev.filter(y => y !== year));
    toast.info(`${year}년 컬렉션이 제거되었습니다`);
  };

  useEffect(() => {
    setMounted(true);
    initializeInventory();
    // 가격 설정 로드
    const loadPricing = async () => {
      const settings = await fetchPricingSettings(2026);
      if (settings) {
        setPricingSettings(settings);
      }
    };
    loadPricing();
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

  // 상품 ID로 B2B 판매가 조회 (pricing 페이지 DB 설정에서 가져옴)
  const getDefaultPriceForProduct = useCallback((productId: string): number | undefined => {
    const tierId = PRODUCT_TO_PRICING_TIER[productId];
    if (!tierId) return undefined;
    const pricingSetting = pricingSettings.find(p => p.tierId === tierId);
    return pricingSetting?.b2bPrice;
  }, [pricingSettings]);

  // Use filtered transactions if filter is set, otherwise show recent
  // Get more transactions for pagination (up to 100)
  const allTransactions = mounted
    ? (txFilterYear || txFilterMonth)
      ? getFilteredTransactions(txFilterYear, txFilterMonth, 100)
      : getRecentTransactions(100)
    : [];

  // Calculate pagination
  const totalPages = Math.ceil(allTransactions.length / TX_PER_PAGE);
  const paginatedTransactions = allTransactions.slice(
    (txCurrentPage - 1) * TX_PER_PAGE,
    txCurrentPage * TX_PER_PAGE
  );

  // Reset page when filter changes
  useEffect(() => {
    setTxCurrentPage(1);
  }, [txFilterYear, txFilterMonth]);

  // Get all products and group by year
  const allProducts = mounted ? getAllProducts() : [];

  // Map 조회 최적화 - O(n) find() 대신 O(1) Map.get() 사용
  const productMap = useMemo(() => {
    const map = new Map<string, { name: string; nameKo: string }>();
    PRODUCTS.forEach(p => map.set(p.id, { name: p.name, nameKo: p.nameKo }));
    allProducts.forEach(p => map.set(p.id, { name: p.name, nameKo: p.nameKo }));
    return map;
  }, [allProducts]);

  /**
   * NFC 발급 병을 거래 행에 붙이기 위한 색인.
   *
   * 거래 내역과 NFC 발급 병은 원래 별도 표였는데, 현장에서는 "이 거래로 나간 병에
   * 태그를 썼나"를 한 줄에서 보는 편이 낫다. 그래서 한 표로 합치고 여기서 잇는다.
   * - 배치 병: 발급 때 박아둔 transaction_id로 정확히 연결
   * - 넘버링 병: 거래에 bottle_number가 남으므로 병 번호로 연결.
   *   제품 id는 키에 넣지 않는다 — 넘버링 병 거래는 product_id를 'first_edition'으로
   *   고정 기록하는데 병 행의 product_id는 편집으로 달라질 수 있어 서로 안 맞는다.
   */
  const nfcIndex = useMemo(() => {
    const productName = (id: string) => productMap.get(id)?.nameKo || productMap.get(id)?.name || id;
    const ownerCodeSet = new Set(ownerRegisteredCodes);

    // 한 거래가 여러 병을 내보낼 수 있다 — 판매 3병이면 병도 코드도 3개다
    const byTransactionId = new Map<string, NfcBottleRow[]>();
    const byNumberedKey = new Map<string, NfcBottleRow>();
    const byCode = new Map<string, NfcBottleRow>();

    bottleUnits.forEach((u) => {
      // 코드가 없는 병(예약·손상, 또는 아직 발급 전)은 NFC 색인에 넣지 않는다.
      // 거래 행에서는 "코드 발급" 버튼으로 나타난다.
      if (!u.nfcCode) return;

      const row: NfcBottleRow = {
        key: u.id,
        nfcCode: u.nfcCode,
        // 한정번호가 없는 옛 기록은 번호 없이 제품명만 보여준다
        label: u.serialNumber ? `${productName(u.productId)} #${u.serialNumber}` : productName(u.productId),
        meta: [u.customerName, u.soldDate].filter(Boolean).join(' · '),
        statusLabel: UNIT_STATUS_LABELS[u.status] ?? u.status,
        written: !!u.nfcWrittenAt,
        ownerRegistered: ownerCodeSet.has(u.nfcCode),
        serial: u.serialNumber,
        sortKey: u.createdAt || u.nfcRegisteredAt || '',
      };
      byCode.set(u.nfcCode, row);
      if (u.transactionId) {
        const list = byTransactionId.get(u.transactionId) ?? [];
        list.push(row);
        byTransactionId.set(u.transactionId, list);
      }
    });

    // 같은 거래 안에서는 병 번호 순으로 — 태그를 순서대로 쓰게 된다
    byTransactionId.forEach((list) =>
      list.sort((a, b) => (a.serial ?? 0) - (b.serial ?? 0) || a.sortKey.localeCompare(b.sortKey))
    );

    numberedBottles.forEach((b) => {
      if (!b.nfcCode) return;
      const row: NfcBottleRow = {
        key: b.id,
        nfcCode: b.nfcCode,
        label: `${productName(b.productId)} #${b.bottleNumber}`,
        meta: [b.soldTo || b.giftedTo, b.soldDate?.slice(0, 10)].filter(Boolean).join(' · '),
        statusLabel: UNIT_STATUS_LABELS[b.status] ?? b.status,
        written: !!b.nfcWrittenAt,
        ownerRegistered: ownerCodeSet.has(b.nfcCode),
        serial: b.bottleNumber,
        sortKey: b.nfcRegisteredAt || b.soldDate || '',
      };
      byNumberedKey.set(String(b.bottleNumber), row);
      byCode.set(b.nfcCode, row);
    });

    return { byTransactionId, byNumberedKey, byCode };
  }, [numberedBottles, bottleUnits, productMap, ownerRegisteredCodes]);

  /** 병마다 번호를 들고 있는 제품 (2025 퍼스트 에디션) — 배치 제품과 연결 경로가 다르다 */
  const numberedProductIds = useMemo(
    () => new Set(allProducts.filter((p) => p.isNumbered).map((p) => p.id)),
    [allProducts]
  );

  /** 이 거래로 나간 병들. 예약·손상 등 코드 없는 거래는 빈 배열. */
  const nfcBottlesForTransaction = useCallback((tx: InventoryTransaction): NfcBottleRow[] => {
    if (tx.type !== 'sale' && tx.type !== 'gift') return [];
    // 넘버링 병은 병 행이 코드를 들고 있어 병 번호로 찾는다.
    // 배치 병은 이제 거래에도 한정번호가 남으므로 번호가 아니라 거래 id로 이어야 한다.
    if (numberedProductIds.has(tx.productId)) {
      const row = tx.bottleNumber ? nfcIndex.byNumberedKey.get(String(tx.bottleNumber)) : undefined;
      return row ? [row] : [];
    }
    return nfcIndex.byTransactionId.get(tx.id) ?? [];
  }, [nfcIndex, numberedProductIds]);

  /** 이 거래에서 아직 코드를 못 받은 병 수. 넘버링 병은 그리드에서 발급하므로 0. */
  const nfcMissingForTransaction = useCallback((tx: InventoryTransaction): number => {
    if (tx.type !== 'sale' && tx.type !== 'gift') return 0;
    if (numberedProductIds.has(tx.productId)) return 0;
    return Math.max(0, tx.quantity - (nfcIndex.byTransactionId.get(tx.id)?.length ?? 0));
  }, [nfcIndex, numberedProductIds]);

  /**
   * 붙을 거래가 없는 NFC 병.
   *
   * transaction_id 컬럼이 생기기 전에 발급됐거나 거래 행이 지워진 병들이다.
   * 표에서 빠지면 NFC 모달로 다시 들어갈 길이 사라지므로 표 아래에 따로 남긴다.
   */
  const nfcOrphans = useMemo(() => {
    const txIds = new Set(transactions.map((t) => t.id));
    const numberedKeys = new Set(
      transactions
        .filter((t) => t.bottleNumber && (t.type === 'sale' || t.type === 'gift') && numberedProductIds.has(t.productId))
        .map((t) => String(t.bottleNumber))
    );

    const orphanUnits = bottleUnits
      .filter((u) => u.nfcCode && (!u.transactionId || !txIds.has(u.transactionId)))
      .map((u) => nfcIndex.byCode.get(u.nfcCode!))
      .filter((r): r is NfcBottleRow => !!r);

    const orphanNumbered = numberedBottles
      .filter((b) => b.nfcCode && !numberedKeys.has(String(b.bottleNumber)))
      .map((b) => nfcIndex.byCode.get(b.nfcCode!))
      .filter((r): r is NfcBottleRow => !!r);

    return [...orphanUnits, ...orphanNumbered].sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  }, [transactions, bottleUnits, numberedBottles, nfcIndex, numberedProductIds]);

  /* 손이 필요한 병만 센다 — 태그 쓰기 기록도 없고 소유 등록도 없는 병.
     소유 등록이 들어왔다면 태그는 이미 동작하는 것이므로(고객이 그걸로 들어왔다)
     쓰기 기록이 비어 있어도 할 일이 아니다. 앱의 웹 NFC 쓰기가 안드로이드 크롬
     전용이라 아이폰·외부 앱으로 구운 태그가 여기 잡히던 문제를 함께 없앤다. */
  const nfcPendingCount = [...nfcIndex.byCode.values()].filter(
    (r) => !r.written && !r.ownerRegistered,
  ).length;

  /**
   * 모달이 다루는 병들. 거래에서 열면 그 거래의 병 전부(3병이면 3개를 넘겨가며 쓴다),
   * 고아 목록에서 열면 그 한 병만.
   */
  const nfcModalTx = nfcModalTxId ? transactions.find((t) => t.id === nfcModalTxId) : undefined;
  const nfcModalBottles = nfcModalTx
    ? nfcBottlesForTransaction(nfcModalTx)
    : [nfcIndex.byCode.get(nfcCode)].filter((r): r is NfcBottleRow => !!r);
  const nfcModalMissing = nfcModalTx ? nfcMissingForTransaction(nfcModalTx) : 0;

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

  // Add default years if they don't have products yet (2026 + customYears)
  const displayYears = [...new Set([...availableYears, 2026, ...customYears])].sort((a, b) => a - b);

  /**
   * 재고 조정 — 병 하나를 처리한다.
   *
   * 두 번째 인자는 수량이 아니라 그 병의 한정번호다. 모든 병에 NFC가 붙으므로
   * 수량 단위로 묶어 처리할 수 없다.
   */
  const handleBatchAction = async (
    action: 'sell' | 'reserve' | 'gift' | 'damage' | 'confirm' | 'cancel',
    serialNumber: number,
    details?: { customerName?: string; price?: number; notes?: string; soldDate?: string }
  ) => {
    if (!selectedProduct) return;

    // 발급될 NFC 병을 방금 만든 거래에 묶기 위해 거래 id를 받아둔다
    let transactionId: string | null = null;

    switch (action) {
      case 'sell':
        transactionId = await sellFromBatch(selectedProduct.id, serialNumber, details?.customerName, details?.price, details?.soldDate);
        break;
      case 'reserve':
        transactionId = await reserveFromBatch(selectedProduct.id, serialNumber, details?.customerName || '');
        break;
      case 'gift':
        transactionId = await giftFromBatch(selectedProduct.id, serialNumber, details?.customerName || '', details?.notes, details?.soldDate);
        break;
      case 'damage':
        transactionId = await reportDamage(selectedProduct.id, serialNumber, details?.notes);
        break;
      case 'confirm':
        transactionId = await confirmReservation(selectedProduct.id, serialNumber, details?.customerName, details?.price, details?.soldDate);
        break;
      case 'cancel':
        transactionId = await cancelReservation(selectedProduct.id, serialNumber);
        break;
    }

    if (!transactionId) {
      toast.error(`#${serialNumber} 처리에 실패했습니다. 번호와 재고를 확인해 주세요`);
      return;
    }

    const actionLabels: Record<string, string> = {
      sell: '판매 처리했습니다',
      reserve: '예약 처리했습니다',
      gift: '증정 처리했습니다',
      damage: '손상 처리했습니다',
      confirm: '예약을 확정했습니다',
      cancel: '예약을 취소했습니다',
    };
    toast.success(`#${serialNumber} ${actionLabels[action]}`);

    // 판매·증정·예약확정은 병이 나가므로 NFC 코드를 붙이고 모달을 연다.
    // 예약·손상·예약취소는 아직 병이 고객에게 가지 않아 코드가 필요 없다.
    if (action !== 'sell' && action !== 'gift' && action !== 'confirm') return;

    try {
      await issueMissingNfcCodes(transactionId, details?.soldDate);
      const units = useInventoryStore.getState().bottleUnits
        .filter((u) => u.transactionId === transactionId && u.nfcCode)
        .sort((a, b) => (a.serialNumber ?? 0) - (b.serialNumber ?? 0));

      if (units.length > 0) {
        setNfcCode(units[0].nfcCode!);
        setNfcModalTxId(transactionId);
        setNfcModalOpen(true);
      } else {
        // 거래는 이미 완료됐다. 조용히 넘기면 태그 없는 병이 그대로 나간다
        toast.error('NFC 코드 발급에 실패했습니다. 거래 내역에서 다시 시도해 주세요');
      }
    } catch (e) {
      logger.error('[inventory] NFC 코드 생성 실패:', e);
      toast.error('NFC 코드 발급 중 오류가 발생했습니다. 거래는 처리됐습니다');
    }
  };

  /** 거래 행에서 미발급분 코드를 채우고 모달을 연다 */
  const handleIssueMissingNfc = async (transactionId: string) => {
    const issued = await issueMissingNfcCodes(transactionId);
    const units = useInventoryStore.getState().bottleUnits
      .filter((u) => u.transactionId === transactionId && u.nfcCode)
      .sort((a, b) => (a.serialNumber ?? 0) - (b.serialNumber ?? 0));

    if (issued > 0) toast.success(`NFC 코드 ${issued}개를 발급했습니다`);
    else if (units.length === 0) toast.error('코드 발급에 실패했습니다. 다시 시도해 주세요');

    if (units.length > 0) {
      setNfcCode(units[0].nfcCode!);
      setNfcModalTxId(transactionId);
      setNfcModalOpen(true);
    }
  };

  /**
   * 지금까지 입력한 고객명 — 재입력할 때 골라 쓴다.
   * 별도 테이블을 두면 두 곳이 어긋나므로 거래·병 기록에서 그때그때 모은다.
   */
  const customerNames = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    const push = (name?: string) => {
      const trimmed = name?.trim();
      if (!trimmed || seen.has(trimmed)) return;
      seen.add(trimmed);
      ordered.push(trimmed);
    };
    // 최근에 쓴 이름이 먼저 오게 한다
    [...transactions]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .forEach((t) => push(t.customerName));
    bottleUnits.forEach((u) => push(u.customerName));
    numberedBottles.forEach((b) => { push(b.soldTo); push(b.giftedTo); push(b.reservedFor); });
    return ordered;
  }, [transactions, bottleUnits, numberedBottles]);

  /** 재고 조정 모달이 다루는 제품의 병 기록 — 한정번호 중복·예약 여부를 여기서 본다 */
  const selectedProductUnits = useMemo(
    () => (selectedProduct ? bottleUnits.filter((u) => u.productId === selectedProduct.id) : []),
    [selectedProduct, bottleUnits]
  );

  const handleAddProduct = (product: { name: string; nameKo: string; year: number; size: string; totalQuantity: number; description?: string }) => {
    addProduct(product);
  };

  // 상품 총수량 수정 핸들러
  const handleEditProductQuantity = (productId: string, updates: { totalQuantity: number }) => {
    updateProduct(productId, updates);
  };

  // 트랜잭션 수정 핸들러
  const handleUpdateTransaction = (transactionId: string, updates: { type?: string; quantity: number; bottleNumber?: number; customerName?: string; price?: number; notes?: string }) => {
    updateTransaction(transactionId, updates as Parameters<typeof updateTransaction>[1]);
  };

  // 트랜잭션 삭제 핸들러 — 이 거래로 나간 병 기록도 함께 사라진다
  const handleDeleteTransaction = async (transactionId: string) => {
    await deleteTransaction(transactionId);
    toast.success('거래와 병 기록을 지웠습니다');
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

      {/* Hero Section - Compact on Mobile */}
      <section className="relative pt-8 sm:pt-16 pb-6 sm:pb-12 px-4 sm:px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative"
          >
            {/* Decorative Line - Hidden on Mobile */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="hidden sm:block absolute -left-6 top-1/2 w-16 h-px bg-gradient-to-r from-[#b7916e] to-transparent origin-left"
            />

            <div className="sm:pl-14 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-[#b7916e] text-[10px] sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-2 sm:mb-4 font-light"
                >
                  Inventory Management
                </motion.p>

                <h1
                  className="text-3xl sm:text-5xl lg:text-6xl text-white/95 mb-2 sm:mb-6 leading-[1.1] tracking-tight"
                  style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                >
                  <span className="sm:block inline">Inventory </span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b7916e] via-[#d4c4a8] to-[#b7916e]">
                    Management
                  </span>
                </h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.8 }}
                  className="hidden sm:block text-white/40 text-lg max-w-md font-light leading-relaxed"
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
                <div className="flex items-center gap-3">
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
                      defaultPrice={getDefaultPriceForProduct('first_edition')}
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

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {/* Weight Management Button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setWeightModalYear(year); }}
                        className="flex items-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-all"
                      >
                        <Scale className="w-4 h-4" />
                        <span className="text-xs sm:text-sm hidden sm:inline">무게관리</span>
                      </button>

                      {/* Add Product Button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setAddProductYear(year); }}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/50 hover:bg-[#b7916e]/10 hover:border-[#b7916e]/30 hover:text-[#d4c4a8] transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-xs sm:text-sm hidden sm:inline">상품 추가</span>
                      </button>

                      {/* Remove Year Button (only for custom years) */}
                      {customYears.includes(year) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveYear(year); }}
                          className="flex items-center gap-2 px-3 py-2 sm:py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/30 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all"
                          title="년도 제거"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
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
                                onEditQuantity={() => setEditingProduct(product)}
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

      {/* Add Year Button Section */}
      <section className="px-4 sm:px-6 lg:px-8 mb-6">
        <div className="mx-auto max-w-6xl">
          <motion.button
            onClick={handleAddYear}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-white/[0.08] hover:border-[#b7916e]/30 bg-white/[0.01] hover:bg-[#b7916e]/5 text-white/30 hover:text-[#d4c4a8] transition-all flex items-center justify-center gap-3"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-medium">년도 추가</span>
          </motion.button>
        </div>
      </section>

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
                <div className="px-4 sm:px-6 py-3 border-b border-white/[0.04]">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-white/40" />
                      <h3 className="text-white/60 font-medium text-sm">거래 내역</h3>
                      <span className="text-[11px] text-white/25 font-mono">{allTransactions.length}</span>
                      {nfcPendingCount > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400/90">
                          태그 쓰기 대기 {nfcPendingCount}병
                        </span>
                      )}
                      {isLoading && (
                        <RefreshCw className="w-3.5 h-3.5 text-white/30 animate-spin" />
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

                {paginatedTransactions.length > 0 ? (
                  <>
                    <div className="divide-y divide-white/[0.04]">
                      {paginatedTransactions.map((tx) => {
                        // Map 조회 최적화 - O(1) 조회
                        const productInfo = productMap.get(tx.productId);
                        const productName = productInfo?.name || tx.productId;
                        const nfcBottles = nfcBottlesForTransaction(tx);
                        const nfcMissing = nfcMissingForTransaction(tx);
                        const nfcWrittenCount = nfcBottles.filter((b) => b.written).length;
                        const nfcAllWritten = nfcBottles.length > 0 && nfcWrittenCount === nfcBottles.length && nfcMissing === 0;
                        /* 소유 등록은 쓰기와 별개의 사실 — 함께 센다 */
                        const nfcOwnedCount = nfcBottles.filter((b) => b.ownerRegistered).length;
                        const nfcAnyOwned = nfcOwnedCount > 0;

                        return (
                          <div key={tx.id} className="group px-4 sm:px-6 py-2.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                              <div className="text-[11px] text-white/30 w-14 sm:w-16 shrink-0">
                                {new Date(tx.createdAt).toLocaleDateString('ko-KR', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </div>
                              <div className="min-w-0">
                                <p className="text-white/70 text-[13px] leading-tight truncate">
                                  {productName}
                                  {tx.bottleNumber && ` #${tx.bottleNumber}`}
                                </p>
                                <p className="text-[11px] leading-tight text-white/30 truncate">
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
                            <div className="flex items-center gap-2 sm:gap-3">
                              {/* NFC 열 — 이 거래로 나간 병의 태그 상태. 눌러서 쓰기·재시도·초기화.
                                  병 없는 거래(예약·손상 등)도 폭을 차지해 수량 열이 어긋나지 않는다 */}
                              <div className="w-[62px] sm:w-[108px] shrink-0 flex justify-end">
                                {nfcBottles.length > 0 ? (
                                  <button
                                    onClick={() => {
                                      setNfcCode(nfcBottles[0].nfcCode);
                                      setNfcModalTxId(tx.id);
                                      setNfcModalOpen(true);
                                    }}
                                    title={
                                      nfcBottles.length === 1
                                        ? `${nfcBottles[0].label} · 태그 쓰기 ${nfcBottles[0].written ? '완료' : '기록 없음'} · 소유 등록 ${nfcBottles[0].ownerRegistered ? '됨' : '전'} — 눌러서 열기`
                                        : `${nfcBottles.length}병 · 태그 쓰기 ${nfcWrittenCount}병 · 소유 등록 ${nfcOwnedCount}병${nfcMissing > 0 ? ` · 코드 미발급 ${nfcMissing}병` : ''} — 눌러서 열기`
                                    }
                                    className="flex items-center gap-1.5 sm:gap-2 px-2 py-1 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all"
                                  >
                                    <span
                                      /* 소유 등록(청록) > 태그 쓰기 완료(초록) > 대기(호박) */
                                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                        nfcAnyOwned ? 'bg-cyan-300' : nfcAllWritten ? 'bg-emerald-400' : 'bg-amber-400'
                                      }`}
                                    />
                                    {/* 태그 쓰기는 휴대폰에서 한다 — 모바일에서도 반드시 눌리게 둔다 */}
                                    <span className="text-right leading-tight">
                                      <span className="hidden sm:block text-[11px] font-mono text-cyan-400/80">
                                        {nfcBottles.length === 1 ? nfcBottles[0].nfcCode : `${nfcBottles.length + nfcMissing}병`}
                                      </span>
                                      {/* 한 병이면 가장 진행된 사실 하나를, 여러 병이면 두 수치를 나란히.
                                          자세한 내역은 title에 담긴다. */}
                                      <span className={`block text-[10px] ${
                                        nfcAnyOwned ? 'text-cyan-300/80' : nfcAllWritten ? 'text-emerald-400/70' : 'text-amber-400/70'
                                      }`}>
                                        {nfcBottles.length === 1
                                          ? (nfcBottles[0].ownerRegistered ? '소유 등록됨' : nfcBottles[0].written ? '쓰기 완료' : '쓰기 대기')
                                          : `쓰기 ${nfcWrittenCount} · 등록 ${nfcOwnedCount} / ${nfcBottles.length + nfcMissing}`}
                                      </span>
                                    </span>
                                  </button>
                                ) : nfcMissing > 0 ? (
                                  /* 코드가 한 개도 안 나온 거래 — 예전 판매분이나 초기화한 병 */
                                  <button
                                    onClick={() => handleIssueMissingNfc(tx.id)}
                                    title={`${nfcMissing}병의 NFC 코드를 발급합니다`}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/[0.06] bg-white/[0.02] text-white/35 hover:text-cyan-400/90 hover:bg-cyan-500/10 hover:border-cyan-500/25 transition-all"
                                  >
                                    <Plus className="w-3 h-3 shrink-0" />
                                    <span className="text-[10px] leading-tight">코드 발급</span>
                                  </button>
                                ) : null}
                              </div>
                              <div className="text-right shrink-0 w-16">
                                <p className="text-white/60 text-[13px] leading-tight">
                                  {tx.quantity > 1 ? `${tx.quantity}병` : '1병'}
                                </p>
                                {tx.price && (
                                  <p className="text-[11px] leading-tight text-white/30">
                                    {tx.price.toLocaleString()}원
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => setEditingTransaction({
                                  id: tx.id,
                                  productId: tx.productId,
                                  type: tx.type,
                                  quantity: tx.quantity,
                                  bottleNumber: tx.bottleNumber,
                                  customerName: tx.customerName,
                                  price: tx.price,
                                  notes: tx.notes,
                                })}
                                className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.06] opacity-0 group-hover:opacity-100 transition-all"
                                title="수정"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination Indicators */}
                    {totalPages > 1 && (
                      <div className="px-4 sm:px-6 py-2.5 border-t border-white/[0.04] flex items-center justify-center gap-1.5 flex-wrap">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setTxCurrentPage(page)}
                            className={`w-7 h-7 rounded-full text-[11px] font-medium transition-all ${
                              txCurrentPage === page
                                ? 'bg-[#b7916e]/30 border border-[#b7916e]/50 text-[#d4c4a8]'
                                : 'bg-white/[0.04] border border-white/[0.08] text-white/40 hover:bg-white/[0.08] hover:text-white/60'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="px-6 py-6 text-center">
                    <p className="text-white/30 text-sm">
                      {(txFilterYear || txFilterMonth) ? '해당 기간의 거래 내역이 없습니다.' : '거래 내역이 없습니다.'}
                    </p>
                  </div>
                )}

                {/* 거래에 안 붙은 NFC 병 — 여기 없으면 이 병들은 다시 열 방법이 없다 */}
                {nfcOrphans.length > 0 && (
                  <div className="border-t border-white/[0.04]">
                    <button
                      onClick={() => setOrphansOpen((v) => !v)}
                      className="w-full px-4 sm:px-6 py-2.5 flex items-center gap-2 text-left hover:bg-white/[0.02] transition-colors"
                    >
                      <ChevronRight
                        className={`w-3.5 h-3.5 text-white/30 transition-transform ${orphansOpen ? 'rotate-90' : ''}`}
                      />
                      <span className="text-[11px] text-white/35">
                        거래에 안 붙은 NFC 병 {nfcOrphans.length}개
                      </span>
                    </button>

                    {orphansOpen && (
                      <div className="divide-y divide-white/[0.04] max-h-56 overflow-y-auto bg-white/[0.01]">
                        {nfcOrphans.map((bottle) => (
                          <button
                            key={bottle.key}
                            onClick={() => {
                              setNfcCode(bottle.nfcCode);
                              setNfcModalTxId(null);
                              setNfcModalOpen(true);
                            }}
                            className="w-full pl-10 pr-4 sm:pr-6 py-2.5 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors text-left"
                          >
                            <span className="flex items-center gap-3 min-w-0">
                              <span
                                /* 점 하나로는 두 사실을 못 담는다 — 가장 진행된 단계를 보인다.
                                   소유 등록(청록) > 태그 쓰기(초록) > 아직(회색) */
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  bottle.ownerRegistered ? 'bg-cyan-300' : bottle.written ? 'bg-emerald-400' : 'bg-white/25'
                                }`}
                              />
                              <span className="min-w-0">
                                <span className="block text-white/70 text-[13px] leading-tight truncate">{bottle.label}</span>
                                <span className="block text-[11px] leading-tight text-white/30 truncate">
                                  {bottle.statusLabel}
                                  {bottle.meta ? ` · ${bottle.meta}` : ''}
                                </span>
                              </span>
                            </span>
                            <span className="text-right shrink-0 leading-tight">
                              <span className="block text-[11px] font-mono text-cyan-400/80">{bottle.nfcCode}</span>
                              {/* 두 사실을 분리해 적는다 — 태그를 구웠는가(우리)와
                                  주인이 생겼는가(고객)는 서로를 함의하지 않는다.
                                  앱의 웹 NFC 쓰기가 안드로이드 크롬 전용이라, 아이폰·외부 앱으로
                                  구운 태그는 "쓰기"가 비어도 실제로는 동작한다. */}
                              <span className="block text-[9px] leading-tight">
                                <span className={bottle.written ? 'text-emerald-400/70' : 'text-white/25'}>
                                  {bottle.written ? '쓰기 완료' : '쓰기 기록 없음'}
                                </span>
                              </span>
                              <span className="block text-[9px] leading-tight">
                                <span className={bottle.ownerRegistered ? 'text-cyan-300/80' : 'text-white/25'}>
                                  {bottle.ownerRegistered ? '소유 등록됨' : '소유 등록 전'}
                                </span>
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>

          <div className="mb-10" />

        </div>
      </section>

      {/* Footer */}
      <Footer subtitle="Inventory Management" />

      {/* Batch Adjust Modal */}
      <BatchAdjustModal
        /* 제품이 바뀌거나 다시 열리면 새로 마운트해 폼을 되돌린다.
           접두어는 형제 모달과 key가 겹치지 않게 하려는 것 — 닫힌 상태의 폴백은 다 같은 값이 된다 */
        key={`batch-${selectedProduct ?? 'closed'}`}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        onAction={handleBatchAction}
        defaultPrice={selectedProduct ? getDefaultPriceForProduct(selectedProduct.id) : undefined}
        units={selectedProductUnits}
        customerNames={customerNames}
      />

      {/* Add Product Modal */}
      <AddProductModal
        /* 대상이 바뀌면 새로 마운트해 폼을 다시 만든다 */
        key={`add-product-${addProductYear ?? 'closed'}`}
        isOpen={addProductYear !== null}
        onClose={() => setAddProductYear(null)}
        year={addProductYear || 2026}
        onAdd={handleAddProduct}
      />

      {/* Weight Management Modal */}
      <WeightManagementModal
        isOpen={weightModalYear !== null}
        onClose={() => setWeightModalYear(null)}
        year={weightModalYear || 2025}
      />

      {/* Edit Product Modal */}
      <EditProductModal
        /* 대상이 바뀌면 새로 마운트해 폼을 다시 만든다 */
        key={`edit-product-${editingProduct?.id ?? 'closed'}`}
        isOpen={editingProduct !== null}
        onClose={() => setEditingProduct(null)}
        product={editingProduct}
        onSave={handleEditProductQuantity}
      />

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        /* 대상이 바뀌면 새로 마운트해 폼을 다시 만든다 */
        key={`edit-transaction-${editingTransaction?.id ?? 'closed'}`}
        isOpen={editingTransaction !== null}
        onClose={() => setEditingTransaction(null)}
        transaction={editingTransaction}
        onSave={handleUpdateTransaction}
        onDelete={handleDeleteTransaction}
        linkedBottles={editingTransaction ? bottleUnits.filter((u) => u.transactionId === editingTransaction.id) : []}
        productUnits={editingTransaction ? bottleUnits.filter((u) => u.productId === editingTransaction.productId) : []}
        isNumberedProduct={!!editingTransaction && numberedProductIds.has(editingTransaction.productId)}
      />

      {/* NFC Write Modal */}
      <NfcWriteModal
        isOpen={nfcModalOpen}
        onClose={() => { setNfcModalOpen(false); setNfcModalTxId(null); }}
        initialCode={nfcCode}
        bottles={nfcModalBottles}
        missingCount={nfcModalMissing}
        onIssueMore={nfcModalTxId ? () => handleIssueMissingNfc(nfcModalTxId) : undefined}
        onWritten={(code) => markNfcWritten(code)}
        onReset={async (code) => {
          const ok = await resetNfcRecord(code);
          setNfcModalOpen(false);
          setNfcModalTxId(null);
          if (ok) toast.success('NFC 기록을 초기화했습니다');
          else toast.error('초기화에 실패했습니다. 다시 시도해 주세요');
        }}
      />
    </div>
  );
}
