# Design System

## Deep Sea Theme
- **Background**: `#0a0b0d`
- **Cards**: `bg-white/[0.02]` ~ `bg-white/[0.04]`
- **Borders**: `border-white/[0.06]` ~ `border-white/[0.08]`
- **Rose Gold**: `#B76E79`
- **Champagne Gold**: `#C4A052`

## Fonts
- English: Cormorant Garamond
- Korean: Pretendard

## Hero Pattern (참고: `monthly-plan/page.tsx`)
- `pt-8 sm:pt-16 pb-6 sm:pb-8 px-4 sm:px-6 lg:px-12`
- Ambient: `fixed inset-0 -z-10`, radial-gradient
- Decorative line: `w-16 h-px bg-gradient-to-r from-[#b7916e]`
- Subtitle: `text-[#b7916e] text-[10px] sm:text-sm tracking-[0.2em] uppercase`
- h1: `text-3xl sm:text-5xl`, gradient text `from-[#b7916e] via-[#d4c4a8] to-[#b7916e]`

## Modal Pattern (참고: `uaps/page.tsx` ProductModal)
- Container: `bg-[#0d1421] border border-white/[0.08] rounded-2xl max-w-lg max-h-[85vh]`
- Header: 아이콘(rounded-xl) + 제목 + X 버튼, `border-b border-white/[0.06]`
- Input: `bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm`
- Label: `text-xs text-white/50 mb-1.5`
- 저장 버튼: `bg-gradient-to-r from-cyan-500/90 to-cyan-400/90 text-black font-medium rounded-xl`
