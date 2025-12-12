import { Task, MustDoItem, KPIItem, ContentItem } from '@/lib/types';

// ═══════════════════════════════════════════════════════════════════════════
// 초기 업무 데이터
// ═══════════════════════════════════════════════════════════════════════════

export const INITIAL_TASKS: Task[] = [
  // 1월 - 기반 구축의 달
  // 1주차
  { id: 'jan-1-1', title: '샴페인 입고 검수', description: '수량 확인, 상태 점검, 로트 번호 기록', month: 1, week: 1, category: 'operation', status: 'done', deliverables: ['입고 리포트'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'jan-1-2', title: '숙성 장소 최종 점검', description: '해저 케이지 상태, 모니터링 시스템 확인', month: 1, week: 1, category: 'operation', status: 'done', deliverables: ['모니터링 시스템 가동'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'jan-1-3', title: '촬영 사전 답사', description: '수중 촬영 포인트, 조명 테스트', month: 1, week: 1, category: 'filming', status: 'pending', deliverables: ['촬영 콘티'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'jan-1-4', title: '디자인 에이전시 킥오프', description: '브랜드 아이덴티티 방향 논의', month: 1, week: 1, category: 'design', status: 'pending', deliverables: ['디자인 브리프 문서'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },

  // 2주차
  { id: 'jan-2-1', title: '해저 입수 진행', description: '케이지 최종 투하, GPS 좌표 기록', month: 1, week: 2, category: 'operation', status: 'pending', deliverables: ['GPS 좌표', '입수 기록서'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'jan-2-2', title: '다큐 촬영 (수중)', description: '입수 과정 전체 촬영', month: 1, week: 2, category: 'filming', status: 'pending', deliverables: ['원본 영상 소스'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'jan-2-3', title: '다큐 촬영 (지상)', description: '팀 인터뷰, 준비 과정', month: 1, week: 2, category: 'filming', status: 'pending', deliverables: ['원본 영상 소스'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'jan-2-4', title: '스틸 촬영', description: '제품, 현장 스틸컷', month: 1, week: 2, category: 'filming', status: 'pending', deliverables: ['원본 사진 소스'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },

  // 3주차
  { id: 'jan-3-1', title: '로고 시안 1차 수령', description: '디자인 에이전시로부터 초안 수령', month: 1, week: 3, category: 'design', status: 'pending', deliverables: ['로고 시안 3종'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'jan-3-2', title: '로고 내부 검토', description: '팀 피드백 취합', month: 1, week: 3, category: 'design', status: 'pending', deliverables: ['피드백 문서'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },

  // 4주차
  { id: 'jan-4-1', title: '영상 1차 편집본 확인', description: '러프컷 리뷰', month: 1, week: 4, category: 'filming', status: 'pending', deliverables: ['편집 피드백'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'jan-4-2', title: '월간 리뷰 미팅', description: '1월 성과 점검, 2월 계획 확정', month: 1, week: 4, category: 'operation', status: 'pending', deliverables: ['월간 리포트'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },

  // 2월 - 브랜드 구축의 달
  { id: 'feb-1-1', title: '브랜드 로고 최종 확정', description: '최종 선정 및 가이드라인 수립', month: 2, week: 1, category: 'design', status: 'pending', deliverables: ['로고 파일', 'BI 가이드라인'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'feb-1-2', title: '패키지 디자인 시작', description: '박스, 라벨, 포장재 디자인', month: 2, week: 1, category: 'design', status: 'pending', deliverables: ['패키지 시안'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'feb-2-1', title: '제품 스튜디오 촬영', description: '상세 페이지용 제품컷', month: 2, week: 2, category: 'filming', status: 'pending', deliverables: ['제품 이미지'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'feb-2-2', title: 'SNS 채널 개설', description: '인스타그램, 유튜브 계정 생성', month: 2, week: 2, category: 'marketing', status: 'pending', deliverables: ['채널 URL'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'feb-3-1', title: '홈페이지 기획/디자인', description: '와이어프레임, UI 디자인', month: 2, week: 3, category: 'design', status: 'pending', deliverables: ['웹 디자인 시안'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'feb-4-1', title: '뉴스레터 시스템 구축', description: '스티비 연동, 템플릿 제작', month: 2, week: 4, category: 'marketing', status: 'pending', deliverables: ['뉴스레터 템플릿'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },

  // 3월 - 콘텐츠 본격화의 달
  { id: 'mar-1-1', title: '브랜드 필름 최종 완성', description: '색보정, 사운드 믹싱 완료', month: 3, week: 1, category: 'filming', status: 'pending', deliverables: ['브랜드 필름'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'mar-2-1', title: '브랜드 필름 공개', description: '유튜브, SNS 동시 공개', month: 3, week: 2, category: 'marketing', status: 'pending', deliverables: ['공개 링크'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'mar-3-1', title: '숙성일지 콘텐츠 시작', description: '주간 업데이트 콘텐츠 시리즈', month: 3, week: 3, category: 'marketing', status: 'pending', deliverables: ['숙성일지 #1'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'mar-4-1', title: '첫 번째 뉴스레터 발송', description: '구독자 대상 브랜드 스토리 소개', month: 3, week: 4, category: 'marketing', status: 'pending', deliverables: ['뉴스레터 Vol.1'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },

  // 4월 - 시딩의 달
  { id: 'apr-1-1', title: '인플루언서 리스트업', description: '와인/라이프스타일 인플루언서 선정', month: 4, week: 1, category: 'marketing', status: 'pending', deliverables: ['인플루언서 리스트'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'apr-2-1', title: 'VIP 프리뷰 초대장 발송', description: '타겟 VIP 초대', month: 4, week: 2, category: 'marketing', status: 'pending', deliverables: ['초대장'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'apr-3-1', title: '시딩 키트 제작', description: '체험용 키트 패키징', month: 4, week: 3, category: 'marketing', status: 'pending', deliverables: ['시딩 키트'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'apr-4-1', title: '인플루언서 시딩 시작', description: '키트 발송 및 협업 진행', month: 4, week: 4, category: 'marketing', status: 'pending', deliverables: ['시딩 리포트'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },

  // 5월 - PR 본격화의 달
  { id: 'may-1-1', title: '보도자료 배포', description: '주요 매체 배포', month: 5, week: 1, category: 'pr', status: 'pending', deliverables: ['보도자료'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'may-2-1', title: '미디어 인터뷰 진행', description: '매거진/신문 인터뷰', month: 5, week: 2, category: 'pr', status: 'pending', deliverables: ['인터뷰 기사'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'may-3-1', title: 'B2B 영업 시작', description: '호텔/레스토랑 미팅', month: 5, week: 3, category: 'b2b', status: 'pending', deliverables: ['미팅 리포트'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'may-4-1', title: '인양 D-30 카운트다운', description: 'SNS 카운트다운 콘텐츠', month: 5, week: 4, category: 'marketing', status: 'pending', deliverables: ['카운트다운 콘텐츠'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },

  // 6월 - 인양의 달
  { id: 'jun-1-1', title: '인양 이벤트 준비', description: '현장 셋업, 장비 점검', month: 6, week: 1, category: 'operation', status: 'pending', deliverables: ['이벤트 체크리스트'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'jun-2-1', title: '인양 D-Day', description: '해저 인양 진행', month: 6, week: 2, category: 'operation', status: 'pending', deliverables: ['인양 기록'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'jun-2-2', title: '인양 라이브 중계', description: '유튜브/인스타 라이브', month: 6, week: 2, category: 'marketing', status: 'pending', deliverables: ['라이브 영상'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'jun-3-1', title: '인양 후 미디어 데이', description: '기자 간담회', month: 6, week: 3, category: 'pr', status: 'pending', deliverables: ['기자간담회 리포트'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'jun-4-1', title: '인양 다큐 편집', description: '인양 과정 다큐멘터리 제작', month: 6, week: 4, category: 'filming', status: 'pending', deliverables: ['인양 다큐'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },

  // 7월 - 런칭 준비의 달
  { id: 'jul-1-1', title: '팝업 스토어 장소 확정', description: '성수/청담 지역 물색', month: 7, week: 1, category: 'operation', status: 'pending', deliverables: ['계약서'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'jul-2-1', title: '팝업 스토어 공간 디자인', description: '인테리어 설계', month: 7, week: 2, category: 'design', status: 'pending', deliverables: ['공간 디자인'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'jul-3-1', title: '런칭 파티 기획', description: '이벤트 프로그램 구성', month: 7, week: 3, category: 'marketing', status: 'pending', deliverables: ['파티 기획안'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'jul-4-1', title: '최종 리허설', description: '런칭 전 전체 점검', month: 7, week: 4, category: 'operation', status: 'pending', deliverables: ['체크리스트'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },

  // 8월 - 런칭의 달
  { id: 'aug-1-1', title: '그랜드 런칭 파티', description: 'VIP 런칭 이벤트', month: 8, week: 1, category: 'marketing', status: 'pending', deliverables: ['이벤트 리포트'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'aug-1-2', title: '판매 시작', description: '온라인/오프라인 동시 오픈', month: 8, week: 1, category: 'operation', status: 'pending', deliverables: ['판매 리포트'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'aug-2-1', title: '팝업 스토어 운영', description: '2주간 운영', month: 8, week: 2, category: 'operation', status: 'pending', deliverables: ['운영 리포트'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'aug-3-1', title: '런칭 후 PR', description: '런칭 기사 배포', month: 8, week: 3, category: 'pr', status: 'pending', deliverables: ['기사 클리핑'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'aug-4-1', title: '런칭 리뷰 & 회고', description: '성과 분석, 향후 계획', month: 8, week: 4, category: 'operation', status: 'pending', deliverables: ['런칭 리포트'], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
];

// ═══════════════════════════════════════════════════════════════════════════
// Must-Do 체크리스트
// ═══════════════════════════════════════════════════════════════════════════

export const INITIAL_MUST_DO: MustDoItem[] = [
  // 1월
  { id: 'must-1-1', month: 1, title: '샴페인 입고 및 검수 완료', done: true },
  { id: 'must-1-2', month: 1, title: '해저 입수 완료 & 좌표 기록', done: false },
  { id: 'must-1-3', month: 1, title: '입수 과정 영상/사진 촬영 완료', done: false },
  { id: 'must-1-4', month: 1, title: '디자인 에이전시 계약 & 킥오프', done: false },
  { id: 'must-1-5', month: 1, title: '브랜드 로고 시안 1차 수령', done: false },

  // 2월
  { id: 'must-2-1', month: 2, title: '브랜드 로고 최종 확정', done: false },
  { id: 'must-2-2', month: 2, title: '패키지 디자인 확정 & 발주', done: false },
  { id: 'must-2-3', month: 2, title: '제품 스튜디오 촬영 완료', done: false },
  { id: 'must-2-4', month: 2, title: '홈페이지 기획/디자인 완료', done: false },
  { id: 'must-2-5', month: 2, title: 'SNS 채널 개설 & 프로필 세팅', done: false },

  // 3월
  { id: 'must-3-1', month: 3, title: '브랜드 필름 최종 완성 & 공개', done: false },
  { id: 'must-3-2', month: 3, title: '숙성일지 콘텐츠 시리즈 시작', done: false },
  { id: 'must-3-3', month: 3, title: '첫 번째 뉴스레터 발송', done: false },
  { id: 'must-3-4', month: 3, title: '홈페이지 오픈', done: false },

  // 4월
  { id: 'must-4-1', month: 4, title: '인플루언서 시딩 시작', done: false },
  { id: 'must-4-2', month: 4, title: 'VIP 프리뷰 이벤트 진행', done: false },
  { id: 'must-4-3', month: 4, title: '시딩 키트 100개 발송', done: false },

  // 5월
  { id: 'must-5-1', month: 5, title: '주요 매체 보도자료 배포', done: false },
  { id: 'must-5-2', month: 5, title: '미디어 인터뷰 3건 이상', done: false },
  { id: 'must-5-3', month: 5, title: 'B2B 미팅 10건 이상', done: false },
  { id: 'must-5-4', month: 5, title: '인양 D-30 카운트다운 시작', done: false },

  // 6월
  { id: 'must-6-1', month: 6, title: '인양 D-Day 성공적 진행', done: false },
  { id: 'must-6-2', month: 6, title: '인양 라이브 중계', done: false },
  { id: 'must-6-3', month: 6, title: '기자 간담회 개최', done: false },
  { id: 'must-6-4', month: 6, title: '인양 다큐 편집 완료', done: false },

  // 7월
  { id: 'must-7-1', month: 7, title: '팝업 스토어 장소 계약', done: false },
  { id: 'must-7-2', month: 7, title: '런칭 파티 기획 완료', done: false },
  { id: 'must-7-3', month: 7, title: '팝업 스토어 인테리어 완성', done: false },
  { id: 'must-7-4', month: 7, title: 'B2B 계약 5건 이상', done: false },

  // 8월
  { id: 'must-8-1', month: 8, title: '그랜드 런칭 파티 성공적 개최', done: false },
  { id: 'must-8-2', month: 8, title: '온/오프라인 판매 시작', done: false },
  { id: 'must-8-3', month: 8, title: '팝업 스토어 2주 운영', done: false },
  { id: 'must-8-4', month: 8, title: '런칭 성과 리포트 작성', done: false },
];

// ═══════════════════════════════════════════════════════════════════════════
// KPI 데이터
// ═══════════════════════════════════════════════════════════════════════════

export const INITIAL_KPI: KPIItem[] = [
  // 1월
  { id: 'kpi-1-insta', month: 1, category: 'instagram', metric: '팔로워', current: 500, target: 1000 },
  { id: 'kpi-1-youtube', month: 1, category: 'youtube', metric: '구독자', current: 200, target: 500 },
  { id: 'kpi-1-newsletter', month: 1, category: 'newsletter', metric: '구독자', current: 100, target: 200 },
  { id: 'kpi-1-website', month: 1, category: 'website', metric: '방문자', current: 1000, target: 2000 },
  { id: 'kpi-1-press', month: 1, category: 'press', metric: '보도건수', current: 0, target: 2 },
  { id: 'kpi-1-b2b', month: 1, category: 'b2b', metric: '리드', current: 5, target: 10 },

  // 2월
  { id: 'kpi-2-insta', month: 2, category: 'instagram', metric: '팔로워', current: 0, target: 1500 },
  { id: 'kpi-2-youtube', month: 2, category: 'youtube', metric: '구독자', current: 0, target: 700 },
  { id: 'kpi-2-newsletter', month: 2, category: 'newsletter', metric: '구독자', current: 0, target: 300 },
  { id: 'kpi-2-website', month: 2, category: 'website', metric: '방문자', current: 0, target: 3000 },
  { id: 'kpi-2-press', month: 2, category: 'press', metric: '보도건수', current: 0, target: 3 },
  { id: 'kpi-2-b2b', month: 2, category: 'b2b', metric: '리드', current: 0, target: 15 },

  // 3월
  { id: 'kpi-3-insta', month: 3, category: 'instagram', metric: '팔로워', current: 0, target: 2000 },
  { id: 'kpi-3-youtube', month: 3, category: 'youtube', metric: '구독자', current: 0, target: 1000 },
  { id: 'kpi-3-newsletter', month: 3, category: 'newsletter', metric: '구독자', current: 0, target: 400 },
  { id: 'kpi-3-website', month: 3, category: 'website', metric: '방문자', current: 0, target: 5000 },
  { id: 'kpi-3-press', month: 3, category: 'press', metric: '보도건수', current: 0, target: 5 },
  { id: 'kpi-3-b2b', month: 3, category: 'b2b', metric: '리드', current: 0, target: 20 },

  // 4월
  { id: 'kpi-4-insta', month: 4, category: 'instagram', metric: '팔로워', current: 0, target: 2500 },
  { id: 'kpi-4-youtube', month: 4, category: 'youtube', metric: '구독자', current: 0, target: 1500 },
  { id: 'kpi-4-newsletter', month: 4, category: 'newsletter', metric: '구독자', current: 0, target: 500 },
  { id: 'kpi-4-website', month: 4, category: 'website', metric: '방문자', current: 0, target: 7000 },
  { id: 'kpi-4-press', month: 4, category: 'press', metric: '보도건수', current: 0, target: 7 },
  { id: 'kpi-4-b2b', month: 4, category: 'b2b', metric: '미팅', current: 0, target: 15 },

  // 5월
  { id: 'kpi-5-insta', month: 5, category: 'instagram', metric: '팔로워', current: 0, target: 3000 },
  { id: 'kpi-5-youtube', month: 5, category: 'youtube', metric: '구독자', current: 0, target: 2000 },
  { id: 'kpi-5-newsletter', month: 5, category: 'newsletter', metric: '구독자', current: 0, target: 600 },
  { id: 'kpi-5-website', month: 5, category: 'website', metric: '방문자', current: 0, target: 10000 },
  { id: 'kpi-5-press', month: 5, category: 'press', metric: '보도건수', current: 0, target: 10 },
  { id: 'kpi-5-b2b', month: 5, category: 'b2b', metric: '미팅', current: 0, target: 20 },

  // 6월
  { id: 'kpi-6-insta', month: 6, category: 'instagram', metric: '팔로워', current: 0, target: 4000 },
  { id: 'kpi-6-youtube', month: 6, category: 'youtube', metric: '구독자', current: 0, target: 3000 },
  { id: 'kpi-6-newsletter', month: 6, category: 'newsletter', metric: '구독자', current: 0, target: 700 },
  { id: 'kpi-6-website', month: 6, category: 'website', metric: '방문자', current: 0, target: 15000 },
  { id: 'kpi-6-press', month: 6, category: 'press', metric: '보도건수', current: 0, target: 15 },
  { id: 'kpi-6-b2b', month: 6, category: 'b2b', metric: '계약', current: 0, target: 5 },

  // 7월
  { id: 'kpi-7-insta', month: 7, category: 'instagram', metric: '팔로워', current: 0, target: 4500 },
  { id: 'kpi-7-youtube', month: 7, category: 'youtube', metric: '구독자', current: 0, target: 3500 },
  { id: 'kpi-7-newsletter', month: 7, category: 'newsletter', metric: '구독자', current: 0, target: 800 },
  { id: 'kpi-7-website', month: 7, category: 'website', metric: '방문자', current: 0, target: 20000 },
  { id: 'kpi-7-press', month: 7, category: 'press', metric: '보도건수', current: 0, target: 18 },
  { id: 'kpi-7-b2b', month: 7, category: 'b2b', metric: '계약', current: 0, target: 10 },

  // 8월
  { id: 'kpi-8-insta', month: 8, category: 'instagram', metric: '팔로워', current: 0, target: 5000 },
  { id: 'kpi-8-youtube', month: 8, category: 'youtube', metric: '구독자', current: 0, target: 4000 },
  { id: 'kpi-8-newsletter', month: 8, category: 'newsletter', metric: '구독자', current: 0, target: 1000 },
  { id: 'kpi-8-website', month: 8, category: 'website', metric: '방문자', current: 0, target: 30000 },
  { id: 'kpi-8-press', month: 8, category: 'press', metric: '보도건수', current: 0, target: 20 },
  { id: 'kpi-8-b2b', month: 8, category: 'b2b', metric: '계약', current: 0, target: 15 },
];

// ═══════════════════════════════════════════════════════════════════════════
// 콘텐츠 캘린더 데이터
// ═══════════════════════════════════════════════════════════════════════════

export const INITIAL_CONTENT: ContentItem[] = [
  // 1월 - 기반 구축
  { id: 'content-1-1', type: 'instagram', title: '프로젝트 시작 티저', description: '해저 숙성 프로젝트 시작 알림', date: '2026-01-10', status: 'scheduled' },
  { id: 'content-1-2', type: 'blog', title: '해저 숙성의 과학', description: '해저 숙성이 샴페인에 미치는 영향', date: '2026-01-15', status: 'draft' },
  { id: 'content-1-3', type: 'youtube', title: '입수 과정 비하인드', description: '해저 입수 다큐멘터리 예고편', date: '2026-01-20', status: 'draft' },

  // 2월 - 브랜드 구축
  { id: 'content-2-1', type: 'instagram', title: '브랜드 로고 공개', description: '뮤즈드마레 브랜드 아이덴티티 공개', date: '2026-02-05', status: 'scheduled' },
  { id: 'content-2-2', type: 'newsletter', title: '바다의 일지 Vol.0', description: '런칭 전 구독자 프리뷰', date: '2026-02-15', status: 'draft' },
  { id: 'content-2-3', type: 'instagram', title: '패키지 디자인 스닉픽', description: '패키지 디자인 과정 공개', date: '2026-02-20', status: 'draft' },

  // 3월 - 콘텐츠 본격화
  { id: 'content-3-1', type: 'instagram', title: '숙성 1개월 기념', description: '해저 숙성 1개월 기록', date: '2026-03-02', status: 'scheduled' },
  { id: 'content-3-2', type: 'youtube', title: '숙성일지 #1', description: '첫 번째 숙성 일지 영상', date: '2026-03-07', status: 'scheduled' },
  { id: 'content-3-3', type: 'instagram', title: '심해 무드 콘텐츠', description: '딥씨 에디토리얼 콘텐츠', date: '2026-03-10', status: 'scheduled' },
  { id: 'content-3-4', type: 'newsletter', title: '바다의 일지 Vol.1', description: '첫 번째 공식 뉴스레터', date: '2026-03-14', status: 'scheduled' },
  { id: 'content-3-5', type: 'instagram', title: '브랜드 필름 티저', description: '브랜드 필름 30초 티저', date: '2026-03-17', status: 'scheduled' },
  { id: 'content-3-6', type: 'youtube', title: '브랜드 필름 공개', description: '뮤즈드마레 브랜드 필름 풀버전', date: '2026-03-20', status: 'scheduled' },
  { id: 'content-3-7', type: 'instagram', title: '인터뷰 발췌', description: '팀 인터뷰 하이라이트', date: '2026-03-24', status: 'draft' },
  { id: 'content-3-8', type: 'youtube', title: '다큐 예고편', description: '해저 숙성 다큐멘터리 예고편', date: '2026-03-28', status: 'draft' },

  // 4월 - 시딩
  { id: 'content-4-1', type: 'instagram', title: '숙성일지 #2', description: '숙성 2개월차 업데이트', date: '2026-04-03', status: 'draft' },
  { id: 'content-4-2', type: 'blog', title: '해저 숙성 과정 상세', description: '숙성 과정 상세 설명', date: '2026-04-10', status: 'draft' },
  { id: 'content-4-3', type: 'instagram', title: 'VIP 프리뷰 현장', description: 'VIP 이벤트 현장 스케치', date: '2026-04-18', status: 'draft' },
  { id: 'content-4-4', type: 'newsletter', title: '바다의 일지 Vol.2', description: '시딩 시작 소식', date: '2026-04-25', status: 'draft' },

  // 5월 - PR 본격화
  { id: 'content-5-1', type: 'press', title: '언론 보도자료', description: '주요 매체 배포용 보도자료', date: '2026-05-05', status: 'draft' },
  { id: 'content-5-2', type: 'instagram', title: '인양 D-30', description: '인양 카운트다운 시작', date: '2026-05-15', status: 'draft' },
  { id: 'content-5-3', type: 'youtube', title: '숙성일지 #3', description: '숙성 4개월차 스페셜', date: '2026-05-20', status: 'draft' },
  { id: 'content-5-4', type: 'newsletter', title: '바다의 일지 Vol.3', description: '인양 준비 소식', date: '2026-05-28', status: 'draft' },

  // 6월 - 인양
  { id: 'content-6-1', type: 'instagram', title: '인양 D-Day 라이브', description: '실시간 인양 과정 중계', date: '2026-06-10', status: 'draft' },
  { id: 'content-6-2', type: 'youtube', title: '인양 풀 다큐', description: '인양 과정 풀 다큐멘터리', date: '2026-06-17', status: 'draft' },
  { id: 'content-6-3', type: 'press', title: '인양 성공 보도자료', description: '인양 성공 공식 발표', date: '2026-06-12', status: 'draft' },
  { id: 'content-6-4', type: 'newsletter', title: '바다의 일지 Vol.4', description: '인양 성공 스페셜 에디션', date: '2026-06-20', status: 'draft' },

  // 7월 - 런칭 준비
  { id: 'content-7-1', type: 'instagram', title: '팝업 스토어 티저', description: '팝업 스토어 위치 힌트', date: '2026-07-05', status: 'draft' },
  { id: 'content-7-2', type: 'youtube', title: '테이스팅 세션', description: '소믈리에 테이스팅 영상', date: '2026-07-15', status: 'draft' },
  { id: 'content-7-3', type: 'newsletter', title: '바다의 일지 Vol.5', description: '런칭 초대장', date: '2026-07-25', status: 'draft' },

  // 8월 - 런칭
  { id: 'content-8-1', type: 'instagram', title: '그랜드 런칭 현장', description: '런칭 파티 실황', date: '2026-08-01', status: 'draft' },
  { id: 'content-8-2', type: 'youtube', title: '런칭 파티 다큐', description: '런칭 파티 풀 영상', date: '2026-08-05', status: 'draft' },
  { id: 'content-8-3', type: 'press', title: '런칭 보도자료', description: '공식 런칭 발표', date: '2026-08-01', status: 'draft' },
  { id: 'content-8-4', type: 'blog', title: '뮤즈드마레 스토리', description: '브랜드 전체 스토리', date: '2026-08-10', status: 'draft' },
  { id: 'content-8-5', type: 'newsletter', title: '바다의 일지 Vol.6', description: '런칭 성공 기념호', date: '2026-08-15', status: 'draft' },
];

// ═══════════════════════════════════════════════════════════════════════════
// 로컬 스토리지 키
// ═══════════════════════════════════════════════════════════════════════════

export const STORAGE_KEYS = {
  TASKS: 'muse-de-maree-tasks',
  MUST_DO: 'muse-de-maree-must-do',
  CONTENT: 'muse-de-maree-content',
  KPI: 'muse-de-maree-kpi',
  SETTINGS: 'muse-de-maree-settings',
};
