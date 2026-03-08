# CXP (Content Experience Plan) 시스템 개요

## CXP란?

Muse de Marée의 **콘텐츠 전략 기획 및 관리 시스템**.
2026년 브랜드 런칭을 앞두고, 한국 전통문화를 글로벌 시청자에게 전달하는 숏폼 콘텐츠 시리즈를 체계적으로 기획·관리한다.

## 앱 경로 구조

```
/cxp                  — 메인 대시보드 (전체 콘텐츠 목록)
/cxp/strategy         — 전략 기획서 (브랜드 포지셔닝, 콘텐츠 축, 채널 전략)
/cxp/ideas            — 아이디어 백로그 (축별 콘텐츠 후보)
/cxp/001              — Content Plan #001: K-Drama Hanbok Fact-Check
/cxp/002              — Content Plan #002: The Korean Bow
/cxp/003              — Content Plan #003: The Sound Behind BTS — Daechwita
/cxp/004              — Content Plan #004: My Teacher Watched My Bow
/cxp/005              — Content Plan #005: 5 Korean Cheat Codes
```

## 콘텐츠 축 (Content Pillars)

| 축 | 이름 | 설명 |
|---|------|------|
| 1 | The Real Korea | 한국 전통문화의 진짜 모습 — 관광객이 모르는 깊이 |
| 2 | Lost in Translation | 한국어/한국 문화의 번역 불가능한 요소들 |
| 3 | Korea meets the World | 전통 × 현대, K-pop/K-drama와 전통의 교차점 |
| 4 | K-Beauty의 뿌리 | 한국 미의식의 전통적 뿌리 (아이디어 단계) |

## 5편 시리즈 라인업

```
001 한복 팩트체크     — 발견 ("재밌네")           축 3
002 절 해독          — 신뢰 ("한국인 시선 신기하다") 축 2
003 대취타           — 트래픽 (BTS 팬덤 유입)      축 3
004 절의 철학        — 전환 ("이 사람 진짜다")      축 1+2
005 예절의 뿌리      — 확산 ("친구한테 보내야 해")   축 1
```

### 시리즈 전략 흐름

```
발견(001) → 신뢰(002) → 트래픽(003) → 전환(004) → 확산(005)
```

- 001-003: 유입과 흥미
- 004: 팔로우 결정 포인트 (가장 개인적이고 깊은 편)
- 005: 가장 공유 가능한 편 (실용 + 깊이)
- 004 ↔ 005는 쌍으로 작동: 철학 → 실전

## 콘텐츠 플랜 구조 (각 편 공통)

각 콘텐츠 플랜 페이지는 CollapsibleSection 컴포넌트로 다음 섹션을 포함:

| 섹션 | 아이콘 | 설명 |
|------|--------|------|
| 콘셉트 | Layers | 핵심 아이디어, 차별점, 배경 데이터 |
| 스크립트 | Film | 틱톡 버전 + 인스타 릴스 버전 (타임코드별 씬) |
| 멘트 상세 | Mic | 톤/속도/감정 테이블, 한국어 믹스 포인트 |
| 촬영 체크리스트 | Camera | 사전 준비, 컷 리스트, 장소/장비/순서 |
| 편집 가이드 | Scissors | 구간별 오디오/비주얼 매핑, 편집 포인트 |
| 업로드 세팅 | Upload | 틱톡/인스타 캡션, 해시태그, 고정 댓글, 스토리 시퀀스 |
| 성과 측정 | BarChart3 | KPI 목표치 (조회수, 완주율, 저장, 공유, 댓글) |
| 시리즈 확장/포지션 | Layers | 후속편 후보, 시리즈 내 역할, 편 간 연결 |

## 각 편 요약

### 001 — K-Drama Hanbok Fact-Check

- **포맷**: TT 18초 / IG 22초
- **축**: 3 — Korea meets the World
- **콘셉트**: 환혼(Netflix 6억뷰) 한복 착장 오류를 20년 전공자가 교정
- **톤**: 교정형 ("이건 틀렸어요 → 진짜는 이렇게 아름답습니다")
- **핵심 포인트**: 고름 매기 시연, 조선시대 신분/가문/혼인 표시
- **캐치프레이즈**: "This is the real Korea."
- **촬영**: 한복 + 한옥 배경, 대표님 단독

### 002 — The Korean Bow

