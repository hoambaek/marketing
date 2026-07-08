# 뮤즈드마레 마케팅 관제 시스템 (Marketing Command Center) 구축 플랜

> 작성일: 2026-07-08 · 뮤즈드마레 사업부
> 목적: 채널 전략(랜딩·블로그·인스타그램·뉴스레터)의 실행 데이터를 자동 수집하고, AI가 "우리 마케팅 방향이 맞는가"를 주기 분석해 보여주는 관리자 시스템을 plan.musedemaree.com(marketing 앱)에 구축한다.
> 상위 전략: `/Users/hoambaek/Documents/Cursor/docs/plans/musedemaree/mdm-channel-strategy-2026-07.md` (채널 운영 전략, 2026-07-08)
>
> **구현 현황 (2026-07-08)**: Phase 1(수집 파이프라인)·Phase 2 기본(/channels 관제 페이지)·Phase 3(AI 주간 리포트) **코드 구현·빌드·동작 검증 완료**. Supabase 테이블 5개 생성 완료. 남은 것: Phase 0 계정·권한 작업(대표) → 환경변수 입력 → 배포. 체크리스트: `2026-07-08-command-center-prep-checklist.md`
> 리서치 근거: 2026-07-08 웹 조사 2건 (Meta MCP·Instagram Graph API / 구글 애널리틱스·Vercel·스티비 API) — 본문에 반영

---

## 1. 결론 요약

1. **연동은 전부 가능하고, 방식이 둘로 갈린다.** 페이스북·인스타그램의 오가닉 성과(도달·저장·공유·팔로우)와 게시물 발행은 **Instagram Graph API 직접 연동**(자기 소유 계정이라 심사 불필요, System User 토큰이면 만료 없음)이 정답이고, Meta 공식 MCP(2026-04 출시)는 **광고 전용**이라 광고를 시작할 때만 붙인다.
2. **트래픽 수집의 장벽이 막 사라졌다.** Vercel Web Analytics 공식 조회 API가 2026년 6월에 공개됐고, 구글은 공식 GA(구글 애널리틱스) MCP 서버를 제공한다. GA4 Data API + Vercel API + 스티비 API + Instagram API를 **앱에 이미 있는 Vercel Cron 패턴**(ocean-data 수집과 동일)으로 매일 Supabase에 적재하면 된다.
3. **AI 분석은 2층으로.** ① 자동: 주간 크론이 한 주 데이터를 모아 AI가 "전략 정합성 리포트"(채널 전략의 KPI 기준으로 판정)를 생성해 관리자 페이지에 게시 ② 대화형: Claude(이 세션)가 MCP·API로 같은 데이터를 직접 읽으며 대표와 깊이 분석. 관제 페이지는 marketing 앱에 `/channels` 신설.

---

## 2. 조사로 확인된 연동 지형 (2026-07 기준)

### 2-1. 채널별 연동 방법 확정

