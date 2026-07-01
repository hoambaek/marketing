'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Download,
  Send,
  RefreshCw,
  Check,
  X,
  Trash2,
  Mail,
  Users,
  Handshake,
  Anchor,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  approveBrandBook,
  rejectBrandBook,
  setPartnerHandled,
  setInvitationHandled,
  unsubscribeSubscriber,
  deleteRow,
  type ActionResult,
} from './actions';

// ── 행 타입 ──────────────────────────────────────────────
interface BrandBookRow {
  id: string;
  email: string;
  name: string | null;
  affiliation: string | null;
  status: 'pending' | 'approved' | 'sent' | 'rejected';
  created_at: string;
  sent_at: string | null;
}
interface PartnerRow {
  id: string;
  category: string | null;
  venue: string | null;
  name: string | null;
  email: string;
  message: string | null;
  status: 'new' | 'handled';
  created_at: string;
  handled_at: string | null;
}
interface InvitationRow {
  id: string;
  name: string | null;
  email: string;
  status: 'new' | 'handled';
  created_at: string;
  handled_at: string | null;
}
interface SubscriberRow {
  id: string;
  email: string;
  name: string | null;
  status: string | null;
  subscribed_at: string | null;
  unsubscribed_at: string | null;
  source: string | null;
}

interface Props {
  brandbook: BrandBookRow[];
  partner: PartnerRow[];
  invitations: InvitationRow[];
  subscribers: SubscriberRow[];
}

type TabKey = 'brandbook' | 'partner' | 'invitations' | 'subscribers';

const TABS: { key: TabKey; label: string; icon: typeof Mail }[] = [
  { key: 'brandbook', label: '브랜드 소개서', icon: Mail },
  { key: 'partner', label: '파트너 문의', icon: Handshake },
  { key: 'invitations', label: '오션셀러 프리베', icon: Anchor },
  { key: 'subscribers', label: '블로그 구독자', icon: Users },
];

// ── 유틸 ────────────────────────────────────────────────
function fmt(dt: string | null): string {
  if (!dt) return '—';
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Seoul',
    }).format(new Date(dt));
  } catch {
    return dt;
  }
}

function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = columns.join(',');
  const body = rows.map((r) => columns.map((c) => esc(r[c])).join(',')).join('\n');
  return `﻿${head}\n${body}`;
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
    approved: 'bg-sky-400/10 text-sky-300 border-sky-400/20',
    sent: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
    rejected: 'bg-rose-400/10 text-rose-300 border-rose-400/20',
    new: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
    handled: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
    active: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
    unsubscribed: 'bg-white/[0.04] text-white/40 border-white/[0.08]',
  };
  const label: Record<string, string> = {
    pending: '대기',
    approved: '승인',
    sent: '발송완료',
    rejected: '거절',
    new: '신규',
    handled: '처리완료',
    active: '구독중',
    unsubscribed: '구독취소',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium',
        map[status] ?? 'bg-white/[0.04] text-white/50 border-white/[0.08]'
      )}
    >
      {label[status] ?? status}
    </span>
  );
}

