/**
 * 영업관리 (/prospects) — 서버 데이터 래퍼
 *
 * 탭 1(거래처): 신규 발굴 B2B 거래처 후보를 파셋으로 정렬·필터.
 * 탭 2(전통주): 해저숙성할 전통주를 픽하는 기준판(전통주 후보 온톨로지).
 * 경량 온톨로지(통제 어휘) 설계: docs/plans/musedemaree/2026-07-18-b2b-map-ontology-ui-plan.md
 * 데이터는 service_role로 읽는다(RLS 우회, 내부 전용).
 */

import { Suspense } from 'react';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { SalesManagement } from './SalesManagement';
import type { Prospect } from './ProspectsView';
import type { LiquorCandidate } from './LiquorView';
import type { NonAlcoholCandidate } from './NonAlcoholView';

export const dynamic = 'force-dynamic';

export default async function ProspectsPage() {
  let prospects: Prospect[] = [];
  let liquors: LiquorCandidate[] = [];
  let nonalcs: NonAlcoholCandidate[] = [];

  if (supabaseAdmin) {
    const [pRes, lRes, nRes] = await Promise.all([
      supabaseAdmin
        .from('prospects')
        .select(
          'id,name,segment,sub_type,region,fit,fit_reason,wine_program,pairing,price_band,decision_maker_type,seasonality,product_fit,entry_asset,key_person,evidence_urls,profile_md,source_file,stage,is_founder_direct',
        )
        .order('fit', { ascending: true })
        .order('name', { ascending: true }),
      supabaseAdmin
        .from('liquor_candidates')
        .select(
          'id,name,producer,type,abv,aging_fit,narrative_fit,heritage,channel_demand,price_tier,premium_headroom,secured_status,traditional_status,pick_grade,pick_reason,evidence_urls,notes',
        )
        .order('pick_grade', { ascending: true })
        .order('name', { ascending: true }),
      supabaseAdmin
        .from('nonalcoholic_candidates')
        .select(
          'id,name,category,origin,sourcing_tier,domestic_available,aging_applicable,pick_grade,pick_reason,evidence_urls,notes',
        )
        .order('pick_grade', { ascending: true })
        .order('name', { ascending: true }),
    ]);
    prospects = (pRes.data ?? []) as Prospect[];
    liquors = (lRes.data ?? []) as LiquorCandidate[];
    nonalcs = (nRes.data ?? []) as NonAlcoholCandidate[];
  }

  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-6 text-white/40 text-sm">영업관리 로딩…</div>}>
      <SalesManagement prospects={prospects} liquors={liquors} nonalcs={nonalcs} />
    </Suspense>
  );
}
