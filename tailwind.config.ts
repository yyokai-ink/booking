import type { Config } from 'tailwindcss';

// All colours come from CSS variables in src/styles/globals.css (the design tokens).
const hsl = (v: string) => `hsl(var(--${v}) / <alpha-value>)`;

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: { DEFAULT: '1rem', md: '1.5rem', lg: '2rem' }, screens: { '2xl': '1280px' } },
    extend: {
      colors: {
        bg: hsl('bg'), surface: hsl('surface'), muted: hsl('muted'), border: hsl('border'),
        fg: hsl('fg'), 'fg-muted': hsl('fg-muted'),
        brand: { DEFAULT: hsl('brand'), fg: hsl('brand-fg'), soft: hsl('brand-soft') },
        accent: { DEFAULT: hsl('accent'), fg: hsl('accent-fg') },
        success: hsl('success'), warning: hsl('warning'), danger: hsl('danger'), info: hsl('info'),
      },
      fontFamily: { sans: ['var(--font-sans)', 'system-ui', 'sans-serif'] },
      borderRadius: { sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.5rem' },
      boxShadow: {
        card: '0 1px 2px hsl(var(--fg) / 0.04), 0 8px 24px hsl(var(--fg) / 0.06)',
        pop: '0 12px 40px hsl(var(--fg) / 0.16)',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top, 0px)',
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
      },
      minHeight: { touch: '2.75rem' },
      minWidth: { touch: '2.75rem' },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'fade-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: { 'fade-up': 'fade-up .35s ease-out both' },
    },
  },
  plugins: [],
};
export default config;
