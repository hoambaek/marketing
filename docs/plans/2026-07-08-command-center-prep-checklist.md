# 마케팅 관제 시스템 — 대표 준비 체크리스트 (Phase 0)

> 작성일: 2026-07-08 · 총 소요 약 2~3시간
> 본 플랜: `/Users/hoambaek/Documents/Cursor/musedemaree/marketing/docs/plans/2026-07-08-marketing-command-center.md`
> 전부 "계정 소유자만 할 수 있는 권한 작업"입니다. 이게 끝나면 개발(Phase 1~3)은 Claude가 진행합니다.

---

## 1. Meta (인스타그램·페이스북) — 약 1시간 ⭐ 가장 중요

### 사전 확인
- [ ] 뮤즈드마레 인스타그램이 **프로페셔널(비즈니스) 계정**인지 확인 (인스타그램 설정 → 계정 유형 및 도구)
- [ ] 연결된 **페이스북 페이지**가 있는지 확인 — 없으면 페이지 생성 후 인스타그램과 연결 (API 권한이 페이지를 통해 흐르므로 필수)
- [ ] **Meta Business Manager**(business.facebook.com)에 페이지·인스타그램 자산이 등록돼 있는지 확인

### 본 작업
- [ ] developers.facebook.com에서 **앱 생성** (유형: Business)
- [ ] Business Manager → 비즈니스 설정 → 시스템 사용자 → **System User 생성**
- [ ] System User에 페이지·인스타그램 **자산 할당**
- [ ] System User **토큰 발급** — 권한 5개 체크:
  - `instagram_basic`
  - `instagram_manage_insights`
  - `instagram_content_publish`
  - `pages_show_list`
  - `pages_read_engagement`
- [ ] 페이스북 페이지 설정에서 **주류 관련 분류 + 연령 제한(19세 이상)** 수동 설정 (API로 설정 불가한 항목)

> 막히면 앱 생성까지만 해두고 알려주세요. 이후 단계는 화면 보며 같이 진행 가능합니다.

## 2. Google — 약 30분

- [ ] **GCP 프로젝트**에서 서비스 계정 생성 + JSON 키 다운로드
  - 기존 GCP 프로젝트 있으면 재사용
  - API 2개 활성화: Google Analytics Data API, Search Console API
- [ ] GA4 관리 → 계정 액세스 관리 → **서비스 계정 이메일을 뷰어(Viewer)로 추가**
- [ ] ⚠️ **선행 미완료 건**: **구글 서치콘솔에 랜딩·블로그 도메인 등록** (musedemaree.com, blog.musedemaree.com) — 웹 그로스 작업 때부터 대기 중이던 항목. 등록해야 검색어 수집 가능
- [ ] 서치콘솔 속성에 **서비스 계정을 사용자로 추가**
- [ ] 🆕 **플랫폼 속성(Platform Property)으로 인스타그램 계정도 등록** — 2026-07-07 출시된 신기능. Search Console → 속성 추가 → Instagram 선택 → 계정 인증. 브랜드 인스타그램 콘텐츠가 구글 검색·Discover에서 어떤 검색어로 노출·클릭되는지 확인 가능 (수 주에 걸쳐 순차 오픈 — 선택지가 안 보이면 며칠 후 재시도)
- [ ] (같은 김에) 네이버 서치어드바이저에도 두 도메인 등록 — 색인 요청용 (API는 없어서 수집 연동과 무관)

## 3. Vercel — 약 10분

- [ ] 계정 설정 → Tokens에서 **액세스 토큰 발급**
- [ ] **현재 플랜 확인** (Hobby / Pro) — Hobby여도 운영 가능하게 설계했지만, 플랜에 따라 커스텀 이벤트 수집 경로가 달라짐
- [ ] ⚠️ **선행 미완료 건**: landing 프로젝트의 **Vercel Analytics를 대시보드에서 Enable** (웹 그로스 작업 때부터 대기 중)

## 4. 결정 사항

- [x] ~~Claude API 키 발급~~ — 이미 설정돼 있음 (해결)
- [x] ~~스티비 프로 가입~~ — **폐기 (2026-07-08 대표 확정): 뉴스레터는 자체 운영.** 구독자 관리는 기존 subscribers 테이블(/channels 명부 섹션), 발송은 Resend 기반 자체 개발(별도 건). 외부 툴 비용·가입 불필요

## 지금 안 해도 되는 것

- Meta 공식 광고 MCP 연결 → 광고 시작할 때
- 인스타그램 발행 자동화 → Phase 4, 별도 승인
- 네이버 관련 개발 준비 → 통계 API가 없어 referrer로 자동 측정됨

---

## 시크릿 전달 방법 (중요)

발급된 시크릿은 **채팅에 붙여넣지 말 것** → marketing 앱의 **Vercel 환경변수** + 로컬 `.env.local`에 직접 입력.

### 환경변수 목록 (2026-07-08 Phase 1 구현 완료 — 변수명 확정)

| 변수명 | 값 | 상태 |
|---|---|---|
| `GOOGLE_SERVICE_ACCOUNT_KEY` | 서비스 계정 JSON 키 (base64 인코딩 권장: `base64 -i key.json`) | 대기 |
| `GA4_PROPERTY_ID` | GA4 관리 → 속성 설정의 **숫자 ID** (측정 ID G-YVXMD6VF59 아님) | 대기 |
| `GSC_LANDING_SITE` | 서치콘솔 속성 URL — 도메인 속성이면 `sc-domain:musedemaree.com` 하나로 통합 | 대기 (서치콘솔 등록 후) |
| `GSC_BLOG_SITE` | URL 접두어 속성으로 나눴을 때만: `https://blog.musedemaree.com/` | 선택 |
| `VERCEL_API_TOKEN` | Vercel 계정 설정 → Tokens | 대기 |
| `VERCEL_TEAM_ID` | `team_aygG0SHN1XQVXGihBflGngsp` (확인 완료) | ✅ 값 확정 |
| `VERCEL_LANDING_PROJECT_ID` | `prj_XZDL4kueG7gN6Bzh7tzTUbwF1WBR` (landing, 확인 완료) | ✅ 값 확정 |
| `VERCEL_BLOG_PROJECT_ID` | `prj_0ibe5LhHTZPL9KMnMyttPkBxlLDt` (blog, 확인 완료) | ✅ 값 확정 |
| `META_ACCESS_TOKEN` | System User 토큰 (Business Manager 발급) | 대기 |
| `META_IG_USER_ID` | Instagram 비즈니스 계정의 IG User ID (숫자) | 대기 |
| `ANTHROPIC_API_KEY` | Claude API 키 | ✅ 이미 설정됨 |
| ~~스티비 API 키~~ | 폐기 — 뉴스레터 자체 운영 확정 (RESEND_API_KEY 이미 보유) | ✅ 불필요 |
| `CRON_SECRET` | 임의 랜덤 문자열 (크론 보호 강화, 선택 — 미설정 시 Vercel 크론 헤더로 검증) | 선택 |

각 수집기는 독립적으로 동작 — 변수가 들어오는 소스부터 순서대로 수집이 시작된다 (미설정 소스는 자동 skip).

## 완료 기준

**1번(Meta) + 2번의 서치콘솔 등록**만 끝나면 Phase 1(수집 파이프라인) 개발 착수 가능. 나머지는 병행 진행해도 됨.
