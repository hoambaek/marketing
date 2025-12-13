# Muse de Marée Design System

> Luxury Editorial Dark Theme - 해저 숙성 와인 브랜드의 프리미엄 디자인 시스템

이 문서는 Claude Code가 동일한 디자인 스타일을 다른 프로젝트에 적용할 수 있도록 작성된 가이드입니다.

---

## 목차

1. [디자인 철학](#1-디자인-철학)
2. [컬러 시스템](#2-컬러-시스템)
3. [타이포그래피](#3-타이포그래피)
4. [스페이싱 & 레이아웃](#4-스페이싱--레이아웃)
5. [보더 & 라운드](#5-보더--라운드)
6. [그림자 & 글로우 효과](#6-그림자--글로우-효과)
7. [애니메이션 패턴](#7-애니메이션-패턴)
8. [컴포넌트 패턴](#8-컴포넌트-패턴)
9. [배경 효과](#9-배경-효과)
10. [글래스모피즘](#10-글래스모피즘)
11. [반응형 디자인](#11-반응형-디자인)
12. [코드 스니펫](#12-코드-스니펫)

---

## 1. 디자인 철학

### 핵심 컨셉
- **Luxury Editorial Dark Theme**: 프리미엄 에디토리얼 다크 테마
- **Deep Oceanic Aesthetic**: 심해의 신비로운 분위기
- **Glass Morphism**: 현대적인 유리 효과
- **Subtle Ambient Glow**: 은은한 배경 조명
- **Elegant Micro-interactions**: 세련된 마이크로 인터랙션

### 디자인 원칙
1. **Sophistication over Simplicity**: 단순함보다 세련됨
2. **Depth through Layers**: 레이어를 통한 깊이감
3. **Smooth & Intentional Motion**: 의도된 부드러운 움직임
4. **High Contrast Readability**: 높은 대비의 가독성
5. **Premium Touch**: 프리미엄 터치감

---

## 2. 컬러 시스템

### 2.1 배경 컬러 (Deep Sea Palette)

```css
/* 메인 배경 - 깊은 바다 */
--bg-primary: #0a0f1a;      /* 가장 어두운 배경 */
--bg-secondary: #0d1525;    /* 보조 배경 */
--bg-tertiary: #060a12;     /* 최고 어두운 변형 */

/* Tailwind 사용 예시 */
bg-[#0a0f1a]
bg-[#0d1525]
```

### 2.2 브랜드 액센트 컬러 (Rose Gold & Champagne)

```css
/* 프라이머리 액센트 - 로즈골드 */
--accent-primary: #b7916e;      /* 메인 인터랙티브 색상 */
--accent-light: #d4c4a8;        /* 밝은 변형 */
--accent-dark: #96724f;         /* 어두운 변형 */
--accent-champagne: #ccb69a;    /* 샴페인 골드 */

/* Tailwind 사용 예시 */
text-[#b7916e]
bg-[#b7916e]
border-[#b7916e]
```

### 2.3 텍스트 컬러

```css
/* 텍스트 계층 */
--text-primary: rgba(255, 255, 255, 0.95);    /* 제목 */
--text-secondary: rgba(255, 255, 255, 0.80);  /* 본문 */
--text-tertiary: rgba(255, 255, 255, 0.60);   /* 보조 텍스트 */
--text-muted: rgba(255, 255, 255, 0.40);      /* 흐린 텍스트 */
--text-subtle: rgba(255, 255, 255, 0.30);     /* 매우 흐린 텍스트 */

/* Tailwind 사용 예시 */
text-white/95
text-white/80
text-white/60
text-white/40
text-white/30
```

### 2.4 의미론적 컬러

```css
/* 상태 표시 */
--success: #10B981;    /* Emerald - 성공/완료 */
--warning: #F59E0B;    /* Amber - 경고/진행중 */
--error: #EF4444;      /* Red - 에러/긴급 */
--info: #3B82F6;       /* Blue - 정보 */

/* Tailwind 예시 */
text-emerald-400
text-amber-400
text-red-400
text-blue-400
```

### 2.5 Phase/카테고리 컬러

```javascript
// 프로젝트 단계별 컬러
const phaseColors = {
  1: { primary: '#3B82F6', gradient: 'from-blue-500/20 to-blue-600/5' },
  2: { primary: '#10B981', gradient: 'from-emerald-500/20 to-emerald-600/5' },
  3: { primary: '#F59E0B', gradient: 'from-amber-500/20 to-amber-600/5' },
  4: { primary: '#EC4899', gradient: 'from-rose-500/20 to-rose-600/5' },
  5: { primary: '#8B7355', gradient: 'from-amber-700/20 to-amber-800/5' },
};

// 카테고리 배지 컬러
const categoryColors = {
  operation: 'bg-blue-500/20 text-blue-400',
  marketing: 'bg-violet-500/20 text-violet-400',
  design: 'bg-pink-500/20 text-pink-400',
  filming: 'bg-amber-500/20 text-amber-400',
  pr: 'bg-emerald-500/20 text-emerald-400',
  b2b: 'bg-indigo-500/20 text-indigo-400',
};
```

### 2.6 그라데이션 패턴

```css
/* 텍스트 그라데이션 */
.text-gradient {
  background: linear-gradient(135deg, #b7916e 0%, #d4c4a8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Tailwind 예시 */
className="text-transparent bg-clip-text bg-gradient-to-r from-[#b7916e] via-[#d4c4a8] to-[#b7916e]"

/* 버튼 그라데이션 */
background: linear-gradient(135deg, #b7916e 0%, #9a754b 100%);
```

---

## 3. 타이포그래피

### 3.1 폰트 패밀리

```css
/* 디스플레이 폰트 - 제목용 세리프 */
--font-display: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;

/* 에디토리얼 폰트 - 악센트 텍스트 */
--font-editorial: 'Instrument Serif', Georgia, serif;

/* 본문 폰트 - 한글 최적화 산세리프 */
--font-body: 'Pretendard Variable', -apple-system, BlinkMacSystemFont, sans-serif;

/* 고정폭 폰트 */
--font-mono: 'SF Mono', Monaco, 'Cascadia Code', monospace;
```

### 3.2 Next.js 폰트 설정

```typescript
// src/lib/fonts/index.ts
import { Cormorant_Garamond, Instrument_Serif } from 'next/font/google';
import localFont from 'next/font/local';

export const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

export const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-instrument',
  display: 'swap',
});

export const pretendard = localFont({
  src: './PretendardVariable.woff2',
  variable: '--font-pretendard',
  display: 'swap',
});
```

### 3.3 타이포그래피 스케일

```css
/* 제목 스케일 */
h1: text-3xl sm:text-5xl lg:text-6xl   /* 1.875rem → 3rem → 3.75rem */
h2: text-2xl sm:text-3xl               /* 1.5rem → 1.875rem */
h3: text-xl sm:text-2xl                /* 1.25rem → 1.5rem */
h4: text-lg sm:text-xl                 /* 1.125rem → 1.25rem */

/* 본문 스케일 */
body-lg: text-base sm:text-lg          /* 1rem → 1.125rem */
body: text-sm sm:text-base             /* 0.875rem → 1rem */
small: text-xs sm:text-sm              /* 0.75rem → 0.875rem */
tiny: text-[10px] sm:text-xs           /* 10px → 0.75rem */
```

### 3.4 제목 스타일링

```jsx
// Hero 제목 패턴
<h1
  className="text-3xl sm:text-5xl lg:text-6xl text-white/95 mb-2 sm:mb-6 leading-[1.1] tracking-tight"
  style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
>
  <span className="sm:block inline">Main </span>
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b7916e] via-[#d4c4a8] to-[#b7916e]">
    Title
  </span>
</h1>

// 섹션 제목 패턴
<h2
  className="text-xl sm:text-2xl text-white/90"
  style={{ fontFamily: "var(--font-cormorant), serif" }}
>
  Section Title
</h2>
```

### 3.5 서브타이틀/라벨

```jsx
// 영문 트래킹 라벨
<p className="text-[#b7916e] text-[10px] sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-2 sm:mb-4 font-light">
  Project Monitoring
</p>

// 보조 설명
<p className="text-white/40 text-lg max-w-md font-light leading-relaxed">
  프로젝트 설명 텍스트
</p>
```

---

## 4. 스페이싱 & 레이아웃

### 4.1 기본 스페이싱 단위

```css
/* 기본 단위: 4px (Tailwind default) */
spacing-1: 4px
spacing-2: 8px
spacing-3: 12px
spacing-4: 16px
spacing-5: 20px
spacing-6: 24px
spacing-8: 32px
spacing-10: 40px
spacing-12: 48px
spacing-16: 64px
spacing-20: 80px
```

### 4.2 컨테이너 패턴

```jsx
// 메인 컨테이너
<div className="max-w-5xl mx-auto">
  {/* 콘텐츠 */}
</div>

// 넓은 컨테이너
<div className="max-w-7xl mx-auto">
  {/* 콘텐츠 */}
</div>

// 좁은 컨테이너
<div className="max-w-4xl mx-auto">
  {/* 콘텐츠 */}
</div>
```

### 4.3 섹션 패딩 패턴

```jsx
// Hero 섹션
<section className="relative pt-8 sm:pt-16 pb-6 sm:pb-12 px-4 sm:px-6 lg:px-12">

// 일반 섹션
<section className="relative py-6 sm:py-8 px-4 sm:px-6 lg:px-12">

// 컴팩트 섹션
<section className="relative py-3 sm:py-4 px-4 sm:px-6 lg:px-12">
```

### 4.4 Grid 시스템

```jsx
// 2열 → 4열 그리드
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

// 1열 → 2열 그리드
<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">

// 1열 → 3열 그리드
<div className="grid lg:grid-cols-3 gap-6">

// 3열 고정 그리드
<div className="grid grid-cols-3 gap-2">
```

### 4.5 Gap 패턴

```css
/* 카드 간격 */
gap-3 sm:gap-4         /* 12px → 16px */
gap-4 sm:gap-6         /* 16px → 24px */

/* 아이템 간격 */
gap-2 sm:gap-3         /* 8px → 12px */
gap-1 sm:gap-2         /* 4px → 8px */

/* 인라인 간격 */
gap-1.5 sm:gap-2       /* 6px → 8px */
```

---

## 5. 보더 & 라운드

### 5.1 라운드 코너 스케일

```css
/* 라운드 스케일 */
--radius-sm: 8px;      /* rounded-lg */
--radius-md: 10px;     /* rounded-xl */
--radius-lg: 12px;     /* rounded-xl to rounded-2xl */
--radius-xl: 16px;     /* rounded-2xl */
--radius-2xl: 24px;    /* rounded-3xl */

/* 반응형 패턴 */
rounded-xl sm:rounded-2xl      /* 카드 */
rounded-lg sm:rounded-xl       /* 버튼, 인풋 */
rounded-md sm:rounded-lg       /* 작은 요소 */
rounded-full                   /* 원형 배지 */
```

### 5.2 보더 스타일

```css
/* 기본 보더 */
border border-white/[0.08]           /* 표준 */
border border-white/[0.06]           /* 서브틀 */
border border-white/[0.04]           /* 매우 서브틀 */

/* 호버 보더 */
hover:border-white/[0.12]            /* 호버 시 밝아짐 */

/* 액센트 보더 */
border border-[#b7916e]/20           /* 로즈골드 틴트 */
border border-[#b7916e]/50           /* 로즈골드 강조 */

/* 포커스 보더 */
focus:border-[#b7916e]/50
```

### 5.3 디바이더

```jsx
// 수평 디바이더
<div className="w-6 sm:w-8 h-px bg-white/20" />

// 수직 디바이더
<div className="w-px h-4 bg-white/10" />

// 그라데이션 디바이더
<div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

// 섹션 구분선
<div className="border-t border-white/[0.06]" />
```

---

## 6. 그림자 & 글로우 효과

### 6.1 박스 섀도우

```css
/* 기본 카드 섀도우 */
box-shadow:
  0 1px 2px rgba(0, 0, 0, 0.1),
  0 4px 16px rgba(0, 0, 0, 0.15);

/* 호버 시 상승 효과 */
box-shadow:
  0 2px 4px rgba(0, 0, 0, 0.1),
  0 8px 32px rgba(0, 0, 0, 0.2);

/* 모달 섀도우 */
shadow-2xl
```

### 6.2 글로우 효과

```css
/* Phase 기반 글로우 */
box-shadow: 0 0 20px rgba(59, 130, 246, 0.15);   /* Blue glow */
box-shadow: 0 0 20px rgba(16, 185, 129, 0.15);   /* Green glow */
box-shadow: 0 0 20px rgba(245, 158, 11, 0.15);   /* Amber glow */

/* 로즈골드 글로우 */
box-shadow: 0 0 20px rgba(183, 145, 110, 0.15);

/* 포커스 링 글로우 */
box-shadow: 0 0 0 3px rgba(183, 145, 110, 0.15);
```

### 6.3 앰비언트 글로우 (배경)

```jsx
// 페이지 배경 글로우 오브
<div className="absolute inset-0 -z-10">
  {/* Blue top glow */}
  <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/[0.03] rounded-full blur-[120px]" />

  {/* Rose gold right glow */}
  <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-[#b7916e]/[0.03] rounded-full blur-[100px]" />

  {/* Green bottom-left glow */}
  <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/[0.02] rounded-full blur-[80px]" />
</div>
```

---

## 7. 애니메이션 패턴

### 7.1 Framer Motion Variants

```typescript
// 컨테이너 스태거 애니메이션
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

// 아이템 페이드인 업
const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1], // Custom easing
    },
  },
};

// 카드 호버
const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.02, y: -2, transition: { duration: 0.3 } },
};
```

### 7.2 단일 요소 애니메이션

```jsx
// 페이드인 + 슬라이드 업
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8 }}
>

// 딜레이 있는 애니메이션
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8, delay: 0.2 }}
>

// 스케일 애니메이션 (장식 라인)
<motion.div
  initial={{ scaleX: 0 }}
  animate={{ scaleX: 1 }}
  transition={{ duration: 1.2, delay: 0.3 }}
  className="origin-left"
/>

// 슬라이드 인 (좌에서)
<motion.div
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.6, delay: 0.2 }}
>
```

### 7.3 리스트 아이템 애니메이션

```jsx
{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3, delay: index * 0.05 }}
  >
    {/* 아이템 내용 */}
  </motion.div>
))}
```

### 7.4 AnimatePresence (조건부 렌더링)

```jsx
<AnimatePresence>
  {isVisible && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      {/* 내용 */}
    </motion.div>
  )}
</AnimatePresence>
```

### 7.5 진행률 바 애니메이션

```jsx
<motion.div
  initial={{ width: 0 }}
  animate={{ width: `${percentage}%` }}
  transition={{ duration: 0.8, ease: 'easeOut' }}
  className="h-full rounded-full bg-gradient-to-r from-[#b7916e] to-[#d4c4a8]"
/>
```

### 7.6 Tailwind 트랜지션

```css
/* 기본 트랜지션 */
transition-all duration-300

/* 컬러 트랜지션 */
transition-colors duration-200

/* 트랜스폼 트랜지션 */
transition-transform duration-300

/* 커스텀 이징 */
transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
```

---

## 8. 컴포넌트 패턴

### 8.1 카드 컴포넌트

```jsx
// 기본 글래스 카드
<div className="relative rounded-2xl sm:rounded-3xl overflow-hidden">
  {/* 배경 레이어 */}
  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01]" />
  <div className="absolute inset-0 border border-white/[0.08] rounded-2xl sm:rounded-3xl" />

  {/* 호버 글로우 */}
  <div
    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
    style={{
      background: 'radial-gradient(circle at 50% 100%, rgba(183, 145, 110, 0.05), transparent 70%)',
    }}
  />

  {/* 콘텐츠 */}
  <div className="relative p-4 sm:p-6">
    {/* 카드 내용 */}
  </div>
</div>

// 카드 헤더
<div className="relative px-4 sm:px-6 py-4 sm:py-5 border-b border-white/[0.06] flex items-center gap-3 sm:gap-4">
  <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 border border-violet-500/20">
    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
  </div>
  <div>
    <h2 className="text-lg sm:text-xl text-white/90" style={{ fontFamily: "var(--font-cormorant), serif" }}>
      카드 제목
    </h2>
    <p className="text-xs sm:text-sm text-white/40">서브 텍스트</p>
  </div>
</div>
```

### 8.2 버튼 컴포넌트

```jsx
// 프라이머리 버튼
<button className="px-4 py-2 rounded-xl bg-[#b7916e] text-white font-medium hover:brightness-110 transition-all">
  버튼 텍스트
</button>

// 세컨더리 버튼 (아웃라인)
<button className="px-4 py-2 rounded-xl border border-white/[0.1] text-white/60 hover:bg-white/[0.05] transition-all">
  버튼 텍스트
</button>

// 고스트 버튼
<button className="p-2 rounded-xl hover:bg-white/[0.04] transition-colors">
  <Icon className="w-4 h-4 text-[#b7916e]" />
</button>

// 아이콘 + 텍스트 버튼
<button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#b7916e]/10 text-[#b7916e] hover:bg-[#b7916e]/20 transition-colors text-sm font-medium">
  <Plus className="w-4 h-4" />
  추가
</button>
```

### 8.3 인풋 컴포넌트

```jsx
// 기본 인풋
<input
  type="text"
  className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#b7916e]/30 focus:border-[#b7916e]/50 transition-all"
  placeholder="입력해주세요"
/>

// 셀렉트
<select className="px-3 sm:px-4 h-9 sm:h-10 bg-white/[0.04] border border-white/[0.08] rounded-lg sm:rounded-xl text-sm sm:text-base text-white/80 focus:outline-none focus:ring-2 focus:ring-[#b7916e]/30 focus:border-[#b7916e]/50 transition-all cursor-pointer appearance-none">
  <option value="" className="bg-[#0d1525]">옵션</option>
</select>

// 텍스트에리어
<textarea
  className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#b7916e]/30 resize-none"
  rows={4}
/>
```

### 8.4 배지 컴포넌트

```jsx
// 상태 배지
<span className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/20 text-emerald-400">
  완료
</span>

// 라운드 배지 (숫자)
<span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs bg-[#b7916e]/20 text-[#b7916e]">
  3/5
</span>

// 카테고리 배지
<span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px]" style={{ backgroundColor: '#b7916e15', color: '#b7916e' }}>
  카테고리
</span>
```

### 8.5 체크박스 컴포넌트

```jsx
// 커스텀 체크박스
<button
  onClick={() => toggleItem(id)}
  className={`flex-shrink-0 w-4 h-4 rounded border transition-all flex items-center justify-center ${
    isChecked
      ? 'border-transparent bg-[#b7916e]'
      : 'border-white/20 hover:border-white/40'
  }`}
>
  {isChecked && (
    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )}
</button>
```

### 8.6 모달 컴포넌트

```jsx
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-[#0d1525] border border-white/[0.1] rounded-3xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg text-white/90" style={{ fontFamily: "var(--font-cormorant), serif" }}>
            모달 제목
          </h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.05] transition-colors">
            <X className="w-5 h-5 text-white/40" />
          </button>
        </div>

        {/* 모달 콘텐츠 */}
        <div className="space-y-4">
          {/* 내용 */}
        </div>

        {/* 모달 푸터 */}
        <div className="flex gap-3 mt-6">
          <button className="flex-1 px-4 py-3 border border-white/[0.1] rounded-xl text-white/60 hover:bg-white/[0.05] transition-colors">
            취소
          </button>
          <button className="flex-1 px-4 py-3 rounded-xl bg-[#b7916e] text-white font-medium hover:brightness-110 transition-all">
            확인
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

### 8.7 푸터 컴포넌트

```jsx
<motion.footer className="relative py-12 sm:py-20 px-4 sm:px-6">
  <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 sm:gap-6">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    <div className="text-center">
      <span
        className="text-white/10 text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase"
        style={{ fontFamily: "var(--font-cormorant), serif" }}
      >
        Brand Name
      </span>
      <p className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/20 mt-1">
        Subtitle
      </p>
    </div>
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  </div>
</motion.footer>
```

---

## 9. 배경 효과

### 9.1 메인 페이지 배경

```jsx
{/* 전체 페이지 배경 */}
<div className="fixed inset-0 -z-10">
  {/* 그라데이션 베이스 */}
  <div className="absolute inset-0 bg-gradient-to-br from-[#070b12] via-[#0a1018] to-[#0d1525]" />

  {/* 장식 오브 */}
  <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#b7916e]/[0.03] rounded-full blur-[120px]" />
  <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/[0.02] rounded-full blur-[100px]" />

  {/* 그레인 텍스처 */}
  <div
    className="absolute inset-0 opacity-[0.02]"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
    }}
  />
</div>
```

### 9.2 앰비언트 글로우 배경 (Issues 페이지 스타일)

```jsx
<div className="fixed inset-0 -z-10">
  <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0d1525] to-[#0a0f1a]" />
  <div
    className="absolute inset-0 opacity-30"
    style={{
      backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(239, 68, 68, 0.12), transparent),
                        radial-gradient(ellipse 60% 40% at 80% 60%, rgba(183, 145, 110, 0.08), transparent),
                        radial-gradient(ellipse 50% 30% at 20% 80%, rgba(251, 191, 36, 0.06), transparent)`,
    }}
  />
</div>
```

---

## 10. 글래스모피즘

### 10.1 표준 글래스 효과

```css
/* 글래스 배경 */
background: rgba(255, 255, 255, 0.04);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.06);
```

### 10.2 Tailwind 적용

```jsx
// 글래스 카드
<div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl">

// 서브틀 글래스
<div className="bg-white/[0.02] backdrop-blur-md border border-white/[0.04] rounded-xl">

// 헤더 글래스
<header className="bg-[#0a0f1a]/80 backdrop-blur-lg border-b border-white/[0.06]">
```

---

## 11. 반응형 디자인

### 11.1 브레이크포인트

```css
/* Tailwind 기본 브레이크포인트 */
sm: 640px   /* 태블릿 */
md: 768px   /* 작은 데스크탑 */
lg: 1024px  /* 데스크탑 */
xl: 1280px  /* 큰 데스크탑 */
```

### 11.2 반응형 패턴

```jsx
// 텍스트 크기
className="text-sm sm:text-base lg:text-lg"

// 패딩
className="p-3 sm:p-4 lg:p-6"

// 갭
className="gap-2 sm:gap-3 lg:gap-4"

// 그리드 컬럼
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"

// 디스플레이 전환
className="hidden sm:block"  // 모바일에서 숨김
className="sm:hidden"        // 데스크탑에서 숨김

// 라운드
className="rounded-xl sm:rounded-2xl lg:rounded-3xl"
```

### 11.3 모바일 우선 컴팩트 패턴

```jsx
// Hero 섹션 - 모바일에서 컴팩트
<section className="relative pt-8 sm:pt-16 pb-6 sm:pb-12 px-4 sm:px-6 lg:px-12">

// 카드 - 모바일에서 작은 패딩
<div className="p-3 sm:p-4 lg:p-6">

// 폰트 - 모바일에서 작은 크기
<h1 className="text-3xl sm:text-5xl lg:text-6xl">
```

---

## 12. 코드 스니펫

### 12.1 globals.css 필수 설정

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* 배경 */
    --background: 222 47% 6%;
    --foreground: 210 40% 98%;

    /* 카드 */
    --card: 0 0% 100% / 0.04;
    --card-foreground: 210 40% 98%;

    /* 보더 */
    --border: 0 0% 100% / 0.08;

    /* 인풋 */
    --input: 0 0% 100% / 0.08;

    /* 뮤트 */
    --muted: 0 0% 100% / 0.05;
    --muted-foreground: 0 0% 100% / 0.5;

    /* 액센트 */
    --accent: 0 0% 100% / 0.08;
    --accent-foreground: 210 40% 98%;

    /* 라디우스 */
    --radius: 0.75rem;

    /* 브랜드 컬러 */
    --brand-primary: #b7916e;
    --brand-light: #d4c4a8;
    --brand-dark: #96724f;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

@layer utilities {
  .text-gradient {
    @apply bg-clip-text text-transparent;
    background-image: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-light) 100%);
  }

  .glass {
    @apply bg-white/[0.04] backdrop-blur-xl border border-white/[0.06];
  }

  .glass-subtle {
    @apply bg-white/[0.02] backdrop-blur-md border border-white/[0.04];
  }
}
```

### 12.2 tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        accent: 'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))',
        brand: {
          primary: '#b7916e',
          light: '#d4c4a8',
          dark: '#96724f',
        },
        'deep-sea': {
          900: '#060a12',
          800: '#0a0f1a',
          700: '#0d1525',
        },
      },
      fontFamily: {
        display: ['var(--font-cormorant)', 'Playfair Display', 'Georgia', 'serif'],
        editorial: ['var(--font-instrument)', 'Georgia', 'serif'],
        body: ['var(--font-pretendard)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(183, 145, 110, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(183, 145, 110, 0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

### 12.3 Layout 구조

```jsx
// src/app/layout.tsx
import { cormorant, instrumentSerif, pretendard } from '@/lib/fonts';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ko"
      className={`${cormorant.variable} ${instrumentSerif.variable} ${pretendard.variable}`}
    >
      <body className="min-h-screen bg-[#0a0f1a] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
```

---

## 빠른 참조 치트시트

### 컬러
- 배경: `bg-[#0a0f1a]`, `bg-[#0d1525]`
- 액센트: `text-[#b7916e]`, `bg-[#b7916e]`
- 텍스트: `text-white/95`, `text-white/80`, `text-white/60`, `text-white/40`
- 보더: `border-white/[0.08]`, `border-white/[0.06]`

### 글래스
- 카드: `bg-white/[0.04] border border-white/[0.08]`
- 서브틀: `bg-white/[0.02] border border-white/[0.06]`

### 라운드
- 큰 카드: `rounded-2xl sm:rounded-3xl`
- 작은 요소: `rounded-xl sm:rounded-2xl`
- 버튼/인풋: `rounded-lg sm:rounded-xl`

### 애니메이션
- 기본: `transition-all duration-300`
- 호버: `hover:bg-white/[0.04]`
- 스케일: `hover:scale-[1.02]`

### 스페이싱
- 섹션: `py-6 sm:py-8 px-4 sm:px-6 lg:px-12`
- 카드 패딩: `p-4 sm:p-6`
- 갭: `gap-3 sm:gap-4`

---

## 사용 방법

이 문서를 다른 프로젝트에 적용할 때:

1. **폰트 설정**: Cormorant Garamond + Pretendard 조합 사용
2. **컬러 설정**: Deep Sea 배경 + Rose Gold 액센트 적용
3. **globals.css**: CSS 변수 및 기본 스타일 복사
4. **tailwind.config**: 확장 설정 복사
5. **컴포넌트**: 카드, 버튼, 인풋 패턴 재사용

---

*이 디자인 시스템은 Muse de Marée 프로젝트를 기반으로 작성되었습니다.*
