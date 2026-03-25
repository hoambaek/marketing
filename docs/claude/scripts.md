# Data Scripts

## Node.js (`data/scripts/`)
| 스크립트 | 용도 |
|---------|------|
| `nlp_extract_ollama.mjs` | Ollama LLM 6축 NLP 추출 (112K건 완료) |
| `backfill_khoa_ocean_data.mjs` | KHOA 해양 데이터 백필 (14개월) |
| `backfill_tidal_current.mjs` | 조류 유속 백필 (TW_0078) |
| `retrain_model.mjs` | 모델 재학습 |

## Python (`data/scripts/`)
| 스크립트 | 용도 | 실행 |
|---------|------|------|
| `train_xgboost.py` | XGBoost 6축 모델 학습 | `source .venv/bin/activate && python3 data/scripts/train_xgboost.py` |

## CellarTracker (`data/cellartracker/`)
| 스크립트 | 용도 |
|---------|------|
| `upload_csv.mjs` | CSV → Supabase 업로드 |
| `upload_notes.mjs` | JSON → Supabase 업로드 |

## XGBoost 모델 (`data/models/`)
학습 후 생성: `xgboost_*.json` (6개) + `model_metadata.json`
