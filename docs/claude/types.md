# Type System

## Core Types (`src/lib/types/index.ts`)
- `Task`, `MustDoItem`, `KPIItem`, `ContentItem` — Masterplan
- `NumberedBottle`, `InventoryBatch`, `InventoryTransaction` — Inventory
- `BudgetItem`, `ExpenseItem` — Budget
- `IssueItem` — Issues
- `OceanDataDaily`, `SalinityRecord` — Ocean
- `CostCalculatorSettings` — Cost

## UAPS Types (`src/lib/types/uaps.ts`)
- `AgingProduct`, `AgingPrediction`, `RetrievalResult`
- `WineTerrestrialData`, `TerrestrialModel`
- `UAPSConfig`, `FlavorDictionary`, `ProductInput`
- `AgingFactors`, `QualityWeights`, `ParsedUAPSConfig`

## Ocean Types (`src/lib/types/ocean-data.ts`)
- Ocean data daily, monthly profiles

## Enums / Union Types
- `ProductCategory`: champagne | red_wine | white_wine | coldbrew | sake | whisky | spirits | puer | soy_sauce | vinegar
- `WineType`: blanc_de_blancs | blanc_de_noirs | rose | blend | vintage
- `AgingStage`: youthful | developing | mature | aged
- `ReductionPotential`: low | medium | high
- `ClosureType`: crown_cap | cork_natural | screw_cap | ...
- `ProductStatus`: planned | immersed | harvested
