import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { dbLogger } from '@/lib/logger';
import type { RetrievalResult } from '@/lib/types/uaps';

// ════════════════════════════════════════════════════════════════════════
// 인양 실측 결과 쓰기 — service_role 전용 (RLS로 anon 쓰기 차단)
// ════════════════════════════════════════════════════════════════════════
// retrieval_results는 UAPS 모델 검증용 실측 데이터로 복구 불가 자산이다.
// anon 클라이언트의 쓰기는 RLS 정책으로 막고, 모든 insert/update는
// Clerk 미들웨어가 보호하는 서버 API 라우트를 통해서만 이 함수로 수행한다.
// 읽기(fetchRetrievalResults)는 anon SELECT로 uaps.ts에 그대로 둔다.
// ════════════════════════════════════════════════════════════════════════

interface DBRetrievalResult {
  id: string;
  product_id: string;
  retrieval_date: string;
  actual_duration_months: number;
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
  tasting_panel_size: number;
  tasting_notes: string | null;
  is_simulated: boolean;
  prediction_id: string | null;
  created_at: string;
}

function mapDb(db: DBRetrievalResult): RetrievalResult {
  return {
    id: db.id,
    productId: db.product_id,
    retrievalDate: db.retrieval_date,
    actualDurationMonths: db.actual_duration_months,
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
    tastingPanelSize: db.tasting_panel_size,
    tastingNotes: db.tasting_notes,
    isSimulated: db.is_simulated,
    predictionId: db.prediction_id,
    createdAt: db.created_at,
  };
}

export async function createRetrievalResult(
  input: Omit<RetrievalResult, 'id' | 'createdAt'>
): Promise<RetrievalResult | null> {
  if (!supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin
    .from('retrieval_results')
    .insert({
      product_id: input.productId,
      retrieval_date: input.retrievalDate,
      actual_duration_months: input.actualDurationMonths,
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
      tasting_panel_size: input.tastingPanelSize,
      tasting_notes: input.tastingNotes,
      is_simulated: input.isSimulated,
      prediction_id: input.predictionId,
    })
    .select()
    .single();

  if (error) {
    dbLogger.error('UAPS: 인양 결과 저장 실패:', error);
    return null;
  }

  return mapDb(data);
}

export async function updateRetrievalResult(
  id: string,
  input: Partial<Omit<RetrievalResult, 'id' | 'createdAt'>>
): Promise<RetrievalResult | null> {
  if (!supabaseAdmin) return null;

  const updateData: Record<string, unknown> = {};
  if (input.retrievalDate !== undefined) updateData.retrieval_date = input.retrievalDate;
  if (input.actualDurationMonths !== undefined) updateData.actual_duration_months = input.actualDurationMonths;
  if (input.actualFruity !== undefined) updateData.actual_fruity = input.actualFruity;
  if (input.actualFloralMineral !== undefined) updateData.actual_floral_mineral = input.actualFloralMineral;
  if (input.actualYeastyAutolytic !== undefined) updateData.actual_yeasty_autolytic = input.actualYeastyAutolytic;
  if (input.actualAcidityFreshness !== undefined) updateData.actual_acidity_freshness = input.actualAcidityFreshness;
  if (input.actualBodyTexture !== undefined) updateData.actual_body_texture = input.actualBodyTexture;
  if (input.actualFinishComplexity !== undefined) updateData.actual_finish_complexity = input.actualFinishComplexity;
  if (input.actualOverallQuality !== undefined) updateData.actual_overall_quality = input.actualOverallQuality;
  if (input.terrestrialFruity !== undefined) updateData.terrestrial_fruity = input.terrestrialFruity;
  if (input.terrestrialFloralMineral !== undefined) updateData.terrestrial_floral_mineral = input.terrestrialFloralMineral;
  if (input.terrestrialYeastyAutolytic !== undefined) updateData.terrestrial_yeasty_autolytic = input.terrestrialYeastyAutolytic;
  if (input.terrestrialAcidityFreshness !== undefined) updateData.terrestrial_acidity_freshness = input.terrestrialAcidityFreshness;
  if (input.terrestrialBodyTexture !== undefined) updateData.terrestrial_body_texture = input.terrestrialBodyTexture;
  if (input.terrestrialFinishComplexity !== undefined) updateData.terrestrial_finish_complexity = input.terrestrialFinishComplexity;
  if (input.terrestrialOverallQuality !== undefined) updateData.terrestrial_overall_quality = input.terrestrialOverallQuality;
  if (input.tastingPanelSize !== undefined) updateData.tasting_panel_size = input.tastingPanelSize;
  if (input.tastingNotes !== undefined) updateData.tasting_notes = input.tastingNotes;

  const { data, error } = await supabaseAdmin
    .from('retrieval_results')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    dbLogger.error('UAPS: 인양 결과 업데이트 실패:', error);
    return null;
  }

  return mapDb(data);
}
