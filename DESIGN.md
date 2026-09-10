---
name: Academic Continuity System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#444653'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#757684'
  outline-variant: '#c4c5d5'
  surface-tint: '#3755c3'
  primary: '#00288e'
  on-primary: '#ffffff'
  primary-container: '#1e40af'
  on-primary-container: '#a8b8ff'
  inverse-primary: '#b8c4ff'
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
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c4ff'
  on-primary-fixed: '#001453'
  on-primary-fixed-variant: '#173bab'
  secondary-fixed: '#85f8c4'
  secondary-fixed-dim: '#68dba9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max-width: 1200px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  section-gap: 64px
---

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

The system uses a pairing of **Manrope** for structural headers and **Plus Jakarta Sans** for body and interface elements. 

Manrope provides a modern, semi-geometric look for headlines that feels professional and technical. Plus Jakarta Sans offers softer terminals and a friendly "double-story" lowercase 'a', making long lists of items easier to scan and more welcoming for students. 

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