| 채널 | 데이터 | 연동 방법 | 근거·조건 |
|---|---|---|---|
| **인스타그램·페이스북 (오가닉)** | 게시물별 도달·저장·공유·프로필 방문·팔로우, 계정 팔로워 추이 | **Instagram Graph API 직접** (Instagram API with Facebook Login) | 자기 소유 계정은 App Review 불필요(Standard Access). System User 토큰(Business Manager 발급)은 만료 없음 → 무인 수집 가능. 우리 전략 KPI(저장·공유)가 전부 지표로 제공됨. 주의: impressions 지표는 폐기, views가 표준 |
| **인스타그램 발행·예약** | 피드·카루셀(2~10장)·릴스·스토리 발행 | Graph API content_publish (일 100건 한도, 주 1~2회에 충분) | 미디어는 공개 URL 필요(Supabase Storage 활용). 오가닉용 MCP 서버는 스타 수십 개짜리 개인 프로젝트뿐 → 검증 없이 쓰지 말고 **자체 경량 연동** 권장 |
| **Meta 광고** (향후) | 캠페인 성과·관리 | **Meta 공식 Ads MCP** (`mcp.facebook.com/ads`, OAuth 15분 설정) | 광고 시작 시점에 연결. AI가 만든 캠페인은 PAUSED로 생성돼 사람이 켜야 함(안전). 한국 소규모 계정 롤아웃 시점 미확인 → 시작 전 접근 확인 |
| **GA4 (랜딩+블로그)** | 세션·소스·랜딩페이지·커스텀 이벤트(cta_click, subscribe_submit) | **GA4 Data API** (서비스 계정) + 대화형은 **구글 공식 GA MCP** | 서비스 계정을 GA4 뷰어로 추가만 하면 됨. 무료 쿼터(일 20만 토큰)로 충분. 데이터 24~48시간 지연 감안 |
| **Vercel Analytics (랜딩+블로그)** | 페이지뷰·방문자·referrer·경로별 | **Vercel Web Analytics API** (2026-06 공개, Bearer 토큰) | `visits/aggregate`, `events/aggregate`. Hobby 플랜은 커스텀 이벤트·UTM 불가(1개월 윈도우) → 커스텀 이벤트는 GA4로 일원화하면 Hobby로도 운영 가능 |
| **뉴스레터 (스티비)** | 캠페인별 오픈·클릭, 구독자 증감 | **스티비 API + 웹훅** | 이메일 통계 API는 프로 플랜(월 29,000원~) 필요. 웹훅으로 구독/수신거부를 실시간 동기화 |
| **구글 검색 (블로그 SEO)** | 검색어별 클릭·노출·순위 | **Search Console API** (GA4와 같은 서비스 계정) | 키워드 3계층(T1/T2/T3) 가설 검증용. 요청당 25,000행, 2~3일 지연 |
| **네이버 검색 유입** | 통계 API **없음** (서치어드바이저·블로그 통계 모두 비공개) | GA4·Vercel의 referrer(search.naver.com, blog.naver.com)로 측정 | 대안 설계. 네이버 데이터랩(검색어 트렌드)은 보조 참고 가능 |

### 2-2. 판단: MCP로 "추적·제어"가 되는가?

- **추적**: 된다. 다만 관제의 본체는 MCP가 아니라 **앱 내 수집 파이프라인**이어야 한다. MCP는 세션이 열려 있을 때만 동작하는 대화형 도구라서, 매일 쌓이는 시계열(팔로워 추이, 게시물별 성과 이력)은 크론 수집으로 DB에 적재해야 "지난 90일 추세" 같은 분석이 가능하다.
- **제어**: 부분적으로 된다. 인스타그램 발행·예약은 Graph API로 가능(콘텐츠 캘린더와 연동), 광고는 공식 Ads MCP로 가능. 단 오가닉용 서드파티 MCP는 미성숙 생태계라 그대로 신뢰하지 말 것 — 필요 API가 단순하므로(컨테이너 생성→발행→인사이트 조회) 앱 안에 직접 구현하는 편이 안전하다.
- **역할 분담**: 자동 수집·자동 리포트 = 앱(크론). 심층 대화 분석·수시 질의 = Claude + MCP(GA 공식 MCP, Vercel API, Supabase MCP는 이미 연결돼 있음).

---

## 3. 시스템 설계

### 3-0. 전체 구조

```
[수집층 — Vercel Cron, 기존 ocean-data 패턴 그대로]
  /api/cron/collect-web       매일: GA4 + Vercel Analytics → 세션·이벤트·referrer
  /api/cron/collect-social    매일: Instagram Graph API → 계정+게시물별 인사이트
  /api/cron/collect-search    매일: Search Console → 검색어별 클릭·노출·순위
  /api/webhooks/stibee        실시간: 구독·수신거부 / 발송 후: 캠페인 통계 pull
        │
[저장층 — Supabase (기존 프로젝트)]
  channel_metrics_daily   채널×지표×일자 (통합 시계열)
  content_performance     콘텐츠 단위 성과 (인스타 게시물·블로그 글 개별)
  newsletter_campaigns    레터별 오픈·클릭·수신거부
  search_queries          검색어×일자 (키워드 계층 태그)
  ai_reports              AI 주간 리포트 (마크다운 + 판정 데이터)
        │
[분석층]
  /api/cron/weekly-report  주 1회(월요일): 주간 데이터 요약 → AI 분석 → ai_reports 적재
  Claude 대화형: GA MCP + Supabase MCP + Vercel API로 수시 심층 분석
        │
[표시층 — marketing 앱 (plan.musedemaree.com)]
  /channels           채널 관제 대시보드 (4채널 현황 + 퍼널)
  /channels/report    AI 주간 리포트 아카이브
  /channels/content   콘텐츠별 성과 (콘텐츠 캘린더 content_items와 연결)
```

### 3-1. 핵심 설계 원칙 — "전략이 스키마다"

