import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import * as db from '@/lib/supabase/database';
import {
  Task, TaskCategory, TaskStatus,
  IssueItem, IssueType, IssuePriority, IssueImpact, IssueStatus,
  ContentItem, ContentType, ContentStatus,
  MustDoItem, BudgetItem, ExpenseItem, BudgetCategory,
  ProductType, InventoryStatus, NumberedBottle, InventoryBatch, InventoryTransaction
} from '@/lib/types';

// ═══════════════════════════════════════════════════════════════════════════
// Function Declarations for Gemini
// ═══════════════════════════════════════════════════════════════════════════

export const functionDeclarations: FunctionDeclaration[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // Task Functions
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'getTasks',
    description: '월별 플랜의 태스크(업무) 목록을 조회합니다. 연도, 월, 주차로 필터링할 수 있습니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        year: { type: SchemaType.NUMBER, description: '연도 (예: 2026)' },
        month: { type: SchemaType.NUMBER, description: '월 (1-12)' },
        week: { type: SchemaType.NUMBER, description: '주차 (1-4)' },
      },
    },
  },
  {
    name: 'createTask',
    description: '새로운 태스크(업무)를 생성합니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING, description: '태스크 제목' },
        description: { type: SchemaType.STRING, description: '태스크 설명' },
        year: { type: SchemaType.NUMBER, description: '연도 (예: 2026)' },
        month: { type: SchemaType.NUMBER, description: '월 (1-12)' },
        week: { type: SchemaType.NUMBER, description: '주차 (1-4)' },
        category: {
          type: SchemaType.STRING,
          description: '카테고리: operation(운영), marketing(마케팅), design(디자인), filming(촬영), pr(PR), b2b(B2B)'
        },
        status: {
          type: SchemaType.STRING,
          description: '상태: pending(대기), in_progress(진행중), done(완료)'
        },
        assignee: { type: SchemaType.STRING, description: '담당자' },
        dueDate: { type: SchemaType.STRING, description: '마감일 (YYYY-MM-DD)' },
      },
      required: ['title', 'year', 'month', 'week', 'category'],
    },
  },
  {
    name: 'createMultipleTasks',
    description: '여러 개의 태스크를 한번에 생성합니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        tasks: {
          type: SchemaType.ARRAY,
          description: '생성할 태스크 목록',
          items: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING, description: '태스크 제목' },
              description: { type: SchemaType.STRING, description: '태스크 설명' },
              year: { type: SchemaType.NUMBER, description: '연도' },
              month: { type: SchemaType.NUMBER, description: '월' },
              week: { type: SchemaType.NUMBER, description: '주차' },
              category: { type: SchemaType.STRING, description: '카테고리' },
              status: { type: SchemaType.STRING, description: '상태' },
            },
            required: ['title', 'year', 'month', 'week', 'category'],
          },
        },
      },
      required: ['tasks'],
    },
  },
  {
    name: 'updateTask',
    description: '기존 태스크를 수정합니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING, description: '태스크 ID' },
        title: { type: SchemaType.STRING, description: '태스크 제목' },
        description: { type: SchemaType.STRING, description: '태스크 설명' },
        year: { type: SchemaType.NUMBER, description: '연도' },
        month: { type: SchemaType.NUMBER, description: '월' },
        week: { type: SchemaType.NUMBER, description: '주차' },
        category: { type: SchemaType.STRING, description: '카테고리' },
        status: { type: SchemaType.STRING, description: '상태' },
        assignee: { type: SchemaType.STRING, description: '담당자' },
        dueDate: { type: SchemaType.STRING, description: '마감일' },
      },
      required: ['id'],
    },
  },
  {
    name: 'deleteTask',
    description: '태스크를 삭제합니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING, description: '삭제할 태스크 ID' },
      },
      required: ['id'],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Issue Functions
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'getIssues',
    description: '이슈/리스크/의사결정 목록을 조회합니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        year: { type: SchemaType.NUMBER, description: '연도' },
        month: { type: SchemaType.NUMBER, description: '월' },
        status: { type: SchemaType.STRING, description: '상태: open, in_progress, resolved, closed' },
        type: { type: SchemaType.STRING, description: '유형: issue(이슈), risk(리스크), decision(의사결정)' },
      },
    },
  },
  {
    name: 'createIssue',
    description: '새로운 이슈/리스크/의사결정을 생성합니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING, description: '제목' },
        description: { type: SchemaType.STRING, description: '상세 설명' },
        year: { type: SchemaType.NUMBER, description: '연도' },
        month: { type: SchemaType.NUMBER, description: '월' },
        type: { type: SchemaType.STRING, description: '유형: issue, risk, decision' },
        priority: { type: SchemaType.STRING, description: '우선순위: low, medium, high, critical' },
        impact: { type: SchemaType.STRING, description: '영향도: low, medium, high' },
        status: { type: SchemaType.STRING, description: '상태: open, in_progress, resolved, closed' },
        category: { type: SchemaType.STRING, description: '카테고리' },
        owner: { type: SchemaType.STRING, description: '담당자' },
        dueDate: { type: SchemaType.STRING, description: '마감일' },
      },
      required: ['title', 'year', 'month', 'type', 'priority', 'impact', 'category'],
    },
  },
  {
    name: 'updateIssue',
    description: '이슈를 수정합니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING, description: '이슈 ID' },
        title: { type: SchemaType.STRING, description: '제목' },
        description: { type: SchemaType.STRING, description: '설명' },
        status: { type: SchemaType.STRING, description: '상태' },
        priority: { type: SchemaType.STRING, description: '우선순위' },
        resolution: { type: SchemaType.STRING, description: '해결 방안' },
      },
      required: ['id'],
    },
  },
  {
    name: 'deleteIssue',
    description: '이슈를 삭제합니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING, description: '삭제할 이슈 ID' },
      },
      required: ['id'],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Content Functions
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'getContents',
    description: '컨텐츠 캘린더 항목을 조회합니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        year: { type: SchemaType.NUMBER, description: '연도' },
        month: { type: SchemaType.NUMBER, description: '월' },
        type: { type: SchemaType.STRING, description: '유형: instagram, youtube, blog, newsletter, press' },
      },
    },
  },
  {
    name: 'createContent',
    description: '새로운 컨텐츠를 생성합니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING, description: '컨텐츠 제목' },
        description: { type: SchemaType.STRING, description: '컨텐츠 설명' },
        year: { type: SchemaType.NUMBER, description: '연도' },
        type: { type: SchemaType.STRING, description: '유형: instagram, youtube, blog, newsletter, press' },
        date: { type: SchemaType.STRING, description: '예정일 (YYYY-MM-DD)' },
        status: { type: SchemaType.STRING, description: '상태: draft, scheduled, published' },
      },
      required: ['title', 'year', 'type', 'date'],
    },
  },
  {
    name: 'createMultipleContents',
    description: '여러 개의 컨텐츠를 한번에 생성합니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        contents: {
          type: SchemaType.ARRAY,
          description: '생성할 컨텐츠 목록',
          items: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING, description: '컨텐츠 제목' },
              description: { type: SchemaType.STRING, description: '설명' },
              year: { type: SchemaType.NUMBER, description: '연도' },
              type: { type: SchemaType.STRING, description: '유형' },
              date: { type: SchemaType.STRING, description: '예정일' },
              status: { type: SchemaType.STRING, description: '상태' },
            },
            required: ['title', 'year', 'type', 'date'],
          },
        },
      },
      required: ['contents'],
    },
  },
  {
    name: 'updateContent',
    description: '컨텐츠를 수정합니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING, description: '컨텐츠 ID' },
        title: { type: SchemaType.STRING, description: '제목' },
        description: { type: SchemaType.STRING, description: '설명' },
        date: { type: SchemaType.STRING, description: '예정일' },
        status: { type: SchemaType.STRING, description: '상태' },
      },
      required: ['id'],
    },
  },
  {
    name: 'deleteContent',
    description: '컨텐츠를 삭제합니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING, description: '삭제할 컨텐츠 ID' },
      },
      required: ['id'],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Must-Do (필수 체크) Functions
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'getMustDoItems',
    description: '필수 체크리스트 항목을 조회합니다. 연도나 월로 필터링할 수 있습니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        year: { type: SchemaType.NUMBER, description: '연도 (예: 2026)' },
        month: { type: SchemaType.NUMBER, description: '월 (1-12)' },
      },
    },
  },
  {
    name: 'createMustDoItem',
    description: '새로운 필수 체크리스트 항목을 생성합니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING, description: '항목 제목' },
        year: { type: SchemaType.NUMBER, description: '연도 (예: 2026)' },
        month: { type: SchemaType.NUMBER, description: '월 (1-12)' },
        category: {
          type: SchemaType.STRING,
          description: '카테고리: operation(운영), marketing(마케팅), design(디자인), filming(촬영), pr(PR), b2b(B2B)'
        },
        done: { type: SchemaType.BOOLEAN, description: '완료 여부 (기본값: false)' },
      },
      required: ['title', 'year', 'month', 'category'],
    },
  },
  {
    name: 'toggleMustDo',
    description: '필수 체크리스트 항목의 완료 상태를 변경합니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING, description: '항목 ID' },
        done: { type: SchemaType.BOOLEAN, description: '완료 여부' },
      },
      required: ['id', 'done'],
    },
  },
  {
    name: 'updateMustDoItem',
    description: '필수 체크리스트 항목을 수정합니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING, description: '항목 ID' },
        title: { type: SchemaType.STRING, description: '제목' },
        year: { type: SchemaType.NUMBER, description: '연도' },
        month: { type: SchemaType.NUMBER, description: '월' },
        category: { type: SchemaType.STRING, description: '카테고리' },
        done: { type: SchemaType.BOOLEAN, description: '완료 여부' },
      },
      required: ['id'],
    },
  },
  {
    name: 'deleteMustDoItem',
    description: '필수 체크리스트 항목을 삭제합니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING, description: '삭제할 항목 ID' },
      },
      required: ['id'],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Budget (예산관리) Functions
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'getBudgetItems',
    description: '예산 항목을 조회합니다. 연도나 월로 필터링할 수 있습니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        year: { type: SchemaType.NUMBER, description: '연도 (예: 2026)' },
        month: { type: SchemaType.NUMBER, description: '월 (1-12)' },
        category: {
          type: SchemaType.STRING,
          description: '카테고리: marketing, operation, design, filming, pr, b2b, packaging, event, other'
        },
      },
    },
  },
  {
    name: 'createBudgetItem',
    description: '새로운 예산 항목을 생성합니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        year: { type: SchemaType.NUMBER, description: '연도 (예: 2026)' },
        month: { type: SchemaType.NUMBER, description: '월 (1-12)' },
        category: {
          type: SchemaType.STRING,
          description: '카테고리: marketing(마케팅), operation(운영), design(디자인), filming(촬영), pr(PR), b2b(B2B), packaging(패키징), event(이벤트), other(기타)'
        },
        budgeted: { type: SchemaType.NUMBER, description: '예산 금액 (원)' },
        description: { type: SchemaType.STRING, description: '설명' },
      },
      required: ['year', 'month', 'category', 'budgeted'],
    },
  },
  {
    name: 'updateBudgetItem',
    description: '예산 항목을 수정합니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING, description: '예산 항목 ID' },
        budgeted: { type: SchemaType.NUMBER, description: '예산 금액' },
        spent: { type: SchemaType.NUMBER, description: '지출 금액' },
        description: { type: SchemaType.STRING, description: '설명' },
      },
      required: ['id'],
    },
  },
  {
    name: 'deleteBudgetItem',
    description: '예산 항목을 삭제합니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING, description: '삭제할 예산 항목 ID' },
      },
      required: ['id'],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Expense (지출내역) Functions
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'getExpenseItems',
    description: '지출 내역을 조회합니다. 연도나 월로 필터링할 수 있습니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        year: { type: SchemaType.NUMBER, description: '연도 (예: 2026)' },
        month: { type: SchemaType.NUMBER, description: '월 (1-12)' },
      },
    },
  },
  {
    name: 'createExpenseItem',
    description: '새로운 지출 내역을 생성합니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        year: { type: SchemaType.NUMBER, description: '연도 (예: 2026)' },
        month: { type: SchemaType.NUMBER, description: '월 (1-12)' },
        category: {
          type: SchemaType.STRING,
          description: '카테고리: marketing, operation, design, filming, pr, b2b, packaging, event, other'
        },
        amount: { type: SchemaType.NUMBER, description: '지출 금액 (원)' },
        description: { type: SchemaType.STRING, description: '지출 설명' },
        vendor: { type: SchemaType.STRING, description: '거래처' },
        date: { type: SchemaType.STRING, description: '지출일 (YYYY-MM-DD)' },
        notes: { type: SchemaType.STRING, description: '비고' },
      },
      required: ['year', 'month', 'category', 'amount', 'description', 'date'],
    },
  },
  {
    name: 'updateExpenseItem',
    description: '지출 내역을 수정합니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING, description: '지출 내역 ID' },
        amount: { type: SchemaType.NUMBER, description: '지출 금액' },
        description: { type: SchemaType.STRING, description: '설명' },
        vendor: { type: SchemaType.STRING, description: '거래처' },
        date: { type: SchemaType.STRING, description: '지출일' },
        notes: { type: SchemaType.STRING, description: '비고' },
      },
      required: ['id'],
    },
  },
  {
    name: 'deleteExpenseItem',
    description: '지출 내역을 삭제합니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING, description: '삭제할 지출 내역 ID' },
      },
      required: ['id'],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Inventory - Numbered Bottles (2025 First Edition)
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'getNumberedBottles',
    description: '2025 퍼스트 에디션 넘버링 병(1-50번) 재고 현황을 조회합니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        status: {
          type: SchemaType.STRING,
          description: '상태 필터: available(판매가능), reserved(예약), sold(판매완료), gifted(증정), damaged(손상)'
        },
        bottleNumber: { type: SchemaType.NUMBER, description: '특정 병 번호 조회 (1-50)' },
      },
    },
  },
  {
    name: 'updateNumberedBottle',
    description: '넘버링 병의 상태를 업데이트합니다 (예약, 판매, 증정 등).',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        bottleNumber: { type: SchemaType.NUMBER, description: '병 번호 (1-50)' },
        status: {
          type: SchemaType.STRING,
          description: '새 상태: available(판매가능), reserved(예약), sold(판매완료), gifted(증정), damaged(손상)'
        },
        reservedFor: { type: SchemaType.STRING, description: '예약자 이름 (예약 시)' },
        soldTo: { type: SchemaType.STRING, description: '구매자/수령자 이름' },
        price: { type: SchemaType.NUMBER, description: '판매가격 (원)' },
        notes: { type: SchemaType.STRING, description: '메모' },
      },
      required: ['bottleNumber', 'status'],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Inventory - Batches (2026 Products)
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'getInventoryBatches',
    description: '2026 제품 일반 재고(배치) 현황을 조회합니다. 각 제품별 판매가능, 예약, 판매완료, 증정, 손상 수량을 보여줍니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        productId: {
          type: SchemaType.STRING,
          description: '제품 ID 필터: en_lieu_sur_brut, en_lieu_sur_magnum, element_de_surprise, atomes_crochus'
        },
      },
    },
  },
  {
    name: 'updateInventoryBatch',
    description: '제품 배치의 재고 수량을 업데이트합니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        productId: {
          type: SchemaType.STRING,
          description: '제품 ID: en_lieu_sur_brut, en_lieu_sur_magnum, element_de_surprise, atomes_crochus'
        },
        available: { type: SchemaType.NUMBER, description: '판매가능 수량' },
        reserved: { type: SchemaType.NUMBER, description: '예약 수량' },
        sold: { type: SchemaType.NUMBER, description: '판매완료 수량' },
        gifted: { type: SchemaType.NUMBER, description: '증정 수량' },
        damaged: { type: SchemaType.NUMBER, description: '손상 수량' },
      },
      required: ['productId'],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Inventory - Transactions
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'getInventoryTransactions',
    description: '재고 거래 내역(판매, 예약, 증정, 손상, 반품 등)을 조회합니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        limit: { type: SchemaType.NUMBER, description: '조회할 최대 건수 (기본: 50)' },
        productId: { type: SchemaType.STRING, description: '특정 제품만 필터링' },
        type: {
          type: SchemaType.STRING,
          description: '거래 유형 필터: sale(판매), reservation(예약), gift(증정), damage(손상), return(반품), cancel_reservation(예약취소)'
        },
      },
    },
  },
  {
    name: 'createInventoryTransaction',
    description: '새로운 재고 거래를 기록합니다 (판매, 예약, 증정 등).',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        productId: {
          type: SchemaType.STRING,
          description: '제품 ID: first_edition, en_lieu_sur_brut, en_lieu_sur_magnum, element_de_surprise, atomes_crochus'
        },
        bottleNumber: { type: SchemaType.NUMBER, description: '넘버링 병의 경우 병 번호 (1-50)' },
        type: {
          type: SchemaType.STRING,
          description: '거래 유형: sale(판매), reservation(예약), gift(증정), damage(손상), return(반품), cancel_reservation(예약취소)'
        },
        quantity: { type: SchemaType.NUMBER, description: '수량 (일반 재고의 경우)' },
        customerName: { type: SchemaType.STRING, description: '고객명' },
        price: { type: SchemaType.NUMBER, description: '거래 금액 (원)' },
        notes: { type: SchemaType.STRING, description: '메모' },
      },
      required: ['productId', 'type', 'quantity'],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Inventory - Custom Products
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'getCustomProducts',
    description: '사용자가 추가한 커스텀 제품 목록을 조회합니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
  {
    name: 'createCustomProduct',
    description: '새로운 커스텀 제품을 추가합니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING, description: '제품명 (영문)' },
        nameKo: { type: SchemaType.STRING, description: '제품명 (한글)' },
        year: { type: SchemaType.NUMBER, description: '빈티지 연도' },
        size: { type: SchemaType.STRING, description: '용량 (예: 750ml, 1500ml)' },
        totalQuantity: { type: SchemaType.NUMBER, description: '총 수량' },
        description: { type: SchemaType.STRING, description: '제품 설명' },
      },
      required: ['name', 'nameKo', 'year', 'size', 'totalQuantity'],
    },
  },
  {
    name: 'deleteCustomProduct',
    description: '커스텀 제품을 삭제합니다.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING, description: '삭제할 제품 ID' },
      },
      required: ['id'],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// Function Handlers
