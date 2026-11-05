---
name: Academic Continuity System
colors:
  surface: '#ffffff'
  surface-dim: '#e5e5e5'
  surface-bright: '#ffffff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f7f7'
  surface-container: '#f2f2f2'
  surface-container-high: '#eaeaea'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1e1e1e'
  on-surface-variant: '#5c5c5c'
  inverse-surface: '#222222'
  inverse-on-surface: '#f5f5f5'
  outline: '#9b9b9b'
  outline-variant: '#e5e5e5'
  surface-tint: '#d80c18'
  primary: '#d80c18'
  on-primary: '#ffffff'
  primary-container: '#fdecee'
  on-primary-container: '#d80c18'
  inverse-primary: '#ff8a90'
  secondary: '#006c4a'
  on-secondary: '#ffffff'
  secondary-container: '#82f5c1'
  on-secondary-container: '#00714e'
  tertiary: '#4c2e00'
  on-tertiary: '#ffffff'
  tertiary-container: '#6b4200'
  on-tertiary-container: '#ffa929'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#fdecee'
  primary-fixed-dim: '#f8b9bd'
  on-primary-fixed: '#5c0006'
  on-primary-fixed-variant: '#a3000c'
  secondary-fixed: '#85f8c4'
  secondary-fixed-dim: '#68dba9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#ffffff'
  on-background: '#1e1e1e'
  surface-variant: '#eeeeee'
typography:
  headline-xl:
    fontFamily: Pretendard
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
  headline-lg:
    fontFamily: Pretendard
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Pretendard
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Pretendard
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Pretendard
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Pretendard
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Pretendard
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Pretendard
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 2px
  DEFAULT: 4px
  md: 6px
  lg: 8px
  xl: 12px
  full: 9999px
spacing:
  unit: 8px
  container-max-width: 1200px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  section-gap: 64px
---

> **2026-11 리디자인:** 마켓앱 스타일로 변경 — 흰 배경, 빨간 포인트(#d80c18), 그림자 대신 1px 회색 선,
> 작은 모서리(4–8px), 2열(모바일)~5열 사진 격자 목록, 둥근 아이콘 카테고리 메뉴. 아래 본문 중 색·그림자·모서리
> 설명은 이전 디자인 기준이며, 값은 위 프론트매터와 `tailwind.config.js`가 기준입니다.

## Brand & Style

The design system is built on the pillars of **trust, clarity, and helpfulness**. As a school service, it must bridge the gap between institutional authority and student-friendly accessibility. The visual language adopts a **Corporate Modern** style with a focus on high legibility and organized information hierarchy.

The brand personality is "The Helpful Librarian": organized, dependable, and approachable. It avoids visual clutter to reduce the cognitive load on users who may be stressed about a lost item. The use of generous whitespace and a structured grid ensures that the service feels like an integrated part of the educational environment.

## Colors

This design system utilizes a professional palette rooted in educational tradition but executed with modern vibrancy.

- **Primary (Oxford Blue):** Used for navigation, primary actions, and brand-level elements. It communicates stability and trust.
- **Secondary (Academy Green):** Used specifically for "Found" items and success states, representing a positive resolution.
- **Tertiary (Amber):** Used for "Lost" status or urgent alerts to draw attention without causing alarm.
- **Neutral (Slate):** A range of greys used for text, borders, and background surfaces to maintain a clean, organized aesthetic.
- **Background:** A very light grey (#F8FAFC) is used for the main canvas to reduce glare, with pure white (#FFFFFF) reserved for cards and input containers to create depth.

## Typography

The system uses **Pretendard** for every text role, since it covers both Hangul and Latin, and **IBM Plex Sans KR** (bold) as a display face for the site name and the home hero heading. 

Pretendard keeps Korean labels and lists even and easy to scan on every device, instead of falling back to whatever system font happens to be installed. IBM Plex Sans KR in bold gives the site name a sturdy, slightly technical character; use it only for those two brand moments. 

**Usage Guidelines:**
- Use `headline-xl` only for main landing sections or hero headers.
- `label-md` should be used for all button text and form field headers to ensure they are prominent.
- Maintain high contrast (minimum 4.5:1) for all body text against background surfaces.

## Layout & Spacing

The design system follows a **Fluid Grid** model with fixed maximum widths for readability.

- **Desktop (12 columns):** Elements should align to a 12-column grid. Large cards (like item listings) should span 3 or 4 columns.
- **Mobile (4 columns):** Transition to a single-column stack for forms and a 2-column masonry or list view for found items.
- **Spacing Rhythm:** Based on an 8px base unit. Component padding should generally be 16px (2 units) or 24px (3 units) to ensure enough "breathability" for touch targets.
- **Vertical Flow:** Following the provided sketch, the interface should use distinct vertical sections with `section-gap` spacing to separate the report/search functions from the feed.

## Elevation & Depth

This design system uses **Tonal Layers** supplemented by **Ambient Shadows** to create a clean, physical sense of hierarchy.

- **Level 0 (Base):** The #F8FAFC background.
- **Level 1 (Cards/Containers):** Pure white surfaces with a very soft, diffused shadow (0px 4px 20px rgba(0, 0, 0, 0.05)). This is used for the item cards and form blocks seen in the sketch.
- **Level 2 (Active/Floating):** Used for dropdowns and modals. These use a more pronounced shadow (0px 10px 30px rgba(0, 0, 0, 0.1)) to indicate they are closer to the user.
- **Interactive States:** On hover, cards should slightly lift (move -4px on Y-axis) and the shadow intensity should increase to provide tactile feedback.

## Shapes

The shape language is **Rounded**, using a 0.5rem (8px) base radius. This strikes the balance between the precision of an educational tool and the friendliness of a student service.

- **Standard (8px):** Applied to input fields, small buttons, and thumbnails.
- **Large (16px):** Applied to item cards and main container sections.
- **Pill (Full):** Used exclusively for status tags (e.g., "Category" chips or "Found" badges) to distinguish them from actionable buttons.

## Components

### Buttons
- **Primary:** Filled Oxford Blue with white text. High emphasis for "Report Found Item" or "Submit".
- **Secondary:** Outlined with Oxford Blue. Used for "Search" or "Filter" actions.
- **Tertiary:** Text-only for less critical navigation.

### Input Fields
Following the sketch's form structure:
- **Text Inputs:** Use a 1px border (#CBD5E1) that thickens and turns Oxford Blue on focus. Labels sit clearly above the input.
- **Photo Upload:** A dashed-border container with a centered icon, encouraging students to take a clear picture of the found item.

### Cards
Item cards are the core of the "Browse" experience.
- Top section: High-quality image with a 1:1 aspect ratio.
- Bottom section: Item name in `label-md`, followed by location and date in `label-sm`.
- A small status chip (Pill-shaped) should sit in the top-right corner of the image.

### Search & Filter
As indicated in the sketch, the search bar should be prominent with category chips (Electronics, Clothing, Books, etc.) immediately below it for quick one-tap filtering.