대시보드가 흔한 트래픽 그래프 모음이 되면 실패다. 채널 전략의 KPI를 그대로 화면 구조로 쓴다:

| 전략 KPI (채널 전략 문서 §3) | 데이터 소스 | 관제 화면 표현 |
|---|---|---|
| 명부 등록 전환 (온라인 채널의 제1 전환) | GA4 `subscribe_submit` 이벤트 + 스티비 구독자 수 | 퍼널 최상단 지표. 채널별 기여(유입 소스 → 등록) |
| 인스타 저장·DM 공유 (팔로워 수보다 우선) | Instagram Insights `saved`, `shares` | 게시물별 저장·공유 순위. 팔로워 수는 보조 지표로 강등 |
| 블로그 키워드 3계층 검증 (T1 니치/T2 정보성/T3 고유명) | Search Console 검색어 + GA4 랜딩페이지 | 검색어를 T1/T2/T3로 태깅해 계층별 유입 추이 — Q3 캘린더 가설 검증 |
| 뉴스레터 오픈율 40%+ / 수신거부율 | 스티비 캠페인 통계 | 레터별 오픈·클릭 + 수신거부 경보(서사 피로 조기 감지) |
| B2B 문의·초대 신청 (판매는 B2B 전용) | GA4 `cta_click`(invite/partner) + 수동 입력(기존 tasks/issues) | 퍼널 종점. "결제"가 아니라 "문의·초대"가 전환 |

### 3-2. Supabase 스키마 (신규 5테이블)

```sql
-- 채널×일자 통합 시계열 (모든 수집기가 여기에 upsert)
CREATE TABLE channel_metrics_daily (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  date DATE NOT NULL,
  channel TEXT NOT NULL,        -- 'landing' | 'blog' | 'instagram' | 'newsletter' | 'search'
  source TEXT NOT NULL,         -- 'ga4' | 'vercel' | 'ig_graph' | 'stibee' | 'gsc'
  metric TEXT NOT NULL,         -- 'sessions' | 'visitors' | 'reach' | 'saved' | 'shares' | 'followers' | 'subscribe_submit' | ...
  dimension JSONB DEFAULT '{}', -- {referrer, landing_page, utm, ...}
  value NUMERIC NOT NULL,
  UNIQUE (date, channel, source, metric, dimension)
);

-- 콘텐츠 단위 성과 (기존 content_items와 느슨히 연결)
CREATE TABLE content_performance (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content_type TEXT NOT NULL,   -- 'ig_post' | 'ig_carousel' | 'ig_reel' | 'blog_post' | 'newsletter'
  external_id TEXT NOT NULL,    -- IG media id / blog slug / stibee campaign id
  content_item_id BIGINT,       -- FK → content_items (캘린더 연결, nullable)
  title TEXT, published_at TIMESTAMPTZ,
  metrics JSONB NOT NULL,       -- {reach, saved, shares, views, sessions, ...} 최신 스냅샷
  collected_at TIMESTAMPTZ NOT NULL,
  UNIQUE (content_type, external_id, collected_at)
);

-- 뉴스레터 캠페인
CREATE TABLE newsletter_campaigns (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  stibee_campaign_id TEXT UNIQUE, subject TEXT, sent_at TIMESTAMPTZ,
  recipients INT, opens INT, clicks INT, unsubscribes INT, open_rate NUMERIC, click_rate NUMERIC
);

-- 검색어 (키워드 계층 태그)
CREATE TABLE search_queries (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  date DATE NOT NULL, query TEXT NOT NULL, page TEXT,
  clicks INT, impressions INT, ctr NUMERIC, position NUMERIC,
  tier TEXT,                    -- 'T1' | 'T2' | 'T3' | NULL (규칙 기반 자동 태깅)
  UNIQUE (date, query, page)
);

-- AI 주간 리포트
CREATE TABLE ai_reports (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  week_start DATE NOT NULL UNIQUE, generated_at TIMESTAMPTZ NOT NULL,
  verdict TEXT,                 -- 'on-track' | 'watch' | 'off-track'
  summary_md TEXT NOT NULL,     -- 리포트 본문 (마크다운)
  metrics_snapshot JSONB        -- 판정에 쓴 수치 (역추적용)
);
```

RLS는 기존 정책(Clerk 인증 + 쓰기는 service_role API 경유)을 그대로 따른다. 크론 수집기는 service_role로 쓴다.

### 3-3. AI 주간 리포트 — "방향이 맞는가"를 판정하는 구조

