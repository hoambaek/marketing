import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { dbLogger } from '@/lib/logger';
import type {
  TastingSubmission,
  TastingSubmissionInput,
  TastingSubmissionStatus,
} from '@/lib/types/uaps';

// ════════════════════════════════════════════════════════════════════════
// 외부 기록자 비교 시음 제출함 — service_role 전용 DB 함수
// ════════════════════════════════════════════════════════════════════════

interface DBTastingSubmission {
  id: string;
  prediction_id: string | null;
  product_id: string;
  recorder_name: string;
  recorder_affiliation: string | null;
  retrieval_date: string | null;
  actual_duration_months: number | null;
  tasting_panel_size: number;
  tasting_notes: string | null;
  actual_fruity: number | null;
  actual_floral_mineral: number | null;
  actual_yeasty_autolytic: number | null;
  actual_acidity_freshness: number | null;
  actual_body_texture: number | null;
  actual_finish_complexity: number | null;
  actual_overall_quality: number | null;
  terrestrial_fruity: number | null;
  terrestrial_floral_mineral: number | null;
  terrestrial_yeasty_autolytic: number | null;
  terrestrial_acidity_freshness: number | null;
  terrestrial_body_texture: number | null;
  terrestrial_finish_complexity: number | null;
  terrestrial_overall_quality: number | null;
  status: TastingSubmissionStatus;
  reviewed_at: string | null;
  approved_retrieval_id: string | null;
  created_at: string;
}

function mapDb(db: DBTastingSubmission): TastingSubmission {
  return {
    id: db.id,
    predictionId: db.prediction_id,
    productId: db.product_id,
    recorderName: db.recorder_name,
    recorderAffiliation: db.recorder_affiliation,
    retrievalDate: db.retrieval_date,
    actualDurationMonths: db.actual_duration_months,
    tastingPanelSize: db.tasting_panel_size,
    tastingNotes: db.tasting_notes,
    actualFruity: db.actual_fruity,
    actualFloralMineral: db.actual_floral_mineral,
    actualYeastyAutolytic: db.actual_yeasty_autolytic,
    actualAcidityFreshness: db.actual_acidity_freshness,
    actualBodyTexture: db.actual_body_texture,
    actualFinishComplexity: db.actual_finish_complexity,
    actualOverallQuality: db.actual_overall_quality,
    terrestrialFruity: db.terrestrial_fruity,
    terrestrialFloralMineral: db.terrestrial_floral_mineral,
    terrestrialYeastyAutolytic: db.terrestrial_yeasty_autolytic,
    terrestrialAcidityFreshness: db.terrestrial_acidity_freshness,
    terrestrialBodyTexture: db.terrestrial_body_texture,
    terrestrialFinishComplexity: db.terrestrial_finish_complexity,
    terrestrialOverallQuality: db.terrestrial_overall_quality,
    status: db.status,
    reviewedAt: db.reviewed_at,
    approvedRetrievalId: db.approved_retrieval_id,
    createdAt: db.created_at,
  };
}

/** 공개 페이지용 예측 최소 정보 (제품 식별만 노출, 예측 수치는 숨김) */
export async function fetchPredictionContextForTasting(
  predictionId: string
): Promise<{
  predictionId: string;
  productId: string | null;
  productName: string | null;
  underseaDurationMonths: number;
} | null> {
  if (!supabaseAdmin) return null;
  // FK(aging_predictions.product_id → aging_products.id) 기반 조인으로 1회 쿼리
  const { data, error } = await supabaseAdmin
    .from('aging_predictions')
    .select('id, product_id, undersea_duration_months, aging_products(product_name)')
    .eq('id', predictionId)
    .single();
  if (error || !data) return null;

  const joined = data.aging_products as { product_name: string } | { product_name: string }[] | null;
  const productName = Array.isArray(joined)
    ? joined[0]?.product_name ?? null
    : joined?.product_name ?? null;

  return {
    predictionId: data.id,
    productId: data.product_id,
    productName,
    underseaDurationMonths: data.undersea_duration_months,
  };
}

