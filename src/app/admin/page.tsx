import { supabaseAdmin } from '@/lib/supabase/admin';
import AdminDashboard from './AdminDashboard';

// 신청/구독 데이터는 항상 최신으로
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  if (!supabaseAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] text-white/70 pt-28 px-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/[0.06] bg-[#0d1525]/80 p-8">
          서버 설정이 필요합니다. <code>SUPABASE_SERVICE_ROLE_KEY</code>를 확인해 주세요.
        </div>
      </div>
    );
  }

  const [bb, partner, invites, subs] = await Promise.all([
    supabaseAdmin.from('brandbook_requests').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('partner_inquiries').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('invitations').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('subscribers').select('*').order('subscribed_at', { ascending: false }),
  ]);

  return (
    <AdminDashboard
      brandbook={bb.data ?? []}
      partner={partner.data ?? []}
      invitations={invites.data ?? []}
      subscribers={subs.data ?? []}
    />
  );
}
