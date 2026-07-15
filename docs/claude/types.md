# Type System

## Core Types (`src/lib/types/index.ts`)
- `Task`, `MustDoItem`, `KPIItem`, `ContentItem` — Masterplan
- `NumberedBottle`, `InventoryBatch`, `InventoryTransaction` — Inventory
- `BudgetItem`, `ExpenseItem` — Budget
- `IssueItem` — Issues
- `OceanDataDaily`, `SalinityRecord` — Ocean
- `CostCalculatorSettings` — Cost

## UAPS Types (`src/lib/types/uaps.ts`)
- `AgingProduct`, `AgingPrediction`, `RetrievalResult`, `TastingSubmission`(+`productCategory` 조인 필드)
- `WineTerrestrialData`, `TerrestrialModel`
- `UAPSConfig`, `FlavorDictionary`, `ProductInput`, `ParsedUAPSConfig`
- `AgingFactors` — baseAgingYears, textureMult, aromaDecay, riskMult, kineticFactor, **timeScale?**(0.3~5.0)
- `QualityWeights` — texture/aroma/bubble/risk (합=1)

## 풍미 6축 상수 (SSOT — `types/uaps.ts`)
- `FLAVOR_AXES` — 슬롯 키·색 (fruity ~ finishComplexity, 샴페인 기본 라벨)
- `CATEGORY_FLAVOR_LABELS` — 카테고리별 6축 라벨
- `CATEGORY_FLAVOR_DEFINITIONS` — 카테고리별 6축 정의 (시음 폼·레이더 하단 설명)
- `CATEGORY_NEGATIVE_AXIS` — **현재 비어 있음** (전 축 양성 통일)
- `getFlavorAxes(category)` → `{key, color, label, definition}[]` — UI가 소비하는 유일한 진입점
- DB `category_flavor_axes` 테이블은 동기 사본 (코드 수정 시 함께 갱신)

## Enums / Union Types
- `ProductCategory` (11): champagne | red_wine | white_wine | **green_coffee_bean** | sake | whisky | **yakju_cheongju** | spirits | puer | soy_sauce | vinegar
  - `yakju_cheongju`=전통주(약주·청주, 발효), `spirits`=증류주(소주), `green_coffee_bean`=생두(구 coldbrew)
- `WineType`: blanc_de_blancs | blanc_de_noirs | rose | blend | vintage — **비와인은 null 허용**
- `AgingStage`: youthful | developing | mature | aged
- `ReductionPotential`: low | medium | high
- `ClosureType`: crown_cap | cork_natural | screw_cap | ...
- `ProductStatus`: planned | immersed | harvested
- `TastingSubmissionStatus`: pending | approved | rejected

## 카테고리별 폼 상수 (`types/uaps.ts`)
- `CATEGORY_SUBTYPES` / `CATEGORY_FIELD_CONFIG` / `CATEGORY_REDUCTION_CHECKLIST` / `CATEGORY_DEFAULT_CLOSURE` / `CATEGORY_EA_MAP`(아레니우스 Ea)
- 새 카테고리 추가 시 위 5개 + 6축 라벨·정의 + AI 프롬프트(expertRoles·sources·EXPERT_ROLES) + 페이지 slug 매핑 모두 등록할 것
