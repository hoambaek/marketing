# Muse de Marée DB API 연동

## 연결 정보

- **Base URL**: `https://plan.musedemaree.com/api/external/db`
- **인증**: `Authorization: Bearer fbad479dcacb65c2dabd2383567e33150aaf2da4c5bdddca440a2d4d2b84ddb6`

---

## 엔드포인트

### GET /api/external/db

사용 가능한 전체 함수 목록과 파라미터 스키마를 반환합니다.

```bash
curl -H "Authorization: Bearer fbad479dcacb65c2dabd2383567e33150aaf2da4c5bdddca440a2d4d2b84ddb6" \
  https://plan.musedemaree.com/api/external/db
```

### POST /api/external/db

DB 함수를 실행합니다.

```bash
curl -X POST https://plan.musedemaree.com/api/external/db \
  -H "Authorization: Bearer fbad479dcacb65c2dabd2383567e33150aaf2da4c5bdddca440a2d4d2b84ddb6" \
  -H "Content-Type: application/json" \
  -d '{"action": "getTasks", "params": {"year": 2026, "month": 2}}'
```

**요청 형식:**
```json
{
  "action": "함수명",
  "params": { ... }
}
```

**응답 형식:**
```json
{
  "success": true,
  "data": [...],
  "message": "결과 메시지"
}
```

---

## 사용 가능한 함수 (34개)

### 태스크 (월별 플랜)

| 함수 | 설명 | 필수 파라미터 |
|------|------|---------------|
| `getTasks` | 태스크 조회 | year |
| `createTask` | 태스크 생성 | title, year, month, week, category |
| `createMultipleTasks` | 다중 태스크 생성 | tasks[] |
| `updateTask` | 태스크 수정 | id |
| `deleteTask` | 태스크 삭제 | id |

### 컨텐츠 캘린더

| 함수 | 설명 | 필수 파라미터 |
|------|------|---------------|
| `getContents` | 컨텐츠 조회 | - |
| `createContent` | 컨텐츠 생성 | title, year, type, date |
| `createMultipleContents` | 다중 컨텐츠 생성 | contents[] |
| `updateContent` | 컨텐츠 수정 | id |
| `deleteContent` | 컨텐츠 삭제 | id |

### 예산 (수입)

| 함수 | 설명 | 필수 파라미터 |
|------|------|---------------|
| `getBudgetItems` | 수입 조회 | - |
| `createBudgetItem` | 수입 생성 | year, month, category, amount |
| `updateBudgetItem` | 수입 수정 | id |
| `deleteBudgetItem` | 수입 삭제 | id |

### 지출

| 함수 | 설명 | 필수 파라미터 |
|------|------|---------------|
| `getExpenseItems` | 지출 조회 | - |
| `createExpenseItem` | 지출 생성 | year, month, category, amount, description, date |
| `updateExpenseItem` | 지출 수정 | id |
| `deleteExpenseItem` | 지출 삭제 | id |

### 재고 - 넘버링 병 (2025 First Edition 1~50번)

| 함수 | 설명 | 필수 파라미터 |
|------|------|---------------|
| `getNumberedBottles` | 넘버링 병 조회 | - |
| `updateNumberedBottle` | 넘버링 병 수정 | bottleNumber, status |

### 재고 - 배치 (2026 제품)

| 함수 | 설명 | 필수 파라미터 |
|------|------|---------------|
| `getInventoryBatches` | 배치 재고 조회 | - |
| `updateInventoryBatch` | 배치 재고 수정 | productId |

### 재고 - 거래 내역

| 함수 | 설명 | 필수 파라미터 |
|------|------|---------------|
| `getInventoryTransactions` | 거래 내역 조회 | - |
| `createInventoryTransaction` | 거래 기록 | productId, type, quantity |

### 재고 - 커스텀 제품

| 함수 | 설명 | 필수 파라미터 |
|------|------|---------------|
| `getCustomProducts` | 커스텀 제품 조회 | - |
| `createCustomProduct` | 커스텀 제품 추가 | name, nameKo, year, size, totalQuantity |
| `deleteCustomProduct` | 커스텀 제품 삭제 | id |

---

## 코드값 참조

### 태스크 카테고리
`operation`(운영), `marketing`(마케팅), `design`(디자인), `filming`(촬영), `pr`(PR), `b2b`(B2B)

### 태스크 상태
`pending`(대기), `in_progress`(진행중), `done`(완료)

### 컨텐츠 유형
`instagram`, `youtube`, `blog`, `newsletter`, `press`

### 컨텐츠 상태
`draft`(초안), `scheduled`(예정), `published`(게시완료)

### 예산 카테고리
`marketing`, `operation`, `design`, `filming`, `pr`, `b2b`, `packaging`, `event`, `sales`, `other`

### 재고 상태
`available`(판매가능), `reserved`(예약), `sold`(판매완료), `gifted`(증정), `damaged`(손상)

### 거래 유형
`sale`(판매), `reservation`(예약), `gift`(증정), `damage`(손상), `return`(반품), `cancel_reservation`(예약취소)

### 제품 ID
| ID | 제품명 |
|----|--------|
| `first_edition` | 2025 퍼스트 에디션 (750ml, 넘버링 1-50) |
| `en_lieu_sur_brut` | 앙 리유 쉬르 브뤼 (750ml, 200병) |
| `en_lieu_sur_magnum` | 앙 리유 쉬르 매그넘 (1500ml, 24병) |
| `element_de_surprise` | 엘레멘 드 쉬르프리즈 BDB (750ml, 110병) |
| `atomes_crochus_1y` | 아톰 크로슈 1년 (750ml, 100병) |
| `atomes_crochus_2y` | 아톰 크로슈 2년 (750ml, 40병) |

---

## 자연어 → API 매핑 예시

| 자연어 | action | params |
|--------|--------|--------|
| "이번 달 태스크 보여줘" | `getTasks` | `{"year": 2026, "month": 2}` |
| "2월 3주차에 마케팅 태스크 추가해줘" | `createTask` | `{"title": "...", "year": 2026, "month": 2, "week": 3, "category": "marketing"}` |
| "인스타 일정 알려줘" | `getContents` | `{"type": "instagram"}` |
| "이번 달 지출 내역" | `getExpenseItems` | `{"year": 2026, "month": 2}` |
| "마케팅 예산 얼마야?" | `getBudgetItems` | `{"year": 2026, "category": "marketing"}` |
| "넘버링 병 몇 개 남았어?" | `getNumberedBottles` | `{"status": "available"}` |
| "재고 현황 보여줘" | `getInventoryBatches` | `{}` |

---

## 파라미터 스키마 자동 조회

정확한 파라미터 스키마는 GET 요청으로 실시간 확인 가능:

```bash
curl -H "Authorization: Bearer fbad479dcacb65c2dabd2383567e33150aaf2da4c5bdddca440a2d4d2b84ddb6" \
  https://plan.musedemaree.com/api/external/db | jq '.functions[] | select(.name == "createTask")'
```