주 1회(월요일 아침) 크론이 실행하는 분석. 흔한 "요약"이 아니라 **전략 문서를 기준으로 한 판정**으로 설계한다:

**입력**: ① 지난주 + 직전 4주 channel_metrics_daily ② 콘텐츠별 성과 ③ 채널 전략의 KPI 기준(프롬프트에 상수로 내장) ④ 금지 규칙(판매 표현 금지, 팔로워 수 우선 금지 등)

**출력 (리포트 구조 고정)**:
1. **판정**: on-track / watch / off-track + 한 줄 이유
2. **퍼널 스코어**: 발견(검색·인스타 도달) → 목격(랜딩 세션) → 관계(명부 등록) → 초대·문의(cta_click) 단계별 전주 대비
3. **채널별 진단**: 각 채널이 전략상 역할을 하고 있는가 (예: "인스타 저장 수가 도달보다 빨리 늘면 콘텐츠 밀도 전략이 작동 중")
4. **이상 신호**: 수신거부율 상승, 특정 키워드 계층의 침묵, 콘텐츠 성과 급락
5. **다음 주 액션 3개 이하** (실행 가능 형태)

**AI 엔진 선택**: 앱의 기존 어시스턴트는 Gemini인데, 주간 전략 리포트는 **Claude API 권장**. 이유는 판정 기준이 brain의 전략 claim들(광고 위계, 채널 공백, B2B 전용)과 정합해야 하고, 이 규칙 체계를 이미 학습한 운영 주체가 Claude이기 때문. 구현은 `/api/cron/weekly-report`에서 Anthropic API 호출(ANTHROPIC_API_KEY 환경변수 추가) 또는 hub runner의 헤드리스 실행 중 택1 — **앱 내 API 호출을 권장**(의존성이 앱 안에서 닫힘).

### 3-4. 대화형 분석 (Claude 세션)

관리자 페이지와 별개로, 대표가 나(Claude)와 수시로 깊이 파는 채널:
- **구글 공식 GA MCP** 연결: `claude mcp add analytics-mcp` (서비스 계정 재사용) → "지난주 블로그 유입 소스 보여줘" 같은 수시 질의
- **Supabase MCP**(이미 연결됨): 적재된 통합 데이터에 SQL로 직접 질의
- **Vercel API**: Bearer 토큰으로 수시 조회 (공식 Vercel MCP에는 애널리틱스 도구가 없음 — 확인됨)
- Instagram은 적재 데이터 우선, 필요 시 Graph API 직접 호출

---

## 4. 실행 로드맵

### Phase 0 — 계정·권한 준비 (대표 액션, 반나절)
- [ ] **Meta**: Instagram 프로페셔널 계정 ↔ Facebook 페이지 연결 확인 → developers.facebook.com에서 앱 생성 → Business Manager에서 System User 토큰 발급 (권한: instagram_basic, instagram_manage_insights, instagram_content_publish, pages_show_list, pages_read_engagement)
- [ ] **Google**: GCP 프로젝트에 서비스 계정 생성 → GA4 프로퍼티(G-YVXMD6VF59)에 뷰어로 추가 + Search Console 속성에 사용자로 추가 (키 하나로 둘 다)
- [ ] **Vercel**: 액세스 토큰 발급, 현재 플랜 확인 (Hobby면 커스텀 이벤트는 GA4로 일원화 — 추가 비용 없이 운영 가능)
- [ ] **스티비**: 플랜 확인 — 이메일 통계 API는 프로(월 29,000원~) 필요. 뉴스레터 시작 시점에 결정해도 됨
- [ ] 페이지 주류 분류·연령 제한은 API 설정 근거가 미확인이므로 **수동 1회 설정**

### Phase 1 — 수집 파이프라인 (개발 1~2일)
- [ ] Supabase 스키마 5테이블 마이그레이션
- [ ] `/api/cron/collect-web` (GA4 + Vercel, 매일 오후 — GA4 지연 감안), `/api/cron/collect-social` (Instagram), `/api/cron/collect-search` (GSC) + vercel.json crons 등록 + CRON_SECRET 보호 (기존 ocean-data 패턴 복제)
- [ ] 과거 데이터 백필 (GA4·GSC는 소급 조회 가능, Instagram은 기존 게시물 인사이트 일괄 수집)
- [ ] 검색어 T1/T2/T3 자동 태깅 규칙 (블로그 캘린더의 키워드 목록 기반)

