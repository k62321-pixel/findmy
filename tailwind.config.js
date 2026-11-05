/**
 * Tailwind theme generated from DESIGN.md (Academic Continuity System).
 * Every token here maps 1:1 to the frontmatter of DESIGN.md — keep them in sync.
 */
// Pretendard covers Hangul and Latin, so one family serves every text role.
const SANS = ['"Pretendard Variable"', 'Pretendard', 'system-ui', 'sans-serif']

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Marketplace look: pure white canvas, neutral greys, one red accent.
        surface: '#ffffff',
        'surface-dim': '#e5e5e5',
        'surface-bright': '#ffffff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f7f7f7',
        'surface-container': '#f2f2f2',
        'surface-container-high': '#eaeaea',
        'surface-container-highest': '#e2e2e2',
        'on-surface': '#1e1e1e',
        'on-surface-variant': '#5c5c5c',
        'inverse-surface': '#222222',
        'inverse-on-surface': '#f5f5f5',
        outline: '#9b9b9b',
        'outline-variant': '#e5e5e5',
        'surface-tint': '#d80c18',
        primary: '#d80c18',
        'on-primary': '#ffffff',
        'primary-container': '#fdecee',
        'on-primary-container': '#d80c18',
        'inverse-primary': '#ff8a90',
        secondary: '#006c4a',
        'on-secondary': '#ffffff',
        'secondary-container': '#82f5c1',
        'on-secondary-container': '#00714e',
        tertiary: '#4c2e00',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#6b4200',
        'on-tertiary-container': '#ffa929',
        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
        'primary-fixed': '#fdecee',
        'primary-fixed-dim': '#f8b9bd',
        'on-primary-fixed': '#5c0006',
        'on-primary-fixed-variant': '#a3000c',
        'secondary-fixed': '#85f8c4',
        'secondary-fixed-dim': '#68dba9',
        'on-secondary-fixed': '#002114',
        'on-secondary-fixed-variant': '#005137',
        'tertiary-fixed': '#ffddb8',
        'tertiary-fixed-dim': '#ffb95f',
        'on-tertiary-fixed': '#2a1700',
        'on-tertiary-fixed-variant': '#653e00',
        background: '#ffffff',
        'on-background': '#1e1e1e',
        'surface-variant': '#eeeeee',
      },
      fontFamily: {
        // Korean display face for the site name and hero heading.
        display: ['"IBM Plex Sans KR"', ...SANS],
        'headline-xl': SANS,
        'headline-lg': SANS,
        'headline-lg-mobile': SANS,
        'headline-md': SANS,
        'body-lg': SANS,
        'body-md': SANS,
        'label-md': SANS,
        'label-sm': SANS,
      },
      fontSize: {
        'headline-xl': ['40px', { lineHeight: '48px', fontWeight: '800', letterSpacing: '-0.02em' }],
        'headline-lg': ['32px', { lineHeight: '40px', fontWeight: '700', letterSpacing: '-0.02em' }],
        'headline-lg-mobile': ['24px', { lineHeight: '32px', fontWeight: '700', letterSpacing: '-0.02em' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '700', letterSpacing: '-0.01em' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label-md': ['14px', { lineHeight: '20px', letterSpacing: '0.02em', fontWeight: '600' }],
        'label-sm': ['12px', { lineHeight: '16px', fontWeight: '500' }],
      },
      borderRadius: {
        // Tight corners — flat marketplace cards rather than soft bubbles.
        sm: '2px',
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        full: '9999px',
      },
      spacing: {
        unit: '8px',
        'container-max-width': '1200px',
        gutter: '24px',
        'margin-mobile': '16px',
        'margin-desktop': '48px',
        'section-gap': '64px',
      },
      maxWidth: {
        container: '1200px',
      },
      boxShadow: {
        // Elevation & Depth — DESIGN.md
        // Flat: cards and bars are separated by hairlines, not drop shadows.
        level1: '0 0 0 1px #eeeeee',
        'level1-hover': '0 0 0 1px #d5d5d5',
        level2: '0px 10px 30px rgba(0, 0, 0, 0.1)',
        bar: '0 1px 0 #eeeeee',
        'bar-top': '0 -1px 0 #eeeeee',
      },
    },
  },
  plugins: [],
}