/** 외부 제출 저장 (status=pending) */
export async function createTastingSubmission(
  input: TastingSubmissionInput
): Promise<TastingSubmission | null> {
  if (!supabaseAdmin) return null;

  // 제출된 예측이 실제로 존재하는지 확인 (위조 링크 차단 + product_id 확보)
  const ctx = await fetchPredictionContextForTasting(input.predictionId);
  if (!ctx) {
    dbLogger.warn('시음 제출: 유효하지 않은 prediction_id', input.predictionId);
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from('tasting_submissions')
    .insert({
      prediction_id: input.predictionId,
      product_id: ctx.productId ?? 'unknown',
      recorder_name: input.recorderName,
      recorder_affiliation: input.recorderAffiliation ?? null,
      retrieval_date: input.retrievalDate ?? null,
      actual_duration_months: input.actualDurationMonths ?? null,
      tasting_panel_size: input.tastingPanelSize,
      tasting_notes: input.tastingNotes ?? null,
      actual_fruity: input.actualFruity,
      actual_floral_mineral: input.actualFloralMineral,
      actual_yeasty_autolytic: input.actualYeastyAutolytic,
      actual_acidity_freshness: input.actualAcidityFreshness,
      actual_body_texture: input.actualBodyTexture,
      actual_finish_complexity: input.actualFinishComplexity,
      actual_overall_quality: input.actualOverallQuality,
      terrestrial_fruity: input.terrestrialFruity,
      terrestrial_floral_mineral: input.terrestrialFloralMineral,
      terrestrial_yeasty_autolytic: input.terrestrialYeastyAutolytic,
      terrestrial_acidity_freshness: input.terrestrialAcidityFreshness,
      terrestrial_body_texture: input.terrestrialBodyTexture,
      terrestrial_finish_complexity: input.terrestrialFinishComplexity,
      terrestrial_overall_quality: input.terrestrialOverallQuality,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    dbLogger.error('시음 제출 저장 실패:', error);
    return null;
  }
  return mapDb(data);
}

/** 상태별 제출 목록 (기본 pending) */
export async function fetchTastingSubmissions(
  status: TastingSubmissionStatus = 'pending',
  limit = 100
): Promise<TastingSubmission[] | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from('tasting_submissions')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    dbLogger.error('시음 제출 목록 조회 실패:', error);
    return null;
  }
  return (data as DBTastingSubmission[]).map(mapDb);
}

/**
 * 제출 승인 → retrieval_results로 복사 후 status=approved.
 * (Supabase JS는 다중 문 트랜잭션을 직접 지원하지 않아 순차 실행:
 *  retrieval 저장 성공 시에만 submission을 approved로 갱신한다.)
 */
export async function approveTastingSubmission(
  id: string
): Promise<{ ok: boolean; retrievalId?: string }> {
  if (!supabaseAdmin) return { ok: false };

  const { data: sub, error: subErr } = await supabaseAdmin
    .from('tasting_submissions')
    .select('*')
    .eq('id', id)
    .eq('status', 'pending')
    .single();
  if (subErr || !sub) {
    dbLogger.warn('승인 실패: 대기 중 제출을 찾을 수 없음', id);
    return { ok: false };
  }
  const s = sub as DBTastingSubmission;

  // 1. retrieval_results로 복사
  const { data: ret, error: retErr } = await supabaseAdmin
    .from('retrieval_results')
    .insert({
      product_id: s.product_id,
      retrieval_date: s.retrieval_date,
      actual_duration_months: s.actual_duration_months ?? 0,
      actual_fruity: s.actual_fruity,
      actual_floral_mineral: s.actual_floral_mineral,
      actual_yeasty_autolytic: s.actual_yeasty_autolytic,
      actual_acidity_freshness: s.actual_acidity_freshness,
      actual_body_texture: s.actual_body_texture,
      actual_finish_complexity: s.actual_finish_complexity,
      actual_overall_quality: s.actual_overall_quality,
      terrestrial_fruity: s.terrestrial_fruity,
      terrestrial_floral_mineral: s.terrestrial_floral_mineral,
      terrestrial_yeasty_autolytic: s.terrestrial_yeasty_autolytic,
      terrestrial_acidity_freshness: s.terrestrial_acidity_freshness,
      terrestrial_body_texture: s.terrestrial_body_texture,
      terrestrial_finish_complexity: s.terrestrial_finish_complexity,
      terrestrial_overall_quality: s.terrestrial_overall_quality,
      tasting_panel_size: s.tasting_panel_size,
      tasting_notes: s.recorder_affiliation
        ? `[${s.recorder_name} · ${s.recorder_affiliation}] ${s.tasting_notes ?? ''}`.trim()
        : `[${s.recorder_name}] ${s.tasting_notes ?? ''}`.trim(),
      is_simulated: false,
      prediction_id: s.prediction_id,
    })
    .select('id')
    .single();

  if (retErr || !ret) {
    dbLogger.error('승인 실패: retrieval_results 저장 오류', retErr);
    return { ok: false };
  }

  // 2. 제출을 approved로 갱신
  const { error: updErr } = await supabaseAdmin
    .from('tasting_submissions')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      approved_retrieval_id: ret.id,
    })
    .eq('id', id);

  if (updErr) {
    dbLogger.error('승인 후 상태 갱신 실패 (retrieval은 이미 생성됨):', updErr);
    return { ok: false };
  }
  return { ok: true, retrievalId: ret.id };
}

/** 제출 거부 */
export async function rejectTastingSubmission(id: string): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const { error } = await supabaseAdmin
    .from('tasting_submissions')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending');
  if (error) {
    dbLogger.error('시음 제출 거부 실패:', error);
    return false;
  }
  return true;
}
