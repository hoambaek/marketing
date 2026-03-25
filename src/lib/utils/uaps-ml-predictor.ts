/**
 * UAPS v5.0 — XGBoost ML 추론 모듈
 *
 * Python에서 학습된 XGBoost 모델의 JSON 트리를 로드하여
 * 순수 TypeScript로 추론. npm 패키지 의존성 없음.
 *
 * 사용법:
 *   1. Python으로 학습: python data/scripts/train_xgboost.py
 *   2. data/models/ 에 xgboost_*.json + model_metadata.json 생성됨
 *   3. 이 모듈이 자동으로 로드하여 추론
 */

import { promises as fs } from 'fs';
import path from 'path';

// ═══════════════════════════════════════════════════════════════════════════
// 타입
// ═══════════════════════════════════════════════════════════════════════════

/** XGBoost JSON 모델 (save_model로 저장된 형식) */
interface XGBJsonModel {
  learner: {
    gradient_booster: {
      model: {
        trees: {
          tree_param: { num_nodes: string };
          split_indices: number[];
          split_conditions: number[];
          left_children: number[];
          right_children: number[];
          default_left: number[];
        }[];
        tree_info: number[];
        gbtree_model_param: {
          num_trees: string;
        };
      };
    };
    learner_model_param: {
      base_score: string;
      num_feature: string;
    };
  };
}

/** 모델 메타데이터 (Python 학습 시 생성) */
interface ModelMetadata {
  version: string;
  feature_columns: string[];
  encoding_map: {
    product_category: Record<string, number>;
    aging_stage: Record<string, number>;
    reduction_potential: Record<string, number>;
    numeric_medians: Record<string, number>;
  };
  models: Record<string, {
    cv_rmse: number;
    cv_std: number;
    train_rmse: number;
    feature_importance: Record<string, number>;
  }>;
  total_samples: number;
}

/** ML 예측 입력 */
interface MLPredictionInput {
  productCategory: string;
  agingStage: string;
  pH: number | null;
  dosage: number | null;
  alcohol: number | null;
  acidity: number | null;
  reductionPotential: string;
  agingYears: number | null;
}

/** ML 예측 결과 */
export interface MLPredictionResult {
  fruity: number;
  floralMineral: number;
  yeastyAutolytic: number;
  acidityFreshness: number;
  bodyTexture: number;
  finishComplexity: number;
  confidence: number;
  featureImportance: Record<string, Record<string, number>>;
}

// ═══════════════════════════════════════════════════════════════════════════
// 모델 캐시 (한 번 로드 후 재사용)
// ═══════════════════════════════════════════════════════════════════════════

let cachedModels: Map<string, XGBJsonModel> | null = null;
let cachedMetadata: ModelMetadata | null = null;

const MODELS_DIR = path.join(process.cwd(), 'data', 'models');

const AXIS_MAP: Record<string, string> = {
  fruity: 'fruity',
  floral_mineral: 'floralMineral',
  yeasty_autolytic: 'yeastyAutolytic',
  acidity_freshness: 'acidityFreshness',
  body_texture: 'bodyTexture',
  finish_complexity: 'finishComplexity',
};

// ═══════════════════════════════════════════════════════════════════════════
// 모델 로드
// ═══════════════════════════════════════════════════════════════════════════

