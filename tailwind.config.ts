import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: '1.25rem', screens: { '2xl': '1320px' } },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        cyber: {
          teal: '#22d3ee',
          lime: '#a3e635',
          amber: '#f59e0b',
          red: '#ef4444',
          violet: '#8b5cf6',
          blue: '#3b82f6',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: { xl: '0.9rem', '2xl': '1.2rem' },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        glow: { '0%, 100%': { boxShadow: '0 0 0 0 rgba(245,158,11,.0)' }, '50%': { boxShadow: '0 0 18px 2px rgba(245,158,11,.35)' } },
        scan: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100%)' } },
      },
      animation: {
        'fade-in': 'fade-in .4s ease-out both',
        glow: 'glow 1.6s ease-in-out infinite',
        scan: 'scan 3s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