- **포맷**: TT 20초 / IG 25초
- **축**: 2 — Lost in Translation
- **콘셉트**: K-드라마 절 장면 → 한국인은 2도 차이를 읽는다
- **톤**: 분석형 ("한국인은 이걸 읽었다")
- **핵심 포인트**: 존경/사과/감사/만남의 절 차이, 무릎 각도·시선·손 위치
- **캐치프레이즈**: "This is the real Korea."
- **촬영**: 한복, 절 시연 비교

### 003 — The Sound Behind BTS — Daechwita

- **포맷**: TT 18초 / IG 24초
- **축**: 3 — Korea meets the World (전통 × 현대)
- **콘셉트**: BTS 슈가 "대취타" 4.6억뷰 → 진짜 대취타 원음 공개
- **톤**: 에너지형 ("이게 진짜야")
- **핵심 포인트**: 태평소 원음의 충격적 음량, "크게 불고 크게 치다"
- **캐치프레이즈**: "Suga sampled a King's entrance. This is the real Korea."
- **촬영**: 태평소 연주자 섭외 필요, 야외 추천 (음량)
- **특이사항**: ARMY 팬덤 유입 타깃, 저작권/페어유즈 주의

### 004 — My Teacher Watched My Bow Before She Heard Me Play

- **포맷**: TT 22초 / IG 28초
- **축**: 1 + 2 — The Real Korea + Lost in Translation
- **콘셉트**: 6살 국악 수련 첫날, 악기 대신 절부터 가르친 스승 이야기
- **톤**: 수련자형 ("나는 이렇게 배웠다") — 가장 개인적이고 깊은 편
- **핵심 대사**: "오늘은 소리가 안 나올 거야" (선생님 한국어 원문)
- **캐치프레이즈**: "Koreans read your bow before they hear your words."
- **촬영**: 대표님 단독, BGM 없음 (정적이 음악)
- **특이사항**: 전환(conversion) 에피소드 — 팔로우 결정 포인트

### 005 — 5 Korean Cheat Codes — How to Make Any Elder Love You

- **포맷**: TT 20초 / IG 25초
- **축**: 1 — The Real Korea
- **콘셉트**: 004의 철학이 일상에서 작동하는 5가지 구체적 행동
- **톤**: 전문가형 ("3년 걸린 걸 20초에")
- **5가지 행동**: 두 손(제사) / 고개 돌림(수련) / 어른 먼저(진설) / 나이(존댓말) / 빈 잔(emptying yourself)
- **캐치프레이즈**: "A thousand years of love, disguised as manners."
- **촬영**: 대표님 단독, 세미포멀, 한식당/좌식
- **편집 패턴**: "표면(시연) → 깊이(뿌리)" 반복 전환
- **특이사항**: 확산(spread) 에피소드 — 가장 공유 가능

## 기획문서 원본 위치

기획문서 원본은 별도 프로젝트에 관리:

```
/Users/hoambaek/Documents/Cursor/cc/docs/
├── content-plans/
│   ├── content-plan-001-kdrama-hanbok.md
│   ├── content-plan-002-korean-bow.md
│   ├── content-plan-003-daechwita-taepyeongso.md
│   ├── content-plan-004-korean-etiquette-charm.md
│   ├── content-plan-005-korean-elder-cheatcodes.md
│   └── content-ideas-backlog.md
├── strategy/
├── calendar/
├── guides/
└── scripts/
```

기획문서 업데이트 시 → CXP 페이지에 수동 반영 필요.

## 디자인 시스템

- **색상**: 콘텐츠 플랜 = 골드(#C4A052), 전략 기획서 = 틸(#3D5A56)
- **컴포넌트**: CollapsibleSection (각 페이지 로컬 정의, 공유 컴포넌트 아님)
- **폰트**: Cormorant Garamond (제목), 시스템 폰트 (본문)
- **테마**: Deep Sea (bg-white/[0.02], border-white/[0.06])
- **Header 위치**: UAPS 다음

## 성과 측정 기준 요약

| 편 | 핵심 KPI | 조회수 목표 | 완주율 | 저장율 |
|---|---------|-----------|--------|--------|
| 001 | 댓글/반응 | 1,000+ | 40%+ | 15%+ |
| 002 | 저장/공유 | 2,000+ | 45%+ | 25%+ |
| 003 | **공유(Sends)** | **10,000+** | 40%+ | 20%+ |
| 004 | **저장/팔로우 전환** | 2,000+ | **55%+** | **35%+** |
| 005 | **공유/저장** | 5,000+ | **50%+** | **30%+** |

## 관련 문서

- [변경 이력](./CHANGELOG.md)
- [전략 기획서](/cxp/strategy) — 앱 내 페이지
- [아이디어 백로그](/cxp/ideas) — 앱 내 페이지
