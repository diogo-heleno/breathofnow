import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary - Warm Sage Green (calm, breath, nature)
        primary: {
          50: '#f4f7f4',
          100: '#e6ece6',
          200: '#cdd9cd',
          300: '#a8bea8',
          400: '#7d9c7d',
          500: '#5a7d5a',
          600: '#466346',
          700: '#3a513a',
          800: '#314231',
          900: '#29372a',
          950: '#131d14',
        },
        // Secondary - Warm Sand (earthiness, grounding)
        secondary: {
          50: '#faf8f5',
          100: '#f3efe8',
          200: '#e6ddd0',
          300: '#d4c5af',
          400: '#c0a88c',
          500: '#b19373',
          600: '#a48164',
          700: '#896a54',
          800: '#705748',
          900: '#5c493d',
          950: '#312520',
        },
        // Accent - Soft Terracotta (warmth, energy)
        accent: {
          50: '#fdf6f4',
          100: '#fceae5',
          200: '#f9d8cf',
          300: '#f4bdad',
          400: '#eb9680',
          500: '#df7459',
          600: '#cb5a3e',
          700: '#aa4831',
          800: '#8d3e2c',
          900: '#75382a',
          950: '#3f1a12',
        },
        // Neutral - Warm Grays
        neutral: {
          50: '#fafaf9',
          100: '#f5f4f2',
          200: '#e8e6e3',
          300: '#d6d3ce',
          400: '#b8b4ad',
          500: '#9a958d',
          600: '#7d7871',
          700: '#68635d',
          800: '#57534e',
          900: '#4a4744',
          950: '#282624',
        },
        // Semantic colors
        success: {
          light: '#86efac',
          DEFAULT: '#22c55e',
          dark: '#15803d',
        },
        warning: {
          light: '#fde047',
          DEFAULT: '#eab308',
          dark: '#a16207',
        },
        error: {
          light: '#fca5a5',
          DEFAULT: '#ef4444',
          dark: '#b91c1c',
        },
        info: {
          light: '#93c5fd',
          DEFAULT: '#3b82f6',
          dark: '#1d4ed8',
        },
      },
      fontFamily: {
        // Display - Elegant serif for headings
        display: ['Fraunces', 'Georgia', 'serif'],
        // Body - Clean, readable sans-serif
        body: ['Source Sans 3', 'system-ui', 'sans-serif'],
        // Mono - For code/numbers
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display-2xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg': ['3rem', { lineHeight: '1.15', letterSpacing: '-0.015em' }],
        'display-md': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-sm': ['1.875rem', { lineHeight: '1.25' }],
        'display-xs': ['1.5rem', { lineHeight: '1.3' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'soft-sm': '0 2px 8px -2px rgba(0, 0, 0, 0.08)',
        'soft': '0 4px 16px -4px rgba(0, 0, 0, 0.1)',
        'soft-lg': '0 8px 32px -8px rgba(0, 0, 0, 0.12)',
        'soft-xl': '0 16px 48px -12px rgba(0, 0, 0, 0.15)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'glow': '0 0 24px -4px rgba(90, 125, 90, 0.3)',
        'glow-accent': '0 0 24px -4px rgba(223, 116, 89, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.4s ease-out forwards',
        'slide-in-right': 'slideInRight 0.5s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.5s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'noise': "url('/noise.svg')",
      },
    },
  },
  plugins: [],
}

export default config