// ── 메인 ────────────────────────────────────────────────
export default function AdminDashboard({ brandbook, partner, invitations, subscribers }: Props) {
  const [tab, setTab] = useState<TabKey>('brandbook');
  const [query, setQuery] = useState('');
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const router = useRouter();

  const counts = {
    brandbook: brandbook.filter((r) => r.status === 'pending').length,
    partner: partner.filter((r) => r.status === 'new').length,
    invitations: invitations.filter((r) => r.status === 'new').length,
    subscribers: subscribers.filter((r) => (r.status ?? 'active') === 'active').length,
  };

  const q = query.trim().toLowerCase();
  const match = (...vals: (string | null | undefined)[]) =>
    !q || vals.some((v) => (v ?? '').toLowerCase().includes(q));

  // React Compiler가 자동 메모이즈 — 수동 useMemo 없이 직접 계산
  const filtered =
    tab === 'brandbook'
      ? brandbook.filter((r) => match(r.name, r.affiliation, r.email, r.status))
      : tab === 'partner'
        ? partner.filter((r) => match(r.category, r.venue, r.name, r.email, r.message, r.status))
        : tab === 'invitations'
          ? invitations.filter((r) => match(r.name, r.email, r.status))
          : subscribers.filter((r) => match(r.email, r.name, r.status, r.source));

  function run(id: string, fn: () => Promise<ActionResult>) {
    setBusyId(id);
    setMsg(null);
    startTransition(async () => {
      const res = await fn();
      setBusyId(null);
      if (res.ok) {
        setMsg({ kind: 'ok', text: '완료되었습니다.' });
        router.refresh();
      } else {
        setMsg({ kind: 'err', text: res.error ?? '실패했습니다.' });
      }
    });
  }

  function exportCsv() {
    const stamp = new Date().toISOString().slice(0, 10);
    if (tab === 'brandbook') {
      downloadCsv(
        `brandbook_${stamp}.csv`,
        toCsv(filtered as unknown as Record<string, unknown>[], [
          'name', 'affiliation', 'email', 'status', 'created_at', 'sent_at',
        ])
      );
    } else if (tab === 'partner') {
      downloadCsv(
        `partner_${stamp}.csv`,
        toCsv(filtered as unknown as Record<string, unknown>[], [
          'category', 'venue', 'name', 'email', 'message', 'status', 'created_at', 'handled_at',
        ])
      );
    } else if (tab === 'invitations') {
      downloadCsv(
        `ocean_cellar_${stamp}.csv`,
        toCsv(filtered as unknown as Record<string, unknown>[], [
          'name', 'email', 'status', 'created_at', 'handled_at',
        ])
      );
    } else {
      downloadCsv(
        `subscribers_${stamp}.csv`,
        toCsv(filtered as unknown as Record<string, unknown>[], [
          'email', 'name', 'status', 'source', 'subscribed_at', 'unsubscribed_at',
        ])
      );
    }
  }

  const th = 'text-left text-[11px] font-medium uppercase tracking-wider text-white/35 px-4 py-3';
  const td = 'px-4 py-3 text-sm text-white/80 align-top';
  const iconBtn =
    'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-40';

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white pt-20 sm:pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* 헤더 */}
        <div className="mb-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#b7916e]/70">Admin</p>
          <h1 className="mt-1 text-2xl font-light">신청·구독자 관리</h1>
        </div>

        {/* 탭 */}
        <div className="mb-5 flex flex-wrap gap-2">
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            const badge = counts[key];
            return (
              <button
                key={key}
                onClick={() => { setTab(key); setMsg(null); }}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm transition-colors',
                  active
                    ? 'border-[#b7916e]/30 bg-[#b7916e]/15 text-[#e7d7c2]'
                    : 'border-white/[0.06] bg-[#0d1525]/60 text-white/55 hover:text-white/80'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                {badge > 0 && (
                  <span className="ml-0.5 rounded-full bg-[#b7916e]/25 px-1.5 py-0.5 text-[10px] text-[#e7d7c2]">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 검색 + CSV */}
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="검색 (이름·이메일·소속 등)"
              className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] py-2.5 pl-9 pr-4 text-sm text-white/90 placeholder:text-white/30 focus:border-[#b7916e]/50 focus:outline-none"
            />
          </div>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white/70 hover:text-white/90"
          >
            <Download className="h-4 w-4" /> CSV
          </button>
        </div>

        {msg && (
          <div
            className={cn(
              'mb-4 rounded-xl border px-4 py-2.5 text-sm',
              msg.kind === 'ok'
                ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
                : 'border-rose-400/20 bg-rose-400/10 text-rose-200'
            )}
          >
            {msg.text}
          </div>
        )}

        {/* 테이블 */}
        <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-[#0d1525]/80 backdrop-blur-xl">
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-white/[0.06]">
              <tr>
                {tab === 'brandbook' && (
                  <>
                    <th className={th}>이름</th><th className={th}>소속</th><th className={th}>이메일</th>
                    <th className={th}>상태</th><th className={th}>신청일</th><th className={th}>작업</th>
                  </>
                )}
                {tab === 'partner' && (
                  <>
                    <th className={th}>유형</th><th className={th}>업장</th><th className={th}>담당자</th>
                    <th className={th}>이메일</th><th className={th}>메시지</th><th className={th}>상태</th>
                    <th className={th}>일시</th><th className={th}>작업</th>
                  </>
                )}
                {tab === 'invitations' && (
                  <>
                    <th className={th}>이름</th><th className={th}>이메일</th><th className={th}>상태</th>
                    <th className={th}>일시</th><th className={th}>작업</th>
                  </>
                )}
                {tab === 'subscribers' && (
                  <>
                    <th className={th}>이메일</th><th className={th}>이름</th><th className={th}>상태</th>
                    <th className={th}>소스</th><th className={th}>구독일</th><th className={th}>작업</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.length === 0 && (
                <tr><td className="px-4 py-10 text-center text-sm text-white/30" colSpan={9}>데이터가 없습니다.</td></tr>
              )}

              {/* 브랜드 소개서 */}
              {tab === 'brandbook' && (filtered as BrandBookRow[]).map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02]">
                  <td className={td}>{r.name ?? '—'}</td>
                  <td className={td}>{r.affiliation ?? '—'}</td>
                  <td className={td}>{r.email}</td>
                  <td className={td}><StatusBadge status={r.status} /></td>
                  <td className={cn(td, 'whitespace-nowrap text-white/50')}>{fmt(r.created_at)}</td>
                  <td className={td}>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        disabled={pending && busyId === r.id}
                        onClick={() => run(r.id, () => approveBrandBook(r.id))}
                        className={cn(iconBtn, 'border-[#b7916e]/30 bg-[#b7916e]/15 text-[#e7d7c2] hover:bg-[#b7916e]/25')}
                        title={r.status === 'sent' ? '재발송' : '승인 후 소개서 발송'}
                      >
                        {busyId === r.id && pending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        {r.status === 'sent' ? '재발송' : '승인·발송'}
                      </button>
                      {r.status !== 'rejected' && r.status !== 'sent' && (
                        <button
                          disabled={pending && busyId === r.id}
                          onClick={() => run(r.id, () => rejectBrandBook(r.id))}
                          className={cn(iconBtn, 'border-white/[0.1] bg-white/[0.04] text-white/50 hover:text-white/80')}
                        >
                          <X className="h-3.5 w-3.5" /> 거절
                        </button>
                      )}
                      <button
                        disabled={pending && busyId === r.id}
                        onClick={() => run(r.id, () => deleteRow('brandbook_requests', r.id))}
                        className={cn(iconBtn, 'border-rose-400/20 bg-rose-400/5 text-rose-300/80 hover:bg-rose-400/15')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* 파트너 문의 */}
              {tab === 'partner' && (filtered as PartnerRow[]).map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02]">
                  <td className={td}>{r.category ?? '—'}</td>
                  <td className={td}>{r.venue ?? '—'}</td>
                  <td className={td}>{r.name ?? '—'}</td>
                  <td className={td}>{r.email}</td>
                  <td className={cn(td, 'max-w-[240px] whitespace-pre-wrap text-white/60')}>{r.message ?? '—'}</td>
                  <td className={td}><StatusBadge status={r.status} /></td>
                  <td className={cn(td, 'whitespace-nowrap text-white/50')}>{fmt(r.created_at)}</td>
                  <td className={td}>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        disabled={pending && busyId === r.id}
                        onClick={() => run(r.id, () => setPartnerHandled(r.id, r.status !== 'handled'))}
                        className={cn(iconBtn, 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20')}
                      >
                        <Check className="h-3.5 w-3.5" /> {r.status === 'handled' ? '처리해제' : '처리완료'}
                      </button>
                      <button
                        disabled={pending && busyId === r.id}
                        onClick={() => run(r.id, () => deleteRow('partner_inquiries', r.id))}
                        className={cn(iconBtn, 'border-rose-400/20 bg-rose-400/5 text-rose-300/80 hover:bg-rose-400/15')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* 오션셀러 프리베 */}
              {tab === 'invitations' && (filtered as InvitationRow[]).map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02]">
                  <td className={td}>{r.name ?? '—'}</td>
                  <td className={td}>{r.email}</td>
                  <td className={td}><StatusBadge status={r.status} /></td>
                  <td className={cn(td, 'whitespace-nowrap text-white/50')}>{fmt(r.created_at)}</td>
                  <td className={td}>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        disabled={pending && busyId === r.id}
                        onClick={() => run(r.id, () => setInvitationHandled(r.id, r.status !== 'handled'))}
                        className={cn(iconBtn, 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20')}
                      >
                        <Check className="h-3.5 w-3.5" /> {r.status === 'handled' ? '처리해제' : '처리완료'}
                      </button>
                      <button
                        disabled={pending && busyId === r.id}
                        onClick={() => run(r.id, () => deleteRow('invitations', r.id))}
                        className={cn(iconBtn, 'border-rose-400/20 bg-rose-400/5 text-rose-300/80 hover:bg-rose-400/15')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* 블로그 구독자 */}
              {tab === 'subscribers' && (filtered as SubscriberRow[]).map((r) => {
                const st = r.status ?? 'active';
                return (
                  <tr key={r.id} className="hover:bg-white/[0.02]">
                    <td className={td}>{r.email}</td>
                    <td className={td}>{r.name ?? '—'}</td>
                    <td className={td}><StatusBadge status={st} /></td>
                    <td className={cn(td, 'text-white/50')}>{r.source ?? '—'}</td>
                    <td className={cn(td, 'whitespace-nowrap text-white/50')}>{fmt(r.subscribed_at)}</td>
                    <td className={td}>
                      <div className="flex flex-wrap gap-1.5">
                        {st === 'active' && (
                          <button
                            disabled={pending && busyId === r.id}
                            onClick={() => run(r.id, () => unsubscribeSubscriber(r.id))}
                            className={cn(iconBtn, 'border-white/[0.1] bg-white/[0.04] text-white/50 hover:text-white/80')}
                          >
                            <X className="h-3.5 w-3.5" /> 구독취소
                          </button>
                        )}
                        <button
                          disabled={pending && busyId === r.id}
                          onClick={() => run(r.id, () => deleteRow('subscribers', r.id))}
                          className={cn(iconBtn, 'border-rose-400/20 bg-rose-400/5 text-rose-300/80 hover:bg-rose-400/15')}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-white/30">{filtered.length}건 표시</p>
      </div>
    </div>
  );
}
