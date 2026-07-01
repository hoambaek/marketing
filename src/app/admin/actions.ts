'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

// ════════════════════════════════════════════════════════════════════════
// 통합 관리자 서버 액션 — service_role로 공유 Supabase 접근 (RLS 우회, 서버 전용)
// 브랜드 소개서 발송은 landing의 보안 API를 공유 시크릿으로 호출한다.
// ════════════════════════════════════════════════════════════════════════

export type ActionResult = { ok: boolean; error?: string };

/** 브랜드 소개서 승인 → landing API 호출로 PDF 첨부 메일 발송 + status=sent */
export async function approveBrandBook(id: string): Promise<ActionResult> {
  const url = process.env.BRANDBOOK_SEND_URL?.trim();
  const secret = process.env.ADMIN_API_SECRET?.trim();
  if (!url || !secret) {
    return { ok: false, error: '발송 설정(BRANDBOOK_SEND_URL/ADMIN_API_SECRET)이 없습니다.' };
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify({ id }),
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
      return { ok: false, error: data?.error ?? `발송 실패 (HTTP ${res.status})` };
    }
    revalidatePath('/admin');
    return { ok: true };
  } catch (e) {
    logger.error('[admin] 소개서 발송 호출 실패', e);
    return { ok: false, error: '발송 요청 중 오류가 발생했습니다.' };
  }
}

/** 브랜드 소개서 거절 표기 */
export async function rejectBrandBook(id: string): Promise<ActionResult> {
  if (!supabaseAdmin) return { ok: false, error: 'server not configured' };
  const { error } = await supabaseAdmin
    .from('brandbook_requests')
    .update({ status: 'rejected' })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin');
  return { ok: true };
}

/** 파트너 문의 처리완료 토글 */
export async function setPartnerHandled(id: string, handled: boolean): Promise<ActionResult> {
  if (!supabaseAdmin) return { ok: false, error: 'server not configured' };
  const { error } = await supabaseAdmin
    .from('partner_inquiries')
    .update({
      status: handled ? 'handled' : 'new',
      handled_at: handled ? new Date().toISOString() : null,
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin');
  return { ok: true };
}

/** 오션셀러 프리베(초대) 처리완료 토글 */
export async function setInvitationHandled(id: string, handled: boolean): Promise<ActionResult> {
  if (!supabaseAdmin) return { ok: false, error: 'server not configured' };
  const { error } = await supabaseAdmin
    .from('invitations')
    .update({
      status: handled ? 'handled' : 'new',
      handled_at: handled ? new Date().toISOString() : null,
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin');
  return { ok: true };
}

/** 블로그 구독자 구독취소 */
export async function unsubscribeSubscriber(id: string): Promise<ActionResult> {
  if (!supabaseAdmin) return { ok: false, error: 'server not configured' };
  const { error } = await supabaseAdmin
    .from('subscribers')
    .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin');
  return { ok: true };
}

const DELETABLE = new Set([
  'brandbook_requests',
  'partner_inquiries',
  'invitations',
  'subscribers',
]);

/** 행 삭제 (허용된 테이블만) */
export async function deleteRow(table: string, id: string): Promise<ActionResult> {
  if (!supabaseAdmin) return { ok: false, error: 'server not configured' };
  if (!DELETABLE.has(table)) return { ok: false, error: 'not allowed' };
  const { error } = await supabaseAdmin.from(table).delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin');
  return { ok: true };
}