// ═══════════════════════════════════════════════════════════════════════════

interface FunctionResult {
  success: boolean;
  data?: unknown;
  message: string;
}

export async function executeFunction(
  name: string,
  args: Record<string, unknown>
): Promise<FunctionResult> {
  try {
    switch (name) {
      // ─────────────────────────────────────────────────────────────────────
      // Task Handlers
      // ─────────────────────────────────────────────────────────────────────
      case 'getTasks': {
        const tasks = await db.fetchTasks(args.year as number);
        let filtered = tasks || [];

        if (args.month) {
          filtered = filtered.filter(t => t.month === args.month);
        }
        if (args.week) {
          filtered = filtered.filter(t => t.week === args.week);
        }

        return {
          success: true,
          data: filtered,
          message: `${filtered.length}개의 태스크를 찾았습니다.`,
        };
      }

      case 'createTask': {
        const task = await db.createTask({
          title: args.title as string,
          description: args.description as string,
          year: args.year as number,
          month: args.month as number,
          week: args.week as number,
          category: (args.category as TaskCategory) || 'operation',
          status: (args.status as TaskStatus) || 'pending',
          assignee: args.assignee as string,
          dueDate: args.dueDate as string,
        });

        return {
          success: !!task,
          data: task,
          message: task
            ? `태스크 "${args.title}"가 생성되었습니다.`
            : '태스크 생성에 실패했습니다.',
        };
      }

      case 'createMultipleTasks': {
        const tasksToCreate = args.tasks as Array<Record<string, unknown>>;
        const results: Task[] = [];

        for (const taskData of tasksToCreate) {
          const task = await db.createTask({
            title: taskData.title as string,
            description: taskData.description as string,
            year: taskData.year as number,
            month: taskData.month as number,
            week: taskData.week as number,
            category: (taskData.category as TaskCategory) || 'operation',
            status: (taskData.status as TaskStatus) || 'pending',
          });
          if (task) results.push(task);
        }

        return {
          success: results.length > 0,
          data: results,
          message: `${results.length}개의 태스크가 생성되었습니다.`,
        };
      }

      case 'updateTask': {
        const { id, ...updates } = args;
        const success = await db.updateTask(id as string, updates as Partial<Task>);

        return {
          success,
          message: success
            ? '태스크가 수정되었습니다.'
            : '태스크 수정에 실패했습니다.',
        };
      }

      case 'deleteTask': {
        const success = await db.deleteTask(args.id as string);

        return {
          success,
          message: success
            ? '태스크가 삭제되었습니다.'
            : '태스크 삭제에 실패했습니다.',
        };
      }

      // ─────────────────────────────────────────────────────────────────────
      // Issue Handlers
      // ─────────────────────────────────────────────────────────────────────
      case 'getIssues': {
        const issues = await db.fetchIssueItems(args.year as number);
        let filtered = issues || [];

        if (args.month) {
          filtered = filtered.filter(i => i.month === args.month);
        }
        if (args.status) {
          filtered = filtered.filter(i => i.status === args.status);
        }
        if (args.type) {
          filtered = filtered.filter(i => i.type === args.type);
        }

        return {
          success: true,
          data: filtered,
          message: `${filtered.length}개의 이슈를 찾았습니다.`,
        };
      }

      case 'createIssue': {
        const issue = await db.createIssueItem({
          title: args.title as string,
          description: args.description as string,
          year: args.year as number,
          month: args.month as number,
          type: (args.type as IssueType) || 'issue',
          priority: (args.priority as IssuePriority) || 'medium',
          impact: (args.impact as IssueImpact) || 'medium',
          status: (args.status as IssueStatus) || 'open',
          category: (args.category as TaskCategory) || 'operation',
          owner: args.owner as string,
          dueDate: args.dueDate as string,
        });

        return {
          success: !!issue,
          data: issue,
          message: issue
            ? `이슈 "${args.title}"가 생성되었습니다.`
            : '이슈 생성에 실패했습니다.',
        };
      }

      case 'updateIssue': {
        const { id: issueId, ...issueUpdates } = args;
        const issueSuccess = await db.updateIssueItem(issueId as string, issueUpdates as Partial<IssueItem>);

        return {
          success: issueSuccess,
          message: issueSuccess
            ? '이슈가 수정되었습니다.'
            : '이슈 수정에 실패했습니다.',
        };
      }

      case 'deleteIssue': {
        const issueDelSuccess = await db.deleteIssueItem(args.id as string);

        return {
          success: issueDelSuccess,
          message: issueDelSuccess
            ? '이슈가 삭제되었습니다.'
            : '이슈 삭제에 실패했습니다.',
        };
      }

      // ─────────────────────────────────────────────────────────────────────
      // Content Handlers
      // ─────────────────────────────────────────────────────────────────────
      case 'getContents': {
        const contents = await db.fetchContentItems(args.year as number);
        let filteredContents = contents || [];

        if (args.month) {
          filteredContents = filteredContents.filter(c => {
            const contentMonth = new Date(c.date).getMonth() + 1;
            return contentMonth === args.month;
          });
        }
        if (args.type) {
          filteredContents = filteredContents.filter(c => c.type === args.type);
        }

        return {
          success: true,
          data: filteredContents,
          message: `${filteredContents.length}개의 컨텐츠를 찾았습니다.`,
        };
      }

      case 'createContent': {
        const content = await db.createContentItem({
          title: args.title as string,
          description: args.description as string,
          year: args.year as number,
          type: (args.type as ContentType) || 'instagram',
          date: args.date as string,
          status: (args.status as ContentStatus) || 'draft',
        });

        return {
          success: !!content,
          data: content,
          message: content
            ? `컨텐츠 "${args.title}"가 생성되었습니다.`
            : '컨텐츠 생성에 실패했습니다.',
        };
      }

      case 'createMultipleContents': {
        const contentsToCreate = args.contents as Array<Record<string, unknown>>;
        const contentResults: ContentItem[] = [];

        for (const contentData of contentsToCreate) {
          const content = await db.createContentItem({
            title: contentData.title as string,
            description: contentData.description as string,
            year: contentData.year as number,
            type: (contentData.type as ContentType) || 'instagram',
            date: contentData.date as string,
            status: (contentData.status as ContentStatus) || 'draft',
          });
          if (content) contentResults.push(content);
        }

        return {
          success: contentResults.length > 0,
          data: contentResults,
          message: `${contentResults.length}개의 컨텐츠가 생성되었습니다.`,
        };
      }

      case 'updateContent': {
        const { id: contentId, ...contentUpdates } = args;
        const contentSuccess = await db.updateContentItem(contentId as string, contentUpdates as Partial<ContentItem>);

        return {
          success: contentSuccess,
          message: contentSuccess
            ? '컨텐츠가 수정되었습니다.'
            : '컨텐츠 수정에 실패했습니다.',
        };
      }

      case 'deleteContent': {
        const contentDelSuccess = await db.deleteContentItem(args.id as string);

        return {
          success: contentDelSuccess,
          message: contentDelSuccess
            ? '컨텐츠가 삭제되었습니다.'
            : '컨텐츠 삭제에 실패했습니다.',
        };
      }

      // ─────────────────────────────────────────────────────────────────────
      // Must-Do Handlers
      // ─────────────────────────────────────────────────────────────────────
      case 'getMustDoItems': {
        const mustDoItems = await db.fetchMustDoItems(args.year as number);
        let filtered = mustDoItems || [];

        if (args.month) {
          filtered = filtered.filter(m => m.month === args.month);
        }

        return {
          success: true,
          data: filtered,
          message: `${filtered.length}개의 필수 체크 항목을 찾았습니다.`,
        };
      }

      case 'createMustDoItem': {
        const mustDoItem = await db.createMustDoItem({
          title: args.title as string,
          year: args.year as number,
          month: args.month as number,
          category: (args.category as TaskCategory) || 'operation',
          done: (args.done as boolean) || false,
        });

        return {
          success: !!mustDoItem,
          data: mustDoItem,
          message: mustDoItem
            ? `필수 체크 항목 "${args.title}"가 생성되었습니다.`
            : '필수 체크 항목 생성에 실패했습니다.',
        };
      }

      case 'toggleMustDo': {
        const toggleSuccess = await db.toggleMustDo(args.id as string, args.done as boolean);

        return {
          success: toggleSuccess,
          message: toggleSuccess
            ? `필수 체크 항목이 ${args.done ? '완료' : '미완료'}로 변경되었습니다.`
            : '필수 체크 항목 상태 변경에 실패했습니다.',
        };
      }

      case 'updateMustDoItem': {
        const { id: mustDoId, ...mustDoUpdates } = args;
        const mustDoSuccess = await db.updateMustDoItem(mustDoId as string, mustDoUpdates as Partial<MustDoItem>);

        return {
          success: mustDoSuccess,
          message: mustDoSuccess
            ? '필수 체크 항목이 수정되었습니다.'
            : '필수 체크 항목 수정에 실패했습니다.',
        };
      }

      case 'deleteMustDoItem': {
        const mustDoDelSuccess = await db.deleteMustDoItem(args.id as string);

        return {
          success: mustDoDelSuccess,
          message: mustDoDelSuccess
            ? '필수 체크 항목이 삭제되었습니다.'
            : '필수 체크 항목 삭제에 실패했습니다.',
        };
      }

      // ─────────────────────────────────────────────────────────────────────
      // Budget Handlers
      // ─────────────────────────────────────────────────────────────────────
      case 'getBudgetItems': {
        const budgetItems = await db.fetchBudgetItems(args.year as number);
        let filteredBudget = budgetItems || [];

        if (args.month) {
          filteredBudget = filteredBudget.filter(b => b.month === args.month);
        }
        if (args.category) {
          filteredBudget = filteredBudget.filter(b => b.category === args.category);
        }

        return {
          success: true,
          data: filteredBudget,
          message: `${filteredBudget.length}개의 예산 항목을 찾았습니다.`,
        };
      }

      case 'createBudgetItem': {
        const budgetItem = await db.createBudgetItem({
          year: args.year as number,
          month: args.month as number,
          category: (args.category as BudgetCategory) || 'other',
          budgeted: args.budgeted as number,
          spent: 0,
          description: args.description as string,
        });

        return {
          success: !!budgetItem,
          data: budgetItem,
          message: budgetItem
            ? `예산 항목이 생성되었습니다. (${args.category}: ${(args.budgeted as number).toLocaleString()}원)`
            : '예산 항목 생성에 실패했습니다.',
        };
      }

      case 'updateBudgetItem': {
        const { id: budgetId, ...budgetUpdates } = args;
        const budgetSuccess = await db.updateBudgetItem(budgetId as string, budgetUpdates as Partial<BudgetItem>);

        return {
          success: budgetSuccess,
          message: budgetSuccess
            ? '예산 항목이 수정되었습니다.'
            : '예산 항목 수정에 실패했습니다.',
        };
      }

      case 'deleteBudgetItem': {
        const budgetDelSuccess = await db.deleteBudgetItem(args.id as string);

        return {
          success: budgetDelSuccess,
          message: budgetDelSuccess
            ? '예산 항목이 삭제되었습니다.'
            : '예산 항목 삭제에 실패했습니다.',
        };
      }

      // ─────────────────────────────────────────────────────────────────────
      // Expense Handlers
      // ─────────────────────────────────────────────────────────────────────
      case 'getExpenseItems': {
        const expenseItems = await db.fetchExpenseItems(args.year as number, args.month as number);

        return {
          success: true,
          data: expenseItems || [],
          message: `${(expenseItems || []).length}개의 지출 내역을 찾았습니다.`,
        };
      }

      case 'createExpenseItem': {
        const expenseItem = await db.createExpenseItem({
          year: args.year as number,
          month: args.month as number,
          category: (args.category as BudgetCategory) || 'other',
          amount: args.amount as number,
          description: args.description as string,
          vendor: args.vendor as string,
          date: args.date as string,
          notes: args.notes as string,
        });

        return {
          success: !!expenseItem,
          data: expenseItem,
          message: expenseItem
            ? `지출 내역이 등록되었습니다. (${(args.amount as number).toLocaleString()}원)`
            : '지출 내역 등록에 실패했습니다.',
        };
      }

      case 'updateExpenseItem': {
        const { id: expenseId, ...expenseUpdates } = args;
        const expenseSuccess = await db.updateExpenseItem(expenseId as string, expenseUpdates as Partial<ExpenseItem>);

        return {
          success: expenseSuccess,
          message: expenseSuccess
            ? '지출 내역이 수정되었습니다.'
            : '지출 내역 수정에 실패했습니다.',
        };
      }

      case 'deleteExpenseItem': {
        const expenseDelSuccess = await db.deleteExpenseItem(args.id as string);

        return {
          success: expenseDelSuccess,
          message: expenseDelSuccess
            ? '지출 내역이 삭제되었습니다.'
            : '지출 내역 삭제에 실패했습니다.',
        };
      }

      // ─────────────────────────────────────────────────────────────────────
      // Inventory - Numbered Bottles Handlers
      // ─────────────────────────────────────────────────────────────────────
      case 'getNumberedBottles': {
        const dbBottles = await db.fetchNumberedBottles();
        if (!dbBottles) {
          return {
            success: false,
            message: '넘버링 병 데이터를 불러올 수 없습니다.',
          };
        }

        let bottles = dbBottles.map(db.mapDbBottleToBottle);

        // 필터링
        if (args.status) {
          bottles = bottles.filter(b => b.status === args.status);
        }
        if (args.bottleNumber) {
          bottles = bottles.filter(b => b.bottleNumber === args.bottleNumber);
        }

        // 상태별 통계
        const stats = {
          available: bottles.filter(b => b.status === 'available').length,
          reserved: bottles.filter(b => b.status === 'reserved').length,
          sold: bottles.filter(b => b.status === 'sold').length,
          gifted: bottles.filter(b => b.status === 'gifted').length,
          damaged: bottles.filter(b => b.status === 'damaged').length,
        };

        return {
          success: true,
          data: { bottles, stats, total: dbBottles.length },
          message: `2025 퍼스트 에디션 넘버링 병 현황: 총 ${dbBottles.length}병 (판매가능: ${stats.available}, 예약: ${stats.reserved}, 판매완료: ${stats.sold}, 증정: ${stats.gifted}, 손상: ${stats.damaged})`,
        };
      }

      case 'updateNumberedBottle': {
        const dbBottles = await db.fetchNumberedBottles();
        if (!dbBottles) {
          return { success: false, message: '넘버링 병 데이터를 불러올 수 없습니다.' };
        }

        const targetBottle = dbBottles.find(b => b.bottle_number === args.bottleNumber);
        if (!targetBottle) {
          return { success: false, message: `${args.bottleNumber}번 병을 찾을 수 없습니다.` };
        }

        const updates: Record<string, unknown> = {
          status: args.status as InventoryStatus,
        };
        if (args.reservedFor !== undefined) updates.reserved_for = args.reservedFor;
        if (args.soldTo !== undefined) updates.sold_to = args.soldTo;
        if (args.price !== undefined) updates.price = args.price;
        if (args.notes !== undefined) updates.notes = args.notes;

        const success = await db.updateNumberedBottle(targetBottle.id, updates);

        return {
          success,
          message: success
            ? `${args.bottleNumber}번 병 상태가 '${args.status}'로 업데이트되었습니다.`
            : '넘버링 병 업데이트에 실패했습니다.',
        };
      }

      // ─────────────────────────────────────────────────────────────────────
      // Inventory - Batches Handlers
      // ─────────────────────────────────────────────────────────────────────
      case 'getInventoryBatches': {
        const dbBatches = await db.fetchInventoryBatches();
        if (!dbBatches) {
          return {
            success: false,
            message: '재고 배치 데이터를 불러올 수 없습니다.',
          };
        }

        let batches = dbBatches.map(db.mapDbBatchToBatch);

        if (args.productId) {
          batches = batches.filter(b => b.productId === args.productId);
        }

        // 제품명 매핑
        const productNames: Record<string, string> = {
          'en_lieu_sur_brut': '앙 리유 쉬르 브뤼 (750ml)',
          'en_lieu_sur_magnum': '앙 리유 쉬르 매그넘 (1500ml)',
          'element_de_surprise': '엘레멘 드 쉬르프리즈 BDB (750ml)',
          'atomes_crochus': '아톰 크로슈 (750ml)',
        };

        const batchSummary = batches.map(b => ({
          ...b,
          productName: productNames[b.productId] || b.productId,
          total: b.available + b.reserved + b.sold + b.gifted + b.damaged,
        }));

        return {
          success: true,
          data: batchSummary,
          message: `${batches.length}개 제품의 재고 현황을 조회했습니다.`,
        };
      }

      case 'updateInventoryBatch': {
        const updates: Record<string, unknown> = {};
        if (args.available !== undefined) updates.available = args.available;
        if (args.reserved !== undefined) updates.reserved = args.reserved;
        if (args.sold !== undefined) updates.sold = args.sold;
        if (args.gifted !== undefined) updates.gifted = args.gifted;
        if (args.damaged !== undefined) updates.damaged = args.damaged;

        const batchSuccess = await db.updateInventoryBatch(args.productId as string, updates);

        return {
          success: batchSuccess,
          message: batchSuccess
            ? `${args.productId} 재고가 업데이트되었습니다.`
            : '재고 업데이트에 실패했습니다.',
        };
      }

      // ─────────────────────────────────────────────────────────────────────
      // Inventory - Transactions Handlers
      // ─────────────────────────────────────────────────────────────────────
      case 'getInventoryTransactions': {
        const limit = (args.limit as number) || 50;
        const dbTransactions = await db.fetchInventoryTransactions(limit);
        if (!dbTransactions) {
          return {
            success: false,
            message: '거래 내역을 불러올 수 없습니다.',
          };
        }

        let transactions = dbTransactions.map(db.mapDbTransactionToTransaction);

        if (args.productId) {
          transactions = transactions.filter(t => t.productId === args.productId);
        }
        if (args.type) {
          transactions = transactions.filter(t => t.type === args.type);
        }

        // 거래 유형 한글화
        const typeNames: Record<string, string> = {
          'sale': '판매',
          'reservation': '예약',
          'gift': '증정',
          'damage': '손상',
          'return': '반품',
          'cancel_reservation': '예약취소',
        };

        const transactionSummary = transactions.map(t => ({
          ...t,
          typeName: typeNames[t.type] || t.type,
        }));

        return {
          success: true,
          data: transactionSummary,
          message: `${transactions.length}건의 거래 내역을 조회했습니다.`,
        };
      }

      case 'createInventoryTransaction': {
        const transaction = await db.createInventoryTransaction({
          id: crypto.randomUUID(),
          product_id: args.productId as string,
          bottle_number: args.bottleNumber as number || null,
          type: args.type as 'sale' | 'reservation' | 'gift' | 'damage' | 'return' | 'cancel_reservation',
          quantity: args.quantity as number,
          customer_name: args.customerName as string || null,
          price: args.price as number || null,
          notes: args.notes as string || null,
        });

        const typeNames: Record<string, string> = {
          'sale': '판매',
          'reservation': '예약',
          'gift': '증정',
          'damage': '손상',
          'return': '반품',
          'cancel_reservation': '예약취소',
        };

        return {
          success: !!transaction,
          data: transaction,
          message: transaction
            ? `${typeNames[args.type as string] || args.type} 거래가 기록되었습니다.`
            : '거래 기록에 실패했습니다.',
        };
      }

      // ─────────────────────────────────────────────────────────────────────
      // Inventory - Custom Products Handlers
      // ─────────────────────────────────────────────────────────────────────
      case 'getCustomProducts': {
        const dbProducts = await db.fetchCustomProducts();
        if (!dbProducts) {
          return {
            success: false,
            message: '커스텀 제품 목록을 불러올 수 없습니다.',
          };
        }

        const products = dbProducts.map(db.mapDbCustomProductToProduct);

        return {
          success: true,
          data: products,
          message: products.length > 0
            ? `${products.length}개의 커스텀 제품이 등록되어 있습니다.`
            : '등록된 커스텀 제품이 없습니다.',
        };
      }

      case 'createCustomProduct': {
        const product = await db.createCustomProduct({
          id: crypto.randomUUID(),
          name: args.name as string,
          name_ko: args.nameKo as string,
          year: args.year as number,
          size: args.size as string,
          total_quantity: args.totalQuantity as number,
          description: args.description as string || null,
        });

        return {
          success: !!product,
          data: product,
          message: product
            ? `커스텀 제품 "${args.nameKo}"가 추가되었습니다.`
            : '커스텀 제품 추가에 실패했습니다.',
        };
      }

      case 'deleteCustomProduct': {
        const deleteSuccess = await db.deleteCustomProduct(args.id as string);

        return {
          success: deleteSuccess,
          message: deleteSuccess
            ? '커스텀 제품이 삭제되었습니다.'
            : '커스텀 제품 삭제에 실패했습니다.',
        };
      }

      default:
        return {
          success: false,
          message: `알 수 없는 함수: ${name}`,
        };
    }
  } catch (error) {
    console.error(`Function execution error (${name}):`, error);
    return {
      success: false,
      message: `함수 실행 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// System Prompt
// ═══════════════════════════════════════════════════════════════════════════

export const SYSTEM_PROMPT = `당신은 뮤즈드마레(Muse de Marée) 마케팅 팀의 AI 어시스턴트입니다.
뮤즈드마레는 프랑스 해저에서 숙성된 럭셔리 샴페인 브랜드로, 2026년 그랜드 런칭을 준비하고 있습니다.

═══════════════════════════════════════════════════════════════════════════
홈페이지 메뉴 & 페이지 용어 매핑 (사용자가 이 용어로 질문할 수 있음)
═══════════════════════════════════════════════════════════════════════════

1. 대시보드 (/) - 홈, 메인, 진행률, 런칭까지, 전체현황, 페이즈(Phase), 마일스톤
   → 조회만 가능 (데이터는 각 영역에서 관리)

2. 월별플랜 (/monthly-plan) - 월별 플랜, 월간 계획, 태스크, 업무, 할일, 주간 업무
   → getTasks, createTask, updateTask, deleteTask
   - "이번 주 할일", "1월 업무", "마케팅 태스크" 등의 질문에 대응

3. 이슈관리 (/issues) - 이슈, 리스크, 의사결정, 위험요소, 문제점, 결정사항
   → getIssues, createIssue, updateIssue, deleteIssue
   - "긴급 이슈", "리스크 현황", "결정해야 할 사항" 등의 질문에 대응

4. 캘린더 (/calendar) - 캘린더, 컨텐츠 캘린더, 컨텐츠 일정, SNS 일정, 포스팅 일정
   → getContents, createContent, updateContent, deleteContent
   - "인스타그램 일정", "이번 달 컨텐츠", "유튜브 업로드" 등의 질문에 대응

5. KPI (/kpi) - KPI, 목표, 성과지표, 팔로워, 구독자, 성과
   → 현재 조회 기능만 제공 (향후 확장 가능)

6. 재고관리 (/inventory) - 재고, 인벤토리, 병, 넘버링, 판매현황, 재고현황
   → getNumberedBottles, updateNumberedBottle (2025 퍼스트 에디션)
   → getInventoryBatches, updateInventoryBatch (2026 제품)
   → getInventoryTransactions, createInventoryTransaction (거래 내역)
   → getCustomProducts, createCustomProduct, deleteCustomProduct (커스텀 제품)
   - "넘버링 병 현황", "몇 병 남았어", "판매 기록", "예약 현황" 등의 질문에 대응

7. 예산관리 (/budget) - 예산, 지출, 비용, 경비, 돈, 예산현황, 지출내역
   → getBudgetItems, createBudgetItem, updateBudgetItem, deleteBudgetItem (예산)
   → getExpenseItems, createExpenseItem, updateExpenseItem, deleteExpenseItem (지출)
   - "이번 달 예산", "마케팅 비용", "지출 내역", "남은 예산" 등의 질문에 대응

8. 필수 체크 (월별플랜 페이지 내) - 필수 체크, Must-Do, 체크리스트, 꼭 해야할 것
   → getMustDoItems, createMustDoItem, toggleMustDo, updateMustDoItem, deleteMustDoItem
   - "필수 체크 목록", "꼭 해야 할 일", "체크리스트 현황" 등의 질문에 대응

═══════════════════════════════════════════════════════════════════════════
데이터 구조
═══════════════════════════════════════════════════════════════════════════

연도/월/주차:
- 연도(year): 2025, 2026, 2027, 2028
- 월(month): 1-12
- 주차(week): 1-4 (태스크만 해당)

태스크:
- 카테고리: operation(운영), marketing(마케팅), design(디자인), filming(촬영), pr(PR), b2b(B2B)
- 상태: pending(대기), in_progress(진행중), done(완료)

이슈:
- 유형: issue(이슈), risk(리스크), decision(의사결정)
- 우선순위: low(낮음), medium(보통), high(높음), critical(긴급)
- 영향도: low(낮음), medium(보통), high(높음)
- 상태: open(미해결), in_progress(처리중), resolved(해결됨), closed(종료)

컨텐츠:
- 유형: instagram(인스타그램), youtube(유튜브), blog(블로그), newsletter(뉴스레터), press(보도자료)
- 상태: draft(초안), scheduled(예정), published(게시완료)

예산:
- 카테고리: marketing(마케팅), operation(운영), design(디자인), filming(촬영), pr(PR), b2b(B2B), packaging(패키징), event(이벤트), other(기타)

인벤토리 제품:
- first_edition: 2025 퍼스트 에디션 (750ml, 넘버링 1-50번)
- en_lieu_sur_brut: 앙 리유 쉬르 브뤼 (750ml)
- en_lieu_sur_magnum: 앙 리유 쉬르 매그넘 (1500ml)
- element_de_surprise: 엘레멘 드 쉬르프리즈 BDB (750ml)
- atomes_crochus: 아톰 크로슈 (750ml)

재고 상태: available(판매가능), reserved(예약), sold(판매완료), gifted(증정), damaged(손상)
거래 유형: sale(판매), reservation(예약), gift(증정), damage(손상), return(반품), cancel_reservation(예약취소)

═══════════════════════════════════════════════════════════════════════════
응답 가이드라인
═══════════════════════════════════════════════════════════════════════════

응답 스타일:
- 한국어로 친절하고 간결하게 응답
- 데이터 조회 시 깔끔하게 정리해서 보여주기
- 작업 완료 시 명확한 확인 메시지 제공
- 다중 항목 작업 시 개수와 내용 요약
- 금액 표시 시 원화(₩) 단위로 표시하고 천 단위 쉼표 사용

주의사항:
- 사용자가 명확한 정보를 제공하지 않으면 확인 질문하기
- 삭제 작업은 신중하게 확인 후 진행
- 날짜 형식은 YYYY-MM-DD 사용
- 예산/지출 관련 금액은 원(₩) 단위로 처리
- 재고 변경 시 거래 내역도 함께 기록하도록 안내

용어 해석 예시:
- "이번 달 할일" → 현재 월의 태스크 조회 (getTasks)
- "긴급한 거 뭐 있어?" → critical 우선순위 이슈 조회 (getIssues)
- "인스타 일정" → instagram 타입 컨텐츠 조회 (getContents)
- "예산 얼마 남았어?" → 예산 및 지출 현황 조회 (getBudgetItems, getExpenseItems)
- "넘버링 몇 번까지 팔렸어?" → 판매완료 상태 넘버링 병 조회 (getNumberedBottles)
- "체크리스트 현황" → Must-Do 항목 조회 (getMustDoItems)`;