async function loadModels(): Promise<boolean> {
  if (cachedModels && cachedMetadata) return true;

  try {
    // 메타데이터 로드
    const metaPath = path.join(MODELS_DIR, 'model_metadata.json');
    const metaRaw = await fs.readFile(metaPath, 'utf-8');
    cachedMetadata = JSON.parse(metaRaw) as ModelMetadata;

    // 6축 모델 로드
    cachedModels = new Map();
    for (const axisKey of Object.keys(AXIS_MAP)) {
      const modelPath = path.join(MODELS_DIR, `xgboost_${axisKey}.json`);
      const modelRaw = await fs.readFile(modelPath, 'utf-8');
      cachedModels.set(axisKey, JSON.parse(modelRaw) as XGBJsonModel);
    }

    console.log(`UAPS ML: ${cachedModels.size}개 XGBoost 모델 로드 완료 (${cachedMetadata.total_samples}건 학습)`);
    return true;
  } catch {
    console.warn('UAPS ML: 모델 파일 없음 — ML 예측 비활성화. python data/scripts/train_xgboost.py 실행 필요.');
    cachedModels = null;
    cachedMetadata = null;
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// XGBoost JSON 트리 추론
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 단일 트리 추론 (배열 기반 트리 구조)
 */
function predictTree(
  tree: XGBJsonModel['learner']['gradient_booster']['model']['trees'][0],
  features: number[]
): number {
  let nodeId = 0;

  while (true) {
    const leftChild = tree.left_children[nodeId];

    // leaf 노드 (자식이 -1)
    if (leftChild === -1) {
      return tree.split_conditions[nodeId]; // leaf value
    }

    const splitFeature = tree.split_indices[nodeId];
    const splitValue = tree.split_conditions[nodeId];
    const rightChild = tree.right_children[nodeId];
    const defaultLeft = tree.default_left[nodeId];

    const featureValue = features[splitFeature];

    // NaN/missing → default 방향
    if (featureValue === undefined || isNaN(featureValue)) {
      nodeId = defaultLeft === 1 ? leftChild : rightChild;
    } else if (featureValue < splitValue) {
      nodeId = leftChild;
    } else {
      nodeId = rightChild;
    }
  }
}

/**
 * XGBoost 앙상블 추론 (모든 트리 합산 + base_score)
 */
function predictModel(model: XGBJsonModel, features: number[]): number {
  const trees = model.learner.gradient_booster.model.trees;
  const baseScore = parseFloat(model.learner.learner_model_param.base_score);

  let sum = baseScore;
  for (const tree of trees) {
    sum += predictTree(tree, features);
  }

  return Math.min(100, Math.max(0, sum));
}

// ═══════════════════════════════════════════════════════════════════════════
// 피처 인코딩
// ═══════════════════════════════════════════════════════════════════════════

function encodeFeatures(input: MLPredictionInput, metadata: ModelMetadata): number[] {
  const enc = metadata.encoding_map;
  const medians = enc.numeric_medians;

  return [
    enc.product_category[input.productCategory] ?? enc.product_category['champagne'] ?? 0,
    enc.aging_stage[input.agingStage] ?? enc.aging_stage['developing'] ?? 1,
    input.pH ?? medians['ph'] ?? 3.1,
    input.dosage ?? medians['dosage'] ?? 8,
    input.alcohol ?? medians['alcohol'] ?? 12,
    input.acidity ?? medians['acidity'] ?? 6,
    enc.reduction_potential[input.reductionPotential] ?? 0,
    input.agingYears ?? medians['aging_years'] ?? 3,
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// 공개 API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ML 모델 사용 가능 여부
 */
export async function isMLModelAvailable(): Promise<boolean> {
  return loadModels();
}

/**
 * XGBoost 기반 풍미 예측
 *
 * 모델 파일이 없으면 null 반환 (클러스터 통계 폴백)
 */
export async function predictWithXGBoost(
  input: MLPredictionInput
): Promise<MLPredictionResult | null> {
  const loaded = await loadModels();
  if (!loaded || !cachedModels || !cachedMetadata) return null;

  const features = encodeFeatures(input, cachedMetadata);
  const result: Record<string, number> = {};
  const featureImportance: Record<string, Record<string, number>> = {};

  for (const [axisKey, tsKey] of Object.entries(AXIS_MAP)) {
    const model = cachedModels.get(axisKey);
    if (!model) continue;

    const predicted = predictModel(model, features);
    result[tsKey] = Math.round(predicted * 10) / 10;

    // 피처 중요도 (메타데이터에서)
    const modelMeta = cachedMetadata.models[axisKey];
    if (modelMeta) {
      featureImportance[tsKey] = modelMeta.feature_importance;
    }
  }

  // 신뢰도: CV RMSE 기반 (낮을수록 신뢰도 높음)
  const avgRmse = Object.values(cachedMetadata.models)
    .reduce((sum, m) => sum + m.cv_rmse, 0) / Object.keys(cachedMetadata.models).length;
  const confidence = Math.max(0.3, Math.min(0.95, 1 - avgRmse / 50));

  return {
    fruity: result.fruity ?? 50,
    floralMineral: result.floralMineral ?? 50,
    yeastyAutolytic: result.yeastyAutolytic ?? 50,
    acidityFreshness: result.acidityFreshness ?? 50,
    bodyTexture: result.bodyTexture ?? 50,
    finishComplexity: result.finishComplexity ?? 50,
    confidence: Math.round(confidence * 100) / 100,
    featureImportance,
  };
}