### Phase 2 — 관제 대시보드 (개발 1~2일)
- [ ] `/channels` 페이지: 퍼널 스코어보드(발견→목격→관계→초대·문의) + 채널 4개 카드(전략 역할 대비 현황) — recharts 재사용
- [ ] `/channels/content`: 콘텐츠별 성과 테이블 (콘텐츠 캘린더 content_items와 연결 — 계획 대비 성과가 한 화면에)
- [ ] 기존 `/kpi` 페이지와 관계 정리 (수동 KPI는 유지, 채널 지표는 /channels로)

### Phase 3 — AI 주간 리포트 (개발 1일)
- [ ] `/api/cron/weekly-report` (월요일 아침): 주간 데이터 집계 → Claude API 판정 리포트 → ai_reports 적재
- [ ] `/channels/report`: 리포트 아카이브 뷰 (판정 뱃지 + 마크다운 렌더)
- [ ] (선택) 리포트 발행 시 Slack/카카오톡 알림 — hub runner의 Slack 웹훅 재사용 가능

### Phase 4 — 제어 확장 (전략 승인 후, 필요 시점에)
- [ ] 인스타그램 발행·예약: 콘텐츠 캘린더에서 승인된 콘텐츠를 Graph API로 예약 발행 (미디어는 Supabase Storage 공개 URL). **발행 전 사람 승인 필수 게이트 유지**
- [ ] 광고 시작 시: Meta 공식 Ads MCP 연결 (한국 계정 접근 가능 여부 선확인, 캠페인은 PAUSED 생성 → 사람이 활성화)

---

## 5. 비용·리스크

| 항목 | 내용 |
|---|---|
| 고정 비용 | 스티비 프로 월 29,000원(뉴스레터 시작 시), Claude API 주간 리포트 호출(월 수천 원 수준), 나머지 API 전부 무료 쿼터 내 |
| Vercel 플랜 | Hobby 유지 가능(커스텀 이벤트를 GA4로 일원화하는 조건). Pro 전환 시 Vercel 쪽 커스텀 이벤트·12개월 윈도우 추가 |
| 토큰 관리 | Meta System User 토큰은 만료 없음. GA 서비스 계정 키는 회전 정책만. 모든 시크릿은 Vercel 환경변수(코드 미포함) |
| 데이터 지연 | GA4 24~48시간, GSC 2~3일 — "어제" 판단은 Vercel Analytics(실시간성)로, 추세 판단은 GA4로 역할 분리 |
| 미확인 사항 | ① Meta 공식 Ads MCP의 한국 소규모 계정 롤아웃 ② 연령 게이트 API 설정 가능 여부(수동 처리) ③ 스티비 통계 API 응답 필드 상세(프로 가입 후 확인) ④ Vercel Analytics API의 플랜별 접근 명시(Hobby에서 events 엔드포인트는 사실상 불가로 간주) |
| 원칙 유지 | 발행·광고 등 외부로 나가는 행위는 반드시 사람 승인 게이트를 거침(자동 발행 금지). 수집·분석은 완전 자동 |

---

## 6. 대표 결정 사항

1. **플랜 승인**: 위 Phase 0~3 진행 (Phase 4는 별도 승인)
2. **AI 리포트 엔진**: Claude API 추가(권장) vs 기존 Gemini 재사용
3. **알림 채널**: 주간 리포트를 앱에서만 볼지, Slack/카카오톡 알림 병행할지
4. **스티비 프로 가입 시점**: 뉴스레터 첫 발행과 동시(권장) vs 즉시
5. Phase 0의 계정·권한 작업 일정 (대표 직접 필요: Meta 앱 생성, GA 서비스 계정 권한 추가, Vercel 토큰)

---
근거: [[뮤즈드마레-채널공백-침지인양사이-기록연재]] × [[뮤즈드마레-인스타그램-저빈도-카루셀-주류추천제외]] × [[뮤즈드마레-뉴스레터-앙프리뫼르-할당모델]] × [[뮤즈드마레-판매채널-B2B전용-온라인은홍보만]] × 웹 리서치 2건(Meta MCP·Instagram Graph API / GA·Vercel·스티비 API, 2026-07-08)
충돌 검토: [[뮤즈드마레-광고위계-증거가-본체]](관제 지표가 저장·공유·명부 중심 — 정합) · [[뮤즈드마레-대외표기규칙-수심30m-EZ100병]](발행 게이트에 금지 표현 체크 포함) 통과
